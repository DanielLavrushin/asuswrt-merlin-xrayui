#!/bin/sh
# Runs failover_check against "$1/config.json" with Xray, nvram and the Observatory stubbed out.
HARNESS_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_DIR=$(cd "$HARNESS_DIR/../../.." && pwd)
FO_STATE=$1
LC_ALL=C
export LC_ALL

sed -e '/^import /d' "$REPO_DIR/src/backend/failover.sh" >"$FO_STATE/failover.$$.sh"
. "$FO_STATE/failover.$$.sh"
rm -f "$FO_STATE/failover.$$.sh"

ev() { printf '%s\n' "$*" >>"$FO_STATE/events.log"; }
log_warn() { ev "WARN: $*"; }
log_info() { ev "INFO: $*"; }
log_ok() { ev "OK: $*"; }
log_debug() { :; }
load_xrayui_config() {
    subscription_auto_fallback=true
    check_connection=true
}
get_xray_daemon_pid() { echo 4242; }
nvram() { echo 2; }
api_fetch_observatory() {
    ev "api_fetch_observatory"
    printf '{}'
}
failover_state_load() { :; }
failover_state_save() { :; }
failover_evaluate() { ev "evaluate $1"; }

XRAY_CONFIG_FILE="$FO_STATE/config.json"
XRAYUI_SUBSCRIPTIONS_FILE="$FO_STATE/subscriptions.json"
printf '{"vless":["vless://a"]}' >"$XRAYUI_SUBSCRIPTIONS_FILE"

failover_check
ev "check rc=$?"
