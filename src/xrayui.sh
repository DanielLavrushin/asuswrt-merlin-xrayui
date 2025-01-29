#!/bin/sh

export PATH=/opt/bin:/opt/sbin:/sbin:/bin:/usr/sbin:/usr/bin
source /usr/sbin/helper.sh
ARGS="run -config /opt/etc/xray/config.json"
DESC="Xray Core UI"
PIDFILE=/var/run/xray.pid

xray_addons_asp_page=/jffs/addons/xrayui/index.asp

xray_config="/opt/etc/xray/config.json"
dir_xrayui="/www/user/xrayui"
XRAY_UI_RESPONSE_FILE="$dir_xrayui/xray-ui-response.json"
XRAY_UI_CLIENTS_FILE="$dir_xrayui/clients-online.json"
XRAY="xray"
XRAYUI_VERSION="0.0"
XRAYUI_USER_SCRIPTS="/jffs/xrayui_custom"

XRAYUI_SHARED_DIR="/opt/share/xrayui"

XRAYUI_LOCKFILE="/tmp/xrayui.lock"
# Color Codes
CERR='\033[0;31m'
CSUC='\033[0;32m'
CWARN='\033[0;33m'
CINFO='\033[0;36m'
CRESET='\033[0m'

#error_handler() {}
#trap 'error_handler' EXIT

printlog() {
    if [ "$1" = "true" ]; then
        logger -t "XRAYUI" "$2"
    fi
    printf "${CINFO}${3}%s${CRESET}\\n" "$2"
}

start() {

    mode=$(am_settings_get xray_mode)
    if [ -z "$mode" ]; then
        printlog true "No mode found in custom settings. Defaulting to server mode."
        mode="server"
        am_settings_set xray_mode $mode
    fi

    update_loading_progress "Testing xray configuration $DESC..."

    test_xray_config

    printlog true "Xray operates in $mode mode"
    printlog true "Starting $DESC with $ARGS"

    update_loading_progress "Starting $DESC..."
    xray $ARGS >/dev/null 2>&1 &
    echo $! >$PIDFILE

    ARGS=" -c $xray_config"
    if [ "$mode" = "server" ]; then
        configure_firewall_server
    elif [ "$mode" = "client" ]; then
        configure_firewall_client
    else
        mode="server"
        am_settings_set xray_mode $mode
        configure_firewall_server
    fi
}

stop() {
    printlog true "Stopping $DESC" $CWARN

    update_loading_progress "Stopping $DESC"

    killall xray
    # Remove the PID file if it exists
    if [ -f "$PIDFILE" ]; then
        rm -f "$PIDFILE"
        printlog true "PID file $PIDFILE removed successfully."
    fi
    cleanup_firewall

}
restart() {
    printlog true "Restarting $DESC" $CWARN
    stop
    sleep 4
    start
}

update() {

    update_loading_progress "Updating $DESC..." 0
    local url="https://github.com/daniellavrushin/asuswrt-merlin-xrayui/releases/latest/download/asuswrt-merlin-xrayui.tar.gz"
    local temp_file="/tmp/asuswrt-merlin-xrayui.tar.gz"
    local addon_dir="/jffs/addons"
    local script_path="/jffs/scripts/xrayui"

    printlog true "Downloading the latest version..."
    update_loading_progress "Downloading the latest version..."
    if wget -O "$temp_file" "$url"; then
        printlog true "Download completed successfully."
    else
        printlog true "Failed to download the latest version. Exiting."
        return 1
    fi

    printlog true "Cleaning up existing installation..."
    if rm -rf "$addon_dir/xrayui"; then
        printlog true "Old installation removed."
    else
        printlog true "Failed to remove the old installation. Exiting."
        return 1
    fi

    printlog true "Extracting the package..."
    update_loading_progress "Extracting the package..."
    if tar -xzf "$temp_file" -C "$addon_dir"; then
        printlog true "Extraction completed."
    else
        printlog true "Failed to extract the package. Exiting."
        return 1
    fi

    printlog true "Setting up the script..."
    update_loading_progress "Setting up the script..."
    if mv "$addon_dir/xrayui/xrayui" "$script_path" && chmod 0777 "$script_path"; then
        printlog true "Script set up successfully." $CSUC
    else
        printlog true "Failed to set up the script. Exiting." $CERR
        return 1
    fi

    printlog true "Running the installation..."
    update_loading_progress "Running the installation..."
    if sh "$script_path" install; then
        printlog true "Installation completed successfully." $CSUC
    else
        printlog true "Installation failed. Exiting." $CERR
        return 1
    fi

    if [ -f "$PIDFILE" ]; then
        restart
    fi

    printlog true "Update process completed!" $CSUC
    update_loading_progress "Update process completed!" 100
}

detect_entware_path() {
    # Common parent directories to check
    search_dirs="/tmp/mnt /opt"

    # Look for a known binary or file
    for dir in $search_dirs; do
        entware_path=$(find "$dir" -type f -name "entware_release" -exec dirname {} \; 2>/dev/null | head -n 1)
        if [ -n "$entware_path" ]; then
            echo "$entware_path"
            return 0
        fi
    done

    echo "Error: Entware path not found." >&2
    return 1
}

get_xray_proc() {
    xray_pid=$(/bin/pidof xray 2>/dev/null)
}

configure_firewall_server() {
    mode=$(am_settings_get xray_mode)
    if [ "$mode" = "server" ]; then

        # Check if 'xray' process is running
        get_xray_proc
        if [ -z "$xray_pid" ]; then
            printlog true "Xray process not found. Skipping client firewall configuration." $CWARN
            return
        fi

        # Create a custom chain for Xray rules
        iptables -N XRAYUI 2>/dev/null

        inbounds_ports=$(jq -r '.inbounds[]?.port // empty' "$xray_config")
        if [ -z "$inbounds_ports" ]; then
            printlog true "No valid ports found in Xray configuration. Cannot configure firewall rules." $CERR
            return 1
        fi

        for XRAY_PORT in $inbounds_ports; do
            # Determine PORT_START and PORT_END
            if echo "$XRAY_PORT" | grep -q '-'; then
                PORT_START=$(echo "$XRAY_PORT" | cut -d'-' -f1)
                PORT_END=$(echo "$XRAY_PORT" | cut -d'-' -f2)
            else
                PORT_START="$XRAY_PORT"
                PORT_END="$XRAY_PORT"
            fi

            # Validate PORT_START and PORT_END
            if ! echo "$PORT_START" | grep -qE '^[0-9]+$' || ! echo "$PORT_END" | grep -qE '^[0-9]+$'; then
                printlog true "Invalid port or range: $XRAY_PORT. Skipping." $CWARN
                continue
            fi

            # Define PORT_RANGE
            PORT_RANGE="$PORT_START"
            if [ "$PORT_START" != "$PORT_END" ]; then
                PORT_RANGE="$PORT_START:$PORT_END"
            fi

            # Add rules to the XRAYUI chain
            iptables -A XRAYUI -p tcp --dport "$PORT_RANGE" -j ACCEPT
            iptables -A XRAYUI -p udp --dport "$PORT_RANGE" -j ACCEPT

            printlog true "Firewall rules applied for port(s) $PORT_RANGE." $CSUC
        done

        # Hook the custom chain into INPUT and FORWARD chains
        iptables -I INPUT -j XRAYUI
        iptables -I FORWARD -j XRAYUI

        local script="$XRAYUI_USER_SCRIPTS/firewall_server"
        if [ -x "$script" ]; then
            printlog true "Executing user firewall script: $script"
            "$script" || printlog true "Error executing $script." $CERR
        fi

        printlog true "All Xray firewall rules applied successfully." $CSUC
    else
        printlog true "Xray Server firewall rules not applied, mode is not server." $CWARN
    fi
}

