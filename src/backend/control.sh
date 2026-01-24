#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

start() {

    load_xrayui_config

    # Prevent duplicate starts - check if Xray is already running
    local existing_pid=$(get_proc "xray")
    if [ -n "$existing_pid" ]; then
        log_warn "Xray is already running (PID: $existing_pid). Skipping start."
        return 0
    fi

    local skip_test="${skip_test:-false}"

    if [ "$skip_test" = "true" ]; then
        log_info "Skipping Xray configuration test as per user settings."
    else
        test_xray_config
    fi

    log_info "Starting $ADDON_TITLE"

    local TPROXY_MODE=$(
        jq -r '
    .inbounds? // []
    | map(.streamSettings.sockopt.tproxy? // "off")
    | if any(. != "off") then "on" else "off" end
  ' "$XRAY_CONFIG_FILE"
    )

    if [ "$TPROXY_MODE" = "on" ]; then
        log_info "TPROXY mode is $TPROXY_MODE. Increasing max open files to 65535."
        ulimit -Hn 65535
        ulimit -Sn 65535
    fi

    local xray_clear_logs=${logs_dor:-false}
    if [ "$xray_clear_logs" = "true" ]; then
        log_info "Clearing Xray logs..."
        rm -f "$ADDON_LOGS_DIR/xray_access.log"
        rm -f "$ADDON_LOGS_DIR/xray_error.log"
        rm -f "$ADDON_LOGS_DIR/xrayui_ip2domain.cache"
    fi

    if [ ! -d "$ADDON_LOGS_DIR" ]; then
        mkdir -p "$ADDON_LOGS_DIR"
    fi

    update_loading_progress "Starting $ADDON_TITLE..."
    if [ "$clients_check" = "true" ] || [ "$check_connection" = "true" ]; then

        api_apply_configuration

        local xray_config_name=$(basename "$XRAY_CONFIG_FILE")
        local xray_api_config="/opt/etc/xray/xrayui/${xray_config_name%.json}-api.json"

        local XRAY_EXTRA_CFG=""
        if [ -f "$xray_api_config" ]; then
            XRAY_EXTRA_CFG="-c $xray_api_config"
            log_info "API extension $xray_api_config found – enabling per-user stats."
        else
            log_info "No API extension for $(basename "$XRAY_CONFIG_FILE"); running plain config."
        fi
    fi

    process_subscriptions "$XRAY_CONFIG_FILE"

    XRAY_ARGS="-c $XRAY_CONFIG_FILE $XRAY_EXTRA_CFG"
    log_debug "Starting Xray with args: $XRAY_ARGS"
    $IONICE $NICE xray $XRAY_ARGS >/dev/null 2>&1 &
    echo $! >"$XRAY_PIDFILE"
    log_debug "Xray started with PID $(cat "$XRAY_PIDFILE")"

    xray_sleep_time="${xray_sleep_time:-10}"
    if [ "$xray_sleep_time" -gt 0 ]; then
        i=1
        while [ "$i" -le "$xray_sleep_time" ]; do
            update_loading_progress "Waiting $i/$xray_sleep_time seconds for Xray to initialize..."
            log_debug "Waiting $i/$xray_sleep_time seconds for Xray to initialize..."
            sleep 1
            i=$((i + 1))
        done
    fi

    configure_firewall
}

stop() {
    log_info "Stopping $ADDON_TITLE"

    update_loading_progress "Stopping $ADDON_TITLE"

    killall xray
    if [ -f "$XRAY_PIDFILE" ]; then
        rm -f "$XRAY_PIDFILE"
        log_info "PID file $XRAY_PIDFILE removed successfully."
    fi

    cleanup_firewall
}

restart() {
    log_info "Restarting $ADDON_TITLE"

    POST_RESTART_DNSMASQ="true"

    stop
    log_debug "Waiting for Xray to stop..."
    sleep 4
    start

    if [ "$POST_RESTART_DNSMASQ" = "true" ]; then
        dnsmasq_restart
    fi

    POST_RESTART_DNSMASQ="false"
}
