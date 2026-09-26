#!/bin/sh
HARNESS_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_DIR=$(cd "$HARNESS_DIR/../../.." && pwd)
RS_STATE=$1
shift
RS_REAL_PATH=$PATH
LC_ALL=C
PATH="$HARNESS_DIR/bin:$PATH"
export RS_STATE RS_REAL_PATH PATH LC_ALL

find() { "$HARNESS_DIR/bin/find" "$@"; }
if find "$RS_STATE" -maxdepth 0 >/dev/null 2>&1; then
    echo "harness: find accepts -maxdepth; refusing to run" >&2
    exit 70
fi
for tool in base64 openssl; do
    if ! which "$tool" >/dev/null 2>&1; then
        eval "$tool() { echo 'sh: $tool: not found' >&2; return 127; }"
    fi
done

mkdir -p "$RS_STATE/tmp" "$RS_STATE/www" "$RS_STATE/share" "$RS_STATE/run" "$RS_STATE/jffs/addons" "$RS_STATE/jffs/xrayui_custom"

rewrite() {
    sed -e '/^import /d' \
        -e "s#/opt/#@RS_STATE@/opt/#g" \
        -e "s#/tmp/#@RS_STATE@/tmp/#g" \
        -e "s#/jffs/#@RS_STATE@/jffs/#g" \
        -e "s#/www/#@RS_STATE@/www/#g" \
        -e "s#/etc/dnsmasq.conf#@RS_STATE@/etc/dnsmasq.conf#g" \
        -e "s#@RS_STATE@#$RS_STATE#g" \
        "$1" >"$RS_STATE/$2.$$.sh"
}
rewrite "${RS_HELPER_SCRIPT:-$REPO_DIR/src/backend/_helper.sh}" helper
rewrite "${RS_RESPONSE_SCRIPT:-$REPO_DIR/src/backend/response.sh}" response
rewrite "${RS_GENOPTS_SCRIPT:-$REPO_DIR/src/backend/general_opts.sh}" general_opts
rewrite "${RS_XRAYUI_SCRIPT:-$REPO_DIR/src/backend/xrayui.sh}" xrayui
rewrite "${RS_GEODATA_SCRIPT:-$REPO_DIR/src/backend/geodata.sh}" geodata
rewrite "${RS_SUBSCRIPTIONS_SCRIPT:-$REPO_DIR/src/backend/subscriptions.sh}" subscriptions

. "$RS_STATE/helper.$$.sh"
. "$RS_STATE/response.$$.sh"
. "$RS_STATE/general_opts.$$.sh"
. "$RS_STATE/geodata.$$.sh"
. "$RS_STATE/subscriptions.$$.sh"

ev() { printf '%s\n' "$*" >>"$RS_STATE/events.log"; }
log_error() { ev "ERROR: $*"; }
log_warn() { ev "WARN: $*"; }
log_info() { ev "INFO: $*"; }
log_ok() { ev "OK: $*"; }
log_debug() { :; }
update_loading_progress() { ev "PROGRESS: $1|$2"; }
load_xrayui_config() { :; }
get_proc_uptime() { echo 0; }
xray() { echo "Xray 26.3.27 (Xray, Penetrates Everything.) 0000000 (go1.26.0 linux/arm64)"; }
am_settings_get() { grep "^$1 " "$RS_STATE/jffs/addons/custom_settings.txt" 2>/dev/null | cut -f2- -d' '; }
update_xrayui_config() { ev "SET: $1=$2"; }
logrotate_setup() { :; }
cron_geodata_add() { :; }
cron_subscription_refresh_add() { :; }
cron_subscription_fallback_add() { :; }
cron_ipset_save_add() { :; }
logs_scribe_integration() { :; }
update_community_geodata() { :; }
restart() { ev "restart"; }

ADDON_TAG=xrayui
ADDON_TAG_UPPER=XRAYUI
ADDON_TITLE=XRAYUI
XRAYUI_VERSION=0.70.0
DEFAULT_XRAY_PROFILE_NAME=config.json
ADDON_WEB_DIR="$RS_STATE/www"
ADDON_SHARE_DIR="$RS_STATE/share"
ADDON_LOGS_DIR="$ADDON_SHARE_DIR/logs"
ADDON_USER_SCRIPTS_DIR="$RS_STATE/jffs/xrayui_custom"
UI_RESPONSE_FILE="$ADDON_WEB_DIR/xray-ui-response.json"
XRAYUI_SUBSCRIPTIONS_FILE="$ADDON_SHARE_DIR/xray_subscriptions.json"
XRAY_PIDFILE="$RS_STATE/run/xray.pid"
XRAY_CONFIG_FILE="$RS_STATE/opt/etc/xray/config.json"

respond() {
    initial_response
    ev "initial_response rc=$?"
}

decode() {
    decode_payload "$(cat "$RS_STATE/payload")" >"$RS_STATE/decoded"
    ev "decode_payload rc=$?"
}

tagfiles() {
    get_custom_geodata_tagfiles
    ev "tagfiles rc=$?"
}

sub_link() {
    subscription_b64d "$(cat "$RS_STATE/payload")" >"$RS_STATE/decoded"
    ev "subscription_b64d rc=$?"
}

sub_body() {
    subscription_decode_body "$RS_STATE/payload" "$RS_STATE/decoded"
    ev "subscription_decode_body rc=$?"
}

sweep() {
    sweep_stale_staging
    ev "sweep rc=$?"
    ev "staging: $(ls "$XRAYUI_STAGING_DIR" | tr '\n' ' ')"
}

clear_loading() {
    sleep() { ev "sleep $1"; }
    remove_loading_progress
    ev "remove_loading_progress rc=$?"
    unset -f sleep
}

save_general() {
    if [ -n "${RS_APPLY_RC:-}" ]; then
        apply_general_options() {
            ev "apply_general_options"
            return "$RS_APPLY_RC"
        }
    fi
    (
        set -- service_event configuration applygeneraloptions
        . "$RS_STATE/xrayui.$$.sh"
    )
    ev "dispatch rc=$?"
}

for step do
    $step
done
