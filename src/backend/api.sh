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

# Hot-swap an outbound: remove old, add replacement.
# $1 = tag to replace
# $2 = full outbound JSON (subPool/surl will be stripped for the API call)
api_swap_outbound() {
  local tag="$1"
  local outbound_json="$2"

  api_remove_outbound "$tag" || return 1
  api_add_outbound "$outbound_json" || return 1
  log_info "API: hot-swapped outbound '$tag'"
}

api_write_config() {
  log_info "Writing API configuration..."
  mkdir -p /opt/etc/xray/xrayui

  local xray_api_config=$(api_get_current_config)
  local observatory_probe_url
  observatory_probe_url=$(printf '%s' "${probe_url:-https://www.google.com/generate_204}" | jq -Rs '.')
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
    "probeInterval": "10s",
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

api_get_connection_status() {
  local cfg api_addr host port url observatory

  load_xrayui_config

  cfg=$(api_get_current_config)

  host=$(jq -r '
    .inbounds[]
    | select(.tag == "sys:metrics_in")
    | .listen
  ' "$cfg")
  port=$(jq -r '
    .inbounds[]
    | select(.tag == "sys:metrics_in")
    | .port
  ' "$cfg")

  api_addr="${host}:${port}"
  url="http://${api_addr}/debug/vars"

  if ! curl -fsS "$url" |
    jq '.observatory' \
      >"$XRAYUI_CONNECTION_STATUS_FILE"; then
    log_error "Failed to fetch or parse observatory from $url"
    return 1
  fi
}

api_apply_configuration() {
  load_xrayui_config

  if [ "$check_connection" = "false" ] && [ "$clients_check" = "false" ]; then
    log_info "Skipping API configuration as per user settings."
    return
  fi

  local json_content=$(cat "$XRAY_CONFIG_FILE")
  api_write_config

  if [ "$check_connection" = "true" ]; then
    json_content=$(
      echo "$json_content" |
        jq '
            # ensure rules exists
            .routing.rules //= [] |
            # check if already present
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
    )
  else
    json_content=$(
      echo "$json_content" |
        jq '
            .routing.rules //= [] |
            .routing.rules |= map(select(.name != "sys:metrics"))
          '
    )
  fi

  echo "$json_content" >"$XRAY_CONFIG_FILE"
}
