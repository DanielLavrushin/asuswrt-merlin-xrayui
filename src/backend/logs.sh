#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

XRAYUI_DNSMASQ_CACHE="$ADDON_LOGS_DIR/xrayui_ip2domain.cache"
XRAYUI_DNSMASQ_SED="$ADDON_LOGS_DIR/xrayui_sed_replace.sed"

logs_dnsmasq_logspath() {
  local log_path="/opt/var/log/dnsmasq.log" # default path

  # Check main dnsmasq config
  if [ -f "/etc/dnsmasq.conf" ]; then
    local found_path=$(grep -E "^log-facility=" /etc/dnsmasq.conf 2>/dev/null | cut -d'=' -f2)
    [ -n "$found_path" ] && [ "$found_path" != "-" ] && log_path="$found_path"
  fi

  # Check dnsmasq.conf.add (higher priority - overwrites main config)
  if [ -f "/jffs/configs/dnsmasq.conf.add" ]; then
    local found_path=$(grep -E "^log-facility=" /jffs/configs/dnsmasq.conf.add 2>/dev/null | cut -d'=' -f2)
    [ -n "$found_path" ] && [ "$found_path" != "-" ] && log_path="$found_path"
  fi

  # Check if the log file exists, if not try to find it via ps
  if [ ! -f "$log_path" ]; then
    local ps_path=$(ps w | grep -o "dnsmasq.*--log-facility=[^ ]*" | grep -o "/[^ ]*")
    [ -n "$ps_path" ] && [ -f "$ps_path" ] && log_path="$ps_path"
  fi

  echo "$log_path"
}

logs_ip2domain_cache() {
  local cache="$XRAYUI_DNSMASQ_CACHE"
  local tmp="${cache}.$$"
  local log_path="$(logs_dnsmasq_logspath)"

  tail -n 1200 "$log_path" | awk '
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

  grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}' "$slice" |
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
  log_info "Setting up logrotate for XRAY UI..."

  load_xrayui_config
  local logs_max_size=${logs_max_size:-10}

  mkdir -p "$ADDON_LOGS_DIR"
  local username="$(nvram get http_username)"
  chown "$username":root "$ADDON_LOGS_DIR"
  chmod 755 "$ADDON_LOGS_DIR"

  local log_access="$(jq -r --arg default "$ADDON_LOGS_DIR/xray_access.log" '.log.access // $default' "$XRAY_CONFIG_FILE")"
  local log_error="$(jq -r --arg default "$ADDON_LOGS_DIR/xray_error.log" '.log.error // $default' "$XRAY_CONFIG_FILE")"

  cat >/opt/etc/logrotate.d/xrayui <<EOF
$log_access $log_error {
        size ${logs_max_size}M
        rotate 2
        notifempty
        copytruncate
        create 640 nobody root
        missingok
        nodateext
}
EOF

  chmod 0644 /opt/etc/logrotate.d/xrayui || log_error "Failed to make logrotate executable."
  log_ok "Logrotate configuration created successfully."
}

logs_scribe_integration() {
  load_xrayui_config
  # Check if integration is enabled first, before any other checks
  if [ "$integration_scribe" != "true" ]; then
    log_debug "Scribe integration is disabled in the configuration."
    rm -f /opt/etc/syslog-ng.d/xrayui 2>/dev/null
    return 0
  fi

  log_info "Setting up XRAYUI syslog integration for Scribe..."

  if [ ! -f /jffs/scripts/scribe ]; then
    log_warn "Scribe script not found. Please install Scribe first."
    return 0
  fi

  if [ ! -f /opt/etc/syslog-ng.conf ]; then
    log_warn "Syslog configuration file not found."
    return 0
  fi

  log_debug "Scribe integration is enabled. Creating syslog-ng configuration for XRAYUI."

  cat >/opt/etc/syslog-ng.d/xrayui <<EOF
# syslog-ng configuration for XRAYUI
destination d_xrayui { 
    file("/opt/var/log/xrayui.log");
};

filter f_xrayui {
    message("XRAYUI");
};

log {
    source(src);
    filter(f_xrayui);
    destination(d_xrayui);
    flags(final);
};

#eof
EOF

  /jffs/scripts/scribe restart || { log_error "Failed to reload Scribe configuration." && return 1; }

  log_ok "Scribe integration for XRAYUI logs configured successfully."
}
