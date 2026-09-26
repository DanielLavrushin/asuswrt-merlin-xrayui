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
    if ! curl -fL "$geositeurl" -o "$ADDON_TMP_DIR/geosite.dat" || [ ! -s "$ADDON_TMP_DIR/geosite.dat" ]; then
        rm -f "$ADDON_TMP_DIR/geosite.dat"
        log_error "Failed to download geosite.dat."
        return 1
    fi

    log_info "Downloading geoip.dat from $geoipurl..."
    update_loading_progress "Downloading geoip.dat..."
    if ! curl -fL "$geoipurl" -o "$ADDON_TMP_DIR/geoip.dat" || [ ! -s "$ADDON_TMP_DIR/geoip.dat" ]; then
        rm -f "$ADDON_TMP_DIR/geosite.dat" "$ADDON_TMP_DIR/geoip.dat"
        log_error "Failed to download geoip.dat."
        return 1
    fi

    if [ "$1" = "if_changed" ] &&
        cmp -s "$ADDON_TMP_DIR/geosite.dat" "$xray_dir/geosite.dat" &&
        cmp -s "$ADDON_TMP_DIR/geoip.dat" "$xray_dir/geoip.dat"; then
        rm -f "$ADDON_TMP_DIR/geosite.dat" "$ADDON_TMP_DIR/geoip.dat"
        log_ok "Community geodata files are already up to date."
        return 0
    fi

    mv -f "$ADDON_TMP_DIR/geosite.dat" "$xray_dir/geosite.dat"
    mv -f "$ADDON_TMP_DIR/geoip.dat" "$xray_dir/geoip.dat"

    if [ -f "$xray_dir/geosite.dat" ] && [ -f "$xray_dir/geoip.dat" ]; then
        log_ok "Files successfully placed in $xray_dir."
    else
        log_error "Failed to place geosite.dat/geoip.dat in $xray_dir."
        return 1
    fi

    geodata_recompile_all
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

    local tagfiles_json=$(
        for f in "$data_dir"/*; do
            [ -f "$f" ] && printf '%s\n' "${f##*/}"
        done | sed 's/\.[^.]*$//' | sort | jq -R -s -c 'split("\n")[:-1]'
    )

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

    for tagfile in "$datadir"/*; do
        if [ -f "$tagfile" ]; then
            tagbasename=$(basename "$tagfile")
            tagname="${tagbasename%.*}"

            symlink="$geodata_dir/$tagname.asp"

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
        GEODATA_RESTARTED="true"
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

    local datfile payload_file="/tmp/xrayui_geodata_payload.$$"
    datfile=$(reconstruct_payload)
    if [ -z "${datfile:+1}" ]; then
        log_error "Error: Failed to reconstruct payload."
        return 1
    fi
    cat >"$payload_file" <<EOF
$datfile
EOF

    local filename
    filename=$(jq -r '.tag // empty' "$payload_file" 2>/dev/null)
    case "$filename" in
    '' | */* | .*)
        log_error "Error: Invalid or missing 'tag' in payload."
        rm -f "$payload_file"
        return 1
        ;;
    esac

    local filepath="$datadir/$filename"

    if ! jq -r '.content // empty | until(endswith("\n") | not; .[:-1])' "$payload_file" >"$filepath.tmp" 2>/dev/null || ! grep -q . "$filepath.tmp"; then
        log_error "Error: Invalid or missing 'content' in payload."
        rm -f "$payload_file" "$filepath.tmp"
        return 1
    fi
    rm -f "$payload_file"

    if ! mv -f "$filepath.tmp" "$filepath"; then
        log_error "Error: Failed to write content to '$filepath'."
        rm -f "$filepath.tmp"
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

    if [ ! -d "$datadir" ]; then
        log_error "Error: Data directory '$datadir' does not exist."
        return 1
    fi

    local datfile
    datfile=$(reconstruct_payload)
    if [ -z "${datfile:+1}" ]; then
        log_error "Error: Failed to reconstruct payload."
        return 1
    fi

    local filename
    filename=$(jq -r '.tag // empty' 2>/dev/null <<EOF
$datfile
EOF
    )
    case "$filename" in
    '' | */* | .*)
        log_error "Error: Invalid or missing 'tag' in payload."
        return 1
        ;;
    esac

    local filepath="$datadir/$filename"
    local symlinkpath="$geodata_dir/$filename.asp"

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

    log_ok "Geodata tag deletion process completed successfully."

    return 0
}
