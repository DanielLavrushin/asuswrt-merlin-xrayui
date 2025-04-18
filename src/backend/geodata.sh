#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

update_community_geodata() {
    update_loading_progress "Updating community geodata files..." 0
    load_xrayui_config

    local geositeurl=$(github_proxy_url "${geosite_url:-$DEFAULT_GEOSITE_URL}")
    local geoipurl=$(github_proxy_url "${geoip_url:-$DEFAULT_GEOIP_URL}")

    local target_dir=$(dirname "$(which xray)")

    mkdir -p "$target_dir"

    log_info "Downloading geosite.dat from $geositeurl..."
    update_loading_progress "Downloading geosite.dat..."
    curl -L "$geositeurl" -o "$target_dir/geosite.dat"
    if [ $? -ne 0 ]; then
        log_error "Failed to download geosite.dat."
        return 1
    fi

    log_info "Downloading geoip.dat from $geoipurl..."
    update_loading_progress "Downloading geoip.dat..."
    curl -L "$geoipurl" -o "$target_dir/geoip.dat"
    if [ $? -ne 0 ]; then
        log_error "Failed to download geoip.dat."
        return 1
    fi

    if [ -f "$target_dir/geosite.dat" ] && [ -f "$target_dir/geoip.dat" ]; then
        log_ok "Files successfully placed in $target_dir."
        if [ -f "$XRAY_PIDFILE" ]; then
            update_loading_progress "Restarting Xray service..."
            restart
        fi
    else
        log_error "Failed to place geosite.dat/geoip.dat in $target_dir."
    fi
    update_loading_progress "Community geodata files updated successfully." 100
}

get_custom_geodata_tagfiles() {

    log_info "Starting geodata tagfiles retrieval process..."
    update_loading_progress "Retrieving geodata tagfiles..."

    load_ui_response

    local data_dir="$ADDON_SHARE_DIR/data"

    local tagfiles_json=$(find "$data_dir" -type f -exec basename {} \; | \sed 's/\.[^.]*$//' | sort | jq -R -s -c 'split("\n")[:-1]')

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson tags "$tagfiles_json" '.geodata["tags"] = $tags')

    save_ui_response

    if [ $? -ne 0 ]; then
        log_error "Error: Failed to update JSON content with tags."
        return 1
    fi

    log_ok "Saved tagfiles to $UI_RESPONSE_FILE successfully."
    return 0
}

