#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

replace_ips_with_domains() {
  file="$1"
  tmpfile="/tmp/$(basename "$file").tmp"
  sed_script="/tmp/xrayui_sed_replace.sed"

  load_xrayui_config
  if [ "$dnsmasq" != "true" ]; then
    return
  fi

  [ ! -f "/opt/var/log/dnsmasq.log" ] && {
    return
  }

  tail -n 1000 /opt/var/log/dnsmasq.log | awk '{
      for(i=1; i<=NF; i++){
        if($i=="is" && (i+1)<=NF){
          mapping[$(i+1)] = $(i-1)
        }
      }
    } END {
      for(ip in mapping){
        print "s|tcp:" ip "|tcp:" mapping[ip] "|g"
        print "s|udp:" ip "|udp:" mapping[ip] "|g"
      }
    }' >"$sed_script"

  sed -f "$sed_script" "$file" >"$tmpfile"
  mv "$tmpfile" "$file"
}

logs_fetch() {
  load_xrayui_config

  local log_access=$(jq -r --arg access "$ADDON_LOGS_DIR/xray_access.log" '.log.access // $access' "$XRAY_CONFIG_FILE")
  local log_error=$(jq -r --arg error "$ADDON_LOGS_DIR/xray_error.log" '.log.error // $error' "$XRAY_CONFIG_FILE")

  tail -n 200 "$log_error" >"$ADDON_WEB_DIR/xray_error_partial.asp"
  tail -n 200 "$log_access" >"$ADDON_WEB_DIR/xray_access_partial.asp"
  replace_ips_with_domains "$ADDON_WEB_DIR/xray_access_partial.asp"
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
