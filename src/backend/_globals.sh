#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

export PATH="/opt/bin:/opt/sbin:/sbin:/bin:/usr/sbin:/usr/bin"

source /usr/sbin/helper.sh

ADDON_TAG="xrayui"
ADDON_TAG_UPPER="XRAYUI"
ADDON_TITLE="Xray UI"

XRAYUI_VERSION="1.0.0"

ADDON_WEB_DIR="/www/user/$ADDON_TAG"

ADDON_SCRIPT="/jffs/scripts/$ADDON_TAG"
ADDON_SHARE_DIR="/opt/share/$ADDON_TAG"
ADDON_JFFS_ADN_DIR="/jffs/addons/$ADDON_TAG"
ADDON_USER_SCRIPTS_DIR="/jffs/${ADDON_TAG}_custom"
ADDON_LOGS_DIR="$ADDON_SHARE_DIR/logs"

XRAYUI_LOCKFILE=/tmp/$ADDON_TAG.lock

UI_RESPONSE_FILE="$ADDON_WEB_DIR/xray-ui-response.json"

XRAYUI_CLIENTS_FILE="$ADDON_WEB_DIR/clients-online.json"

DEFAULT_XRAY_PROFILE_NAME="config.json"
DEFAULT_GEOIP_URL="https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat"
DEFAULT_GEOSITE_URL="https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat"

XRAYUI_CONFIG_FILE="/opt/etc/$ADDON_TAG.conf"

XRAY_VERSION="0.0"
XRAY_PIDFILE=/var/run/xray.pid
XRAY_CONFIG_FILE="/opt/etc/xray/${profile:-$DEFAULT_XRAY_PROFILE_NAME}"

if [ -f "$XRAYUI_CONFIG_FILE" ]; then
    . "$XRAYUI_CONFIG_FILE"
fi

if [ ! -f "$XRAY_CONFIG_FILE" ]; then
    XRAY_CONFIG_FILE="/opt/etc/xray/config.json"
fi
