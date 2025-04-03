#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

backup_clearall() {

    printlog true "Starting clear all..." "$CINFO"
    update_loading_progress "Clear all backups..."

    local backup_dir="$ADDON_SHARE_DIR/backup"

    if [ -d "$backup_dir" ]; then
        rm -rf "$backup_dir"
        if [ $? -ne 0 ]; then
            printlog true "Failed to remove backup directory $backup_dir." "$CERR"
            return 1
        fi
        printlog true "Backup directory $backup_dir removed successfully." "$CSUC"
    else
        printlog true "Backup directory $backup_dir does not exist." "$CERR"
    fi

    backup_remount_to_web

    update_loading_progress "Clear all completed." 100

}

backup_configuration() {
    printlog true "Starting backup configuration..." "$CINFO"
    update_loading_progress "Backup configuration..."

    local backup_dir="$ADDON_SHARE_DIR/backup"
    mkdir -p "$backup_dir"

    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$backup_dir/xrayui-$timestamp.tar.gz"

    local items_list=""
    for item in /opt/etc/xray/*.json /opt/etc/xray/cert /jffs/xrayui_custom /opt/share/xrayui/data /opt/etc/xrayui.conf; do
        if [ -e "$item" ]; then
            items_list="$items_list $item"
        else
            printlog true "Item not found: $item" "$CERR"
        fi
    done

    if [ -z "$items_list" ]; then
        printlog true "No configuration items found to backup." "$CERR"
        return 1
    fi

    update_loading_progress "Creating backup archive $backup_file..."
    printlog true "Creating backup archive $backup_file..." "$CINFO"
    tar -czf "$backup_file" $items_list ||
        {
            printlog true "Failed to create backup." "$CERR"
            return 1
        }

    if [ $? -ne 0 ]; then
        printlog true "Failed to create backup archive." "$CERR"
        return 1
    fi

    backup_remount_to_web

    printlog true "Backup created successfully: $backup_file" "$CSUC"
    update_loading_progress "Backup created successfully: $backup_file" 100
}

backup_remount_to_web() {
    local share_backup="$ADDON_SHARE_DIR/backup"
    local web_backup="$ADDON_WEB_DIR/backup"

    rm -r "$web_backup"

    if [ ! -d "$web_backup" ]; then
        mkdir -p "$web_backup"
        if [ $? -ne 0 ]; then
            printlog true "Error: Failed to create directory '$web_backup'." "$CERR"
            exit 1
        fi
    fi

    for file in "$share_backup"/*; do
        printlog true "Processing file: $file" "$CINFO"
        if [ -f "$file" ]; then
            local symlink="$web_backup/$(basename "$file")"
            ln -s -f "$file" "$symlink"
            if [ $? -ne 0 ]; then
                printlog true "Error: Failed to create symlink '$symlink' -> '$file'." "$CERR"
                return 1
            fi
            printlog true "Created symlink '$symlink' -> '$file'." "$CSUC"
        fi
    done

    printlog true "All symlinks created successfully in '$web_backup'." "$CSUC"
    return 0
}
