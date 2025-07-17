#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

wireguard_generate_keys() {
    log_info "Regenerating WireGuard private and public keys..."
    local payload=$(reconstruct_payload)
    local private_key=$(echo "$payload" | jq -r '.pk')
    local public_key

    if [ -z "$private_key" ]; then
        private_key=$(wg genkey)
        if [ $? -ne 0 ]; then
            log_ok "Error: Failed to generate private key."
            return 1
        fi
    fi

    local public_key=$(echo "$private_key" | wg pubkey)
    if [ $? -ne 0 ]; then
        log_ok "Error: Failed to generate public key from private key."
        return 1
    fi

    load_ui_response

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg pk "$private_key" --arg pub "$public_key" \
        '.wireguard.privateKey = $pk | .wireguard.publicKey = $pub')

    if [ $? -ne 0 ]; then
        log_ok "Error: Failed to update JSON content."
        return 1
    fi

    save_ui_response

    if [ $? -eq 0 ]; then
        log_ok "Saved WireGuard keys to $UI_RESPONSE_FILE successfully."
    else
        log_ok "Failed to save WireGuard keys to $UI_RESPONSE_FILE."
        return 1
    fi

    return 0
}
