#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

start() {

    load_xrayui_config
    test_xray_config

    printlog true "Starting $ADDON_TITLE"

    local TPROXY_MODE="$(jq -r '.inbounds[0].streamSettings.sockopt.tproxy // "off"' "$XRAY_CONFIG_FILE")"
    if [ "$TPROXY_MODE" != "off" ]; then
        printlog true "TPROXY mode is $TPROXY_MODE. Increasing max open files to 65535."
        ulimit -Hn 65535
        ulimit -Sn 65535
    fi

    local xray_clear_logs=${logs_dor:-false}
    if [ "$xray_clear_logs" = "true" ]; then
        printlog true "Clearing Xray logs..."
        rm -f "$ADDON_LOGS_DIR/xray_access.log"
        rm -f "$ADDON_LOGS_DIR/xray_error.log"
    fi

    update_loading_progress "Starting $ADDON_TITLE..."
    xray -c "$XRAY_CONFIG_FILE" >/dev/null 2>&1 &
    echo $! >$XRAY_PIDFILE

    configure_firewall
}

stop() {
    printlog true "Stopping $ADDON_TITLE"

    update_loading_progress "Stopping $ADDON_TITLE"

    killall xray
    if [ -f "$XRAY_PIDFILE" ]; then
        rm -f "$XRAY_PIDFILE"
        printlog true "PID file $XRAY_PIDFILE removed successfully."
    fi

    cleanup_firewall
}

restart() {
    printlog true "Restarting $ADDON_TITLE"
    stop
    sleep 4
    start
}
