#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

initial_response() {
    load_ui_response
    load_xrayui_config
    log_debug "Initial response started."

    local geoip_file="/opt/sbin/geoip.dat"
    local geosite_file="/opt/sbin/geosite.dat"

    local geoip_date geosite_date
    if [ -r "$geoip_file" ]; then
        geoip_date=$(date -r "$geoip_file" "+%Y-%m-%d %H:%M:%S")
    else
        geoip_date="(missing)"
        log_warn "GeoIP file not found at $geoip_file"
    fi

    if [ -r "$geosite_file" ]; then
        geosite_date=$(date -r "$geosite_file" "+%Y-%m-%d %H:%M:%S")
    else
        geosite_date="(missing)"
        log_warn "GeoSite file not found at $geosite_file"
    fi

    local geositeurl="${geosite_url:-$DEFAULT_GEOSITE_URL}"
    local geoipurl="${geoip_url:-$DEFAULT_GEOIP_URL}"
    local geo_auto_update="${geo_auto_update:-false}"
    local profile="${profile:-$DEFAULT_XRAY_PROFILE_NAME}"
    local logs_dor="${logs_dor:-false}"
    local logs_max_size="${logs_max_size:-10}"
    local skip_test="${skip_test:-false}"
    local clients_check="${clients_check:-false}"
    local ipsec="${ipsec:-off}"
    local debug="${ADDON_DEBUG:-false}"
    local check_connection="${check_connection:-false}"
    local startup_delay="${startup_delay:-0}"
    local xray_sleep_time="${xray_sleep_time:-10}"
    local subscriptionLinks="${subscriptionLinks:-""}"
    local xray_dns_only="${xray_dns_only:-false}"
    local integration_scribe="${integration_scribe:-false}"
    local subscription_auto_refresh="${subscription_auto_refresh:-disabled}"
    local subscription_auto_fallback="${subscription_auto_fallback:-false}"
    local subscription_fallback_interval="${subscription_fallback_interval:-5}"
    local probe_url="${probe_url:-https://www.google.com/generate_204}"

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg geoip "$geoip_date" --arg geosite "$geosite_date" --arg geoipurl "$geoipurl" --arg geositeurl "$geositeurl" \
        '.geodata.geoip_url = $geoipurl | .geodata.geosite_url = $geositeurl | .geodata.community["geoip.dat"] = $geoip | .geodata.community["geosite.dat"] = $geosite')
    if [ $? -ne 0 ]; then
        log_error "Error: Failed to update JSON content with file dates."
        return 1
    fi
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson geo_auto_update "$geo_auto_update" '.geodata.auto_update = $geo_auto_update')

    local uptime_xray=$(get_proc_uptime "xray")
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson uptime "$uptime_xray" '.xray.uptime = $uptime')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg profile "$profile" '.xray.profile = $profile')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson skip_test "$skip_test" '.xray.skip_test = $skip_test')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson clients_check "$clients_check" '.xray.clients_check = $clients_check')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson check_connection "$check_connection" '.xray.check_connection = $check_connection')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg probe_url "$probe_url" '.xray.probe_url = $probe_url')

    local github_proxy="${github_proxy:-""}"
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg github_proxy "$github_proxy" '.xray.github_proxy = $github_proxy')

    local dnsmasq_enabled=false
    if [ "$logs_dnsmasq" = true ]; then
        for f in /etc/dnsmasq.conf; do
            [ -f "$f" ] || continue
            grep -qE '^\s*log-queries' "$f" &&
                grep -qE '^\s*log-facility=.*dnsmasq\.log' "$f" && dnsmasq_enabled=true && log_debug "dnsmasq enabled in $f"
            if [ "$dnsmasq_enabled" = true ]; then
                break
            fi
        done
    fi

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson dnsmasq "$dnsmasq_enabled" '.xray.dnsmasq = $dnsmasq') || log_error "Error: Failed to update JSON content with dnsmasq status."

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson logs_dor "$logs_dor" '.xray.logs_dor = $logs_dor')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson logs_max_size "$logs_max_size" '.xray.logs_max_size = $logs_max_size')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg ipsec "$ipsec" '.xray.ipsec = $ipsec')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson startup_delay "$startup_delay" '.xray.startup_delay = $startup_delay')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson sleep_time "$xray_sleep_time" '.xray.sleep_time = $sleep_time')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg subscriptionLinks "$subscriptionLinks" '.xray.subscriptions.links = ($subscriptionLinks | split("|"))')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson xray_dns_only "$xray_dns_only" '.xray.dns_only = $xray_dns_only')
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq \
        --arg sar "$subscription_auto_refresh" \
        --arg saf "$subscription_auto_fallback" \
        --arg sfi "$subscription_fallback_interval" \
        '.xray.subscription_auto_refresh = $sar
         | .xray.subscription_auto_fallback = ($saf == "true")
         | .xray.subscription_fallback_interval = ($sfi | tonumber)')

    # grab firewall hooks
    local hook_before_firewall_start=$(sed '1{/^#!/d}' "$ADDON_USER_SCRIPTS_DIR/firewall_before_start" 2>/dev/null || echo "")
    local after_firewall_start=$(sed '1{/^#!/d}' "$ADDON_USER_SCRIPTS_DIR/firewall_after_start" 2>/dev/null || echo "")
    local after_firewall_cleanup=$(sed '1{/^#!/d}' "$ADDON_USER_SCRIPTS_DIR/firewall_after_cleanup" 2>/dev/null || echo "")

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg hook_before_firewall_start "$hook_before_firewall_start" \
        --arg after_firewall_start "$after_firewall_start" \
        --arg after_firewall_cleanup "$after_firewall_cleanup" \
        '.xray.hooks = {
            before_firewall_start: $hook_before_firewall_start,
            after_firewall_start: $after_firewall_start,
            after_firewall_cleanup: $after_firewall_cleanup
        }') || log_error "Error: Failed to update JSON content with firewall hooks."

    local XRAY_VERSION=$(xray version | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -n 1) || log_error "Error: Failed to get Xray version."
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg xray_ver "$XRAY_VERSION" --arg xrayui_ver "$XRAYUI_VERSION" '.xray.ui_version = $xrayui_ver | .xray.core_version = $xray_ver')

    # Collect the names of all JSON files from /opt/etc/xray
    local profiles=$(find /opt/etc/xray -maxdepth 1 -type f -name "*.json" -exec basename {} \; | jq -R -s -c 'split("\n")[:-1]')
    if [ -z "$profiles" ]; then
        profiles="[]"
    fi
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson profiles "$profiles" '.xray.profiles = $profiles') || log_error "Error: Failed to update JSON content with profiles."

    # Collect the backups
    local backups=$(
        find "$ADDON_SHARE_DIR/backup" -maxdepth 1 -type f -name "*.tar.gz" \
            -printf "%T@ %f\n" | sort -nr | awk '{print $2}' |
            jq -R -s -c 'split("\n")[:-1]'
    )

    [ -z "$backups" ] && backups="[]"

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson backups "$backups" '.xray.backups = $backups')

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq 'del(.loading)')

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson debug "$debug" '.xray.debug = $debug')

    # integrations
    if [ -f /jffs/scripts/scribe ]; then
        UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson integration_scribe "$integration_scribe" '.integration.scribe = {
            enabled: $integration_scribe,
        }')
    fi

    save_ui_response

    if [ $? -eq 0 ]; then
        log_ok "Saved initial response successfully."
    else
        log_error "Failed to save file to $UI_RESPONSE_FILE."
        return 1
    fi
}

