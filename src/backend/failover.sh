#!/bin/sh
# shellcheck disable=SC2034

FAILOVER_CONSECUTIVE_THRESHOLD=3
FAILOVER_MAX_SWITCHES_PER_HOUR=5

failover_check() {
    load_xrayui_config
    local subscription_auto_fallback="${subscription_auto_fallback:-false}"
    [ "$subscription_auto_fallback" = "true" ] || return 0

    # Failover requires Observatory (check_connection) for reliable health checks
    local check_connection="${check_connection:-false}"
    if [ "$check_connection" != "true" ]; then
        log_debug "Failover: check_connection is disabled - skipping (Observatory required)"
        return 0
    fi

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

    local rotated_list="/tmp/failover_rotated.$$"
    rm -f "$rotated_list"

    # Use here-doc to avoid subshell variable propagation issues
    while IFS= read -r entry; do
        [ -z "$entry" ] && continue
        local tag protocol idx active
        tag=$(printf '%s' "$entry" | jq -r '.tag')
        protocol=$(printf '%s' "$entry" | jq -r '.protocol')
        idx=$(printf '%s' "$entry" | jq -r '.idx')
        active=$(printf '%s' "$entry" | jq -r '.active')

        log_debug "Failover: checking outbound '$tag' (proto=$protocol, idx=$idx)"

        if failover_check_alive "$tag"; then
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
            printf '%s\t%s\n' "$tag" "$idx" >>"$rotated_list"
            failover_state_record_switch "$tag"
            failover_state_reset_failures "$tag"
        fi
    done <<EOF
$pool_outbounds
EOF

    if [ -f "$rotated_list" ]; then
        # Try zero-downtime API hot-swap first, fall back to full restart
        local swap_failed="false"
        local api_addr
        api_addr=$(api_get_listen_address 2>/dev/null) || swap_failed="true"

        if [ "$swap_failed" = "false" ]; then
            log_info "Failover: attempting API hot-swap (zero-downtime)"
            while IFS="$(printf '\t')" read -r swap_tag swap_idx; do
                [ -z "$swap_tag" ] && continue
                local swap_outbound
                swap_outbound=$(jq -c --arg i "$swap_idx" \
                    '.outbounds[($i | tonumber)]' "$XRAY_CONFIG_FILE")

                if ! api_swap_outbound "$swap_tag" "$swap_outbound"; then
                    swap_failed="true"
                    break
                fi
            done <"$rotated_list"
        fi

        if [ "$swap_failed" = "true" ]; then
            log_info "Failover: falling back to full restart"
            restart
        fi

        rm -f "$rotated_list"
        initial_response
    fi
}

failover_check_alive() {
    local tag="$1"

    # Use Observatory data exclusively for health checks.
    # Observatory probes through xray's actual outbound path, making it
    # the only reliable way to detect protocol-level and routing failures.
    #
    # Returns 0 (alive) or 1 (dead) via exit code — never echo,
    # because log_* functions write to stdout and would contaminate
    # any captured output.
    if [ ! -f "$XRAYUI_CONNECTION_STATUS_FILE" ]; then
        log_debug "Failover: no Observatory data yet for '$tag' - assuming alive"
        return 0
    fi

    local obs_alive
    obs_alive=$(jq -r --arg tag "$tag" '
        to_entries[]
        | select(.value.outbound_tag == $tag)
        | .value.alive // false
    ' "$XRAYUI_CONNECTION_STATUS_FILE" 2>/dev/null)

    if [ "$obs_alive" = "true" ]; then
        return 0
    elif [ "$obs_alive" = "false" ]; then
        return 1
    else
        # No Observatory entry for this tag — data not available yet
        log_debug "Failover: no Observatory entry for '$tag' - assuming alive"
        return 0
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

    # Pick the next candidate after the current active one.
    # No TCP probing — Observatory will verify the new endpoint on the
    # next cycle and rotate again if it is also dead.
    local chosen=""

    # Try to find the entry after current_active in the list
    chosen=$(printf '%s\n' "$candidates" | {
        found="false"
        while IFS= read -r link; do
            [ -z "$link" ] && continue
            if [ "$found" = "true" ]; then
                printf '%s' "$link"
                exit 0
            fi
            [ "$link" = "$current_active" ] && found="true"
        done
        exit 1
    })

    # If not found (current was last or not in list), wrap to first different candidate
    if [ -z "$chosen" ]; then
        chosen=$(printf '%s\n' "$candidates" | while IFS= read -r link; do
            [ -z "$link" ] && continue
            [ "$link" = "$current_active" ] && continue
            printf '%s' "$link"
            break
        done)
    fi

    if [ -z "$chosen" ]; then
        log_warn "Failover: no alternative candidates for '$tag'"
        return 1
    fi

    log_info "Failover: switching '$tag' to next candidate"

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
