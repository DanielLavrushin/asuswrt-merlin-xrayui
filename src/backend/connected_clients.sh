get_connected_clients() {
    local temp_file="/tmp/xray_clients_online.json"
    >"$temp_file" || printlog true "Failed to create temporary file: $temp_file" $CERR

    local ports_list=""
    local inbounds_ports=$(jq -r '.inbounds[]
    | select(.protocol != "dokodemo-door" and (.tag | startswith("sys:") | not))
    | .port' "$XRAY_CONFIG_FILE" | sort -u)

    for xray_port in $inbounds_ports; do
        if echo "$xray_port" | grep -q '-'; then
            PORT_START=$(echo "$xray_port" | cut -d'-' -f1)
            PORT_END=$(echo "$xray_port" | cut -d'-' -f2)
            for port in $(seq "$PORT_START" "$PORT_END"); do
                ports_list="$ports_list $port"
            done
        else
            ports_list="$ports_list $xray_port"
        fi
    done

    printlog true "Checking connected clients for ports: $ports_list"

    local pattern=$(echo "$ports_list" | tr ' ' '\n' | grep -E '^[0-9]+$' | sort -n -u | awk '{printf "%s|", $0}' | sed 's/|$//')

    local ips=$(netstat -an | grep "$pattern" | awk '$6=="ESTABLISHED" { split($5,a,":"); if (length(a) >= 4) print a[4]; else print a[1] }' | sort -u)

    local access_log=$(jq -r '.log.access' "$XRAY_CONFIG_FILE")

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

    echo "$json_array" >$XRAYUI_CLIENTS_FILE
    rm -f "$temp_file"
    echo "$json_array"
}