apply_config() {

    update_loading_progress "Applying new server configuration..." 0

    load_xrayui_config

    local temp_config="/tmp/xray_server_config_new.json"
    local backup_config="/opt/etc/xray/$(basename $XRAY_CONFIG_FILE)-temp.bak"

    local incoming_config=$(reconstruct_payload)

    update_loading_progress "Checking incoming configuration..." 5

    if [ -z "$incoming_config" ]; then
        log_info "No new server configuration provided."
        exit 1
    fi

    log_info "Setting up DNS rules for incoming configuration..."
    incoming_config=$(rules_to_dns_domains "$incoming_config")

    echo "$incoming_config" >"$temp_config"
    if [ $? -ne 0 ]; then
        log_error "Failed to write incoming configuration to $temp_config."
        exit 1
    fi

    jq empty "$temp_config" >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        log_error "Invalid JSON format in incoming server configuration."
        rm -f "$temp_config"
        exit 1
    fi

    log_info "Applying new server configuration to $XRAY_CONFIG_FILE..."
    backup_xray_config
    cp "$XRAY_CONFIG_FILE" "$backup_config"
    if [ $? -ne 0 ]; then
        log_error "Failed to backup existing configuration to $backup_config."
        rm -f "$temp_config"
        exit 1
    fi

    log_info "Existing configuration backed up to $backup_config."
    cp "$temp_config" "$XRAY_CONFIG_FILE"
    if [ $? -ne 0 ]; then
        log_error "Failed to apply new configuration to $XRAY_CONFIG_FILE."
        cp "$backup_config" "$XRAY_CONFIG_FILE"
        if [ $? -ne 0 ]; then
            log_error "Critical: Failed to restore configuration from backup."
        fi
        rm -f "$temp_config"
        exit 1
    fi
    log_ok "New server configuration applied successfully."

    rm -f "$temp_config"

    if [ -f "$XRAY_PIDFILE" ]; then
        update_loading_progress "Restarting Xray service..." 35
        restart
        update_loading_progress "Xray service restarted successfully."
    fi

    if [ $? -ne 0 ]; then
        log_error "Failed to restart Xray service after applying new configuration."
        cp "$backup_config" "$XRAY_CONFIG_FILE"
        restart
        exit 1
    fi

    log_ok "Xray service restarted successfully with the new configuration."

    rm -f "$backup_config"
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
  if .routing == null then .routing = {} else . end
  | if .routing.rules == null then .routing.rules = [] else . end
  | if .dns == null then .dns = {} else . end
  | if .dns.servers == null then (.dns.servers = []) else . end

  | .routing.rules as $allRules

  | .dns.servers |= (
      map(
        if ( (type == "object") and (.rules? | length) > 0 ) then
          .domains = (
            [ .rules[] as $ruleId
              | $allRules[]
              | select(.idx == $ruleId)
              | ( .domain // [] )
            ]
            | flatten
          )
          | .expectIPs = (
              [ .rules[] as $ruleId
                | $allRules[]
                | select(.idx == $ruleId)
                | ( .ip // [] )
              ]
              | flatten
            )
          | .
        else
          .
        end
      )
    )
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
        log_warn "xray_startup was empty. Set to 'enabled'."
    else
        if [ "$xray_startup" = "y" ]; then
            am_settings_set xray_startup "n"
            log_ok "xray_startup was 'enabled'. Set to 'disabled'."
        else
            am_settings_set xray_startup "y"
            log_ok "xray_startup was 'disabled'. Set to 'enabled'."
        fi
    fi
}