configure_firewall_client() {
    printlog true "Configuring Xray firewall rules..."
    update_loading_progress "Configuring Xray firewall rules..."

    # Check if 'xray' process is running
    get_xray_proc
    if [ -z "$xray_pid" ]; then
        printlog true "Xray process not found. Skipping client firewall configuration." $CWARN
        return
    fi

    mode=$(am_settings_get xray_mode)
    if [ "$mode" != "client" ]; then
        printlog true "XRAYUI Client firewall rules not applied; mode is not client." $CWARN
        return
    fi

    XRAY_PORT="$(jq -r '.inbounds[0].port // empty' "$xray_config")"
    TPROXY_MODE="$(jq -r '.inbounds[0].streamSettings.sockopt.tproxy // "off"' "$xray_config")"
    SERVER_IPS=$(jq -r '[.outbounds[] | select(.settings.vnext != null) | .settings.vnext[].address] | unique | join(" ")' "$xray_config")

    printlog true "Configuring Xray on port $XRAY_PORT ..."
    if [ -z "$XRAY_PORT" ]; then
        printlog true "Invalid or missing port in Xray configuration. Cannot configure firewall rules." $CERR
        return 1
    fi

    if [ "$TPROXY_MODE" = "tproxy" ]; then
        configure_firewall_client_tproxy
    else
        configure_firewall_client_direct
    fi

    printlog true "XRAYUI firewall rules applied successfully." $CSUC
}

configure_firewall_client_direct() {

    update_loading_progress "Configuring firewall DIRECT rules..."

    # Set up NAT-only rules for REDIRECT mode.
    iptables -t nat -F XRAYUI 2>/dev/null
    iptables -t nat -X XRAYUI 2>/dev/null
    iptables -t nat -N XRAYUI || printlog true "Failed to create NAT chain." $CERR

    # --- Begin Exclusion Rules (NAT) ---

    # Ports policy: bypass or redirect
    XRAY_PP_MODE="$(jq -r '.routing.portsPolicy.mode // empty' "$xray_config")"
    XRAY_PP_TCP="$(jq -r '.routing.portsPolicy.tcp // empty' "$xray_config")"
    XRAY_PP_UDP="$(jq -r '.routing.portsPolicy.udp // empty' "$xray_config")"

    # Exclude local (RFC1918) subnets dynamically:
    local local_networks=$(
        ip -4 route show |
            awk '/src/ && ($1 ~ /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168\.)/) { print $1 }'
    )
    for net in $local_networks; do
        iptables -t nat -A XRAYUI -d "$net" -j RETURN || printlog true "Failed to add local subnet $net rule in NAT." $CERR
    done

    # Always exclude loopback:
    iptables -t nat -A XRAYUI -d 127.0.0.1/32 -j RETURN || printlog true "Failed to add loopback rule in NAT." $CERR

    # Exclude DHCP (UDP ports 67 and 68):
    iptables -t nat -A XRAYUI -p udp --dport 67 -j RETURN || printlog true "Failed to add DHCP rule for UDP 67 in NAT." $CERR
    iptables -t nat -A XRAYUI -p udp --dport 68 -j RETURN || printlog true "Failed to add DHCP rule for UDP 68 in NAT." $CERR

    # Exclude multicast addresses:
    iptables -t nat -A XRAYUI -d 224.0.0.0/4 -j RETURN || printlog true "Failed to add multicast rule (224.0.0.0/4) in NAT." $CERR
    iptables -t nat -A XRAYUI -d 239.0.0.0/8 -j RETURN || printlog true "Failed to add multicast rule (239.0.0.0/8) in NAT." $CERR

    # Exclude STUN (WebRTC)
    iptables -t nat -A XRAYUI -p udp -m u32 --u32 "32=0x2112A442" -j RETURN || printlog true "Failed to add STUN in NAT." $CERR

    # Exclude the WireGuard subnet 10.122.0.0/24
    if [ "$(nvram get wgs_enable)" == "1" ]; then
        printlog true "WireGuard enabled. Adding exclusion rules for WireGuard."
        WGS_ADDR=$(nvram get "wgs_addr")
        WGS_IP="$(echo "$WGS_ADDR" | cut -d'/' -f1)"
        OCT1="$(echo "$WGS_IP" | cut -d'.' -f1)"
        OCT2="$(echo "$WGS_IP" | cut -d'.' -f2)"
        OCT3="$(echo "$WGS_IP" | cut -d'.' -f3)"

        WGS_SUBNET="$OCT1.$OCT2.$OCT3.0/24"
        WGS_PORT=$(nvram get "wgs_port")

        iptables -t nat -A XRAYUI -p udp --dport "$WGS_PORT" -j RETURN || printlog true "Failed to add WireGuard port rule in NAT." $CERR
        iptables -t nat -A XRAYUI -d "$WGS_SUBNET" -j RETURN || printlog true "Failed to add WireGuard subnet rule in NAT." $CERR
    else
        printlog true "WireGuard not enabled. Skipping WireGuard exclusion rules."
    fi

    # Exclude traffic destined to the Xray server:
    for serverip in $SERVER_IPS; do
        printlog true "Excluding Xray server IP from NAT."
        iptables -t nat -A XRAYUI -d "$serverip" -j RETURN || printlog true "Failed to add rule to exclude Xray server IP in NAT." $CERR
    done
    # --- End Exclusion Rules ---

    # Execute custom rules for TPROXY (if any)
    local script="$XRAYUI_USER_SCRIPTS/firewall_client"
    if [ -x "$script" ]; then
        printlog true "Executing custom TPROXY firewall script: $script"
        "$script" || printlog true "Error executing $script." $CERR
    fi

    if [ "$XRAY_PP_MODE" = "bypass" ]; then
        printlog true "Ports policy mode is 'bypass': All ports bypass Xray by default. Redirecting only specified ports: TCP($XRAY_PP_TCP), UDP($XRAY_PP_UDP)" $CWARN
        if [ -n "$XRAY_PP_TCP" ]; then
            iptables -t nat -A XRAYUI -p tcp -m multiport --dports "$XRAY_PP_TCP" -j REDIRECT --to-port "$XRAY_PORT" || printlog true "No TCP ports specified for bypass mode redirect." $CERR
        fi
        if [ -n "$XRAY_PP_UDP" ]; then
            iptables -t nat -A XRAYUI -p udp -m multiport --dports "$XRAY_PP_UDP" -j REDIRECT --to-port "$XRAY_PORT" || printlog true "No UDP ports specified for bypass mode redirect." $CERR
        fi
        iptables -t nat -A XRAYUI -j RETURN || printlog true "Failed to add default bypass rule in NAT." $CERR
    else
        printlog true "Ports policy mode is 'redirect': All ports are redirected to Xray by default, except excluded ports: TCP($XRAY_PP_TCP), UDP($XRAY_PP_UDP)" $CWARN
        if [ -n "$XRAY_PP_TCP" ]; then
            iptables -t nat -A XRAYUI -p tcp -m multiport --dports "$XRAY_PP_TCP" -j RETURN || printlog true "No TCP ports specified for exclusion in redirect mode." $CERR
        fi
        if [ -n "$XRAY_PP_UDP" ]; then
            iptables -t nat -A XRAYUI -p udp -m multiport --dports "$XRAY_PP_UDP" -j RETURN || printlog true "No UDP ports specified for exclusion in redirect mode." $CERR
        fi
        iptables -t nat -A XRAYUI -p tcp -j REDIRECT --to-port "$XRAY_PORT" || printlog true "Failed to add default TCP REDIRECT." $CERR
        iptables -t nat -A XRAYUI -p udp -j REDIRECT --to-port "$XRAY_PORT" || printlog true "Failed to add default UDP REDIRECT." $CERR
    fi

    # Hook chain into NAT PREROUTING:
    iptables -t nat -A PREROUTING -j XRAYUI || printlog true "Failed to hook NAT chain." $CERR

    printlog true "Direct (REDIRECT) rules applied." $CSUC
}

