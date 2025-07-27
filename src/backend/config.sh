#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

load_xrayui_config() {
    if [ -f "$XRAYUI_CONFIG_FILE" ]; then
        . "$XRAYUI_CONFIG_FILE"
    fi

    # override default values with environment variables
    XRAY_CONFIG_FILE="/opt/etc/xray/${profile:-$DEFAULT_XRAY_PROFILE_NAME}"

}

update_xrayui_config() {
    local key="$1"
    local value="$2"
    [ -f "$XRAYUI_CONFIG_FILE" ] || touch "$XRAYUI_CONFIG_FILE"
    local esc_value
    esc_value=$(printf '%s' "$value" | sed 's/[|&\\/]/\\&/g')
    if grep -qE "^${key}=" "$XRAYUI_CONFIG_FILE"; then
        sed -i "s|^${key}=.*|${key}=\"${esc_value}\"|" "$XRAYUI_CONFIG_FILE"
    else
        printf '%s="%s"\n' "$key" "$value" >>"$XRAYUI_CONFIG_FILE"
    fi
}

generate_xray_config() {
    # Validate base configuration
    if [ ! -f "$XRAY_CONFIG_FILE" ]; then
        log_warn "Base configuration file not found. Creating a default config..."
        mkdir -p /opt/etc/xray
        cat >$XRAY_CONFIG_FILE <<EOF
{
    "log": {
        "loglevel": "warning",
        "access": "$ADDON_LOGS_DIR/xray_access.log",
        "error": "$ADDON_LOGS_DIR/xray_error.log"
    },
    "inbounds":[],
    "outbounds":[],
    "routing": {
        "rules": []
    },
    "dns": {
        "servers": []
    }
}
EOF
        if [ $? -eq 0 ]; then
            log_ok "Default configuration created successfully."
        else
            log_error "Failed to create default configuration."
            exit 1
        fi
    else
        log_warn "Base configuration file already exists."
    fi
}
