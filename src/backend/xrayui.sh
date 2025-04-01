#!/bin/sh

import ./_globals.sh
import ./_helper.sh

import ./config.sh
import ./mount.sh
import ./version.sh
import ./control.sh
import ./install.sh
import ./update.sh
import ./firewall.sh
import ./connected_clients.sh
import ./certificates.sh
import ./reality.sh
import ./wireguard.sh
import ./general_opts.sh
import ./response.sh
import ./github.sh
import ./geodata.sh
import ./profile.sh
import ./logs.sh

case "$1" in
version)
    show_version
    ;;
install)
    install
    ;;
uninstall)
    uninstall
    ;;
update)
    update
    ;;
start)
    start
    ;;
stop)
    stop
    ;;
restart)
    restart
    ;;
mount_ui)
    mount_ui
    ;;
unmount_ui)
    unmount_ui
    ;;
remount_ui)
    remount_ui $2
    ;;
fixme)
    fixme
    ;;
service_event)
    if [ "$2" = "webapp" ]; then
        case "$3" in
        start)
            webapp_start
            ;;
        stop)
            webapp_stop
            ;;
        restart)
            webapp_restart
            ;;
        *) ;;
        esac
        exit 0
    elif [ "$2" = "cleanloadingprogress" ]; then
        remove_loading_progress
    elif [ "$2" = "testconfig" ]; then
        test_xray_config
    elif [ "$2" = "startup" ]; then
        get_xray_proc
        if [ "$(am_settings_get xray_startup)" = "y" ]; then
            sleep 60 # wait for network and iptable rules to be ready
            restart
        elif [ -n "$xray_pid" ]; then
            printlog true "Xray service is disabled by XRAYUI. Stopping Xray service..."
            stop
        else
            printlog true "Xray service is disabled by XRAYUI. Xray service is not running."
        fi
    elif [ "$2" = "update" ]; then
        update
    elif [ "$2" = "geodata" ]; then
        if [ "$3" = "communityupdate" ]; then
            update_community_geodata
            update_loading_progress "Community geodata files updated successfully." 100
        elif [ "$3" = "customtagfiles" ]; then
            get_custom_geodata_tagfiles
            update_loading_progress "Custom tagfiles retrieved successfully." 100
        elif [ "$3" = "customrecompileall" ]; then
            geodata_recompile_all
            update_loading_progress "Geodata recompiled successfully." 100
        elif [ "$3" = "customrecompile" ]; then
            geodata_recompile
            update_loading_progress "Geodata recompiled successfully." 100
        elif [ "$3" = "customdeletetag" ]; then
            geodata_delete_tag
            update_loading_progress "Geodata tag deleted successfully." 100
        fi
    elif [ "$2" = "connectedclients" ]; then
        get_connected_clients
    elif [ "$2" = "configuration" ]; then
        case "$3" in
        "apply")
            apply_config
            ;;
        "logs")
            case "$4" in
            "fetch")
                logs_fetch
                ;;
            "changeloglevel")
                change_log_level
                ;;
            *)
                enable_config_logs
                ;;
            esac
            exit 0
            ;;
        "togglestartup")
            toggle_startup
            ;;
        "generatedefaultconfig")
            generate_xray_config
            ;;
        initresponse)
            initial_response
            ;;
        applygeneraloptions)
            apply_general_options
            ;;
        xrayversionswitch)
            switch_xray_version
            ;;
        changeprofile)
            change_config_profile
            ;;
        deleteprofile)
            delete_config_profile
            ;;
        esac
    elif [ "$2" = "regenerate" ]; then
        case "$3" in
        "realitykeys")
            regenerate_reality_keys
            ;;
        "wgkeys")
            regenerate_wireguard_keys
            ;;
        "sslcertificates")
            regenerate_ssl_certificates
            ;;
        esac
    elif [ "$2" = "firewall" ]; then
        case "$3" in
        configure)
            configure_firewall
            ;;
        cleanup)
            cleanup_firewall
            ;;
        esac
    elif [ "$2" = "serverstatus" ]; then
        case "$3" in
        "start")
            update_loading_progress "Starting Xray service..." 0
            start
            update_loading_progress "Xray service started successfully." 100
            ;;
        "restart")
            update_loading_progress "Restarting Xray service..." 0
            restart
            update_loading_progress "Xray service restarted successfully." 100
            ;;
        "stop")
            update_loading_progress "Stopping Xray service..." 0
            stop
            update_loading_progress "Xray service stopped successfully." 100
            ;;
        *)
            exit 1
            ;;
        esac
    fi
    exit 0
    ;;
*)
    echo "Usage: $0 {version|install|uninstall|start|stop|restart|update|mount_ui|unmount_ui|remount_ui}"
    exit 1
    ;;
esac

exit 0
