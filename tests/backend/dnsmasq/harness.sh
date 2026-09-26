#!/bin/sh
HARNESS_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_DIR=$(cd "$HARNESS_DIR/../../.." && pwd)
FW_BIN="$REPO_DIR/tests/backend/firewall/bin"
DM_STATE=$1
XRAY_CONFIG_FILE=$2
shift 2
FW_STATE=$DM_STATE
FW_REAL_PATH=$PATH
LC_ALL=C
PATH="$HARNESS_DIR/bin:$FW_BIN:$PATH"
export DM_STATE FW_STATE FW_REAL_PATH PATH LC_ALL

for tool in ipset jq; do
    if [ "$(command -v "$tool")" != "$FW_BIN/$tool" ]; then
        echo "harness: $tool does not resolve to $FW_BIN/$tool; refusing to run" >&2
        exit 70
    fi
done

mkdir -p "$DM_STATE/tmp" "$DM_STATE/share" "$DM_STATE/opt/sbin" "$DM_STATE/etc" "$DM_STATE/run"
ln -sf "$HARNESS_DIR/bin/v2dat" "$DM_STATE/share/v2dat"
for f in "$HARNESS_DIR"/fixtures/*; do
    [ -e "$DM_STATE/opt/sbin/${f##*/}" ] || cp "$f" "$DM_STATE/opt/sbin/${f##*/}"
done

sed -e '/^import /d' \
    -e "s#/opt/sbin#@DM_STATE@/opt/sbin#g" \
    -e "s#/tmp/#@DM_STATE@/tmp/#g" \
    -e "s#/etc/dnsmasq.conf#@DM_STATE@/etc/dnsmasq.conf#g" \
    -e "s#/var/run/#@DM_STATE@/run/#g" \
    -e "s#@DM_STATE@#$DM_STATE#g" \
    "${DM_SCRIPT:-$REPO_DIR/src/backend/dnsmasq.sh}" >"$DM_STATE/dnsmasq.$$.sh"

. "$DM_STATE/dnsmasq.$$.sh"

log_error() { printf 'ERROR: %s\n' "$*" >>"$DM_STATE/messages.log"; }
log_warn() { printf 'WARN: %s\n' "$*" >>"$DM_STATE/messages.log"; }
log_info() { printf 'INFO: %s\n' "$*" >>"$DM_STATE/messages.log"; }
log_ok() { :; }
log_debug() { :; }
update_loading_progress() { :; }
load_ui_response() { :; }
load_xrayui_config() { :; }
get_xray_daemon_pid() { echo 4242; }
is_ipv6_enabled() { [ "${DM_IPV6:-0}" = 1 ]; }
cleanup_stale_asdfiles() { printf 'cleanup_stale_asdfiles\n' >>"$DM_STATE/events.log"; }
pc_append() { printf '%s\n' "$1" >>"$2"; }
dnsmasq_prime() {
    {
        printf '== %s\n' "$1"
        cat "$1"
    } >>"$DM_STATE/prime.log"
}

ADDON_TAG=xrayui
ADDON_TAG_UPPER=XRAYUI
ADDON_TITLE=XRAYUI
ADDON_SHARE_DIR="$DM_STATE/share"
IPSET_BYPASS_V4=XRAYUI_BYPASS4
IPSET_BYPASS_V6=XRAYUI_BYPASS6
IPSET_PROXY_V4=XRAYUI_PROXY4
IPSET_PROXY_V6=XRAYUI_PROXY6
IPSET_BYPASS_NET_V4=XRAYUI_BYPASS4_NET
IPSET_BYPASS_NET_V6=XRAYUI_BYPASS6_NET
IPSET_PROXY_NET_V4=XRAYUI_PROXY4_NET
IPSET_PROXY_NET_V6=XRAYUI_PROXY6_NET
IPSET_LEARNED_FILE="$ADDON_SHARE_DIR/dnsmasq/learned.ipset"
IONICE=""
NICE=""

ipset_domains() {
    touch "$DM_STATE/etc/dnsmasq.conf"
    dnsmasq_xray_ipset_domains "$DM_STATE/etc/dnsmasq.conf"
    printf 'ipset_domains rc=%s\n' "$?" >>"$DM_STATE/events.log"
}

configure() {
    dnsmasq_configure "$DM_STATE/etc/dnsmasq.conf"
    printf 'configure rc=%s\n' "$?" >>"$DM_STATE/events.log"
}

if [ "${DM_NO_SLEEP:-0}" = 1 ]; then
    sleep() { :; }
fi

if [ -n "${DM_PRESTATE:-}" ]; then
    eval "$DM_PRESTATE"
fi

for step do
    $step
done

wait
