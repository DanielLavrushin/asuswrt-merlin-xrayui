#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

apply_general_options() {
    log_info "Applying general settings..."
    update_loading_progress "Applying general settings..."

    load_xrayui_config

    # Store old geodata URLs before updating
    local old_geosite_url="${geosite_url:-$DEFAULT_GEOSITE_URL}"
    local old_geoip_url="${geoip_url:-$DEFAULT_GEOIP_URL}"

    local temp_config="/tmp/xray_server_config_new.json"
    local json_content=$(cat "$XRAY_CONFIG_FILE")

    local genopts=$(reconstruct_payload)

    log_debug "General options recieved: $genopts"
    # setting logs
    local github_proxy=$(echo "$genopts" | jq -r '.github_proxy // ""')
    local log_level=$(echo "$genopts" | jq -r '.logs_level // "warning"')
    local logs_access=$(echo "$genopts" | jq -r '.logs_access // "false"')
    local logs_error=$(echo "$genopts" | jq -r '.logs_error // "false"')
    local logs_dns=$(echo "$genopts" | jq -r '.logs_dns // "false"')
    local logs_dnsmasq=$(echo "$genopts" | jq -r '.logs_dnsmasq // "false"')
    local logs_dor=$(echo "$genopts" | jq -r '.logs_dor // "false"')
    local logs_max_size=$(echo "$genopts" | jq -r '.logs_max_size // 10')
    local skip_test=$(echo "$genopts" | jq -r '.skip_test // "false"')
    local clients_check=$(echo "$genopts" | jq -r '.clients_check // "false"')
    local debug=$(echo "$genopts" | jq -r '.debug // "false"')
    local ipsec=$(echo "$genopts" | jq -r '.ipsec // "off"')
    local check_connection=$(echo "$genopts" | jq -r '.check_connection // "false"')
    local startup_delay=$(echo "$genopts" | jq -r '.startup_delay // 0')
    local xray_sleep_time=$(echo "$genopts" | jq -r '.sleep_time // 10')

    local geosite_url=$(echo "$genopts" | jq -r '.geo_site_url // ""')
    local geoip_url=$(echo "$genopts" | jq -r '.geo_ip_url // ""')
    local geo_auto_update=$(echo "$genopts" | jq -r '.geo_auto_update // "false"')
    local hooks=$(echo "$genopts" | jq -c '.hooks // {}')
    local subscriptionLinks=$(echo "$genopts" | jq -r '(.subscriptions.links // []) | join("|")')
    local xray_dns_only=$(echo "$genopts" | jq -r '.dns_only // "false"')
    local integration_scribe=$(echo "$genopts" | jq -r '.logs_scribe // "false"')

    if [ ! -d "$ADDON_LOGS_DIR" ]; then
        mkdir -p "$ADDON_LOGS_DIR"
    fi

    local logs_access_path="$ADDON_LOGS_DIR/xray_access.log"
    local logs_error_path="$ADDON_LOGS_DIR/xray_error.log"

    json_content=$(echo "$json_content" | jq --arg loglevel "$log_level" '.log.loglevel = $loglevel')

    if [ "$logs_access" = "true" ]; then
        json_content=$(echo "$json_content" | jq --arg logs_access_path "$logs_access_path" '.log.access = $logs_access_path')
    else
        json_content=$(echo "$json_content" | jq '.log.access = "none"')
    fi

    if [ "$logs_error" = "true" ]; then
        json_content=$(echo "$json_content" | jq --arg logs_error_path "$logs_error_path" '.log.error = $logs_error_path')
    else
        json_content=$(echo "$json_content" | jq '.log.error = "none"')
    fi

    if [ "$logs_dns" = "true" ]; then
        json_content=$(echo "$json_content" | jq '.log.dnsLog = true')
    else
        json_content=$(echo "$json_content" | jq 'del(.log.dnsLog)')
    fi

    echo "$json_content" >"$temp_config"
    cp "$temp_config" "$XRAY_CONFIG_FILE"
    rm -f "$temp_config"

    update_xrayui_config "logs_dnsmasq" "$logs_dnsmasq"
    update_xrayui_config "github_proxy" "$github_proxy"
    update_xrayui_config "geosite_url" "$geosite_url"
    update_xrayui_config "geoip_url" "$geoip_url"
    update_xrayui_config "logs_max_size" "$logs_max_size"
    update_xrayui_config "logs_dor" "$logs_dor"
    update_xrayui_config "geo_auto_update" "$geo_auto_update"
    update_xrayui_config "skip_test" "$skip_test"
    update_xrayui_config "clients_check" "$clients_check"
    update_xrayui_config "ipsec" "$ipsec"
    update_xrayui_config "ADDON_DEBUG" "$debug"
    update_xrayui_config "check_connection" "$check_connection"
    update_xrayui_config "startup_delay" "$startup_delay"
    update_xrayui_config "xray_sleep_time" "$xray_sleep_time"
    update_xrayui_config "subscriptionLinks" "$subscriptionLinks"
    update_xrayui_config "xray_dns_only" "$xray_dns_only"
    update_xrayui_config "integration_scribe" "$integration_scribe"

    apply_general_options_hooks "$hooks"

    # Update the logrotate configuration with the new max size
    logrotate_setup

    # Update the cron job for geodata update
    cron_geodata_add

    # integration scribe
    logs_scribe_integration

    # Check if geodata URLs have changed and update if necessary
    local geodata_updated=false
    if [ "$old_geosite_url" != "$geosite_url" ] || [ "$old_geoip_url" != "$geoip_url" ]; then
        log_info "Geodata URLs have changed. Updating geodata files..."
        log_debug "Old geosite URL: $old_geosite_url, New: $geosite_url"
        log_debug "Old geoip URL: $old_geoip_url, New: $geoip_url"
        update_community_geodata
        geodata_updated=true
    fi

    if [ -f "$XRAY_PIDFILE" ] && [ "$geodata_updated" = false ]; then
        update_loading_progress "Restarting Xray service..."
        restart
    fi
}

apply_general_options_hooks() {
    local hooks_json="$1"
    [ -z "$hooks_json" ] && hooks_json="{}"
    [ "$hooks_json" = "null" ] && hooks_json="{}"

    local before after cleanup
    before=$(printf '%s' "$hooks_json" | jq -r '.before_firewall_start // empty')
    after=$(printf '%s' "$hooks_json" | jq -r '.after_firewall_start // empty')
    cleanup=$(printf '%s' "$hooks_json" | jq -r '.after_firewall_cleanup // empty')

    local script_before="$ADDON_USER_SCRIPTS_DIR/firewall_before_start"
    local script_after="$ADDON_USER_SCRIPTS_DIR/firewall_after_start"
    local script_cleanup="$ADDON_USER_SCRIPTS_DIR/firewall_after_cleanup"

    if [ -n "$(printf '%s' "$before" | tr -d ' \t\r\n')" ]; then
        printf '%s\n%s\n' '#!/bin/sh' "$before" >"$script_before" && chmod +x "$script_before"
    else
        rm -f "$script_before"
    fi

    if [ -n "$(printf '%s' "$after" | tr -d ' \t\r\n')" ]; then
        printf '%s\n%s\n' '#!/bin/sh' "$after" >"$script_after" && chmod +x "$script_after"
    else
        rm -f "$script_after"
    fi

    if [ -n "$(printf '%s' "$cleanup" | tr -d ' \t\r\n')" ]; then
        printf '%s\n%s\n' '#!/bin/sh' "$cleanup" >"$script_cleanup" && chmod +x "$script_cleanup"
    else
        rm -f "$script_cleanup"
    fi
}
