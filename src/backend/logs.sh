#!/bin/sh
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

  local log_access="$(jq -r '.log.access // "/tmp/xray_access.log"' "$XRAY_CONFIG_FILE")"
  local log_error="$(jq -r '.log.error // "/tmp/xray_error.log"' "$XRAY_CONFIG_FILE")"

  tail -n 200 "$log_error" >/www/user/xrayui/xray_error_partial.asp
  tail -n 200 "$log_access" >/www/user/xrayui/xray_access_partial.asp
  replace_ips_with_domains /www/user/xrayui/xray_access_partial.asp
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
