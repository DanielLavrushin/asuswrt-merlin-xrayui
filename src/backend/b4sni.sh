#!/bin/sh
# shellcheck shell=sh disable=SC2034

B4SNI_MAX_LINES=300     # Maximum lines to keep in log
B4SNI_CHECK_INTERVAL=60 # Check log size every N seconds

b4sni_start() {
    log_info "Starting B4SNIffner..."

    local b4sni="$ADDON_SHARE_DIR/b4sni"
    local log_file="$ADDON_LOGS_DIR/b4sni.log"
    local pid_file="$ADDON_LOGS_DIR/b4sni.pid"

    b4sni_stop

    # Initialize or truncate log file if it's too large at start
    if [ -f "$log_file" ]; then
        local line_count=$(awk 'END {print NR}' "$log_file" 2>/dev/null || echo 0)
        if [ "$line_count" -gt "$B4SNI_MAX_LINES" ]; then
            tail -n "$B4SNI_MAX_LINES" "$log_file" >"${log_file}.tmp"
            cat "${log_file}.tmp" >"$log_file"
            rm -f "${log_file}.tmp"
        fi
    fi

    # Clean up any old rotation files from previous versions
    rm -f "${log_file}".* 2>/dev/null

    # Start the main b4sni process
    nohup $IONICE $NICE "$b4sni" >>"$log_file" 2>&1 </dev/null &
    local main_pid=$!
    echo "$main_pid" >"$pid_file"

    # Start the log manager in background with proper fd cleanup
    (
        exec 0</dev/null
        exec 1>/dev/null
        exec 2>&1
        b4sni_log_manager "$log_file"
    ) &
    local manager_pid=$!
    echo "$manager_pid" >"${pid_file}.manager"

    log_info "B4SNIffner started (PID: $main_pid, Manager: $manager_pid)"
}

b4sni_stop() {
    log_info "Stopping B4SNIffner..."

    local pid_file="$ADDON_LOGS_DIR/b4sni.pid"
    local manager_pid_file="${pid_file}.manager"

    # Stop the log manager first
    if [ -f "$manager_pid_file" ]; then
        local manager_pid
        read manager_pid <"$manager_pid_file" 2>/dev/null
        if [ -n "$manager_pid" ]; then
            kill "$manager_pid" 2>/dev/null
        fi
        rm -f "$manager_pid_file"
    fi

    # Stop the main process
    if [ -f "$pid_file" ]; then
        local main_pid
        read main_pid <"$pid_file" 2>/dev/null
        if [ -n "$main_pid" ]; then
            kill "$main_pid" 2>/dev/null
        fi
        rm -f "$pid_file"
    fi

    # Fallback to killall if PIDs don't work
    killall "b4sni" 2>/dev/null
}

b4sni_log_manager() {
    local log_file="$1"
    local check_interval="${B4SNI_CHECK_INTERVAL:-60}"
    local max_lines="${B4SNI_MAX_LINES:-1000}"

    while true; do
        sleep "$check_interval"

        # Check if log file exists and main process is still running
        if [ ! -f "$log_file" ]; then
            continue
        fi

        local pid_file="$ADDON_LOGS_DIR/b4sni.pid"
        if [ -f "$pid_file" ]; then
            local main_pid
            read main_pid <"$pid_file" 2>/dev/null
            if [ -n "$main_pid" ]; then
                # Check if process is still running
                if ! kill -0 "$main_pid" 2>/dev/null; then
                    # Main process died, exit manager
                    break
                fi
            fi
        fi

        # Check current line count
        if [ -r "$log_file" ]; then
            local line_count
            line_count=$(awk 'END {print NR}' "$log_file" 2>/dev/null || echo 0)

            if [ "$line_count" -gt "$max_lines" ]; then
                # Truncate to last N lines in place
                b4sni_truncate_log "$log_file" "$max_lines"
            fi
        fi
    done
}

b4sni_truncate_log() {
    local log_file="$1"
    local max_lines="$2"

    # Keep last N lines - overwrite file in place to preserve file descriptor
    local temp_file="${log_file}.tmp.$$"

    tail -n "$max_lines" "$log_file" >"$temp_file" &&
        cat "$temp_file" >"$log_file" &&
        rm -f "$temp_file"
}

# Status check function
b4sni_status() {
    local pid_file="$ADDON_LOGS_DIR/b4sni.pid"
    local log_file="$ADDON_LOGS_DIR/b4sni.log"

    if [ -f "$pid_file" ]; then
        local pid
        read pid <"$pid_file" 2>/dev/null
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "B4SNIffner is running (PID: $pid)"
            if [ -f "$log_file" ]; then
                local lines=$(awk 'END {print NR}' "$log_file" 2>/dev/null || echo 0)
                local size=$(du -h "$log_file" 2>/dev/null | cut -f1)
                echo "Log: $lines lines, $size"
            fi
            return 0
        fi
    fi

    echo "B4SNIffner is not running"
    return 1
}

# Clean old logs function
b4sni_clean_logs() {
    log_info "Cleaning B4SNIffner logs..."

    rm -f "$ADDON_LOGS_DIR"/b4sni.log* "$ADDON_LOGS_DIR"/b4sni.pid*

    log_info "B4SNIffner logs cleaned"
}

b4sni_clear_logs() {
    local log_file="$ADDON_LOGS_DIR/b4sni.log"
    if [ -f "$log_file" ]; then
        : >"$log_file"
        log_info "B4SNIffner log cleared"
    else
        log_info "B4SNIffner log file does not exist"
    fi
}
