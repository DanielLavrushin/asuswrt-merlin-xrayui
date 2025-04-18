#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

change_config_profile() {
    update_loading_progress "Changing XRAY configuration profile..." 0

    local payload=$(reconstruct_payload)
    local profile=$(echo "$payload" | jq -r '.profile')

    # Ensure profile ends with ".json"
    case "$profile" in
    *.json) ;; # Already ends with .json
    *) profile="${profile}.json" ;;
    esac

    update_xrayui_config "profile" "$profile"

    load_xrayui_config

    # Check if the configuration file exists, if not, generate a default config
    if [ ! -f "$XRAY_CONFIG_FILE" ]; then
        log_warn "Profile file $XRAY_CONFIG_FILE does not exist. Generating default configuration."
        generate_xray_config
    fi

    ln -s -f "$XRAY_CONFIG_FILE" "$ADDON_WEB_DIR/xray-config.json" || log_error "Failed to create symlink for xray-config.json."

    update_loading_progress "Changing configuration profile to $XRAY_CONFIG_FILE..."
    log_info "Changing configuration profile to $XRAY_CONFIG_FILE..."

    restart

    update_loading_progress "Configuration profile changed successfully." 100
    return 0
}

delete_config_profile() {
    update_loading_progress "Deleting XRAY configuration profile..." 0

    load_xrayui_config

    local payload=$(reconstruct_payload)
    local profile=$(echo "$payload" | jq -r '.profile')

    # Ensure profile ends with ".json"
    case "$profile" in
    *.json) ;; # Already ends with .json
    *) profile="${profile}.json" ;;
    esac

    local profile_path="/opt/etc/xray/$profile"

    if [ -f "$profile_path" ]; then
        rm -f "$profile_path"
        if [ $? -eq 0 ]; then
            log_ok "Profile $profile deleted successfully."
        else
            log_error "Failed to delete profile $profile."
            return 1
        fi
    else
        log_warn "Profile $profile does not exist."
    fi

    update_loading_progress "Configuration profile deleted successfully." 100
    return 0
}
