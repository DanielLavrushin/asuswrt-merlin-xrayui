#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

check_lock() {
    LOCKFILE=/tmp/addonwebui.lock
    FD=386
    eval exec "$FD>$LOCKFILE"
    flock -x "$FD"
}

clear_lock() {
    flock -u "$FD"
}
