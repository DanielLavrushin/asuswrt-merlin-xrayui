#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

install() {

    update_loading_progress "Installing $ADDON_TITLE..."
    printlog true "Starting $ADDON_TITLE installation process."

    # Check for Entware
    if [ ! -x /opt/bin/opkg ]; then
        printlog true "Entware is not installed or opkg binary is not accessible." $CERR
        printlog true "Please install Entware first: https://github.com/Entware/Entware/wiki/Install-on-ASUSWRT" $CERR
        exit 1
    fi
    printlog true "Entware is installed." $CSUC

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

        printlog true "XRAYUI config file not found. Creating default config."

        cat <<EOF >"$XRAYUI_CONFIG_FILE"
geoip_url=
geosite_url=
logs_dir=$ADDON_LOGS_DIR
EOF
        chmod 600 "$XRAYUI_CONFIG_FILE"

        printlog true "Default XRAYUI config created successfully." $CSUC
    else
        printlog true "XRAYUI config file $XRAYUI_CONFIG_FILE found."
    fi

    generate_xray_config

    # backup config
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_config="/opt/etc/xray/$(basename $XRAY_CONFIG_FILE).$timestamp.bak"
    printlog true "Backing up $XRAY_CONFIG_FILE to $backup_config" $CSUC
    cp -f "$XRAY_CONFIG_FILE" "$backup_config"

    update_loading_progress "Configuring XRAY UI..."
    # Add or update nat-start
    printlog true "Ensuring /jffs/scripts/nat-start contains required entry."
    mkdir -p /jffs/scripts
    if [ ! -f /jffs/scripts/nat-start ]; then
        echo "#!/bin/sh" >/jffs/scripts/nat-start
    else
        printlog true "Removing existing #xrayui entries from /jffs/scripts/nat-start."
        sed -i '/#xrayui/d' /jffs/scripts/nat-start
    fi

    echo '/jffs/scripts/xrayui service_event firewall configure #xrayui' >>/jffs/scripts/nat-start
    chmod +x /jffs/scripts/nat-start
    printlog true "Updated /jffs/scripts/nat-start with XrayUI entry." $CSUC

    # Add or update post-mount
    printlog true "Ensuring /jffs/scripts/post-mount contains required entry."
    mkdir -p /jffs/scripts
    if [ ! -f /jffs/scripts/post-mount ]; then
        echo "#!/bin/sh" >/jffs/scripts/post-mount
    else
        printlog true "Removing existing #xrayui entries from /jffs/scripts/post-mount."
        sed -i '/#xrayui/d' /jffs/scripts/post-mount
    fi
    chmod +x /jffs/scripts/post-mount
    echo "/jffs/scripts/xrayui remount_ui"' "$@" & #'"xrayui" >>/jffs/scripts/post-mount
    printlog true "Updated /jffs/scripts/post-mount with XrayUI entry." $CSUC

    # Add or update services-start
    printlog true "Ensuring /jffs/scripts/services-start contains required entry."
    if [ ! -f /jffs/scripts/services-start ]; then
        echo "#!/bin/sh" >/jffs/scripts/services-start
    else
        printlog true "Removing existing #xrayui entries from /jffs/scripts/services-start."
        sed -i '/#xrayui/d' /jffs/scripts/services-start
    fi
    chmod +x /jffs/scripts/services-start
    echo "/jffs/scripts/xrayui service_event startup & #xrayui" >>/jffs/scripts/services-start
    printlog true "Updated /jffs/scripts/services-start with XrayUI entry." $CSUC

    # Add or update service-event
    printlog true "Ensuring /jffs/scripts/service-event contains required entry."
    if [ ! -f /jffs/scripts/service-event ]; then
        echo "#!/bin/sh" >/jffs/scripts/service-event
    else
        printlog true "Removing existing #xrayui entries from /jffs/scripts/service-event."
        sed -i '/#xrayui/d' /jffs/scripts/service-event
    fi
    chmod +x /jffs/scripts/service-event
    echo "echo \"\$2\" | grep -q \"^xrayui\" && /jffs/scripts/xrayui service_event \$(echo \"\$2\" | cut -d'_' -f2- | tr '_' ' ') & #xrayui" >>/jffs/scripts/service-event
    printlog true "Updated /jffs/scripts/service-event with XrayUI entry." $CSUC

    printlog true "Mounting web page..."
    remount_ui "skipwait"

    am_settings_set xray_version $XRAYUI_VERSION

    xray_startup=$(am_settings_get xray_startup)
    if [ -z "$xray_startup" ]; then
        am_settings_set xray_startup "y"
        printlog true "xray_startup was empty. Set to 'enabled'." $CWARN
    else
        printlog true "xray_startup already set. Skipping."
    fi

    mkdir -p $ADDON_USER_SCRIPTS_DIR

    # Install and setup geodata builder
    printlog true "Installing XRAY UI geodata files builder..."

    mkdir -p "$ADDON_SHARE_DIR" || printlog true "Failed to create $ADDON_SHARE_DIR." $CERR

    update_loading_progress "Downloading XRAYUI geodata files builder..."

    local release_url=$(github_proxy_url "https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/releases/latest/download/xrayui-datbuilder.tar.gz")

    if wget -q --show-progress --no-hsts -O "/tmp/xraydatbuilder.tar.gz" "$release_url"; then
        tar -xzf /tmp/xraydatbuilder.tar.gz -C "$ADDON_SHARE_DIR" || printlog true "Failed to extract xraydatbuilder.tar.gz." $CERR
        rm -f /tmp/xraydatbuilder.tar.gz || printlog true "Failed to remove xraydatbuilder.tar.gz." $CERR
        chmod +x "$ADDON_SHARE_DIR/xraydatbuilder" || printlog true "Failed to make xraydatbuilder executable." $CERR
    else
        printlog true "Failed to download XRAYUI geodata files builder." $CERR
    fi

    # setup logrotate
    printlog true "Setting up logrotate for XRAY UI..."

    if [ ! -f /opt/etc/logrotate.d/xrayui ]; then
        local log_access="$(jq -r --arg default "$ADDON_LOGS_DIR/xray_access.log" '.log.access // $default' "$XRAY_CONFIG_FILE")"
        local log_error="$(jq -r --arg default "$ADDON_LOGS_DIR/xray_error.log" '.log.error // $default' "$XRAY_CONFIG_FILE")"

        cat >/opt/etc/logrotate.d/xrayui <<EOF
$log_access $log_error {
    su nobody root
    daily
    missingok
    rotate 2
    compress
    delaycompress
    notifempty
    create 640 nobody root
    sharedscripts
    postrotate
        /jffs/scripts/xrayui restart
    endscript
}
EOF

        chmod 0644 /opt/etc/logrotate.d/xrayui || printlog true "Failed to make logrotate executable." $CERR
        printlog true "Logrotate configuration created successfully." $CSUC
    else
        printlog true "Logrotate configuration already exists. Skipping creation." $CWARN
    fi

    update_community_geodata

    # ---------------------------------------------------------
    # performing version updates

    local json_content=$(cat "$XRAY_CONFIG_FILE")

    # patch 0.41->0.42 - force logs to be placed in usb storage mount
    printlog true "Applying patch 0.41->0.42 to $XRAY_CONFIG_FILE" $CSUC
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

    printlog true ""
    printlog true "================================================" $CSUC
    printlog true "| Installation process completed successfully. |" $CSUC
    printlog true "================================================" $CSUC
    printlog true ""

    update_loading_progress "Installation completed successfully."
}

