#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

start() {

    load_xrayui_config

    cleanup_stale_asdfiles

    # Prevent duplicate starts - check if Xray *daemon* is already running
    # (ignore short-lived "xray api ..." helpers from UI polling)
    local existing_pid=$(get_xray_daemon_pid)
    if [ -n "$existing_pid" ]; then
        if [ "${FORCE_RESTART:-false}" = "true" ]; then
            local tries=0
            while [ -n "$existing_pid" ] && [ "$tries" -lt 5 ]; do
                log_warn "Xray daemon still running (PID: $existing_pid) during restart; forcing stop ($tries/5)"
                kill_xray_daemon -9
                rm -f "$XRAY_PIDFILE"
                sleep 1
                existing_pid=$(get_xray_daemon_pid)
                tries=$((tries + 1))
            done
            if [ -n "$existing_pid" ]; then
                log_error "Failed to force-stop Xray daemon (PID: $existing_pid)"
                return 1
            fi
        else
            log_warn "Xray is already running (PID: $existing_pid). Skipping start."
            # Safety: if firewall was cleaned by a concurrent stop/restart, restore rules
            configure_firewall
            return 0
        fi
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

    local HAS_WG_OUTBOUND=$(
        jq -r '
    .outbounds? // []
    | map(.protocol? // "")
    | if any(. == "wireguard") then "yes" else "no" end
  ' "$XRAY_CONFIG_FILE"
    )

    if [ "$HAS_WG_OUTBOUND" = "yes" ]; then
        local svm_path="/proc/sys/net/ipv4/conf/all/src_valid_mark"
        if [ ! -e "$svm_path" ]; then
            log_warn "WireGuard outbound detected but $svm_path is unavailable; gVisor outbound may not work."
        else
            local current_svm=$(cat "$svm_path" 2>/dev/null)
            if [ "$current_svm" != "1" ]; then
                log_info "WireGuard outbound detected. Setting net.ipv4.conf.all.src_valid_mark=1."
                if ! { sysctl -w net.ipv4.conf.all.src_valid_mark=1 >/dev/null 2>&1 ||
                    echo 1 >"$svm_path" 2>/dev/null; }; then
                    log_warn "Failed to set net.ipv4.conf.all.src_valid_mark=1; WireGuard gVisor outbound may not work."
                fi
            fi
        fi
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

    if [ -n "$(get_xray_daemon_pid)" ]; then
        kill_xray_daemon -TERM

        # Wait up to ~10s for daemon exit (ignore "xray api" helpers)
        local i=0
        while [ -n "$(get_xray_daemon_pid)" ] && [ "$i" -lt 10 ]; do
            log_debug "Waiting for Xray to stop... ($i/10)"
            update_loading_progress "Waiting for Xray to stop... ($i/10)"
            sleep 1
            i=$((i + 1))
        done

        if [ -n "$(get_xray_daemon_pid)" ]; then
            log_warn "Xray did not stop in time, sending SIGKILL"
            kill_xray_daemon -9
            sleep 1
        fi
    fi

    # Sweep leftover helpers so they cannot race the upcoming start()
    killall -9 xray 2>/dev/null

    if [ -n "$(get_xray_daemon_pid)" ]; then
        log_error "Xray daemon is still running after SIGKILL"
    fi

    if [ -f "$XRAY_PIDFILE" ]; then
        rm -f "$XRAY_PIDFILE"
        log_info "PID file $XRAY_PIDFILE removed successfully."
    else
        rm -f "$XRAY_PIDFILE"
    fi

    cleanup_firewall

    cleanup_stale_asdfiles
}

restart() {
    # Serialize restarts atomically. Wait (do not skip) so UI double-fires
    # and apply+restart still complete instead of aborting every other click.
    local RESTART_LOCK="/tmp/xrayui_restart.lock"
    local RESTART_FD=387
    eval exec "$RESTART_FD>$RESTART_LOCK"
    if ! flock -n "$RESTART_FD"; then
        log_warn "Restart already in progress; waiting for lock..."
        update_loading_progress "Restart already in progress; waiting..."
        flock -x "$RESTART_FD"
    fi

    log_info "Restarting $ADDON_TITLE"

    POST_RESTART_DNSMASQ="true"

    stop
    # stop() already waits for daemon death / SIGKILL; no blind sleep needed
    FORCE_RESTART=true start
    local start_rc=$?

    if [ "$POST_RESTART_DNSMASQ" = "true" ]; then
        dnsmasq_restart
    fi

    POST_RESTART_DNSMASQ="false"

    flock -u "$RESTART_FD"
    return "$start_rc"
}
