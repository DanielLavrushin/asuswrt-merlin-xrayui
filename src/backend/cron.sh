#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

CRU_GEOUPD_ID="xrayui_geodataupdate"
CRU_LR_ID="xrayui_logrotate"
CRU_SUB_REFRESH_ID="xrayui_subscription_refresh"
CRU_SUB_FALLBACK_ID="xrayui_subscription_fallback"
CRU_IPSET_SAVE_ID="xrayui_ipset_save"
CRU_WATCHDOG_ID="xrayui_watchdog"
XRAY_DESIRED_STATE_FILE="/tmp/xrayui_xray.desired"
WATCHDOG_STATE_FILE="/tmp/xrayui_watchdog.state"
WATCHDOG_STABLE_SECONDS=600
WATCHDOG_MAX_DELAY=3600
LR_STATUS="/tmp/logrotate.status"
LR_BIN="/opt/sbin/logrotate"
LR_CONF="/opt/etc/logrotate.conf"
LR_STANZA="/opt/etc/logrotate.d/xrayui"
CRON_LOCK_FD=8

#
# Add or refresh the CRU job (every 5 min by default)
#
cron_logrotate_add() {
    log_info "Configuring $CRU_LR_ID cron job for $ADDON_TITLE"

    [ -f "$LR_STANZA" ] || {
        log_warn "No $LR_STANZA found – skipping CRU job creation."
        return
    }

    cron_job_delete "$CRU_LR_ID"
    cru a "$CRU_LR_ID" "*/15 * * * * $ADDON_SCRIPT cron logrotate" || {
        log_error "Failed to add CRU job for $ADDON_TITLE"
        return
    }
    log_ok "CRON job $CRU_LR_ID for $ADDON_TITLE added successfully"
}

#
# Run logrotate once (called by CRU)
#
cron_logrotate_run() {

    #Check if logs are actually enabled
    load_xrayui_config
    local log_access="$(jq -r '.log.access // "none"' "$XRAY_CONFIG_FILE")"
    local log_error="$(jq -r '.log.error // "none"' "$XRAY_CONFIG_FILE")"
    if [ "$log_access" = "none" ] && [ "$log_error" = "none" ]; then
        log_debug "Both access and error logs are disabled. Skipping logrotate."
        return 0
    fi

    log_info "Running logrotate for $ADDON_TITLE"

    [ -f "$LR_CONF" ] || {
        log_warn "No $LR_CONF found – skipping logrotate."
        return
    }
    [ -f "$LR_STANZA" ] || {
        log_warn "No $LR_STANZA found – skipping logrotate."
        return
    }
    if [ ! -x "$LR_BIN" ]; then
        log_error "logrotate binary not found – aborting rotation."
        return 1
    fi

    local lr_output
    local lr_rc
    lr_output="$("$LR_BIN" -s "$LR_STATUS" "$LR_CONF" 2>&1)"
    lr_rc=$?
    lr_output="$(printf '%s' "$lr_output" | tr '\n' ' ')"

    if [ "$lr_rc" -ne 0 ]; then
        log_error "logrotate failed with exit code $lr_rc: $LR_BIN -s $LR_STATUS $LR_CONF"
        [ -n "$lr_output" ] && log_error "logrotate output: $lr_output"
        return 1
    fi

    [ -n "$lr_output" ] && log_debug "logrotate output: $lr_output"
    log_ok "logrotate completed successfully"
}

cron_geodata_add() {
    log_info "Configuring $CRU_GEOUPD_ID cron job for $ADDON_TITLE"

    load_xrayui_config
    local geo_auto_update="${geo_auto_update:-false}"
    cron_job_delete "$CRU_GEOUPD_ID"

    if [ "$geo_auto_update" = "true" ]; then
        cru a "$CRU_GEOUPD_ID" "0 3 */1 * * $ADDON_SCRIPT cron geodata" || {
            log_error "Failed to add CRU job for $ADDON_TITLE"
            return
        }
        log_ok "CRON job $CRU_GEOUPD_ID for $ADDON_TITLE added successfully"
    else
        log_warn "CRON job $CRU_GEOUPD_ID for $ADDON_TITLE not added (geo_auto_update is false)"
    fi

}

cron_ipset_save_add() {
    load_xrayui_config
    cron_job_delete "$CRU_IPSET_SAVE_ID"

    if [ "${ipsec:-off}" = "redirect" ]; then
        cru a "$CRU_IPSET_SAVE_ID" "*/30 * * * * $ADDON_SCRIPT cron ipset_save" || {
            log_error "Failed to add CRU job $CRU_IPSET_SAVE_ID"
            return
        }
        log_ok "CRON job $CRU_IPSET_SAVE_ID for $ADDON_TITLE added successfully"
    fi
}

cron_job_delete() {
    local cru_id="$1"
    cru d "$cru_id"
}

cron_jobs_clear() {
    log_info "Clearing cron jobs for $ADDON_TITLE"
    # Delete all cru jobs whose name starts with xrayui
    cru l | awk -F'#' 'NF>=2 {print $(NF-1)}' | grep '^xrayui' |
        while read -r id; do
            log_warn " - Deleting cron job $id"
            cru d "$id"
        done
}

