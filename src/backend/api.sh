#!/bin/sh
# shellcheck shell=sh disable=SC2034   # tell shellcheck we really want POSIX sh

api_get_current_config() {
  local xray_config_name=$(basename "$XRAY_CONFIG_FILE")
  echo "/opt/etc/xray/xrayui/${xray_config_name%.json}-api.json"
}

api_write_config() {
  log_info "Writing API configuration..."
  mkdir -p /opt/etc/xray/xrayui

  local xray_api_config=$(api_get_current_config)
  local observatory_probe_url="${probe_url:-https://www.google.com/generate_204}"
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
    "probeUrl": "$observatory_probe_url",
    "probeInterval": "10s",
    "enableConcurrency": true
  },
  "metrics": { "tag": "sys:metrics_out" }
}
EOF
}

api_get_connected_clients() {
  load_xrayui_config
  api_addr=$(jq -r '.api.listen' "$(api_get_current_config)")
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
