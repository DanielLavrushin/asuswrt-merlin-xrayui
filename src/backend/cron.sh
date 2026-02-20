#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

CRU_GEOUPD_ID="xrayui_geodataupdate"
CRU_LR_ID="xrayui_logrotate"
CRU_SUB_REFRESH_ID="xrayui_subscription_refresh"
CRU_SUB_FALLBACK_ID="xrayui_subscription_fallback"
LR_STATUS="/tmp/logrotate.status"
LR_BIN="/opt/sbin/logrotate"
LR_CONF="/opt/etc/logrotate.conf"
LR_STANZA="/opt/etc/logrotate.d/xrayui"

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
    cru a "$CRU_LR_ID" "*/15 * * * * flock -n /tmp/${CRU_LR_ID}.lock $ADDON_SCRIPT cron logrotate" || {
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
        exit 1
    fi

    "$LR_BIN" -s "$LR_STATUS" "$LR_CONF" || {
        log_debug "logrotate: $LR_BIN -s $LR_STATUS $LR_CONF"
        log_error "logrotate failed with exit code $?"
        exit 1
    }

    log_ok "logrotate completed successfully"
}

cron_geodata_add() {
    log_info "Configuring $CRU_GEOUPD_ID cron job for $ADDON_TITLE"

    load_xrayui_config
    local geo_auto_update="${geo_auto_update:-false}"
    cron_job_delete "$CRU_GEOUPD_ID"

    if [ "$geo_auto_update" = "true" ]; then
        cru a "$CRU_GEOUPD_ID" "0 3 */1 * * flock -n /tmp/${CRU_GEOUPD_ID}.lock $ADDON_SCRIPT cron geodata" || {
            log_error "Failed to add CRU job for $ADDON_TITLE"
            return
        }
        log_ok "CRON job $CRU_GEOUPD_ID for $ADDON_TITLE added successfully"
    else
        log_warn "CRON job $CRU_GEOUPD_ID for $ADDON_TITLE not added (geo_auto_update is false)"
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

    cru a "$CRU_SUB_REFRESH_ID" "$cron_expr flock -n /tmp/${CRU_SUB_REFRESH_ID}.lock $ADDON_SCRIPT cron subscription_refresh" || {
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
    cron_job_delete "$CRU_SUB_FALLBACK_ID"

    if [ "$subscription_auto_fallback" = "true" ]; then
        cru a "$CRU_SUB_FALLBACK_ID" "*/$subscription_fallback_interval * * * * flock -n /tmp/${CRU_SUB_FALLBACK_ID}.lock $ADDON_SCRIPT cron subscription_fallback" || {
            log_error "Failed to add CRU job $CRU_SUB_FALLBACK_ID"
            return
        }
        log_ok "CRON job $CRU_SUB_FALLBACK_ID for $ADDON_TITLE added successfully"
    else
        log_warn "CRON job $CRU_SUB_FALLBACK_ID not added (subscription_auto_fallback is false)"
    fi
}

cron_jobs_add() {

    log_info "Adding cron jobs for $ADDON_TITLE"
    cron_logrotate_add
    cron_geodata_add
    cron_subscription_refresh_add
    cron_subscription_fallback_add
}
