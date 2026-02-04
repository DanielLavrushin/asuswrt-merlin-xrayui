#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

check_jffs_ready() {

    if [ "$(nvram get jffs2_on 2>/dev/null)" != "1" ]; then
        log_error "JFFS partition is DISABLED (nvram jffs2_on=0)."
        log_error "Enable it under Administration ▸ System, or run:"
        log_error "    nvram set jffs2_on=1 && nvram commit && reboot"
        exit 1
    else
        log_info "JFFS partition is ENABLED."
    fi

    if [ "$(nvram get jffs2_scripts 2>/dev/null)" != "1" ]; then
        log_error "JFFS custom scripts and configs are DISABLED."
        log_error "Enable it in the router UI (Administration ▸ System) or run:"
        log_error "    nvram set jffs2_scripts=1 && nvram commit && reboot"
        exit 1
    else
        log_info "JFFS custom scripts and configs are ENABLED."
    fi
}

install() {

    update_loading_progress "Installing $ADDON_TITLE..."
    log_info "Starting $ADDON_TITLE installation process."

    check_jffs_ready

    load_xrayui_config

    # Check for Entware
    if [ ! -x /opt/bin/opkg ]; then
        log_error "Entware is not installed or opkg binary is not accessible."
        log_error "Please install Entware first: https://github.com/Entware/Entware/wiki/Install-on-ASUSWRT"
        exit 1
    fi
    log_info "Entware is installed."

    update_loading_progress "Installing dependencies..."

    opkg update
    opkg upgrade

    install_opkg_package sed true
    install_opkg_package curl false
    install_opkg_package jq true
    install_opkg_package iptables true
    install_opkg_package net-tools-netstat false
    install_opkg_package libopenssl false
    install_opkg_package flock false
    install_opkg_package logrotate false
    install_opkg_package ipset false

    if which base64 >/dev/null 2>&1; then
        log_debug "base64 is already installed."
    else
        log_warn "base64 is not installed. Installing base64..."
        install_opkg_package coreutils-base64 false
    fi

    if which xray >/dev/null 2>&1; then
        log_info "Xray is already installed. Skipping xray-core installation."
    else
        log_warn "Xray is not installed. Installing xray-core..."
        switch_xray_version "latest"
    fi

    # xrayui config
    if [ ! -f "$XRAYUI_CONFIG_FILE" ]; then

        log_info "XRAYUI config file not found. Creating default config."

        cat <<EOF >"$XRAYUI_CONFIG_FILE"
geoip_url=
geosite_url=
logs_dir=$ADDON_LOGS_DIR
EOF
        chmod 600 "$XRAYUI_CONFIG_FILE"

        log_info "Default XRAYUI config created successfully."
    else
        log_info "XRAYUI config file $XRAYUI_CONFIG_FILE found."
    fi

    generate_xray_config

    update_loading_progress "Configuring XRAY UI..."

    clear_script_entries

    # Add or update nat-start
    setup_script_file "/jffs/scripts/nat-start" "/jffs/scripts/xrayui service_event firewall configure #xrayui"

    # Add or update post-mount
    setup_script_file "/jffs/scripts/post-mount" "/jffs/scripts/xrayui service_event startup & #xrayui"

    # Add or update service-event
    setup_script_file "/jffs/scripts/service-event" "echo \"\$2\" | grep -q \"^xrayui\" && /jffs/scripts/xrayui service_event \$(echo \"\$2\" | cut -d'_' -f2- | tr '_' ' ') & #xrayui"

    # Add or update dnsmasq.postconf
    setup_script_file "/jffs/scripts/dnsmasq.postconf" "/jffs/scripts/xrayui dnsmasq \"\$1\" #xrayui"

    log_info "Mounting web page..."
    remount_ui "skipwait"

    am_settings_set xray_version $XRAYUI_VERSION

    xray_startup=$(am_settings_get xray_startup)
    if [ -z "$xray_startup" ]; then
        am_settings_set xray_startup "y"
        log_warn "xray_startup was empty. Set to 'enabled'."
    else
        log_info "xray_startup already set. Skipping."
    fi

    mkdir -p $ADDON_USER_SCRIPTS_DIR

    # Install and setup geodata builder
    log_info "Installing XRAY UI geodata files builder..."

    mkdir -p "$ADDON_SHARE_DIR" || log_error "Failed to create $ADDON_SHARE_DIR."

    update_loading_progress "Downloading XRAYUI geodata files builder..."

    local release_url=$(github_proxy_url "https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/releases/latest/download/xrayui-datbuilder.tar.gz")

    if wget -q --show-progress --no-hsts -O "/tmp/xraydatbuilder.tar.gz" "$release_url"; then
        tar -xzf /tmp/xraydatbuilder.tar.gz -C "$ADDON_SHARE_DIR" || log_error "Failed to extract xraydatbuilder.tar.gz."
        rm -f /tmp/xraydatbuilder.tar.gz || log_error "Failed to remove xraydatbuilder.tar.gz."
        chmod +x "$ADDON_SHARE_DIR/xraydatbuilder" || log_error "Failed to make xraydatbuilder executable."
    else
        log_error "Failed to download XRAYUI geodata files builder."
    fi

    # Install and setup v2dat (reverse geofile data extractor)
    log_info "Installing v2dat (reverse geofile data extractor)..."
    update_loading_progress "Downloading v2dat..."
    local v2dat_arch_name=$(version_get_arch_name "v2dat")
    local v2dat_url=$(github_proxy_url "https://github.com/DanielLavrushin/v2dat/releases/latest/download/$v2dat_arch_name")
    if wget -q --show-progress --no-hsts -O "/tmp/v2dat.tar.gz" "$v2dat_url"; then
        tar -xzf /tmp/v2dat.tar.gz -C "$ADDON_SHARE_DIR" || log_error "Failed to extract v2dat.tar.gz."
        rm -f /tmp/v2dat.tar.gz || log_error "Failed to remove v2dat.tar.gz."
        chmod +x "$ADDON_SHARE_DIR/v2dat" || log_error "Failed to make v2dat executable."
    else
        log_error "Failed to download v2dat."
    fi

    # Install and setup RTLS-SCANNER
    log_info "Installing RTLS-SCANNER..."
    local rtls_arch_name=$(version_get_arch_name "rtls-scanner")
    update_loading_progress "Downloading RTLS-SCANNER..."
    local rtls_scan_url=$(github_proxy_url "https://github.com/DanielLavrushin/rtls-scanner/releases/latest/download/$rtls_arch_name")
    if wget -q --show-progress --no-hsts -O "/tmp/rtls-scanner.tar.gz" "$rtls_scan_url"; then
        tar -xzf /tmp/rtls-scanner.tar.gz -C "$ADDON_SHARE_DIR" || log_error "Failed to extract rtls-scanner.tar.gz."
        rm -f /tmp/rtls-scanner.tar.gz || log_error "Failed to remove rtls-scanner.tar.gz."
        chmod +x "$ADDON_SHARE_DIR/rtls-scanner" || log_error "Failed to make rtls-scanner executable."

        wget -q --show-progress --no-hsts -O "$ADDON_SHARE_DIR/Country.mmdb" "https://github.com/Loyalsoldier/geoip/releases/latest/download/Country.mmdb"

    else
        log_error "Failed to download RTLS-SCANNER."
    fi

    # Install and setup B4SNI (reverse geofile data extractor)
    log_info "Installing B4SNI..."
    update_loading_progress "Downloading B4SNI..."
    local b4sni_arch_name=$(version_get_arch_name "b4sni" "linux")
    local b4sni_url=$(github_proxy_url "https://github.com/DanielLavrushin/b4sni/releases/latest/download/$b4sni_arch_name")
    if wget -q --show-progress --no-hsts -O "/tmp/b4sni.tar.gz" "$b4sni_url"; then
        tar -xzf /tmp/b4sni.tar.gz -C "$ADDON_SHARE_DIR" || log_error "Failed to extract b4sni.tar.gz."
        rm -f /tmp/b4sni.tar.gz || log_error "Failed to remove b4sni.tar.gz."
        chmod +x "$ADDON_SHARE_DIR/b4sni" || log_error "Failed to make b4sni executable."
    else
        log_error "Failed to download b4sni ($b4sni_arch_name)."
    fi

    # setup logrotate
    logrotate_setup

    # setup cron jobs
    log_info "Configuring cron jobs for $ADDON_TITLE"
    cron_jobs_add

    update_community_geodata

    log_info "Cleaning up xrayui backup files..."
    if [ -d /jffs/.asdbk ]; then
        rm -f /jffs/.asdbk/xrayui_*_bk /jffs/.asdbk/*xrayui*.tmp.*_bk 2>/dev/null &&
            log_ok "Removed xrayui backup files from /jffs/.asdbk" ||
            log_debug "No xrayui backup files found in /jffs/.asdbk"
    else
        log_debug "/jffs/.asdbk directory does not exist"
    fi

    # ---------------------------------------------------------
    # performing version updates

    local json_content=$(cat "$XRAY_CONFIG_FILE")

    #  -> 0.55.1
    log_info "Updating $XRAY_CONFIG_FILE config to version 0.55.1..."
    if json_content=$(jq '
      .inbounds |= map(select(.tag != "sys:socks-in"))
    | .routing.rules //= []
    | .routing.rules |= map(select(.name != "sys:connection-check"))
  ' "$XRAY_CONFIG_FILE"); then
        echo "$json_content" >"$XRAY_CONFIG_FILE"
    fi

    log_ok "Installed $(show_version)"
    log_box "Installation process completed successfully."

    update_loading_progress "Installation completed successfully."
}

uninstall() {
    log_info "Starting XRAY UI uninstallation process."

    # Stop XRAY service if running
    if [ -f "$XRAY_PIDFILE" ]; then
        log_info "Stopping XRAY service..."
        stop
        rm -f $XRAY_PIDFILE
        log_info "XRAY service stopped."
    else
        log_warn "XRAY service is not running."
    fi

    # Remove XRAY UI files
    log_info "Removing XRAY UI files..."
    rm -rf "$ADDON_WEB_DIR" || log_warn "Failed to remove $ADDON_WEB_DIR."
    rm -rf "$ADDON_JFFS_ADN_DIR" || log_warn "Failed to remove $ADDON_JFFS_ADN_DIR."
    rm -rf "$ADDON_SHARE_DIR"/*.json || log_warn "Failed to remove $ADDON_SHARE_DIR/*.json."
    rm -rf "$ADDON_SHARE_DIR/logs" || log_warn "Failed to remove $ADDON_SHARE_DIR/logs."

    rm -rf "$ADDON_SHARE_DIR/rtls-scanner" || log_warn "Failed to remove $ADDON_SHARE_DIR/rtls-scanner."
    rm -rf "$ADDON_SHARE_DIR/v2dat" || log_warn "Failed to remove $ADDON_SHARE_DIR/v2dat."

    rm -rf "$ADDON_SHARE_DIR/Country.mmdb" || log_warn "Failed to remove $ADDON_SHARE_DIR/Country.mmdb."

    rm -rf "$ADDON_SHARE_DIR/dnsmasq" || log_warn "Failed to remove $ADDON_SHARE_DIR/dnsmasq."
    rm -rf "$ADDON_SHARE_DIR/tmp" || log_warn "Failed to remove $ADDON_SHARE_DIR/tmp."

    if [ $? -eq 0 ]; then
        log_info "XRAY UI files removed successfully."
    else
        log_error "Failed to remove XRAY UI files."
        exit 1
    fi

    clear_script_entries

    # Unmount UI
    log_info "Unmounting XRAY UI..."
    unmount_ui

    if [ $? -eq 0 ]; then
        log_info "XRAY UI unmounted successfully."
    else
        log_error "Failed to unmount XRAY UI."
        exit 1
    fi

    # Remove XRAY custom settings
    log_info "Removing XRAY custom settings..."

    grep '^xray_' /jffs/addons/custom_settings.txt | while IFS='=' read -r var_name _; do
        [ -n "$var_name" ] && am_settings_del "$var_name"
    done

    log_info "Custom settings removed successfully."

    # Remove XRAY UI shared files
    log_info "Removing XRAY UI geodata files builder..."
    rm -rf /opt/share/xrayui/xraydatbuilder || log_debug "Failed to remove /opt/share/xrayui/xraydatbuilder."

    echo
    log_warn "Do you want to remove custom GEODATA? (yes/no)"
    read -r user_input

    if [ "$user_input" = "yes" ] || [ "$user_input" = "y" ]; then
        log_info "Removing custom GEODATA..."
        rm -rf /opt/share/xrayui || log_debug "Failed to remove /opt/share/xrayui."

        #Remove XRAY custom geodata
        rm -rf /opt/sbin/xrayui || log_debug "Failed to remove /opt/sbin/xrayui."
        rm -rf /opt/sbin/geosite.dat || log_debug "Failed to remove /opt/sbin/geosite.dat."
        rm -rf /opt/sbin/geoip.dat || log_debug "Failed to remove /opt/sbin/geoip.dat."
    else
        log_info "Keeping custom GEODATA."
    fi
    user_input=""

    # Ask user if they want to remove backups
    echo
    log_warn "Do you want to remove BACKUPS? (yes/no)"
    read -r user_input

    if [ "$user_input" = "yes" ] || [ "$user_input" = "y" ]; then
        log_info "Removing  BACKUPS..."
        backup_clear
    else
        log_info "Keeping  BACKUPS."
    fi
    user_input=""

    # Ask user if they want to remove XRAY (opkg) and its configs
    echo
    log_warn "Do you want to remove XRAY (installed via opkg) and its configurations? (yes/no)"
    read -r user_input

    if [ "$user_input" = "yes" ] || [ "$user_input" = "y" ]; then
        # Remove XRAY from Entware if installed
        if opkg list-installed | grep -q '^xray$'; then
            log_info "Removing XRAY from Entware..."
            if opkg remove xray; then
                log_info "XRAY removed successfully."
            else
                log_error "Failed to remove XRAY."
                exit 1
            fi
        else
            log_info "XRAY is not installed."
        fi

        rm -f /opt/sbin/xray || log_debug "Failed to remove /opt/sbin/xray."
        rm -f /opt/sbin/geoip.dat || log_debug "Failed to remove /opt/sbin/geoip.dat."
        rm -f /opt/sbin/geosite.dat || log_debug "Failed to remove /opt/sbin/geosite.dat."

        # Remove XRAY configuration files
        log_info "Removing XRAY configuration files..."
        rm -rf /opt/etc/xray || log_debug "Failed to remove /opt/etc/xray."
        if [ $? -eq 0 ]; then
            log_info "XRAY configuration files removed successfully."
        else
            log_error "Failed to remove XRAY configuration files."
            exit 1
        fi
    else
        log_info "Keeping XRAY and its configuration files."
    fi

    # Ask user to remove xrayui settings
    echo
    log_warn "Do you want to remove XRAYUI settings (/opt/etc/xrayui.conf)? (yes/no)"
    read -r user_input
    if [ "$user_input" = "yes" ] || [ "$user_input" = "y" ]; then
        log_info "Removing XRAYUI settings..."
        rm -f /opt/etc/xrayui.conf || log_debug "Failed to remove /opt/etc/xrayui.conf."
    else
        log_info "Keeping XRAYUI (/opt/etc/xrayui.conf) settings."
    fi

    cron_jobs_clear

    rm -rf /opt/etc/logrotate.d/xrayui || log_debug "Failed to remove /opt/etc/logrotate.d/xrayui."
    rm -rf /jffs/scripts/xrayui || log_debug "Failed to remove /jffs/scripts/xrayui."

    log_box "Uninstallation process completed successfully."
}

install_opkg_package() {
    local package="$1"
    local critical=$2
    # Check for jq
    if ! opkg list-installed | grep "$package -"; then
        log_info "$package is not installed. Installing $package..."
        if opkg install $package; then
            log_info "$package installed successfully."
        else
            if [ "$critical" = true ]; then
                log_error "Critical package $package failed to install. Exiting."
                exit 1
            else
                log_warn "Non-critical package $package failed to install. Continuing."
            fi
        fi
    else
        log_info "$package is already installed."
    fi
}

setup_script_file() {

    local script_file="$1"
    local command_entry="$2"

    log_debug "Scritpt file: $script_file"
    log_debug "Command entry: $command_entry"

    if [ ! -f "$script_file" ]; then
        printf '#!/bin/sh\n\n' >"$script_file"
    else
        if ! head -n1 "$script_file" | grep -qx '#!/bin/sh'; then
            log_error "$script_file is missing the she-bang (#!/bin/sh)"
        fi
    fi

    if ! grep -Fqx -- "$command_entry" "$script_file"; then
        echo "$command_entry" >>"$script_file" || {
            log_error "Failed to add command entry to $script_file"
            return 1
        }
    fi

    chmod +x "$script_file"
    log_info "Updated $script_file with $ADDON_TITLE command entry."
}

clear_script_entries() {

    log_info "Removing existing $ADDON_TITLE entries from scripts."
    sed '/#xrayui/d' /jffs/scripts/services-start >/tmp/xrayui_script.$$ 2>/dev/null && mv /tmp/xrayui_script.$$ /jffs/scripts/services-start && chmod +x /jffs/scripts/services-start || log_debug "Failed to remove entry from /jffs/scripts/services-start."
    sed '/#xrayui/d' /jffs/scripts/nat-start >/tmp/xrayui_script.$$ 2>/dev/null && mv /tmp/xrayui_script.$$ /jffs/scripts/nat-start && chmod +x /jffs/scripts/nat-start || log_debug "Failed to remove entry from /jffs/scripts/nat-start."
    sed '/#xrayui/d' /jffs/scripts/post-mount >/tmp/xrayui_script.$$ 2>/dev/null && mv /tmp/xrayui_script.$$ /jffs/scripts/post-mount && chmod +x /jffs/scripts/post-mount || log_debug "Failed to remove entry from /jffs/scripts/post-mount."
    sed '/#xrayui/d' /jffs/scripts/service-event >/tmp/xrayui_script.$$ 2>/dev/null && mv /tmp/xrayui_script.$$ /jffs/scripts/service-event && chmod +x /jffs/scripts/service-event || log_debug "Failed to remove entry from /jffs/scripts/service-event."
    sed '/#xrayui/d' /jffs/scripts/dnsmasq.postconf >/tmp/xrayui_script.$$ 2>/dev/null && mv /tmp/xrayui_script.$$ /jffs/scripts/dnsmasq.postconf && chmod +x /jffs/scripts/dnsmasq.postconf || log_debug "Failed to remove entry from /jffs/scripts/dnsmasq.postconf."
    sed '/#xrayui/d' /jffs/scripts/wan-start >/tmp/xrayui_script.$$ 2>/dev/null && mv /tmp/xrayui_script.$$ /jffs/scripts/wan-start && chmod +x /jffs/scripts/wan-start || log_debug "Failed to remove entry from /jffs/scripts/wan-start."
}
