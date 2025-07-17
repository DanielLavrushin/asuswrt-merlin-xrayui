#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

reality_generate_keys() {
    log_info "Regenerating Reality private and public keys..."

    local xray_output=$(xray x25519)
    if [ $? -ne 0 ]; then
        log_error "Failed to run xray x25519."
        return 1
    fi

    local private_key=$(echo "$xray_output" | grep 'Private key:' | awk -F'Private key: ' '{print $2}')
    local public_key=$(echo "$xray_output" | grep 'Public key:' | awk -F'Public key: ' '{print $2}')

    if [ -z "$private_key" ] || [ -z "$public_key" ]; then
        log_error "Failed to extract Reality keys from xray x25519 output."
        return 1
    fi

    load_ui_response

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg pk "$private_key" --arg pub "$public_key" '.reality.privateKey = $pk | .reality.publicKey = $pub')

    if [ $? -ne 0 ]; then
        log_error "Error: Failed to update JSON content."
        return 1
    fi

    save_ui_response

    if [ $? -eq 0 ]; then
        log_ok "Saved TLS certificates to $UI_RESPONSE_FILE successfully."
    else
        log_error "Failed to save TLS certificates to $UI_RESPONSE_FILE."
        return 1
    fi
}
