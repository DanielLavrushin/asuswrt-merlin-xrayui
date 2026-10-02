#!/bin/sh

import ./_globals.sh
import ./_helper.sh

import ./lock.sh
import ./ntp.sh
import ./config.sh
import ./mount.sh
import ./api.sh
import ./version.sh
import ./control.sh
import ./startup.sh
import ./install.sh
import ./update.sh
import ./firewall.sh
import ./certificates.sh
import ./reality.sh
import ./wireguard.sh
import ./ech.sh
import ./tlsping.sh
import ./general_opts.sh
import ./response.sh
import ./subscriptions.sh
import ./github.sh
import ./geodata.sh
import ./profile.sh
import ./logs.sh
import ./backup.sh
import ./cron.sh
import ./failover.sh
import ./dnsmasq.sh
import ./diagnostics.sh
import ./rtls.sh
import ./b4sni.sh

case "$1" in
version)
    show_version
    ;;
install)
    install || exit 1
    ;;
uninstall)
    uninstall
    ;;
update)
    case "$2" in
    xray)
        switch_xray_version $3 || exit 1
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
diagnostics)
    case "$2" in
    iptables)
        diagnostics_iptables
        ;;
    env)
        diagnostics_env
        ;;
    xrayui)
        diagnostics_xrayui
        ;;
    *)
        diagnostics_env
        diagnostics_xrayui
        diagnostics_iptables
        ;;
    esac
    exit 0
    ;;
subscriptions)
    case "$2" in
    process)
        process_subscriptions "$3"
        ;;
    esac
    exit 0
    ;;
cron)
    case "$2" in
    logrotate | geodata | subscription_refresh | subscription_fallback | ipset_save)
        cron_job_lock "$2" || exit 0
        update_loading_progress() { :; }
        ;;
    esac
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
        update_community_geodata if_changed
        ;;
    subscription_refresh)
        cron_subscription_refresh_run
        ;;
    subscription_fallback)
        failover_check
        ;;
    ipset_save)
        load_xrayui_config
        if [ "$ipsec" = "redirect" ] && [ -n "$(get_xray_daemon_pid)" ] && firewall_is_configured; then
            with_firewall_lock ipset_learned_save
        fi
        ;;
    *) ;;
    esac
    exit $?
    ;;
service_event)
    case "$2" in
    b4sni)
        case "$3" in
        start)
            b4sni_start
            ;;
        stop)
            b4sni_stop
            ;;
        clearlogs)
            b4sni_clear_logs
            ;;
        esac
        ;;
    rtlsscan)
        case "$3" in
        start)
            rtls_scan_start
            ;;
        stop)
            rtls_scan_stop
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
        if update; then
            initial_response
            update_loading_progress "Update process completed!" 100
        else
            initial_response
            update_loading_progress "Error: the update finished with errors. The details are in the system log." 100
        fi
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
            if geodata_recompile_all; then
                update_loading_progress "Geodata recompiled successfully." 100
            else
                update_loading_progress "Error: geodata could not be recompiled." 100
            fi
            ;;
        customrecompile)
            if geodata_recompile; then
                update_loading_progress "Geodata recompiled successfully." 100
            else
                update_loading_progress "Error: the custom list could not be saved or compiled." 100
            fi
            ;;
        customdeletetag)
            if geodata_delete_tag; then
                update_loading_progress "Geodata tag deleted successfully." 100
            else
                update_loading_progress "Error: the geodata tag could not be deleted or geodata could not be recompiled." 100
            fi
            ;;
        esac
        ;;
    connectedclients)
        api_get_connected_clients
        ;;
    connectionstatus)
        api_get_connection_status
        ;;
    regenerate)
        case "$3" in
        realitykeys)
            reality_generate_keys
            ;;
        wgkeys)
            wireguard_generate_keys
            ;;
        sslcertificates)
            regenerate_ssl_certificates
            ;;
        echkeys)
            ech_generate_keys
            ;;
        esac
        ;;
    tlsping)
        tlsping_fetch
        exit 0
        ;;
    configuration)
        case "$3" in
        apply)
            apply_config
            update_loading_progress "Configuration applied successfully." 100
            exit 0
            ;;
        stagechunk)
            stage_chunk
            exit 0
            ;;
        sbscrpts)
            case "$4" in
            fetchprotocols)
                update_loading_progress "Updating subscription protocols..." 0
                if subscription_fetch_protocols; then
                    update_loading_progress "Subscription protocols updated successfully." 100
                else
                    update_loading_progress "No usable links were fetched. The previous list was kept." 100
                fi
                ;;
            esac
            ;;
        logs)
            case "$4" in
            fetch)
                logs_fetch
                ;;
            changeloglevel)
                if change_log_level; then
                    update_loading_progress "Log level changed successfully." 100
                else
                    update_loading_progress "Error: failed to change the log level. Nothing was changed." 100
                fi
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
            if apply_general_options; then
                initial_response
                update_loading_progress "General settings applied." 100
            fi
            ;;
        xrayversionswitch)
            switch_xray_version
            case $? in
            0)
                initial_response
                update_loading_progress "Switched Xray version successfully!" 100
                ;;
            2)
                initial_response
                update_loading_progress "Error: the new Xray version was installed, but Xray did not start with the current configuration. The details are in the system log." 100
                ;;
            *)
                initial_response
                update_loading_progress "Error: failed to switch the Xray version. The details are in the system log." 100
                ;;
            esac
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
        backupclear)
            backup_clear
            initial_response
            update_loading_progress "Clearing backup complete." 100
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
            FIREWALL_FROM_HOOK="true"
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
            if stop; then
                update_loading_progress "Xray service stopped successfully." 100
            else
                update_loading_progress "Error: Xray is still running. The details are in the system log." 100
            fi
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