cron_subscription_refresh_add() {
    log_info "Configuring $CRU_SUB_REFRESH_ID cron job for $ADDON_TITLE"

    load_xrayui_config
    local subscription_auto_refresh="${subscription_auto_refresh:-disabled}"
    cron_job_delete "$CRU_SUB_REFRESH_ID"

    local cron_expr=""
    case "$subscription_auto_refresh" in
        3h)  cron_expr="0 */3 * * *" ;;
        6h)  cron_expr="0 */6 * * *" ;;
        12h) cron_expr="0 */12 * * *" ;;
        *)
            log_warn "CRON job $CRU_SUB_REFRESH_ID not added (subscription_auto_refresh=$subscription_auto_refresh)"
            return
            ;;
    esac

    cru a "$CRU_SUB_REFRESH_ID" "$cron_expr $ADDON_SCRIPT cron subscription_refresh" || {
        log_error "Failed to add CRU job $CRU_SUB_REFRESH_ID"
        return
    }
    log_ok "CRON job $CRU_SUB_REFRESH_ID for $ADDON_TITLE added successfully"
}

cron_subscription_fallback_add() {
    log_info "Configuring $CRU_SUB_FALLBACK_ID cron job for $ADDON_TITLE"

    load_xrayui_config
    local subscription_auto_fallback="${subscription_auto_fallback:-false}"
    local subscription_fallback_interval="${subscription_fallback_interval:-5}"
    case "$subscription_fallback_interval" in
    '' | *[!0-9]*) subscription_fallback_interval=5 ;;
    esac
    if [ "$subscription_fallback_interval" -lt 1 ] || [ "$subscription_fallback_interval" -gt 59 ]; then
        subscription_fallback_interval=5
    fi
    cron_job_delete "$CRU_SUB_FALLBACK_ID"

    if [ "$subscription_auto_fallback" = "true" ]; then
        cru a "$CRU_SUB_FALLBACK_ID" "*/$subscription_fallback_interval * * * * $ADDON_SCRIPT cron subscription_fallback" || {
            log_error "Failed to add CRU job $CRU_SUB_FALLBACK_ID"
            return
        }
        log_ok "CRON job $CRU_SUB_FALLBACK_ID for $ADDON_TITLE added successfully"
    else
        log_warn "CRON job $CRU_SUB_FALLBACK_ID not added (subscription_auto_fallback is false)"
    fi
}

cron_job_lock() {
    local lockfile="/tmp/xrayui_cron_$1.lock"
    which flock >/dev/null 2>&1 || return 0
    touch "$lockfile" 2>/dev/null || return 0
    eval exec "$CRON_LOCK_FD>$lockfile"
    if ! flock -n "$CRON_LOCK_FD"; then
        log_info "Cron job $1 is still running - skipping this run"
        return 1
    fi
    trap 'flock -u '"$CRON_LOCK_FD"' 2>/dev/null' EXIT
    trap 'exit 129' HUP
    trap 'exit 130' INT
    trap 'exit 143' TERM
}

cron_jobs_add() {

    log_info "Adding cron jobs for $ADDON_TITLE"
    cron_logrotate_add
    cron_geodata_add
    cron_subscription_refresh_add
    cron_subscription_fallback_add
    cron_ipset_save_add
    cron_watchdog_add
}

watchdog_sanitize_interval() {
    case "$1" in
    1 | 2 | 5 | 10) echo "$1" ;;
    *) echo 2 ;;
    esac
}

watchdog_sanitize_attempts() {
    case "$1" in
    '' | *[!0-9]*) echo 5 ;;
    *) echo "$1" ;;
    esac
}

# Called by start(): Xray is meant to be running from now on.
# A user (re)start also resets the retry counter; a watchdog restart keeps it.
watchdog_mark_desired() {
    touch "$XRAY_DESIRED_STATE_FILE" 2>/dev/null
    [ "${WATCHDOG_RUN:-false}" = "true" ] || rm -f "$WATCHDOG_STATE_FILE"
}

# Called by stop(): an intentional stop must not be undone by the watchdog.
# The watchdog's own stop() inside restart() keeps both.
watchdog_clear_desired() {
    [ "${WATCHDOG_RUN:-false}" = "true" ] && return 0
    rm -f "$XRAY_DESIRED_STATE_FILE" "$WATCHDOG_STATE_FILE"
}

cron_watchdog_add() {
    load_xrayui_config
    cron_job_delete "$CRU_WATCHDOG_ID"

    if [ "${watchdog:-false}" = "true" ]; then
        local interval=$(watchdog_sanitize_interval "$watchdog_interval")
        cru a "$CRU_WATCHDOG_ID" "*/$interval * * * * $ADDON_SCRIPT cron watchdog" || {
            log_error "Failed to add CRU job $CRU_WATCHDOG_ID"
            return
        }
        log_ok "CRON job $CRU_WATCHDOG_ID for $ADDON_TITLE added successfully"
    else
        rm -f "$WATCHDOG_STATE_FILE"
        log_info "CRON job $CRU_WATCHDOG_ID not added (watchdog is disabled)"
    fi
}

