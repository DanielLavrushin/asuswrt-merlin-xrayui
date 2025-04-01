#!/bin/sh
initial_response() {
    load_ui_response
    load_xrayui_config

    local geoip_file="/opt/sbin/geoip.dat"
    local geosite_file="/opt/sbin/geosite.dat"

    local geoip_date geosite_date
    geoip_date=$(date -r "$geoip_file" "+%Y-%m-%d %H:%M:%S")
    geosite_date=$(date -r "$geosite_file" "+%Y-%m-%d %H:%M:%S")

    local geositeurl="${geosite_url:-$DEFAULT_GEOSITE_URL}"
    local geoipurl="${geoip_url:-$DEFAULT_GEOIP_URL}"
    local profile="${profile:-$DEFAULT_XRAY_PROFILE_NAME}"

    local json_content
    if [ -f "$UI_RESPONSE_FILE" ]; then
        json_content=$(cat "$UI_RESPONSE_FILE")
    else
        json_content="{}"
    fi

    json_content=$(echo "$json_content" | jq --arg geoip "$geoip_date" --arg geosite "$geosite_date" --arg geoipurl "$geoipurl" --arg geositeurl "$geositeurl" \
        '.geodata.geoip_url = $geoipurl | .geodata.geosite_url = $geositeurl | .geodata.community["geoip.dat"] = $geoip | .geodata.community["geosite.dat"] = $geosite')
    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to update JSON content with file dates." $CERR
        return 1
    fi

    local uptime_xray=$(get_proc_uptime "xray")
    json_content=$(echo "$json_content" | jq --argjson uptime "$uptime_xray" '.xray.uptime = $uptime')
    json_content=$(echo "$json_content" | jq --arg profile "$profile" '.xray.profile = $profile')

    local github_proxy="${github_proxy}"
    if [ ! -z "$github_proxy" ]; then
        json_content=$(echo "$json_content" | jq --arg github_proxy "$github_proxy" '.xray.github_proxy = $github_proxy')
    fi

    local XRAY_VERSION=$(xray version | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -n 1)
    json_content=$(echo "$json_content" | jq --arg xray_ver "$XRAY_VERSION" --arg xrayui_ver "$XRAYUI_VERSION" '.xray.ui_version = $xrayui_ver | .xray.core_version = $xray_ver')

    # Collect the names of all JSON files from /opt/etc/xray
    local profiles
    profiles=$(find /opt/etc/xray -maxdepth 1 -type f -name "*.json" -exec basename {} \; | jq -R -s -c 'split("\n")[:-1]')
    if [ -z "$profiles" ]; then
        profiles="[]"
    fi

    json_content=$(echo "$json_content" | jq --argjson profiles "$profiles" '.xray.profiles = $profiles')

    echo "$json_content" >"$UI_RESPONSE_FILE"
    if [ $? -eq 0 ]; then
        printlog true "Saved file dates to $UI_RESPONSE_FILE successfully." $CSUC
    else
        printlog true "Failed to save file dates to $UI_RESPONSE_FILE." $CERR
        return 1
    fi
}

apply_config() {
    update_loading_progress "Applying new server configuration..." 0
    local temp_config="/tmp/xray_server_config_new.json"
    local backup_config="/opt/etc/xray/config.json-temp.bak"

    local incoming_config=$(reconstruct_payload)

    update_loading_progress "Checking incoming configuration..." 5

    if [ -z "$incoming_config" ]; then
        printlog true "No new server configuration provided."
        exit 1
    fi

    echo "$incoming_config" >"$temp_config"
    if [ $? -ne 0 ]; then
        printlog true "Failed to write incoming configuration to $temp_config." $CERR
        exit 1
    fi

    jq empty "$temp_config" >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        printlog true "Invalid JSON format in incoming server configuration." $CERR
        rm -f "$temp_config"
        exit 1
    fi

    cp "$XRAY_CONFIG_FILE" "$backup_config"
    if [ $? -ne 0 ]; then
        printlog true "Failed to backup existing configuration to $backup_config." $CERR
        rm -f "$temp_config"
        exit 1
    fi
    printlog true "Existing configuration backed up to $backup_config."

    cp "$temp_config" "$XRAY_CONFIG_FILE"
    if [ $? -ne 0 ]; then
        printlog true "Failed to apply new configuration to $XRAY_CONFIG_FILE." $CERR
        cp "$backup_config" "$XRAY_CONFIG_FILE"
        if [ $? -ne 0 ]; then
            printlog true "Critical: Failed to restore configuration from backup." $CERR
        fi
        rm -f "$temp_config"
        exit 1
    fi
    printlog true "New server configuration applied successfully." $CSUC

    rm -f "$temp_config"

    if [ -f "$XRAY_PIDFILE" ]; then
        update_loading_progress "Restarting Xray service..." 35
        restart
        update_loading_progress "Xray service restarted successfully."
    fi

    if [ $? -ne 0 ]; then
        printlog true "Failed to restart Xray service after applying new configuration." $CERR
        cp "$backup_config" "$XRAY_CONFIG_FILE"
        restart
        exit 1
    fi

    printlog true "Xray service restarted successfully with the new configuration." $CSUC

    rm -f "$backup_config"

    update_loading_progress "Configuration applied successfully." 100

    exit 0
}

enable_config_logs() {
    update_loading_progress "Enabling Xray configuration logs..." 0
    local temp_file="/tmp/xray_config.json"

    printlog true "Checking for the 'log' section in the Xray configuration."

    # Check if the config file exists
    if [ ! -f "$XRAY_CONFIG_FILE" ]; then
        printlog true "Configuration file not found: $XRAY_CONFIG_FILE"
        return 1
    fi

    # Check if the 'log' section is missing
    if ! jq -e '.log' "$XRAY_CONFIG_FILE" >/dev/null 2>&1; then
        printlog true "'log' section is missing. Adding it to the configuration."

        # Add the 'log' section
        jq '. + {
            "log": {
                "loglevel": "warning",
                "error": "/tmp/xray_error.log",
                "access": "/tmp/xray_access.log"
            }
        }' "$XRAY_CONFIG_FILE" >"$temp_file"

        if [ $? -eq 0 ]; then
            mv "$temp_file" "$XRAY_CONFIG_FILE"
            printlog true "'log' section added successfully."
        else
            printlog true "Failed to update the configuration with 'log' section."
            rm -f "$temp_file"
            return 1
        fi
    else
        printlog true "'log' section already exists in the configuration."
    fi

    if [ -f "$XRAY_PIDFILE" ]; then
        restart
    fi

    update_loading_progress "Configuration logs enabled successfully." 100
    return 0
}

toggle_startup() {
    local xray_startup=$(am_settings_get xray_startup)
    if [ -z "$xray_startup" ]; then
        am_settings_set xray_startup "y"
        printlog true "xray_startup was empty. Set to 'enabled'." $CWARN
    else
        if [ "$xray_startup" = "y" ]; then
            am_settings_set xray_startup "n"
            printlog true "xray_startup was 'enabled'. Set to 'disabled'." $CSUC
        else
            am_settings_set xray_startup "y"
            printlog true "xray_startup was 'disabled'. Set to 'enabled'." $CSUC
        fi
    fi
}
