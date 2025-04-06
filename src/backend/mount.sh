#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

mount_ui() {

    check_lock

    nvram get rc_support | grep -q am_addons
    if [ $? != 0 ]; then
        printlog true "This firmware does not support addons!" $CERR
        exit 5
    fi

    get_webui_page true

    if [ "$ADDON_USER_PAGE" = "none" ]; then
        printlog true "Unable to install XRAYUI" $CERR
        exit 5
    fi

    printlog true "Mounting XRAYUI as $ADDON_USER_PAGE"

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

    ln -s -f "$ADDON_SCRIPT" "/opt/bin/$ADDON_TAG" || printlog true "Failed to create symlink for $ADDON_TAG." $CERR

    ln -s -f "$ADDON_JFFS_ADN_DIR/app.js" $ADDON_WEB_DIR/app.js || printlog true "Failed to create symlink for app.js." $CERR
    ln -s -f "$XRAY_CONFIG_FILE" "$ADDON_WEB_DIR/xray-config.json" || printlog true "Failed to create symlink for xray-config.json." $CERR

    geodata_remount_to_web

    clear_lock
    printlog true "XRAYUI mounted successfully as $ADDON_USER_PAGE" $CSUC
}

unmount_ui() {

    check_lock

    nvram get rc_support | grep -q am_addons
    if [ $? != 0 ]; then
        printlog true "This firmware does not support addons!" $CERR
        exit 5
    fi

    get_webui_page

    local base_user_page="${ADDON_USER_PAGE%.asp}"

    if [ -z "$ADDON_USER_PAGE" ] || [ "$ADDON_USER_PAGE" = "none" ]; then
        printlog true "No XRAYUI page found to unmount. Continuing to clean up..." $CWARN
    else
        printlog true "Unmounting XRAYUI $ADDON_USER_PAGE"
        rm -fr /www/user/$ADDON_USER_PAGE
        rm -fr /www/user/$base_user_page.title
    fi

    if [ ! -f /tmp/menuTree.js ]; then
        printlog true "menuTree.js not found, skipping unmount." $CWARN
    else
        printlog true "Removing any X-RAY menu entry from menuTree.js."
        # Safely remove entries with tabName: "X-RAY"
        grep -v "tabName: \"X-RAY\"" /tmp/menuTree.js >/tmp/menuTree_temp.js
        mv /tmp/menuTree_temp.js /tmp/menuTree.js

        umount /www/require/modules/menuTree.js
        mount -o bind /tmp/menuTree.js /www/require/modules/menuTree.js
    fi

    rm -rf "/opt/bin/$ADDON_TAG" || printlog true "Failed to remove symlink for $ADDON_TAG." $CERR

    clear_lock

    printlog true "Unmount completed." $CSUC
}

remount_ui() {
    if [ "$1" != "skipwait" ]; then
        printlog true "sleeping for 10 seconds..." $CWARN
        # sleep 10
    fi

    unmount_ui
    sleep 1
    mount_ui
}
