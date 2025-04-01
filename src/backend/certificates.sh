#!/bin/sh

regenerate_ssl_certificates() {
    local cert_dir="/opt/etc/xray/cert"
    local cert_file="$cert_dir/xray-cert.crt"
    local key_file="$cert_dir/xray-key.pem"
    local tempconfig=$(remove_json_comments)

    if [ ! -d "$cert_dir" ]; then
        printlog true "Directory $cert_dir does not exist. Creating it."
        mkdir -p "$cert_dir"
        if [ $? -ne 0 ]; then
            printlog true "Failed to create directory $cert_dir."
            return 1
        fi
    fi

    printlog true "Generating self-signed certificate for Xray in $cert_dir..."

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$key_file" \
        -out "$cert_file" \
        -subj "/CN=xray/O=Local Xray/C=US"

    if [ $? -eq 0 ]; then
        printlog true "Certificate and key successfully generated:"
        printlog true "Certificate: $cert_file"
        printlog true "Private Key: $key_file"
    else
        printlog true "Failed to generate certificate."
        return 1
    fi

    load_ui_response

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg cert "$cert_file" --arg key "$key_file" \
        '.certificates.certificateFile = $cert | .certificates.keyFile = $key')
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