geodata_remount_to_web() {
    local datadir="$ADDON_SHARE_DIR/data"
    local geodata_dir="$ADDON_WEB_DIR/geodata"

    rm -rf "$geodata_dir"

    if [ ! -d "$geodata_dir" ]; then
        mkdir -p "$geodata_dir"
        if [ $? -ne 0 ]; then
            log_error "Error: Failed to create directory '$geodata_dir'."
            exit 1
        fi
    fi

    find "$geodata_dir" -type l -name "*.asp" -exec rm {} \;

    # Create new .asp symlinks for each file in data_dir
    for tagfile in "$datadir"/*; do
        if [ -f "$tagfile" ]; then
            tagbasename=$(basename "$tagfile")
            tagname="${tagbasename%.*}" # Remove extension if any

            # Define symlink name with .asp extension
            symlink="$geodata_dir/$tagname.asp"

            # Create the symlink (using absolute paths)
            ln -s -f "$tagfile" "$symlink"
            if [ $? -ne 0 ]; then
                log_error "Error: Failed to create symlink '$symlink' -> '$tagfile'."
                return 1
            fi

            log_ok "Created symlink '$symlink' -> '$tagfile'."
        fi
    done

    get_custom_geodata_tagfiles

    log_ok "All symlinks created successfully in '$geodata_dir'."
    return 0
}

geodata_recompile_all() {
    log_info "Recompiling ALL custom geodata files..."
    update_loading_progress "Recompiling geodata files..."

    local builder="$ADDON_SHARE_DIR/xraydatbuilder"

    if [ ! -f "$builder" ] || [ ! -x "$builder" ]; then
        log_error "Error: Builder not found or not executable at $builder"
        return 1
    fi

    local outdir=$(dirname "$(which xray)")
    local datadir="$ADDON_SHARE_DIR/data"

    rm -f "$outdir/xrayui"

    "$builder" --datapath "$datadir" --outputdir "$outdir" --outputname "xrayui" || {
        log_error "Failed to recompile geodata files."
        return 1
    }

    chmod -x "$datadir/xrayui"

    cleanup_payload
    geodata_remount_to_web

    if [ -f "$XRAY_PIDFILE" ]; then
        update_loading_progress "Restarting Xray service..."
        restart
    fi

    log_ok "Recompiled all custom geodata files successfully."
    return 0
}

geodata_recompile() {
    log_info "Starting geodata recompilation process..."
    update_loading_progress "Recompiling geodata files..."

    local datadir="$ADDON_SHARE_DIR/data"

    if [ ! -d "$datadir" ]; then
        log_error "Error: Data directory '$datadir' does not exist."
        return 1
    fi

    # Reconstruct the payload
    local datfile=$(reconstruct_payload)
    if [ $? -ne 0 ] || [ -z "$datfile" ]; then
        log_error "Error: Failed to reconstruct payload."
        return 1
    fi

    # Extract 'tag' and 'content' from the payload using jq
    local filename=$(echo "$datfile" | jq -r '.tag')
    if [ $? -ne 0 ] || [ -z "$filename" ] || [ "$filename" == "null" ]; then
        log_error "Error: Invalid or missing 'tag' in payload."
        return 1
    fi

    local filecontent=$(echo "$datfile" | jq -r '.content')
    if [ $? -ne 0 ] || [ -z "$filecontent" ] || [ "$filecontent" == "null" ]; then
        log_error "Error: Invalid or missing 'content' in payload."
        return 1
    fi

    local filepath="$datadir/$filename"

    echo "$filecontent" >"$filepath"
    if [ $? -ne 0 ]; then
        log_error "Error: Failed to write content to '$filepath'."
        return 1
    fi

    log_ok "Successfully wrote content to '$filepath'."

    geodata_recompile_all

    if [ $? -ne 0 ]; then
        log_error "Error: Recompiling geodata files failed."
        return 1
    fi

    log_ok "Geodata recompilation process completed successfully."
    return 0
}

geodata_delete_tag() {
    log_info "Starting geodata tag deletion process..."
    update_loading_progress "Deleting geodata tag..."

    local datadir="$ADDON_SHARE_DIR/data"
    local geodata_dir="$ADDON_SHARE_DIR/geodata"

    # Check if the data directory exists
    if [ ! -d "$datadir" ]; then
        log_error "Error: Data directory '$datadir' does not exist."
        return 1
    fi

    # Reconstruct the payload
    local datfile=$(reconstruct_payload)
    if [ $? -ne 0 ] || [ -z "$datfile" ]; then
        log_error "Error: Failed to reconstruct payload."
        return 1
    fi

    # Extract 'tag' from the payload using jq
    local filename=$(echo "$datfile" | jq -r '.tag')
    if [ $? -ne 0 ] || [ -z "$filename" ] || [ "$filename" == "null" ]; then
        log_error "Error: Invalid or missing 'tag' in payload."
        return 1
    fi

    # Define the file and symlink paths
    local filepath="$datadir/$filename"
    local symlinkpath="$geodata_dir/$filename.asp"

    # Remove the file from the data directory
    if [ -f "$filepath" ]; then
        rm "$filepath"
        if [ $? -ne 0 ]; then
            log_error "Error: Failed to delete file '$filepath'."
            return 1
        fi
        log_ok "Successfully deleted file '$filepath'."
    else
        log_warn "Warning: File '$filepath' does not exist. Skipping deletion."
    fi

    # Remove the symlink from the geodata directory
    if [ -L "$symlinkpath" ]; then
        rm "$symlinkpath"
        if [ $? -ne 0 ]; then
            log_error "Error: Failed to delete symlink '$symlinkpath'."
            return 1
        fi
        log_ok "Successfully deleted symlink '$symlinkpath'."
    else
        log_warn "Warning: Symlink '$symlinkpath' does not exist. Skipping deletion."
    fi

    geodata_recompile_all

    if [ $? -ne 0 ]; then
        log_error "Error: Recompiling geodata files failed."
        return 1
    fi

    # Log the successful deletion process
    log_ok "Geodata tag deletion process completed successfully."

    return 0
}