configure_firewall_client_tproxy() {

    update_loading_progress "Configuring firewall TPROXY rules..."

    # Ensure TPROXY module is loaded
    if ! lsmod | grep -q "xt_TPROXY"; then
        printlog true "xt_TPROXY kernel module not loaded. Attempting to load..."
        modprobe xt_TPROXY || {
            printlog true "Failed to load xt_TPROXY kernel module. TPROXY might not work." $CERR
            return 1
        }
        sleep 1 # Allow some time for the module to load
    fi

    # Verify if the module is successfully loaded
    if ! lsmod | grep -q "xt_TPROXY"; then
        printlog true "xt_TPROXY kernel module is still not loaded after attempt. Aborting." $CERR
        return 1
    else
        printlog true "xt_TPROXY kernel module successfully loaded."
    fi

    # Set up MANGLE chain:
    iptables -t mangle -F XRAYUI 2>/dev/null
    iptables -t mangle -X XRAYUI 2>/dev/null
    iptables -t mangle -N XRAYUI || printlog true "Failed to create mangle chain." $CERR

    # --- Begin Exclusion Rules (both NAT and MANGLE) ---
    # Exclude local (RFC1918) subnets dynamically:
    local local_networks=$(
        ip -4 route show |
            awk '/src/ && ($1 ~ /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168\.)/) { print $1 }'
    )
    for net in $local_networks; do
        iptables -t mangle -A XRAYUI -d "$net" -j RETURN || printlog true "Failed to add local subnet $net rule in MANGLE." $CERR
    done

    # Always exclude loopback:
    iptables -t mangle -A XRAYUI -d 127.0.0.1/32 -j RETURN || printlog true "Failed to add loopback rule in MANGLE." $CERR

    # Exclude DHCP (UDP ports 67 and 68):
    iptables -t mangle -A XRAYUI -p udp --dport 67 -j RETURN || printlog true "Failed to add DHCP rule for UDP 67 in MANGLE." $CERR
    iptables -t mangle -A XRAYUI -p udp --dport 68 -j RETURN || printlog true "Failed to add DHCP rule for UDP 68 in MANGLE." $CERR

    # Exclude multicast addresses:
    iptables -t mangle -A XRAYUI -d 224.0.0.0/4 -j RETURN || printlog true "Failed to add multicast rule (224.0.0.0/4) in MANGLE." $CERR
    iptables -t mangle -A XRAYUI -d 239.0.0.0/8 -j RETURN || printlog true "Failed to add multicast rule (239.0.0.0/8) in MANGLE." $CERR

    # Exclude STUN (WebRTC)
    iptables -t mangle -A XRAYUI -p udp -m u32 --u32 "32=0x2112A442" -j RETURN || printlog true "Failed to add STUN in mangle." $CERR

    # Exclude traffic in DNAT state (covers inbound port-forwards):
    iptables -t mangle -A XRAYUI -m conntrack --ctstate DNAT -j RETURN

    # Exclude the WireGuard subnet 10.122.0.0/24
    if [ "$(nvram get wgs_enable)" == "1" ]; then
        printlog true "WireGuard enabled. Adding exclusion rules for WireGuard."
        WGS_ADDR=$(nvram get "wgs_addr")
        WGS_IP="$(echo "$WGS_ADDR" | cut -d'/' -f1)"
        OCT1="$(echo "$WGS_IP" | cut -d'.' -f1)"
        OCT2="$(echo "$WGS_IP" | cut -d'.' -f2)"
        OCT3="$(echo "$WGS_IP" | cut -d'.' -f3)"

        WGS_SUBNET="$OCT1.$OCT2.$OCT3.0/24"
        WGS_PORT=$(nvram get "wgs_port")

        iptables -t mangle -A XRAYUI -p udp --dport "$WGS_PORT" -j RETURN || printlog true "Failed to add WireGuard port rule in MANGLE." $CERR
        iptables -t mangle -A XRAYUI -d "$WGS_SUBNET" -j RETURN || printlog true "Failed to add WireGuard subnet rule in MANGLE." $CERR
    else
        printlog true "WireGuard not enabled. Skipping WireGuard exclusion rules."
    fi

    # Exclude traffic destined to the Xray server:
    for serverip in $SERVER_IPS; do
        printlog true "Excluding Xray server rom NAT and MANGLE."
        iptables -t mangle -A XRAYUI -d "$serverip" -j RETURN || printlog true "Failed to add rule to exclude Xray server in MANGLE." $CERR
    done
    # --- End Exclusion Rules ---

    # Execute custom rules for TPROXY (if any)
    local script="$XRAYUI_USER_SCRIPTS/firewall_client"
    if [ -x "$script" ]; then
        printlog true "Executing custom TPROXY firewall script: $script"
        "$script" || printlog true "Error executing $script." $CERR
    fi

    # Add TPROXY rules in mangle:
    iptables -t mangle -A XRAYUI -p tcp -j TPROXY --on-port "$XRAY_PORT" --tproxy-mark 0x8777 || printlog true "Failed to add TPROXY rule for TCP." $CERR
    iptables -t mangle -A XRAYUI -p udp -j TPROXY --on-port "$XRAY_PORT" --tproxy-mark 0x8777 || printlog true "Failed to add TPROXY rule for UDP." $CERR

    # Add routing rules for marked packets:
    ip rule list | grep -q "fwmark 0x8777" || ip rule add fwmark 0x8777 table 8777 priority 100 || printlog true "Failed to add fwmark rule." $CERR
    ip route add local 0.0.0.0/0 dev lo table 8777 || printlog true "Failed to add local route for fwmark." $CERR

    # Hook the mangle chain into PREROUTING:
    iptables -t mangle -A PREROUTING -j XRAYUI || printlog true "Failed to hook mangle chain." $CERR

    printlog true "TPROXY rules applied." $CSUC
}

cleanup_firewall() {

    printlog true "Cleaning up Xray Client firewall rules..."
    update_loading_progress "Cleaning up Xray Client firewall rules..."

    iptables -t nat -F XRAYUI 2>/dev/null || printlog true "Failed to flush NAT chain. Was it already empty?" $CWARN
    iptables -t nat -X XRAYUI 2>/dev/null || printlog true "Failed to remove NAT chain. Was it already empty?" $CWARN
    iptables -t mangle -F XRAYUI 2>/dev/null || printlog true "Failed to flush mangle chain. Was it already empty?" $CWARN
    iptables -t mangle -X XRAYUI 2>/dev/null || printlog true "Failed to remove mangle chain. Was it already empty?" $CWARN

    ip rule del fwmark 0x8777 table 8777 priority 100 2>/dev/null || printlog true "Failed to delete fwmark rule. Was it already empty?" $CWARN
    ip route flush table 8777 2>/dev/null || printlog true "Failed to flush table 8777. Was it already empty?" $CWARN

    local script="$XRAYUI_USER_SCRIPTS/firewall_cleanup"
    if [ -x "$script" ]; then
        printlog true "Executing user firewall script: $script"
        "$script" "$xray_config" || printlog true "Error executing $script." $CERR
    fi

    printlog true "Restarting firewall and DNS services..."
    update_loading_progress "Restarting firewall and DNS services..."

    service restart_firewall >/dev/null 2>&1 && printlog true "Firewall service restarted successfully." $CSUC
    service restart_dnsmasq >/dev/null 2>&1 && printlog true "DNS service restarted successfully." $CSUC

    printlog true "Xray Client firewall rules cleaned up successfully." $CSUC
}

get_webui_page() {
    xrayui_user_page="none"
    max_user_page=0
    used_pages=""

    for page in /www/user/user*.asp; do
        if [ -f "$page" ]; then
            if grep -q "page:xrayui" "$page"; then
                xrayui_user_page=$(basename "$page")
                printlog true "Found existing XRAYUI page: $xrayui_user_page" $CSUC
                return
            fi

            user_number=$(echo "$page" | sed -E 's/.*user([0-9]+)\.asp$/\1/')
            used_pages="$used_pages $user_number"

            if [ "$user_number" -gt "$max_user_page" ]; then
                max_user_page="$user_number"
            fi
        fi
    done

    if [ "$xrayui_user_page" != "none" ]; then
        printlog true "Found existing XRAYUI page: $xrayui_user_page" $CSUC
        return
    fi

    if [ "$1" = "true" ]; then
        i=1
        while true; do
            if ! echo "$used_pages" | grep -qw "$i"; then
                xrayui_user_page="user$i.asp"
                printlog true "Assigning new XRAYUI page: $xrayui_user_page" $CSUC
                return
            fi
            i=$((i + 1))
        done
    fi
}