# Runs under the restart lock. A manual start, restart or stop may have
# finished since the first check, so check again before acting.
watchdog_recover() {
    if [ ! -f "$XRAY_DESIRED_STATE_FILE" ] || [ -n "$(get_xray_daemon_pid)" ]; then
        log_debug "Watchdog: Xray was started or stopped meanwhile, nothing to do."
        WATCHDOG_SKIPPED=true
        return 0
    fi

    printf '%s %s 0\n' "$1" "$2" >"$WATCHDOG_STATE_FILE"
    log_warn "Xray was not running, restarting (attempt $1/$3)"
    restart_unlocked
}

cron_watchdog_run() {
    load_xrayui_config
    [ "${watchdog:-false}" = "true" ] || return 0
    # Not started by XRAYUI, or stopped on purpose
    [ -f "$XRAY_DESIRED_STATE_FILE" ] || return 0

    local attempts=0 last_ts=0 gave_up=0
    [ -f "$WATCHDOG_STATE_FILE" ] && read -r attempts last_ts gave_up <"$WATCHDOG_STATE_FILE"
    attempts=$(watchdog_sanitize_attempts "$attempts")
    case "$last_ts" in '' | *[!0-9]*) last_ts=0 ;; esac
    [ "$gave_up" = "1" ] || gave_up=0

    if [ -n "$(get_xray_daemon_pid)" ]; then
        # Reset only after Xray has stayed up for a while, so a crash loop keeps backing off
        if [ -f "$WATCHDOG_STATE_FILE" ] && [ "$(get_proc_uptime xray)" -ge "$WATCHDOG_STABLE_SECONDS" ]; then
            log_info "Xray has been running for $WATCHDOG_STABLE_SECONDS seconds. Watchdog retry counter reset."
            rm -f "$WATCHDOG_STATE_FILE"
        fi
        return 0
    fi

    # Boot startup is still running: let it finish
    local startup_pid=$(cat /tmp/xrayui_startup.lock 2>/dev/null)
    if [ -n "$startup_pid" ] && kill -0 "$startup_pid" 2>/dev/null; then
        log_debug "Watchdog: startup in progress, skipping this check."
        return 0
    fi
    local max_attempts=$(watchdog_sanitize_attempts "$watchdog_max_attempts")
    if [ "$max_attempts" -gt 0 ] && [ "$attempts" -ge "$max_attempts" ]; then
        if [ "$gave_up" != "1" ]; then
            log_error "Xray is not running and the watchdog gave up after $attempts restart attempts. Start Xray manually after fixing the cause."
            printf '%s %s 1\n' "$attempts" "$last_ts" >"$WATCHDOG_STATE_FILE"
        fi
        return 0
    fi

    # Backoff: wait interval * 2^(attempts-1) between retries, capped at WATCHDOG_MAX_DELAY
    local now=$(date +%s)
    if [ "$attempts" -gt 0 ]; then
        local delay=$(($(watchdog_sanitize_interval "$watchdog_interval") * 60))
        local i=1
        while [ "$i" -lt "$attempts" ] && [ "$delay" -lt "$WATCHDOG_MAX_DELAY" ]; do
            delay=$((delay * 2))
            i=$((i + 1))
        done
        [ "$delay" -gt "$WATCHDOG_MAX_DELAY" ] && delay=$WATCHDOG_MAX_DELAY
        # cron fires on minute boundaries; allow 30s of slack
        if [ $((now - last_ts)) -lt $((delay - 30)) ]; then
            log_debug "Watchdog: next restart attempt in $((delay - now + last_ts)) seconds."
            return 0
        fi
    fi

    attempts=$((attempts + 1))
    local limit="$max_attempts"
    [ "$max_attempts" -eq 0 ] && limit="unlimited"

    # Never wait for the lock: restart_lock_acquire gives up after 120 s and runs anyway.
    # Skip without counting an attempt; the next run checks again.
    if ! restart_lock_try; then
        log_debug "Watchdog: another start, stop or restart is running, skipping this check."
        return 0
    fi
    WATCHDOG_RUN=true
    WATCHDOG_SKIPPED=false
    watchdog_recover "$attempts" "$now" "$limit"
    local rc=$?
    WATCHDOG_RUN=false
    restart_lock_release
    [ "$WATCHDOG_SKIPPED" = "true" ] && return 0

    # Stopped on purpose while the restart waited for the lock (no flock)
    if [ ! -f "$XRAY_DESIRED_STATE_FILE" ]; then
        rm -f "$WATCHDOG_STATE_FILE"
        return 0
    fi

    if [ "$rc" -ne 0 ] || [ -z "$(get_xray_daemon_pid)" ]; then
        log_error "Watchdog restart attempt $attempts/$limit failed. The details are above in the system log."
    else
        log_ok "Watchdog restarted Xray (attempt $attempts/$limit)."
    fi
}
