#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

start() {

    load_xrayui_config

    migrate_tun_inbounds_config

    cleanup_stale_asdfiles

    # Prevent duplicate starts - check if the Xray daemon is already running
    local existing_pid=$(get_xray_daemon_pid)
    if [ -n "$existing_pid" ]; then
        if [ "${FORCE_RESTART:-false}" = "true" ]; then
            log_warn "Xray daemon (PID: $existing_pid) is still running during restart. Forcing it to stop."
            kill_xray_daemon -9

            local tries=0
            while [ -n "$(get_xray_daemon_pid)" ] && [ "$tries" -lt 5 ]; do
                sleep 1
                tries=$((tries + 1))
            done

            rm -f "$XRAY_PIDFILE"

            existing_pid=$(get_xray_daemon_pid)
            if [ -n "$existing_pid" ]; then
                log_error "Failed to force-stop the Xray daemon (PID: $existing_pid). Aborting start."
                return 1
            fi
        else
            log_warn "Xray is already running (PID: $existing_pid). Skipping start."
            if ! firewall_is_configured; then
                log_warn "Xray firewall rules are missing while Xray is running. Restoring them."
                configure_firewall
            fi
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
    if api_config_required; then

        api_apply_configuration

        local xray_config_name=$(basename "$XRAY_CONFIG_FILE")
        local xray_api_config="/opt/etc/xray/xrayui/${xray_config_name%.json}-api.json"

        local XRAY_EXTRA_CFG=""
        if [ -f "$xray_api_config" ]; then
            XRAY_EXTRA_CFG="-c $xray_api_config"
            log_info "Loading API extension $xray_api_config."
        else
            log_info "No API extension for $(basename "$XRAY_CONFIG_FILE"); running plain config."
        fi
    fi

    process_subscriptions "$XRAY_CONFIG_FILE"

    XRAY_ARGS="-c $XRAY_CONFIG_FILE $XRAY_EXTRA_CFG"
    log_debug "Starting Xray with args: $XRAY_ARGS"
    $IONICE $NICE xray $XRAY_ARGS </dev/null >/dev/null 2>&1 3>&- 4>&- 5>&- 6>&- 7>&- 8>&- 9>&- 387>&- 386>&- &
    echo $! >"$XRAY_PIDFILE"
    log_debug "Xray started with PID $(cat "$XRAY_PIDFILE")"
    autorestart_forget_attempts

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
    local rc=0
    local pid
    local own_lock=false
    if [ "$XRAY_RESTART_LOCK_HELD" != "true" ]; then
        # Waits for a restart, including one by the auto-restart watchdog, so Xray ends up stopped.
        xray_restart_lock 120 || log_warn "Timed out waiting for the running restart to finish. Stopping anyway."
        own_lock=true
    fi

    log_info "Stopping $ADDON_TITLE"

    update_loading_progress "Stopping $ADDON_TITLE"

    if [ -f "$XRAY_PIDFILE" ]; then
        rm -f "$XRAY_PIDFILE"
        log_info "PID file $XRAY_PIDFILE removed successfully."
    fi

    if [ -n "$(get_xray_daemon_pid)" ]; then
        kill_xray_daemon -TERM

        local waited=0
        while [ -n "$(get_xray_daemon_pid)" ] && [ "$waited" -lt 10 ]; do
            log_debug "Waiting for Xray to stop... ($waited/10)"
            update_loading_progress "Waiting for Xray to stop... ($waited/10)"
            sleep 1
            waited=$((waited + 1))
        done

        if [ -n "$(get_xray_daemon_pid)" ]; then
            log_warn "Xray did not stop in time. Sending SIGKILL."
            kill_xray_daemon -9
            sleep 1
        fi

        for pid in $(get_xray_daemon_pids); do
            log_error "Xray daemon is still running after SIGKILL (PID: $pid)."
            rc=1
        done
    else
        log_info "Xray daemon is not running."
    fi

    cleanup_firewall

    cleanup_stale_asdfiles

    [ "$own_lock" = "true" ] && xray_restart_unlock
    return "$rc"
}

restart() {
    local lock_acquired=false
    local waited=0

    if [ "$XRAY_RESTART_LOCK_HELD" != "true" ] && which flock >/dev/null 2>&1 && touch "$XRAY_RESTART_LOCKFILE" 2>/dev/null; then
        eval exec "$XRAY_RESTART_LOCK_FD>$XRAY_RESTART_LOCKFILE"
        lock_acquired=true

        while ! flock -n "$XRAY_RESTART_LOCK_FD"; do
            if [ "$waited" -ge 120 ]; then
                log_warn "Timed out waiting for the running restart to finish. Restarting anyway."
                break
            fi
            if [ "$waited" -eq 0 ]; then
                log_warn "Another restart is already in progress. Waiting for it to finish..."
            fi
            update_loading_progress "Another restart is in progress. Waiting..."
            sleep 2
            waited=$((waited + 2))
        done
        XRAY_RESTART_LOCK_HELD=true
    fi

    log_info "Restarting $ADDON_TITLE"

    POST_RESTART_DNSMASQ="true"

    stop

    FORCE_RESTART=true
    start
    local start_rc=$?
    FORCE_RESTART=false

    if [ "$POST_RESTART_DNSMASQ" = "true" ]; then
        dnsmasq_restart
    fi

    POST_RESTART_DNSMASQ="false"

    if [ "$lock_acquired" = "true" ]; then
        xray_restart_unlock
    fi

    return "$start_rc"
}

