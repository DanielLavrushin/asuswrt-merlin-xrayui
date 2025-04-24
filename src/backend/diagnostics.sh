#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

diagnostics_iptables() {
    log_info_box "Running iptables diagnostics for $ADDON_TITLE"

    load_xrayui_config

    log_info "version info:"
    show_version 2>&1
    log_info "--------------------------------------------------------"
    log_info

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

    log_box "iptables diagnostics completed successfully"
}
