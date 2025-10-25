#!/bin/sh
# shellcheck shell=sh disable=SC2034   # tell shellcheck we really want POSIX sh

# Configuration
B4SNI_MAX_LINES=1000    # Maximum lines to keep in log
B4SNI_CHECK_INTERVAL=60 # Check log size every N seconds
B4SNI_ROTATE_COUNT=2    # Number of rotated logs to keep

b4sni_start() {
    log_info "Starting B4SNIffner..."

    local b4sni="$ADDON_SHARE_DIR/b4sni"
    local log_file="$ADDON_LOGS_DIR/b4sni.log"
    local pid_file="$ADDON_LOGS_DIR/b4sni.pid"

    # Clean up any existing processes
    b4sni_stop

    # Initialize or truncate log file if it's too large at start
    if [ -f "$log_file" ]; then
        local line_count=$(wc -l <"$log_file" 2>/dev/null || echo 0)
        if [ "$line_count" -gt "$B4SNI_MAX_LINES" ]; then
            tail -n "$B4SNI_MAX_LINES" "$log_file" >"$log_file.tmp"
            mv "$log_file.tmp" "$log_file"
        fi
    fi

    # Start the main b4sni process
    $IONICE $NICE "$b4sni" >>"$log_file" 2>&1 &
    local main_pid=$!
    echo "$main_pid" >"$pid_file"

    # Start the log manager in background
    b4sni_log_manager "$log_file" &
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
        local manager_pid=$(cat "$manager_pid_file" 2>/dev/null)
        if [ -n "$manager_pid" ]; then
            kill "$manager_pid" 2>/dev/null
        fi
        rm -f "$manager_pid_file"
    fi

    # Stop the main process
    if [ -f "$pid_file" ]; then
        local main_pid=$(cat "$pid_file" 2>/dev/null)
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
    local rotate_count="${B4SNI_ROTATE_COUNT:-2}"

    while true; do
        sleep "$check_interval"

        # Check if log file exists and main process is still running
        if [ ! -f "$log_file" ]; then
            continue
        fi

        local pid_file="$ADDON_LOGS_DIR/b4sni.pid"
        if [ -f "$pid_file" ]; then
            local main_pid=$(cat "$pid_file" 2>/dev/null)
            if [ -n "$main_pid" ]; then
                # Check if process is still running
                if ! kill -0 "$main_pid" 2>/dev/null; then
                    # Main process died, exit manager
                    break
                fi
            fi
        fi

        # Check current line count
        local line_count=$(wc -l <"$log_file" 2>/dev/null || echo 0)

        if [ "$line_count" -gt "$max_lines" ]; then
            # Log rotation needed
            b4sni_rotate_log "$log_file" "$max_lines" "$rotate_count"
        fi
    done
}

b4sni_rotate_log() {
    local log_file="$1"
    local max_lines="$2"
    local rotate_count="$3"

    # Keep last N lines in a temporary file
    local temp_file="${log_file}.rotating"
    tail -n "$max_lines" "$log_file" >"$temp_file"

    # Rotate old logs
    local i=$((rotate_count - 1))
    while [ "$i" -ge 1 ]; do
        if [ -f "${log_file}.$i" ]; then
            mv "${log_file}.$i" "${log_file}.$((i + 1))"
        fi
        i=$((i - 1))
    done

    # Move current log to .1
    if [ -f "$log_file" ]; then
        # Keep only the lines that will be rotated out
        local total_lines=$(wc -l <"$log_file" 2>/dev/null || echo 0)
        local lines_to_rotate=$((total_lines - max_lines))
        if [ "$lines_to_rotate" -gt 0 ]; then
            head -n "$lines_to_rotate" "$log_file" >"${log_file}.1"
        fi
    fi

    # Replace current log with truncated version
    mv "$temp_file" "$log_file"

    # Clean up old rotated logs beyond rotate_count
    local j=$((rotate_count + 1))
    while [ -f "${log_file}.$j" ]; do
        rm -f "${log_file}.$j"
        j=$((j + 1))
    done
}

# Status check function
b4sni_status() {
    local pid_file="$ADDON_LOGS_DIR/b4sni.pid"
    local log_file="$ADDON_LOGS_DIR/b4sni.log"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "B4SNIffner is running (PID: $pid)"
            if [ -f "$log_file" ]; then
                local lines=$(wc -l <"$log_file" 2>/dev/null || echo 0)
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

    local log_dir="$ADDON_LOGS_DIR"
    rm -f "$log_dir"/b4sni.log*

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
