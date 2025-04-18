#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

startup() {
    log_ok "Starting $ADDON_TITLE..."

    local skipwait=${skipwait:-false}

    remount_ui
    cron_jobs_add

    local xray_pid=$(get_proc "xray")

    if [ "$(am_settings_get xray_startup)" = "y" ]; then
        log_ok "Xray service is enabled by XRAYUI. Starting Xray service..."

        if [ "$skipwait" = "false" ]; then
            log_ok "Waiting for network and iptable rules to be ready..."
            sleep 60 # wait for network and iptable rules to be ready
        fi
        restart
    elif [ -n "$xray_pid" ]; then
        log_ok "Xray service is disabled by XRAYUI. Force stopping Xray service..."
        stop
    else
        log_ok "Xray service is disabled by XRAYUI. Xray service is not running."
    fi
}
