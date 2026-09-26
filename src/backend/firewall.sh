#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

tproxy_mark=0x10000
tproxy_mask=0x10000
tproxy_table=77
IP6NAT_LOADED="0"
XRAYUI_FIREWALL_LOCKFILE=/tmp/xrayui.firewall.lock

import ./tun.sh

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
            case "$rule" in
            *127.0.0.1*) rule="$(printf '%s\n' "$rule" | sed 's/\(^\|[[:space:]]\)127\.0\.0\.1\([[:space:]:/]\|$\)/\1::1\2/g')" ;;
            esac
        else
            case "$rule" in
            *::1*) rule="$(printf '%s\n' "$rule" | sed 's/\(^\|[[:space:]]\)::1\([[:space:]:/]\|$\)/\1127.0.0.1\2/g')" ;;
            esac
        fi
        if [ "$IPT" = "ip6tables" ] && [ "$tbl" = "nat" ]; then
            if [ "$IP6NAT_LOADED" = "0" ]; then
                modprobe -q ip6table_nat 2>/dev/null && IP6NAT_LOADED=1 || IP6NAT_LOADED=-1
            fi
            [ "$IP6NAT_LOADED" != "1" ] && continue
            $IPT -w -t nat -L -n >/dev/null 2>&1 || continue
        fi
        if [ "$IPT" = "ip6tables" ]; then
            case "$rule" in
            *[0-9].[0-9]*.[0-9]*.[0-9]*) contains_ipv4 "$rule" && continue ;;
            esac
        else
            case "$rule" in
            *:*/*) printf '%s\n' "$rule" | grep -qE ':[^[:space:]]*/[0-9]+' && continue ;;
            esac
            case "$rule" in
            *:*:*) contains_ipv6 "$rule" && ! has_mac_module "$rule" && continue ;;
            esac
        fi
        log_debug " - executing rule: $IPT -w -t $tbl $rule"
        $IPT -w -t "$tbl" $rule || rc=$?
        did=1
    done
    IPT_APPLIED=$did
    return $rc
}

ipt_ensure() {
    local tbl=$1 chain=$2 op=$3 ipt_all="$IPT_LIST" ipt_fam rc=0
    shift 3
    for ipt_fam in $ipt_all; do
        IPT_LIST=$ipt_fam
        ipt "$tbl" -C "$chain" "$@" 2>/dev/null && continue
        if [ "$op" = "-I" ]; then
            ipt "$tbl" -I "$chain" 1 "$@" || rc=1
        else
            ipt "$tbl" -A "$chain" "$@" || rc=1
        fi
    done
    IPT_LIST=$ipt_all
    return $rc
}

ipt_remove() {
    local tbl=$1 chain=$2 ipt_all="$IPT_LIST" ipt_fam guard
    shift 2
    for ipt_fam in $ipt_all; do
        IPT_LIST=$ipt_fam
        guard=0
        while [ "$guard" -lt 32 ] && ipt "$tbl" -C "$chain" "$@" 2>/dev/null && [ "$IPT_APPLIED" = 1 ]; do
            ipt "$tbl" -D "$chain" "$@" 2>/dev/null || break
            guard=$((guard + 1))
        done
    done
    IPT_LIST=$ipt_all
}

ipt_reset_chain() {
    local tbl=$1 chain=$2 ipt_all="$IPT_LIST" ipt_fam
    for ipt_fam in $ipt_all; do
        IPT_LIST=$ipt_fam
        ipt "$tbl" -N "$chain" 2>/dev/null || ipt "$tbl" -F "$chain"
    done
    IPT_LIST=$ipt_all
}
valid_ip_or_cidr() { contains_ipv4 "$1" || contains_ipv6 "$1"; }
is_default_route() { [ "$1" = "0.0.0.0" ] || [ "$1" = "0.0.0.0/0" ] || [ "$1" = "::/0" ]; }
get_iface_ipv6_globals() { ip -6 -o addr show dev "$1" scope global | awk '$3=="inet6"{print $4}' | cut -d/ -f1; }
normalize_tokens() {
    tr ' \t' '\n' |
        tr -d '\r,' |
        sed '/^$/d'
}

has_mac_module() {
    printf '%s\n' "$1" | grep -Eq -- '(^|[[:space:]])-m[[:space:]]+mac([[:space:]]|$)'
}

append_rule() {
    local tbl=$1
    shift
    ipt_ensure "$tbl" XRAYUI -A "$@"
}

insert_rule() {
    local tbl=$1
    shift
    ipt_ensure "$tbl" XRAYUI -I "$@"
}

contains_ipv4() {
    [ -z "$1" ] && return 1
    printf '%s\n' "$1" |
        grep -Eq '(^|[[:space:]])([0-9]{1,3}\.){3}[0-9]{1,3}([[:space:]/]|$)'
}

