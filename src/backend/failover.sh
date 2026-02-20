#!/bin/sh
# shellcheck disable=SC2034

FAILOVER_CONSECUTIVE_THRESHOLD=3
FAILOVER_MAX_SWITCHES_PER_HOUR=5

failover_check() {
    load_xrayui_config
    local subscription_auto_fallback="${subscription_auto_fallback:-false}"
    [ "$subscription_auto_fallback" = "true" ] || return 0

    [ -f "$XRAYUI_SUBSCRIPTIONS_FILE" ] || return 0
    [ -f "$XRAY_CONFIG_FILE" ] || return 0
    [ -f "$XRAY_PIDFILE" ] || return 0

    # Initialize state file if missing
    [ -f "$XRAYUI_FAILOVER_STATE_FILE" ] || echo '{}' >"$XRAYUI_FAILOVER_STATE_FILE"

    # Find all outbounds with subPool.enabled=true
    local pool_outbounds
    pool_outbounds=$(jq -c '
        .outbounds | to_entries[]
        | select(.value.subPool.enabled == true)
        | {idx: .key, tag: .value.tag, protocol: .value.protocol, active: (.value.subPool.active // "")}
    ' "$XRAY_CONFIG_FILE" 2>/dev/null)

    [ -z "$pool_outbounds" ] && return 0

    local needs_restart_flag="/tmp/failover_needs_restart.$$"
    rm -f "$needs_restart_flag"

    # Use here-doc to avoid subshell variable propagation issues
    while IFS= read -r entry; do
        [ -z "$entry" ] && continue
        local tag protocol idx active
        tag=$(printf '%s' "$entry" | jq -r '.tag')
        protocol=$(printf '%s' "$entry" | jq -r '.protocol')
        idx=$(printf '%s' "$entry" | jq -r '.idx')
        active=$(printf '%s' "$entry" | jq -r '.active')

        log_debug "Failover: checking outbound '$tag' (proto=$protocol, idx=$idx)"

        local is_alive
        is_alive=$(failover_check_alive "$tag" "$active")

        if [ "$is_alive" = "true" ]; then
            failover_state_reset_failures "$tag"
            continue
        fi

        local failures
        failures=$(failover_state_increment_failures "$tag")
        log_warn "Failover: outbound '$tag' failed check ($failures consecutive)"

        if [ "$failures" -lt "$FAILOVER_CONSECUTIVE_THRESHOLD" ]; then
            continue
        fi

        if ! failover_circuit_breaker_ok "$tag"; then
            log_warn "Failover: circuit breaker tripped for '$tag' - skipping rotation"
            continue
        fi

        log_info "Failover: rotating outbound '$tag' after $failures consecutive failures"
        if failover_rotate_outbound "$tag" "$protocol" "$idx" "$active"; then
            touch "$needs_restart_flag"
            failover_state_record_switch "$tag"
            failover_state_reset_failures "$tag"
        fi
    done <<EOF
$pool_outbounds
EOF

    if [ -f "$needs_restart_flag" ]; then
        rm -f "$needs_restart_flag"
        log_info "Failover: restarting Xray after rotation"
        restart
    fi
}

failover_check_alive() {
    local tag="$1"
    local active_link="$2"

    # Strategy 1: Use Observatory if check_connection is enabled
    local check_connection="${check_connection:-false}"
    if [ "$check_connection" = "true" ] && [ -f "$XRAYUI_CONNECTION_STATUS_FILE" ]; then
        local obs_alive
        obs_alive=$(jq -r --arg tag "$tag" '
            to_entries[]
            | select(.value.outbound_tag == $tag)
            | .value.alive
        ' "$XRAYUI_CONNECTION_STATUS_FILE" 2>/dev/null)

        if [ "$obs_alive" = "true" ]; then
            echo "true"
            return
        elif [ "$obs_alive" = "false" ]; then
            echo "false"
            return
        fi
    fi

    # Strategy 2: TCP probe the active endpoint
    if [ -n "$active_link" ] && [ "$active_link" != "null" ] && [ "$active_link" != "" ]; then
        local host port
        host=$(failover_parse_host "$active_link")
        port=$(failover_parse_port "$active_link")
        if [ -n "$host" ] && [ -n "$port" ]; then
            if failover_probe_tcp "$host" "$port"; then
                echo "true"
                return
            fi
        fi
    fi

    echo "false"
}

failover_probe_tcp() {
    local host="$1"
    local port="$2"
    nc -z -w 5 "$host" "$port" >/dev/null 2>&1
}

failover_parse_host() {
    local link="$1"
    # Strip protocol prefix, get user@host:port part, extract host
    local hostport
    hostport=$(printf '%s' "$link" | sed 's|^[a-z0-9]*://||' | awk -F@ '{print $NF}' | awk -F/ '{print $1}' | awk -F'?' '{print $1}')
    # Handle IPv6 [host]:port
    if printf '%s' "$hostport" | grep -q '^\['; then
        printf '%s' "$hostport" | sed 's/^\[\(.*\)\].*/\1/'
    else
        printf '%s' "$hostport" | sed 's/:[0-9]*$//'
    fi
}

failover_parse_port() {
    local link="$1"
    local hostport
    hostport=$(printf '%s' "$link" | sed 's|^[a-z0-9]*://||' | awk -F@ '{print $NF}' | awk -F/ '{print $1}' | awk -F'?' '{print $1}')
    # Handle IPv6 [host]:port
    if printf '%s' "$hostport" | grep -q '^\['; then
        printf '%s' "$hostport" | sed 's/^.*\]://'
    else
        printf '%s' "$hostport" | awk -F: '{print $NF}'
    fi
}

failover_rotate_outbound() {
    local tag="$1"
    local protocol="$2"
    local idx="$3"
    local current_active="$4"

    # Get all links for this protocol from subscriptions
    local candidates
    candidates=$(jq -r --arg proto "$protocol" '.[$proto] // [] | .[]' "$XRAYUI_SUBSCRIPTIONS_FILE" 2>/dev/null)
    [ -z "$candidates" ] && { log_warn "Failover: no candidates for protocol=$protocol"; return 1; }

    # Get recently failed endpoints from state
    local failed_list
    failed_list=$(jq -r --arg tag "$tag" '.[$tag].failed_endpoints // [] | .[]' "$XRAYUI_FAILOVER_STATE_FILE" 2>/dev/null)

    # Build list of viable candidates (filtering out current + failed)
    local viable_file="/tmp/failover_viable.$$"
    : >"$viable_file"
    printf '%s\n' "$candidates" | while IFS= read -r link; do
        [ -z "$link" ] && continue
        [ "$link" = "$current_active" ] && continue
        if [ -n "$failed_list" ] && printf '%s\n' "$failed_list" | grep -qF "$link"; then
            continue
        fi
        printf '%s\n' "$link" >>"$viable_file"
    done

    # Probe each viable candidate
    local chosen=""
    while IFS= read -r link; do
        [ -z "$link" ] && continue
        local host port
        host=$(failover_parse_host "$link")
        port=$(failover_parse_port "$link")
        log_debug "Failover: probing candidate $host:$port"
        if failover_probe_tcp "$host" "$port"; then
            chosen="$link"
            break
        else
            failover_state_add_failed "$tag" "$link"
        fi
    done <"$viable_file"
    rm -f "$viable_file"

    if [ -z "$chosen" ]; then
        log_warn "Failover: all candidates exhausted for '$tag'; clearing failed list for next cycle"
        failover_state_clear_failed "$tag"
        return 1
    fi

    log_info "Failover: rotating '$tag' to $(failover_parse_host "$chosen"):$(failover_parse_port "$chosen")"

    # Parse the chosen link into an outbound JSON object
    # Reuses existing parser from subscriptions.sh
    local new_outbound
    new_outbound=$(subscription_parse_link_to_outbound "$chosen")
    [ -z "$new_outbound" ] && { log_error "Failover: failed to parse chosen link"; return 1; }

    # Merge into config preserving tag, position, sockopt, subPool
    local cfg
    cfg=$(cat "$XRAY_CONFIG_FILE")
    cfg=$(printf '%s' "$cfg" | jq -c \
        --arg pos "$idx" \
        --arg tag "$tag" \
        --arg chosen "$chosen" \
        --argjson rep "$new_outbound" '
            ($pos | tonumber) as $i
            | (try .outbounds[$i].streamSettings.sockopt catch null) as $sock
            | (try .outbounds[$i].subPool catch null) as $pool
            | .outbounds[$i] = (
                ($rep + {tag: $tag})
                | .subPool = (($pool // {}) + {active: $chosen, enabled: true})
                | if $sock != null
                    then .streamSettings = ((.streamSettings // {}) + {sockopt: $sock})
                    else .
                    end
            )')

    local temp_config="/tmp/xray_failover_config.$$"
    printf '%s' "$cfg" >"$temp_config" && cp "$temp_config" "$XRAY_CONFIG_FILE" && rm -f "$temp_config"

    return 0
}

# --- State management functions ---

failover_state_increment_failures() {
    local tag="$1"
    local state current
    state=$(cat "$XRAYUI_FAILOVER_STATE_FILE")
    current=$(printf '%s' "$state" | jq -r --arg t "$tag" '.[$t].consecutive_failures // 0')
    current=$((current + 1))
    printf '%s' "$state" | jq --arg t "$tag" --argjson c "$current" \
        'if .[$t] == null then .[$t] = {} else . end | .[$t].consecutive_failures = $c' >"$XRAYUI_FAILOVER_STATE_FILE"
    echo "$current"
}

failover_state_reset_failures() {
    local tag="$1"
    [ -f "$XRAYUI_FAILOVER_STATE_FILE" ] || return 0
    local state
    state=$(cat "$XRAYUI_FAILOVER_STATE_FILE")
    printf '%s' "$state" | jq --arg t "$tag" \
        'if .[$t] != null then .[$t].consecutive_failures = 0 else . end' >"$XRAYUI_FAILOVER_STATE_FILE"
}

failover_state_record_switch() {
    local tag="$1"
    local now
    now=$(date +%s)
    local state
    state=$(cat "$XRAYUI_FAILOVER_STATE_FILE")
    printf '%s' "$state" | jq --arg t "$tag" --argjson now "$now" '
        if .[$t] == null then .[$t] = {} else . end
        | .[$t].last_switch = $now
        | .[$t].switches_this_hour = ((.[$t].switches_this_hour // 0) + 1)
    ' >"$XRAYUI_FAILOVER_STATE_FILE"
}

failover_state_add_failed() {
    local tag="$1"
    local link="$2"
    local state
    state=$(cat "$XRAYUI_FAILOVER_STATE_FILE")
    printf '%s' "$state" | jq --arg t "$tag" --arg l "$link" '
        if .[$t] == null then .[$t] = {} else . end
        | .[$t].failed_endpoints = ((.[$t].failed_endpoints // []) + [$l] | unique)
    ' >"$XRAYUI_FAILOVER_STATE_FILE"
}

failover_state_clear_failed() {
    local tag="$1"
    local state
    state=$(cat "$XRAYUI_FAILOVER_STATE_FILE")
    printf '%s' "$state" | jq --arg t "$tag" \
        'if .[$t] != null then .[$t].failed_endpoints = [] else . end' >"$XRAYUI_FAILOVER_STATE_FILE"
}

failover_circuit_breaker_ok() {
    local tag="$1"
    local now last_switch switches elapsed
    now=$(date +%s)
    local state
    state=$(cat "$XRAYUI_FAILOVER_STATE_FILE")
    last_switch=$(printf '%s' "$state" | jq -r --arg t "$tag" '.[$t].last_switch // 0')
    switches=$(printf '%s' "$state" | jq -r --arg t "$tag" '.[$t].switches_this_hour // 0')

    elapsed=$((now - last_switch))
    if [ "$elapsed" -gt 3600 ]; then
        # Reset counter after 1 hour
        printf '%s' "$state" | jq --arg t "$tag" \
            'if .[$t] != null then .[$t].switches_this_hour = 0 else . end' >"$XRAYUI_FAILOVER_STATE_FILE"
        return 0
    fi

    if [ "$switches" -ge "$FAILOVER_MAX_SWITCHES_PER_HOUR" ]; then
        return 1
    fi
    return 0
}
