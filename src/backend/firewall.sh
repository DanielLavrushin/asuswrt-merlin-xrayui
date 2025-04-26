#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

tproxy_mark=0x10000
tproxy_mask=0x10000
tproxy_table=77

ipt() { # ipt <table> <args…>
    local tbl=$1
    shift
    apply_rule "$tbl" "$@" # uses IPT_LIST and skips v6/nat automatically
}

apply_rule() { # $@ = ipt args INCLUDING the -t TABLE part
    local tbl=$1
    shift
    for IPT in $IPT_LIST; do
        # skip nat for ip6tables
        [ "$IPT" = "ip6tables" ] && [ "$tbl" = "nat" ] && continue
        [ "$IPT" = "ip6tables" ] && echo "$*" | grep -q '\.' && continue
        $IPT -t "$tbl" "$@" 2>/dev/null
    done
}

is_ipv6_enabled() {
    # 1) kernel has it
    [ -f /proc/net/if_inet6 ] || return 1

    # 2) stack isn’t sysctl-disabled
    [ "$(cat /proc/sys/net/ipv6/conf/all/disable_ipv6)" = "0" ] || return 1

    # 3) ip6tables actually works (covers exotic builds)
    ip6tables -w -L -n >/dev/null 2>&1 || return 1

    return 0
}

