#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

update_community_geodata() {
    update_loading_progress "Updating community geodata files..." 0
    load_xrayui_config

    local geositeurl=$(github_proxy_url "${geosite_url:-$DEFAULT_GEOSITE_URL}")
    local geoipurl=$(github_proxy_url "${geoip_url:-$DEFAULT_GEOIP_URL}")

    local target_dir=$(dirname "$(which xray)")

    mkdir -p "$target_dir"

    printlog true "Downloading geosite.dat from $geositeurl..."
    update_loading_progress "Downloading geosite.dat..."
    curl -L "$geositeurl" -o "$target_dir/geosite.dat"
    if [ $? -ne 0 ]; then
        printlog true "Failed to download geosite.dat." $CERR
        return 1
    fi

    printlog true "Downloading geoip.dat from $geoipurl..."
    update_loading_progress "Downloading geoip.dat..."
    curl -L "$geoipurl" -o "$target_dir/geoip.dat"
    if [ $? -ne 0 ]; then
        printlog true "Failed to download geoip.dat." $CERR
        return 1
    fi

    if [ -f "$target_dir/geosite.dat" ] && [ -f "$target_dir/geoip.dat" ]; then
        printlog true "Files successfully placed in $target_dir." $CSUC
        if [ -f "$XRAY_PIDFILE" ]; then
            update_loading_progress "Restarting Xray service..." 60
            restart
        fi
    else
        printlog true "Failed to place geosite.dat/geoip.dat in $target_dir." $CERR
    fi
    update_loading_progress "Community geodata files updated successfully." 100
}

get_custom_geodata_tagfiles() {

    printlog true "Starting geodata tagfiles retrieval process..."
    update_loading_progress "Retrieving geodata tagfiles..." 0

    load_ui_response

    local data_dir="$ADDON_SHARE_DIR/data"

    local tagfiles_json=$(find "$data_dir" -type f -exec basename {} \; | \sed 's/\.[^.]*$//' | sort | jq -R -s -c 'split("\n")[:-1]')
    printlog true "Tagfiles JSON: $tagfiles_json"

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq --argjson tags "$tagfiles_json" '.geodata["tags"] = $tags')

    save_ui_response

    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to update JSON content with tags." "$CERR"
        return 1
    fi

    printlog true "Saved tagfiles to $UI_RESPONSE_FILE successfully." "$CSUC"
    return 0
}

geodata_remount_to_web() {
    local datadir="$ADDON_SHARE_DIR/data"
    local geodata_dir="$ADDON_WEB_DIR/geodata"

    rm -f "$geodata_dir"

    if [ ! -d "$geodata_dir" ]; then
        mkdir -p "$geodata_dir"
        if [ $? -ne 0 ]; then
            printlog true "Error: Failed to create directory '$geodata_dir'." "$CERR"
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
                printlog true "Error: Failed to create symlink '$symlink' -> '$tagfile'." "$CERR"
                return 1
            fi

            printlog true "Created symlink '$symlink' -> '$tagfile'." "$CSUC"
        fi
    done

    get_custom_geodata_tagfiles

    printlog true "All symlinks created successfully in '$geodata_dir'." "$CSUC"
    return 0
}

geodata_recompile_all() {
    printlog true "Recompiling ALL custom geodata files..." 0

    local builder="$ADDON_SHARE_DIR/xraydatbuilder"

    if [ ! -f "$builder" ] || [ ! -x "$builder" ]; then
        printlog true "Error: Builder not found or not executable at $builder" $CERR
        return 1
    fi

    local outdir=$(dirname "$(which xray)")
    local datadir="$ADDON_SHARE_DIR/data"

    rm -f "$outdir/xrayui"

    update_loading_progress "Recompiling geodata files..." 50
    "$builder" --datapath "$datadir" --outputdir "$outdir" --outputname "xrayui" || {
        printlog true "Failed to recompile geodata files." $CERR
        return 1
    }

    chmod -x "$datadir/xrayui"

    cleanup_payload
    geodata_remount_to_web

    if [ -f "$XRAY_PIDFILE" ]; then
        update_loading_progress "Restarting Xray service..." 60
        restart
    fi

    printlog true "Recompiled all custom geodata files successfully." $CSUC
    return 0
}

