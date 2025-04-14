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

backup_restore_configuration() {

    printlog true "Starting restore configuration..." "$CINFO"
    update_loading_progress "Restore configuration..."

    load_xrayui_config

    local share_backup="$ADDON_SHARE_DIR/backup"

    local payload=$(reconstruct_payload)
    local backup_file="$share_backup"/$(echo "$payload" | jq -r '.file')

    printlog true "Backup file: $backup_file" "$CINFO"

    if [ -z "$backup_file" ]; then
        printlog true "No backup file specified. Please provide a .tar.gz file to restore." "$CERR"
        return 1
    fi

    if [ ! -f "$backup_file" ]; then
        printlog true "Backup file not found: $backup_file" "$CERR"
        return 1
    fi

    printlog true "Starting restore from backup: $backup_file" "$CINFO"
    update_loading_progress "Restoring configuration from $backup_file..."

    tar -xzf "$backup_file" -C /
    if [ $? -ne 0 ]; then
        printlog true "Failed to extract backup archive $backup_file." "$CERR"
        return 1
    fi

    backup_remount_to_web

    printlog true "Restore completed successfully from $backup_file." "$CSUC"
    update_loading_progress "Restore complete." 100

}
