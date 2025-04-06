#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

check_lock() {
    return
    # if [ -f "$XRAYUI_LOCKFILE" ]; then
    #     ageoflock=$(($(date +%s) - $(date +%s -r "$XRAYUI_LOCKFILE")))
    #     if [ "$ageoflock" -gt 300 ]; then
    #         printlog true "Lock file is older than 5 minutes. Removing stale lock." "$CERR"
    #         kill "$(sed -n '1p' $XRAYUI_LOCKFILE)" >/dev/null 2>&1
    #         clear_lock
    #         echo "$$" >"$XRAYUI_LOCKFILE"
    #         return 0
    #     else
    #         if [ -z "$1" ]; then
    #             printlog true "Lock file is less than 5 minutes old. Exiting." "$CERR"
    #             exit 1
    #         else
    #             printlog true "Another instance of $ADDON_TAG is running. Exiting." "$CERR"
    #             return 1
    #         fi
    #     fi
    # else
    #     printlog true "No lock file found. Creating lock file." "$CSUC"
    #     echo "$$" >"$XRAYUI_LOCKFILE"
    #     return 0
    # fi
}

clear_lock() {
    return
    # rm -f "$XRAYUI_LOCKFILE" 2>/dev/null
    # return 0
}