# The restart lock serializes restart(), stop(), failover and the auto-restart watchdog.
# $1: seconds to wait for it. Returns 1 if it is still busy then; the lock is not held in that case.
# Without flock there is nothing to wait for and it returns 0.
xray_restart_lock() {
    local max_wait="${1:-0}" waited=0
    which flock >/dev/null 2>&1 && touch "$XRAY_RESTART_LOCKFILE" 2>/dev/null || return 0
    eval exec "$XRAY_RESTART_LOCK_FD>$XRAY_RESTART_LOCKFILE"
    while ! flock -n "$XRAY_RESTART_LOCK_FD"; do
        if [ "$waited" -ge "$max_wait" ]; then
            eval exec "$XRAY_RESTART_LOCK_FD>&-"
            return 1
        fi
        sleep 2
        waited=$((waited + 2))
    done
    XRAY_RESTART_LOCK_HELD=true
}

xray_restart_unlock() {
    XRAY_RESTART_LOCK_HELD=false
    flock -u "$XRAY_RESTART_LOCK_FD" 2>/dev/null
    eval exec "$XRAY_RESTART_LOCK_FD>&-"
}

# A start by hand, from the UI or by any restart other than the watchdog's gives the watchdog all its attempts back.
# The watchdog's own restarts keep counting, so Xray that keeps dying before the next check still runs out of attempts.
autorestart_forget_attempts() {
    [ "$XRAY_AUTORESTART_RECOVERING" = "true" ] || rm -f "$XRAY_AUTORESTART_STATE_FILE"
}

# Called by the xrayui_autorestart cron job. Restarts Xray when it died on its own.
# The PID file is the desired-state flag: start() writes it, stop() removes it, a crash leaves it behind.
# State file: "<attempts> <epoch of the last attempt> <1 once the attempts ran out>".
autorestart_check() {
    load_xrayui_config

    if [ "${xray_autorestart:-false}" != "true" ]; then
        rm -f "$XRAY_AUTORESTART_STATE_FILE"
        return 0
    fi

    local attempts=0 last=0 gaveup=0
    if [ -f "$XRAY_AUTORESTART_STATE_FILE" ]; then
        read -r attempts last gaveup <"$XRAY_AUTORESTART_STATE_FILE"
        case "$attempts" in '' | *[!0-9]*) attempts=0 ;; esac
        case "$last" in '' | *[!0-9]*) last=0 ;; esac
    fi

    if [ -n "$(get_xray_daemon_pid)" ]; then
        if [ "$attempts" -gt 0 ]; then
            log_notice "Xray is running again after $attempts automatic restart attempt(s)."
        fi
        rm -f "$XRAY_AUTORESTART_STATE_FILE"
        return 0
    fi

    # A stop, restart or failover switch in progress holds the restart lock. Keep holding it from here on:
    # a Stop that comes in now waits until the restart below is done, so the restart cannot undo it.
    if ! xray_restart_lock 0; then
        log_debug "A restart is in progress. Skipping the Xray auto-restart check."
        return 0
    fi
    autorestart_recover "$attempts" "$last" "$gaveup"
    xray_restart_unlock
    return 0
}

# Runs with the restart lock held, so the PID file and the process can be trusted.
autorestart_recover() {
    local attempts="$1" last="$2" gaveup="$3"

    if [ ! -f "$XRAY_PIDFILE" ]; then
        rm -f "$XRAY_AUTORESTART_STATE_FILE"
        return 0
    fi
    [ -z "$(get_xray_daemon_pid)" ] || return 0

    local retries=$(sanitize_autorestart_number "$xray_autorestart_retries" 3 100)
    local delay=$(sanitize_autorestart_number "$xray_autorestart_delay" 10 1440)

    if [ "$retries" -gt 0 ] && [ "$attempts" -ge "$retries" ]; then
        if [ "$gaveup" != "1" ]; then
            log_error "Xray is still not running after $attempts automatic restart attempt(s). Giving up until Xray is started again."
            echo "$attempts $last 1" >"$XRAY_AUTORESTART_STATE_FILE"
        fi
        return 0
    fi

    local now=$(date +%s)
    # 30 s of slack, so a delay equal to the check interval is not missed by a few seconds of cron jitter.
    if [ "$attempts" -gt 0 ] && [ $((now - last)) -lt $((delay * 60 - 30)) ]; then
        log_debug "Xray is not running. The next automatic restart attempt is due $delay minute(s) after the last one."
        return 0
    fi

    attempts=$((attempts + 1))
    echo "$attempts $now 0" >"$XRAY_AUTORESTART_STATE_FILE"

    local of=""
    [ "$retries" -gt 0 ] && of="/$retries"
    log_warn "Xray was not running, restarting (attempt $attempts$of)"
    XRAY_AUTORESTART_RECOVERING=true
    restart
    XRAY_AUTORESTART_RECOVERING=false
}
