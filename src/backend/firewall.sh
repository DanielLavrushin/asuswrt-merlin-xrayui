#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

configure_firewall() {
    printlog true "Configuring Xray firewall rules..."
    update_loading_progress "Configuring Xray firewall rules..."

    load_xrayui_config

    # Check if 'xray' process is running
    local xray_pid=$(get_proc "xray")
    if [ -z "$xray_pid" ]; then
        printlog true "Xray process not found. Skipping client firewall configuration." $CWARN
        return
    fi

    # Create a custom chain for Xray rules
    iptables -N XRAYUI 2>/dev/null

    configure_firewall_server

    iptables -I INPUT -j XRAYUI
    iptables -I FORWARD -j XRAYUI

    SERVER_IPS=$(jq -r '[.outbounds[] | select(.settings.vnext != null) | .settings.vnext[].address] | unique | join(" ")' "$XRAY_CONFIG_FILE")

    configure_inbounds

    printlog true "XRAYUI firewall rules applied successfully." $CSUC
}

configure_firewall_server() {

    # Iterate over all inbounds
    jq -c '.inbounds[]' "$XRAY_CONFIG_FILE" | while IFS= read -r inbound; do
        local tag=$(echo "$inbound" | jq -r '.tag // empty')
        local protocol=$(echo "$inbound" | jq -r '.protocol // empty')

        # Skip inbounds with tags starting with 'sys:' and 'dokodemo-door' protocol
        case "$tag" in
        sys:*) continue ;;
        esac
        if [ "$protocol" = "dokodemo-door" ]; then
            continue
        fi

        local port=$(echo "$inbound" | jq -r '.port // empty')
        if [ -z "$port" ]; then
            printlog true "No valid port found for inbound with tag $tag. Skipping." $CWARN
            continue
        fi

        # Validate PORT_START and PORT_END
        if ! echo "$port" | grep -qE '^[0-9]+$'; then
            printlog true "Invalid port or range: $port. Skipping." $CWARN
            continue
        fi

        # Add rules to the XRAYUI chain
        iptables -A XRAYUI -p tcp --dport "$port" -j ACCEPT
        iptables -A XRAYUI -p udp --dport "$port" -j ACCEPT

        printlog true "Firewall SERVER rules applied for port $port." $CSUC
    done
}

configure_inbounds() {
    printlog true "Scanning for all dokodemo-door inbounds..."
    # Get all dokodemo-door inbounds in compact JSON format.
    local dokodemo_inbounds
    dokodemo_inbounds=$(jq -c '.inbounds[] | select(.protocol=="dokodemo-door")' "$XRAY_CONFIG_FILE")

    # Split into two groups based on the tproxy flag.
    local direct_inbounds tproxy_inbounds
    direct_inbounds=$(echo "$dokodemo_inbounds" | jq -c 'select((.streamSettings.sockopt.tproxy // "off") != "tproxy")')
    tproxy_inbounds=$(echo "$dokodemo_inbounds" | jq -c 'select((.streamSettings.sockopt.tproxy // "off") == "tproxy")')

    # Process all direct inbounds in one go.
    if [ -n "$direct_inbounds" ]; then
        configure_firewall_client_direct "$direct_inbounds"
    fi

    # Process all TPROXY inbounds in one go.
    if [ -n "$tproxy_inbounds" ]; then
        configure_firewall_client_tproxy "$tproxy_inbounds"
    fi
}

