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
  cat >"$xray_api_config" <<'EOF'
{
  "api": {
    "tag": "sys:api",
    "listen": "127.0.0.1:10085",
    "services": ["StatsService"]
  },
  "stats": {},
  "policy": {
    "levels": {
      "0": { "statsUserUplink": true, "statsUserDownlink": true }
    }
  }
}
EOF
}
