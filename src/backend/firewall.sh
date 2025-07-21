#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

tproxy_mark=0x10000
tproxy_mask=0x10000
tproxy_table=77
IP6NAT_LOADED="0"

ipt() { # ipt <table> <args…>
    local tbl=$1
    shift
    apply_rule "$tbl" "$@" # uses IPT_LIST and skips v6/nat automatically
}

apply_rule() {
    local tbl=$1
    shift
    local rc=0 did=0 args rule
    args="$*"
    for IPT in $IPT_LIST; do
        rule="$args"
        if [ "$IPT" = "ip6tables" ]; then
            rule="$(printf '%s\n' "$rule" | sed 's/127\.0\.0\.1/::1/g')"
        else
            rule="$(printf '%s\n' "$rule" | sed 's/::1/127.0.0.1/g')"
        fi
        if [ "$IPT" = "ip6tables" ] && [ "$tbl" = "nat" ]; then
            if [ "$IP6NAT_LOADED" = "0" ]; then
                modprobe -q ip6table_nat 2>/dev/null && IP6NAT_LOADED=1 || IP6NAT_LOADED=-1
            fi
            [ "$IP6NAT_LOADED" != "1" ] && continue
            $IPT -w -t nat -L -n >/dev/null 2>&1 || continue
        fi
        [ "$IPT" = "ip6tables" ] && contains_ipv4 "$rule" && continue
        [ "$IPT" = "iptables" ] &&
            contains_ipv6 "$rule" &&
            ! echo "$rule" | grep -q -- '-m[[:space:]]\+mac' &&
            continue
        $IPT -w -t "$tbl" $rule 2>/dev/null
        rc=$?
        did=1
    done
    [ $did -eq 1 ] && return $rc || return 0
}

append_rule() {
    local tbl=$1
    shift
    log_debug "  - Appending rule $tbl -I XRAYUI 1 $@"
    ipt $tbl -C XRAYUI "$@" 2>/dev/null || ipt $tbl -A XRAYUI "$@"
}

insert_rule() {
    local tbl=$1
    shift
    log_debug "  - Inserting rule $tbl -I XRAYUI 1 $@"
    ipt $tbl -C XRAYUI "$@" 2>/dev/null || ipt $tbl -I XRAYUI 1 "$@"
}

contains_ipv4() {
    [ -z "$1" ] && return 1
    printf '%s\n' "$1" |
        grep -Eq '(^|[[:space:]])([0-9]{1,3}\.){3}[0-9]{1,3}([[:space:]/]|$)'
}

