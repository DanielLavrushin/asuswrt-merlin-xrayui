#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

show_version() {
    XRAY_VERSION=$(xray version | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -n 1)
    log_ok "XRAYUI: $XRAYUI_VERSION, XRAY-CORE: $XRAY_VERSION"
}

switch_xray_version() {
    update_loading_progress "Switching Xray version..." 0

    local xray_tmp_dir="/tmp/xray"

    local xray_version="$1"

    if [ -n "$xray_version" ] && [ "$xray_version" != "latest" ]; then
        case $xray_version in
        v*) : ;;
        *) xray_version="v$xray_version" ;;
        esac
    fi

    if [ -z "$xray_version" ]; then

        log_info "Switching Xray version with url from payload"
        local payload=$(reconstruct_payload)
        local version_url=$(echo "$payload" | jq -r '.url')
        if [ -z "$version_url" ] || [ "$version_url" = "null" ]; then
            log_error "Error: version URL is empty"
            return 1
        fi
    else
        log_info "Switching Xray version to $xray_version"
        if [ "$xray_version" = "latest" ]; then
            local release_url="https://api.github.com/repos/XTLS/Xray-core/releases/latest"
        else
            local release_url="https://api.github.com/repos/XTLS/Xray-core/releases/tags/$xray_version"
        fi
        if [ -z "$release_url" ]; then
            log_error "Error: release URL is empty"
            return 1
        fi

        log_debug "Xray release URL: $release_url"
        local version_url=$(curl -sSL "$release_url" | jq -r '.assets_url')
        if [ -z "$version_url" ] || [ "$version_url" = "null" ]; then
            log_error "Error: could not fetch version URL from $release_url"
            return 1
        fi

        log_debug "Xray version URL: $version_url"

    fi

    update_loading_progress "Stopping Xray service..."
    stop

    update_loading_progress "Downloading Xray release version..."
    log_ok "Downloading Xray asset metadata $version_url"

    local release_data=$(curl -sSL "$version_url")
    if [ -z "$release_data" ]; then
        log_error "Error: could not fetch release data from $version_url"
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
    armv5* | armv6* | armv7*)
        asset_name="Xray-linux-arm32-v5.zip"
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
    asset_url=$(github_proxy_url "$asset_url")

    log_ok "Xray Core Asset URL: $asset_url"

    if [ -z "$asset_url" ] || [ "$asset_url" = "null" ]; then
        log_error "Error: could not find asset '$asset_name' in the release data"
    fi

    update_loading_progress "Downloading $asset_name ..."
    local tmp_zip="/tmp/xraycore.zip"
    rm -rf "$tmp_zip"

    log_ok "Downloading Xray release version $asset_url into $tmp_zip"
    curl -L "$asset_url" -o "$tmp_zip"
    if [ $? -ne 0 ] || [ ! -f "$tmp_zip" ]; then
        log_error "Failed to download $asset_name."
        return 1
    fi

    update_loading_progress "Unpacking $asset_name ..."
    log_ok "Unpacking $asset_name..."
    mkdir -p "$xray_tmp_dir"

    if ! unzip -o "$tmp_zip" -d "$xray_tmp_dir"; then
        log_error "Error: failed to unzip $tmp_zip"
        return 1
    fi

    cp "$xray_tmp_dir/xray" "/opt/sbin/xray"
    [ ! -f "/opt/sbin/geosite.dat" ] && cp "$xray_tmp_dir/geosite.dat" "/opt/sbin/geosite.dat"
    [ ! -f "/opt/sbin/geoip.dat" ] && cp "$xray_tmp_dir/geoip.dat" "/opt/sbin/geoip.dat"

    chmod +x "/opt/sbin/xray"
    rm -rf "$xray_tmp_dir"
    rm -f "$tmp_zip"

    log_ok "Xray version updated!"
    log_ok $(show_version)

}
