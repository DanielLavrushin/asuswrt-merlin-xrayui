#!/bin/sh
HARNESS_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_DIR=$(cd "$HARNESS_DIR/../../.." && pwd)
RS_STATE=$1
shift
LC_ALL=C
export LC_ALL

mkdir -p "$RS_STATE/opt/etc/xray/xrayui" "$RS_STATE/share"
sed -e '/^import /d' -e "s#/opt/#$RS_STATE/opt/#g" "$REPO_DIR/src/backend/api.sh" >"$RS_STATE/api.$$.sh"
. "$RS_STATE/api.$$.sh"

ev() { printf '%s\n' "$*" >>"$RS_STATE/events.log"; }
log_error() { ev "ERROR: $*"; }
log_warn() { ev "WARN: $*"; }
log_info() { ev "INFO: $*"; }
log_debug() { :; }
load_xrayui_config() { :; }
get_xray_daemon_pid() {
    [ -n "${RS_PID:-}" ] || return 1
    echo "$RS_PID"
}
curl() {
    ev "curl $*"
    [ -f "$RS_STATE/vars.json" ] || return 7
    cat "$RS_STATE/vars.json"
}
date() { echo 1790000000; }

XRAY_CONFIG_FILE="$RS_STATE/opt/etc/xray/config.json"
XRAYUI_CONNECTION_STATUS_FILE="$RS_STATE/share/xray_connection_status.json"
check_connection=${RS_CHECK_CONNECTION:-true}
clients_check=${RS_CLIENTS_CHECK:-false}

status() {
    api_get_connection_status
    ev "status rc=$?"
}

observatory() {
    api_fetch_observatory >"$RS_STATE/observatory.out"
    ev "observatory rc=$?"
}

required() {
    api_config_required
    ev "required rc=$?"
}

for step do
    $step
done
