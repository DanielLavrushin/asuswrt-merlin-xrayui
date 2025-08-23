#!/bin/sh
# shellcheck disable=SC2034

rtls_scan_start() {
    # Perform the RTLS scan
    log_info "Start RTLS scanning..."
    load_xrayui_config

    local rtls_bin="$ADDON_SHARE_DIR/rtls-scanner"
    local rtlsrequest=$(reconstruct_payload)

    local rtlsipaddr=$(echo "$rtlsrequest" | jq -r '.ip')
    local rtlscidr=$(echo "$rtlsrequest" | jq -r '.cidr')
    local rtls_timeout=$(echo "$rtlsrequest" | jq -r '.timeout')
    local rtls_threads=$(echo "$rtlsrequest" | jq -r '.threads')

    log_debug "RTLS scan parameters: IP=$rtlsipaddr, CIDR=$rtlscidr, Timeout=$rtls_timeout, Threads=$rtls_threads"

    mkdir -p "$ADDON_SHARE_DIR/logs"
    rm -rf "$ADDON_SHARE_DIR/logs/rtls.log"
    rm -rf "$ADDON_SHARE_DIR/logs/rtls-results.log"

    local rtls_args="-addr $rtlsipaddr$rtlscidr -timeout $rtls_timeout -thread $rtls_threads -out $ADDON_SHARE_DIR/logs/rtls-results.log -mmdb $ADDON_SHARE_DIR/Country.mmdb -cps 200 -fallback -alpn h2"

    $IONICE $NICE "$rtls_bin" $rtls_args >"$ADDON_SHARE_DIR/logs/rtls.log" 2>&1

    log_info "Scanning completed" >>"$ADDON_SHARE_DIR/logs/rtls-results.log"

    log_ok "RTLS scanning completed."
}

rtls_scan_stop() {
    log_info "Stopping RTLS scanning..."
    killall rtls-scanner
    log_ok "RTLS scanning stopped."
}
