webapp_start() {
    printlog true "Starting XRAY UI webapp..."

    local http_config="/opt/share/xrayui/webapp/server.conf"

    lighttpd -f "$http_config" || printlog true "Failed to start XRAY UI webapp." $CERR

    if [ $? -eq 0 ]; then
        printlog true "XRAY UI webapp started successfully." $CSUC
    fi
}

webapp_stop() {
    printlog true "Stopping XRAY UI webapp..."
    kill $(cat /var/run/xrayui_web.pid) || printlog true "Failed to stop XRAY UI webapp." $CERR

    if [ $? -eq 0 ]; then
        printlog true "XRAY UI webapp stopped successfully." $CSUC
    fi
}

webapp_restart() {
    webapp_stop
    webapp_start
}
