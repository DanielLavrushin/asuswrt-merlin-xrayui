#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

#!/bin/sh
# shellcheck disable=SC2034

get_connected_clients() {
    load_xrayui_config
    api_addr=$(jq -r '.api.listen' "$(api_get_current_config)")
    stats_json="/opt/share/xrayui/xray_stats.json" # keep paths consistent
    out_json="/tmp/xray_clients_online.json"

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
        (.stat // [])                                  # null → []
        | map(select((.value // 0) | tonumber > 0))    # traffic this window
        | map(.name | split(">>>")[1])                 # e-mail
        | unique
        | map({ ip:"", email:[.] })
    ' "$stats_json" >"$out_json"

    mv "$out_json" "$XRAYUI_CLIENTS_FILE"
    cat "$XRAYUI_CLIENTS_FILE"
}