mount_ui() {

    LOCKFILE=/tmp/addonwebui.lock
    FD=386
    eval exec "$FD>$LOCKFILE"
    flock -x "$FD"

    nvram get rc_support | grep -q am_addons
    if [ $? != 0 ]; then
        printlog true "This firmware does not support addons!" $CERR
        exit 5
    fi

    get_webui_page true

    if [ "$xrayui_user_page" = "none" ]; then
        printlog true "Unable to install XRAYUI" $CERR
        exit 5
    fi

    printlog true "Mounting XRAYUI as $xrayui_user_page"

    ln -s -f $xray_addons_asp_page /www/user/$xrayui_user_page
    echo "xrayui" >"/www/user/$(echo $xrayui_user_page | cut -f1 -d'.').title"

    if [ ! -f /tmp/menuTree.js ]; then
        cp /www/require/modules/menuTree.js /tmp/
        mount -o bind /tmp/menuTree.js /www/require/modules/menuTree.js
    fi

    sed -i '/menuName: "VPN"/,/menuName:/ {
  /url:\s*"NULL",\s*tabName:\s*"__INHERIT__"/ i \
    { url: "'"$xrayui_user_page"'", tabName: "X-RAY" },
}' /tmp/menuTree.js

    umount /www/require/modules/menuTree.js && mount -o bind /tmp/menuTree.js /www/require/modules/menuTree.js

    am_settings_del xray_page
    am_settings_set xray_page $xrayui_user_page

    if [ ! -d $dir_xrayui ]; then
        mkdir -p "$dir_xrayui"
    fi

    if [ ! -d "$XRAYUI_SHARED_DIR/data" ]; then
        mkdir -p "$XRAYUI_SHARED_DIR/data"
    fi

    ln -s -f /jffs/addons/xrayui/app.js $dir_xrayui/app.js
    ln -s -f /opt/etc/xray/config.json $dir_xrayui/xray-config.json

    geodata_remount_to_web

    flock -u "$FD"
    printlog true "XRAYUI mounted successfully as $xrayui_user_page" $CSUC
}

unmount_ui() {
    LOCKFILE=/tmp/addonwebui.lock
    FD=386
    eval exec "$FD>$LOCKFILE"
    flock -x "$FD"

    nvram get rc_support | grep -q am_addons
    if [ $? != 0 ]; then
        printlog true "This firmware does not support addons!" $CERR
        exit 5
    fi

    get_webui_page

    base_user_page="${xrayui_user_page%.asp}"

    if [ -z "$xrayui_user_page" ] || [ "$xrayui_user_page" = "none" ]; then
        printlog true "No XRAYUI page found to unmount. Continuing to clean up..." $CWARN
    else
        printlog true "Unmounting XRAYUI $xrayui_user_page"
        rm -fr /www/user/$xrayui_user_page
        rm -fr /www/user/$base_user_page.title
    fi

    if [ ! -f /tmp/menuTree.js ]; then
        printlog true "menuTree.js not found, skipping unmount." $CWARN
    else
        printlog true "Removing any X-RAY menu entry from menuTree.js."
        # Safely remove entries with tabName: "X-RAY"
        grep -v "tabName: \"X-RAY\"" /tmp/menuTree.js >/tmp/menuTree_temp.js
        mv /tmp/menuTree_temp.js /tmp/menuTree.js

        umount /www/require/modules/menuTree.js
        mount -o bind /tmp/menuTree.js /www/require/modules/menuTree.js
    fi

    rm -rf $dir_xrayui
    am_settings_del xray_page

    flock -u "$FD"

    printlog true "Unmount completed." $CSUC
}

remount_ui() {
    if [ "$1" != "skipwait" ]; then
        printlog true "sleeping for 10 seconds..." $CWARN
        # sleep 10
    fi

    unmount_ui
    mount_ui
}

make_clean_config() {
    local tempconfig="/tmp/xray-config-clean.json"
    sed 's/\/\/.*//' "$xray_config" >$tempconfig
    echo $tempconfig
}

am_settings_del() {
    local key="$1"
    sed -i "/$key/d" /jffs/addons/custom_settings.txt
}

# function to get connected clients in the server mode
get_connected_clients() {
    temp_file="/tmp/xray_clients_online.json"
    >"$temp_file"

    ports_list=""
    inbounds_ports=$(jq -r '.inbounds[]?.port // empty' "$xray_config")
    for XRAY_PORT in $inbounds_ports; do
        if echo "$XRAY_PORT" | grep -q '-'; then
            PORT_START=$(echo "$XRAY_PORT" | cut -d'-' -f1)
            PORT_END=$(echo "$XRAY_PORT" | cut -d'-' -f2)
            for port in $(seq "$PORT_START" "$PORT_END"); do
                ports_list="$ports_list $port"
            done
        else
            ports_list="$ports_list $XRAY_PORT"
        fi
    done

    pattern=$(echo "$ports_list" | tr ' ' '\n' | grep -E '^[0-9]+$' | sort -n -u | awk '{printf "%s|", $0}' | sed 's/|$//')

    ips=$(netstat -an | grep "$pattern" | awk '$6=="ESTABLISHED" { split($5,a,":"); if (length(a) >= 4) print a[4]; else print a[1] }' | sort -u)

    access_log=$(jq -r '.log.access' "$xray_config")

    for ip in $ips; do
        if [ -n "$ip" ]; then
            emails=$(grep "$ip" "$access_log" | awk -F'email: ' '{print $2}' | sort | uniq | sed 's/^/"/; s/$/"/' | tr '\n' ',' | sed 's/,$//')
            if [ -n "$emails" ]; then
                echo "{\"ip\": \"$ip\", \"email\": [$emails]}," >>"$temp_file"
                # else
                #  echo "{\"ip\": \"$ip\", \"email\": []}," >>"$temp_file"
            fi
        fi
    done

    if [ -s "$temp_file" ]; then
        json_array="[$(sed '$ s/,$//' "$temp_file")]"
    else
        json_array="[]"
    fi

    echo "$json_array" >$XRAY_UI_CLIENTS_FILE
    rm -f "$temp_file"
    echo "$json_array"
}

regenerate_ssl_certificates() {
    local cert_dir="/opt/etc/xray/cert"
    local cert_file="$cert_dir/xray-cert.crt"
    local key_file="$cert_dir/xray-key.pem"
    local tempconfig=$(make_clean_config)

    if [ ! -d "$cert_dir" ]; then
        printlog true "Directory $cert_dir does not exist. Creating it."
        mkdir -p "$cert_dir"
        if [ $? -ne 0 ]; then
            printlog true "Failed to create directory $cert_dir."
            return 1
        fi
    fi

    printlog true "Generating self-signed certificate for Xray in $cert_dir..."

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$key_file" \
        -out "$cert_file" \
        -subj "/CN=xray/O=Local Xray/C=US"

    if [ $? -eq 0 ]; then
        printlog true "Certificate and key successfully generated:"
        printlog true "Certificate: $cert_file"
        printlog true "Private Key: $key_file"
    else
        printlog true "Failed to generate certificate."
        return 1
    fi

    ensure_ui_response_file
    local json_content
    if [ -f "$XRAY_UI_RESPONSE_FILE" ]; then
        json_content=$(cat "$XRAY_UI_RESPONSE_FILE")
    else
        json_content="{}"
    fi

    json_content=$(echo "$json_content" | jq --arg cert "$cert_file" --arg key "$key_file" \
        '.certificates.certificateFile = $cert | .certificates.keyFile = $key')
    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to update JSON content." $CERR
        return 1
    fi

    echo "$json_content" >"$XRAY_UI_RESPONSE_FILE"

    if [ $? -eq 0 ]; then
        printlog true "Saved TLS certificates to $XRAY_UI_RESPONSE_FILE successfully." $CSUC
    else
        printlog true "Failed to save TLS certificates to $XRAY_UI_RESPONSE_FILE." $CERR
        return 1
    fi
}

regenerate_reality_keys() {
    printlog true "Regenerating Reality private and public keys..."

    xray_output=$($XRAY x25519)
    if [ $? -ne 0 ]; then
        printlog true "Failed to run xray x25519." $CERR
        return 1
    fi

    private_key=$(echo "$xray_output" | grep 'Private key:' | awk -F'Private key: ' '{print $2}')
    public_key=$(echo "$xray_output" | grep 'Public key:' | awk -F'Public key: ' '{print $2}')

    if [ -z "$private_key" ] || [ -z "$public_key" ]; then
        printlog true "Failed to extract Reality keys from xray x25519 output." $CERR
        return 1
    fi

    ensure_ui_response_file
    local json_content
    if [ -f "$XRAY_UI_RESPONSE_FILE" ]; then
        json_content=$(cat "$XRAY_UI_RESPONSE_FILE")
    else
        json_content="{}"
    fi

    json_content=$(echo "$json_content" | jq --arg pk "$private_key" --arg pub "$public_key" \
        '.reality.privateKey = $pk | .reality.publicKey = $pub')

    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to update JSON content." $CERR
        return 1
    fi

    echo "$json_content" >"$XRAY_UI_RESPONSE_FILE"
    if [ $? -eq 0 ]; then
        printlog true "Saved TLS certificates to $XRAY_UI_RESPONSE_FILE successfully." $CSUC
    else
        printlog true "Failed to save TLS certificates to $XRAY_UI_RESPONSE_FILE." $CERR
        return 1
    fi
}

