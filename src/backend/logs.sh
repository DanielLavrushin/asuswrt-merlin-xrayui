#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

replace_ips_with_domains() {
  file="$1"
  tmpfile="/tmp/$(basename "$file").tmp"
  sed_script="/tmp/xrayui_sed_replace.sed"

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
  update_loading_progress "Fetching logs..." 0

  local log_access=$(jq -r --arg access "$ADDON_LOGS_DIR/xray_access.log" '.log.access // $access' "$XRAY_CONFIG_FILE")
  local log_error=$(jq -r --arg error "$ADDON_LOGS_DIR/xray_error.log" '.log.error // $error' "$XRAY_CONFIG_FILE")

  tail -n 200 "$log_error" >"$ADDON_WEB_DIR/xray_error_partial.asp"
  tail -n 200 "$log_access" >"$ADDON_WEB_DIR/xray_access_partial.asp"
  replace_ips_with_domains "$ADDON_WEB_DIR/xray_access_partial.asp"
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
    ' "$XRAY_CONFIG_FILE")

  if [ $? -ne 0 ]; then
    printlog true "Error: Failed to update JSON content with log level." "$CERR"
    return 1
  fi

  echo "$updated_json" >"$XRAY_CONFIG_FILE"

  if [ -f "$XRAY_PIDFILE" ]; then
    restart
  fi

  update_loading_progress "Log level changed successfully." 100
  return 0
}

enable_config_logs() {
  update_loading_progress "Enabling Xray configuration logs..." 0
  local temp_file="/tmp/xray_config.json"

  printlog true "Checking for the 'log' section in the Xray configuration."

  # Check if the config file exists
  if [ ! -f "$XRAY_CONFIG_FILE" ]; then
    printlog true "Configuration file not found: $XRAY_CONFIG_FILE"
    return 1
  fi

  if [ ! -d "$ADDON_LOGS_DIR" ]; then
    mkdir -p $ADDON_LOGS_DIR
  fi

  # Check if the 'log' section is missing
  if ! jq -e '.log' "$XRAY_CONFIG_FILE" >/dev/null 2>&1; then
    printlog true "'log' section is missing. Adding it to the configuration."

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
      printlog true "'log' section added successfully."
    else
      printlog true "Failed to update the configuration with 'log' section."
      rm -f "$temp_file"
      return 1
    fi
  else
    printlog true "'log' section already exists in the configuration."
  fi

  if [ -f "$XRAY_PIDFILE" ]; then
    restart
  fi

  update_loading_progress "Configuration logs enabled successfully." 100
  return 0
}