configure_firewall_client_direct() {
    local inbounds inbound dokodemo_port protocols tcp_enabled udp_enabled
    inbounds=$1
    printlog true "Configuring aggregated DIRECT (REDIRECT) rules for dokodemo-door inbounds..."

    # Set up NAT-only rules for REDIRECT mode.
    iptables -t nat -F XRAYUI 2>/dev/null || printlog true "Failed to flush NAT chain. Was it already empty?" $CWARN
    iptables -t nat -X XRAYUI 2>/dev/null || printlog true "Failed to remove NAT chain. Was it already empty?" $CWARN
    iptables -t nat -N XRAYUI || printlog true "Failed to create NAT chain." $CWARN

    # --- Begin Exclusion Rules (NAT) ---

    # Exclude local (RFC1918) subnets dynamically:
    local local_networks=$(
        ip -4 route show |
            awk '/src/ && ($1 ~ /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168\.)/) { print $1 }'
    )
    for net in $local_networks; do
        iptables -t nat -A XRAYUI -d "$net" -j RETURN || printlog true "Failed to add local subnet $net rule in NAT." $CERR
    done

    update_loading_progress "Configuring firewall Exclusion rules..."
    printlog true "Configuring firewall Exclusion rules..."
    # Always exclude loopback:
    iptables -t nat -A XRAYUI -d 127.0.0.1/32 -j RETURN || printlog true "Failed to add loopback rule in NAT." $CERR

    # Exclude DHCP (UDP ports 67 and 68):
    iptables -t nat -A XRAYUI -p udp --dport 67 -j RETURN || printlog true "Failed to add DHCP rule for UDP 67 in NAT." $CERR
    iptables -t nat -A XRAYUI -p udp --dport 68 -j RETURN || printlog true "Failed to add DHCP rule for UDP 68 in NAT." $CERR

    # Exclude multicast addresses:
    iptables -t nat -A XRAYUI -d 224.0.0.0/4 -j RETURN || printlog true "Failed to add multicast rule (224.0.0.0/4) in NAT." $CERR
    iptables -t nat -A XRAYUI -d 239.0.0.0/8 -j RETURN || printlog true "Failed to add multicast rule (239.0.0.0/8) in NAT." $CERR

    # Exclude STUN (WebRTC)
    iptables -t nat -A XRAYUI -p udp -m u32 --u32 "32=0x2112A442" -j RETURN || printlog true "Failed to add STUN in NAT." $CERR

    # Exclude NTP (UDP port 123)
    iptables -t nat -A XRAYUI -p udp --dport 123 -j RETURN || printlog true "Failed to add NTP rule in NAT." $CERR

    # Exclude the WireGuard subnet 10.122.0.0/24
    if [ "$(nvram get wgs_enable)" = "1" ]; then
        printlog true "WireGuard enabled. Adding exclusion rules for WireGuard."
        WGS_ADDR=$(nvram get "wgs_addr")
        WGS_IP="$(echo "$WGS_ADDR" | cut -d'/' -f1)"
        OCT1="$(echo "$WGS_IP" | cut -d'.' -f1)"
        OCT2="$(echo "$WGS_IP" | cut -d'.' -f2)"
        OCT3="$(echo "$WGS_IP" | cut -d'.' -f3)"

        WGS_SUBNET="$OCT1.$OCT2.$OCT3.0/24"
        WGS_PORT=$(nvram get "wgs_port")

        iptables -t nat -A XRAYUI -p udp --dport "$WGS_PORT" -j RETURN || printlog true "Failed to add WireGuard port rule in NAT." $CERR
        iptables -t nat -A XRAYUI -d "$WGS_SUBNET" -j RETURN || printlog true "Failed to add WireGuard subnet rule in NAT." $CERR
    else
        printlog true "WireGuard not enabled. Skipping WireGuard exclusion rules."
    fi

    # Exclude traffic destined to the Xray server:
    for serverip in $SERVER_IPS; do
        printlog true "Excluding Xray server IP from NAT."
        iptables -t nat -A XRAYUI -d "$serverip" -j RETURN || printlog true "Failed to add rule to exclude Xray server IP in NAT." $CERR
    done

    # Exclude server ports
    server_ports=$(jq -r '.inbounds[]
    | select(.protocol != "dokodemo-door" and (.tag | startswith("sys:") | not))
    | .port' "$XRAY_CONFIG_FILE" | sort -u)

    if [ -n "$server_ports" ]; then
        tcp_ports=$(echo "$server_ports" | tr '\n' ',' | sed 's/,$//')
        iptables -t nat -A XRAYUI -p tcp -m multiport --dports "$tcp_ports" -j RETURN
        iptables -t nat -A XRAYUI -p udp -m multiport --dports "$tcp_ports" -j RETURN
    fi

    echo "$inbounds" | while IFS= read -r inbound; do
        dokodemo_port=$(echo "$inbound" | jq -r '.port // empty')
        protocols=$(echo "$inbound" | jq -r '.settings.network // "tcp"')

        if [ -z "$dokodemo_port" ]; then
            printlog true "Direct inbound missing valid port. Skipping." $CWARN
            continue
        fi

        # Determine protocol support
        echo "$protocols" | grep -iq "tcp" && tcp_enabled=yes || tcp_enabled=no
        echo "$protocols" | grep -iq "udp" && udp_enabled=yes || udp_enabled=no

        if [ "$tcp_enabled" = "no" ] && [ "$udp_enabled" = "no" ]; then
            printlog true "Direct inbound on port $dokodemo_port has no valid protocols (tcp/udp). Skipping." $CWARN
            continue
        fi

        # Apply policy rules
        printlog true "Adding DIRECT rules for inbound on port $dokodemo_port with protocols '$protocols'."

        jq -c '(.routing.policies // []) | if length == 0 then [{mode:"redirect", enabled:true, name:"all traffic to xray"}] else . end | .[]' "$XRAY_CONFIG_FILE" | while IFS= read -r policy; do
            enabled="$(echo "$policy" | jq -r '.enabled // "false"')"
            [ "$enabled" != "true" ] && continue

            mode="$(echo "$policy" | jq -r '.mode // "bypass"')"
            tcpPorts="$(echo "$policy" | jq -r '.tcp // ""')"
            udpPorts="$(echo "$policy" | jq -r '.udp // ""')"
            macCount="$(echo "$policy" | jq '.mac | length')"

            if [ "$macCount" -eq 0 ]; then
                # No MAC array => apply policy to ALL devices
                if [ "$mode" = "bypass" ]; then
                    # Bypass all except the listed TCP/UDP ports -> those get redirected
                    printlog true "Ports policy bypass for ALL devices: redirect only TCP($tcpPorts), UDP($udpPorts)" $CWARN

                    if echo "$protocols" | grep -iq "tcp"; then
                        [ -n "$tcpPorts" ] && iptables -t nat -A XRAYUI -p tcp -m multiport --dports "$tcpPorts" -j REDIRECT --to-port "$dokodemo_port"
                    fi

                    if echo "$protocols" | grep -iq "udp"; then
                        [ -n "$udpPorts" ] && iptables -t nat -A XRAYUI -p udp -m multiport --dports "$udpPorts" -j REDIRECT --to-port "$dokodemo_port"
                    fi

                    iptables -t nat -A XRAYUI -j RETURN
                else
                    # Redirect mode = redirect everything except the listed TCP/UDP ports
                    printlog true "Ports policy redirect for ALL devices: exclude TCP($tcpPorts), UDP($udpPorts)" $CWARN

                    if echo "$protocols" | grep -iq "tcp"; then
                        [ -n "$tcpPorts" ] && iptables -t nat -A XRAYUI -p tcp -m multiport --dports "$tcpPorts" -j RETURN
                        iptables -t nat -A XRAYUI -p tcp -j REDIRECT --to-port "$dokodemo_port"
                    fi

                    if echo "$protocols" | grep -iq "udp"; then
                        [ -n "$udpPorts" ] && iptables -t nat -A XRAYUI -p udp -m multiport --dports "$udpPorts" -j RETURN
                        iptables -t nat -A XRAYUI -p udp -j REDIRECT --to-port "$dokodemo_port"
                    fi
                fi
            else
                # Read each MAC in the policy
                echo "$policy" | jq -r '.mac[]?' | while IFS= read -r mac; do
                    if [ "$mode" = "bypass" ]; then
                        # Bypass all except the listed TCP/UDP ports -> those get redirected
                        printlog true "Ports policy bypass for $mac: redirect only TCP($tcpPorts), UDP($udpPorts)" $CWARN

                        if echo "$protocols" | grep -iq "tcp"; then
                            [ -n "$tcpPorts" ] && iptables -t nat -A XRAYUI -m mac --mac-source "$mac" -p tcp -m multiport --dports "$tcpPorts" -j REDIRECT --to-port "$dokodemo_port"
                        fi
                        if echo "$protocols" | grep -iq "udp"; then
                            [ -n "$udpPorts" ] && iptables -t nat -A XRAYUI -m mac --mac-source "$mac" -p udp -m multiport --dports "$udpPorts" -j REDIRECT --to-port "$dokodemo_port"
                        fi

                        # Default for bypass = return
                        iptables -t nat -A XRAYUI -m mac --mac-source "$mac" -j RETURN

                    else
                        # Redirect mode = redirect everything except the listed TCP/UDP ports
                        printlog true "Ports policy redirect for $mac: exclude TCP($tcpPorts), UDP($udpPorts)" $CWARN

                        if echo "$protocols" | grep -iq "tcp"; then
                            [ -n "$tcpPorts" ] && iptables -t nat -A XRAYUI -m mac --mac-source "$mac" -p tcp -m multiport --dports "$tcpPorts" -j RETURN
                            iptables -t nat -A XRAYUI -m mac --mac-source "$mac" -p tcp -j REDIRECT --to-port "$dokodemo_port"
                        fi
                        if echo "$protocols" | grep -iq "udp"; then
                            [ -n "$udpPorts" ] && iptables -t nat -A XRAYUI -m mac --mac-source "$mac" -p udp -m multiport --dports "$udpPorts" -j RETURN
                            iptables -t nat -A XRAYUI -m mac --mac-source "$mac" -p udp -j REDIRECT --to-port "$dokodemo_port"
                        fi
                    fi
                done
            fi
        done
    done
    # --- End Exclusion Rules ---

    # Execute custom rules for TPROXY (if any)
    local script="$ADDON_USER_SCRIPTS_DIR/firewall_client"
    if [ -x "$script" ]; then
        printlog true "Executing custom TPROXY firewall script: $script"
        "$script" || printlog true "Error executing $script." $CERR
    fi

    iptables -t nat -A XRAYUI -j RETURN || printlog true "Failed to add default rule in NAT." $CERR

    # Hook chain into NAT PREROUTING:
    iptables -t nat -A PREROUTING -j XRAYUI || printlog true "Failed to hook NAT chain." $CERR

    printlog true "Direct (REDIRECT) rules applied." $CSUC
}

configure_firewall_client_tproxy() {
    local inbounds inbound dokodemo_port protocols tcp_enabled udp_enabled
    inbounds=$1
    printlog true "Configuring aggregated TPROXY rules for dokodemo-door inbounds..."

    # Ensure TPROXY module is loaded
    if ! lsmod | grep -q "xt_TPROXY"; then
        printlog true "xt_TPROXY kernel module not loaded. Attempting to load..."
        modprobe xt_TPROXY || {
            printlog true "Failed to load xt_TPROXY kernel module. TPROXY might not work." $CERR
            return 1
        }
        sleep 1 # Allow some time for the module to load
    fi

    # Verify if the module is successfully loaded
    if ! lsmod | grep -q "xt_TPROXY"; then
        printlog true "xt_TPROXY kernel module is still not loaded after attempt. Aborting." $CERR
        return 1
    else
        printlog true "xt_TPROXY kernel module successfully loaded."
    fi

    # Set up MANGLE chain:
    iptables -t mangle -F XRAYUI 2>/dev/null || printlog true "Failed to flush mangle chain. Was it already empty?" $CWARN
    iptables -t mangle -X XRAYUI 2>/dev/null || printlog true "Failed to remove mangle chain. Was it already empty?" $CWARN
    iptables -t mangle -N XRAYUI || printlog true "Failed to create mangle chain." $CWARN

    # --- Begin Exclusion Rules (both NAT and MANGLE) ---
    # Exclude local (RFC1918) subnets dynamically:
    local local_networks=$(
        ip -4 route show |
            awk '/src/ && ($1 ~ /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168\.)/) { print $1 }'
    )
    for net in $local_networks; do
        iptables -t mangle -A XRAYUI -d "$net" -j RETURN || printlog true "Failed to add local subnet $net rule in MANGLE." $CERR
    done

    # Always exclude loopback:
    iptables -t mangle -A XRAYUI -d 127.0.0.1/32 -j RETURN || printlog true "Failed to add loopback rule in MANGLE." $CERR

    # Exclude DHCP (UDP ports 67 and 68):
    iptables -t mangle -A XRAYUI -p udp --dport 67 -j RETURN || printlog true "Failed to add DHCP rule for UDP 67 in MANGLE." $CERR
    iptables -t mangle -A XRAYUI -p udp --dport 68 -j RETURN || printlog true "Failed to add DHCP rule for UDP 68 in MANGLE." $CERR

    # Exclude multicast addresses:
    iptables -t mangle -A XRAYUI -d 224.0.0.0/4 -j RETURN || printlog true "Failed to add multicast rule (224.0.0.0/4) in MANGLE." $CERR
    iptables -t mangle -A XRAYUI -d 239.0.0.0/8 -j RETURN || printlog true "Failed to add multicast rule (239.0.0.0/8) in MANGLE." $CERR

    # Exclude STUN (WebRTC)
    iptables -t mangle -A XRAYUI -p udp -m u32 --u32 "32=0x2112A442" -j RETURN || printlog true "Failed to add STUN in MANGLE." $CERR

    # Exclude traffic in DNAT state (covers inbound port-forwards):
    iptables -t mangle -A XRAYUI -m conntrack --ctstate DNAT -j RETURN

    # Exclude NTP (UDP port 123)
    iptables -t mangle -A XRAYUI -p udp --dport 123 -j RETURN || printlog true "Failed to add NTP rule in MANGLE." $CERR

    # Exclude the WireGuard subnet 10.122.0.0/24
    if [ "$(nvram get wgs_enable)" = "1" ]; then
        printlog true "WireGuard enabled. Adding exclusion rules for WireGuard."
        WGS_ADDR=$(nvram get "wgs_addr")
        WGS_IP="$(echo "$WGS_ADDR" | cut -d'/' -f1)"
        OCT1="$(echo "$WGS_IP" | cut -d'.' -f1)"
        OCT2="$(echo "$WGS_IP" | cut -d'.' -f2)"
        OCT3="$(echo "$WGS_IP" | cut -d'.' -f3)"

        WGS_SUBNET="$OCT1.$OCT2.$OCT3.0/24"
        WGS_PORT=$(nvram get "wgs_port")

        iptables -t mangle -A XRAYUI -p udp --dport "$WGS_PORT" -j RETURN || printlog true "Failed to add WireGuard port rule in MANGLE." $CERR
        iptables -t mangle -A XRAYUI -d "$WGS_SUBNET" -j RETURN || printlog true "Failed to add WireGuard subnet rule in MANGLE." $CERR
    else
        printlog true "WireGuard not enabled. Skipping WireGuard exclusion rules."
    fi

    # Exclude traffic destined to the Xray server:
    for serverip in $SERVER_IPS; do
        printlog true "Excluding Xray server rom NAT and MANGLE."
        iptables -t mangle -A XRAYUI -d "$serverip" -j RETURN || printlog true "Failed to add rule to exclude Xray server in MANGLE." $CERR
    done

    echo "$inbounds" | while IFS= read -r inbound; do
        dokodemo_port=$(echo "$inbound" | jq -r '.port // empty')
        protocols=$(echo "$inbound" | jq -r '.settings.network // "tcp"')

        if [ -z "$dokodemo_port" ]; then
            printlog true "TPROXY inbound missing valid port. Skipping." $CWARN
            continue
        fi

        # Determine protocol support
        echo "$protocols" | grep -iq "tcp" && tcp_enabled=yes || tcp_enabled=no
        echo "$protocols" | grep -iq "udp" && udp_enabled=yes || udp_enabled=no

        if [ "$tcp_enabled" = "no" ] && [ "$udp_enabled" = "no" ]; then
            printlog true "TPROXY inbound on port $dokodemo_port has no valid protocols (tcp/udp). Skipping." $CWARN
            continue
        fi

        printlog true "Adding TPROXY rules for inbound on port $dokodemo_port with protocols '$protocols'."

        # bypass/redirect rules
        jq -c '(.routing.policies // []) | if length == 0 then [{mode:"redirect", enabled:true, name:"all traffic to xray"}] else . end | .[]' "$XRAY_CONFIG_FILE" | while IFS= read -r policy; do
            enabled="$(echo "$policy" | jq -r '.enabled // "false"')"
            [ "$enabled" != "true" ] && continue

            mode="$(echo "$policy" | jq -r '.mode // "bypass"')"
            tcpPorts="$(echo "$policy" | jq -r '.tcp // ""')"
            udpPorts="$(echo "$policy" | jq -r '.udp // ""')"
            macCount="$(echo "$policy" | jq '.mac | length')"

            if [ "$macCount" -eq 0 ]; then
                # No MAC => apply policy to all devices
                if [ "$mode" = "bypass" ]; then
                    # BYPASS => TPROXY only the listed ports; everything else returns
                    if echo "$protocols" | grep -iq "tcp"; then
                        [ -n "$tcpPorts" ] && iptables -t mangle -A XRAYUI -p tcp -m multiport --dports "$tcpPorts" -j TPROXY --on-port "$dokodemo_port" --tproxy-mark 0x8777
                    fi
                    if echo "$protocols" | grep -iq "udp"; then
                        [ -n "$udpPorts" ] && iptables -t mangle -A XRAYUI -p udp -m multiport --dports "$udpPorts" -j TPROXY --on-port "$dokodemo_port" --tproxy-mark 0x8777
                    fi
                    iptables -t mangle -A XRAYUI -j RETURN
                else
                    # REDIRECT => TPROXY everything; listed ports are returned
                    if echo "$protocols" | grep -iq "tcp"; then
                        [ -n "$tcpPorts" ] && iptables -t mangle -A XRAYUI -p tcp -m multiport --dports "$tcpPorts" -j RETURN
                        iptables -t mangle -A XRAYUI -p tcp -j TPROXY --on-port "$dokodemo_port" --tproxy-mark 0x8777
                    fi
                    if echo "$protocols" | grep -iq "udp"; then
                        [ -n "$udpPorts" ] && iptables -t mangle -A XRAYUI -p udp -m multiport --dports "$udpPorts" -j RETURN
                        iptables -t mangle -A XRAYUI -p udp -j TPROXY --on-port "$dokodemo_port" --tproxy-mark 0x8777
                    fi
                fi
            else
                # Per-device logic
                echo "$policy" | jq -r '.mac[]?' | while IFS= read -r mac; do
                    if [ "$mode" = "bypass" ]; then
                        # BYPASS => TPROXY only the listed ports; everything else returns
                        if echo "$protocols" | grep -iq "tcp"; then
                            [ -n "$tcpPorts" ] && iptables -t mangle -A XRAYUI -m mac --mac-source "$mac" -p tcp -m multiport --dports "$tcpPorts" -j TPROXY --on-port "$dokodemo_port" --tproxy-mark 0x8777
                        fi
                        if echo "$protocols" | grep -iq "udp"; then
                            [ -n "$udpPorts" ] && iptables -t mangle -A XRAYUI -m mac --mac-source "$mac" -p udp -m multiport --dports "$udpPorts" -j TPROXY --on-port "$dokodemo_port" --tproxy-mark 0x8777
                        fi
                        iptables -t mangle -A XRAYUI -m mac --mac-source "$mac" -j RETURN
                    else
                        # REDIRECT => TPROXY everything; listed ports are returned
                        if echo "$protocols" | grep -iq "tcp"; then
                            [ -n "$tcpPorts" ] && iptables -t mangle -A XRAYUI -m mac --mac-source "$mac" -p tcp -m multiport --dports "$tcpPorts" -j RETURN
                            iptables -t mangle -A XRAYUI -m mac --mac-source "$mac" -p tcp -j TPROXY --on-port "$dokodemo_port" --tproxy-mark 0x8777
                        fi
                        if echo "$protocols" | grep -iq "udp"; then
                            [ -n "$udpPorts" ] && iptables -t mangle -A XRAYUI -m mac --mac-source "$mac" -p udp -m multiport --dports "$udpPorts" -j RETURN
                            iptables -t mangle -A XRAYUI -m mac --mac-source "$mac" -p udp -j TPROXY --on-port "$dokodemo_port" --tproxy-mark 0x8777
                        fi
                    fi
                done
            fi
        done
    done

    # --- End Exclusion Rules ---

    # Execute custom rules for TPROXY (if any)
    local script="$ADDON_USER_SCRIPTS_DIR/firewall_start"
    if [ -x "$script" ]; then
        printlog true "Executing custom TPROXY firewall script: $script"
        "$script" || printlog true "Error executing $script." $CERR
    fi

    # Add routing rules for marked packets:
    ip rule list | grep -q "fwmark 0x8777" || ip rule add fwmark 0x8777 table 8777 priority 100 || printlog true "Failed to add fwmark rule." $CERR
    ip route add local 0.0.0.0/0 dev lo table 8777 || printlog true "Failed to add local route for fwmark." $CERR

    # Hook the mangle chain into PREROUTING:
    printlog true "Hooking mangle chain into PREROUTING..."
    iptables -t mangle -A PREROUTING -j XRAYUI || printlog true "Failed to hook mangle chain." $CERR
    # local ip_range=$(nvram get dhcp_start)-$(nvram get dhcp_end)
    # printlog true "Hooking mangle chain into PREROUTING $ip_range..."
    # iptables -t mangle -A PREROUTING -m iprange --src-range $ip_range -j XRAYUI || printlog true "Failed to hook mangle chain." $CERR

    printlog true "TPROXY rules applied." $CSUC
}

cleanup_firewall() {

    printlog true "Cleaning up Xray Client firewall rules..."
    update_loading_progress "Cleaning up Xray Client firewall rules..."

    load_xrayui_config

    iptables -D INPUT -j XRAYUI 2>/dev/null
    iptables -D FORWARD -j XRAYUI 2>/dev/null
    iptables -t nat -D PREROUTING -j XRAYUI 2>/dev/null
    iptables -t mangle -D PREROUTING -j XRAYUI 2>/dev/null

    iptables -t nat -F XRAYUI 2>/dev/null || printlog true "Failed to flush NAT chain. Was it already empty?" $CWARN
    iptables -t nat -X XRAYUI 2>/dev/null || printlog true "Failed to remove NAT chain. Was it already empty?" $CWARN
    iptables -t mangle -F XRAYUI 2>/dev/null || printlog true "Failed to flush mangle chain. Was it already empty?" $CWARN
    iptables -t mangle -X XRAYUI 2>/dev/null || printlog true "Failed to remove mangle chain. Was it already empty?" $CWARN

    ip rule del fwmark 0x8777 table 8777 priority 100 2>/dev/null || printlog true "Failed to delete fwmark rule. Was it already empty?" $CWARN
    ip route flush table 8777 2>/dev/null || printlog true "Failed to flush table 8777. Was it already empty?" $CWARN

    local script="$ADDON_USER_SCRIPTS_DIR/firewall_cleanup"
    if [ -x "$script" ]; then
        printlog true "Executing user firewall script: $script"
        "$script" "$XRAY_CONFIG_FILE" || printlog true "Error executing $script." $CERR
    fi

    printlog true "Restarting firewall and DNS services..."
    update_loading_progress "Restarting firewall and DNS services..."

    service restart_firewall >/dev/null 2>&1 && printlog true "Firewall service restarted successfully." $CSUC
    service restart_dnsmasq >/dev/null 2>&1 && printlog true "DNS service restarted successfully." $CSUC

    printlog true "Xray Client firewall rules cleaned up successfully." $CSUC
}
