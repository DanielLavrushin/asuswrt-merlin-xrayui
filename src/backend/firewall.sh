#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

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

    # Create a custom chain for Xray rules
    iptables -F XRAYUI 2>/dev/null || log_debug "Failed to flush XRAYUI chain. It may not exist."
    iptables -X XRAYUI 2>/dev/null || log_debug "Failed to remove XRAYUI chain. It may not exist."
    iptables -N XRAYUI 2>/dev/null || log_debug "Failed to create XRAYUI chain. It may already exist."

    configure_firewall_server

    iptables -I INPUT -j XRAYUI || log_debug "Failed to insert XRAYUI chain into INPUT. It may already exist."
    iptables -I FORWARD -j XRAYUI || log_debug "Failed to insert XRAYUI chain into FORWARD. It may already exist."

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
        iptables -A XRAYUI -p tcp $IPT_LISTEN_FLAGS || log_debug "Failed to add TCP rule for port $port."
        iptables -A XRAYUI -p udp $IPT_LISTEN_FLAGS || log_debug "Failed to add UDP rule for port $port."

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
    local IPT_BASE_FLAGS="-t $IPT_TABLE -A XRAYUI"

    iptables -t $IPT_TABLE -F XRAYUI 2>/dev/null || log_debug "Failed to flush $IPT_TABLE chain. Was it already empty?"
    iptables -t $IPT_TABLE -X XRAYUI 2>/dev/null || log_debug "Failed to remove $IPT_TABLE chain. Was it already empty?"
    iptables -t $IPT_TABLE -N XRAYUI || log_debug "Failed to create $IPT_TABLE chain."

    # --- Begin Exclusion Rules ---
    if [ "$IPT_TYPE" = "DIRECT" ]; then
        iptables -t "$IPT_TABLE" -I XRAYUI 1 -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN || log_error "Failed to add ESTABLISHED/RELATED bypass in $IPT_TABLE"
    fi

    local source_nets
    source_nets=$(ip -4 route show | awk '/src/ && ($1 ~ /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168\.)/) { print $1 }' | grep -v '^$') || log_debug "Failed to get local networks."

    if [ -n "$source_nets" ]; then
        for source_net in $source_nets; do
            log_debug "Adding local subnet $source_net to $IPT_TABLE."
            # Exclude local subnets from interception
            iptables $IPT_BASE_FLAGS -d "$source_net" -j RETURN || log_debug "Failed to add local subnet $source_net rule in $IPT_TABLE."
        done
    fi

    update_loading_progress "Configuring firewall Exclusion rules..."
    log_info "Configuring firewall Exclusion rules..."

    # Always exclude loopback:
    iptables $IPT_BASE_FLAGS -d 127.0.0.1/32 -j RETURN || log_error "Failed to add loopback rule in $IPT_TABLE."

    # Exclude DHCP (UDP ports 67 and 68):
    iptables $IPT_BASE_FLAGS -p udp --dport 67 -j RETURN || log_error "Failed to add DHCP rule for UDP 67 in $IPT_TABLE."
    iptables $IPT_BASE_FLAGS -p udp --dport 68 -j RETURN || log_error "Failed to add DHCP rule for UDP 68 in $IPT_TABLE."

    # Exclude multicast addresses:
    iptables $IPT_BASE_FLAGS -d 224.0.0.0/4 -j RETURN || log_error "Failed to add multicast rule (224.0.0.0/4) in $IPT_TABLE."
    iptables $IPT_BASE_FLAGS -d 239.0.0.0/8 -j RETURN || log_error "Failed to add multicast rule (239.0.0.0/8) in $IPT_TABLE."

    # Exclude STUN (WebRTC)
    iptables $IPT_BASE_FLAGS -p udp -m u32 --u32 "32=0x2112A442" -j RETURN || log_error "Failed to add STUN in $IPT_TABLE."

    # Exclude traffic in DNAT state (covers inbound port-forwards):
    iptables $IPT_BASE_FLAGS -m conntrack --ctstate DNAT -j RETURN || log_error "Failed to add DNAT rule in $IPT_TABLE."

    # Exclude NTP (UDP port 123)
    iptables $IPT_BASE_FLAGS -p udp --dport 123 -j RETURN || log_error "Failed to add NTP rule in $IPT_TABLE."

    # Exclude the WireGuard subnet 10.122.0.0/24
    if [ "$(nvram get wgs_enable)" = "1" ]; then
        log_info "WireGuard enabled. Adding exclusion rules for WireGuard."

        local WGS_ADDR="$(nvram get wgs_addr)" # например 10.122.0.1/24
        local WGS_PORT="$(nvram get wgs_port)"

        local WGS_IP=$(printf '%s' "$WGS_ADDR" | cut -d'/' -f1)
        local oct1=$(printf '%s' "$WGS_IP" | cut -d'.' -f1)
        local oct2=$(printf '%s' "$WGS_IP" | cut -d'.' -f2)
        local oct3=$(printf '%s' "$WGS_IP" | cut -d'.' -f3)
        local WGS_SUBNET="$oct1.$oct2.$oct3.0/24"

        log_debug "WireGuard subnet: $WGS_SUBNET"
        [ -n "$wan0_ip" ] &&
            iptables -w $IPT_BASE_FLAGS -p udp -d "$wan0_ip" --dport "$WGS_PORT" -j RETURN || log_error "Failed to add WG rule for $wan0_ip"

        [ -n "$wan1_ip" ] &&
            iptables -w $IPT_BASE_FLAGS -p udp -d "$wan1_ip" --dport "$WGS_PORT" -j RETURN || log_error "Failed to add WG rule for $wan1_ip"

        # Exclude WireGuard subnet
        iptables -w $IPT_BASE_FLAGS -d "$WGS_SUBNET" -j RETURN || log_error "Failed to add WG subnet rule"
    else
        log_debug "WireGuard not enabled. Skipping WireGuard exclusion rules."
    fi

    # Exclude traffic destined to the Xray server:
    for serverip in $SERVER_IPS; do
        log_info "Excluding Xray server IP from $IPT_TABLE."
        iptables $IPT_BASE_FLAGS -d "$serverip" -j RETURN || log_error "Failed to add rule to exclude Xray server IP in $IPT_TABLE."
    done

    # TPROXY excludes:
    if [ "$IPT_TYPE" = "TPROXY" ]; then

        local wan_ip=$(nvram get wan0_realip_ip)
        local via_routes=$(ip -4 route show | awk '$2=="via" && $1!="default" { print $1 }')
        local static_routes=$(nvram get lan_route)

        if [ "$IPT_TYPE" = "TPROXY" ]; then
            # unified exclusion: WAN IP, any “via” routes, and your nvram static list
            for dst in $wan_ip $via_routes $static_routes; do
                log_debug "TPROXY: excluding $dst from $IPT_TABLE"
                iptables $IPT_BASE_FLAGS -d "$dst" -j RETURN ||
                    log_error "Failed to exclude $dst from $IPT_TABLE."
            done
        fi
    fi

    # Exclude server ports
    server_ports=$(jq -r '.inbounds[]
    | select(.protocol != "dokodemo-door")
    | .port' "$XRAY_CONFIG_FILE" | sort -u)

    if [ -n "$server_ports" ]; then
        tcp_ports=$(echo "$server_ports" | tr '\n' ',' | sed 's/,$//')
        iptables $IPT_BASE_FLAGS -p tcp -m multiport --dports "$tcp_ports" -j RETURN || log_error "Failed to add server port rule in $IPT_TABLE."
        iptables $IPT_BASE_FLAGS -p udp -m multiport --dports "$tcp_ports" -j RETURN || log_error "Failed to add server port rule in $IPT_TABLE."
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
                local IPT_JOURNAL_FLAGS="-j TPROXY --on-port $dokodemo_port --on-ip $dokodemo_addr --tproxy-mark 0x77"
            else
                local IPT_JOURNAL_FLAGS="-j TPROXY --on-port $dokodemo_port --tproxy-mark 0x77"
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
                        [ "$tcp_enabled" = "yes" ] && [ -n "$tcpPorts" ] && iptables $IPT_SOURCE_FLAGS $IPT_TCP_PORTS_FLAGS $IPT_JOURNAL_FLAGS
                        [ "$udp_enabled" = "yes" ] && [ -n "$udpPorts" ] && iptables $IPT_SOURCE_FLAGS $IPT_UDP_PORTS_FLAGS $IPT_JOURNAL_FLAGS
                    else
                        # Redirect mode = redirect everything except the listed TCP/UDP ports
                        log_debug "Ports policy REDIRECT for ALL devices subnet: $source_net, exclude TCP($tcpPorts), UDP($udpPorts)"

                        if [ "$tcp_enabled" = "yes" ]; then
                            [ -n "$tcpPorts" ] && iptables $IPT_SOURCE_FLAGS $IPT_TCP_PORTS_FLAGS -j RETURN
                            iptables $IPT_SOURCE_FLAGS -p tcp $IPT_JOURNAL_FLAGS
                        fi

                        if [ "$udp_enabled" = "yes" ]; then
                            [ -n "$udpPorts" ] && iptables $IPT_SOURCE_FLAGS $IPT_UDP_PORTS_FLAGS -j RETURN
                            iptables $IPT_SOURCE_FLAGS -p udp $IPT_JOURNAL_FLAGS
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
                                [ -n "$tcpPorts" ] && iptables $IPT_MAC_FLAGS $IPT_TCP_PORTS_FLAGS $IPT_JOURNAL_FLAGS
                            fi

                            if [ "$udp_enabled" = "yes" ]; then
                                [ -n "$udpPorts" ] && iptables $IPT_MAC_FLAGS $IPT_UDP_PORTS_FLAGS $IPT_JOURNAL_FLAGS
                            fi

                            # Default for bypass = return
                            if [ "$IPT_TYPE" = "DIRECT" ]; then
                                iptables $IPT_MAC_FLAGS -j RETURN
                            fi

                        else
                            # Redirect mode = redirect everything except the listed TCP/UDP ports
                            log_debug "Ports policy REDIRECT for $mac subnet: $source_net: exclude TCP($tcpPorts), UDP($udpPorts)"

                            if [ "$tcp_enabled" = "yes" ]; then
                                [ -n "$tcpPorts" ] && iptables $IPT_MAC_FLAGS $IPT_TCP_PORTS_FLAGS -j RETURN
                                iptables $IPT_MAC_FLAGS -p tcp $IPT_JOURNAL_FLAGS
                            fi

                            if [ "$udp_enabled" = "yes" ]; then
                                [ -n "$udpPorts" ] && iptables $IPT_MAC_FLAGS $IPT_UDP_PORTS_FLAGS -j RETURN
                                iptables $IPT_MAC_FLAGS -p udp $IPT_JOURNAL_FLAGS
                            fi
                        fi
                    done
                fi
            done
        done
    done
    # --- End Exclusion Rules ---

    # iptables $IPT_BASE_FLAGS -j LOG --log-prefix "XrayUI: " || log_error "Failed to add LOG rule in $IPT_TABLE chain."

    if [ "$IPT_TYPE" = "TPROXY" ]; then
        # Add rules to mark packets for TPROXY:
        ip rule list | grep -q "fwmark 0x77" ||
            ip rule add fwmark 0x77 lookup 77 priority 100 ||
            log_error "Failed to add fwmark rule."
        ip route list table 77 | grep -q '^local default' ||
            ip route add local default dev lo table 77 ||
            log_error "Failed to add local route for fwmark."
    else
        iptables $IPT_BASE_FLAGS -j RETURN || log_error "Failed to add default rule in $IPT_TABLE chain."
    fi

    # Hook chain into $IPT_TABLE PREROUTING:
    iptables -t $IPT_TABLE -C PREROUTING -j XRAYUI 2>/dev/null || iptables -t $IPT_TABLE -A PREROUTING -j XRAYUI

    log_ok "$IPT_TYPE rules applied."
}

