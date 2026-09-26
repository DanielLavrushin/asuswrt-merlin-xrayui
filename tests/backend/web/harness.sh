#!/bin/sh
HARNESS_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_DIR=$(cd "$HARNESS_DIR/../../.." && pwd)
WB_STATE=$1
shift

ADDON_WEB_DIR="$WB_STATE/www/user/xrayui"
ADDON_SHARE_DIR="$WB_STATE/opt/share/xrayui"
ADDON_LOGS_DIR="$ADDON_SHARE_DIR/logs"
XRAY_CONFIG_FILE="$WB_STATE/opt/etc/xray/config.json"
mkdir -p "$ADDON_WEB_DIR" "$ADDON_LOGS_DIR" "$WB_STATE/tmp"

for script in mount backup logs; do
    sed -e '/^import /d' \
        -e "s#/opt/#$WB_STATE/opt/#g" \
        -e "s#/tmp/#$WB_STATE/tmp/#g" \
        -e "s#/jffs/#$WB_STATE/jffs/#g" \
        -e "s#/www/#$WB_STATE/www/#g" \
        "$REPO_DIR/src/backend/$script.sh" >"$WB_STATE/$script.$$.sh"
    . "$WB_STATE/$script.$$.sh"
    rm -f "$WB_STATE/$script.$$.sh"
done

ev() { printf '%s\n' "$*" >>"$WB_STATE/events.log"; }
log_error() { ev "ERROR: $*"; }
log_warn() { ev "WARN: $*"; }
log_info() { :; }
log_ok() { :; }
log_debug() { :; }
load_xrayui_config() { logs_dnsmasq=false; }

for step in "$@"; do
    eval "$step"
    ev "$step rc=$?"
done
