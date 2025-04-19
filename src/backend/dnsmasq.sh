#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

dnsmasq_configure() {
    local CONFIG=$1
    load_ui_response

    log_debug "Configuring dnsmasq..."

    log_debug "config: $CONFIG"
    log_debug "dnsmasq flag: $dnsmasq"

    pc_append "" "$CONFIG"
    pc_append "#$ADDON_TAG start" "$CONFIG"

    if [ "$dnsmasq" = "true" ]; then

        grep -qE '^log-queries' "$CONFIG" || pc_append "log-queries" "$CONFIG" >/dev/null && log_debug "log-queries enabled"
        grep -qE '^log-async' "$CONFIG" || pc_append "log-async=25" "$CONFIG" >/dev/null && log_debug "log-async enabled"
        grep -qE '^log-facility' "$CONFIG" || pc_append "log-facility=/opt/var/log/dnsmasq.log" "$CONFIG" >/dev/null && log_debug "log-facility enabled"
    fi

    pc_append "#$ADDON_TAG end" "$CONFIG"

    log_debug "dnsmasq configured"
}
