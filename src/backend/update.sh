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

    printlog true "Downloading the version:$specific_version..."
    update_loading_progress "Downloading the version:$specific_version..."
    if wget -q --show-progress -O "$temp_file" "$url"; then
        printlog true "Download completed successfully."
    else
        printlog true "Failed to download the $specific_version version. Exiting." $CERR
        return 1
    fi

    printlog true "Cleaning up existing installation..."
    if rm -rf "$ADDON_JFFS_ADN_DIR"; then
        printlog true "Old installation removed."
    else
        printlog true "Failed to remove the old installation. Exiting." $CERR
        return 1
    fi

    printlog true "Extracting the package..."
    update_loading_progress "Extracting the package..."
    if tar -xzf "$temp_file" -C "$jffs_addons_path"; then
        printlog true "Extraction completed."
    else
        printlog true "Failed to extract the package. Exiting." $CERR
        return 1
    fi

    printlog true "Setting up the script..."
    update_loading_progress "Setting up the script..."
    if mv "$ADDON_JFFS_ADN_DIR/xrayui" "$ADDON_SCRIPT" && chmod 0777 "$ADDON_SCRIPT"; then
        printlog true "Script set up successfully." $CSUC
    else
        printlog true "Failed to set up the script. Exiting." $CERR
        return 1
    fi

    printlog true "Running the installation..."
    update_loading_progress "Running the installation..."
    if sh "$ADDON_SCRIPT" install; then
        printlog true "Installation completed successfully." $CSUC
    else
        printlog true "Installation failed. Exiting." $CERR
        return 1
    fi

    printlog true "Update process completed!" $CSUC
    update_loading_progress "Update process completed!" 100
}