regenerate_wireguard_keys() {
    printlog true "Regenerating WireGuard private and public keys..."
    local private_key=$(reconstruct_payload)
    local public_key

    if [ -z "$private_key" ]; then
        private_key=$(wg genkey)
        if [ $? -ne 0 ]; then
            printlog true "Error: Failed to generate private key." $CERR
            return 1
        fi
    fi

    public_key=$(echo "$private_key" | wg pubkey)
    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to generate public key from private key." $CERR
        return 1
    fi

    ensure_ui_response_file
    local json_content
    if [ -f "$XRAY_UI_RESPONSE_FILE" ]; then
        json_content=$(cat "$XRAY_UI_RESPONSE_FILE")
    else
        json_content="{}"
    fi

    json_content=$(echo "$json_content" | jq --arg pk "$private_key" --arg pub "$public_key" \
        '.wireguard.privateKey = $pk | .wireguard.publicKey = $pub')

    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to update JSON content." $CERR
        return 1
    fi

    echo "$json_content" >"$XRAY_UI_RESPONSE_FILE"

    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to write to JSON file." $CERR
        return 1
    fi

    if [ $? -eq 0 ]; then
        printlog true "Saved WireGuard keys to $XRAY_UI_RESPONSE_FILE successfully." $CSUC
    else
        printlog true "Failed to save WireGuard keys to $XRAY_UI_RESPONSE_FILE." $CERR
        return 1
    fi

    return 0
}

switch_mode() {
    mode=$(reconstruct_payload)

    mode_type=$(echo "$mode" | jq -r '.mode')
    printlog true "Switching Xray mode to $mode_type"

    am_settings_set xray_mode $mode_type
}

apply_config() {
    update_loading_progress "Applying new server configuration..." 0
    local temp_config="/tmp/xray_server_config_new.json"
    local backup_config="/opt/etc/xray/config.json-temp.bak"

    local incoming_config=$(reconstruct_payload)

    update_loading_progress "Checking incoming configuration..." 5

    if [ -z "$incoming_config" ]; then
        printlog true "No new server configuration provided."
        exit 1
    fi

    echo "$incoming_config" >"$temp_config"
    if [ $? -ne 0 ]; then
        printlog true "Failed to write incoming configuration to $temp_config." $CERR
        exit 1
    fi

    jq empty "$temp_config" >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        printlog true "Invalid JSON format in incoming server configuration." $CERR
        rm -f "$temp_config"
        exit 1
    fi

    cp "$xray_config" "$backup_config"
    if [ $? -ne 0 ]; then
        printlog true "Failed to backup existing configuration to $backup_config." $CERR
        rm -f "$temp_config"
        exit 1
    fi
    printlog true "Existing configuration backed up to $backup_config."

    cp "$temp_config" "$xray_config"
    if [ $? -ne 0 ]; then
        printlog true "Failed to apply new configuration to $xray_config." $CERR
        cp "$backup_config" "$xray_config"
        if [ $? -ne 0 ]; then
            printlog true "Critical: Failed to restore configuration from backup." $CERR
        fi
        rm -f "$temp_config"
        exit 1
    fi
    printlog true "New server configuration applied successfully." $CSUC

    rm -f "$temp_config"

    if [ -f "$PIDFILE" ]; then
        update_loading_progress "Restarting Xray service..." 35
        restart
        update_loading_progress "Xray service restarted successfully."
    fi

    if [ $? -ne 0 ]; then
        printlog true "Failed to restart Xray service after applying new configuration." $CERR
        cp "$backup_config" "$xray_config"
        restart
        exit 1
    fi

    printlog true "Xray service restarted successfully with the new configuration." $CSUC

    rm -f "$backup_config"

    update_loading_progress "Configuration applied successfully." 100

    exit 0
}

reconstruct_payload() {
    FD=386
    eval exec "$FD>$XRAYUI_LOCKFILE"

    if ! flock -x "$FD"; then
        return 1
    fi

    local idx=0
    local chunk
    local payload=""
    while :; do
        chunk=$(am_settings_get xray_payload$idx)
        if [ -z "$chunk" ]; then
            break
        fi
        payload="$payload$chunk"
        idx=$((idx + 1))
    done

    cleanup_payloads

    echo "$payload"

    # Release the lock
    flock -u "$FD"
}

cleanup_payloads() {
    # clean up all payload chunks from the custom settings
    sed -i '/^xray_payload/d' /jffs/addons/custom_settings.txt
}

ensure_ui_response_file() {
    if [ ! -f "$XRAY_UI_RESPONSE_FILE" ]; then
        printlog true "Creating XRAY UI response file: $XRAY_UI_RESPONSE_FILE"
        echo '{"xray":{}}' >"$XRAY_UI_RESPONSE_FILE"
        chmod 600 "$XRAY_UI_RESPONSE_FILE"
    fi
}

test_xray_config() {
    local output

    if ! output=$(xray -c /opt/etc/xray/config.json -test 2>&1); then
        message=$(echo "$output" | sed -n '/> infra\/conf:/ {s/.*> infra\/conf: //p}')
        if [ -z "$message" ]; then
            message="$output"
        fi
        message=$(echo "$message" | sed 's/"/\\"/g')
    else
        message="Config file appears to be fine, but the XRAY service has not started. Try to restart/reconnect it."
    fi

    ensure_ui_response_file

    local updated_json=$(jq --arg msg "$message" '.xray.test = $msg' "$XRAY_UI_RESPONSE_FILE")
    echo "$updated_json" >"$XRAY_UI_RESPONSE_FILE"
}

install_opkg_package() {
    local package="$1"
    local critical=$2
    # Check for jq
    if ! opkg list-installed | grep "$package -"; then
        printlog true "$package is not installed. Installing $package..."
        opkg update
        if opkg install $package; then
            printlog true "$package installed successfully." $CSUC
        else
            if [ "$critical" = true ]; then
                printlog true "Critical package $package failed to install. Exiting." $CERR
                exit 1
            else
                printlog true "Non-critical package $package failed to install. Continuing." $CERR
            fi
        fi
    else
        printlog true "$package is already installed."
    fi
}

