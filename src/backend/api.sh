#!/bin/sh
# shellcheck shell=sh disable=SC2034   # tell shellcheck we really want POSIX sh

api_get_current_config() {
  local xray_config_name=$(basename "$XRAY_CONFIG_FILE")
  echo "/opt/etc/xray/xrayui/${xray_config_name%.json}-api.json"
}

# Get the gRPC API listen address from the API config file.
api_get_listen_address() {
  local cfg addr
  cfg=$(api_get_current_config)
  [ -f "$cfg" ] || return 1
  addr=$(jq -r '.api.listen // empty' "$cfg") || return 1
  [ -n "$addr" ] || return 1
  printf '%s\n' "$addr"
}

# Remove an outbound by tag via xray gRPC API.
api_remove_outbound() {
  local tag="$1"
  local api_addr
  api_addr=$(api_get_listen_address) || return 1

  if ! xray api rmo -s "$api_addr" "$tag" >/dev/null 2>&1; then
    log_error "API: failed to remove outbound '$tag'"
    return 1
  fi
  log_debug "API: removed outbound '$tag'"
}

# Add an outbound via xray gRPC API.
# $1 = outbound JSON object (xrayui-specific fields are stripped automatically)
api_add_outbound() {
  local outbound_json="$1"
  local api_addr tmp_file
  api_addr=$(api_get_listen_address) || return 1

  tmp_file="/tmp/xray_api_ado.$$.json"
  printf '%s' "$outbound_json" |
    jq -c '{outbounds: [del(.subPool, .surl)]}' >"$tmp_file" 2>/dev/null || {
    rm -f "$tmp_file"
    log_error "API: failed to prepare outbound JSON"
    return 1
  }

  if ! xray api ado -s "$api_addr" "$tmp_file" >/dev/null 2>&1; then
    rm -f "$tmp_file"
    log_error "API: failed to add outbound"
    return 1
  fi

  rm -f "$tmp_file"
  log_debug "API: added outbound"
}

api_swap_outbound() {
  local tag="$1"
  local outbound_json="$2"
  local previous_json="$3"

  api_remove_outbound "$tag" || return 1
  if ! api_add_outbound "$outbound_json"; then
    if [ -n "$previous_json" ] && api_add_outbound "$previous_json"; then
      log_warn "API: restored the previous outbound '$tag'"
    fi
    return 1
  fi
  log_info "API: hot-swapped outbound '$tag'"
}

api_write_config() {
  log_info "Writing API configuration..."
  mkdir -p /opt/etc/xray/xrayui

  local xray_api_config=$(api_get_current_config)
  local observatory_probe_url
  observatory_probe_url=$(printf '%s' "${probe_url:-https://www.google.com/generate_204}" | jq -Rs '.')
  local observatory_probe_interval=$(sanitize_probe_interval "$probe_interval")
  local outbound_tags
  outbound_tags=$(
    jq -c '
      [ .outbounds[]
      | select(.tag and .protocol != "blackhole")
      | .tag ]
      | unique
    ' "$XRAY_CONFIG_FILE"
  )

  cat >"$xray_api_config" <<EOF
{
  "api": {
    "tag": "sys:api",
    "listen": "127.0.0.1:10085",
    "services": ["HandlerService", "LoggerService", "StatsService", "ReflectionService"]
  },
  "inbounds": [
    {
      "listen": "127.0.0.1",
      "port": 10086,
      "protocol": "dokodemo-door",
      "settings": {
        "address": "127.0.0.1"
      },
      "tag": "sys:metrics_in"
    }
  ],
  "stats": {},
  "policy": {
    "levels": {
      "0": { "statsUserUplink": true, "statsUserDownlink": true }
    }
  },
  "observatory": {
    "subjectSelector": $outbound_tags,
    "probeUrl": $observatory_probe_url,
    "probeInterval": "${observatory_probe_interval}s",
    "enableConcurrency": true
  },
  "metrics": { "tag": "sys:metrics_out" }
}
EOF
}