contains_ipv6() {
    [ -z "$1" ] && return 1
    local s
    s=$(printf '%s\n' "$1" | sed -E 's/(^|[[:space:]])([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}([[:space:]]|$)/\1\3/g')
    printf '%s\n' "$s" |
        grep -Eq '(^|[[:space:]])([0-9A-Fa-f]{0,4}:){2,}([0-9A-Fa-f]{0,4})?(%[[:alnum:]_.-]+)?(/[0-9]{1,3})?([[:space:]]|$)'
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

ensure_hashnet() {
    local s="$1" fam="$2" tmo="$3" hdr ty fa
    hdr=$(ipset list -t "$s" 2>/dev/null)
    if [ -n "$hdr" ]; then
        ty=$(printf '%s\n' "$hdr" | sed -n 's/^Type: //p')
        fa=$(printf '%s\n' "$hdr" | sed -n 's/^Header: family \([^ ]*\).*/\1/p')
        [ "$ty" = "hash:net" ] && [ "$fa" = "$fam" ] && return 0
        ipset destroy "$s" 2>/dev/null || true
    fi
    if [ -n "$tmo" ]; then
        ipset create "$s" hash:net family "$fam" timeout "$tmo" -exist
    else
        ipset create "$s" hash:net family "$fam" -exist
    fi
}

ipset_learned_save() {
    local file="$IPSET_LEARNED_FILE" s sets=""
    for s in "$IPSET_PROXY_V4" "$IPSET_PROXY_V6"; do
        ipset list -t "$s" >/dev/null 2>&1 && sets="$sets $s"
    done
    [ -n "$sets" ] || return 0

    mkdir -p "$(dirname "$file")" 2>/dev/null
    local tmp="$file.$$"
    printf '# %s\n' "$(date +%s)" >"$tmp" || return 1
    for s in $sets; do
        if ! ipset save "$s" >"$tmp.raw" 2>/dev/null; then
            rm -f "$tmp" "$tmp.raw"
            log_warn "Could not read ipset $s; keeping the previously saved learned addresses"
            return 1
        fi
        awk '$1 == "add" && $4 == "timeout" && $5 > 0 { print $2, $3, $5 }' "$tmp.raw" >>"$tmp"
    done
    rm -f "$tmp.raw"
    mv -f "$tmp" "$file"
    log_debug "Saved $(($(wc -l <"$file") - 1)) learned ipset addresses to $file"
}

ipset_learned_restore() {
    local file="$IPSET_LEARNED_FILE" sets out
    [ -s "$file" ] || return 0
    sets=" $(ipset list -n 2>/dev/null | tr '\n' ' ') "
    if out=$(awk -v now="$(date +%s)" -v sets="$sets" '
        NR == 1 { el = now - $2; if (el < 0) el = 0; next }
        index(sets, " " $1 " ") && $3 - el > 0 { printf "add %s %s timeout %d\n", $1, $2, $3 - el }
    ' "$file" | ipset -exist restore 2>&1); then
        log_debug "Restored learned ipset addresses from $file"
    else
        log_warn "Failed to restore learned ipset addresses: $out"
    fi
}

has_loopback_dokodemo() {
    jq -e '
        any(.inbounds[]?;
            .protocol == "dokodemo-door"
            and ((.tag // "") | tostring | startswith("sys:") | not)
            and ((.listen // "") | tostring | startswith("127.")))
    ' "$XRAY_CONFIG_FILE" >/dev/null 2>&1
}

firewall_is_configured() {
    iptables -w -t filter -n -L XRAYUI >/dev/null 2>&1
}

firewall_lock() {
    local waited=0
    which flock >/dev/null 2>&1 || return 0
    while ! flock -n 9; do
        if [ "$waited" -ge 120 ]; then
            log_warn "Timed out waiting for another firewall update to finish. Continuing anyway."
            return 0
        fi
        if [ "$waited" -eq 0 ]; then
            log_info "Another firewall update is in progress. Waiting for it to finish..."
        fi
        sleep 1
        waited=$((waited + 1))
    done
}

with_firewall_lock() {
    local rc
    if ! touch "$XRAYUI_FIREWALL_LOCKFILE" 2>/dev/null; then
        "$@"
        return
    fi
    {
        firewall_lock
        "$@"
        rc=$?
        flock -u 9 2>/dev/null
    } 9>"$XRAYUI_FIREWALL_LOCKFILE"
    return $rc
}

configure_firewall() {
    with_firewall_lock configure_firewall_rules
}

cleanup_firewall() {
    with_firewall_lock cleanup_firewall_rules
}

configure_firewall_rules() {
    local STARTUP_LOCK="/tmp/xrayui_startup.lock"
    if [ -f "$STARTUP_LOCK" ]; then
        local lock_pid=$(cat "$STARTUP_LOCK" 2>/dev/null)
        if [ -n "$lock_pid" ] && [ "$lock_pid" != "$$" ] && kill -0 "$lock_pid" 2>/dev/null; then
            log_info "Startup in progress (PID: $lock_pid). Firewall will be configured after Xray starts."
            return 0
        fi
    fi

    log_info "Configuring Xray firewall rules..."
    update_loading_progress "Configuring Xray firewall rules..."
    load_xrayui_config

    # Check if the 'xray' daemon is running
    local xray_pid=$(get_xray_daemon_pid)
    if [ -z "$xray_pid" ]; then
        log_warn "Xray daemon not found. Skipping client firewall configuration."
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

    # inbound QUIC both ways (PREROUTING)
    # ipt raw -C PREROUTING -p udp -m multiport --dports 443,50000:50100 -j NOTRACK 2>/dev/null ||
    #     ipt raw -I PREROUTING 1 -p udp -m multiport --dports 443,50000:50100 -j NOTRACK
    # ipt raw -C PREROUTING -p udp --sport 443 -j NOTRACK 2>/dev/null ||
    #     ipt raw -I PREROUTING 1 -p udp --sport 443 -j NOTRACK

    # # outbound QUIC from Xray (OUTPUT)
    # ipt raw -C OUTPUT -p udp -m multiport --dports 443,50000:50100 -j NOTRACK 2>/dev/null ||
    #     ipt raw -I OUTPUT 1 -p udp -m multiport --dports 443,50000:50100 -j NOTRACK

    local learned_fresh=""
    ipset list -t "$IPSET_PROXY_V4" >/dev/null 2>&1 || learned_fresh="true"

    ensure_hashnet "$IPSET_BYPASS_V4" inet 86400
    ensure_hashnet "$IPSET_BYPASS_NET_V4" inet
    ensure_hashnet "$IPSET_PROXY_V4" inet 86400
    ensure_hashnet "$IPSET_PROXY_NET_V4" inet
    if is_ipv6_enabled; then
        ensure_hashnet "$IPSET_BYPASS_V6" inet6 86400
        ensure_hashnet "$IPSET_BYPASS_NET_V6" inet6
        ensure_hashnet "$IPSET_PROXY_V6" inet6 86400
        ensure_hashnet "$IPSET_PROXY_NET_V6" inet6
    fi

    if [ "$ipsec" = "redirect" ] && [ "$learned_fresh" = "true" ]; then
        ipset_learned_restore
    fi

    # Clamp TCP MSS to path-MTU for every forwarded SYN (v4 + v6)
    ipt_ensure mangle FORWARD -I -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu

    # create / flush chains (filter + mangle for both families)
    for tbl in filter mangle nat; do
        ipt_reset_chain "$tbl" XRAYUI
    done

    ipt_reset_chain mangle DIVERT
    ipt mangle -A DIVERT -j MARK --set-mark $tproxy_mark/$tproxy_mask
    ipt mangle -A DIVERT -j CONNMARK --save-mark --mask $tproxy_mask
    ipt mangle -A DIVERT -j ACCEPT

    if lsmod | grep -q '^xt_socket ' || modprobe xt_socket 2>/dev/null; then
        ipt_ensure mangle PREROUTING -I -p tcp -m socket --transparent -j DIVERT
    else
        log_warn "xt_socket missing; skipping transparent DIVERT hook"
    fi

    ipt filter -A XRAYUI -j RETURN

    configure_firewall_server

    ipt_ensure filter INPUT -I -j XRAYUI
    ipt_ensure filter FORWARD -I -j XRAYUI

    # Clamp MSS for Xray-originated flows as well
    local daemon_uid=""
    [ -n "$xray_pid" ] && daemon_uid=$(awk '/^Uid:/ {print $2}' /proc/"$xray_pid"/status)

    for IPT in $IPT_LIST; do
        if [ -n "$daemon_uid" ] && [ "$daemon_uid" != "0" ]; then
            $IPT -w -t mangle -C OUTPUT -m owner --uid-owner "$daemon_uid" -j RETURN 2>/dev/null ||
                $IPT -w -t mangle -I OUTPUT 1 -m owner --uid-owner "$daemon_uid" -j RETURN
        else
            log_debug "X-ray runs as UID $daemon_uid; skipping owner-match OUTPUT rule"
        fi
        $IPT -w -t mangle -C OUTPUT -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null ||
            $IPT -w -t mangle -I OUTPUT 1 -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
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

    SERVER_IPS="$(
        printf '%s\n' $SERVER_IPS |
            normalize_tokens |
            while read -r x; do valid_ip_or_cidr "$x" && echo "$x"; done |
            sort -u
    )"

    if has_loopback_dokodemo; then
        set_route_localnet 1
    fi

    # Execute custom scripts for firewall rules before start
    local fw_before_script="$ADDON_USER_SCRIPTS_DIR/firewall_before_start"
    if [ -x "$fw_before_script" ]; then
        log_info "Executing custom  firewall before start script: $fw_before_script"
        "$fw_before_script" 9>&- || log_error "Error executing $fw_before_script."
    fi

    configure_inbounds

    # Configure TUN inbounds (IP assignment, routing rules)
    configure_tun_inbounds

    # Lock down DNS port 53 when "Prevent DNS leaks" is enabled
    configure_dns_leak_lock

    # Execute custom scripts for firewall rules after start
    local fw_after_script="$ADDON_USER_SCRIPTS_DIR/firewall_after_start"
    if [ -x "$fw_after_script" ]; then
        log_info "Executing custom  firewall after start script: $fw_after_script"
        "$fw_after_script" 9>&- || log_error "Error executing $fw_after_script."
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

# Drop UDP/TCP destined to port 53 anywhere except the dedicated Xray DNS
# inbound. Hooks the XRAYUI_DNS_LOCK chain into filter:OUTPUT (router
# itself, e.g. dnsmasq forwarders) and filter:FORWARD (LAN clients that
# slip past TPROXY).
configure_dns_leak_lock() {
    # Engage when the user explicitly asked for DNS-only, or when the DNS leak
    # protection wiring (sys:dns-out outbound) auto-provisioned by the UI is present.
    local dns_wiring=""
    jq -e '(.outbounds // []) | any(.tag == "sys:dns-out")' "$XRAY_CONFIG_FILE" >/dev/null 2>&1 && dns_wiring="true"

    if [ "$xray_dns_only" != "true" ] && [ "$dns_wiring" != "true" ]; then
        return 0
    fi

    # Mirror dnsmasq.sh discovery: dokodemo-door, port 53, follow redirect off.
    local dns_inbounds
    dns_inbounds=$(jq -r '
        .inbounds[]
        | select(.protocol == "dokodemo-door")
        | select(.settings and (.settings | length > 0))
        | select(.settings.followRedirect != true)
        | select((.settings.port // 0) == 53)
        | "\(.listen // "127.0.0.1")#\(.port)"
    ' "$XRAY_CONFIG_FILE" 2>/dev/null)

    if [ -z "$dns_inbounds" ]; then
        log_warn "DNS leak lock requested (xray_dns_only=${xray_dns_only:-false}, dns wiring=${dns_wiring:-false}) but no dedicated DNS inbound found; skipping firewall lock to avoid breaking name resolution"
        return 0
    fi

    log_info "DNS leak lock: dropping UDP/TCP 53 except to dedicated DNS inbound"

    local dns_lock_uid=""
    [ -n "$xray_pid" ] && dns_lock_uid=$(awk '/^Uid:/ {print $2}' /proc/"$xray_pid"/status 2>/dev/null)

    local owner_match_ok=0
    if [ -n "$dns_lock_uid" ] && [ "$dns_lock_uid" != "0" ]; then
        owner_match_ok=1
        for IPT in $IPT_LIST; do
            $IPT -w -t filter -F XRAYUI_DNS_OWNERPROBE 2>/dev/null
            $IPT -w -t filter -X XRAYUI_DNS_OWNERPROBE 2>/dev/null
            if $IPT -w -t filter -N XRAYUI_DNS_OWNERPROBE 2>/dev/null; then
                $IPT -w -t filter -A XRAYUI_DNS_OWNERPROBE -m owner --uid-owner "$dns_lock_uid" -j RETURN 2>/dev/null || owner_match_ok=0
                $IPT -w -t filter -F XRAYUI_DNS_OWNERPROBE 2>/dev/null
                $IPT -w -t filter -X XRAYUI_DNS_OWNERPROBE 2>/dev/null
            else
                owner_match_ok=0
            fi
        done
    fi

    for IPT in $IPT_LIST; do
        $IPT -w -t filter -N XRAYUI_DNS_LOCK 2>/dev/null || $IPT -w -t filter -F XRAYUI_DNS_LOCK
    done

    if [ "$owner_match_ok" = "1" ]; then
        ipt filter -A XRAYUI_DNS_LOCK -m owner --uid-owner "$dns_lock_uid" -j RETURN
    fi
    ipt filter -A XRAYUI_DNS_LOCK -m addrtype --dst-type LOCAL -j RETURN
    ipt filter -A XRAYUI_DNS_LOCK -p udp --dport 53 -j DROP
    ipt filter -A XRAYUI_DNS_LOCK -p tcp --dport 53 -j DROP

    local dns_lock_hooks="OUTPUT FORWARD"
    if [ "$owner_match_ok" != "1" ]; then
        dns_lock_hooks="FORWARD"
        if [ "$dns_lock_uid" = "0" ]; then
            log_warn "DNS leak lock: Xray runs as root, so a uid-owner exemption would also exempt every other router process; locking FORWARD only so Xray can resolve proxy node domains. Router-originated DNS is not force-locked."
        else
            log_warn "DNS leak lock: cannot exempt Xray from the OUTPUT lock (owner match unavailable); locking FORWARD only so Xray can resolve proxy node domains. Router-originated DNS is not force-locked."
        fi
    fi

    for hook in $dns_lock_hooks; do
        ipt_ensure filter "$hook" -I -j XRAYUI_DNS_LOCK
    done

    log_ok "DNS leak lock applied"
}

configure_firewall_server() {

    # Iterate over all inbounds
    jq -c '.inbounds[]' "$XRAY_CONFIG_FILE" | while IFS= read -r inbound; do
        local tag protocol listen_addr port
        local _inbound_vars
        if ! _inbound_vars=$(echo "$inbound" | jq -r '
            "tag=" + ((.tag // "") | tostring | @sh) + "\n" +
            "protocol=" + ((.protocol // "") | tostring | @sh) + "\n" +
            "listen_addr=" + ((.listen // "0.0.0.0") | tostring | @sh) + "\n" +
            "port=" + ((.port // "") | tostring | @sh)
        '); then
            log_warn "Skipping malformed server inbound: failed to parse JSON"
            continue
        fi
        eval "$_inbound_vars"

        # Skip inbounds with 'dokodemo-door' protocol
        if [ "$protocol" = "dokodemo-door" ]; then
            continue
        fi
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
        ipt filter -I XRAYUI 1 -m addrtype --dst-type LOCAL -p tcp $IPT_LISTEN_FLAGS
        ipt filter -I XRAYUI 1 -m addrtype --dst-type LOCAL -p udp $IPT_LISTEN_FLAGS

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

    for wan_if in $(ip -o link show | awk -F': ' '{print $2}' |
        grep -E '^(ppp|pppoe|wan|wwan|lte|l2tp)[0-9]+$'); do
        ipt "$IPT_TABLE" -I XRAYUI 1 -i "$wan_if" -j RETURN
    done

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

        ipt $IPT_TABLE -I XRAYUI 1 -p udp -m socket --transparent -j MARK --set-mark $tproxy_mark/$tproxy_mask
        ipt $IPT_TABLE -I XRAYUI 2 -p tcp -m socket --transparent -j MARK --set-mark $tproxy_mark/$tproxy_mask

        insert_rule filter -m mark --mark $tproxy_mark/$tproxy_mask -j ACCEPT

        iptables -w -t "$IPT_TABLE" -I XRAYUI 1 -m addrtype --src-type LOCAL -j RETURN
        iptables -w -t "$IPT_TABLE" -I XRAYUI 2 -m addrtype --dst-type LOCAL -j RETURN

        # for net4 in $source_nets_v4; do
        #     iptables -w -t "$IPT_TABLE" -I XRAYUI 1 -d "$net4" -p udp --dport 53 -j RETURN
        # done

        if is_ipv6_enabled; then
            ip6tables -w -t "$IPT_TABLE" -I XRAYUI 1 -m addrtype --src-type LOCAL -j RETURN
            ip6tables -w -t "$IPT_TABLE" -I XRAYUI 2 -m addrtype --dst-type LOCAL -j RETURN
            ip6tables -w -t "$IPT_TABLE" -I XRAYUI 3 -d ff00::/8 -j RETURN
            ip6tables -w -t "$IPT_TABLE" -I XRAYUI 4 -p icmpv6 -j RETURN
        fi

    fi

    for net in $source_nets; do
        log_debug "Excluding static network $net from $IPT_TABLE."
        ipt $IPT_TABLE -A XRAYUI -d "$net" -j RETURN
    done

    if [ -n "$ipsec" ] && [ "$ipsec" != "off" ]; then
        log_debug "Adding IPSET rules for $IPT_TABLE."
        local ipset_names v6_sets=""
        ipset_names=$(ipset list -n 2>/dev/null)
        if is_ipv6_enabled &&
            printf '%s\n' "$ipset_names" | grep -qx "$IPSET_BYPASS_V6" &&
            printf '%s\n' "$ipset_names" | grep -qx "$IPSET_BYPASS_NET_V6" &&
            printf '%s\n' "$ipset_names" | grep -qx "$IPSET_PROXY_V6" &&
            printf '%s\n' "$ipset_names" | grep -qx "$IPSET_PROXY_NET_V6"; then
            v6_sets="true"
        fi

        iptables -w -t "$IPT_TABLE" -I XRAYUI 1 -m set --match-set "$IPSET_BYPASS_NET_V4" dst -j RETURN
        iptables -w -t "$IPT_TABLE" -I XRAYUI 1 -m set --match-set "$IPSET_BYPASS_V4" dst -j RETURN

        if [ "$v6_sets" = "true" ]; then
            log_debug "Adding IPv6 IPSET rules for $IPT_TABLE."
            ip6tables -w -t "$IPT_TABLE" -I XRAYUI 1 -m set --match-set "$IPSET_BYPASS_NET_V6" dst -j RETURN
            ip6tables -w -t "$IPT_TABLE" -I XRAYUI 1 -m set --match-set "$IPSET_BYPASS_V6" dst -j RETURN
        fi

        if [ "$ipsec" = "redirect" ]; then
            iptables -w -t "$IPT_TABLE" -I XRAYUI 1 -m set ! --match-set "$IPSET_PROXY_V4" dst -m set ! --match-set "$IPSET_PROXY_NET_V4" dst -j RETURN

            if [ "$v6_sets" = "true" ]; then
                ip6tables -w -t "$IPT_TABLE" -I XRAYUI 1 -m set ! --match-set "$IPSET_PROXY_V6" dst -m set ! --match-set "$IPSET_PROXY_NET_V6" dst -j RETURN
            fi
        fi
    fi

    local IPT_BASE_FLAGS="$IPT_TABLE -A XRAYUI"

    # Exclude DHCP (UDP ports 67 and 68):
    # Exclude NTP (UDP port 123)
    # Exclude tunnel UDP ports
    # Exclude UDP GlobalProtect traffic:
    ipt $IPT_BASE_FLAGS -p udp -m multiport --dports 67,68,123,500,4500,4501,51820 -j RETURN

    # Exclude multicast addresses:
    ipt $IPT_BASE_FLAGS -d 224.0.0.0/4 -j RETURN
    ipt $IPT_BASE_FLAGS -d 239.0.0.0/8 -j RETURN

    # Exclude  broadcast addresses:
    iptables -w -t "$IPT_TABLE" -A XRAYUI -m addrtype --dst-type BROADCAST -j RETURN

    # Exclude traffic in DNAT state (covers inbound port-forwards):
    ipt $IPT_BASE_FLAGS -m conntrack --ctstate DNAT -j RETURN

    # Exclude traffic destined to the Xray server:
    [ -n "$SERVER_IPS" ] && for serverip in $SERVER_IPS; do
        log_info "Excluding Xray server IP from $IPT_TABLE."
        append_rule "$IPT_TABLE" -d "$serverip" -j RETURN
    done

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
                [ -n "$ifname" ] || continue
                addrs="$(get_iface_ipv6_globals "$ifname")"
                [ -n "$addrs" ] && wan_v6_list="$wan_v6_list $addrs"
            done
            for ifname in $(printf "%s\n" "$(nvram get lan_ifname)" "$(nvram get wl0_ifname)" "$(nvram get wl1_ifname)" | sed '/^$/d'); do
                addrs="$(get_iface_ipv6_globals "$ifname")"
                [ -n "$addrs" ] && wan_v6_list="$wan_v6_list $addrs"
            done
            wan_v6_list="$(printf '%s\n' $wan_v6_list | normalize_tokens | sort -u)"
        fi

        local via_v4 via_v6
        via_v4="$(ip -4 route show | awk '$2=="via" && $1!="default"{print $1}')"
        if is_ipv6_enabled; then
            via_v6="$(ip -6 route show | awk '$2=="via" && $1!="default"{print $1}')"
        fi
        via_routes="$(printf '%s\n' $via_v4 $via_v6 | sed '/^$/d' | sort -u)"

        local static_routes
        static_routes="$(
            nvram get lan_route 2>/dev/null |
                normalize_tokens |
                grep -E '^(([0-9]{1,3}\.){3}[0-9]{1,3}|[0-9a-fA-F:]+)(/[0-9]{1,3})?$'
        )"
        # unified exclusion: WAN IP, any “via” routes, and your nvram static list
        dests="$(
            printf '%s\n' $wan_v4_list $wan_v6_list $via_routes $static_routes $SERVER_IPS |
                normalize_tokens | sort -u
        )"

        log_info "Excluding unified destinations from $IPT_TABLE."
        log_debug "Unified exclusion list: $dests"
        for dst in $dests; do
            is_default_route "$dst" && continue
            valid_ip_or_cidr "$dst" || {
                log_debug "Skipping non-IP token: $dst"
                continue
            }
            append_rule "$IPT_TABLE" -d "$dst" -j RETURN
        done
    fi

    # Exclude server ports
    server_ports=$(jq -r '.inbounds[]
    | select(.protocol != "dokodemo-door")
    | (.port | tonumber? // empty)' "$XRAY_CONFIG_FILE" | sort -u)

    if [ -n "$server_ports" ]; then
        log_info "Excluding server ports from $IPT_TABLE."
        for port in $server_ports; do
            for proto in tcp udp; do
                ipt $IPT_BASE_FLAGS -m addrtype --dst-type LOCAL -p "$proto" --dport "$port" -j RETURN
            done
            log_debug "Excluding server port $port (tcp+udp) from $IPT_TABLE."
        done
    fi

    local policies_file="/tmp/xrayui-policies.$$"
    jq -r '
        def clean: tostring | split("\n") | join(" ");
        (.routing.policies // [])
        | map(select(.enabled == true)) as $enabled
        | (if ($enabled | length) == 0 then [{ mode: "redirect", name: "all traffic to xray" }] else $enabled end)
        | .[]
        | "policy_name=" + ((.name // "") | clean | @sh)
          + " policy_mode=" + ((.mode // "bypass") | clean | @sh)
          + " policy_tcp=" + ((.tcp // "") | clean | @sh)
          + " policy_udp=" + ((.udp // "") | clean | @sh)
          + " policy_macs=" + ([.mac[]? | tostring | explode
                | map(select((. >= 48 and . <= 58) or (. >= 65 and . <= 70) or (. >= 97 and . <= 102)))
                | implode | select(length > 0)] | join(" ") | @sh)
    ' "$XRAY_CONFIG_FILE" >"$policies_file"

    # Start Redirecting traffic to the xray

    while IFS= read -r inbound; do
        local dokodemo_port dokodemo_addr protocols
        local _client_vars
        if ! _client_vars=$(echo "$inbound" | jq -r '
            "dokodemo_port=" + ((.port // "") | tostring | @sh) + "\n" +
            "dokodemo_addr=" + ((.listen // "0.0.0.0") | tostring | @sh) + "\n" +
            "protocols=" + ((.settings.network // "tcp") | tostring | @sh)
        '); then
            log_warn "Skipping malformed client inbound: failed to parse JSON"
            continue
        fi
        eval "$_client_vars"

        if [ -z "$dokodemo_port" ]; then
            log_warn "$IPT_TYPE inbound missing valid port. Skipping."
            continue
        fi

        if [ "$IPT_TYPE" = "TPROXY" ]; then
            if [ "$dokodemo_addr" != "0.0.0.0" ] && [ "$dokodemo_addr" != "::" ]; then
                local IPT_JOURNAL_FLAGS="-j TPROXY --on-port $dokodemo_port --on-ip $dokodemo_addr --tproxy-mark $tproxy_mark/$tproxy_mask"
            else
                local IPT_JOURNAL_FLAGS="-j TPROXY --on-port $dokodemo_port --tproxy-mark $tproxy_mark/$tproxy_mask"
            fi

            log_debug "TPROXY  inbound address: $dokodemo_addr:$dokodemo_port"
        else
            if [ "$dokodemo_addr" != "0.0.0.0" ] && [ "$dokodemo_addr" != "::" ]; then
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

        if [ "$IPT_TYPE" = "DIRECT" ]; then
            [ "$tcp_enabled" = "yes" ] && insert_rule filter -m addrtype --dst-type LOCAL -p tcp --dport "$dokodemo_port" -j ACCEPT
            [ "$udp_enabled" = "yes" ] && insert_rule filter -m addrtype --dst-type LOCAL -p udp --dport "$dokodemo_port" -j ACCEPT
        fi

        log_info "Apply $IPT_TYPE rules for inbound on port $dokodemo_port with protocols '$protocols'."
        [ "$tcp_enabled" = "yes" ] && apply_policy_rules "$IPT_TABLE" tcp "$policies_file" "$source_nets" $IPT_JOURNAL_FLAGS
        [ "$udp_enabled" = "yes" ] && apply_policy_rules "$IPT_TABLE" udp "$policies_file" "$source_nets" $IPT_JOURNAL_FLAGS

        # Exclude dokodemo-door port from TPROXY  destination
        log_info "Excluding dokodemo-door port $dokodemo_port from $IPT_TABLE."
        insert_rule "$IPT_TABLE" -m addrtype --dst-type LOCAL -p tcp --dport "$dokodemo_port" -j RETURN
        insert_rule "$IPT_TABLE" -m addrtype --dst-type LOCAL -p udp --dport "$dokodemo_port" -j RETURN

    done <<EOF
$inbounds
EOF
    # --- End Exclusion Rules ---

    rm -f "$policies_file"
    if [ "$IPT_TYPE" = "TPROXY" ]; then
        add_tproxy_routes "$tproxy_mark/$tproxy_mask" "$tproxy_table"
    else
        ipt $IPT_TABLE -A XRAYUI -p tcp -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
        ipt $IPT_BASE_FLAGS -j RETURN 2>/dev/null || log_error "Failed to add default rule in $IPT_TABLE chain."
    fi

    #   ipt $IPT_BASE_FLAGS -m limit --limit 10/second --limit-burst 30 -j LOG --log-prefix "XrayUI: " --log-level 4

    # Hook chain into  PREROUTING:
    log_info "Hooking XRAYUI chain into $IPT_TABLE PREROUTING."
    ipt_ensure "$IPT_TABLE" PREROUTING -A -j XRAYUI

    if [ "$POST_RESTART_DNSMASQ" = "false" ]; then
        if [ "$FIREWALL_FROM_HOOK" = "true" ] && dnsmasq_has_xrayui_block; then
            log_debug "dnsmasq already runs with the $ADDON_TITLE configuration; restart skipped."
        else
            dnsmasq_restart
        fi
    fi

    log_ok "$IPT_TYPE rules applied."
}

cleanup_firewall_rules() {

    log_info "Cleaning up Xray Client firewall rules..."
    update_loading_progress "Cleaning up Xray Client firewall rules..."

    load_xrayui_config

    # Clean up TUN inbounds
    cleanup_tun_inbounds

    # we need to collect iptables collection for ipt function
    IPT_LIST="iptables"
    if is_ipv6_enabled; then
        IPT_LIST="$IPT_LIST ip6tables"
        log_debug "IPv6 enabled: yes"
    else
        log_debug "IPv6 enabled: no"
    fi

    for tbl in filter mangle nat; do
        for hook in INPUT FORWARD PREROUTING OUTPUT; do
            ipt_remove "$tbl" "$hook" -j XRAYUI
        done

        ipt $tbl -F XRAYUI 2>/dev/null
        ipt $tbl -X XRAYUI 2>/dev/null
    done

    # Tear down the DNS leak lock (filter:OUTPUT, filter:FORWARD)
    for hook in OUTPUT FORWARD; do
        ipt_remove filter "$hook" -j XRAYUI_DNS_LOCK
    done
    ipt filter -F XRAYUI_DNS_LOCK 2>/dev/null
    ipt filter -X XRAYUI_DNS_LOCK 2>/dev/null
    ipt filter -F XRAYUI_DNS_OWNERPROBE 2>/dev/null
    ipt filter -X XRAYUI_DNS_OWNERPROBE 2>/dev/null

    if [ "$ipsec" = "redirect" ]; then
        ipset_learned_save
    else
        rm -f "$IPSET_LEARNED_FILE"
    fi

    ipset list -n 2>/dev/null | awk '/^XRAYUI_/{print $1}' | while read -r s; do
        ipset destroy "$s" 2>/dev/null || ipset flush "$s" 2>/dev/null
    done

    ipt_remove mangle FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
    ipt_remove mangle OUTPUT -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu

    for IPT in $IPT_LIST; do
        $IPT -w -t mangle -S OUTPUT 2>/dev/null |
            grep -E -- '^-A OUTPUT -m owner --uid-owner [0-9]+ -j RETURN' |
            while read -r rule; do
                # shellcheck disable=SC2086
                $IPT -w -t mangle $(echo "$rule" | sed 's/^-A /-D /') 2>/dev/null
            done
    done

    ipt mangle -D DIVERT -j MARK --set-mark $tproxy_mark/$tproxy_mask 2>/dev/null
    ipt mangle -D DIVERT -j CONNMARK --save-mark --mask $tproxy_mask 2>/dev/null
    ipt mangle -D DIVERT -j ACCEPT 2>/dev/null

    ipt_remove mangle PREROUTING -p tcp -m socket --transparent -j DIVERT

    for fam in -4 -6; do
        [ "$fam" = "-6" ] && ! is_ipv6_enabled && continue
        while ip $fam rule list | grep -q "fwmark $tproxy_mark.* lookup $tproxy_table"; do
            ip $fam rule del fwmark $tproxy_mark/$tproxy_mask lookup $tproxy_table 2>/dev/null ||
                ip $fam rule del fwmark $tproxy_mark lookup $tproxy_table 2>/dev/null || break
        done
    done

    # flush both possible tables
    for tbl in 77 8777; do
        ip route flush table "$tbl"
        if is_ipv6_enabled; then
            ip -6 route flush table "$tbl"
        fi
    done

    # Flush and remove ipsets created during configuration
    for set in "$IPSET_BYPASS_V4" "$IPSET_PROXY_V4" XRAYUI_BYPASS; do
        ipset list -n 2>/dev/null | grep -qx "$set" && {
            ipset flush "$set"
            ipset destroy "$set"
        }
    done

    if is_ipv6_enabled; then
        for set in "$IPSET_BYPASS_V6" "$IPSET_PROXY_V6" XRAYUI_BYPASS6; do
            ipset list -n 2>/dev/null | grep -qx "$set" && {
                ipset flush "$set"
                ipset destroy "$set"
            }
        done
    fi

    if [ -f "$XRAY_CONFIG_FILE" ] && has_loopback_dokodemo; then
        set_route_localnet 0
    fi

    local script="$ADDON_USER_SCRIPTS_DIR/firewall_after_cleanup"
    if [ -x "$script" ]; then
        log_info "Executing user firewall script: $script"
        "$script" "$XRAY_CONFIG_FILE" 9>&- || log_error "Error executing $script."
    fi

    if [ "$POST_RESTART_DNSMASQ" = "false" ] && dnsmasq_has_xrayui_block; then
        dnsmasq_restart
    fi

    log_ok "Xray Client firewall rules cleaned up successfully."
}

add_tproxy_routes() { # $1 = fwmark, $2 = table
    local mark="$1" tbl="$2" fam
    log_info "Adding TPROXY routes for mark $mark in table $tbl"
    for fam in -4 -6; do
        # Skip IPv6 loop if the stack is disabled
        [ "$fam" = "-6" ] && ! is_ipv6_enabled && continue

        # 1. policy-rule
        log_debug "Checking if fwmark $mark exists in ip $fam rule list"
        ip $fam rule list | grep -q "fwmark $mark" ||
            ip $fam rule add fwmark $mark lookup "$tbl" 2>/dev/null || ip $fam rule replace fwmark $mark lookup "$tbl"

        # 2. ensure “local all-/::0” route in mark table
        local local_dst
        log_debug "Ensuring local route for $fam in table $tbl"
        [ "$fam" = "-4" ] && local_dst="0.0.0.0/0" || local_dst="::/0"
        ip $fam route list table "$tbl" | grep -q "^local $local_dst" ||
            ip $fam route add local $local_dst dev lo table "$tbl" proto static exist 2>/dev/null || ip $fam route replace local $local_dst dev lo table "$tbl" proto static

        # 3. copy non-default routes from main
        log_debug "Copying non-default routes from main table to $fam table $tbl"
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

    local guest_ifs=""
    for n in 1 2 3; do
        g="$(nvram get "lan${n}_ifname" 2>/dev/null)"
        [ -n "$g" ] && guest_ifs="$guest_ifs $g"
    done
    guest_ifs="$guest_ifs $(ip -4 route show scope link 2>/dev/null |
        awk -v lan="$lan_if" '$3 ~ /^br[0-9]+$/ && $3 != lan &&
             $1 ~ /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168\.)/ {print $3}')"
    guest_ifs="$(printf '%s\n' $guest_ifs | sed '/^$/d' | sort -u)"

    local if_list="$lan_if $wl_ifs $guest_ifs"

    # Add tun*/wg* interfaces created by VPN servers
    for itf in $(ip -o link show | awk -F': ' '{print $2}' | grep -E '^(tun[0-9]+|wg[0-9]+)$'); do
        if_list="$if_list $itf"
    done

    if_list="$(printf '%s\n' $if_list | sed '/^$/d' | sort -u)"

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

port_chunks() {
    [ -n "$1" ] || return 0
    printf '%s\n' "$1" | sed 's/-/:/g' | tr -cd '0-9,:' | tr ',' '\n' | awk '
        NF && !seen[$0]++ {
            w = index($0, ":") ? 2 : 1
            if (n + w > 15) {
                print s
                s = ""
                n = 0
            }
            s = (s == "" ? $0 : s "," $0)
            n += w
        }
        END { if (s != "") print s }'
}

port_list_has() {
    local port=$1 item lo hi
    for item in $(printf '%s\n' "$2" | tr ',' ' '); do
        lo=${item%%:*}
        hi=${item##*:}
        [ "$port" -ge "$lo" ] 2>/dev/null && [ "$port" -le "$hi" ] 2>/dev/null && return 0
    done
    return 1
}

emit_policy_rules() {
    local tbl=$1 proto=$2 mode=$3 ports=$4 devices=$5 nets=$6
    shift 6
    local src dev sel chunk chunks block_quic=""
    [ "$proto" = "udp" ] && [ "$tbl" = "mangle" ] && [ "$xray_block_quic" = "true" ] && block_quic=1
    chunks=$(port_chunks "$ports")
    for src in $nets; do
        for dev in $devices; do
            sel="-s $src"
            [ "$dev" = "ANY" ] || sel="$sel -m mac --mac-source $dev"
            if [ "$mode" = "redirect" ]; then
                for chunk in $chunks; do
                    append_rule "$tbl" $sel -p "$proto" -m multiport --dports "$chunk" -j RETURN
                done
                [ -n "$block_quic" ] && append_rule "$tbl" $sel -p udp --dport 443 -j DROP
                append_rule "$tbl" $sel -p "$proto" "$@"
            else
                for chunk in $chunks; do
                    [ -n "$block_quic" ] && port_list_has 443 "$chunk" && append_rule "$tbl" $sel -p udp --dport 443 -j DROP
                    append_rule "$tbl" $sel -p "$proto" -m multiport --dports "$chunk" "$@"
                done
                append_rule "$tbl" $sel -p "$proto" -j RETURN
            fi
        done
    done
}

apply_policy_rules() {
    local tbl=$1 proto=$2 policies=$3 nets=$4
    shift 4
    local line pass ports everyone_mode="" everyone_ports="" device_redirect=""
    local policy_name policy_mode policy_tcp policy_udp policy_macs
    for pass in devices everyone; do
        while IFS= read -r line; do
            [ -n "$line" ] || continue
            eval "$line"
            case "$policy_mode" in
            redirect | bypass) ;;
            *) continue ;;
            esac
            if [ "$proto" = "tcp" ]; then
                ports=$policy_tcp
            else
                ports=$policy_udp
            fi
            if [ "$pass" = "devices" ]; then
                [ -n "$policy_macs" ] || continue
                [ "$policy_mode" = "redirect" ] && device_redirect=1
                log_info "Applying policy: $policy_name, MODE: $policy_mode, protocol: $proto"
                emit_policy_rules "$tbl" "$proto" "$policy_mode" "$ports" "$policy_macs" "$nets" "$@"
                continue
            fi
            [ -z "$policy_macs" ] || continue
            if [ -z "$everyone_mode" ]; then
                everyone_mode=$policy_mode
            elif [ "$policy_mode" != "$everyone_mode" ]; then
                log_warn "Skipping policy $policy_name: all-devices policies must share one mode ($everyone_mode), protocol: $proto"
                continue
            fi
            [ -n "$ports" ] && everyone_ports="${everyone_ports:+$everyone_ports,}$ports"
            log_info "Applying policy: $policy_name, MODE: $policy_mode, protocol: $proto"
        done <"$policies"
    done
    if [ -n "$everyone_mode" ]; then
        emit_policy_rules "$tbl" "$proto" "$everyone_mode" "$everyone_ports" ANY "$nets" "$@"
    elif [ -z "$device_redirect" ]; then
        emit_policy_rules "$tbl" "$proto" redirect "" ANY "$nets" "$@"
    fi
}

resolve_host_ips() {
    nslookup "$1" 2>/dev/null | awk '/^Address/{print $3}'
    [ -z "$2" ] && ping -c1 -W1 "$1" 2>/dev/null | sed -n 's/.*(\([0-9a-fA-F:.]*\)).*/\1/p'
}