install() {
    update_loading_progress "Installing XRAY UI..."
    printlog true "Starting XRAY UI installation process."

    # Check for Entware
    if [ ! -x /opt/bin/opkg ]; then
        printlog true "Entware is not installed or opkg binary is not accessible." $CERR
        printlog true "Please install Entware first: https://github.com/Entware/Entware/wiki/Install-on-ASUSWRT" $CERR
        exit 1
    fi
    printlog true "Entware is installed." $CSUC

    update_loading_progress "Installing dependencies..."
    install_opkg_package sed true
    install_opkg_package jq true
    install_opkg_package iptables true
    install_opkg_package net-tools-netstat false
    install_opkg_package libopenssl false
    install_opkg_package flock false
    install_opkg_package logrotate false
    install_opkg_package xray true

    generate_default_config

    # backup config
    cp "/opt/etc/xray/config.json" "/opt/etc/xray/config.json.bak"

    update_loading_progress "Configuring XRAY UI..."
    # Add or update nat-start
    printlog true "Ensuring /jffs/scripts/nat-start contains required entry."
    mkdir -p /jffs/scripts
    if [ ! -f /jffs/scripts/nat-start ]; then
        echo "#!/bin/sh" >/jffs/scripts/nat-start
    else
        printlog true "Removing existing #xrayui entries from /jffs/scripts/nat-start."
        sed -i '/#xrayui/d' /jffs/scripts/nat-start
    fi
    echo '/jffs/scripts/xrayui service_event firewall server #xrayui' >>/jffs/scripts/nat-start
    echo '/jffs/scripts/xrayui service_event firewall client #xrayui' >>/jffs/scripts/nat-start
    chmod +x /jffs/scripts/nat-start
    printlog true "Updated /jffs/scripts/nat-start with XrayUI entry." $CSUC

    # Add or update post-mount
    printlog true "Ensuring /jffs/scripts/post-mount contains required entry."
    mkdir -p /jffs/scripts
    if [ ! -f /jffs/scripts/post-mount ]; then
        echo "#!/bin/sh" >/jffs/scripts/post-mount
    else
        printlog true "Removing existing #xrayui entries from /jffs/scripts/post-mount."
        sed -i '/#xrayui/d' /jffs/scripts/post-mount
    fi
    chmod +x /jffs/scripts/post-mount
    echo "/jffs/scripts/xrayui remount_ui"' "$@" & #'"xrayui" >>/jffs/scripts/post-mount
    printlog true "Updated /jffs/scripts/post-mount with XrayUI entry." $CSUC

    # Add or update services-start
    printlog true "Ensuring /jffs/scripts/services-start contains required entry."
    if [ ! -f /jffs/scripts/services-start ]; then
        echo "#!/bin/sh" >/jffs/scripts/services-start
    else
        printlog true "Removing existing #xrayui entries from /jffs/scripts/services-start."
        sed -i '/#xrayui/d' /jffs/scripts/services-start
    fi
    chmod +x /jffs/scripts/services-start
    echo "/jffs/scripts/xrayui service_event startup & #xrayui" >>/jffs/scripts/services-start
    printlog true "Updated /jffs/scripts/services-start with XrayUI entry." $CSUC

    # Add or update service-event
    printlog true "Ensuring /jffs/scripts/service-event contains required entry."
    if [ ! -f /jffs/scripts/service-event ]; then
        echo "#!/bin/sh" >/jffs/scripts/service-event
    else
        printlog true "Removing existing #xrayui entries from /jffs/scripts/service-event."
        sed -i '/#xrayui/d' /jffs/scripts/service-event
    fi
    chmod +x /jffs/scripts/service-event
    echo "echo \"\$2\" | grep -q \"^xrayui\" && /jffs/scripts/xrayui service_event \$(echo \"\$2\" | cut -d'_' -f2- | tr '_' ' ') & #xrayui" >>/jffs/scripts/service-event
    printlog true "Updated /jffs/scripts/service-event with XrayUI entry." $CSUC

    printlog true "Mounting web page..."
    remount_ui "skipwait"

    am_settings_set xray_version $XRAYUI_VERSION

    xray_startup=$(am_settings_get xray_startup)
    if [ -z "$xray_startup" ]; then
        am_settings_set xray_startup "y"
        printlog true "xray_startup was empty. Set to 'enabled'." $CWARN
    else
        printlog true "xray_startup already set. Skipping."
    fi

    local current_mode=$(am_settings_get xray_mode)
    if [ -z "$current_mode" ]; then
        am_settings_set xray_mode "server"
        printlog true "xray_mode was empty. Set to 'server'."
    else
        printlog true "xray_mode already set to '$current_mode'. Skipping."
    fi

    mkdir -p $XRAYUI_USER_SCRIPTS

    # Install and setup geodata builder
    printlog true "Installing XRAY UI geodata files builder..."

    mkdir -p "$XRAYUI_SHARED_DIR" || printlog true "Failed to create $XRAYUI_SHARED_DIR." $CERR

    update_loading_progress "Downloading XRAYUI geodata files builder..."
    if wget --no-hsts -O "/tmp/xraydatbuilder.tar.gz" "https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/releases/latest/download/xrayui-datbuilder.tar.gz"; then
        tar -xzf /tmp/xraydatbuilder.tar.gz -C "$XRAYUI_SHARED_DIR" || printlog true "Failed to extract xraydatbuilder.tar.gz." $CERR
        rm -f /tmp/xraydatbuilder.tar.gz || printlog true "Failed to remove xraydatbuilder.tar.gz." $CERR
        chmod +x "$XRAYUI_SHARED_DIR/xraydatbuilder" || printlog true "Failed to make xraydatbuilder executable." $CERR
    else
        printlog true "Failed to download XRAYUI geodata files builder." $CERR
    fi

    # setup logrotate
    printlog true "Setting up logrotate for XRAY UI..."

    cat >/opt/etc/logrotate.d/xrayui <<EOF
/tmp/xray_*.log {
    su nobody root
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 640 nobody root
    sharedscripts
    postrotate
        /jffs/scripts/xrayui restart
    endscript
}
EOF
    # chown root:root /etc/logrotate.d/xrayui || printlog true "Failed to make logrotate root-owned." $CERR
    chmod 0644 /opt/etc/logrotate.d/xrayui || printlog true "Failed to make logrotate executable." $CERR

    printlog true "============================================" $CSUC
    printlog true "Installation process completed successfully." $CSUC
    printlog true "============================================" $CSUC

    update_loading_progress "Installation completed successfully."
}

uninstall() {
    printlog true "Starting XRAY UI uninstallation process."

    # Stop XRAY service if running
    if [ -f "$PIDFILE" ]; then
        printlog true "Stopping XRAY service..."
        stop
        rm -f $PIDFILE
        printlog true "XRAY service stopped." $CSUC
    else
        printlog true "XRAY service is not running." $CWARN
    fi

    # Remove XRAY UI files
    printlog true "Removing XRAY UI files..."
    rm -rf /www/user/xrayui /jffs/addons/xrayui /tmp/xray_clients_online.json

    if [ $? -eq 0 ]; then
        printlog true "XRAY UI files removed successfully." $CSUC
    else
        printlog true "Failed to remove XRAY UI files." $CERR
        exit 1
    fi

    # clean up services-start
    printlog true "Removing existing #xrayui entries from /jffs/scripts/services-start."
    sed -i '/#xrayui/d' /jffs/scripts/services-start

    # clean up nat-start
    printlog true "Removing existing #xrayui entries from /jffs/scripts/nat-start."
    sed -i '/#xrayui/d' /jffs/scripts/nat-start

    # clean up post-mount
    printlog true "Removing existing #xrayui entries from /jffs/scripts/post-mount."
    sed -i '/#xrayui/d' /jffs/scripts/post-mount

    # clean up service-event
    printlog true "Removing existing #xrayui entries from /jffs/scripts/service-event."
    sed -i '/#xrayui/d' /jffs/scripts/service-event

    # Unmount UI
    printlog true "Unmounting XRAY UI..."
    unmount_ui

    if [ $? -eq 0 ]; then
        printlog true "XRAY UI unmounted successfully." $CSUC
    else
        printlog true "Failed to unmount XRAY UI." $CERR
        exit 1
    fi

    # Remove XRAY custom settings
    printlog true "Removing XRAY custom settings..."

    grep '^xray_' /jffs/addons/custom_settings.txt | while IFS='=' read -r var_name _; do
        [ -n "$var_name" ] && am_settings_del "$var_name"
    done

    printlog true "Custom settings removed successfully." $CSUC

    # Remove XRAY UI shared files
    printlog true "Removing XRAY UI geodata files builder..."
    rm -rf /opt/share/xrayui/xraydatbuilder

    echo
    printlog true "Do you want to remove custom GEODATA? (yes/no)" $CWARN
    read -r user_input

    if [ "$user_input" = "yes" ] || [ "$user_input" = "y" ]; then
        printlog true "Removing custom GEODATA..."
        rm -rf /opt/share/xrayui

        #Remove XRAY custom geodata
        rm -rf /opt/sbin/xrayui
        rm -rf /opt/sbin/geosite.dat
        rm -rf /opt/sbin/geoip.dat
    else
        printlog true "Keeping custom GEODATA."
    fi
    user_input=""

    # Ask user if they want to remove XRAY (opkg) and its configs
    echo
    printlog true "Do you want to remove XRAY (installed via opkg) and its configurations? (yes/no)" $CWARN
    read -r user_input

    if [ "$user_input" = "yes" ] || [ "$user_input" = "y" ]; then
        # Remove XRAY from Entware if installed
        if opkg list-installed | grep -q '^xray$'; then
            printlog true "Removing XRAY from Entware..."
            if opkg remove xray; then
                printlog true "XRAY removed successfully." $CSUC
            else
                printlog true "Failed to remove XRAY." $CERR
                exit 1
            fi
        else
            printlog true "XRAY is not installed."
        fi

        # Remove XRAY configuration files
        printlog true "Removing XRAY configuration files..."
        rm -rf /opt/etc/xray
        if [ $? -eq 0 ]; then
            printlog true "XRAY configuration files removed successfully." $CSUC
        else
            printlog true "Failed to remove XRAY configuration files." $CERR
            exit 1
        fi
    else
        printlog true "Keeping XRAY and its configuration files."
    fi

    rm -rf /opt/etc/logrotate.d/xrayui
    rm -rf /jffs/scripts/xrayui

    printlog true "==============================================" $CSUC
    printlog true "Uninstallation process completed successfully." $CSUC
    printlog true "==============================================" $CSUC
}

