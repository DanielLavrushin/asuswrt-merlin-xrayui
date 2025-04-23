#!/bin/sh

import ./_globals.sh
import ./_helper.sh

import ./lock.sh
import ./ntp.sh
import ./config.sh
import ./mount.sh
import ./version.sh
import ./control.sh
import ./startup.sh
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
import ./backup.sh
import ./cron.sh
import ./dnsmasq.sh

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
    case "$2" in
    xray)
        switch_xray_version $3
        ;;
    *)
        update "$2"
        ;;
    esac
    exit 0
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
backup)
    backup_configuration
    ;;
dnsmasq)
    dnsmasq_configure "$2"
    ;;
cron)
    case "$2" in
    addjobs)
        cron_jobs_add
        ;;
    deletejobs)
        cron_jobs_clear
        ;;
    logrotate)
        cron_logrotate_run
        ;;
    geodata)
        update_community_geodata
        ;;
    *) ;;
    esac
    exit 0
    ;;
service_event)
    case "$2" in
    webapp)
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
        ;;
    startup)
        startup
        ;;
    cleanloadingprogress)
        remove_loading_progress
        ;;
    testconfig)
        test_xray_config true
        ;;
    update)
        update
        initial_response
        update_loading_progress "Update process completed!" 100
        exit 0
        ;;
    geodata)
        case "$3" in
        communityupdate)
            update_community_geodata
            update_loading_progress "Community geodata files updated successfully." 100
            ;;
        customtagfiles)
            get_custom_geodata_tagfiles
            update_loading_progress "Custom tagfiles retrieved successfully." 100
            ;;
        customrecompileall)
            geodata_recompile_all
            update_loading_progress "Geodata recompiled successfully." 100
            ;;
        customrecompile)
            geodata_recompile
            update_loading_progress "Geodata recompiled successfully." 100
            ;;
        customdeletetag)
            geodata_delete_tag
            update_loading_progress "Geodata tag deleted successfully." 100
            ;;
        esac
        ;;
    connectedclients)
        get_connected_clients
        ;;
    regenerate)
        case "$3" in
        realitykeys)
            regenerate_reality_keys
            ;;
        wgkeys)
            regenerate_wireguard_keys
            ;;
        sslcertificates)
            regenerate_ssl_certificates
            ;;
        esac
        ;;
    configuration)
        case "$3" in
        apply)
            apply_config
            update_loading_progress "Configuration applied successfully." 100
            exit 0
            ;;
        logs)
            case "$4" in
            fetch)
                logs_fetch
                ;;
            changeloglevel)
                change_log_level
                update_loading_progress "Log level changed successfully." 100
                ;;
            *)
                enable_config_logs
                update_loading_progress "Configuration logs enabled successfully." 100
                ;;
            esac
            exit 0
            ;;
        togglestartup)
            toggle_startup
            ;;
        generatedefaultconfig)
            generate_xray_config
            ;;
        initresponse)
            initial_response
            ;;
        applygeneraloptions)
            apply_general_options
            initial_response
            update_loading_progress "General settings applied." 100
            ;;
        xrayversionswitch)
            switch_xray_version
            initial_response
            if [ -f "$XRAY_PIDFILE" ]; then
                update_loading_progress "Restarting Xray service..."
                restart
            fi
            update_loading_progress "Switched Xray version successfully!" 100
            ;;
        changeprofile)
            change_config_profile
            initial_response
            update_loading_progress "Configuration profile changed successfully." 100
            ;;
        deleteprofile)
            delete_config_profile
            initial_response
            update_loading_progress "Configuration profile deleted successfully." 100
            ;;
        backup)
            backup_configuration
            initial_response
            update_loading_progress "Backup created successfully" 100
            ;;
        backupclearall)
            backup_clearall
            initial_response
            update_loading_progress "Clear all completed." 100
            ;;
        backuprestore)
            backup_restore_configuration
            initial_response
            update_loading_progress "Restore complete." 100
            ;;
        esac
        exit 0
        ;;
    firewall)
        case "$3" in
        configure)
            configure_firewall
            ;;
        cleanup)
            cleanup_firewall
            ;;
        esac
        ;;
    serverstatus)
        case "$3" in
        start)
            update_loading_progress "Starting Xray service..." 0
            start
            update_loading_progress "Xray service started successfully." 100
            ;;
        restart)
            update_loading_progress "Restarting Xray service..." 0
            restart
            update_loading_progress "Xray service restarted successfully." 100
            ;;
        stop)
            update_loading_progress "Stopping Xray service..." 0
            stop
            update_loading_progress "Xray service stopped successfully." 100
            ;;
        *)
            exit 1
            ;;
        esac
        ;;
    *) ;;
    esac
    exit 0
    ;;
*)
    echo "Usage: $0 {version|install|uninstall|start|stop|restart|update|mount_ui|unmount_ui|remount_ui}"
    exit 1
    ;;
esac

exit 0