api_get_connected_clients() {
  load_xrayui_config
  api_addr=$(api_get_listen_address)
  stats_json="$ADDON_SHARE_DIR/xray_stats.json"
  out_json="$XRAYUI_CLIENTS_FILE"

  : >"$out_json"

  # pull user counters and *reset* them
  if ! xray api statsquery \
    -s "$api_addr" \
    -pattern 'user>>>' \
    -reset >"$stats_json" 2>/dev/null; then
    log_error "StatsService unreachable on $api_addr"
    echo "[]"
    return
  fi

  jq -r '
        (.stat // [])
        | map(select((.value // 0) | tonumber > 0))
        | map(.name | split(">>>")[1])
        | unique
        | map({ ip:"", email:[.] })
    ' "$stats_json" >"$out_json"

}

api_fetch_metrics() {
  local cfg host port url

  cfg=$(api_get_current_config)
  [ -f "$cfg" ] || return 1

  host=$(jq -r '.inbounds[]? | select(.tag == "sys:metrics_in") | .listen' "$cfg" 2>/dev/null)
  port=$(jq -r '.inbounds[]? | select(.tag == "sys:metrics_in") | .port' "$cfg" 2>/dev/null)
  if [ -z "$host" ] || [ -z "$port" ]; then
    log_debug "Metrics inbound is not configured in $cfg" >&2
    return 1
  fi

  url="http://${host}:${port}/debug/vars"
  if ! curl -fsS --max-time 5 "$url" 2>/dev/null; then
    log_debug "Failed to fetch metrics from $url" >&2
    return 1
  fi
}

api_fetch_observatory() {
  local raw

  raw=$(api_fetch_metrics) || return 1
  printf '%s' "$raw" | jq -ce '.observatory // {} | objects' 2>/dev/null
}

api_get_connection_status() {
  local raw pid now tmp

  load_xrayui_config

  now=$(date +%s)
  pid=$(get_xray_daemon_pid) || pid=0
  case "$pid" in
    '' | *[!0-9]*) pid=0 ;;
  esac

  tmp="$XRAYUI_CONNECTION_STATUS_FILE.tmp.$$"
  if [ "$pid" -gt 0 ] && raw=$(api_fetch_metrics) &&
    printf '%s' "$raw" | jq -ce --argjson ts "$now" --argjson pid "$pid" \
      '{v: 2, ok: true, ts: $ts, pid: $pid, observatory: (.observatory | objects // {})}' >"$tmp" 2>/dev/null; then
    :
  else
    [ "$pid" -gt 0 ] && log_error "Failed to fetch or parse observatory data"
    printf '{"v":2,"ok":false,"ts":%s,"pid":%s,"observatory":{}}\n' "$now" "$pid" >"$tmp"
  fi
  mv -f "$tmp" "$XRAYUI_CONNECTION_STATUS_FILE" || rm -f "$tmp"
}

API_BALANCER_NEEDS_OBSERVATORY='
  def needs_observatory:
    ((.strategy.type // "random") | ascii_downcase) as $type
    | $type == "leastping" or $type == "leastload" or ((.fallbackTag // "") != "");
'

api_balancers_need_observatory() {
  [ -f "$XRAY_CONFIG_FILE" ] || return 1
  jq -e "$API_BALANCER_NEEDS_OBSERVATORY"'
    .observatory == null
    and .burstObservatory == null
    and ([ .routing.balancers[]? | select(needs_observatory) ] | length > 0)
  ' "$XRAY_CONFIG_FILE" >/dev/null 2>&1
}

api_write_observatory_config() {
  local xray_api_config selectors observatory_probe_url observatory_probe_interval

  log_info "Writing observatory configuration for balancers..."
  mkdir -p /opt/etc/xray/xrayui

  xray_api_config=$(api_get_current_config)
  selectors=$(
    jq -c "$API_BALANCER_NEEDS_OBSERVATORY"'
      [ .routing.balancers[]?
        | select(needs_observatory)
        | .selector
        | if type == "string" then split(",")[] elif type == "array" then .[] else empty end
        | strings ]
      | unique
    ' "$XRAY_CONFIG_FILE"
  ) || return 1
  observatory_probe_url=$(printf '%s' "${probe_url:-https://www.google.com/generate_204}" | jq -Rs '.')
  observatory_probe_interval=$(sanitize_probe_interval "$probe_interval")

  cat >"$xray_api_config" <<EOF
{
  "observatory": {
    "subjectSelector": $selectors,
    "probeUrl": $observatory_probe_url,
    "probeInterval": "${observatory_probe_interval}s",
    "enableConcurrency": true
  }
}
EOF
}

api_config_required() {
  [ "$check_connection" = "true" ] || [ "$clients_check" = "true" ] || api_balancers_need_observatory
}

api_apply_configuration() {
  load_xrayui_config

  if ! api_config_required; then
    log_info "Skipping API configuration as per user settings."
    return
  fi

  if [ "$check_connection" != "true" ] && [ "$clients_check" != "true" ]; then
    api_write_observatory_config
    return
  fi

  local filter
  api_write_config

  if [ "$check_connection" = "true" ]; then
    filter='
            .routing.rules //= [] |
            (.routing.rules | map(.name=="sys:metrics") | any) as $has |
            if $has then
              .
            else
              .routing.rules = [
                {
                  "idx": 0,
                  "type": "field",
                  "name": "sys:metrics",
                  "inboundTag": ["sys:metrics_in"],
                  "outboundTag": "sys:metrics_out",
                }
              ] + .routing.rules
            end
          '
  else
    filter='
            .routing.rules //= [] |
            .routing.rules |= map(select(.name != "sys:metrics"))
          '
  fi

  jq_update_file "$XRAY_CONFIG_FILE" "$filter" ||
    log_error "Failed to update the API routing rule; $XRAY_CONFIG_FILE was left unchanged."
}
