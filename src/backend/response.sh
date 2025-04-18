#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

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
    local geo_auto_update="${geo_auto_update:-false}"
    local profile="${profile:-$DEFAULT_XRAY_PROFILE_NAME}"
    local dnsmasq="${dnsmasq:-false}"
    local logs_dor="${logs_dor:-false}"
    local logs_max_size="${logs_max_size:-10}"

    printlog true "dnsmaq: $dnsmasq"
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg geoip "$geoip_date" --arg geosite "$geosite_date" --arg geoipurl "$geoipurl" --arg geositeurl "$geositeurl" \
        '.geodata.geoip_url = $geoipurl | .geodata.geosite_url = $geositeurl | .geodata.community["geoip.dat"] = $geoip | .geodata.community["geosite.dat"] = $geosite')
    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to update JSON content with file dates." $CERR
        return 1
    fi
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson geo_auto_update "$geo_auto_update" '.geodata.auto_update = $geo_auto_update')

    local uptime_xray=$(get_proc_uptime "xray")
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson uptime "$uptime_xray" '.xray.uptime = $uptime')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg profile "$profile" '.xray.profile = $profile')

    local github_proxy="${github_proxy:-""}"
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg github_proxy "$github_proxy" '.xray.github_proxy = $github_proxy')

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson dnsmasq "$dnsmasq" '.xray.dnsmasq = $dnsmasq')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson logs_dor "$dnsmasq" '.xray.logs_dor = $logs_dor')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson logs_max_size "$logs_max_size" '.xray.logs_max_size = $logs_max_size')

    local XRAY_VERSION=$(xray version | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -n 1)
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg xray_ver "$XRAY_VERSION" --arg xrayui_ver "$XRAYUI_VERSION" '.xray.ui_version = $xrayui_ver | .xray.core_version = $xray_ver')

    # Collect the names of all JSON files from /opt/etc/xray
    local profiles=$(find /opt/etc/xray -maxdepth 1 -type f -name "*.json" -exec basename {} \; | jq -R -s -c 'split("\n")[:-1]')
    if [ -z "$profiles" ]; then
        profiles="[]"
    fi
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson profiles "$profiles" '.xray.profiles = $profiles')

    # Collect the backups
    local backups=$(find "$ADDON_SHARE_DIR/backup" -maxdepth 1 -type f -name "*.tar.gz" -exec basename {} \; | jq -R -s -c 'split("\n")[:-1]')
    if [ -z "$backups" ]; then
        backups="[]"
    fi
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson backups "$backups" '.xray.backups = $backups')
    printlog true "Backups: $backups"

    save_ui_response

    if [ $? -eq 0 ]; then
        printlog true "Saved initial response successfully." $CSUC
    else
        printlog true "Failed to save file dates to $UI_RESPONSE_FILE." $CERR
        return 1
    fi
}

apply_config() {

    update_loading_progress "Applying new server configuration..." 0

    load_xrayui_config

    local temp_config="/tmp/xray_server_config_new.json"
    local backup_config="/opt/etc/xray/config.json-temp.bak"

    local incoming_config=$(reconstruct_payload)

    update_loading_progress "Checking incoming configuration..." 5

    if [ -z "$incoming_config" ]; then
        printlog true "No new server configuration provided."
        exit 1
    fi

    printlog true "Setting up DNS rules for incoming configuration..."
    incoming_config=$(rules_to_dns_domains "$incoming_config")

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

    printlog true "Applying new server configuration to $XRAY_CONFIG_FILE..."
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

rules_to_dns_domains() {
    local configcontent="$1"

    local just_parsed
    just_parsed="$(echo "$configcontent" | jq . 2>/dev/null)"
    if [ -z "$just_parsed" ]; then
        echo "$configcontent"
        return 0
    fi

    local updated="$(echo "$just_parsed" | jq '
    # Safely ensure .routing, .routing.rules, .dns, and .dns.servers exist
    if .routing == null then .routing = {} else . end
    | if .routing.rules == null then .routing.rules = [] else . end
    | if .dns == null then .dns = {} else . end
    | if .dns.servers == null then (.dns.servers = []) else . end

    # Grab the array of all rules for reference
    | .routing.rules as $allRules

    # Rewrite .dns.servers
    | .dns.servers |= (
        map(
          if ( (type == "object") and (.rules? | length) > 0 ) then
            .domains = (
              [
                .rules[] as $ruleId
                | $allRules[]
                | select(.idx == $ruleId)
                | ( .domain // [] )
              ]
              | flatten
            )
            | .
          else
            .
          end
        )
      )
      # --- Final cleanup ---
      | if (.dns.servers | length) == 0 then del(.dns.servers) else . end
      | if (.dns | keys | length) == 0 then del(.dns) else . end
    ')"

    if [ -z "$updated" ]; then
        echo "$configcontent"
        return 0
    fi

    echo "$updated"
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
