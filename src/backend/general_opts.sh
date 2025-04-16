#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

apply_general_options() {
    update_loading_progress "Applying general settings..." 0
    printlog true "Applying general settings..."

    load_xrayui_config

    local json_content=$(cat "$XRAY_CONFIG_FILE")

    local genopts=$(reconstruct_payload)

    # setting logs
    local github_proxy=$(echo "$genopts" | jq -r '.github_proxy')
    local log_level=$(echo "$genopts" | jq -r '.logs_level')
    local logs_access=$(echo "$genopts" | jq -r '.logs_access')
    local logs_error=$(echo "$genopts" | jq -r '.logs_error')
    local logs_dns=$(echo "$genopts" | jq -r '.logs_dns')
    local logs_dnsmasq=$(echo "$genopts" | jq -r '.logs_dnsmasq')

    local geosite_url=$(echo "$genopts" | jq -r '.geo_site_url')
    local geoip_url=$(echo "$genopts" | jq -r '.geo_ip_url')

    if [ ! -d "$ADDON_LOGS_DIR" ]; then
        mkdir -p $ADDON_LOGS_DIR
    fi

    local logs_access_path="$ADDON_LOGS_DIR/xray_access.log"
    local logs_error_path="$ADDON_LOGS_DIR/xray_error.log"

    json_content=$(echo "$json_content" | jq --arg loglevel "$log_level" '.log.loglevel = $loglevel')

    if [ "$logs_access" = "true" ]; then
        json_content=$(echo "$json_content" | jq --arg logs_access_path $logs_access_path '.log.access = $logs_access_path')
    else
        json_content=$(echo "$json_content" | jq '.log.access = "none"')
    fi

    if [ "$logs_error" = "true" ]; then
        json_content=$(echo "$json_content" | jq --arg logs_error_path $logs_error_path '.log.error = $logs_error_path')
    else
        json_content=$(echo "$json_content" | jq '.log.error = "none"')
    fi

    if [ "$logs_dns" = "true" ]; then
        json_content=$(echo "$json_content" | jq '.log.dnsLog = true')
    else
        json_content=$(echo "$json_content" | jq 'del(.log.dnsLog)')
    fi

    if [ "$logs_dnsmasq" = "true" ]; then
        mkdir -p /opt/var/log
        cat <<EOF >/jffs/configs/dnsmasq.conf.add
log-queries
log-facility=/opt/var/log/dnsmasq.log
EOF

        service restart_dnsmasq >/dev/null 2>&1 && printlog true "DNS service restarted successfully." $CSUC
        printlog true "Enabled dnsmasq logging (queries and log-facility set) on Asus Merlin."
    else
        if [ -f /jffs/configs/dnsmasq.conf.add ]; then
            rm /jffs/configs/dnsmasq.conf.add
            service restart_dnsmasq >/dev/null 2>&1 && printlog true "DNS service restarted successfully." $CSUC
            printlog true "Disabled dnsmasq logging by removing /jffs/configs/dnsmasq.conf.add."
        fi
    fi

    service restart_dnsmasq

    echo "$json_content" >"$XRAY_CONFIG_FILE"

    if [ -f /opt/etc/logrotate.d/xrayui ]; then
        sed -i "1s@^.*{@$logs_access_path $logs_error_path {@" /opt/etc/logrotate.d/xrayui
        printlog true "Logrotate configuration updated with new log paths: $logs_access_path $logs_error_path" $CSUC
    fi

    update_xrayui_config "dnsmasq" "$logs_dnsmasq"
    update_xrayui_config "github_proxy" "$github_proxy"
    update_xrayui_config "geosite_url" "$geosite_url"
    update_xrayui_config "geoip_url" "$geoip_url"

    # Update configuration with the directory part of logs_access_path
    local logs_dir=$(dirname "$logs_access_path")
    update_xrayui_config "logs_dir" "$logs_dir"

    update_loading_progress "General settings applied." 100

    exit 0

}
