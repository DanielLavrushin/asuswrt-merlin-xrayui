#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

# ANSI color codes (only used if stdout is a terminal)
CDBG='\033[0;90m'  # gray
CERR='\033[0;31m'  # red
CWARN='\033[0;33m' # yellow
CINFO='\033[0;36m' # cyan
CSUC='\033[0;32m'  # green
CLOG='\033[0;37m'  # white
CRESET='\033[0m'
LOG_FACILITY='user'

if [ -t 1 ]; then
    USE_COLOR=1
else
    USE_COLOR=0
fi

printlog() {
    level=$1
    shift
    msg=$*

    # Map LEVEL → syslog priority & console color
    case "$level" in
    ALERT | CRIT)
        priority='crit'
        color=$CERR
        ;;
    ERROR)
        priority='err'
        color=$CERR
        ;;
    WARN | WARNING)
        priority='warning'
        color=$CWARN
        ;;
    NOTICE)
        priority='notice'
        color=$CINFO
        ;;

    LOG)
        priority='info'
        color=$CLOG
        ;;
    INFO)
        priority='info'
        color=$CINFO
        ;;
    DEBUG)
        priority='debug'
        color=$CDBG
        ;;
    SUCCESS | OK)
        priority='info'
        color=$CSUC
        ;;
    *)
        priority='info'
        color=$CINFO
        ;;
    esac

    logger -t "XRAYUI" -p "${LOG_FACILITY}.${priority}" -- "$msg"

    if [ "$ADDON_DEBUG" -eq "0" ] && [ "$level" = "DEBUG" ]; then
        return
    fi

    if [ "$USE_COLOR" -eq 1 ]; then
        printf '%b%s%b\n' "$color" "$msg" "$CRESET"
    else
        printf '%s\n' "$msg"
    fi
}

log_alert() { printlog ALERT "$@"; }
log_crit() { printlog CRIT "$@"; }
log_error() { printlog ERROR "$@"; }
log_warn() { printlog WARN "$@"; }
log_notice() { printlog NOTICE "$@"; }
log_info() { printlog INFO "$@"; }
log_log() { printlog LOG "$@"; }
log_ok() { printlog OK "$@"; }
log_debug() { printlog DEBUG "$@"; }

log_info_box() {
    log_box "$1" "$CINFO"
}

log_warn_box() {
    log_box "$1" "$CWARN"
}

log_error_box() {
    log_box "$1" "$CERR"
}

log_box() {
    msg="$1"
    padding=2
    len=$(printf '%s' "$msg" | wc -c)
    width=$((len + padding * 2))
    color="${2:-$CSUC}"

    border=''
    i=0
    while [ "$i" -lt "$width" ]; do
        border="${border}═"
        i=$((i + 1))
    done

    printf '%b╔%s╗\n' "$color" "$border"
    printf '%b║%*s║\n' "$color" "$width" ''
    printf '%b║%*s%s%*s║\n' "$color" "$padding" '' "$msg" "$padding" ''
    printf '%b║%*s║\n' "$color" "$width" ''
    printf '%b╚%s╝%b\n' "$color" "$border" "$CRESET"
}

get_proc() {
    local proc_name="$1"
    echo $(/bin/pidof "$proc_name" 2>/dev/null)
}

get_proc_uptime() {
    local uptime_s=$(cut -d. -f1 /proc/uptime)
    local pid=$(pidof "$1")

    local localstart_time_jiffies=$(awk '{print $22}' /proc/$pid/stat)

    local jiffies_per_sec=100

    local process_start_s=$((localstart_time_jiffies / jiffies_per_sec))

    local proc_uptime=$((uptime_s - process_start_s))
    echo $proc_uptime
}

get_webui_page() {
    ADDON_USER_PAGE="none"
    local max_user_page=0
    local used_pages=""

    for page in /www/user/user*.asp; do
        if [ -f "$page" ]; then
            if grep -q "page:$ADDON_TAG" "$page"; then
                ADDON_USER_PAGE=$(basename "$page")
                log_ok "Found existing $ADDON_TAG_UPPER page: $ADDON_USER_PAGE"
                return
            fi

            user_number=$(echo "$page" | sed -E 's/.*user([0-9]+)\.asp$/\1/')
            used_pages="$used_pages $user_number"

            if [ "$user_number" -gt "$max_user_page" ]; then
                max_user_page="$user_number"
            fi
        fi
    done

    if [ "$ADDON_USER_PAGE" != "none" ]; then
        log_ok "Found existing $ADDON_TAG_UPPER page: $ADDON_USER_PAGE"
        return
    fi

    if [ "$1" = "true" ]; then
        i=1
        while true; do
            if ! echo "$used_pages" | grep -qw "$i"; then
                ADDON_USER_PAGE="user$i.asp"
                log_ok "Assigning new $ADDON_TAG_UPPER page: $ADDON_USER_PAGE"
                return
            fi
            i=$((i + 1))
        done
    fi
}

