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

    log_debug "General options received: $genopts"
    # Extract all general options in a single jq call
    local github_proxy log_level logs_access logs_error logs_dns logs_dnsmasq logs_dor
    local logs_max_size skip_test clients_check debug ipsec check_connection
    local startup_delay xray_sleep_time geosite_url geoip_url geo_auto_update hooks
    local subscriptionLinks xray_dns_only xray_block_quic integration_scribe
    local subscription_auto_refresh subscription_auto_fallback
    local subscription_fallback_interval probe_url probe_interval subscription_filters
    local _genopts_vars
    if ! _genopts_vars=$(echo "$genopts" | jq -r '
        "github_proxy=" + ((.github_proxy // "") | tostring | @sh) + "\n" +
        "log_level=" + ((.logs_level // "warning") | tostring | @sh) + "\n" +
        "logs_access=" + ((.logs_access // "false") | tostring | @sh) + "\n" +
        "logs_error=" + ((.logs_error // "false") | tostring | @sh) + "\n" +
        "logs_dns=" + ((.logs_dns // "false") | tostring | @sh) + "\n" +
        "logs_dnsmasq=" + ((.logs_dnsmasq // "false") | tostring | @sh) + "\n" +
        "logs_dor=" + ((.logs_dor // "false") | tostring | @sh) + "\n" +
        "logs_max_size=" + ((.logs_max_size // 10) | tostring | @sh) + "\n" +
        "skip_test=" + ((.skip_test // "false") | tostring | @sh) + "\n" +
        "clients_check=" + ((.clients_check // "false") | tostring | @sh) + "\n" +
        "debug=" + ((.debug // "false") | tostring | @sh) + "\n" +
        "ipsec=" + ((.ipsec // "off") | tostring | @sh) + "\n" +
        "check_connection=" + ((.check_connection // "false") | tostring | @sh) + "\n" +
        "startup_delay=" + ((.startup_delay // 0) | tostring | @sh) + "\n" +
        "xray_sleep_time=" + ((.sleep_time // 10) | tostring | @sh) + "\n" +
        "geosite_url=" + ((.geo_site_url // "") | tostring | @sh) + "\n" +
        "geoip_url=" + ((.geo_ip_url // "") | tostring | @sh) + "\n" +
        "geo_auto_update=" + ((.geo_auto_update // "false") | tostring | @sh) + "\n" +
        "hooks=" + ((.hooks // {}) | tojson | @sh) + "\n" +
        "subscriptionLinks=" + (((.subscriptions.links // []) | join("|")) | @sh) + "\n" +
        "xray_dns_only=" + ((.dns_only // "false") | tostring | @sh) + "\n" +
        "xray_block_quic=" + ((.block_quic // "false") | tostring | @sh) + "\n" +
        "integration_scribe=" + ((.logs_scribe // "false") | tostring | @sh) + "\n" +
        "subscription_auto_refresh=" + ((.subscription_auto_refresh // "disabled") | tostring | @sh) + "\n" +
        "subscription_auto_fallback=" + ((.subscription_auto_fallback // "false") | tostring | @sh) + "\n" +
        "subscription_fallback_interval=" + ((.subscription_fallback_interval // "5") | tostring | @sh) + "\n" +
        "probe_url=" + ((.probe_url // "https://www.google.com/generate_204") | tostring | @sh) + "\n" +
        "probe_interval=" + ((.probe_interval // 30) | tostring | @sh) + "\n" +
        "subscription_filters=" + (((.subscriptions.filters // []) | join("|")) | @sh)
    '); then
        log_error "Failed to parse general options payload."
        return 1
    fi
    eval "$_genopts_vars"

    if [ ! -d "$ADDON_LOGS_DIR" ]; then
        mkdir -p "$ADDON_LOGS_DIR"
    fi

    local logs_access_path="$ADDON_LOGS_DIR/xray_access.log"
    local logs_error_path="$ADDON_LOGS_DIR/xray_error.log"

    local access_val="none"
    [ "$logs_access" = "true" ] && access_val="$logs_access_path"
    local error_val="none"
    [ "$logs_error" = "true" ] && error_val="$logs_error_path"

    json_content=$(echo "$json_content" | jq \
        --arg loglevel "$log_level" \
        --arg access "$access_val" \
        --arg error "$error_val" \
        --argjson dns_log "$([ "$logs_dns" = "true" ] && echo true || echo false)" \
        '
        .log.loglevel = $loglevel
        | .log.access = $access
        | .log.error = $error
        | if $dns_log then .log.dnsLog = true else del(.log.dnsLog) end
        ')

    if [ -z "$json_content" ]; then
        log_error "Failed to build xray config JSON. Aborting."
        return 1
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
    update_xrayui_config "xray_block_quic" "$xray_block_quic"
    update_xrayui_config "integration_scribe" "$integration_scribe"
    update_xrayui_config "subscription_auto_refresh" "$subscription_auto_refresh"
    update_xrayui_config "subscription_auto_fallback" "$subscription_auto_fallback"
    update_xrayui_config "subscription_fallback_interval" "$subscription_fallback_interval"
    update_xrayui_config "probe_url" "$probe_url"
    update_xrayui_config "probe_interval" "$probe_interval"

    update_xrayui_config "subscription_filters" "$subscription_filters"

    # Clean up subscription files when no sources are configured
    if [ -z "$subscriptionLinks" ]; then
        rm -f "$XRAYUI_SUBSCRIPTIONS_FILE"
    fi

    apply_general_options_hooks "$hooks"

    # Update the logrotate configuration with the new max size
    logrotate_setup

    # Update cron jobs
    cron_geodata_add
    cron_subscription_refresh_add
    cron_subscription_fallback_add

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
    local _hooks_vars
    if ! _hooks_vars=$(printf '%s' "$hooks_json" | jq -r '
        "before=" + ((.before_firewall_start // "") | tostring | @sh) + "\n" +
        "after=" + ((.after_firewall_start // "") | tostring | @sh) + "\n" +
        "cleanup=" + ((.after_firewall_cleanup // "") | tostring | @sh)
    '); then
        log_error "Failed to parse hooks payload."
        return 1
    fi
    eval "$_hooks_vars"

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