enable_config_logs() {
    update_loading_progress "Enabling Xray configuration logs..." 0
    local temp_file="/tmp/xray_config.json"

    printlog true "Checking for the 'log' section in the Xray configuration."

    # Check if the config file exists
    if [ ! -f "$xray_config" ]; then
        printlog true "Configuration file not found: $xray_config"
        return 1
    fi

    # Check if the 'log' section is missing
    if ! jq -e '.log' "$xray_config" >/dev/null 2>&1; then
        printlog true "'log' section is missing. Adding it to the configuration."

        # Add the 'log' section
        jq '. + {
            "log": {
                "loglevel": "warning",
                "error": "/tmp/xray_error.log",
                "access": "/tmp/xray_access.log"
            }
        }' "$xray_config" >"$temp_file"

        if [ $? -eq 0 ]; then
            mv "$temp_file" "$xray_config"
            printlog true "'log' section added successfully."
        else
            printlog true "Failed to update the configuration with 'log' section."
            rm -f "$temp_file"
            return 1
        fi
    else
        printlog true "'log' section already exists in the configuration."
    fi

    if [ -f "$PIDFILE" ]; then
        restart
    fi

    update_loading_progress "Configuration logs enabled successfully." 100
    return 0
}

toggle_startup() {
    local xray_startup=$(am_settings_get xray_startup)
    if [ -z "$xray_startup" ]; then
        am_settings_set xray_startup "y"
        printlog true "xray_startup was empty. Set to 'enabled'." $CWARN
    else
        if [ "$xray_startup" = "y" ]; then
            am_settings_set xray_startup "n"
            printlog true "xray_startup was 'enabled'. Set to 'disabled'." $CSUC
        else
            am_settings_set xray_startup "y"
            printlog true "xray_startup was 'disabled'. Set to 'enabled'." $CSUC
        fi
    fi
}

generate_default_config() {
    # Validate base configuration
    if [ ! -f "$xray_config" ]; then
        printlog true "Base configuration file not found. Creating a default config..." $CWARN
        mkdir -p /opt/etc/xray
        cat >$xray_config <<EOF
{
    "log": {
        "loglevel": "warning",
        "access": "/tmp/xray_access.log",
        "error": "/tmp/xray_error.log"
    },
    "inbounds":[],
    "outbounds":[],
    "routing": {
        "rules": []
    },
    "dns": {
        "servers": []
    }
}
EOF
        if [ $? -eq 0 ]; then
            printlog true "Default configuration created successfully." $CSUC
        else
            printlog true "Failed to create default configuration." $CERR
            exit 1
        fi
    else
        printlog true "Base configuration file already exists." $CWARN
    fi
}

fixme() {
    printlog true "Attempting to fix XRAY UI issues..."

    printlog true "Removing XRAY broken payload settings..."

    sed -i '/^xray_payload/d' /jffs/addons/custom_settings.txt

    printlog true "Removing file $XRAY_UI_RESPONSE_FILE..."
    rm -f $XRAY_UI_RESPONSE_FILE

    printlog true "Removing file $XRAY_UI_CLIENTS_FILE..."
    rm -f $XRAY_UI_CLIENTS_FILE

    printlog true "Done with fixme function." "$CSUC"
}

update_community_geodata() {
    update_loading_progress "Updating community geodata files..." 0

    local geosite_url="https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat"
    local geoip_url="https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat"

    local target_dir=$(dirname "$(which xray)")

    mkdir -p "$target_dir"

    printlog true "Downloading geosite.dat..."
    update_loading_progress "Downloading geosite.dat..."
    curl -L "$geosite_url" -o "$target_dir/geosite.dat"
    if [ $? -ne 0 ]; then
        printlog true "Failed to download geosite.dat." $CERR
        return 1
    fi

    printlog true "Downloading geoip.dat..."
    update_loading_progress "Downloading geoip.dat..."
    curl -L "$geoip_url" -o "$target_dir/geoip.dat"
    if [ $? -ne 0 ]; then
        printlog true "Failed to download geoip.dat." $CERR
        return 1
    fi

    if [[ -f "$target_dir/geosite.dat" && -f "$target_dir/geoip.dat" ]]; then
        printlog true "Files successfully placed in $target_dir." $CSUC
        if [ -f "$PIDFILE" ]; then
            update_loading_progress "Restarting Xray service..." 60
            restart
        fi
    else
        printlog true "Failed to place geosite.dat/geoip.dat in $target_dir." $CERR
    fi
    update_loading_progress "Community geodata files updated successfully." 100

}

set_community_geodata_dates() {
    local geoip_file="/opt/sbin/geoip.dat"
    local geosite_file="/opt/sbin/geosite.dat"

    local geoip_date geosite_date
    geoip_date=$(date -r "$geoip_file" "+%Y-%m-%d %H:%M:%S")
    geosite_date=$(date -r "$geosite_file" "+%Y-%m-%d %H:%M:%S")

    ensure_ui_response_file
    local json_content
    if [ -f "$XRAY_UI_RESPONSE_FILE" ]; then
        json_content=$(cat "$XRAY_UI_RESPONSE_FILE")
    else
        json_content="{}"
    fi

    json_content=$(echo "$json_content" | jq --arg geoip "$geoip_date" --arg geosite "$geosite_date" \
        '.geodata.community["geoip.dat"] = $geoip | .geodata.community["geosite.dat"] = $geosite')
    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to update JSON content with file dates." $CERR
        return 1
    fi

    echo "$json_content" >"$XRAY_UI_RESPONSE_FILE"
    if [ $? -eq 0 ]; then
        printlog true "Saved file dates to $XRAY_UI_RESPONSE_FILE successfully." $CSUC
    else
        printlog true "Failed to save file dates to $XRAY_UI_RESPONSE_FILE." $CERR
        return 1
    fi
}

get_custom_geodata_tagfiles() {

    printlog true "Starting geodata tagfiles retrieval process..."

    local json_content

    ensure_ui_response_file
    if [ -f "$XRAY_UI_RESPONSE_FILE" ]; then
        json_content=$(cat "$XRAY_UI_RESPONSE_FILE")
    else
        json_content="{}"
    fi

    local data_dir="$XRAYUI_SHARED_DIR/data"

    local tagfiles_json
    tagfiles_json=$(find "$data_dir" -type f -exec basename {} \; | sed 's/\.[^.]*$//' | sort | jq -R -s -c 'split("\n")[:-1]')

    json_content=$(echo "$json_content" | jq --argjson tags "$tagfiles_json" \
        '.geodata["tags"] = $tags')

    echo "$json_content" >"$XRAY_UI_RESPONSE_FILE"

    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to update JSON content with tags." "$CERR"
        return 1
    fi

    printlog true "Saved tagfiles to $XRAY_UI_RESPONSE_FILE successfully." "$CSUC"
    return 0
}

geodata_remount_to_web() {
    local datadir="$XRAYUI_SHARED_DIR/data"
    local geodata_dir="$dir_xrayui/geodata"

    rm -f "$geodata_dir"

    if [ ! -d "$dir_xrayui/geodata" ]; then
        mkdir -p "$dir_xrayui/geodata"
        if [ $? -ne 0 ]; then
            printlog true "Error: Failed to create directory '$dir_xrayui/geodata'." "$CERR"
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
    printlog true "Recompiling ALL custom geodata files..."

    local builder="$XRAYUI_SHARED_DIR/xraydatbuilder"

    if [ ! -f "$builder" ] || [ ! -x "$builder" ]; then
        printlog true "Error: Builder not found or not executable at $builder" $CERR
        return 1
    fi

    local outdir=$(dirname "$(which xray)")
    local datadir="$XRAYUI_SHARED_DIR/data"

    rm -f "$outdir/xrayui"

    update_loading_progress "Recompiling geodata files..." 50
    "$builder" --datapath "$datadir" --outputdir "$outdir" --outputname "xrayui" || {
        printlog true "Failed to recompile geodata files." $CERR
        return 1
    }

    chmod -x "$datadir/xrayui"

    cleanup_payloads
    geodata_remount_to_web

    printlog true "Recompiled all custom geodata files successfully." $CSUC
    return 0
}

