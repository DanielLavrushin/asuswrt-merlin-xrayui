#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

show_version() {
    XRAY_VERSION=$(xray version | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -n 1)
    printlog true "XRAYUI: $XRAYUI_VERSION, XRAY-CORE: $XRAY_VERSION" "$CSUC"
}

switch_xray_version() {
    update_loading_progress "Switching Xray version..." 0

    local xray_tmp_dir="/tmp/xray"
    local payload=$(reconstruct_payload)
    local version_url=$(echo "$payload" | jq -r '.url')
    if [ -z "$version_url" ] || [ "$version_url" = "null" ]; then
        printlog true "Error: no 'url' field found in payload" "$CERR"
        return 1
    fi

    update_loading_progress "Stopping Xray service..."
    stop

    update_loading_progress "Downloading Xray release version..."
    printlog true "Downloading Xray asset metadata $version_url" "$CSUC"

    local release_data=$(curl -sSL "$version_url")
    if [ -z "$release_data" ]; then
        printlog true "Error: could not fetch release data from $version_url" "$CERR"
    fi

    local arch=$(uname -m)

    local asset_name=""
    case "$arch" in
    x86_64)
        asset_name="Xray-linux-64.zip"
        ;;
    i686 | i386)
        asset_name="Xray-linux-32.zip"
        ;;
    armv5*)
        asset_name="Xray-linux-arm32-v5.zip"
        ;;
    armv6*)
        asset_name="Xray-linux-arm32-v6.zip"
        ;;
    armv7*)
        asset_name="Xray-linux-arm32-v7a.zip"
        ;;
    aarch64 | arm64)
        asset_name="Xray-linux-arm64-v8a.zip"
        ;;
    mips)
        asset_name="Xray-linux-mips32.zip"
        ;;
    mipsle)
        asset_name="Xray-linux-mips32le.zip"
        ;;
    mips64)
        asset_name="Xray-linux-mips64.zip"
        ;;
    mips64le)
        asset_name="Xray-linux-mips64le.zip"
        ;;
    *)
        echo "Unsupported architecture: $arch"
        return 1
        ;;
    esac

    local asset_url=$(echo "$release_data" |
        jq -r --arg NAME "$asset_name" '.[] | select(.name == $NAME) | .browser_download_url')

    if [ -z "$asset_url" ] || [ "$asset_url" = "null" ]; then
        printlog true "Error: could not find asset '$asset_name' in the release data" "$CERR"
    fi

    update_loading_progress "Downloading $asset_name ..."
    local tmp_zip="/tmp/xraycore.zip"
    rm -rf "$tmp_zip"

    printlog true "Downloading Xray release version $asset_url into $tmp_zip" "$CSUC"
    curl -L "$asset_url" -o "$tmp_zip"
    if [ $? -ne 0 ] || [ ! -f "$tmp_zip" ]; then
        printlog true "Failed to download $asset_name." "$CERR"
        return 1
    fi

    update_loading_progress "Unpacking $asset_name ..."
    printlog true "Unpacking $asset_name..." "$CSUC"
    mkdir -p "$xray_tmp_dir"

    if ! unzip -o "$tmp_zip" -d "$xray_tmp_dir"; then
        printlog true "Error: failed to unzip $tmp_zip" "$CERR"
        return 1
    fi

    cp "$xray_tmp_dir/xray" "/opt/sbin/xray"
    chmod +x "/opt/sbin/xray"
    rm -rf "$xray_tmp_dir"
    rm -f "$tmp_zip"

    update_loading_progress "Starting Xray with new version..."
    start

    update_loading_progress "Switched Xray version successfully!" 100
}
