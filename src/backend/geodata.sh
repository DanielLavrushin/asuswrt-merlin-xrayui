#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

update_community_geodata() {
    update_loading_progress "Updating community geodata files..."
    load_xrayui_config

    local geositeurl=$(github_proxy_url "${geosite_url:-$DEFAULT_GEOSITE_URL}")
    local geoipurl=$(github_proxy_url "${geoip_url:-$DEFAULT_GEOIP_URL}")

    local xray_dir=$(dirname "$(which xray)")

    log_info "Downloading geosite.dat from $geositeurl..."
    update_loading_progress "Downloading geosite.dat..."
    curl -L "$geositeurl" -o "$ADDON_TMP_DIR/geosite.dat"
    if [ $? -ne 0 ]; then
        log_error "Failed to download geosite.dat."
        return 1
    fi

    log_info "Downloading geoip.dat from $geoipurl..."
    update_loading_progress "Downloading geoip.dat..."
    curl -L "$geoipurl" -o "$ADDON_TMP_DIR/geoip.dat"
    if [ $? -ne 0 ]; then
        log_error "Failed to download geoip.dat."
        return 1
    fi

    mv -f "$ADDON_TMP_DIR/geosite.dat" "$xray_dir/geosite.dat"
    mv -f "$ADDON_TMP_DIR/geoip.dat" "$xray_dir/geoip.dat"

    geodata_recompile_all

    if [ -f "$xray_dir/geosite.dat" ] && [ -f "$xray_dir/geoip.dat" ]; then
        log_ok "Files successfully placed in $xray_dir."
        if [ -f "$XRAY_PIDFILE" ]; then
            update_loading_progress "Restarting Xray service..."
            restart
        fi
    else
        log_error "Failed to place geosite.dat/geoip.dat in $xray_dir."
    fi
}

geodata_unpack_tags() {
    local V2DAT="/opt/share/xrayui/v2dat"
    [ -n "$xray_dir" ] || xray_dir=$(dirname "$(which xray)")
    GEO_TAGS_FILE="/opt/share/xrayui/geodata_tags.json"

    json_array() {
        awk 'BEGIN{printf "[";first=1}{if($0!=""){gsub(/"/,"\\\"");if(!first)printf ",";first=0;printf "\"" $0 "\""}}END{printf "]"}'
    }

    geosite_json="[]"
    geoip_json="[]"
    xrayui_json="[]"

    if [ -f "$xray_dir/geosite.dat" ]; then
        log_info "Unpacking geosite.dat..."
        geosite_json=$($IONICE $NICE "$V2DAT" unpack geosite -p -t "$xray_dir/geosite.dat" | json_array)
    fi

    if [ -f "$xray_dir/geoip.dat" ]; then
        log_info "Unpacking geoip.dat..."
        geoip_json=$($IONICE $NICE "$V2DAT" unpack geoip -p -t "$xray_dir/geoip.dat" | json_array)
    fi

    if [ -f "$xray_dir/xrayui" ]; then
        log_info "Unpacking xrayui..."
        xrayui_json=$($IONICE $NICE "$V2DAT" unpack geosite -p -t "$xray_dir/xrayui" | json_array)
    fi

    printf '{\n  "geosite": %s,\n  "geoip": %s,\n  "xrayui": %s\n}\n' "$geosite_json" "$geoip_json" "$xrayui_json" >"$GEO_TAGS_FILE"
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

    rm -rf "$geodata_dir" || log_debug "Failed to remove existing geodata directory: $geodata_dir"

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
            ln -s -f "$tagfile" "$symlink" || log_debug "Failed to create symlink: $symlink -> $tagfile"
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

    rm -f "$outdir/xrayui" || log_debug "Failed to remove existing xrayui file: $outdir/xrayui"

    "$builder" --datapath "$datadir" --outputdir "$outdir" --outputname "xrayui" || {
        log_error "Failed to recompile geodata files."
        return 1
    }

    chmod -x "$datadir/xrayui" || log_debug "Failed to set executable permission for $datadir/xrayui"

    cleanup_payload
    geodata_unpack_tags
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