geodata_recompile() {
    printlog true "Starting geodata recompilation process..." "$CSUC"

    local datadir="$XRAYUI_SHARED_DIR/data"

    if [ ! -d "$datadir" ]; then
        printlog true "Error: Data directory '$datadir' does not exist." "$CERR"
        return 1
    fi

    # Reconstruct the payload
    local datfile
    datfile=$(reconstruct_payload)
    if [ $? -ne 0 ] || [ -z "$datfile" ]; then
        printlog true "Error: Failed to reconstruct payload." "$CERR"
        return 1
    fi

    # Extract 'tag' and 'content' from the payload using jq
    local filename
    filename=$(echo "$datfile" | jq -r '.tag')
    if [ $? -ne 0 ] || [ -z "$filename" ] || [ "$filename" == "null" ]; then
        printlog true "Error: Invalid or missing 'tag' in payload." "$CERR"
        return 1
    fi

    local filecontent
    filecontent=$(echo "$datfile" | jq -r '.content')
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
    printlog true "Starting geodata tag deletion process..." "$CSUC"

    local datadir="$XRAYUI_SHARED_DIR/data"
    local geodata_dir="$XRAYUI_SHARED_DIR/geodata"

    # Check if the data directory exists
    if [ ! -d "$datadir" ]; then
        printlog true "Error: Data directory '$datadir' does not exist." "$CERR"
        return 1
    fi

    # Reconstruct the payload
    local datfile
    datfile=$(reconstruct_payload)
    if [ $? -ne 0 ] || [ -z "$datfile" ]; then
        printlog true "Error: Failed to reconstruct payload." "$CERR"
        return 1
    fi

    # Extract 'tag' from the payload using jq
    local filename
    filename=$(echo "$datfile" | jq -r '.tag')
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

logs_fetch() {
    update_loading_progress "Fetching logs..." 0
    local log_access="/tmp/xray_access.log"
    local log_error="/tmp/xray_error.log"
    tail -n 200 "$log_access" >/www/user/xrayui/xray_access_partial.asp
    tail -n 200 "$log_error" >/www/user/xrayui/xray_error_partial.asp
    update_loading_progress "Logs fetched successfully." 100
}

change_log_level() {
    update_loading_progress "Changing log level..." 0
    local payload=$(reconstruct_payload)
    local log_level=$(echo "$payload" | jq -r '.log_level')

    printlog true "Changing log level to $log_level..."

    local updated_json=$(jq --arg log_level "$log_level" '
        if .log.loglevel then del(.log.loglevel) else . end |
        .log.loglevel = $log_level
    ' "$xray_config")

    if [ $? -ne 0 ]; then
        printlog true "Error: Failed to update JSON content with log level." "$CERR"
        return 1
    fi

    echo "$updated_json" >"$xray_config"

    if [ -f "$PIDFILE" ]; then
        restart
    fi

    update_loading_progress "Log level changed successfully." 100
    return 0
}

update_loading_progress() {
    local message=$1
    local progress=$2

    ensure_ui_response_file

    local json_content
    if [ -f "$XRAY_UI_RESPONSE_FILE" ]; then
        json_content=$(cat "$XRAY_UI_RESPONSE_FILE")
    else
        json_content="{}"
    fi

    if [ -n "$progress" ]; then

        json_content=$(echo "$json_content" | jq --argjson progress "$progress" --arg message "$message" '
            .loading.message = $message |
            .loading.progress = $progress
        ')
    else
        json_content=$(echo "$json_content" | jq --arg message "$message" '
            .loading.message = $message
        ')
    fi

    echo "$json_content" >"$XRAY_UI_RESPONSE_FILE"
}

case "$1" in
install)
    install
    ;;
uninstall)
    uninstall
    ;;
update)
    update
    ;;
start)
    start
    ;;
stop)
    stop
    ;;
restart)
    restart
    ;;
mount_ui)
    mount_ui
    ;;
unmount_ui)
    unmount_ui
    ;;
remount_ui)
    remount_ui $2
    ;;
fixme)
    fixme
    ;;
service_event)
    if [ "$2" = "testconfig" ]; then
        test_xray_config
        exit 0
    elif [ "$2" = "startup" ]; then
        get_xray_proc
        if [ "$(am_settings_get xray_startup)" = "y" ]; then
            sleep 60 # wait for network and iptable rules to be ready
            restart
        elif [ -n "$xray_pid" ]; then
            printlog true "Xray service is disabled by XRAYUI. Stoping Xray service..."
            stop
        else
            printlog true "Xray service is disabled by XRAYUI. Xray service is not running."
        fi
        exit 0
    elif [ "$2" = "update" ]; then
        update
        exit 0
    elif [ "$2" = "geodata" ]; then
        update_loading_progress "Updating geodata files..." 0
        if [ "$3" = "communityupdate" ]; then
            update_community_geodata
            update_loading_progress "Community geodata files updated successfully." 100
        elif [ "$3" = "communitydatecheck" ]; then
            set_community_geodata_dates
            update_loading_progress "Community geodata files updated successfully." 100
        elif [ "$3" = "customtagfiles" ]; then
            get_custom_geodata_tagfiles
            update_loading_progress "Custom tagfiles retrieved successfully." 100
        elif [ "$3" = "customrecompileall" ]; then
            geodata_recompile_all
            update_loading_progress "Geodata recompiled successfully." 100
        elif [ "$3" = "customrecompile" ]; then
            geodata_recompile
            update_loading_progress "Geodata recompiled successfully." 100
        elif [ "$3" = "customdeletetag" ]; then
            geodata_delete_tag
            update_loading_progress "Geodata tag deleted successfully." 100
        fi
        exit 0
    elif [ "$2" = "connectedclients" ]; then
        get_connected_clients
        exit 0
    elif [ "$2" = "configuration" ]; then
        case "$3" in
        "apply")
            apply_config
            ;;
        "mode")
            switch_mode
            ;;
        "logs")
            case "$4" in
            "fetch")
                logs_fetch
                ;;
            "changeloglevel")
                change_log_level
                ;;
            *)
                enable_config_logs
                ;;
            esac
            exit 0
            ;;
        "togglestartup")
            toggle_startup
            ;;
        "generatedefaultconfig")
            generate_default_config
            ;;
        esac
        exit 0
    elif [ "$2" = "regenerate" ]; then
        case "$3" in
        "realitykeys")
            regenerate_reality_keys
            exit 0
            ;;
        "wgkeys")
            regenerate_wireguard_keys
            exit 0
            ;;
        "sslcertificates")
            regenerate_ssl_certificates
            exit 0
            ;;
        esac
        exit 0
    elif [ "$2" = "firewall" ]; then
        case "$3" in
        "server")
            configure_firewall_server
            exit 0
            ;;
        "client")
            configure_firewall_client
            exit 0
            ;;
        "cleanup")
            cleanup_firewall
            exit 0
            ;;
        esac
        exit 0
    elif [ "$2" = "serverstatus" ]; then
        case "$3" in
        "start")
            update_loading_progress "Starting Xray service..." 0
            start
            update_loading_progress "Xray service started successfully." 100
            exit 0
            ;;
        "restart")
            update_loading_progress "Restarting Xray service..." 0
            restart
            update_loading_progress "Xray service restarted successfully." 100
            exit 0
            ;;
        "stop")
            update_loading_progress "Stopping Xray service..." 0
            stop
            update_loading_progress "Xray service stopped successfully." 100
            exit 0
            ;;
        *)
            exit 1
            ;;
        esac
    fi
    exit 0
    ;;
*)
    echo "Usage: $0 {install|uninstall|start|stop|restart|update|mount_ui|unmount_ui|remount_ui}"
    exit 1
    ;;
esac

exit 0
