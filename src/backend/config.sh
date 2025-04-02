#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

load_xrayui_config() {
    if [ -f "$XRAYUI_CONFIG_FILE" ]; then
        . "$XRAYUI_CONFIG_FILE"
    fi
}

update_xrayui_config() {
    local key="$1"
    local value="$2"
    [ -f "$XRAYUI_CONFIG_FILE" ] || touch "$XRAYUI_CONFIG_FILE"
    if grep -qE "^${key}=" "$XRAYUI_CONFIG_FILE"; then
        sed -i "s|^${key}=.*|${key}=\"${value}\"|" "$XRAYUI_CONFIG_FILE"
    else
        echo "${key}=\"${value}\"" >>"$XRAYUI_CONFIG_FILE"
    fi
}

generate_xray_config() {
    # Validate base configuration
    if [ ! -f "$XRAY_CONFIG_FILE" ]; then
        printlog true "Base configuration file not found. Creating a default config..." $CWARN
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
            printlog true "Default configuration created successfully." $CSUC
        else
            printlog true "Failed to create default configuration." $CERR
            exit 1
        fi
    else
        printlog true "Base configuration file already exists." $CWARN
    fi
}
