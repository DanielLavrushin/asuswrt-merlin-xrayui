#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

initial_response() {
    load_xrayui_config
    log_debug "Initial response started."

    # Ensure the response file exists and contains valid JSON
    load_ui_response

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
    local xray_block_quic="${xray_block_quic:-false}"
    local integration_scribe="${integration_scribe:-false}"
    local subscription_auto_refresh="${subscription_auto_refresh:-disabled}"
    local subscription_auto_fallback="${subscription_auto_fallback:-false}"
    local subscription_fallback_interval="${subscription_fallback_interval:-5}"
    local subscription_filters="${subscription_filters:-""}"
    local probe_url="${probe_url:-https://www.google.com/generate_204}"

    local uptime_xray=$(get_proc_uptime "xray")

    local github_proxy="${github_proxy:-""}"

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

    # grab firewall hooks
    local hook_before_firewall_start=$(sed '1{/^#!/d}' "$ADDON_USER_SCRIPTS_DIR/firewall_before_start" 2>/dev/null || echo "")
    local after_firewall_start=$(sed '1{/^#!/d}' "$ADDON_USER_SCRIPTS_DIR/firewall_after_start" 2>/dev/null || echo "")
    local after_firewall_cleanup=$(sed '1{/^#!/d}' "$ADDON_USER_SCRIPTS_DIR/firewall_after_cleanup" 2>/dev/null || echo "")

    local XRAY_VERSION
    XRAY_VERSION=$(xray version 2>/dev/null | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -n 1)
    [ -z "$XRAY_VERSION" ] && log_warn "Failed to get Xray version."

    # Collect the names of all JSON files from /opt/etc/xray
    local profiles
    profiles=$(find /opt/etc/xray -maxdepth 1 -type f -name "*.json" -exec basename {} \; | jq -R -s -c 'split("\n")[:-1]' 2>/dev/null)
    if [ -z "$profiles" ]; then
        profiles="[]"
    fi

    # Collect the backups
    local backups
    backups=$(
        find "$ADDON_SHARE_DIR/backup" -maxdepth 1 -type f -name "*.tar.gz" \
            -printf "%T@ %f\n" 2>/dev/null | sort -nr | awk '{print $2}' |
            jq -R -s -c 'split("\n")[:-1]' 2>/dev/null
    )
    [ -z "$backups" ] && backups="[]"

    # integrations
    local has_scribe=false
    [ -f /jffs/scripts/scribe ] && has_scribe=true

    # Single jq call reading directly from file — avoids shell variable / pipe overhead
    local _tmp_response="/tmp/xray-response.$$.tmp"
    local _jq_err="/tmp/xray-jq-err.$$.tmp"
    if ! jq \
        --arg geoip "$geoip_date" \
        --arg geosite "$geosite_date" \
        --arg geoipurl "$geoipurl" \
        --arg geositeurl "$geositeurl" \
        --argjson geo_auto_update "$geo_auto_update" \
        --argjson uptime "$uptime_xray" \
        --arg profile "$profile" \
        --argjson skip_test "$skip_test" \
        --argjson clients_check "$clients_check" \
        --argjson check_connection "$check_connection" \
        --arg probe_url "$probe_url" \
        --arg github_proxy "$github_proxy" \
        --argjson dnsmasq "$dnsmasq_enabled" \
        --argjson logs_dor "$logs_dor" \
        --argjson logs_max_size "$logs_max_size" \
        --arg ipsec "$ipsec" \
        --argjson startup_delay "$startup_delay" \
        --argjson sleep_time "$xray_sleep_time" \
        --arg subscriptionLinks "$subscriptionLinks" \
        --argjson xray_dns_only "$xray_dns_only" \
        --argjson xray_block_quic "$xray_block_quic" \
        --arg sar "$subscription_auto_refresh" \
        --arg saf "$subscription_auto_fallback" \
        --arg sfi "$subscription_fallback_interval" \
        --arg sf "$subscription_filters" \
        --arg hook_before_firewall_start "$hook_before_firewall_start" \
        --arg after_firewall_start "$after_firewall_start" \
        --arg after_firewall_cleanup "$after_firewall_cleanup" \
        --arg xray_ver "$XRAY_VERSION" \
        --arg xrayui_ver "$XRAYUI_VERSION" \
        --argjson profiles "$profiles" \
        --argjson backups "$backups" \
        --argjson debug "$debug" \
        --argjson has_scribe "$has_scribe" \
        --argjson integration_scribe "$integration_scribe" \
        '
        .geodata.geoip_url = $geoipurl
        | .geodata.geosite_url = $geositeurl
        | .geodata.community["geoip.dat"] = $geoip
        | .geodata.community["geosite.dat"] = $geosite
        | .geodata.auto_update = $geo_auto_update
        | .xray.uptime = $uptime
        | .xray.profile = $profile
        | .xray.skip_test = $skip_test
        | .xray.clients_check = $clients_check
        | .xray.check_connection = $check_connection
        | .xray.probe_url = $probe_url
        | .xray.github_proxy = $github_proxy
        | .xray.dnsmasq = $dnsmasq
        | .xray.logs_dor = $logs_dor
        | .xray.logs_max_size = $logs_max_size
        | .xray.ipsec = $ipsec
        | .xray.startup_delay = $startup_delay
        | .xray.sleep_time = $sleep_time
        | .xray.subscriptions.links = (if $subscriptionLinks == "" then [] else ($subscriptionLinks | split("|")) end)
        | .xray.dns_only = $xray_dns_only
        | .xray.block_quic = $xray_block_quic
        | .xray.subscription_auto_refresh = $sar
        | .xray.subscription_auto_fallback = ($saf == "true")
        | .xray.subscription_fallback_interval = ($sfi | tonumber)
        | .xray.subscriptions.filters = (if $sf == "" then [] else ($sf | split("|")) end)
        | .xray.hooks = {
            before_firewall_start: $hook_before_firewall_start,
            after_firewall_start: $after_firewall_start,
            after_firewall_cleanup: $after_firewall_cleanup
        }
        | .xray.ui_version = $xrayui_ver
        | .xray.core_version = $xray_ver
        | .xray.profiles = $profiles
        | .xray.backups = $backups
        | .xray.debug = $debug
        | if $has_scribe then .integration.scribe = { enabled: $integration_scribe } else . end
        | del(.loading)
        ' "$UI_RESPONSE_FILE" >"$_tmp_response" 2>"$_jq_err"; then
        log_error "Error: Failed to build initial response JSON. jq error: $(cat "$_jq_err" 2>/dev/null)"
        rm -f "$_tmp_response" "$_jq_err"
        if ! jq -n \
            --arg geoipurl "$geoipurl" \
            --arg geositeurl "$geositeurl" \
            --arg geoip "$geoip_date" \
            --arg geosite "$geosite_date" \
            --argjson geo_auto_update "$geo_auto_update" \
            --argjson uptime "$uptime_xray" \
            --arg profile "$profile" \
            --argjson skip_test "$skip_test" \
            --argjson clients_check "$clients_check" \
            --argjson check_connection "$check_connection" \
            --arg probe_url "$probe_url" \
            --arg github_proxy "$github_proxy" \
            --argjson dnsmasq "$dnsmasq_enabled" \
            --argjson logs_dor "$logs_dor" \
            --argjson logs_max_size "$logs_max_size" \
            --arg ipsec "$ipsec" \
            --argjson startup_delay "$startup_delay" \
            --argjson sleep_time "$xray_sleep_time" \
            --argjson dns_only "$xray_dns_only" \
            --argjson block_quic "$xray_block_quic" \
            --arg sar "$subscription_auto_refresh" \
            --arg saf "$subscription_auto_fallback" \
            --arg sfi "$subscription_fallback_interval" \
            --arg xrayui_ver "$XRAYUI_VERSION" \
            --arg xray_ver "$XRAY_VERSION" \
            --argjson profiles "${profiles:-[]}" \
            --argjson backups "${backups:-[]}" \
            --argjson debug "$debug" \
            '{
                geodata: { geoip_url: $geoipurl, geosite_url: $geositeurl, community: { "geoip.dat": $geoip, "geosite.dat": $geosite }, auto_update: $geo_auto_update },
                xray: { uptime: $uptime, profile: $profile, skip_test: $skip_test, clients_check: $clients_check, check_connection: $check_connection, probe_url: $probe_url, github_proxy: $github_proxy, dnsmasq: $dnsmasq, logs_dor: $logs_dor, logs_max_size: $logs_max_size, ipsec: $ipsec, startup_delay: $startup_delay, sleep_time: $sleep_time, dns_only: $dns_only, block_quic: $block_quic, subscription_auto_refresh: $sar, subscription_auto_fallback: ($saf == "true"), subscription_fallback_interval: ($sfi | tonumber), subscriptions: { links: [], filters: [] }, hooks: {}, ui_version: $xrayui_ver, core_version: $xray_ver, profiles: $profiles, backups: $backups, debug: $debug }
            }' >"$_tmp_response" 2>"$_jq_err"; then
            log_error "Error: jq -n also failed. jq error: $(cat "$_jq_err" 2>/dev/null). Writing bare minimum response."
            echo '{"xray":{"ui_version":"'"$XRAYUI_VERSION"'","core_version":"","profiles":[],"backups":[]}}' >"$_tmp_response"
        fi
        rm -f "$_jq_err"
    else
        rm -f "$_jq_err"
    fi

    if mv -f "$_tmp_response" "$UI_RESPONSE_FILE"; then
        log_ok "Saved initial response successfully."
    else
        log_error "Failed to save file to $UI_RESPONSE_FILE."
        rm -f "$_tmp_response"
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
        log_error "No new server configuration provided (reconstruct_payload returned empty)."
        update_loading_progress "Error: incoming configuration is empty or upload failed." 100
        exit 1
    fi

    log_info "Setting up DNS rules for incoming configuration..."
    incoming_config=$(rules_to_dns_domains "$incoming_config")

    echo "$incoming_config" >"$temp_config"
    if [ $? -ne 0 ]; then
        log_error "Failed to write incoming configuration to $temp_config."
        update_loading_progress "Error: failed to write incoming configuration." 100
        exit 1
    fi

    jq empty "$temp_config" >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        local debug_copy="/tmp/xray_server_config_invalid.json"
        cp "$temp_config" "$debug_copy" 2>/dev/null
        log_error "Invalid JSON format in incoming server configuration ($(wc -c <"$temp_config") bytes). Bad copy preserved at $debug_copy"
        update_loading_progress "Error: configuration upload was corrupted (invalid JSON). Try again." 100
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
