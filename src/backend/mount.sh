#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

mount_ui() {

    check_lock

    load_xrayui_config

    nvram get rc_support | grep -q am_addons
    if [ $? != 0 ]; then
        log_error "This firmware does not support addons!"
        exit 5
    fi

    get_webui_page true

    if [ "$ADDON_USER_PAGE" = "none" ]; then
        log_error "Unable to install XRAYUI"
        exit 5
    fi

    log_info "Mounting XRAYUI as $ADDON_USER_PAGE"

    if [ ! -d $ADDON_TMP_DIR ]; then
        mkdir -p "$ADDON_TMP_DIR"
    fi

    ln -s -f "$ADDON_JFFS_ADN_DIR/index.asp" "/www/user/$ADDON_USER_PAGE"
    echo "xrayui" >"/www/user/$(echo $ADDON_USER_PAGE | cut -f1 -d'.').title"

    if [ ! -f /tmp/menuTree.js ]; then
        cp /www/require/modules/menuTree.js /tmp/
        mount -o bind /tmp/menuTree.js /www/require/modules/menuTree.js
    fi

    sed -i '/index: "menu_VPN"/,/index:/ {
  /url:\s*"NULL",\s*tabName:\s*"__INHERIT__"/ i \
    { url: "'"$ADDON_USER_PAGE"'", tabName: "X-RAY" },
}' /tmp/menuTree.js

    umount /www/require/modules/menuTree.js && mount -o bind /tmp/menuTree.js /www/require/modules/menuTree.js

    if [ ! -d $ADDON_WEB_DIR ]; then
        mkdir -p "$ADDON_WEB_DIR"
    fi

    if [ ! -d "$ADDON_SHARE_DIR/data" ]; then
        mkdir -p "$ADDON_SHARE_DIR/data"
    fi

    ln -s -f "$ADDON_SCRIPT" "/opt/bin/$ADDON_TAG" || log_error "Failed to create symlink for $ADDON_TAG."

    ln -s -f "$ADDON_JFFS_ADN_DIR/app.js" $ADDON_WEB_DIR/app.js || log_error "Failed to create symlink for app.js."
    ln -s -f "$XRAY_CONFIG_FILE" "$ADDON_WEB_DIR/xray-config.json" || log_error "Failed to create symlink for xray-config.json."

    rm -f "$ADDON_WEB_DIR/clients-online.json"
    ln -s -f "$XRAYUI_CLIENTS_FILE" "$ADDON_WEB_DIR/clients-online.json" || log_error "Failed to create symlink for xray_clients_online.json."
    ln -s -f "$XRAYUI_CONNECTION_STATUS_FILE" "$ADDON_WEB_DIR/connection-status.json" || log_error "Failed to create symlink for xray_connection_status.json."
    ln -s -f "$XRAYUI_SUBSCRIPTIONS_FILE" "$ADDON_WEB_DIR/subscriptions.json" || log_error "Failed to create symlink for xray_subscriptions.json."
    ln -s -f "$XRAYUI_GEOTAGS_FILE" "$ADDON_WEB_DIR/geotags.json" || log_error "Failed to create symlink for xray_geotags.json."
    ln -s -f "$ADDON_SHARE_DIR/logs/rtls-results.log" "$ADDON_WEB_DIR/rtls-results.json" || log_error "Failed to create symlink for rtls-scan-results.log."

    geodata_remount_to_web

    clear_lock
    log_ok "XRAYUI mounted successfully as $ADDON_USER_PAGE"
}

unmount_ui() {

    check_lock

    nvram get rc_support | grep -q am_addons
    if [ $? != 0 ]; then
        log_error "This firmware does not support addons!"
        exit 5
    fi

    get_webui_page

    local base_user_page="${ADDON_USER_PAGE%.asp}"

    if [ -z "$ADDON_USER_PAGE" ] || [ "$ADDON_USER_PAGE" = "none" ]; then
        log_warn "No XRAYUI page found to unmount. Continuing to clean up..."
    else
        log_info "Unmounting XRAYUI $ADDON_USER_PAGE"
        rm -fr /www/user/$ADDON_USER_PAGE
        rm -fr /www/user/$base_user_page.title
    fi

    if [ ! -f /tmp/menuTree.js ]; then
        log_warn "menuTree.js not found, skipping unmount."
    else
        log_info "Removing any X-RAY menu entry from menuTree.js."
        # Safely remove entries with tabName: "X-RAY"
        grep -v "tabName: \"X-RAY\"" /tmp/menuTree.js >/tmp/menuTree_temp.js
        mv /tmp/menuTree_temp.js /tmp/menuTree.js

        umount /www/require/modules/menuTree.js
        mount -o bind /tmp/menuTree.js /www/require/modules/menuTree.js
    fi

    rm -rf "/opt/bin/$ADDON_TAG" || log_error "Failed to remove symlink for $ADDON_TAG."

    clear_lock

    log_ok "Unmount completed."
}

remount_ui() {
    if [ "$1" != "skipwait" ]; then
        log_warn "sleeping for 10 seconds..."
        # sleep 10
    fi

    unmount_ui
    sleep 1
    mount_ui
}
