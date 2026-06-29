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

    if [ "$ADDON_DEBUG" = "false" ] && [ "$level" = "DEBUG" ]; then
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
    echo $(/bin/pidof "$proc_name" 2>/dev/null | awk '{print $NF}')
}

get_proc_uptime() {
    local pid=$(pidof "$1")

    if [ -z "$pid" ] || [ ! -f "/proc/$pid/stat" ]; then
        echo 0
        return
    fi

    local uptime_s=$(cut -d. -f1 /proc/uptime)
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
    sed "/$key/d" /jffs/addons/custom_settings.txt >/tmp/custom_settings.$$ && mv /tmp/custom_settings.$$ /jffs/addons/custom_settings.txt
}

remove_json_comments() {
    local tempconfig="/tmp/xray-config-clean.json"
    sed 's/\/\/.*//' "$XRAY_CONFIG_FILE" >$tempconfig
    echo $tempconfig
}

XRAYUI_STAGING_DIR="/tmp/xrayui-staging"

reconstruct_payload() {

    local session
    session=$(am_settings_get xray_staged_session)

    if [ -n "$session" ]; then
        reconstruct_staged_payload "$session"
        return
    fi

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

    decode_payload "$payload"

}

# Decompress payloads that carry a "gz:" magic prefix (base64-encoded gzip from the frontend).
# Anything without the prefix is returned unchanged so legacy callers keep working.
# Called via $(...) — only data goes to stdout, errors to stderr.
decode_payload() {
    local raw="$1"
    case "$raw" in
        gz:*)
            local decoded
            decoded=$(printf '%s' "${raw#gz:}" | base64 -d 2>/dev/null | gunzip 2>/dev/null)
            if [ -z "$decoded" ]; then
                log_error "decode_payload: failed to decompress gz: payload (base64/gunzip pipeline failed or produced empty output)" >&2
                return 1
            fi
            printf '%s' "$decoded"
            ;;
        *)
            printf '%s' "$raw"
            ;;
    esac
}

reconstruct_staged_payload() {
    # NOTE: this function is called via $(...) substitution; ALL log output MUST go to stderr,
    # otherwise it gets captured as part of the returned payload and corrupts the assembled JSON.
    local session="$1"
    local safe_session
    safe_session=$(printf '%s' "$session" | tr -cd 'A-Za-z0-9_-' | cut -c1-64)

    if [ -z "$safe_session" ] || [ "$safe_session" != "$session" ]; then
        log_error "Invalid staged session id: '$session'" >&2
        cleanup_staged_marker >&2
        return 1
    fi

    local dir="$XRAYUI_STAGING_DIR/$safe_session"
    if [ ! -d "$dir" ]; then
        log_error "Staged session directory missing: $dir" >&2
        cleanup_staged_marker >&2
        return 1
    fi

    local total
    total=$(cat "$dir/total" 2>/dev/null)
    if [ -z "$total" ] || ! [ "$total" -gt 0 ] 2>/dev/null; then
        log_error "Staged session $safe_session has invalid total: '$total'" >&2
        cleanup_staging "$safe_session" >&2
        cleanup_staged_marker >&2
        return 1
    fi

    local tmp_assembly="/tmp/xrayui-staged-assembly.$$"
    : >"$tmp_assembly"

    local idx=0
    while [ "$idx" -lt "$total" ]; do
        local chunk_file="$dir/chunk-$idx"
        if [ ! -f "$chunk_file" ]; then
            log_error "Staged chunk $idx of $total missing for session $safe_session" >&2
            rm -f "$tmp_assembly"
            cleanup_staging "$safe_session" >&2
            cleanup_staged_marker >&2
            return 1
        fi
        cat "$chunk_file" >>"$tmp_assembly"
        idx=$((idx + 1))
    done

    local assembled_size
    assembled_size=$(wc -c <"$tmp_assembly" 2>/dev/null)
    log_info "reconstruct_staged_payload: session $safe_session, $total chunks → $assembled_size bytes assembled" >&2

    cleanup_staging "$safe_session" >&2
    cleanup_staged_marker >&2
    cleanup_payload >&2

    local assembled
    assembled=$(cat "$tmp_assembly")
    rm -f "$tmp_assembly"
    decode_payload "$assembled"
}

cleanup_payload() {
    # clean up all payload chunks from the custom settings
    sed '/^xray_payload/d' /jffs/addons/custom_settings.txt >/tmp/custom_settings.$$ && mv /tmp/custom_settings.$$ /jffs/addons/custom_settings.txt
}