configure_firewall() {
    log_info "Configuring Xray firewall rules..."
    update_loading_progress "Configuring Xray firewall rules..."

    load_xrayui_config

    # Check if 'xray' process is running
    local xray_pid=$(get_proc "xray")
    if [ -z "$xray_pid" ]; then
        log_warn "Xray process not found. Skipping client firewall configuration."
        return
    fi

    IPT_LIST="iptables"
    if is_ipv6_enabled; then
        IPT_LIST="$IPT_LIST ip6tables"
        log_debug "IPv6 enabled: yes"
    else
        log_debug "IPv6 enabled: no"
    fi

    # create / flush chains (filter + mangle for both families)
    for tbl in filter mangle; do
        ipt "$tbl" -F XRAYUI # flush; ignores “No chain” errors
        ipt "$tbl" -N XRAYUI # create if missing
    done

    # IPv4 nat chain
    iptables -t nat -N XRAYUI 2>/dev/null || true
    iptables -t nat -F XRAYUI 2>/dev/null

    ipt filter -C XRAYUI -j RETURN 2>/dev/null || ipt filter -A XRAYUI -j RETURN

    configure_firewall_server

    # Hook filter-table XRAYUI
    ipt filter -C INPUT -j XRAYUI 2>/dev/null || ipt filter -I INPUT 1 -j XRAYUI
    ipt filter -C FORWARD -j XRAYUI 2>/dev/null || ipt filter -I FORWARD 1 -j XRAYUI

    SERVER_IPS=$(jq -r '[.outbounds[] | select(.settings.vnext != null) | .settings.vnext[].address] | unique | join(" ")' "$XRAY_CONFIG_FILE")

    if jq -e '
  .inbounds[]
  | select(.protocol=="dokodemo-door")
  | (.listen // "")
  | startswith("127.")
' "$XRAY_CONFIG_FILE" >/dev/null; then
        set_route_localnet 1
    fi

    # Execute custom scripts for firewall rules before start
    local fw_before_script="$ADDON_USER_SCRIPTS_DIR/firewall_before_start"
    if [ -x "$fw_before_script" ]; then
        log_info "Executing custom  firewall before start script: $fw_before_script"
        "$fw_before_script" || log_error "Error executing $fw_before_script."
    fi

    configure_inbounds

    # Execute custom scripts for firewall rules after start
    local fw_after_script="$ADDON_USER_SCRIPTS_DIR/firewall_after_start"
    if [ -x "$fw_after_script" ]; then
        log_info "Executing custom  firewall after start script: $fw_after_script"
        "$fw_after_script" || log_error "Error executing $fw_after_script."
    fi

    log_ok "XRAYUI firewall rules applied successfully."
}

configure_inbounds() {
    log_info "Scanning for all dokodemo-door inbounds..."
    # Get all dokodemo-door inbounds in compact JSON format.
    local dokodemo_inbounds
    dokodemo_inbounds=$(jq -c '.inbounds[] | select(.protocol=="dokodemo-door")' "$XRAY_CONFIG_FILE")

    # Split into two groups based on the tproxy flag.
    local direct_inbounds tproxy_inbounds
    direct_inbounds=$(echo "$dokodemo_inbounds" | jq -c 'select((.streamSettings.sockopt.tproxy // "off") != "tproxy")') || log_debug "Failed to filter direct inbounds."
    tproxy_inbounds=$(echo "$dokodemo_inbounds" | jq -c 'select((.streamSettings.sockopt.tproxy // "off") == "tproxy")') || log_debug "Failed to filter tproxy inbounds."

    # Process all direct inbounds in one go.
    if [ -n "$direct_inbounds" ]; then
        configure_firewall_client "DIRECT" "$direct_inbounds"
    fi

    # Process all TPROXY inbounds in one go.
    if [ -n "$tproxy_inbounds" ]; then
        configure_firewall_client "TPROXY" "$tproxy_inbounds"
    fi
}

configure_firewall_server() {

    # Iterate over all inbounds
    jq -c '.inbounds[]' "$XRAY_CONFIG_FILE" | while IFS= read -r inbound; do
        local tag=$(echo "$inbound" | jq -r '.tag // empty')
        local protocol=$(echo "$inbound" | jq -r '.protocol // empty')
        local listen_addr=$(echo "$inbound" | jq -r '.listen // "0.0.0.0"')

        # Skip inbounds with tags starting with 'dokodemo-door' protocol
        if [ "$protocol" = "dokodemo-door" ]; then
            continue
        fi

        local port=$(echo "$inbound" | jq -r '.port // empty')
        if [ -z "$port" ]; then
            log_warn "No valid port found for inbound with tag $tag. Skipping."
            continue
        fi

        # Validate PORT_START and PORT_END
        if ! echo "$port" | grep -qE '^[0-9]+$'; then
            log_warn "Invalid port or range: $port. Skipping."
            continue
        fi

        # Add rules to the XRAYUI chain
        if [ "$listen_addr" != "0.0.0.0" ]; then
            local IPT_LISTEN_ADDR_FLAGS="-d $listen_addr"
        else
            local IPT_LISTEN_ADDR_FLAGS=""
        fi

        local IPT_LISTEN_FLAGS="$IPT_LISTEN_ADDR_FLAGS --dport $port -j ACCEPT"

        log_debug "Adding rules for inbound:$tag $listen_addr $port $IPT_LISTEN_FLAGS"
        ipt filter -I XRAYUI 1 -p tcp $IPT_LISTEN_FLAGS 2>/dev/null || log_debug "Failed to add TCP rule for port $port."
        ipt filter -I XRAYUI 1 -p udp $IPT_LISTEN_FLAGS 2>/dev/null || log_debug "Failed to add UDP rule for port $port."

        log_ok "Firewall SERVER rules applied for inbound:$tag $listen_addr $port"
    done
}

configure_firewall_client() {
    local inbounds inbound dokodemo_port protocols tcp_enabled udp_enabled
    local IPT_TYPE=$1
    inbounds=$2

    log_info "Configuring aggregated $IPT_TYPE rules for dokodemo-door inbounds..."

    local wan0_ip=$(nvram get wan0_realip_ip)
    local wan1_ip=$(nvram get wan1_realip_ip)

    if [ "$IPT_TYPE" = "DIRECT" ]; then
        local IPT_TABLE="nat"
    else
        local IPT_TABLE="mangle"
        # Ensure TPROXY module is loaded
        if ! lsmod | grep -q "xt_TPROXY"; then
            log_debug "xt_TPROXY kernel module not loaded. Attempting to load..."
            modprobe xt_TPROXY || {
                log_error "Failed to load xt_TPROXY kernel module. TPROXY might not work."
                return 1
            }
            sleep 1 # Allow some time for the module to load
        fi

        # Verify if the module is successfully loaded
        if ! lsmod | grep -q "xt_TPROXY"; then
            log_error "xt_TPROXY kernel module is still not loaded after attempt. Aborting."
            return 1
        else
            log_debug "xt_TPROXY kernel module successfully loaded."
        fi
    fi
    local IPT_BASE_FLAGS="$IPT_TABLE -A XRAYUI"

    ipt $IPT_TABLE -F XRAYUI 2>/dev/null || log_debug "Failed to flush $IPT_TABLE chain. Was it already empty?"
    ipt $IPT_TABLE -X XRAYUI 2>/dev/null || log_debug "Failed to remove $IPT_TABLE chain. Was it already empty?"
    ipt $IPT_TABLE -N XRAYUI 2>/dev/null || log_debug "Failed to create $IPT_TABLE chain."
    if [ "$IPT_TYPE" = "TPROXY" ]; then
        modprobe xt_socket 2>/dev/null
        ipt $IPT_TABLE -C XRAYUI -p udp -m socket --transparent -j RETURN 2>/dev/null ||
            ipt $IPT_TABLE -I XRAYUI 1 -p udp -m socket --transparent -j RETURN
    fi

    # --- Begin Exclusion Rules ---
    if [ "$IPT_TYPE" = "DIRECT" ]; then
        ipt $IPT_TABLE -I XRAYUI 1 -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN 2>/dev/null || log_error "Failed to add ESTABLISHED/RELATED bypass in $IPT_TABLE"
    fi

    local source_nets_v4 source_nets_v6 static_v4 static_v6
    source_nets_v4=$(ip -4 route show scope link | awk '$1 ~ /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168\.)/ {print $1}')

    source_nets_v6=""
    if is_ipv6_enabled; then
        source_nets_v6=$(ip -6 route show scope link | awk '$1 ~ /^(fc00:|fd..:|fe80:)/ {print $1}')
    fi

    source_nets="$source_nets_v4 $source_nets_v6"

    static_v4="169.254.0.0/16 100.64.0.0/10 172.16.0.0/12 10.0.0.0/8 127.0.0.0/8 192.168.0.0/16"
    static_v6="::1/128 fe80::/10 fc00::/7"
    for net in $static_v4 $static_v6; do
        ipt "$IPT_TABLE" -I XRAYUI 1 -d "$net" -j RETURN 2>/dev/null
    done

    update_loading_progress "Configuring firewall Exclusion rules..."
    log_info "Configuring firewall Exclusion rules..."

    # Exclude DHCP (UDP ports 67 and 68):
    ipt $IPT_BASE_FLAGS -p udp --dport 67 -j RETURN 2>/dev/null || log_error "Failed to add DHCP rule for UDP 67 in $IPT_TABLE."
    ipt $IPT_BASE_FLAGS -p udp --dport 68 -j RETURN 2>/dev/null || log_error "Failed to add DHCP rule for UDP 68 in $IPT_TABLE."

    # Exclude multicast addresses:
    ipt $IPT_BASE_FLAGS -d 224.0.0.0/4 -j RETURN 2>/dev/null || log_error "Failed to add multicast rule (224.0.0.0/4) in $IPT_TABLE."
    ipt $IPT_BASE_FLAGS -d 239.0.0.0/8 -j RETURN 2>/dev/null || log_error "Failed to add multicast rule (239.0.0.0/8) in $IPT_TABLE."

    # Exclude STUN (WebRTC)
    ipt $IPT_BASE_FLAGS -p udp -m u32 --u32 "32=0x2112A442" -j RETURN 2>/dev/null || log_error "Failed to add STUN in $IPT_TABLE."

    # Exclude traffic in DNAT state (covers inbound port-forwards):
    ipt $IPT_BASE_FLAGS -m conntrack --ctstate DNAT -j RETURN 2>/dev/null || log_error "Failed to add DNAT rule in $IPT_TABLE."

    # Exclude NTP (UDP port 123)
    ipt $IPT_BASE_FLAGS -p udp --dport 123 -j RETURN 2>/dev/null || log_error "Failed to add NTP rule in $IPT_TABLE."

    # Exclude traffic destined to the Xray server:
    [ -n "$SERVER_IPS" ] && for serverip in $SERVER_IPS; do
        log_info "Excluding Xray server IP from $IPT_TABLE."
        ipt $IPT_BASE_FLAGS -d "$serverip" -j RETURN 2>/dev/null || log_error "Failed to add rule to exclude Xray server IP in $IPT_TABLE."
    done

    # TPROXY excludes:
    if [ "$IPT_TYPE" = "TPROXY" ]; then

        local wan_ip=$(nvram get wan0_realip_ip)
        local via_routes=$(ip -4 route show | awk '$2=="via" && $1!="default" { print $1 }')
        local static_routes=$(nvram get lan_route)

        # unified exclusion: WAN IP, any “via” routes, and your nvram static list
        for dst in $wan_ip $via_routes $static_routes; do
            log_debug "TPROXY: excluding $dst from $IPT_TABLE"
            ipt $IPT_BASE_FLAGS -d "$dst" -j RETURN 2>/dev/null ||
                log_error "Failed to exclude $dst from $IPT_TABLE."
        done
    fi

    # Exclude server ports
    server_ports=$(jq -r '.inbounds[]
    | select(.protocol != "dokodemo-door")
    | .port' "$XRAY_CONFIG_FILE" | sort -u)

    if [ -n "$server_ports" ]; then
        tcp_ports=$(echo "$server_ports" | tr '\n' ',' | sed 's/,$//')
        for chunk in $(split_ports "$tcp_ports"); do
            ipt $IPT_BASE_FLAGS -p tcp -m multiport --dports "$chunk" -j RETURN
            ipt $IPT_BASE_FLAGS -p udp -m multiport --dports "$chunk" -j RETURN
        done

    fi

    echo "$inbounds" | while IFS= read -r inbound; do
        local dokodemo_port=$(echo "$inbound" | jq -r '.port // empty')
        local dokodemo_addr=$(echo "$inbound" | jq -r '.listen // "0.0.0.0"')
        local protocols=$(echo "$inbound" | jq -r '.settings.network // "tcp"')

        if [ -z "$dokodemo_port" ]; then
            log_warn "$IPT_TYPE inbound missing valid port. Skipping."
            continue
        fi

        if [ "$IPT_TYPE" = "TPROXY" ]; then
            if [ "$dokodemo_addr" != "0.0.0.0" ]; then
                local IPT_JOURNAL_FLAGS="-j TPROXY --on-port $dokodemo_port --on-ip $dokodemo_addr --tproxy-mark $tproxy_mark/$tproxy_mask"
            else
                local IPT_JOURNAL_FLAGS="-j TPROXY --on-port $dokodemo_port --tproxy-mark $tproxy_mark/$tproxy_mask"
            fi
            log_debug "TPROXY  inbound address: $dokodemo_addr:$dokodemo_port"
        else
            if [ "$dokodemo_addr" != "0.0.0.0" ]; then
                local IPT_JOURNAL_FLAGS="-j DNAT --to-destination $dokodemo_addr:$dokodemo_port"
                log_debug "DNAT inbound address: $dokodemo_addr:$dokodemo_port"
            else
                local IPT_JOURNAL_FLAGS="-j REDIRECT --to-ports $dokodemo_port"
                log_debug "REDIRECT inbound address: $dokodemo_addr:$dokodemo_port"
            fi
        fi

        # Determine protocol support
        echo "$protocols" | grep -iq "tcp" && tcp_enabled=yes || tcp_enabled=no
        echo "$protocols" | grep -iq "udp" && udp_enabled=yes || udp_enabled=no

        if [ "$tcp_enabled" = "no" ] && [ "$udp_enabled" = "no" ]; then
            log_warn "$IPT_TYPE inbound $dokodemo_addr:$dokodemo_port has no valid protocols (tcp/udp). Skipping."
            continue
        fi

        # Apply policy rules
        log_info "Apply $IPT_TYPE rules for inbound on port $dokodemo_port with protocols '$protocols'."

        jq -c '
  (.routing.policies // []) 
  | map(select(.enabled == true)) 
  as $enabled
  | (if ($enabled | length) == 0 
       then [{ mode: "redirect", enabled: true, name: "all traffic to xray" }] 
       else $enabled 
     end)
  | .[]
' "$XRAY_CONFIG_FILE" | while IFS= read -r policy; do
            policy_mode="$(echo "$policy" | jq -r '.mode // "bypass"')"
            tcpPorts="$(echo "$policy" | jq -r '.tcp // ""')"
            udpPorts="$(echo "$policy" | jq -r '.udp // ""')"
            macCount="$(echo "$policy" | jq '.mac | length')"
            log_debug "Policy mode: $policy_mode, TCP ports: $tcpPorts, UDP ports: $udpPorts, MAC count: $macCount"
            for source_net in $source_nets; do

                local IPT_SOURCE_FLAGS="$IPT_BASE_FLAGS -s $source_net"
                local IPT_TCP_PORTS_FLAGS="-p tcp -m multiport --dports $tcpPorts"
                local IPT_UDP_PORTS_FLAGS="-p udp -m multiport --dports $udpPorts"

                if [ "$macCount" -eq 0 ]; then
                    # No MAC array => apply policy to ALL devices
                    if [ "$policy_mode" = "bypass" ]; then
                        # Bypass all except the listed TCP/UDP ports -> those get redirected
                        log_debug "Ports policy BYPASS for ALL devices subnet: $source_net, redirect only TCP($tcpPorts), UDP($udpPorts)"
                        [ "$tcp_enabled" = "yes" ] && [ -n "$tcpPorts" ] && ipt $IPT_SOURCE_FLAGS $IPT_TCP_PORTS_FLAGS $IPT_JOURNAL_FLAGS 2>/dev/null
                        [ "$udp_enabled" = "yes" ] && [ -n "$udpPorts" ] && ipt $IPT_SOURCE_FLAGS $IPT_UDP_PORTS_FLAGS $IPT_JOURNAL_FLAGS 2>/dev/null
                    else
                        # Redirect mode = redirect everything except the listed TCP/UDP ports
                        log_debug "Ports policy REDIRECT for ALL devices subnet: $source_net, exclude TCP($tcpPorts), UDP($udpPorts)"

                        if [ "$tcp_enabled" = "yes" ]; then
                            [ -n "$tcpPorts" ] && ipt $IPT_SOURCE_FLAGS $IPT_TCP_PORTS_FLAGS -j RETURN 2>/dev/null
                            ipt $IPT_SOURCE_FLAGS -p tcp $IPT_JOURNAL_FLAGS 2>/dev/null
                        fi

                        if [ "$udp_enabled" = "yes" ]; then
                            [ -n "$udpPorts" ] && ipt $IPT_SOURCE_FLAGS $IPT_UDP_PORTS_FLAGS -j RETURN 2>/dev/null
                            ipt $IPT_SOURCE_FLAGS -p udp $IPT_JOURNAL_FLAGS 2>/dev/null
                        fi
                    fi
                else
                    # Read each MAC in the policy
                    echo "$policy" | jq -r '.mac[]?' | while IFS= read -r mac; do

                        local IPT_MAC_FLAGS="$IPT_SOURCE_FLAGS -m mac --mac-source $mac"

                        if [ "$policy_mode" = "bypass" ]; then
                            # Bypass all except the listed TCP/UDP ports -> those get redirected
                            log_debug "Ports policy BYPASS for $mac subnet: $source_net: REDIRECT only TCP($tcpPorts), UDP($udpPorts)"

                            if [ "$tcp_enabled" = "yes" ]; then
                                [ -n "$tcpPorts" ] && ipt $IPT_MAC_FLAGS $IPT_TCP_PORTS_FLAGS $IPT_JOURNAL_FLAGS 2>/dev/null
                            fi

                            if [ "$udp_enabled" = "yes" ]; then
                                [ -n "$udpPorts" ] && ipt $IPT_MAC_FLAGS $IPT_UDP_PORTS_FLAGS $IPT_JOURNAL_FLAGS 2>/dev/null
                            fi

                            # Default for bypass = return
                            if [ "$IPT_TYPE" = "DIRECT" ]; then
                                ipt $IPT_MAC_FLAGS -j RETURN 2>/dev/null
                            fi

                        else
                            # Redirect mode = redirect everything except the listed TCP/UDP ports
                            log_debug "Ports policy REDIRECT for $mac subnet: $source_net: exclude TCP($tcpPorts), UDP($udpPorts)"

                            if [ "$tcp_enabled" = "yes" ]; then
                                [ -n "$tcpPorts" ] && ipt $IPT_MAC_FLAGS $IPT_TCP_PORTS_FLAGS -j RETURN 2>/dev/null
                                ipt $IPT_MAC_FLAGS -p tcp $IPT_JOURNAL_FLAGS
                            fi

                            if [ "$udp_enabled" = "yes" ]; then
                                [ -n "$udpPorts" ] && ipt $IPT_MAC_FLAGS $IPT_UDP_PORTS_FLAGS -j RETURN 2>/dev/null
                                ipt $IPT_MAC_FLAGS -p udp $IPT_JOURNAL_FLAGS 2>/dev/null
                            fi
                        fi
                    done
                fi
            done
        done
    done
    # --- End Exclusion Rules ---

    # ipt $IPT_BASE_FLAGS -j LOG --log-prefix "XrayUI: " || log_error "Failed to add LOG rule in $IPT_TABLE chain."
    if [ "$IPT_TYPE" = "TPROXY" ]; then
        add_tproxy_routes "$tproxy_mark/$tproxy_mask" "$tproxy_table"
    else
        ipt $IPT_BASE_FLAGS -j RETURN 2>/dev/null || log_error "Failed to add default rule in $IPT_TABLE chain."
    fi

    # Hook chain into  PREROUTING:
    ipt $IPT_TABLE -C PREROUTING -j XRAYUI 2>/dev/null || ipt $IPT_TABLE -A PREROUTING -j XRAYUI

    log_ok "$IPT_TYPE rules applied."
}

cleanup_firewall() {

    log_info "Cleaning up Xray Client firewall rules..."
    update_loading_progress "Cleaning up Xray Client firewall rules..."

    load_xrayui_config

    IPT_LIST="iptables"
    is_ipv6_enabled && IPT_LIST="$IPT_LIST ip6tables"

    ipt filter -D INPUT -j XRAYUI 2>/dev/null || log_debug "Failed to remove XRAYUI chain from INPUT. Was it already empty?"
    ipt filter -D FORWARD -j XRAYUI 2>/dev/null || log_debug "Failed to remove XRAYUI chain from FORWARD. Was it already empty?"
    ipt nat -D PREROUTING -j XRAYUI 2>/dev/null || log_debug "Failed to remove NAT chain from PREROUTING. Was it already empty?"
    ipt mangle -D PREROUTING -j XRAYUI 2>/dev/null || log_debug "Failed to remove mangle chain from PREROUTING. Was it already empty?"

    ipt filter -F XRAYUI 2>/dev/null
    ipt filter -X XRAYUI 2>/dev/null

    ipt nat -F XRAYUI 2>/dev/null || log_debug "Failed to flush NAT chain. Was it already empty?"
    ipt nat -X XRAYUI 2>/dev/null || log_debug "Failed to remove NAT chain. Was it already empty?"
    ipt mangle -F XRAYUI 2>/dev/null || log_debug "Failed to flush mangle chain. Was it already empty?"
    ipt mangle -X XRAYUI 2>/dev/null || log_debug "Failed to remove mangle chain. Was it already empty?"

    # 0.46.: temportary workaround for iptables-legacy
    for fam in -4 -6; do
        [ "$fam" = "-6" ] && ! is_ipv6_enabled && continue
        for m in 0x10000/0x10000 0x8777 0x77; do
            while ip $fam rule show | grep -q "fwmark $tproxy_mark"; do
                ip $fam rule del fwmark $tproxy_mark/$tproxy_mask lookup $tproxy_table 2>/dev/null
            done
        done
    done

    # flush both possible tables
    for tbl in 77 8777; do
        ip route flush table "$tbl" 2>/dev/null
    done

    if jq -e '
  .inbounds[]
  | select(.protocol=="dokodemo-door")
  | (.listen // "")
  | startswith("127.")
' "$XRAY_CONFIG_FILE" >/dev/null; then
        set_route_localnet 0
    fi

    local script="$ADDON_USER_SCRIPTS_DIR/firewall_cleanup"
    if [ -x "$script" ]; then
        log_info "Executing user firewall script: $script"
        "$script" "$XRAY_CONFIG_FILE" || log_error "Error executing $script."
    fi

    log_info "Restarting firewall and DNS services..."
    update_loading_progress "Restarting firewall and DNS services..."

    { service restart_firewall >/dev/null 2>&1 && log_ok "Firewall service restarted successfully."; } ||
        log_error "Failed to restart firewall service."

    { service restart_dnsmasq >/dev/null 2>&1 && log_ok "DNS service restarted successfully."; } ||
        log_error "Failed to restart DNS service."

    log_ok "Xray Client firewall rules cleaned up successfully."
}

add_tproxy_routes() { # $1 = fwmark, $2 = table
    local mark="$1" tbl="$2" fam
    for fam in -4 -6; do
        # Skip IPv6 loop if the stack is disabled
        [ "$fam" = "-6" ] && ! is_ipv6_enabled && continue

        # 1. policy-rule
        ip $fam rule list | grep -q "fwmark $mark" ||
            ip $fam rule add fwmark $mark lookup "$tbl" priority 101 2>/dev/null || ip $fam rule replace fwmark $mark lookup "$tbl" priority 101

        # 2. ensure “local all-/::0” route in mark table
        local local_dst
        [ "$fam" = "-4" ] && local_dst="0.0.0.0/0" || local_dst="::/0"
        ip $fam route list table "$tbl" | grep -q "^local $local_dst" ||
            ip $fam route add local $local_dst dev lo table "$tbl" proto static exist 2>/dev/null || ip $fam route replace local $local_dst dev lo table "$tbl" proto static

        # 3. copy non-default routes from main
        ip $fam route show table main | grep -v '^default' | while read -r r; do
            ip $fam route add table "$tbl" $r 2>/dev/null || ip $fam route replace table "$tbl" $r 2>/dev/null
        done
    done
}

set_route_localnet() {
    local val="$1" # 0 = off, 1 = on
    local wan0="$(nvram get wan0_ifname)"
    local wan1="$(nvram get wan1_ifname)"
    local lan_if="$(nvram get lan_ifname)"

    local if_list="$lan_if wl0 wl1"

    # Add tun*/wg* interfaces created by VPN servers
    for itf in $(ip -o link show | awk -F': ' '{print $2}' | grep -E '^(tun[0-9]+|wg[0-9]+)$'); do
        if_list="$if_list $itf"
    done

    # Disable/enable global reverse-path filtering
    if [ "$val" = "1" ]; then
        echo 0 >/proc/sys/net/ipv4/conf/all/rp_filter
    else
        echo 1 >/proc/sys/net/ipv4/conf/all/rp_filter
    fi

    for itf in $if_list; do
        # Skip empty tokens or WAN phys-ifaces
        [ -z "$itf" ] && continue
        [ "$itf" = "$wan0" ] && continue
        [ -n "$wan1" ] && [ "$itf" = "$wan1" ] && continue

        echo "$val" >"/proc/sys/net/ipv4/conf/$itf/route_localnet" 2>/dev/null

        # Disable/restore RPF on this iface
        if [ "$val" = "1" ]; then
            # Disable strict reverse-path checks (needed for UDP TPROXY replies)
            echo 0 >"/proc/sys/net/ipv4/conf/$itf/rp_filter"
        else
            echo 1 >"/proc/sys/net/ipv4/conf/$itf/rp_filter"
        fi

        log_debug "route_localnet=$val, rp_filter=$(cat /proc/sys/net/ipv4/conf/$itf/rp_filter) on $itf"
    done
}

split_ports() {
    printf '%s\n' "$1" | tr ',' '\n' | xargs -n15 | sed 's/ /,/g'
}