geodata_recompile() {
    update_loading_progress "Recompiling geodata files..." 0
    printlog true "Starting geodata recompilation process..." "$CSUC"

    local datadir="$ADDON_SHARE_DIR/data"

    if [ ! -d "$datadir" ]; then
        printlog true "Error: Data directory '$datadir' does not exist." "$CERR"
        return 1
    fi

    # Reconstruct the payload
    local datfile=$(reconstruct_payload)
    if [ $? -ne 0 ] || [ -z "$datfile" ]; then
        printlog true "Error: Failed to reconstruct payload." "$CERR"
        return 1
    fi

    # Extract 'tag' and 'content' from the payload using jq
    local filename=$(echo "$datfile" | jq -r '.tag')
    if [ $? -ne 0 ] || [ -z "$filename" ] || [ "$filename" == "null" ]; then
        printlog true "Error: Invalid or missing 'tag' in payload." "$CERR"
        return 1
    fi

    local filecontent=$(echo "$datfile" | jq -r '.content')
    if [ $? -ne 0 ] || [ -z "$filecontent" ] || [ "$filecontent" == "null" ]; then
        printlog true "Error: Invalid or missing 'content' in payload." "$CERR"
        return 1
    fi

    local filepath="$datadir/$filename"

    echo "$filecontent" >"$filepath"
    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to write content to '$filepath'." "$CERR"
        return 1
    fi

    printlog true "Successfully wrote content to '$filepath'." "$CSUC"

    geodata_recompile_all

    if [ $? -ne 0 ]; then
        printlog true "Error: Recompiling geodata files failed." "$CERR"
        return 1
    fi

    printlog true "Geodata recompilation process completed successfully." "$CSUC"

    return 0
}

geodata_delete_tag() {
    update_loading_progress "Deleting geodata tag..." 0
    printlog true "Starting geodata tag deletion process..." "$CSUC"

    local datadir="$ADDON_SHARE_DIR/data"
    local geodata_dir="$ADDON_SHARE_DIR/geodata"

    # Check if the data directory exists
    if [ ! -d "$datadir" ]; then
        printlog true "Error: Data directory '$datadir' does not exist." "$CERR"
        return 1
    fi

    # Reconstruct the payload
    local datfile=$(reconstruct_payload)
    if [ $? -ne 0 ] || [ -z "$datfile" ]; then
        printlog true "Error: Failed to reconstruct payload." "$CERR"
        return 1
    fi

    # Extract 'tag' from the payload using jq
    local filename=$(echo "$datfile" | jq -r '.tag')
    if [ $? -ne 0 ] || [ -z "$filename" ] || [ "$filename" == "null" ]; then
        printlog true "Error: Invalid or missing 'tag' in payload." "$CERR"
        return 1
    fi

    # Define the file and symlink paths
    local filepath="$datadir/$filename"
    local symlinkpath="$geodata_dir/$filename.asp"

    # Remove the file from the data directory
    if [ -f "$filepath" ]; then
        rm "$filepath"
        if [ $? -ne 0 ]; then
            printlog true "Error: Failed to delete file '$filepath'." "$CERR"
            return 1
        fi
        printlog true "Successfully deleted file '$filepath'." "$CSUC"
    else
        printlog true "Warning: File '$filepath' does not exist. Skipping deletion." "$CSUC"
    fi

    # Remove the symlink from the geodata directory
    if [ -L "$symlinkpath" ]; then
        rm "$symlinkpath"
        if [ $? -ne 0 ]; then
            printlog true "Error: Failed to delete symlink '$symlinkpath'." "$CERR"
            return 1
        fi
        printlog true "Successfully deleted symlink '$symlinkpath'." "$CSUC"
    else
        printlog true "Warning: Symlink '$symlinkpath' does not exist. Skipping deletion." "$CSUC"
    fi

    geodata_recompile_all

    if [ $? -ne 0 ]; then
        printlog true "Error: Recompiling geodata files failed." "$CERR"
        return 1
    fi

    # Log the successful deletion process
    printlog true "Geodata tag deletion process completed successfully." "$CSUC"

    return 0
}
