#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

ntp_ready() {
    if [ "$(nvram get ntp_ready)" -eq 0 ]; then
        check_lock
        ntpwaitcount=0
        while [ "$(nvram get ntp_ready)" -eq 0 ] && [ "$ntpwaitcount" -lt 600 ]; do
            ntpwaitcount="$((ntpwaitcount + 30))"
            printlog true "Waiting for NTP to sync time... $ntpwaitcount seconds"
            sleep 30
        done
        if [ "$ntpwaitcount" -ge 600 ]; then
            printlog true "NTP sync failed after 600 seconds. Please check your NTP server settings." "$CERR"
            clear_lock
            exit 1
        else
            printlog true "NTP sync successful after $ntpwaitcount seconds." "$CSUC"
            clear_lock
        fi
    fi
}