uninstall() {
    printlog true "Starting XRAY UI uninstallation process."

    # Stop XRAY service if running
    if [ -f "$XRAY_PIDFILE" ]; then
        printlog true "Stopping XRAY service..."
        stop
        rm -f $XRAY_PIDFILE
        printlog true "XRAY service stopped." $CSUC
    else
        printlog true "XRAY service is not running." $CWARN
    fi

    # Remove XRAY UI files
    printlog true "Removing XRAY UI files..."
    rm -rf "$ADDON_WEB_DIR" || printlog true "Failed to remove $ADDON_WEB_DIR." $CWARN
    rm -rf "$ADDON_JFFS_ADN_DIR" || printlog true "Failed to remove $ADDON_JFFS_ADN_DIR." $CWARN
    rm -rf "/tmp/xray_clients_online.json" || printlog true "Failed to remove /tmp/xray_clients_online.json." $CWARN
    rm -rf "$ADDON_SHARE_DIR/logs" || printlog true "Failed to remove $ADDON_SHARE_DIR/logs." $CWARN

    if [ $? -eq 0 ]; then
        printlog true "XRAY UI files removed successfully." $CSUC
    else
        printlog true "Failed to remove XRAY UI files." $CERR
        exit 1
    fi

    # clean up services-start
    printlog true "Removing existing #xrayui entries from /jffs/scripts/services-start."
    sed -i '/#xrayui/d' /jffs/scripts/services-start

    # clean up nat-start
    printlog true "Removing existing #xrayui entries from /jffs/scripts/nat-start."
    sed -i '/#xrayui/d' /jffs/scripts/nat-start

    # clean up post-mount
    printlog true "Removing existing #xrayui entries from /jffs/scripts/post-mount."
    sed -i '/#xrayui/d' /jffs/scripts/post-mount

    # clean up service-event
    printlog true "Removing existing #xrayui entries from /jffs/scripts/service-event."
    sed -i '/#xrayui/d' /jffs/scripts/service-event

    # Unmount UI
    printlog true "Unmounting XRAY UI..."
    unmount_ui

    if [ $? -eq 0 ]; then
        printlog true "XRAY UI unmounted successfully." $CSUC
    else
        printlog true "Failed to unmount XRAY UI." $CERR
        exit 1
    fi

    # Remove XRAY custom settings
    printlog true "Removing XRAY custom settings..."

    grep '^xray_' /jffs/addons/custom_settings.txt | while IFS='=' read -r var_name _; do
        [ -n "$var_name" ] && am_settings_del "$var_name"
    done

    printlog true "Custom settings removed successfully." $CSUC

    # Remove XRAY UI shared files
    printlog true "Removing XRAY UI geodata files builder..."
    rm -rf /opt/share/xrayui/xraydatbuilder

    echo
    printlog true "Do you want to remove custom GEODATA? (yes/no)" $CWARN
    read -r user_input

    if [ "$user_input" = "yes" ] || [ "$user_input" = "y" ]; then
        printlog true "Removing custom GEODATA..."
        rm -rf /opt/share/xrayui

        #Remove XRAY custom geodata
        rm -rf /opt/sbin/xrayui
        rm -rf /opt/sbin/geosite.dat
        rm -rf /opt/sbin/geoip.dat
    else
        printlog true "Keeping custom GEODATA."
    fi
    user_input=""

    # Ask user if they want to remove backups
    echo
    printlog true "Do you want to remove BACKUPS? (yes/no)" $CWARN
    read -r user_input

    if [ "$user_input" = "yes" ] || [ "$user_input" = "y" ]; then
        printlog true "Removing  BACKUPS..."
        backup_clearall
    else
        printlog true "Keeping  BACKUPS."
    fi
    user_input=""

    # Ask user if they want to remove XRAY (opkg) and its configs
    echo
    printlog true "Do you want to remove XRAY (installed via opkg) and its configurations? (yes/no)" $CWARN
    read -r user_input

    if [ "$user_input" = "yes" ] || [ "$user_input" = "y" ]; then
        # Remove XRAY from Entware if installed
        if opkg list-installed | grep -q '^xray$'; then
            printlog true "Removing XRAY from Entware..."
            if opkg remove xray; then
                printlog true "XRAY removed successfully." $CSUC
            else
                printlog true "Failed to remove XRAY." $CERR
                exit 1
            fi
        else
            printlog true "XRAY is not installed."
        fi

        # Remove XRAY configuration files
        printlog true "Removing XRAY configuration files..."
        rm -rf /opt/etc/xray
        if [ $? -eq 0 ]; then
            printlog true "XRAY configuration files removed successfully." $CSUC
        else
            printlog true "Failed to remove XRAY configuration files." $CERR
            exit 1
        fi
    else
        printlog true "Keeping XRAY and its configuration files."
    fi

    rm -rf /opt/etc/logrotate.d/xrayui
    rm -rf /jffs/scripts/xrayui

    printlog true "==============================================" $CSUC
    printlog true "Uninstallation process completed successfully." $CSUC
    printlog true "==============================================" $CSUC
}

install_opkg_package() {
    local package="$1"
    local critical=$2
    # Check for jq
    if ! opkg list-installed | grep "$package -"; then
        printlog true "$package is not installed. Installing $package..."
        opkg update
        if opkg install $package; then
            printlog true "$package installed successfully." $CSUC
        else
            if [ "$critical" = true ]; then
                printlog true "Critical package $package failed to install. Exiting." $CERR
                exit 1
            else
                printlog true "Non-critical package $package failed to install. Continuing." $CERR
            fi
        fi
    else
        printlog true "$package is already installed."
    fi
}