cleanup_staged_marker() {
    sed '/^xray_staged_session/d;/^xray_stage_/d' /jffs/addons/custom_settings.txt >/tmp/custom_settings.$$ && mv /tmp/custom_settings.$$ /jffs/addons/custom_settings.txt
}

cleanup_staging() {
    local session="$1"
    if [ -n "$session" ]; then
        rm -rf "$XRAYUI_STAGING_DIR/$session"
    fi
    # sweep stale sessions older than 5 minutes
    if [ -d "$XRAYUI_STAGING_DIR" ]; then
        find "$XRAYUI_STAGING_DIR" -maxdepth 1 -mindepth 1 -type d -mmin +5 -exec rm -rf {} \; 2>/dev/null
    fi
}

stage_chunk() {
    local session
    local index
    local total
    local data

    session=$(am_settings_get xray_stage_session)
    index=$(am_settings_get xray_stage_index)
    total=$(am_settings_get xray_stage_total)
    data=$(am_settings_get xray_stage_data)

    local safe_session
    safe_session=$(printf '%s' "$session" | tr -cd 'A-Za-z0-9_-' | cut -c1-64)

    if [ -z "$safe_session" ] || [ "$safe_session" != "$session" ]; then
        log_error "stage_chunk: invalid session id: '$session'"
        cleanup_staged_marker
        return 1
    fi

    if ! [ "$index" -ge 0 ] 2>/dev/null || ! [ "$total" -gt 0 ] 2>/dev/null; then
        log_error "stage_chunk: invalid index/total ($index/$total) for session $safe_session"
        cleanup_staged_marker
        return 1
    fi

    if [ "$index" -ge "$total" ]; then
        log_error "stage_chunk: index $index out of range (total $total)"
        cleanup_staged_marker
        return 1
    fi

    mkdir -p "$XRAYUI_STAGING_DIR/$safe_session"
    chmod 700 "$XRAYUI_STAGING_DIR" "$XRAYUI_STAGING_DIR/$safe_session" 2>/dev/null

    echo "$total" >"$XRAYUI_STAGING_DIR/$safe_session/total"
    printf '%s' "$data" >"$XRAYUI_STAGING_DIR/$safe_session/chunk-$index"

    local stored_size
    stored_size=$(wc -c <"$XRAYUI_STAGING_DIR/$safe_session/chunk-$index" 2>/dev/null)
    log_info "stage_chunk: stored chunk $index/$total ($stored_size bytes) for session $safe_session"

    cleanup_staged_marker

    # opportunistic sweep of stale sessions
    find "$XRAYUI_STAGING_DIR" -maxdepth 1 -mindepth 1 -type d -mmin +5 -exec rm -rf {} \; 2>/dev/null

    return 0
}

load_ui_response() {

    if [ ! -f "$UI_RESPONSE_FILE" ]; then
        log_ok "Creating $ADDON_TITLE response file: $UI_RESPONSE_FILE"
        echo '{}' >"$UI_RESPONSE_FILE"
        chmod 600 "$UI_RESPONSE_FILE"
    fi

    UI_RESPONSE=$(cat "$UI_RESPONSE_FILE")
    if [ -z "$UI_RESPONSE" ] || ! echo "$UI_RESPONSE" | jq empty 2>/dev/null; then
        log_warn "Response file is empty or contains invalid JSON, resetting to {}"
        UI_RESPONSE="{}"
        echo '{}' >"$UI_RESPONSE_FILE"
    fi
}

save_ui_response() {

    log_debug "Saving UI response to $UI_RESPONSE_FILE"

    if [ -z "$UI_RESPONSE" ]; then
        log_error "UI_RESPONSE is empty, refusing to overwrite $UI_RESPONSE_FILE"
        return 1
    fi

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

    local json_content
    json_content=$(jq --arg msg "$message" '.xray.test = $msg' "$UI_RESPONSE_FILE" 2>/dev/null)
    if [ -z "$json_content" ]; then
        log_warn "Failed to update test result in response file."
        return 1
    fi
    echo "$json_content" >"/tmp/xray-response.$$.tmp" && mv -f "/tmp/xray-response.$$.tmp" "$UI_RESPONSE_FILE"
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

    if [ -z "$json_content" ]; then
        log_warn "Failed to update loading progress in response file."
        return 1
    fi

    echo "$json_content" >"/tmp/xray-response.$$.tmp" && mv -f "/tmp/xray-response.$$.tmp" "$UI_RESPONSE_FILE"

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

    json_content=$(echo "$json_content" | jq 'del(.loading)' 2>/dev/null)

    if [ -z "$json_content" ]; then
        log_warn "Failed to remove loading progress from response file."
        return 1
    fi

    echo "$json_content" >"/tmp/xray-response.$$.tmp" && mv -f "/tmp/xray-response.$$.tmp" "$UI_RESPONSE_FILE"
}

