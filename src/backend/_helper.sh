# Color Codes
CERR='\033[0;31m'
CSUC='\033[0;32m'
CWARN='\033[0;33m'
CINFO='\033[0;36m'
CRESET='\033[0m'

printlog() {
    if [ "$1" = "true" ]; then
        logger -t "XRAYUI" "$2"
    fi
    printf "${CINFO}${3}%s${CRESET}\\n" "$2"
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
                printlog true "Found existing $ADDON_TAG_UPPER page: $ADDON_USER_PAGE" $CSUC
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
        printlog true "Found existing $ADDON_TAG_UPPER page: $ADDON_USER_PAGE" $CSUC
        return
    fi

    if [ "$1" = "true" ]; then
        i=1
        while true; do
            if ! echo "$used_pages" | grep -qw "$i"; then
                ADDON_USER_PAGE="user$i.asp"
                printlog true "Assigning new $ADDON_TAG_UPPER page: $ADDON_USER_PAGE" $CSUC
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
    FD=386
    eval exec "$FD>$XRAYUI_LOCKFILE"

    if ! flock -x "$FD"; then
        return 1
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

    echo "$payload"

    # Release the lock
    flock -u "$FD"
}

cleanup_payload() {
    # clean up all payload chunks from the custom settings
    sed -i '/^xray_payload/d' /jffs/addons/custom_settings.txt
}

load_ui_response() {

    if [ ! -f "$UI_RESPONSE_FILE" ]; then
        printlog true "Creating $ADDON_TITLE response file: $UI_RESPONSE_FILE"
        echo '{}' >"$UI_RESPONSE_FILE"
        chmod 600 "$UI_RESPONSE_FILE"
    fi

    if [ -f "$UI_RESPONSE_FILE" ]; then
        UI_RESPONSE=$(cat "$UI_RESPONSE_FILE")
    else
        UI_RESPONSE="{}"
    fi

}

save_ui_response() {
    echo "$UI_RESPONSE" >"$UI_RESPONSE_FILE" || {
        printlog true "Failed to save UI response to $UI_RESPONSE_FILE" $CERR
        return 1
    }
}

test_xray_config() {
    printlog true "Testing xray configuration $ADDON_TITLE..."
    update_loading_progress "Testing xray configuration $ADDON_TITLE..."

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
    printlog true "Xray config test result: $output"

    load_ui_response

    local updated_json=$(jq --arg msg "$message" '.xray.test = $msg' "$UI_RESPONSE_FILE")
    echo "$updated_json" >"$UI_RESPONSE_FILE"
}

update_loading_progress() {
    local message=$1
    local progress=$2

    if [ ! -f "$ADDON_WEB_DIR" ]; then
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

    echo "$json_content" >"$UI_RESPONSE_FILE"

    if [ "$progress" = "100" ]; then
        /jffs/scripts/xrayui service_event cleanloadingprogress &
    fi

}

remove_loading_progress() {

    printlog true "Removing loading progress..."
    if [ ! -f "$ADDON_WEB_DIR" ]; then
        return
    fi

    sleep 1
    load_ui_response

    local json_content=$(cat "$UI_RESPONSE_FILE")

    json_content=$(echo "$json_content" | jq '
            del(.loading)
        ')

    echo "$json_content" >"$UI_RESPONSE_FILE"
    exit 0
}

fixme() {
    printlog true "Attempting to fix XRAY UI issues..."

    printlog true "Removing XRAY broken payload settings..."

    sed -i '/^xray_payload/d' /jffs/addons/custom_settings.txt

    printlog true "Removing file $UI_RESPONSE_FILE..."
    rm -f $UI_RESPONSE_FILE

    printlog true "Removing file $XRAYUI_CLIENTS_FILE..."
    rm -f $XRAYUI_CLIENTS_FILE

    printlog true "Done with fixme function." "$CSUC"
}