am_settings_del() {
    local key="$1"
    sed -i "/$key/d" /jffs/addons/custom_settings.txt
}

remove_json_comments() {
    local tempconfig="/tmp/xray-config-clean.json"
    sed 's/\/\/.*//' "$XRAY_CONFIG_FILE" >$tempconfig
    echo $tempconfig
}

reconstruct_payload() {

    local idx=0
    local chunk
    local payload=""
    while :; do
        chunk=$(am_settings_get xray_payload$idx)
        if [ -z "$chunk" ]; then
            break
        fi
        payload="$payload$chunk"
        idx=$((idx + 1))
    done

    cleanup_payload

    echo "$payload"

}

cleanup_payload() {
    # clean up all payload chunks from the custom settings
    sed -i '/^xray_payload/d' /jffs/addons/custom_settings.txt
}

load_ui_response() {

    if [ ! -f "$UI_RESPONSE_FILE" ]; then
        log_ok "Creating $ADDON_TITLE response file: $UI_RESPONSE_FILE"
        echo '{}' >"$UI_RESPONSE_FILE"
        chmod 600 "$UI_RESPONSE_FILE"
    fi

    UI_RESPONSE=$(cat "$UI_RESPONSE_FILE")
    if [ "$UI_RESPONSE" = "" ]; then
        UI_RESPONSE="{}"
    fi
}

save_ui_response() {

    log_debug "Saving UI response to $UI_RESPONSE_FILE"

    if ! echo "$UI_RESPONSE" >"$UI_RESPONSE_FILE"; then
        log_error "Failed to save UI response to $UI_RESPONSE_FILE"
        clear_lock
        return 1
    fi

}

test_xray_config() {
    log_info "Testing Xray configuration..."
    update_loading_progress "Testing Xray configuration..."

    load_xrayui_config
    local skip_test="${skip_test:-false}"

    if [ "$skip_test" = "true" ]; then
        log_info "Skipping Xray configuration test as per user settings."
        return
    fi

    local output

    if ! output=$(xray -c $XRAY_CONFIG_FILE -test 2>&1); then
        message=$(echo "$output" | sed -n '/> infra\/conf:/ {s/.*> infra\/conf: //p}')
        if [ -z "$message" ]; then
            message="$output"
        fi
        message=$(echo "$message" | sed 's/"/\\"/g')
    else
        message="Config file appears to be fine, but the XRAY service has not started. Try to restart/reconnect it."
    fi

    log_info "Xray config test result: $output"

    load_ui_response

    local json_content=$(jq --arg msg "$message" '.xray.test = $msg' "$UI_RESPONSE_FILE")
    echo "$json_content" >"/tmp/xray-response.tmp" && mv -f "/tmp/xray-response.tmp" "$UI_RESPONSE_FILE"
}

update_loading_progress() {
    local message=$1
    local progress=$2

    if [ ! -d "$ADDON_WEB_DIR" ]; then
        return
    fi

    load_ui_response

    local json_content
    if [ -f "$UI_RESPONSE_FILE" ]; then
        json_content=$(cat "$UI_RESPONSE_FILE")
    else
        json_content="{}"
    fi

    if [ -n "$progress" ]; then
        json_content=$(echo "$json_content" | jq --argjson progress "$progress" --arg message "$message" '
            .loading.message = $message |
            .loading.progress = $progress
        ')
    else
        json_content=$(echo "$json_content" | jq --arg message "$message" '
            .loading.message = $message
        ')
    fi

    echo "$json_content" >"/tmp/xray-response.tmp" && mv -f "/tmp/xray-response.tmp" "$UI_RESPONSE_FILE"

    if [ "$progress" = "100" ]; then
        /jffs/scripts/xrayui service_event cleanloadingprogress >/dev/null 2>&1 &
    fi

}

remove_loading_progress() {

    log_info "Removing loading progress..."
    if [ ! -d "$ADDON_WEB_DIR" ]; then
        return
    fi

    sleep 1
    load_ui_response

    local json_content=$(cat "$UI_RESPONSE_FILE")

    json_content=$(echo "$json_content" | jq '
            del(.loading)
        ')

    echo "$json_content" >"/tmp/xray-response.tmp" && mv -f "/tmp/xray-response.tmp" "$UI_RESPONSE_FILE"
}

fixme() {
    log_info "Attempting to fix XRAY UI issues..."

    log_info "Removing XRAY broken payload settings..."
    sed -i '/^xray_payload/d' /jffs/addons/custom_settings.txt || log_warn "Failed to remove broken payload settings"

    log_info "Removing file $UI_RESPONSE_FILE..."
    rm -f $UI_RESPONSE_FILE || log_warn "Failed to remove $UI_RESPONSE_FILE"

    log_info "Removing file $XRAYUI_CLIENTS_FILE..."
    rm -f $XRAYUI_CLIENTS_FILE || log_warn "Failed to remove $XRAYUI_CLIENTS_FILE"

    log_ok "Done with fixme function."
}
