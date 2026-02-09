#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

startup() {
    # Use a lock file to prevent concurrent startup executions
    local STARTUP_LOCK="/tmp/xrayui_startup.lock"

    # Check if startup is already in progress
    if [ -f "$STARTUP_LOCK" ]; then
        local lock_pid=$(cat "$STARTUP_LOCK" 2>/dev/null)
        if [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
            log_warn "Startup already in progress (PID: $lock_pid). Skipping duplicate startup."
            return 0
        fi
        rm -f "$STARTUP_LOCK"
    fi

    echo $$ >"$STARTUP_LOCK"

    trap 'rm -f "$STARTUP_LOCK"' EXIT

    log_ok "Starting $ADDON_TITLE..."

    load_xrayui_config

    local skipwait=${skipwait:-false}
    local startup_delay=${startup_delay:-0}
    remount_ui
    cron_jobs_add

    local xray_pid=$(get_proc "xray")

    if [ "$(am_settings_get xray_startup)" = "y" ]; then
        log_ok "Xray service is enabled by XRAYUI. Starting Xray service..."

        if [ "$skipwait" = "false" ]; then
            log_ok "Waiting for network and iptable rules to be ready..."
            if [ "$startup_delay" -gt 0 ]; then
                log_ok "Waiting for $startup_delay seconds before starting Xray service..."
                sleep "$startup_delay"
            fi
        fi

        rm -f "$STARTUP_LOCK"
        trap - EXIT

        restart
    elif [ -n "$xray_pid" ]; then
        log_ok "Xray service is disabled by XRAYUI. Force stopping Xray service..."
        stop
    else
        log_ok "Xray service is disabled by XRAYUI. Xray service is not running."
    fi

    initial_response

    # Remove lock file
    rm -f "$STARTUP_LOCK"
    trap - EXIT
}
