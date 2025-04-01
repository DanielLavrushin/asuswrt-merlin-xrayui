regenerate_reality_keys() {
    printlog true "Regenerating Reality private and public keys..."

    local xray_output=$(xray x25519)
    if [ $? -ne 0 ]; then
        printlog true "Failed to run xray x25519." $CERR
        return 1
    fi

    local private_key=$(echo "$xray_output" | grep 'Private key:' | awk -F'Private key: ' '{print $2}')
    local public_key=$(echo "$xray_output" | grep 'Public key:' | awk -F'Public key: ' '{print $2}')

    if [ -z "$private_key" ] || [ -z "$public_key" ]; then
        printlog true "Failed to extract Reality keys from xray x25519 output." $CERR
        return 1
    fi

    load_ui_response

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg pk "$private_key" --arg pub "$public_key" '.reality.privateKey = $pk | .reality.publicKey = $pub')

    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to update JSON content." $CERR
        return 1
    fi

    save_ui_response

    if [ $? -eq 0 ]; then
        printlog true "Saved TLS certificates to $UI_RESPONSE_FILE successfully." $CSUC
    else
        printlog true "Failed to save TLS certificates to $UI_RESPONSE_FILE." $CERR
        return 1
    fi
}
