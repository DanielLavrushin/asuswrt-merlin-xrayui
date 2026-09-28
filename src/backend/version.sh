#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

show_version() {
    xrayui_core_probe
    XRAY_VERSION=$(xrayui_core_version)
    log_ok "XRAYUI: $XRAYUI_VERSION, XRAY-CORE: ${XRAY_VERSION:-$XRAYUI_CORE_ERR}"
}

switch_xray_version() {
    update_loading_progress "Switching Xray version..." 0

    mkdir -p "$ADDON_TMP_DIR" 2>/dev/null
    local xray_tmp_dir="$ADDON_TMP_DIR/xray"

    local xray_version="$1"

    if [ -n "$xray_version" ] && [ "$xray_version" != "latest" ]; then
        case $xray_version in
        v*) : ;;
        *) xray_version="v$xray_version" ;;
        esac
    fi

    if [ -z "$xray_version" ]; then

        log_info "Switching Xray version using payload"
        local payload=$(reconstruct_payload)
        local version_url=$(echo "$payload" | jq -r '.url // empty')
        if [ -z "$version_url" ]; then
            local custom_version=$(echo "$payload" | jq -r '.version // empty')
            if [ -n "$custom_version" ]; then
                case $custom_version in
                v*) : ;;
                *) custom_version="v$custom_version" ;;
                esac
                local release_url="https://api.github.com/repos/XTLS/Xray-core/releases/tags/$custom_version"
                log_info "Fetching custom Xray version $custom_version from $release_url"
                version_url=$(curl -sSL "$release_url" | jq -r '.assets_url // empty')
            fi
        fi
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

    update_loading_progress "Downloading Xray release version..."
    log_ok "Downloading Xray asset metadata $version_url"

    local release_data=$(curl -sSL "$version_url")
    if [ -z "$release_data" ]; then
        log_error "Error: could not fetch release data from $version_url"
        return 1
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
        log_error "Unsupported architecture: $arch"
        return 1
        ;;
    esac

    local asset_url=$(echo "$release_data" |
        jq -r --arg NAME "$asset_name" '.[] | select(.name == $NAME) | .browser_download_url')
    asset_url=$(github_proxy_url "$asset_url")

    log_ok "Xray Core Asset URL: $asset_url"

    if [ -z "$asset_url" ] || [ "$asset_url" = "null" ]; then
        log_error "Error: could not find asset '$asset_name' in the release data"
        return 1
    fi

    update_loading_progress "Downloading $asset_name ..."
    local tmp_zip="$ADDON_TMP_DIR/xraycore.zip"
    rm -rf "$tmp_zip"

    log_ok "Downloading Xray release version $asset_url into $tmp_zip"
    if ! curl -fL "$asset_url" -o "$tmp_zip" || [ ! -s "$tmp_zip" ]; then
        log_error "Failed to download $asset_name."
        rm -f "$tmp_zip"
        return 1
    fi

    update_loading_progress "Unpacking $asset_name ..."
    log_ok "Unpacking $asset_name..."
    rm -rf "$xray_tmp_dir"
    mkdir -p "$xray_tmp_dir"

    if ! unzip -o "$tmp_zip" -d "$xray_tmp_dir"; then
        log_error "Error: failed to unzip $tmp_zip"
        rm -rf "$xray_tmp_dir" "$tmp_zip"
        return 1
    fi
    rm -f "$tmp_zip"

    local new_version
    chmod +x "$xray_tmp_dir/xray" 2>/dev/null
    new_version=$("$xray_tmp_dir/xray" version 2>/dev/null | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -n 1)
    if [ -z "$new_version" ]; then
        log_error "Error: the downloaded Xray binary does not run on this router. The installed version was kept."
        rm -rf "$xray_tmp_dir"
        return 1
    fi

    if ! cp "$xray_tmp_dir/xray" /opt/sbin/xray.new || ! chmod +x /opt/sbin/xray.new || ! mv -f /opt/sbin/xray.new /opt/sbin/xray; then
        log_error "Error: could not write the new Xray binary to /opt/sbin. The installed version was kept."
        rm -f /opt/sbin/xray.new
        rm -rf "$xray_tmp_dir"
        return 1
    fi
    xrayui_core_forget

    [ ! -f "/opt/sbin/geosite.dat" ] && cp "$xray_tmp_dir/geosite.dat" "/opt/sbin/geosite.dat"
    [ ! -f "/opt/sbin/geoip.dat" ] && cp "$xray_tmp_dir/geoip.dat" "/opt/sbin/geoip.dat"
    rm -rf "$xray_tmp_dir"

    update_loading_progress "Restarting Xray service..."
    POST_RESTART_DNSMASQ="true"
    stop
    start

    dnsmasq_restart
    POST_RESTART_DNSMASQ="false"

    log_ok "Xray version updated!"
    log_ok $(show_version)

}

version_get_arch_name() {

    local packname="$1"

    local arch=$(uname -m)

    # if os provided
    if [ -n "$2" ]; then
        local archname="${packname}-$2"
    else
        local archname="$packname"
    fi

    local asset_name=""
    case "$arch" in
    x86_64)
        asset_name="$archname-amd64.tar.gz"
        ;;
    i686 | i386)
        asset_name="$archname-i386.tar.gz"
        ;;
    armv5* | armv6* | armv7*)
        asset_name="$archname-armv5.tar.gz"
        ;;
    aarch64 | arm64)
        case "$packname" in
        b4sni)
            asset_name="$archname-arm64.tar.gz"
            ;;
        *)
            asset_name="$archname-arm64v8.tar.gz"
            ;;
        esac
        ;;
    mips)
        asset_name="$archname-mips.tar.gz"
        ;;
    mipsle)
        asset_name="$archname-mipsle.tar.gz"
        ;;
    mips64)
        asset_name="$archname-mips64.tar.gz"
        ;;
    mips64le)
        asset_name="$archname-mips64le.tar.gz"
        ;;
    *)
        echo "Unsupported architecture: $arch"
        return 1
        ;;
    esac

    echo "$asset_name"
}
