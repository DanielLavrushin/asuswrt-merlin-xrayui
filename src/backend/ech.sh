#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

ech_generate_keys() {
    local payload=$(reconstruct_payload)
    local server_name=$(echo "$payload" | jq -r '.serverName // empty' 2>/dev/null)

    if [ -z "$server_name" ]; then
        log_error "Server name is required for ECH key generation."
        return 1
    fi

    log_info "Generating ECH keys for server: $server_name"

    local xray_output=$(xray tls ech --serverName "$server_name" 2>&1)
    if [ $? -ne 0 ]; then
        log_error "Failed to run xray tls ech."
        return 1
    fi

    local ech_config_list=$(echo "$xray_output" | sed -n '/ECH config list:/{ n; p; }' | tr -d '[:space:]')
    local ech_server_keys=$(echo "$xray_output" | sed -n '/ECH server keys:/{ n; p; }' | tr -d '[:space:]')

    if [ -z "$ech_config_list" ] || [ -z "$ech_server_keys" ]; then
        log_error "Failed to extract ECH keys from xray tls ech output."
        return 1
    fi

    load_ui_response

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg config "$ech_config_list" --arg keys "$ech_server_keys" \
        '.ech.configList = $config | .ech.serverKeys = $keys')

    if [ $? -ne 0 ]; then
        log_error "Error: Failed to update JSON content."
        return 1
    fi

    save_ui_response

    if [ $? -eq 0 ]; then
        log_ok "Generated ECH keys for $server_name successfully."
    else
        log_error "Failed to save ECH keys to $UI_RESPONSE_FILE."
        return 1
    fi
}
