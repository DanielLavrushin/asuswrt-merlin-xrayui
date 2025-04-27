#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

backup_clear() {
    log_info "Starting clear all..."
    update_loading_progress "Clear all backups..."

    local payload=$(reconstruct_payload)
    local backup_file=$(echo "$payload" | jq -r '.backup')
    local backup_dir="$ADDON_SHARE_DIR/backup"

    # If backup_file is provided, delete the specific backup, else delete all backups
    if [ -n "$backup_file" ]; then
        backup_dir="$backup_dir/$backup_file"
    fi

    # Delete the backup (whether it's a specific file or all backups)
    rm -rf "$backup_dir"
    if [ $? -ne 0 ]; then
        log_error "Failed to remove backup $backup_dir."
        return 1
    fi
    log_ok "Backup $backup_dir removed successfully."

    backup_remount_to_web
}

backup_configuration() {
    log_info "Starting backup configuration..."
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
            log_error "Item not found: $item"
        fi
    done

    if [ -z "$items_list" ]; then
        log_error "No configuration items found to backup."
        return 1
    fi

    update_loading_progress "Creating backup archive $backup_file..."
    log_info "Creating backup archive $backup_file..."
    tar -czf "$backup_file" $items_list ||
        {
            log_error "Failed to create backup."
            return 1
        }

    if [ $? -ne 0 ]; then
        log_error "Failed to create backup archive."
        return 1
    fi

    backup_remount_to_web

    log_ok "Backup created successfully: $backup_file"
}

backup_remount_to_web() {
    local share_backup="$ADDON_SHARE_DIR/backup"
    local web_backup="$ADDON_WEB_DIR/backup"

    rm -r "$web_backup"

    if [ ! -d "$web_backup" ]; then
        mkdir -p "$web_backup"
        if [ $? -ne 0 ]; then
            log_error "Error: Failed to create directory '$web_backup'."
            exit 1
        fi
    fi

    for file in "$share_backup"/*; do
        log_info "Processing file: $file"
        if [ -f "$file" ]; then
            local symlink="$web_backup/$(basename "$file")"
            ln -s -f "$file" "$symlink" || log_debug "Failed to create symlink: $symlink -> $file"
            if [ $? -ne 0 ]; then
                log_error "Error: Failed to create symlink '$symlink' -> '$file'."
                return 1
            fi
            log_ok "Created symlink '$symlink' -> '$file'."
        fi
    done

    log_ok "All symlinks created successfully in '$web_backup'."
    return 0
}

backup_restore_configuration() {

    log_info "Starting restore configuration..."
    update_loading_progress "Restore configuration..."

    load_xrayui_config

    local share_backup="$ADDON_SHARE_DIR/backup"

    local payload=$(reconstruct_payload)
    local backup_file="$share_backup"/$(echo "$payload" | jq -r '.file')

    log_info "Backup file: $backup_file"

    if [ -z "$backup_file" ]; then
        log_error "No backup file specified. Please provide a .tar.gz file to restore."
        return 1
    fi

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    log_info "Starting restore from backup: $backup_file"
    update_loading_progress "Restoring configuration from $backup_file..."

    tar -xzf "$backup_file" -C /
    if [ $? -ne 0 ]; then
        log_error "Failed to extract backup archive $backup_file."
        return 1
    fi

    backup_remount_to_web

    log_ok "Restore completed successfully from $backup_file."

}
