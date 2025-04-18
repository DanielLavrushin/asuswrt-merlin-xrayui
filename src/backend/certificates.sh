#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

regenerate_ssl_certificates() {
    local cert_dir="/opt/etc/xray/cert"
    local cert_file="$cert_dir/xray-cert.crt"
    local key_file="$cert_dir/xray-key.pem"

    if [ ! -d "$cert_dir" ]; then
        log_info "Directory $cert_dir does not exist. Creating it."
        mkdir -p "$cert_dir"
        if [ $? -ne 0 ]; then
            log_error "Failed to create directory $cert_dir."
            return 1
        fi
    fi

    log_info "Generating self-signed certificate for Xray in $cert_dir..."

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$key_file" \
        -out "$cert_file" \
        -subj "/CN=xray/O=Local Xray/C=US" \
        -addext "subjectAltName=DNS:xray,IP:127.0.0.1"

    if [ $? -eq 0 ]; then
        log_info "Certificate and key successfully generated:"
        log_info "Certificate: $cert_file"
        log_info "Private Key: $key_file"
    else
        log_error "Failed to generate certificate."
        return 1
    fi

    load_ui_response

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --arg cert "$cert_file" --arg key "$key_file" \
        '.certificates.certificateFile = $cert | .certificates.keyFile = $key')
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