cleanup_firewall() {

    log_info "Cleaning up Xray Client firewall rules..."
    update_loading_progress "Cleaning up Xray Client firewall rules..."

    load_xrayui_config

    iptables -F XRAYUI 2>/dev/null
    iptables -X XRAYUI 2>/dev/null

    iptables -D INPUT -j XRAYUI 2>/dev/null || log_debug "Failed to remove XRAYUI chain from INPUT. Was it already empty?"
    iptables -D FORWARD -j XRAYUI 2>/dev/null || log_debug "Failed to remove XRAYUI chain from FORWARD. Was it already empty?"
    iptables -t nat -D PREROUTING -j XRAYUI 2>/dev/null || log_debug "Failed to remove NAT chain from PREROUTING. Was it already empty?"
    iptables -t mangle -D PREROUTING -j XRAYUI 2>/dev/null || log_debug "Failed to remove mangle chain from PREROUTING. Was it already empty?"

    iptables -t nat -F XRAYUI 2>/dev/null || log_debug "Failed to flush NAT chain. Was it already empty?"
    iptables -t nat -X XRAYUI 2>/dev/null || log_debug "Failed to remove NAT chain. Was it already empty?"
    iptables -t mangle -F XRAYUI 2>/dev/null || log_debug "Failed to flush mangle chain. Was it already empty?"
    iptables -t mangle -X XRAYUI 2>/dev/null || log_debug "Failed to remove mangle chain. Was it already empty?"

    ip rule del fwmark 0x77 table 77 priority 100 2>/dev/null || log_debug "Failed to delete fwmark rule. Was it already empty?"
    ip route flush table 77 2>/dev/null || log_debug "Failed to flush table 77. Was it already empty?"

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

set_route_localnet() {
    local val="$1"
    local wan0="$(nvram get wan0_ifname)"
    local wan1="$(nvram get wan1_ifname)"

    for itf in "$lan_if" $(ip addr | grep -Po '^\d+:\s+\K[^:|@]+'); do
        if [ "$itf" = "lo" ] ||
            [ "$itf" = "$wan0" ] ||
            [ -z "$itf" ] ||
            { [ -n "$wan1" ] && [ "$itf" = "$wan1" ]; }; then
            continue
        fi

        echo "$val" >"/proc/sys/net/ipv4/conf/$itf/route_localnet" 2>/dev/null ||
            log_debug "Failed to set route_localnet to $val for interface $itf. It may not exist."
        log_debug "Set route_localnet to $val for interface $itf"
    done
}
