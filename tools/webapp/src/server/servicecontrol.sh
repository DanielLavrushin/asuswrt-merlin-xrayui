#!/bin/sh
source ./helper

http_headers

start() {
    logger -t "xrayui" "Starting the XRAY service..."
    /jffs/scripts/xrayui start
    sleep 2
}

stop() {
    logger -t "xrayui" "Stopping the XRAY service..."
    /jffs/scripts/xrayui stop
    killall xray || logger -t "xrayui" "Xray process not found."
    sleep 2
}

restart() {
    logger -t "xrayui" "Restarting the XRAY service..."
    /jffs/scripts/xrayui restart
    sleep 2
}

status() {
    get_xray_proc
    if [ -z "$xray_pid" ]; then
        http_success "Xray Service is stopped." false
        return
    fi

    http_success "Xray Service is running." true

}

get_xray_proc() {
    xray_pid=$(/bin/pidof xray 2>/dev/null)
}

# Determine the request method

METHOD=$(request_method)
if [ "$METHOD" = "POST" ]; then
    parse_post_request
    ACTION=$(post_value "action")
    # Check if ACTION is provided
    if [ -z "$ACTION" ]; then
        http_error "No action specified."
    fi
    # Validate ACTION
    case "$ACTION" in
    start)
        start 2>&1 | strip_ansi
        if [ $? -eq 0 ]; then
            http_success "Service started successfully."
        else
            http_error "Failed to start the service."
        fi
        ;;
    stop)
        stop 2>&1 | strip_ansi
        if [ $? -eq 0 ]; then
            http_success "Service stopped successfully."
        else
            http_error "Failed to stop the service."
        fi
        ;;
    restart)
        restart 2>&1 | strip_ansi
        if [ $? -eq 0 ]; then
            http_success "Service restarted successfully."
        else
            http_error "Failed to restart the service."
        fi
        ;;
    status)
        status
        ;;
    *)
        http_error "Invalid action specified. Allowed actions are start, stop, restart."
        ;;
    esac
else
    http_error "Only POST requests are supported."
fi
