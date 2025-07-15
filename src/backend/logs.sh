#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

DNSMASQ_LOG="/opt/var/log/dnsmasq.log"
XRAYUI_DNSMASQ_CACHE="$ADDON_LOGS_DIR/xrayui_ip2domain.cache"
XRAYUI_DNSMASQ_SED="$ADDON_LOGS_DIR/xrayui_sed_replace.sed"

logs_ip2domain_cache() {
  local cache="$XRAYUI_DNSMASQ_CACHE"
  local tmp="${cache}.$$"

  tail -n 1200 "$DNSMASQ_LOG" | awk '
    # dnsmasq:  reply <host> is <IP>
    $0 ~ / reply / {
        host=$3; ip=$(NF)
        if(host!="localhost" && ip ~ /^[0-9A-Fa-f:.]+$/) map[ip]=host
    }
    # dnsmasq: <host> is <IP>
    $0 ~ / is / {
        for(i=1;i<=NF;i++)
            if($i=="is" && (i+1)<=NF){
                ip=$(i+1); host=$(i-1)
                if(host!="localhost" && ip ~ /^[0-9A-Fa-f:.]+$/) map[ip]=host
            }
    }
    END{ for(ip in map) printf "%s %s\n", ip, map[ip] }
' >"$tmp" || {
    rm -f "$tmp"
    return 1
  }

  cat "$tmp" "$cache" 2>/dev/null |
    awk '!seen[$1]++' >"${cache}.new" &&
    mv "${cache}.new" "$cache"

  rm -f "$tmp"
}

logs_build_sed_script() {
  local slice="$1"
  local script="$XRAYUI_DNSMASQ_SED".$$

  grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' "$slice" |
    sort -u >"$script.ips"

  awk '
        NR==FNR          { want[$1]=1; next }          # first file = .ips
        ($1 in want)     { printf "s|%s|%s|g\n", $1, $2 }
    ' "$script.ips" "$XRAYUI_DNSMASQ_CACHE" >"$script"

  rm -f "$script.ips"
  echo "$script"
}

replace_ips_with_domains() {
  logs_ip2domain_cache # refresh cache first

  local slice="$1"
  local sed_script
  sed_script="$(logs_build_sed_script "$slice")"

  [ -s "$sed_script" ] || {
    rm -f "$sed_script"
    return
  }

  sed -f "$sed_script" "$slice" >"$slice.$$" &&
    mv "$slice.$$" "$slice"
  rm -f "$sed_script"
}

logs_fetch() {
  load_xrayui_config

  local log_access
  log_access=$(jq -r --arg access "$ADDON_LOGS_DIR/xray_access.log" \
    '.log.access // $access' "$XRAY_CONFIG_FILE")
  local log_error
  log_error=$(jq -r --arg error "$ADDON_LOGS_DIR/xray_error.log" \
    '.log.error // $error' "$XRAY_CONFIG_FILE")

  local pub_error="$ADDON_WEB_DIR/xray_error_partial.asp"
  local pub_access="$ADDON_WEB_DIR/xray_access_partial.asp"

  local tmp_error="${pub_error}.$$"
  local tmp_access="${pub_access}.$$"

  tail -n 200 "$log_error" >"$tmp_error"
  tail -n 200 "$log_access" >"$tmp_access"

  if [ "$logs_dnsmasq" = "true" ]; then
    replace_ips_with_domains "$tmp_access"
  fi

  mv "$tmp_error" "$pub_error"
  mv "$tmp_access" "$pub_access"
}

change_log_level() {
  update_loading_progress "Changing log level..." 0
  load_xrayui_config

  local payload=$(reconstruct_payload)
  local log_level=$(echo "$payload" | jq -r '.log_level')

  log_info "Changing log level to $log_level..."

  local updated_json=$(jq --arg log_level "$log_level" '
        if .log.loglevel then del(.log.loglevel) else . end |
        .log.loglevel = $log_level
    ' "$XRAY_CONFIG_FILE")

  if [ $? -ne 0 ]; then
    log_error "Error: Failed to update JSON content with log level."
    return 1
  fi

  echo "$updated_json" >"$XRAY_CONFIG_FILE"

  if [ -f "$XRAY_PIDFILE" ]; then
    restart
  fi

}

enable_config_logs() {
  update_loading_progress "Enabling Xray configuration logs..." 0

  load_xrayui_config

  local temp_file="/tmp/xray_config.json"

  log_info "Checking for the 'log' section in the Xray configuration."

  # Check if the config file exists
  if [ ! -f "$XRAY_CONFIG_FILE" ]; then
    log_info "Configuration file not found: $XRAY_CONFIG_FILE"
    return 1
  fi

  if [ ! -d "$ADDON_LOGS_DIR" ]; then
    mkdir -p $ADDON_LOGS_DIR
  fi

  # Check if the 'log' section is missing
  if ! jq -e '.log' "$XRAY_CONFIG_FILE" >/dev/null 2>&1; then
    log_info "'log' section is missing. Adding it to the configuration."

    # Add the 'log' section
    jq --arg access "$ADDON_LOGS_DIR/xray_access.log" \
      --arg error "$ADDON_LOGS_DIR/xray_error.log" \
      '. + {
              "log": {
                  "loglevel": "warning",
                  "error": $error,
                  "access": $access
              }
           }' "$XRAY_CONFIG_FILE" >"$temp_file"

    if [ $? -eq 0 ]; then
      mv "$temp_file" "$XRAY_CONFIG_FILE"
      log_info "'log' section added successfully."
    else
      log_info "Failed to update the configuration with 'log' section."
      rm -f "$temp_file"
      return 1
    fi
  else
    log_info "'log' section already exists in the configuration."
  fi

  if [ -f "$XRAY_PIDFILE" ]; then
    restart
  fi

}

logrotate_setup() {
  # setup logrotate
  log_info "Setting up logrotate for XRAY UI..."

  load_xrayui_config
  local logs_max_size=${logs_max_size:-10}

  local log_access="$(jq -r --arg default "$ADDON_LOGS_DIR/xray_access.log" '.log.access // $default' "$XRAY_CONFIG_FILE")"
  local log_error="$(jq -r --arg default "$ADDON_LOGS_DIR/xray_error.log" '.log.error // $default' "$XRAY_CONFIG_FILE")"

  cat >/opt/etc/logrotate.d/xrayui <<EOF
$log_access $log_error {
    su nobody root
    size ${logs_max_size}M
    rotate 2
    notifempty
    copytruncate
    create 640 nobody root
    missingok
}
EOF

  chmod 0644 /opt/etc/logrotate.d/xrayui || log_error "Failed to make logrotate executable."
  log_ok "Logrotate configuration created successfully."

}
