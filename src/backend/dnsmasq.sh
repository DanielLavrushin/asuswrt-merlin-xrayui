#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

dnsmasq_configure() {
    local CONFIG=$1
    load_ui_response
    load_xrayui_config

    log_debug "Configuring dnsmasq..."

    log_debug "config: $CONFIG"
    log_debug "XRAY_CONFIG_FILE: $XRAY_CONFIG_FILE"
    log_debug "dnsmasq flag: $dnsmasq"

    pc_append "" "$CONFIG"
    pc_append "#$ADDON_TAG start" "$CONFIG"

    if [ "$dnsmasq" = "true" ]; then

        grep -qE '^log-queries' "$CONFIG" || pc_append "log-queries" "$CONFIG" >/dev/null && log_debug "log-queries enabled"
        grep -qE '^log-async' "$CONFIG" || pc_append "log-async=25" "$CONFIG" >/dev/null && log_debug "log-async enabled"
        grep -qE '^log-facility' "$CONFIG" || pc_append "log-facility=/opt/var/log/dnsmasq.log" "$CONFIG" >/dev/null && log_debug "log-facility enabled"
    fi

    if jq -e '
       .inbounds[]
        | select(.protocol == "dokodemo-door")
        | select((.listen // "127.0.0.1") != "0.0.0.0")
        | "\(.listen // "127.0.0.1")#\(.port)"
  ' "$XRAY_CONFIG_FILE" >/dev/null; then
        log_debug "dnsmasq: found inbound DNS server"
        #  pc_append "no-resolv" "$CONFIG" && log_debug "dnsmasq: no-resolv enabled"
        jq -r '
       .inbounds[]
        | select(.protocol == "dokodemo-door")
        | select((.listen // "127.0.0.1") != "0.0.0.0")
        | "\(.listen // "127.0.0.1")#\(.port)"
  ' "$XRAY_CONFIG_FILE" |
            while IFS= read -r srv; do
                pc_append "server=$srv" "$CONFIG" && log_debug "dnsmasq: added inbound DNS server=$srv"
            done
    fi
    pc_append "#$ADDON_TAG end" "$CONFIG"

    log_debug "dnsmasq configured"
}
