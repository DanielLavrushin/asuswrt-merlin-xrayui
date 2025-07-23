#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

apply_general_options() {
    log_info "Applying general settings..."
    update_loading_progress "Applying general settings..."

    load_xrayui_config

    local temp_config="/tmp/xray_server_config_new.json"
    local json_content=$(cat "$XRAY_CONFIG_FILE")

    local genopts=$(reconstruct_payload)

    log_debug "General options recieved: $genopts"
    # setting logs
    local github_proxy=$(echo "$genopts" | jq -r '.github_proxy')
    local log_level=$(echo "$genopts" | jq -r '.logs_level')
    local logs_access=$(echo "$genopts" | jq -r '.logs_access')
    local logs_error=$(echo "$genopts" | jq -r '.logs_error')
    local logs_dns=$(echo "$genopts" | jq -r '.logs_dns')
    local logs_dnsmasq=$(echo "$genopts" | jq -r '.logs_dnsmasq')
    local logs_dor=$(echo "$genopts" | jq -r '.logs_dor')
    local logs_max_size=$(echo "$genopts" | jq -r '.logs_max_size')
    local skip_test=$(echo "$genopts" | jq -r '.skip_test')
    local clients_check=$(echo "$genopts" | jq -r '.clients_check')
    local debug=$(echo "$genopts" | jq -r '.debug')
    local ipsec=$(echo "$genopts" | jq -r '.ipsec')
    local check_connection=$(echo "$genopts" | jq -r '.check_connection')
    local startup_delay=$(echo "$genopts" | jq -r '.startup_delay')
    local xray_sleep_time=$(echo "$genopts" | jq -r '.sleep_time // 10')

    local geosite_url=$(echo "$genopts" | jq -r '.geo_site_url')
    local geoip_url=$(echo "$genopts" | jq -r '.geo_ip_url')
    local geo_auto_update=$(echo "$genopts" | jq -r '.geo_auto_update')
    local hooks=$(echo "$genopts" | jq -r '.hooks')

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

    apply_general_options_hooks "$hooks"

    # Update the logrotate configuration with the new max size
    logrotate_setup

    # Update the cron job for geodata update
    cron_geodata_add

    if [ -f "$XRAY_PIDFILE" ]; then
        update_loading_progress "Restarting Xray service..."
        restart
    fi
}

apply_general_options_hooks() {
    local hooks_json="$1"
    local before=$(printf '%s' "$hooks_json" | jq -r '.before_firewall_start')
    local after=$(printf '%s' "$hooks_json" | jq -r '.after_firewall_start')
    local cleanup=$(printf '%s' "$hooks_json" | jq -r '.after_firewall_cleanup')

    log_debug "Applying hooks: before='$before', after='$after', cleanup='$cleanup'"

    local script_before="$ADDON_USER_SCRIPTS_DIR/firewall_before_start"
    local script_after="$ADDON_USER_SCRIPTS_DIR/firewall_after_start"
    local script_cleanup="$ADDON_USER_SCRIPTS_DIR/firewall_after_cleanup"

    [ -n "$before" ] && printf '#!/bin/sh\n%s\n' "$before" >"$script_before" && chmod +x "$script_before"
    [ -n "$after" ] && printf '#!/bin/sh\n%s\n' "$after" >"$script_after" && chmod +x "$script_after"
    [ -n "$cleanup" ] && printf '#!/bin/sh\n%s\n' "$cleanup" >"$script_cleanup" && chmod +x "$script_cleanup"
}