fixme() {
    log_info "Attempting to fix XRAY UI issues..."

    # Check disk space first
    local jffs_usage=$(df /jffs 2>/dev/null | awk 'NR==2 {print $5}' | tr -d '%')
    if [ -n "$jffs_usage" ] && [ "$jffs_usage" -gt 90 ]; then
        log_warn "/jffs is ${jffs_usage}% full! Listing large files:"
        find /jffs -type f -size +100k -exec ls -lh {} \; 2>/dev/null | head -20
        log_warn "Consider removing old backups or logs before proceeding."
    fi

    log_info "Removing XRAY broken payload settings..."
    if grep -q '^xray_payload' /jffs/addons/custom_settings.txt 2>/dev/null; then
        grep -v '^xray_payload' /jffs/addons/custom_settings.txt >/tmp/custom_settings.tmp &&
            mv /tmp/custom_settings.tmp /jffs/addons/custom_settings.txt ||
            log_warn "Failed to remove broken payload settings"
    else
        log_info "No broken payload settings found."
    fi

    log_info "Removing file $UI_RESPONSE_FILE..."
    rm -f "$UI_RESPONSE_FILE" || log_warn "Failed to remove $UI_RESPONSE_FILE"

    cleanup_stale_asdfiles

    log_ok "Done with fixme function."
}

urldecode() {
    local data=$1
    printf '%b' "$(printf '%s' "$data" | sed 's/%\([0-9A-Fa-f][0-9A-Fa-f]\)/\\x\1/g')"
}

is_json() {
    echo "$1" | jq -e . >/dev/null 2>&1
}

xrayui_core_version() {
    if [ -z "$XRAYUI_CORE_VER_CACHE" ]; then
        XRAYUI_CORE_VER_CACHE=$(xray version 2>/dev/null | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -n 1)
        [ -z "$XRAYUI_CORE_VER_CACHE" ] && XRAYUI_CORE_VER_CACHE="-"
    fi
    [ "$XRAYUI_CORE_VER_CACHE" = "-" ] || printf '%s' "$XRAYUI_CORE_VER_CACHE"
}

version_ge() {
    [ "$(printf '%s\n%s\n' "$2" "$1" | sort -t. -k1,1n -k2,2n -k3,3n | head -n1)" = "$2" ]
}

core_supports_allow_insecure() {
    local v
    v=$(xrayui_core_version)
    [ -z "$v" ] && return 0
    version_ge "$v" "26.3.27" && return 1
    return 0
}

b64d() {
    echo "$1" | base64 -d 2>/dev/null
}

get_or_create_hwid() {
    local hwid_file="$ADDON_SHARE_DIR/.hwid"
    if [ -f "$hwid_file" ]; then
        cat "$hwid_file"
        return
    fi
    local hwid=""
    if [ -f /proc/sys/kernel/random/uuid ]; then
        hwid=$(cat /proc/sys/kernel/random/uuid)
    else
        hwid=$(openssl rand -hex 16 | sed 's/\(.\{8\}\)\(.\{4\}\)\(.\{4\}\)\(.\{4\}\)\(.\{12\}\)/\1-\2-\3-\4-\5/')
    fi
    printf '%s' "$hwid" >"$hwid_file"
    printf '%s' "$hwid"
}

cleanup_stale_asdfiles() {
    # Purge orphaned xrayui staging files and any ASD (Asus Self Defense) backups
    local asdbk="/jffs/.asdbk"

    rm -f /tmp/xrayui_*.tmp.* 2>/dev/null
    rm -f /tmp/xrayui_dnsmasq_direct.tmp.* 2>/dev/null
    rm -f /tmp/xrayui_geoip4.* /tmp/xrayui_geoip6.* 2>/dev/null
    rm -f /tmp/xrayui_config.* /tmp/xrayui-dnsmasq-servers.* 2>/dev/null
    rm -f /tmp/xrayui_script.* /tmp/xrayui_payload* 2>/dev/null

    if [ -d "$asdbk" ]; then
        rm -f "$asdbk"/xrayui_*_bk "$asdbk"/*xrayui*.tmp.*_bk 2>/dev/null
    fi

}

urldecode_pct() {
    s=$(printf '%s' "$1" | sed 's/\\/\\\\/g')
    s=$(printf '%s' "$s" | sed -e 's/%\([0-9A-Fa-f][0-9A-Fa-f]\)/\\x\1/g')
    printf '%b' "$s"
}

safe_preview() {
    dd bs=200 count=1 2>/dev/null | tr '\r\n' ' '
}
