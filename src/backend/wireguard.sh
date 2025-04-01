#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

regenerate_wireguard_keys() {
    printlog true "Regenerating WireGuard private and public keys..."
    local private_key=$(reconstruct_payload)
    local public_key

    if [ -z "$private_key" ]; then
        private_key=$(wg genkey)
        if [ $? -ne 0 ]; then
            printlog true "Error: Failed to generate private key." $CERR
            return 1
        fi
    fi

    local public_key=$(echo "$private_key" | wg pubkey)
    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to generate public key from private key." $CERR
        return 1
    fi

    load_ui_response

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg pk "$private_key" --arg pub "$public_key" \
        '.wireguard.privateKey = $pk | .wireguard.publicKey = $pub')

    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to update JSON content." $CERR
        return 1
    fi

    save_ui_response

    if [ $? -eq 0 ]; then
        printlog true "Saved WireGuard keys to $UI_RESPONSE_FILE successfully." $CSUC
    else
        printlog true "Failed to save WireGuard keys to $UI_RESPONSE_FILE." $CERR
        return 1
    fi

    return 0
}
