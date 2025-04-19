#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

update() {

    update_loading_progress "Updating $ADDON_TITLE..." 0

    local specific_version=${1:-"latest"}

    local url=$(github_proxy_url "https://github.com/daniellavrushin/asuswrt-merlin-xrayui/releases/latest/download/asuswrt-merlin-xrayui.tar.gz")

    if [ ! $specific_version = "latest" ]; then

        local url=$(github_proxy_url "https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/releases/download/v$specific_version/asuswrt-merlin-xrayui.tar.gz")

    fi

    local temp_file="/tmp/asuswrt-merlin-xrayui.tar.gz"
    local jffs_addons_path="/jffs/addons"

    log_info "Downloading the version:$specific_version..."
    update_loading_progress "Downloading the version:$specific_version..."
    if wget -q --show-progress -O "$temp_file" "$url"; then
        log_info "Download completed successfully."
    else
        log_error "Failed to download the $specific_version version. Exiting."
        return 1
    fi

    log_info "Cleaning up existing installation..."
    if rm -rf "$ADDON_JFFS_ADN_DIR"; then
        log_info "Old installation removed."
    else
        log_error "Failed to remove the old installation. Exiting."
        return 1
    fi

    log_info "Extracting the package..."
    update_loading_progress "Extracting the package..."
    if tar -xzf "$temp_file" -C "$jffs_addons_path"; then
        log_info "Extraction completed."
    else
        log_error "Failed to extract the package. Exiting."
        return 1
    fi

    log_info "Setting up the script..."
    update_loading_progress "Setting up the script..."
    if mv "$ADDON_JFFS_ADN_DIR/xrayui" "$ADDON_SCRIPT" && chmod 0777 "$ADDON_SCRIPT"; then
        log_ok "Script set up successfully."
    else
        log_error "Failed to set up the script. Exiting."
        return 1
    fi

    log_info "Running the installation..."
    update_loading_progress "Running the installation..."
    if sh "$ADDON_SCRIPT" install; then
        log_ok "Installation completed successfully."
    else
        log_error "Installation failed. Exiting."
        return 1
    fi

    log_ok "Update process completed!"
}
