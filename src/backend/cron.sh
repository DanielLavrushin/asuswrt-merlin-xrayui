#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

CRU_LR_ID="xrayui_logrotate"
LR_STATUS="/tmp/logrotate.status"
LR_BIN="/opt/sbin/logrotate"
LR_CONF="/opt/etc/logrotate.conf"
LR_STANZA="/opt/etc/logrotate.d/xrayui"

#
# Add or refresh the CRU job (every 5 min by default)
#
cron_logrotate_add() {
    printlog true "Configuring logrotate cron job for $ADDON_TITLE"

    [ -f "$LR_STANZA" ] || {
        printlog true "No $LR_STANZA found – skipping CRU job creation." $CWARN
        return
    }

    cron_job_delete "$CRU_LR_ID"
    cru a "$CRU_LR_ID" "*/15 * * * * flock -n /tmp/${CRU_LR_ID}.lock $ADDON_SCRIPT cron logrotate" || {
        printlog true "Failed to add CRU job for $ADDON_TITLE" $CERR
        return
    }
    printlog true "CRON job $CRU_LR_ID for $ADDON_TITLE added successfully" $CSUC
}

#
# Run logrotate once (called by CRU)
#
cron_logrotate_run() {
    printlog true "Running logrotate for $ADDON_TITLE"

    [ -f "$LR_CONF" ] || {
        printlog true "No $LR_CONF found – skipping logrotate." $CWARN
        return
    }

    [ -f "$LR_STANZA" ] || {
        printlog true "No $LR_STANZA found – skipping logrotate." $CWARN
        return
    }
    if [ ! -x "$LR_BIN" ]; then
        printlog true "logrotate binary not found – aborting rotation." $CERR
        exit 1
    fi

    exec "$LR_BIN" -s "$LR_STATUS" "$LR_CONF" || {
        printlog true "logrotate failed with exit code $?" $CERR
        exit 1
    }
    printlog true "logrotate completed successfully" $CSUC
}

cron_job_delete() {
    local cru_id="$1"
    cru d "$CRU_LR_ID"
}

cron_jobs_add() {

    printlog true "Adding cron jobs for $ADDON_TITLE"
    cron_logrotate_add
}
