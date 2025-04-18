#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

install() {

    update_loading_progress "Installing $ADDON_TITLE..."
    log_info "Starting $ADDON_TITLE installation process."

    load_xrayui_config

    # Check for Entware
    if [ ! -x /opt/bin/opkg ]; then
        log_error "Entware is not installed or opkg binary is not accessible."
        log_error "Please install Entware first: https://github.com/Entware/Entware/wiki/Install-on-ASUSWRT"
        exit 1
    fi
    log_info "Entware is installed."

    update_loading_progress "Installing dependencies..."
    install_opkg_package sed true
    install_opkg_package curl false
    install_opkg_package jq true
    install_opkg_package iptables true
    install_opkg_package net-tools-netstat false
    install_opkg_package libopenssl false
    install_opkg_package flock false
    install_opkg_package logrotate false
    install_opkg_package xray true

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

    # backup config
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_config="/opt/etc/xray/$(basename $XRAY_CONFIG_FILE).$timestamp.bak"
    log_info "Backing up $XRAY_CONFIG_FILE to $backup_config"
    cp -f "$XRAY_CONFIG_FILE" "$backup_config"

    update_loading_progress "Configuring XRAY UI..."
    # Add or update nat-start
    log_info "Ensuring /jffs/scripts/nat-start contains required entry."
    mkdir -p /jffs/scripts
    if [ ! -f /jffs/scripts/nat-start ]; then
        echo "#!/bin/sh" >/jffs/scripts/nat-start
    else
        log_info "Removing existing #xrayui entries from /jffs/scripts/nat-start."
        sed -i '/#xrayui/d' /jffs/scripts/nat-start
    fi

    echo '/jffs/scripts/xrayui service_event firewall configure #xrayui' >>/jffs/scripts/nat-start
    chmod +x /jffs/scripts/nat-start
    log_info "Updated /jffs/scripts/nat-start with XrayUI entry."

    # Add or update post-mount
    log_info "Ensuring /jffs/scripts/post-mount contains required entry."
    mkdir -p /jffs/scripts
    if [ ! -f /jffs/scripts/post-mount ]; then
        echo "#!/bin/sh" >/jffs/scripts/post-mount
    else
        log_info "Removing existing #xrayui entries from /jffs/scripts/post-mount."
        sed -i '/#xrayui/d' /jffs/scripts/post-mount
    fi
    chmod +x /jffs/scripts/post-mount
    echo "/jffs/scripts/xrayui service_event startup & #xrayui" >>/jffs/scripts/post-mount
    log_info "Updated /jffs/scripts/post-mount with XrayUI entry."

    # Add or update service-event
    log_info "Ensuring /jffs/scripts/service-event contains required entry."
    if [ ! -f /jffs/scripts/service-event ]; then
        echo "#!/bin/sh" >/jffs/scripts/service-event
    else
        log_info "Removing existing #xrayui entries from /jffs/scripts/service-event."
        sed -i '/#xrayui/d' /jffs/scripts/service-event
    fi
    chmod +x /jffs/scripts/service-event
    echo "echo \"\$2\" | grep -q \"^xrayui\" && /jffs/scripts/xrayui service_event \$(echo \"\$2\" | cut -d'_' -f2- | tr '_' ' ') & #xrayui" >>/jffs/scripts/service-event
    log_info "Updated /jffs/scripts/service-event with XrayUI entry."

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

    # setup logrotate
    logrotate_setup

    # setup cron jobs
    log_info "Configuring cron jobs for $ADDON_TITLE"
    cron_jobs_add

    update_community_geodata

    # ---------------------------------------------------------
    # performing version updates

    local json_content=$(cat "$XRAY_CONFIG_FILE")

    # patch 0.41->0.42 - force logs to be placed in usb storage mount
    log_info "Applying patch 0.41->0.42 to $XRAY_CONFIG_FILE"
    if [ ! -d "$ADDON_LOGS_DIR" ]; then
        mkdir -p $ADDON_LOGS_DIR
    fi

    json_content=$(
        echo "$json_content" | jq --arg error "$ADDON_LOGS_DIR/xray_error.log" --arg access "$ADDON_LOGS_DIR/xray_access.log" '
    if ((.log.access // "" | tostring | startswith("/tmp")) and (.log.error // "" | tostring | startswith("/tmp"))) then
      .log.error = $error | .log.access = $access
    else
      .
    end
  '
    )

    echo "$json_content" >"$XRAY_CONFIG_FILE"

    # ---------------------------------------------------------

    log_info ""
    log_info "================================================"
    log_info "| Installation process completed successfully. |"
    log_info "================================================"
    log_info ""

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
    rm -rf "/tmp/xray_clients_online.json" || log_warn "Failed to remove /tmp/xray_clients_online.json."
    rm -rf "$ADDON_SHARE_DIR/logs" || log_warn "Failed to remove $ADDON_SHARE_DIR/logs."

    if [ $? -eq 0 ]; then
        log_info "XRAY UI files removed successfully."
    else
        log_error "Failed to remove XRAY UI files."
        exit 1
    fi

    # clean up services-start
    log_info "Removing existing #xrayui entries from /jffs/scripts/services-start."
    sed -i '/#xrayui/d' /jffs/scripts/services-start

    # clean up nat-start
    log_info "Removing existing #xrayui entries from /jffs/scripts/nat-start."
    sed -i '/#xrayui/d' /jffs/scripts/nat-start

    # clean up post-mount
    log_info "Removing existing #xrayui entries from /jffs/scripts/post-mount."
    sed -i '/#xrayui/d' /jffs/scripts/post-mount

    # clean up service-event
    log_info "Removing existing #xrayui entries from /jffs/scripts/service-event."
    sed -i '/#xrayui/d' /jffs/scripts/service-event

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
    rm -rf /opt/share/xrayui/xraydatbuilder

    echo
    log_warn "Do you want to remove custom GEODATA? (yes/no)"
    read -r user_input

    if [ "$user_input" = "yes" ] || [ "$user_input" = "y" ]; then
        log_info "Removing custom GEODATA..."
        rm -rf /opt/share/xrayui

        #Remove XRAY custom geodata
        rm -rf /opt/sbin/xrayui
        rm -rf /opt/sbin/geosite.dat
        rm -rf /opt/sbin/geoip.dat
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
        backup_clearall
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

        # Remove XRAY configuration files
        log_info "Removing XRAY configuration files..."
        rm -rf /opt/etc/xray
        if [ $? -eq 0 ]; then
            log_info "XRAY configuration files removed successfully."
        else
            log_error "Failed to remove XRAY configuration files."
            exit 1
        fi
    else
        log_info "Keeping XRAY and its configuration files."
    fi

    cron_jobs_clear

    rm -rf /opt/etc/logrotate.d/xrayui
    rm -rf /jffs/scripts/xrayui

    log_info "=============================================="
    log_info "Uninstallation process completed successfully."
    log_info "=============================================="
}

install_opkg_package() {
    local package="$1"
    local critical=$2
    # Check for jq
    if ! opkg list-installed | grep "$package -"; then
        log_info "$package is not installed. Installing $package..."
        opkg update
        if opkg install $package; then
            log_info "$package installed successfully."
        else
            if [ "$critical" = true ]; then
                log_error "Critical package $package failed to install. Exiting."
                exit 1
            else
                log_error "Non-critical package $package failed to install. Continuing."
            fi
        fi
    else
        log_info "$package is already installed."
    fi
}
