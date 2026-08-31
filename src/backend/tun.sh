#!/bin/sh
# TUN inbound routing configuration for XRAYUI
# shellcheck disable=SC2034

# TUN routing table and rule priorities
tun_table=250
tun_rule_priority_local=49 # Local traffic stays local
tun_rule_priority_tun=51   # Other LAN traffic goes to TUN table

tun_routing_mode() {
    case "${tun_routing:-full}" in
    interface) echo "interface" ;;
    *) echo "full" ;;
    esac
}

is_tun_device() {
    [ -n "$1" ] && [ -e "/sys/class/net/$1/tun_flags" ]
}

tun_interface_names() {
    local configured=""
    if [ -f "$XRAY_CONFIG_FILE" ]; then
        configured=$(jq -r '
            .inbounds[]?
            | select(.protocol == "tun"
              and ((.tag // "") | startswith("sys:") | not)
            )
            | (.settings.name // "xray0")
        ' "$XRAY_CONFIG_FILE" 2>/dev/null)
    fi

    local existing
    existing=$(ip -o link show 2>/dev/null | awk -F': ' '{print $2}' | grep -E '^xray[0-9]*$')

    printf '%s\n%s\n' "$configured" "$existing" | sed '/^$/d' | sort -u
}

configure_tun_inbounds() {
    load_xrayui_config

    local mode
    mode=$(tun_routing_mode)

    log_info "Scanning for TUN inbounds..."

    local tun_inbounds_file="/tmp/xrayui-tun-inbounds.$$"
    jq -c '
        .inbounds[]
        | select(.protocol == "tun"
          and ((.tag // "") | startswith("sys:") | not)
        )
    ' "$XRAY_CONFIG_FILE" 2>/dev/null >"$tun_inbounds_file"

    if [ ! -s "$tun_inbounds_file" ]; then
        log_debug "No TUN inbounds found."
        rm -f "$tun_inbounds_file"
        return 0
    fi

    # Ensure TUN kernel module is loaded
    if [ ! -c /dev/net/tun ]; then
        modprobe tun 2>/dev/null || {
            log_error "Failed to load TUN kernel module. TUN inbound requires kernel TUN support."
            rm -f "$tun_inbounds_file"
            return 1
        }
    fi

    local source_nets_v4 source_nets_v6 default_gw_v4 default_gw_v6

    if [ "$mode" = "full" ]; then
        source_nets_v4=$(ip -4 route show scope link | awk '$1 ~ /\// && $1 ~ /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168\.)/ {print $1}')
        source_nets_v4=$(printf '%s\n' $source_nets_v4 | sort -u)

        if is_ipv6_enabled; then
            for dev in $(nvram get lan_ifname) $(nvram get wl0_ifname) $(nvram get wl1_ifname); do
                [ -z "$dev" ] && continue
                source_nets_v6="$source_nets_v6 $(ip -6 route show proto kernel dev "$dev" 2>/dev/null | awk '{print $1}')"
            done
            source_nets_v6=$(printf '%s\n' $source_nets_v6 | sort -u)
        fi

        default_gw_v4=$(ip -4 route show default | awk '/default/ {print $3; exit}')
        if is_ipv6_enabled; then
            default_gw_v6=$(ip -6 route show default | awk '/default/ {print $3; exit}')
        fi

        log_debug "TUN config: source_nets_v4=$source_nets_v4, default_gw_v4=$default_gw_v4"
    else
        log_info "TUN routing mode is 'interface': XRAYUI will bring the interface up and assign its addresses only."
    fi

    while IFS= read -r inbound; do
        [ -z "$inbound" ] && continue

        local tun_name tun_addresses tun_auto_routes tag
        local _tun_vars
        if ! _tun_vars=$(echo "$inbound" | jq -r '
            "tag=" + ((.tag // "tun-inbound") | tostring | @sh) + "\n" +
            "tun_name=" + ((.settings.name // "xray0") | tostring | @sh)
        '); then
            log_warn "Skipping malformed TUN inbound: failed to parse JSON"
            continue
        fi
        eval "$_tun_vars"
        tun_addresses=$(echo "$inbound" | jq -r '(.settings.gateway // .settings.address // []) | .[]')
        tun_auto_routes=$(echo "$inbound" | jq -r '.settings.autoSystemRoutingTable // [] | .[]')

        log_info "Configuring TUN inbound: $tag (interface: $tun_name)"

        local wait_count=0
        while ! is_tun_device "$tun_name" && [ $wait_count -lt 10 ]; do
            log_debug "Waiting for TUN interface $tun_name to appear... ($wait_count/10)"
            sleep 1
            wait_count=$((wait_count + 1))
        done

        if ! is_tun_device "$tun_name"; then
            if [ -d "/sys/class/net/$tun_name" ]; then
                log_error "Interface $tun_name already exists and is not a TUN device. Refusing to reconfigure it. Choose a different interface name for TUN inbound $tag."
            else
                log_error "TUN interface $tun_name did not appear after 10 seconds. Skipping configuration."
            fi
            continue
        fi

        ip link set "$tun_name" up || {
            log_error "Failed to bring up TUN interface $tun_name"
            continue
        }

        for addr in $tun_addresses; do
            [ -z "$addr" ] && continue
            if contains_ipv4 "$addr"; then
                log_debug "Adding IPv4 address $addr to $tun_name"
                ip -4 addr add "$addr" dev "$tun_name" 2>/dev/null ||
                    ip -4 addr replace "$addr" dev "$tun_name"
            elif contains_ipv6 "$addr" && is_ipv6_enabled; then
                log_debug "Adding IPv6 address $addr to $tun_name"
                ip -6 addr add "$addr" dev "$tun_name" 2>/dev/null ||
                    ip -6 addr replace "$addr" dev "$tun_name"
            fi
        done

        if [ "$mode" != "full" ]; then
            log_ok "TUN inbound $tag: interface $tun_name is up, routing left to the OS."
            continue
        fi

        if [ -n "$tun_auto_routes" ]; then
            log_warn "TUN inbound $tag declares autoSystemRoutingTable. Newer Xray-core builds install those routes in the main table themselves, which conflicts with the XRAYUI TUN routing table. Switch the TUN routing option to 'interface' to let Xray-core own the routing."
        fi

        for net4 in $source_nets_v4; do
            log_debug "Adding local traffic rule for $net4"
            ip -4 rule list | grep -qF "from $net4 to $net4 lookup main" ||
                ip -4 rule add from "$net4" to "$net4" table main priority $tun_rule_priority_local
        done

        if is_ipv6_enabled; then
            for net6 in $source_nets_v6; do
                [ -z "$net6" ] && continue
                log_debug "Adding local IPv6 traffic rule for $net6"
                ip -6 rule list | grep -qF "from $net6 to $net6 lookup main" ||
                    ip -6 rule add from "$net6" to "$net6" table main priority $tun_rule_priority_local
            done
        fi

        for net4 in $source_nets_v4; do
            log_debug "Adding TUN routing rule for $net4"
            ip -4 rule list | grep -qF "from $net4 lookup $tun_table" ||
                ip -4 rule add from "$net4" table $tun_table priority $tun_rule_priority_tun
        done

        if is_ipv6_enabled; then
            for net6 in $source_nets_v6; do
                [ -z "$net6" ] && continue
                log_debug "Adding TUN IPv6 routing rule for $net6"
                ip -6 rule list | grep -qF "from $net6 lookup $tun_table" ||
                    ip -6 rule add from "$net6" table $tun_table priority $tun_rule_priority_tun
            done
        fi

        for serverip in $SERVER_IPS; do
            if contains_ipv4 "$serverip" && [ -n "$default_gw_v4" ]; then
                log_debug "Adding bypass route for server $serverip via $default_gw_v4"
                ip -4 route add "$serverip" via "$default_gw_v4" table $tun_table 2>/dev/null ||
                    ip -4 route replace "$serverip" via "$default_gw_v4" table $tun_table
            elif contains_ipv6 "$serverip" && is_ipv6_enabled && [ -n "$default_gw_v6" ]; then
                log_debug "Adding IPv6 bypass route for server $serverip via $default_gw_v6"
                ip -6 route add "$serverip" via "$default_gw_v6" table $tun_table 2>/dev/null ||
                    ip -6 route replace "$serverip" via "$default_gw_v6" table $tun_table
            fi
        done

        log_debug "Adding default route via TUN interface $tun_name"
        ip -4 route add default dev "$tun_name" table $tun_table 2>/dev/null ||
            ip -4 route replace default dev "$tun_name" table $tun_table

        if is_ipv6_enabled; then
            ip -6 route add default dev "$tun_name" table $tun_table 2>/dev/null ||
                ip -6 route replace default dev "$tun_name" table $tun_table
        fi

        log_debug "Copying non-default routes from main table to TUN table"
        ip -4 route show table main | grep -v '^default' | while read -r r; do
            ip -4 route add table $tun_table $r 2>/dev/null || true
        done

        if is_ipv6_enabled; then
            ip -6 route show table main | grep -v '^default' | while read -r r; do
                ip -6 route add table $tun_table $r 2>/dev/null || true
            done
        fi

        log_ok "TUN inbound $tag configured successfully on $tun_name"
    done <"$tun_inbounds_file"

    rm -f "$tun_inbounds_file"
}

cleanup_tun_inbounds() {
    log_info "Cleaning up TUN inbound routing..."

    # Remove IP rules for TUN table (priorities 49 and 51)
    for fam in -4 -6; do
        [ "$fam" = "-6" ] && ! is_ipv6_enabled && continue

        # Remove rules with priority 49 (local traffic)
        local guard=0
        while ip $fam rule list | grep -qE "^$tun_rule_priority_local:.*lookup main" && [ $guard -lt 64 ]; do
            ip $fam rule del priority $tun_rule_priority_local table main 2>/dev/null || break
            guard=$((guard + 1))
        done

        # Remove rules with priority 51 (TUN traffic)
        guard=0
        while ip $fam rule list | grep -q "lookup $tun_table" && [ $guard -lt 64 ]; do
            ip $fam rule del table $tun_table 2>/dev/null || break
            guard=$((guard + 1))
        done
    done

    # Flush TUN routing table
    ip -4 route flush table $tun_table 2>/dev/null
    if is_ipv6_enabled; then
        ip -6 route flush table $tun_table 2>/dev/null
    fi

    # Remove IP addresses from TUN interfaces and bring them down
    for tun_if in $(tun_interface_names); do
        if ! is_tun_device "$tun_if"; then
            if [ -d "/sys/class/net/$tun_if" ]; then
                log_warn "Skipping cleanup of $tun_if: it exists but is not a TUN device."
            fi
            continue
        fi
        log_debug "Cleaning up TUN interface $tun_if"
        ip addr flush dev "$tun_if" 2>/dev/null
        ip link set "$tun_if" down 2>/dev/null
    done

    log_ok "TUN inbound routing cleaned up."
}
