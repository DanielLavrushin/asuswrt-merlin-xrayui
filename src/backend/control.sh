#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

start() {

    load_xrayui_config
    test_xray_config

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
    fi

    if [ ! -d "$ADDON_LOGS_DIR" ]; then
        mkdir -p "$ADDON_LOGS_DIR"
    fi

    update_loading_progress "Starting $ADDON_TITLE..."
    xray -c "$XRAY_CONFIG_FILE" >/dev/null 2>&1 &
    echo $! >$XRAY_PIDFILE

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
    stop
    sleep 4
    start
}
