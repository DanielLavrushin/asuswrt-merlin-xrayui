#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables
diagnostics_hdr() { printf '\n=== %s ===\n' "$*"; }

diagnostics_env() {
    log_info "Running environment diagnostics for $ADDON_TITLE"
    COLLECT=0
    [ "$1" = "collect" ] && COLLECT=1

    TS=$(date +%Y%m%d_%H%M%S)
    TMPLOG=/tmp/xrayui_diag_$TS.log
    TARBALL=/tmp/xrayui_diag_$TS.tgz

    # if collect → duplicate output into $TMPLOG
    if [ "$COLLECT" -eq 1 ]; then
        exec 3>&1 # keep original stdout on fd 3
        exec >"$TMPLOG"
    fi

    sub() { printf '\n--- %s ---\n' "$*"; }

    log_ok $(diagnostics_hdr "Device / firmware")
    log_log $(uname -a)
    log_log $(nvram get productid 2>/dev/null || true)
    log_log $(nvram get buildno 2>/dev/null || true)

    log_ok $(diagnostics_hdr "Kernel modules of interest")
    log_log $(lsmod | grep -E '(^Module|xt_|nf_conntrack|tproxy|wireguard|tun)' || true)

    log_ok $(diagnostics_hdr "Uptime / load / mem / storage")
    log_log $(uptime)

    log_ok $(diagnostics_hdr "Router features:")
    log_log $(nvram get rc_support 2>/dev/null || true)

}

diagnostics_xrayui() {
    log_info "Running XrayUI diagnostics for $ADDON_TITLE"

    load_xrayui_config

    log_info "XRAY Config location:"
    log_log "$XRAY_CONFIG_FILE" 2>&1
    log_info "--------------------------------------------------------"
    log_info

    log_info "XRAYUI_CONFIG_FILE $XRAYUI_CONFIG_FILE:"
    cat "$XRAYUI_CONFIG_FILE" 2>&1
    log_info "--------------------------------------------------------"

    log_ok "XrayUI diagnostics completed successfully"
}

diagnostics_xray() {
    log_info "Running Xray diagnostics for $ADDON_TITLE"

    load_xrayui_config

    log_info "version info:"
    show_version 2>&1
    log_info "--------------------------------------------------------"
    log_info

    log_info "Xray config:"
    cat "$XRAY_CONFIG" 2>&1
    log_info "--------------------------------------------------------"
    log_info

    log_ok "Xray diagnostics completed successfully"
}

diagnostics_iptables() {
    log_info "Running iptables diagnostics for $ADDON_TITLE"

    load_xrayui_config

    log_info "version info:"
    show_version 2>&1
    log_info "--------------------------------------------------------"
    log_info

    log_info "raw/PREROUTING (v4):"
    iptables -t raw -nvL PREROUTING
    log_info "raw/OUTPUT    (v4):"
    iptables -t raw -nvL OUTPUT
    log_info --------------------------------------------------------

    log_info "iptables -t nat -nvL PREROUTING:"
    iptables -t nat -nvL PREROUTING 2>&1
    log_info "--------------------------------------------------------"
    log_info

    log_info "iptables -t nat -nvL XRAYUI:"
    iptables -t nat -nvL XRAYUI 2>&1
    log_info "--------------------------------------------------------"
    log_info

    log_info "iptables -t mangle -nvL PREROUTING:"
    iptables -t mangle -nvL PREROUTING 2>&1
    log_info "--------------------------------------------------------"
    log_info

    log_info "iptables -t mangle -nvL XRAYUI:"
    iptables -t mangle -nvL XRAYUI 2>&1
    log_info "--------------------------------------------------------"
    log_info

    log_info "iptables -t mangle -nvL OUTPUT:"
    iptables -t mangle -nvL OUTPUT 2>&1
    log_info "--------------------------------------------------------"
    log_info

    log_info "iptables -t mangle -L XRAYUI --line-numbers:"
    iptables -t mangle -L XRAYUI --line-numbers 2>&1
    log_info "--------------------------------------------------------"
    log_info

    log_info "PREROUTING INPUT FORWARD OUTPUT:"
    for tbl in mangle filter; do
        for ch in PREROUTING INPUT FORWARD OUTPUT; do
            if iptables -t "$tbl" -C "$ch" -j XRAYUI 2>/dev/null; then
                hits=$(iptables -t "$tbl" -nvL "$ch" |
                    awk '$3=="XRAYUI" {print $1, $2; exit}')
                hits=${hits:-"0 0"}
                echo "$tbl/$ch  hits: $hits"
            fi
        done
    done
    log_info "--------------------------------------------------------"

    log_info "policy rules (all families):"
    ip -4 rule show
    ip -6 rule show 2>/dev/null
    log_info --------------------------------------------------------

    log_info "table $tproxy_table routes (v4 / v6):"
    ip -4 route show table $tproxy_table
    ip -6 route show table $tproxy_table 2>/dev/null
    log_info --------------------------------------------------------

    log_info "ip rule-lookup for 8.8.8.8:"
    ip route get 8.8.8.8 mark 0x10000
    log_info --------------------------------------------------------

    log_info "relevant kernel modules:"
    lsmod | grep -E 'xt_(TPROXY|socket|mark)' || true
    log_info --------------------------------------------------------

    if is_ipv6_enabled; then
        log_info "ip6tables -t filter -nvL XRAYUI:"
        ip6tables -t filter -nvL XRAYUI 2>&1
        log_info "--------------------------------------------------------"
        log_info

        log_info "ip6tables -t mangle -nvL XRAYUI:"
        ip6tables -t mangle -nvL XRAYUI 2>&1
        log_info "--------------------------------------------------------"
        log_info

    fi
    log_info "ip rule show:"
    ip rule show 2>&1
    log_info "--------------------------------------------------------"
    log_info

    log_info "ip route show table main:"
    ip route show table main 2 >&1
    log_info "--------------------------------------------------------"
    log_info

    log_info "external ip address:"
    curl -s ifconfig.me 2>&1
    log_info
    log_info "--------------------------------------------------------"
    log_info

    log_ok "iptables diagnostics completed successfully"
}