contains_ipv6() {
    [ -z "$1" ] && return 1
    printf '%s\n' "$1" |
        grep -Eq '(^|[[:space:]])([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}([[:space:]/]|$)'
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
    log_debug "Xray PID: $xray_pid"

    IPT_LIST="iptables"
    if is_ipv6_enabled; then
        IPT_LIST="$IPT_LIST ip6tables"
        log_debug "IPv6 enabled: yes"
    else
        log_debug "IPv6 enabled: no"
    fi

    ipset list -n 2>/dev/null | grep -qx "$IPSET_BYPASS_V4" || ipset create "$IPSET_BYPASS_V4" hash:ip family inet timeout 86400
    ipset list -n 2>/dev/null | grep -qx "$IPSET_PROXY_V4" || ipset create "$IPSET_PROXY_V4" hash:ip family inet timeout 86400
    if is_ipv6_enabled; then
        ipset list -n 2>/dev/null | grep -qx "$IPSET_BYPASS_V6" || ipset create "$IPSET_BYPASS_V6" hash:ip family inet6 timeout 86400
        ipset list -n 2>/dev/null | grep -qx "$IPSET_PROXY_V6" || ipset create "$IPSET_PROXY_V6" hash:ip family inet6 timeout 86400
    fi

    # Clamp TCP MSS to path-MTU for every forwarded SYN (v4 + v6)
    ipt mangle -C FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null ||
        ipt mangle -I FORWARD 1 -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu

    # create / flush chains (filter + mangle for both families)
    for tbl in filter mangle nat; do
        ipt "$tbl" -N XRAYUI 2>/dev/null || ipt "$tbl" -F XRAYUI
    done

    ipt mangle -N DIVERT 2>/dev/null || ipt mangle -F DIVERT
    ipt mangle -A DIVERT -j MARK --set-mark $tproxy_mark/$tproxy_mask
    ipt mangle -A DIVERT -j CONNMARK --save-mark --mask $tproxy_mask
    ipt mangle -A DIVERT -j ACCEPT

    ipt mangle -C PREROUTING -p tcp -m socket --transparent -j DIVERT 2>/dev/null ||
        ipt mangle -I PREROUTING 1 -p tcp -m socket --transparent -j DIVERT

    # IPv4 nat chain
    ipt nat -N XRAYUI 2>/dev/null || true
    ipt nat -F XRAYUI 2>/dev/null

    ipt filter -C XRAYUI -j RETURN 2>/dev/null || ipt filter -A XRAYUI -j RETURN

    configure_firewall_server

    # Hook filter-table XRAYUI
    ipt filter -C INPUT -j XRAYUI 2>/dev/null || ipt filter -I INPUT 1 -j XRAYUI
    ipt filter -C FORWARD -j XRAYUI 2>/dev/null || ipt filter -I FORWARD 1 -j XRAYUI

    # Clamp MSS for Xray-originated flows as well
    local daemon_uid=""
    [ -n "$xray_pid" ] && daemon_uid=$(awk '/^Uid:/ {print $2}' /proc/"$xray_pid"/status)

    for IPT in $IPT_LIST; do
        $IPT -t mangle -C OUTPUT -p tcp --tcp-flags SYN,RST SYN \
            -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null ||
            $IPT -t mangle -I OUTPUT 1 -p tcp --tcp-flags SYN,RST SYN \
                -j TCPMSS --clamp-mss-to-pmtu

        if [ -n "$daemon_uid" ] && [ "$daemon_uid" != "0" ]; then
            $IPT -t mangle -C OUTPUT -m owner --uid-owner "$daemon_uid" -j RETURN 2>/dev/null ||
                $IPT -t mangle -I OUTPUT 1 -m owner --uid-owner "$daemon_uid" -j RETURN
        else
            log_debug "X-ray runs as UID $daemon_uid; skipping owner-match OUTPUT rule"
        fi
    done

    SERVER_IPS=""
    for addr in $(jq -r '[.outbounds[] | select(.settings.vnext!=null)|.settings.vnext[].address]|unique|join(" ")' "$XRAY_CONFIG_FILE"); do
        if contains_ipv4 "$addr" || contains_ipv6 "$addr"; then
            SERVER_IPS="$SERVER_IPS $addr"
        else
            for ip in $(resolve_host_ips "$addr"); do
                SERVER_IPS="$SERVER_IPS $ip"
            done
        fi
    done

    SERVER_IPS=$(printf '%s\n' $SERVER_IPS | sort -u | tr '\n' ' ')

    if jq -e '
  .inbounds[]
  | select(
      .protocol == "dokodemo-door"
      and ((.tag // "") | startswith("sys:") | not)
    )
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
    dokodemo_inbounds=$(
        jq -c '
    .inbounds[]
    | select(.protocol == "dokodemo-door"  
      and ((.tag // "") | startswith("sys:") | not)
      )
  ' "$XRAY_CONFIG_FILE"
    )

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
        if [ "$listen_addr" != "0.0.0.0" ] && [ "$listen_addr" != "::" ]; then
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

    ipt $IPT_TABLE -F XRAYUI 2>/dev/null || log_debug "Failed to flush $IPT_TABLE chain. Was it already empty?"
    ipt $IPT_TABLE -X XRAYUI 2>/dev/null || log_debug "Failed to remove $IPT_TABLE chain. Was it already empty?"
    ipt $IPT_TABLE -N XRAYUI 2>/dev/null || log_debug "Failed to create $IPT_TABLE chain."

    for wan_if in $(ip -o link show | awk -F': ' '{print $2}' |
        grep -E '^(ppp|pppoe|wan|wwan|lte|l2tp)[0-9]+$'); do
        ipt "$IPT_TABLE" -C XRAYUI -i "$wan_if" -j RETURN 2>/dev/null ||
            ipt "$IPT_TABLE" -I XRAYUI 1 -i "$wan_if" -j RETURN
    done

    if [ "$IPT_TABLE" = "mangle" ]; then
        iptables -w -t "$IPT_TABLE" -C XRAYUI -d 127.0.0.0/8 -j RETURN 2>/dev/null ||
            iptables -w -t "$IPT_TABLE" -I XRAYUI 1 -d 127.0.0.0/8 -j RETURN
    fi

    # --- Begin Exclusion Rules ---

    update_loading_progress "Configuring firewall Exclusion rules..."
    log_info "Configuring firewall Exclusion rules..."

    local source_nets_v6=""
    if is_ipv6_enabled; then
        for dev in $(nvram get lan_ifname) $(nvram get wl0_ifname) $(nvram get wl1_ifname); do
            [ -z "$dev" ] && continue
            source_nets_v6="$source_nets_v6 $(ip -6 route show proto kernel dev "$dev" | awk '{print $1}')"
        done
        source_nets_v6=$(printf '%s\n' $source_nets_v6 | sort -u)
    fi

    # Check if WireGuard is enabled and set the address accordingly
    local wgs_enabled="$(nvram get "wgs_enable" 2>/dev/null)"
    if [ "$wgs_enabled" = "1" ]; then
        wgs_addr=$(nvram get wgs_addr 2>/dev/null | tr ',' ' ' | sed -E 's#([0-9]+\.[0-9]+\.[0-9]+)\.[0-9]+/32#\1.0/24#g')
    fi

    # Check if IPSEC is enabled and set the address accordingly
    [ "$(nvram get ipsec_server_enable 2>/dev/null)" = 1 ] || [ "$(nvram get ipsec_ig_enable 2>/dev/null)" = 1 ] && ipsec_addr="10.10.10.0/24"

    local source_nets_v4 source_nets_v6
    source_nets_v4=$(ip -4 route show scope link | awk '$1 ~ /\// && $1 ~ /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168\.)/ {print $1}')

    source_nets_v4="$source_nets_v4 $wgs_addr $ipsec_addr"
    source_nets_v4=$(printf '%s\n' $source_nets_v4 | sort -u)

    source_nets="$source_nets_v4 $source_nets_v6"

    if [ "$IPT_TYPE" = "TPROXY" ]; then
        lsmod | grep -q '^xt_socket ' || modprobe xt_socket 2>/dev/null

        ipt $IPT_TABLE -C XRAYUI -p udp -m socket --transparent -j MARK --set-mark $tproxy_mark/$tproxy_mask 2>/dev/null ||
            ipt $IPT_TABLE -I XRAYUI 1 -p udp -m socket --transparent -j MARK --set-mark $tproxy_mark/$tproxy_mask

        for net4 in $source_nets_v4; do
            iptables -w -t "$IPT_TABLE" -I XRAYUI 1 -d "$net4" -p udp --dport 53 -j RETURN
        done
        if is_ipv6_enabled; then
            ip6tables -w -t "$IPT_TABLE" -I XRAYUI 1 -s ::1 -j RETURN
            ip6tables -w -t "$IPT_TABLE" -I XRAYUI 1 -d ff00::/8 -j RETURN
            ip6tables -w -t "$IPT_TABLE" -I XRAYUI 1 -p icmpv6 -j RETURN
            for net6 in $source_nets_v6; do
                ip6tables -w -t "$IPT_TABLE" -I XRAYUI 1 -d "$net6" -p udp -m multiport --dports 53,546,547 -j RETURN
            done
        fi
    fi

    for net in $source_nets; do
        log_debug "Excluding static network $net from $IPT_TABLE."

        if [ "$IPT_TABLE" = "mangle" ]; then
            ipt $IPT_TABLE -A XRAYUI -d "$net" -p tcp -j RETURN 2>/dev/null || log_error "Failed to add RETURN rule for $net in $IPT_TABLE."
            ipt $IPT_TABLE -A XRAYUI -d "$net" -p udp ! --dport 53 -j RETURN 2>/dev/null || log_error "Failed to add RETURN rule for $net in $IPT_TABLE."
        else
            ipt $IPT_TABLE -A XRAYUI -d "$net" -j RETURN 2>/dev/null || log_error "Failed to add RETURN rule for $net in $IPT_TABLE."
        fi
    done

    # IPSET FREEDOM eraly return rules
    if [ -n "$ipsec" ] && [ "$ipsec" != "off" ]; then
        log_debug "Adding IPSET rules for $IPT_TABLE."
        iptables -w -t "$IPT_TABLE" -C XRAYUI -m set --match-set "$IPSET_BYPASS_V4" dst -j RETURN 2>/dev/null ||
            iptables -w -t "$IPT_TABLE" -I XRAYUI 1 -m set --match-set "$IPSET_BYPASS_V4" dst -j RETURN

        if is_ipv6_enabled && ipset list -n | grep -qx "$IPSET_BYPASS_V6"; then
            log_debug "Adding IPv6 IPSET rules for $IPT_TABLE."
            ip6tables -w -t "$IPT_TABLE" -C XRAYUI -m set --match-set "$IPSET_BYPASS_V6" dst -j RETURN 2>/dev/null ||
                ip6tables -w -t "$IPT_TABLE" -I XRAYUI 1 -m set --match-set "$IPSET_BYPASS_V6" dst -j RETURN
        fi

        if [ "$ipsec" = "redirect" ]; then
            iptables -w -t "$IPT_TABLE" -C XRAYUI -m set ! --match-set "$IPSET_PROXY_V4" dst -j RETURN 2>/dev/null ||
                iptables -w -t "$IPT_TABLE" -I XRAYUI 1 -m set ! --match-set "$IPSET_PROXY_V4" dst -j RETURN

            if is_ipv6_enabled && ipset list -n | grep -qx "$IPSET_PROXY_V6"; then
                ip6tables -w -t "$IPT_TABLE" -C XRAYUI -m set ! --match-set "$IPSET_PROXY_V6" dst -j RETURN 2>/dev/null ||
                    ip6tables -w -t "$IPT_TABLE" -I XRAYUI 1 -m set ! --match-set "$IPSET_PROXY_V6" dst -j RETURN
            fi
        fi
    fi

    local IPT_BASE_FLAGS="$IPT_TABLE -A XRAYUI"

    # Exclude DHCP (UDP ports 67 and 68):
    ipt $IPT_BASE_FLAGS -p udp --dport 67 -j RETURN 2>/dev/null || log_error "Failed to add DHCP rule for UDP 67 in $IPT_TABLE."
    ipt $IPT_BASE_FLAGS -p udp --dport 68 -j RETURN 2>/dev/null || log_error "Failed to add DHCP rule for UDP 68 in $IPT_TABLE."

    # Exclude multicast addresses:
    ipt $IPT_BASE_FLAGS -d 224.0.0.0/4 -j RETURN 2>/dev/null || log_error "Failed to add multicast rule (224.0.0.0/4) in $IPT_TABLE."
    ipt $IPT_BASE_FLAGS -d 239.0.0.0/8 -j RETURN 2>/dev/null || log_error "Failed to add multicast rule (239.0.0.0/8) in $IPT_TABLE."

    # Exclude traffic in DNAT state (covers inbound port-forwards):
    ipt $IPT_BASE_FLAGS -m conntrack --ctstate DNAT -j RETURN 2>/dev/null || log_error "Failed to add DNAT rule in $IPT_TABLE."

    # Exclude NTP (UDP port 123)
    ipt $IPT_BASE_FLAGS -p udp --dport 123 -j RETURN 2>/dev/null || log_error "Failed to add NTP rule in $IPT_TABLE."

    # Exclude traffic destined to the Xray server:
    [ -n "$SERVER_IPS" ] && for serverip in $SERVER_IPS; do
        log_info "Excluding Xray server IP from $IPT_TABLE."
        ipt $IPT_BASE_FLAGS -d "$serverip" -j RETURN 2>/dev/null || log_error "Failed to add rule to exclude Xray server IP $serverip in $IPT_TABLE."
    done

    # Exclude tunnel UDP ports
    ipt $IPT_BASE_FLAGS -p udp -m multiport --dports 500,4500,51820 -j RETURN 2>/dev/null || log_error "Failed to add tunnel UDP ports rule in $IPT_TABLE."

    # TPROXY excludes:
    if [ "$IPT_TYPE" = "TPROXY" ]; then

        # Collect all WANx real-IP variables that actually contain an address
        local wan_v4_list=""
        for idx in 0 1 2 3; do
            ip_val="$(nvram get "wan${idx}_realip_ip" 2>/dev/null)"
            [ -z "$ip_val" ] && ip_val="$(nvram get "wan${idx}_ipaddr" 2>/dev/null)"
            if echo "$ip_val" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
                wan_v4_list="$wan_v4_list $ip_val"
            fi
        done
        wan_v4_list=$(printf '%s\n' $wan_v4_list | sort -u)

        local wan_v6_list=""
        if is_ipv6_enabled; then
            for idx in 0 1 2 3; do
                ifname="$(nvram get "wan${idx}_ifname")"
                [ -z "$ifname" ] && continue
                addrs=$(ip -6 addr show dev "$ifname" scope global |
                    awk '{print $2}' | cut -d/ -f1)
                wan_v6_list="$wan_v6_list $addrs"
            done
            for ifname in "$(nvram get lan_ifname)" "$(nvram get wl0_ifname)" \
                "$(nvram get wl1_ifname)"; do
                [ -z "$ifname" ] && continue
                addrs=$(ip -6 addr show dev "$ifname" scope global |
                    awk '{print $2}' | cut -d/ -f1)
                wan_v6_list="$wan_v6_list $addrs"
            done
            # Deduplicate the final list
            wan_v6_list=$(printf '%s\n' $wan_v6_list | sed '/^$/d' | sort -u)
        fi

        local via_v4 via_v6
        via_v4=$(ip -4 route show | awk '$2=="via" && $1!="default" {print $1}')
        if is_ipv6_enabled; then
            via_v6=$(ip -6 route show | awk '$2=="via" && $1!="default" {print $1}')
        fi
        via_routes=$(printf '%s\n' $via_v4 $via_v6 | sort -u)

        local static_routes
        static_routes=$(nvram get lan_route | tr ' ' '\n' | grep -E '^(([0-9]{1,3}\.){3}[0-9]{1,3}|[0-9a-fA-F:]+)(/[0-9]{1,3})?$')

        # unified exclusion: WAN IP, any “via” routes, and your nvram static list
        for dst in $wan_v4_list $wan_v6_list $via_routes $static_routes; do
            log_debug "TPROXY: excluding $dst from $IPT_TABLE"
            ipt $IPT_BASE_FLAGS -d "$dst" -j RETURN 2>/dev/null || log_error "Failed to exclude $dst in $IPT_TABLE."
        done
    fi

    # Exclude server ports
    server_ports=$(jq -r '.inbounds[]
    | select(.protocol != "dokodemo-door")
    | .port' "$XRAY_CONFIG_FILE" | sort -u)

    if [ -n "$server_ports" ]; then
        for port in $server_ports; do
            for proto in tcp udp; do
                ipt "$IPT_TABLE" -C XRAYUI -p "$proto" --dport "$port" -j RETURN 2>/dev/null ||
                    ipt $IPT_BASE_FLAGS -p "$proto" --dport "$port" -j RETURN
            done
            log_debug "Excluding server port $port (tcp+udp) from $IPT_TABLE."
        done
    fi

    # Start Redirecting traffic to the xray

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
            policy_name="$(echo "$policy" | jq -r '.name')"
            policy_mode="$(echo "$policy" | jq -r '.mode // "bypass"')"
            tcp_ports="$(echo "$policy" | jq -r '.tcp // ""')"
            udp_ports="$(echo "$policy" | jq -r '.udp // ""')"
            macs=$(echo "$policy" | jq -r '.mac[]?')

            [ -z "$macs" ] && macs="ANY"

            log_debug "Applying policy: $policy_name, MODE: $policy_mode"

            for src in $source_nets; do
                base="-s $src"
                for mac in $macs; do
                    [ "$mac" = "ANY" ] && mac_flag="" || mac_flag="-m mac --mac-source $mac"

                    if [ "$policy_mode" = "redirect" ]; then
                        [ "$tcp_enabled" = "yes" ] && [ -n "$tcp_ports" ] && insert_rule "$IPT_TABLE" $base $mac_flag -p tcp -m multiport --dports "$tcp_ports" -j RETURN
                        [ "$udp_enabled" = "yes" ] && [ -n "$udp_ports" ] && insert_rule "$IPT_TABLE" $base $mac_flag -p udp -m multiport --dports "$udp_ports" -j RETURN
                        [ "$tcp_enabled" = "yes" ] && append_rule "$IPT_TABLE" $base $mac_flag -p tcp $IPT_JOURNAL_FLAGS
                        [ "$udp_enabled" = "yes" ] && append_rule "$IPT_TABLE" $base $mac_flag -p udp $IPT_JOURNAL_FLAGS
                    else
                        [ "$tcp_enabled" = "yes" ] && [ -n "$tcp_ports" ] && append_rule "$IPT_TABLE" $base $mac_flag -p tcp -m multiport --dports "$tcp_ports" $IPT_JOURNAL_FLAGS
                        [ "$udp_enabled" = "yes" ] && [ -n "$udp_ports" ] && append_rule "$IPT_TABLE" $base $mac_flag -p udp -m multiport --dports "$udp_ports" $IPT_JOURNAL_FLAGS
                        [ -z "$tcp_ports" ] && [ -z "$udp_ports" ] && insert_rule "$IPT_TABLE" $base $mac_flag -j RETURN
                        [ "$tcp_enabled" = "yes" ] && [ -n "$tcp_ports" ] && append_rule "$IPT_TABLE" $base $mac_flag -p tcp $IPT_JOURNAL_FLAGS
                        [ "$udp_enabled" = "yes" ] && [ -n "$udp_ports" ] && append_rule "$IPT_TABLE" $base $mac_flag -p udp $IPT_JOURNAL_FLAGS
                    fi

                done
            done
        done
    done

    # --- End Exclusion Rules ---

    if [ "$IPT_TYPE" = "TPROXY" ]; then
        add_tproxy_routes "$tproxy_mark/$tproxy_mask" "$tproxy_table"
    else
        ipt $IPT_TABLE -A XRAYUI -p tcp -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
        ipt $IPT_BASE_FLAGS -j RETURN 2>/dev/null || log_error "Failed to add default rule in $IPT_TABLE chain."
    fi

    #   ipt $IPT_BASE_FLAGS -m limit --limit 10/second --limit-burst 30 -j LOG --log-prefix "XrayUI: " --log-level 4

    # Hook chain into  PREROUTING:
    if ! ipt "$IPT_TABLE" -C PREROUTING -j XRAYUI 2>/dev/null; then
        ipt "$IPT_TABLE" -A PREROUTING -j XRAYUI
    fi

    if [ "$POST_RESTART_DNSMASQ" = "false" ]; then
        dnsmasq_restart
    fi

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

    # Cleanup IPSEC ipsets
    for set in "$IPSET_BYPASS_V4" "$IPSET_PROXY_V4"; do
        ipset list -n 2>/dev/null | grep -qx "$set" && ipset destroy "$set" 2>/dev/null
    done
    for set in "$IPSET_BYPASS_V6" "$IPSET_PROXY_V6"; do
        ipset list -n 2>/dev/null | grep -qx "$set" && ipset destroy "$set" 2>/dev/null
    done

    ipt mangle -D FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null || true
    ipt mangle -D OUTPUT -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null || true

    # 0.46.: temportary workaround for iptables-legacy
    for fam in -4 -6; do
        [ "$fam" = "-6" ] && ! is_ipv6_enabled && continue
        for m in 0x10000/0x10000 0x8777 0x77; do
            while ip $fam rule show | grep -q "fwmark $tproxy_mark"; do
                ip $fam rule del lookup $tproxy_table 2>/dev/null
            done
        done
    done

    # flush both possible tables
    for tbl in 77 8777; do
        ip route flush table "$tbl" 2>/dev/null
        if is_ipv6_enabled; then
            ip -6 route flush table "$tbl" 2>/dev/null
        fi
    done

    # Flush and remove ipsets created during configuration
    for set in "$IPSET_BYPASS_V4" "$IPSET_PROXY_V4" XRAYUI_BYPASS; do
        ipset list -n 2>/dev/null | grep -qx "$set" && {
            ipset flush "$set" 2>/dev/null
            ipset destroy "$set" 2>/dev/null
        }
    done

    if is_ipv6_enabled; then
        for set in "$IPSET_BYPASS_V6" "$IPSET_PROXY_V6" XRAYUI_BYPASS6; do
            ipset list -n 2>/dev/null | grep -qx "$set" && {
                ipset flush "$set" 2>/dev/null
                ipset destroy "$set" 2>/dev/null
            }
        done
    fi

    if [ -f "$XRAYUI_CONFIG_FILE" ]; then
        if jq -e '
  .inbounds[]
  | select(
      .protocol == "dokodemo-door"
      and ((.tag // "") | startswith("sys:") | not)
    )
  | (.listen // "")
  | startswith("127.")
' "$XRAY_CONFIG_FILE" >/dev/null; then
            set_route_localnet 0
        fi
    fi

    local script="$ADDON_USER_SCRIPTS_DIR/firewall_cleanup"
    if [ -x "$script" ]; then
        log_info "Executing user firewall script: $script"
        "$script" "$XRAY_CONFIG_FILE" || log_error "Error executing $script."
    fi

    if [ "$POST_RESTART_DNSMASQ" = "false" ]; then
        dnsmasq_restart
    fi

    log_ok "Xray Client firewall rules cleaned up successfully."
}

add_tproxy_routes() { # $1 = fwmark, $2 = table
    local mark="$1" tbl="$2" fam

    for fam in -4 -6; do
        # Skip IPv6 loop if the stack is disabled
        [ "$fam" = "-6" ] && ! is_ipv6_enabled && continue

        # 1. policy-rule
        ip $fam rule list | grep -q "fwmark $mark" ||
            ip $fam rule add fwmark $mark lookup "$tbl" 2>/dev/null || ip $fam rule replace fwmark $mark lookup "$tbl"

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

    local wl_ifs="$(nvram get wl0_ifname) $(nvram get wl1_ifname)"
    [ -z "$wl_ifs" ] && wl_ifs="$(ls /sys/class/net | grep -E '^(eth[4-9]|dpsta|ra[0-9]+)$')"

    wl_ifs="$(printf '%s\n' $wl_ifs | sed '/^$/d' | sort -u)"

    local if_list="$lan_if $wl_ifs"

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

        [ -e "/proc/sys/net/ipv4/conf/$itf" ] || {
            log_warn "Interface $itf does not exist. Skipping."
            continue
        }

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

ensure_bypass_ipset() {
    ipset list XRAYUI_BYPASS >/dev/null 2>&1 ||
        ipset create XRAYUI_BYPASS hash:ip family inet hashsize 1024 maxelem 65536 timeout 86400

    if is_ipv6_enabled; then
        ipset list XRAYUI_BYPASS6 >/dev/null 2>&1 ||
            ipset create XRAYUI_BYPASS6 hash:ip family inet6 hashsize 1024 maxelem 65536 timeout 86400
    fi
}

split_ports() {
    [ -z "$1" ] && return 0
    printf '%s\n' "$1" | tr ',' '\n' | xargs -n15 | sed 's/ /,/g'
}

resolve_host_ips() {
    nslookup "$1" 2>/dev/null | awk '/^Address/{print $3}'
    [ -z "$2" ] && ping -c1 -W1 "$1" 2>/dev/null | sed -n 's/.*(\([0-9a-fA-F:.]*\)).*/\1/p'
}
