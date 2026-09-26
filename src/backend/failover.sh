#!/bin/sh
# shellcheck disable=SC2034

FAILOVER_CONSECUTIVE_THRESHOLD=3
FAILOVER_MAX_SWITCHES_PER_HOUR=10
FAILOVER_MAX_TRIES_PER_RUN=3
FAILOVER_MAX_EVALUATED=20
FAILOVER_FAILED_TTL=21600
FAILOVER_PROBE_GRACE=6
FAILOVER_STATE="{}"

failover_check() {
    load_xrayui_config
    [ "${subscription_auto_fallback:-false}" = "true" ] || return 0

    if [ "${check_connection:-false}" != "true" ]; then
        log_debug "Failover: check_connection is disabled - skipping (Observatory required)"
        return 0
    fi

    [ -s "$XRAYUI_SUBSCRIPTIONS_FILE" ] || return 0
    [ -f "$XRAY_CONFIG_FILE" ] || return 0
    if [ -z "$(get_xray_daemon_pid)" ]; then
        log_debug "Failover: Xray is not running - skipping"
        return 0
    fi

    local wan
    wan=$(nvram get link_internet 2>/dev/null)
    if [ -n "$wan" ] && [ "$wan" != "2" ]; then
        log_warn "Failover: the router reports no internet connection - not counting failures"
        return 0
    fi

    local tags
    tags=$(jq -r '.outbounds[]? | select(.subPool.enabled == true and ((.surl // "") == "") and ((.tag // "") != "")) | .tag' "$XRAY_CONFIG_FILE" 2>/dev/null)
    if [ -z "$tags" ]; then
        log_debug "Failover: no outbound has the auto-fallback pool enabled"
        return 0
    fi

    local obs
    if ! obs=$(api_fetch_observatory); then
        log_warn "Failover: Observatory data is unavailable - skipping this check"
        return 0
    fi

    failover_state_load
    while IFS= read -r tag; do
        [ -z "$tag" ] && continue
        failover_evaluate "$tag" "$obs"
    done <<EOF
$tags
EOF
    failover_state_save
}

failover_probe_info() {
    printf '%s' "$2" | jq -r --arg t "$1" '
        [.[]? | select(.outbound_tag == $t)] | first
        | if . == null then "none 0"
          else "\(if .alive == true then "up" else "down" end) \(.last_try_time // 0)"
          end' 2>/dev/null
}

failover_evaluate() {
    local tag="$1"
    local obs="$2"
    local info alive try vals last_obs last_switch verified failures

    info=$(failover_probe_info "$tag" "$obs")
    alive="${info% *}"
    try="${info##* }"
    case "$try" in '' | *[!0-9]*) try=0 ;; esac
    if [ "$alive" != "up" ] && [ "$alive" != "down" ]; then
        log_debug "Failover: no Observatory result for '$tag' yet"
        return 0
    fi

    vals=$(failover_state_jq -r --arg t "$tag" '
        (.[$t] // {}) | "\(.last_obs // 0) \(.last_switch // 0) \(.verified != false) \(.consecutive_failures // 0)"')
    set -- $vals
    last_obs="${1:-0}"
    last_switch="${2:-0}"
    verified="${3:-true}"
    failures="${4:-0}"

    if [ "$try" -le $((last_switch + FAILOVER_PROBE_GRACE)) ] || [ "$try" -le "$last_obs" ]; then
        return 0
    fi

    if [ "$alive" = "up" ]; then
        failover_state_update --arg t "$tag" --argjson try "$try" '
            .[$t] = ((.[$t] // {}) | .last_obs = $try | .consecutive_failures = 0 | .verified = true)'
        return 0
    fi

    failures=$((failures + 1))
    failover_state_update --arg t "$tag" --argjson try "$try" --argjson f "$failures" '
        .[$t] = ((.[$t] // {}) | .last_obs = $try | .consecutive_failures = $f)'

    if [ "$verified" = "false" ]; then
        log_warn "Failover: outbound '$tag' did not come up after the last switch"
    elif [ "$failures" -lt "$FAILOVER_CONSECUTIVE_THRESHOLD" ]; then
        log_warn "Failover: outbound '$tag' failed check ($failures consecutive)"
        return 0
    else
        log_info "Failover: rotating outbound '$tag' after $failures consecutive failures"
    fi

    failover_rotate "$tag" </dev/null
}

failover_rotate() {
    local tag="$1"
    local tries=0

    while [ "$tries" -lt "$FAILOVER_MAX_TRIES_PER_RUN" ]; do
        if ! failover_breaker_ok "$tag"; then
            log_warn "Failover: '$tag' was switched $FAILOVER_MAX_SWITCHES_PER_HOUR times within the last hour - pausing rotation"
            return 0
        fi
        failover_switch_next "$tag" || return 0
        failover_state_save
        tries=$((tries + 1))

        failover_wait_verdict "$tag"
        case "$?" in
        0)
            log_ok "Failover: outbound '$tag' is up on the new endpoint"
            return 0
            ;;
        1)
            log_warn "Failover: the new endpoint of '$tag' is down as well"
            ;;
        *)
            return 0
            ;;
        esac
    done
}

failover_wait_verdict() {
    local tag="$1"
    local interval switch_at deadline obs info alive try

    interval=$(sanitize_probe_interval "$probe_interval")
    [ "$interval" -le 60 ] || return 2
    switch_at=$(failover_state_jq -r --arg t "$tag" '.[$t].last_switch // 0')
    deadline=$(($(date +%s) + interval + 15))

    while [ "$(date +%s)" -lt "$deadline" ]; do
        sleep 5
        obs=$(api_fetch_observatory) || continue
        info=$(failover_probe_info "$tag" "$obs")
        alive="${info% *}"
        try="${info##* }"
        case "$try" in '' | *[!0-9]*) continue ;; esac
        [ "$try" -gt $((switch_at + FAILOVER_PROBE_GRACE)) ] || continue

        if [ "$alive" = "up" ]; then
            failover_state_update --arg t "$tag" --argjson try "$try" '
                .[$t] = ((.[$t] // {}) | .last_obs = $try | .consecutive_failures = 0 | .verified = true)'
            return 0
        fi
        if [ "$alive" = "down" ]; then
            failover_state_update --arg t "$tag" --argjson try "$try" '
                .[$t] = ((.[$t] // {}) | .last_obs = $try | .consecutive_failures = 1)'
            return 1
        fi
    done
    return 2
}

failover_switch_next() {
    local tag="$1"
    local now current proto active origin cur_hp pool candidates others_ids others_hps failed chosen
    local link id hp rep merged pass locals tried evaluated
    chosen=""

    now=$(date +%s)
    current=$(jq -c --arg t "$tag" 'first(.outbounds[]? | select(.tag == $t)) // empty' "$XRAY_CONFIG_FILE" 2>/dev/null)
    [ -n "$current" ] || return 1

    proto=$(printf '%s' "$current" | jq -r '.protocol // ""')
    active=$(printf '%s' "$current" | jq -r '.subPool.active // ""')
    origin=$(printf '%s' "$current" | jq -r '.subPool.origin // ""')
    cur_hp=$(printf '%s' "$current" | jq -r '
        (.settings.vnext[0] // .settings.servers[0] // .settings // {}) as $s
        | if ($s.address // "") == "" then "" else "\($s.address):\($s.port // "")" | ascii_downcase end')

    pool=$(jq -r --arg p "$proto" '.[$p] // [] | .[]' "$XRAYUI_SUBSCRIPTIONS_FILE" 2>/dev/null)
    if [ -z "${pool:+1}" ]; then
        log_warn "Failover: the subscription pool has no $proto links for '$tag'"
        failover_request_pool_refresh "$now"
        return 1
    fi
    pool=$(failover_filter_candidates "$pool")

    others_ids=$(jq -r --arg t "$tag" '.outbounds[]? | select(.tag != $t) | (.subPool.active // empty) | (split("#") | .[0] // "")' "$XRAY_CONFIG_FILE" 2>/dev/null)
    others_hps=$(jq -r --arg t "$tag" '
        .outbounds[]? | select(.tag != $t)
        | (.settings.vnext[0] // .settings.servers[0] // .settings // {}) as $s
        | select(($s.address // "") != "")
        | "\($s.address):\($s.port // "")" | ascii_downcase' "$XRAY_CONFIG_FILE" 2>/dev/null)

    failover_state_update --arg t "$tag" --argjson now "$now" --argjson ttl "$FAILOVER_FAILED_TTL" '
        if .[$t].failed then .[$t].failed |= with_entries(select(.value > ($now - $ttl))) else . end'
    failed=$(failover_state_jq -r --arg t "$tag" '(.[$t].failed // {}) | keys[]')

    candidates=$(failover_order_candidates "$pool" "$active" "$origin" "$cur_hp")
    locals=$(subscription_local_addresses)
    tried=""
    evaluated=0

    for pass in strict shared; do
        while IFS= read -r link; do
            [ -z "$link" ] && continue
            id="${link%%#*}"
            [ "$id" = "${active%%#*}" ] && continue
            failover_list_has "$failed" "$id" && continue
            failover_list_has "$tried" "$id" && continue
            if [ "$pass" = "strict" ]; then
                failover_list_has "$others_ids" "$id" && continue
                hp=$(failover_link_hostport "$link")
                [ -n "$hp" ] && failover_list_has "$others_hps" "$hp" && continue
            fi
            if [ "$evaluated" -ge "$FAILOVER_MAX_EVALUATED" ]; then
                log_warn "Failover: checked $evaluated endpoints for '$tag' without a usable one - continuing on the next check"
                return 1
            fi
            evaluated=$((evaluated + 1))
            tried="$tried
$id"

            if ! rep=$(subscription_parse_link_to_outbound "$link") || [ -z "$rep" ]; then
                log_warn "Failover: skipping a $proto link that could not be parsed"
                failover_mark_failed "$tag" "$id" "$now"
                continue
            fi
            if subscription_outbound_is_unusable "$rep" "$locals"; then
                log_debug "Failover: skipping a placeholder entry or one that points at this router"
                failover_mark_failed "$tag" "$id" "$now"
                continue
            fi
            merged=$(failover_merge_outbound "$current" "$rep" "$link" "$tag")
            if [ -z "$merged" ] || ! failover_validate_outbound "$merged"; then
                log_warn "Failover: skipping a $proto link that the installed Xray core rejects"
                failover_mark_failed "$tag" "$id" "$now"
                continue
            fi
            if ! failover_tcp_precheck "$merged"; then
                log_warn "Failover: skipping an endpoint that does not accept connections"
                failover_mark_failed "$tag" "$id" "$now"
                continue
            fi

            chosen="$link"
            break
        done <<EOF
$candidates
EOF
        [ -n "$chosen" ] && break
    done

    if [ -z "$chosen" ]; then
        if [ -n "${failed:+1}" ]; then
            log_warn "Failover: every endpoint in the pool failed recently for '$tag' - clearing the failed list"
            failover_state_update --arg t "$tag" --argjson now "$now" '
                .[$t] = ((.[$t] // {}) | .failed = ((.failed // {}) | with_entries(select(.value >= $now))))'
        else
            log_warn "Failover: no alternative endpoint for '$tag'"
        fi
        failover_request_pool_refresh "$now"
        return 1
    fi

    log_info "Failover: switching '$tag' to $(failover_link_label "$chosen")"
    if ! failover_apply_outbound "$tag" "$merged"; then
        failover_mark_failed "$tag" "$id" "$now"
        return 1
    fi

    now=$(date +%s)
    failover_state_update --arg t "$tag" --argjson now "$now" --arg old "${active%%#*}" '
        .[$t] = ((.[$t] // {})
            | .last_switch = $now
            | .switch_times = (((.switch_times // []) | map(select(. > ($now - 3600)))) + [$now])
            | .consecutive_failures = 0
            | .verified = false
            | del(.switches_this_hour)
            | if $old != "" then .failed = ((.failed // {}) + {($old): $now}) else . end)'
    return 0
}

failover_order_candidates() {
    local pool="$1"
    local active="$2"
    local origin="$3"
    local cur_hp="$4"
    local origin_id="${origin%%#*}"

    if [ -n "$origin_id" ] && [ "$origin_id" != "${active%%#*}" ]; then
        while IFS= read -r l; do
            [ "${l%%#*}" = "$origin_id" ] && printf '%s\n' "$l" && break
        done <<EOF
$pool
EOF
    fi

    awk -v aid="${active%%#*}" -v ahp="$cur_hp" '
        function hostport(s,    m, parts) {
            sub(/#.*/, "", s)
            sub(/^[^:]*:\/\//, "", s)
            sub(/[?].*/, "", s)
            sub(/\/.*/, "", s)
            m = split(s, parts, "@")
            return tolower(parts[m])
        }
        NF {
            n++
            links[n] = $0
            id = $0
            sub(/#.*/, "", id)
            hps[n] = hostport($0)
            if (!start && id == aid) start = n
        }
        END {
            if (!start && ahp != "") for (i = 1; i <= n; i++) if (hps[i] == ahp) { start = i; break }
            for (j = 1; j <= n; j++) { i = ((start + j - 1) % n) + 1; if (hps[i] != ahp) print links[i] }
            for (j = 1; j <= n; j++) { i = ((start + j - 1) % n) + 1; if (hps[i] == ahp) print links[i] }
        }' <<EOF
$pool
EOF
}

failover_link_hostport() {
    printf '%s\n' "$1" | awk '{
        s = $0
        sub(/#.*/, "", s)
        sub(/^[^:]*:\/\//, "", s)
        sub(/[?].*/, "", s)
        sub(/\/.*/, "", s)
        m = split(s, parts, "@")
        print tolower(parts[m])
    }'
}

failover_list_has() {
    [ -n "${1:+1}" ] && grep -qxF -- "$2" <<EOF
$1
EOF
}

failover_link_label() {
    local link="$1"
    local frag h
    case "$link" in
    vmess://*)
        h="${link#vmess://}"
        subscription_b64d "${h%%#*}" | jq -r '.ps // empty' 2>/dev/null | tr '\t\n' '  '
        return 0
        ;;
    esac
    frag=$(subscription_link_fragment "$link")
    if [ -n "$frag" ]; then
        urldecode "$frag" | tr '\t\n' '  '
        return 0
    fi
    case "$link" in
    *@*)
        h="${link#*@}"
        printf '%s' "${h%%[/?#]*}"
        ;;
    esac
}

failover_filter_candidates() {
    local list="$1"
    local filters="${subscription_filters:-}"
    local labeled matched

    if [ -z "$filters" ]; then
        cat <<EOF
$list
EOF
        return 0
    fi

    labeled=$(
        while IFS= read -r link; do
            [ -z "$link" ] && continue
            printf '%s\t%s\n' "$(failover_link_label "$link")" "$link"
        done <<EOF
$list
EOF
    )
    matched=$(jq -Rrs --arg f "$filters" '
        def lc: explode | map(
            if (. >= 65 and . <= 90) or (. >= 192 and . <= 222 and . != 215) or (. >= 913 and . <= 939 and . != 930) or (. >= 1040 and . <= 1071) then . + 32
            elif . >= 1024 and . <= 1039 then . + 80
            elif ((. >= 256 and . <= 311) or (. >= 330 and . <= 375)) and . % 2 == 0 and . != 304 then . + 1
            elif ((. >= 313 and . <= 328) or (. >= 377 and . <= 382)) and . % 2 == 1 then . + 1
            elif . == 376 then 255
            elif . == 902 then 940
            elif . >= 904 and . <= 906 then . + 37
            elif . == 908 then 972
            elif . == 910 or . == 911 then . + 63
            else . end) | implode;
        def ws: . == " " or . == "\t" or . == "\n" or . == "\r";
        def trimws: if length == 0 then . elif (.[0:1] | ws) then .[1:] | trimws elif (.[-1:] | ws) then .[:-1] | trimws else . end;
        ($f | split("|") | map(trimws | lc) | map(select(length > 0))) as $p
        | split("\n")[]
        | select(length > 0)
        | split("\t") as $x
        | ($x[0] | lc) as $lbl
        | select(any($p[]; . as $q | $lbl | contains($q)))
        | $x[1:] | join("\t")' 2>/dev/null <<EOF
$labeled
EOF
    )

    if [ -n "${matched:+1}" ]; then
        cat <<EOF
$matched
EOF
    else
        log_warn "Failover: no pool entry matches the rotation filters - using the whole pool" >&2
        cat <<EOF
$list
EOF
    fi
}

failover_merge_outbound() {
    printf '%s' "$1" | jq -c --argjson rep "$2" --arg link "$3" --arg t "$4" '
        . as $o
        | ($o | del(.settings, .streamSettings, .protocol, .subPool, .surl, .tag)) as $keep
        | ($keep + $rep + {tag: $t})
        | .subPool = (($o.subPool // {}) + {enabled: true, active: $link})
        | if (.subPool.origin // "") == "" and ($o.subPool.active // "") != "" and $o.subPool.active != $link
            then .subPool.origin = $o.subPool.active
            else .
          end
        | if ($o.streamSettings.sockopt // null) != null
            then .streamSettings = ((.streamSettings // {}) + {sockopt: $o.streamSettings.sockopt})
            else .
          end
        | (($o.streamSettings.network // "tcp") == (.streamSettings.network // "tcp")) as $samenet
        | if $samenet and ($o.streamSettings.finalmask.tcp // null) != null and (.streamSettings.finalmask.tcp // null) == null
            then .streamSettings.finalmask = ((.streamSettings.finalmask // {}) + {tcp: $o.streamSettings.finalmask.tcp})
            else .
          end
        | if $samenet and ($o.streamSettings.xhttpSettings.extra // null) != null and (.streamSettings.xhttpSettings.extra // null) == null
            then .streamSettings.xhttpSettings.extra = ($o.streamSettings.xhttpSettings.extra | del(.downloadSettings))
            else .
          end' 2>/dev/null
}

failover_validate_outbound() {
    local tmp="/tmp/xrayui_fo_test.$$.json"
    local rc
    printf '%s' "$1" | jq -c '{outbounds: [del(.subPool, .surl)]}' >"$tmp" 2>/dev/null || {
        rm -f "$tmp"
        return 1
    }
    xray run -test -config "$tmp" >/dev/null 2>&1
    rc=$?
    rm -f "$tmp"
    return "$rc"
}

failover_tcp_precheck() {
    local info net rest host port out rc
    info=$(printf '%s' "$1" | jq -r '
        (.settings.vnext[0] // .settings.servers[0] // .settings // {}) as $s
        | if (.streamSettings.sockopt.dialerProxy // .streamSettings.sockopt.interface // .sendThrough // .proxySettings.tag // null) != null
            then "skip"
          elif ((.streamSettings.tlsSettings.alpn // []) | index("h3")) != null
            then "skip"
          else "\(.streamSettings.network // "tcp") \($s.address // "") \($s.port // 0)"
          end' 2>/dev/null)
    case "$info" in '' | skip) return 0 ;; esac
    net="${info%% *}"
    rest="${info#* }"
    host="${rest% *}"
    port="${rest##* }"
    case "$net" in tcp | raw | ws | grpc | httpupgrade | xhttp) ;; *) return 0 ;; esac
    [ -n "$host" ] || return 0
    case "$host" in *:*) host="[$host]" ;; esac
    which curl >/dev/null 2>&1 || return 0

    out=$(curl -sk -o /dev/null -w '%{time_connect}' --connect-timeout 3 --max-time 4 "https://$host:$port/" </dev/null 2>/dev/null)
    rc=$?
    [ "$rc" -eq 6 ] && return 0
    case "$out" in *[1-9]*) return 0 ;; esac
    return 1
}

failover_config_lock() {
    local waited=0
    touch "$XRAY_RESTART_LOCKFILE" 2>/dev/null || return 0
    eval exec "$XRAY_RESTART_LOCK_FD>$XRAY_RESTART_LOCKFILE"
    while ! flock -n "$XRAY_RESTART_LOCK_FD"; do
        if [ "$waited" -ge 60 ]; then
            eval exec "$XRAY_RESTART_LOCK_FD>&-"
            return 1
        fi
        sleep 2
        waited=$((waited + 2))
    done
}

failover_config_unlock() {
    eval exec "$XRAY_RESTART_LOCK_FD>&-"
}

failover_write_outbound() {
    local tag="$1"
    local ob="$2"
    local tmp="$XRAY_CONFIG_FILE.failover.$$"
    jq --arg t "$tag" --argjson ob "$ob" '.outbounds |= map(if .tag == $t then $ob else . end)' "$XRAY_CONFIG_FILE" >"$tmp" 2>/dev/null &&
        jq -e '.outbounds | type == "array"' "$tmp" >/dev/null 2>&1 &&
        mv -f "$tmp" "$XRAY_CONFIG_FILE"
    local rc=$?
    rm -f "$tmp"
    return "$rc"
}

failover_apply_outbound() {
    local tag="$1"
    local ob="$2"
    local previous

    if ! failover_config_lock; then
        log_warn "Failover: the configuration is busy - trying again on the next check"
        return 1
    fi

    previous=$(jq -c --arg t "$tag" 'first(.outbounds[]? | select(.tag == $t)) // empty' "$XRAY_CONFIG_FILE" 2>/dev/null)
    if [ -z "$previous" ] || ! failover_write_outbound "$tag" "$ob"; then
        failover_config_unlock
        log_error "Failover: could not update outbound '$tag' in $XRAY_CONFIG_FILE"
        return 1
    fi

    if api_swap_outbound "$tag" "$ob" "$previous"; then
        failover_config_unlock
        return 0
    fi

    failover_config_unlock
    log_info "Failover: hot-swap failed - restarting Xray"
    restart
    if [ -n "$(get_xray_daemon_pid)" ]; then
        return 0
    fi

    log_error "Failover: Xray did not start with the new endpoint of '$tag' - restoring the previous one"
    if failover_config_lock; then
        failover_write_outbound "$tag" "$previous"
        failover_config_unlock
    fi
    restart
    return 1
}

failover_request_pool_refresh() {
    local now="$1"
    local last
    [ -n "${subscriptionLinks:-}" ] || return 0
    last=$(failover_state_jq -r '._pool_refresh // 0')
    [ $((now - last)) -ge 3600 ] || return 0
    failover_state_update --argjson now "$now" '._pool_refresh = $now'
    log_info "Failover: refreshing the subscription pool"
    subscription_fetch_protocols cron >/dev/null 2>&1 || log_warn "Failover: the subscription refresh brought no usable links"
}

failover_breaker_ok() {
    failover_state_jq -e --arg t "$1" --argjson now "$(date +%s)" --argjson max "$FAILOVER_MAX_SWITCHES_PER_HOUR" '
        ((.[$t].switch_times // []) | map(select(. > ($now - 3600))) | length) < $max' >/dev/null 2>&1
}

failover_mark_failed() {
    failover_state_update --arg t "$1" --arg id "$2" --argjson now "$3" '
        .[$t] = ((.[$t] // {}) | .failed = ((.failed // {}) + {($id): $now}))'
}

failover_state_jq() {
    jq "$@" <<EOF
$FAILOVER_STATE
EOF
}

failover_state_load() {
    FAILOVER_STATE=$(cat "$XRAYUI_FAILOVER_STATE_FILE" 2>/dev/null)
    failover_state_jq -e 'type == "object"' >/dev/null 2>&1 || FAILOVER_STATE="{}"
}

failover_state_save() {
    local tmp="$XRAYUI_FAILOVER_STATE_FILE.tmp.$$"
    [ -n "${FAILOVER_STATE:+1}" ] || return 1
    cat >"$tmp" <<EOF && mv -f "$tmp" "$XRAYUI_FAILOVER_STATE_FILE"
$FAILOVER_STATE
EOF
    rm -f "$tmp"
}

failover_state_update() {
    local new
    new=$(failover_state_jq -c "$@" 2>/dev/null) && [ -n "${new:+1}" ] && FAILOVER_STATE="$new"
}

failover_resync_pool_outbounds() {
    [ "${subscription_auto_fallback:-false}" = "true" ] || return 0
    [ -s "$XRAYUI_SUBSCRIPTIONS_FILE" ] || return 0
    [ -f "$XRAY_CONFIG_FILE" ] || return 0

    local entries entry tag proto active origin pool replacement new_origin rep merged current same
    entries=$(jq -c '.outbounds[]? | select(.subPool.enabled == true and ((.surl // "") == "") and ((.tag // "") != "")) | {t: .tag, p: .protocol, a: (.subPool.active // ""), o: (.subPool.origin // "")}' "$XRAY_CONFIG_FILE" 2>/dev/null)
    [ -n "$entries" ] || return 0

    while IFS= read -r entry; do
        [ -z "$entry" ] && continue
        tag=$(printf '%s' "$entry" | jq -r '.t')
        proto=$(printf '%s' "$entry" | jq -r '.p')
        active=$(printf '%s' "$entry" | jq -r '.a')
        origin=$(printf '%s' "$entry" | jq -r '.o')
        pool=$(jq -r --arg p "$proto" '.[$p] // [] | .[]' "$XRAYUI_SUBSCRIPTIONS_FILE" 2>/dev/null)
        [ -n "${pool:+1}" ] || continue

        new_origin=""
        if [ -n "$origin" ] && ! failover_pool_has_id "$pool" "$origin"; then
            new_origin=$(failover_find_replacement "$pool" "$origin")
        fi

        replacement=""
        if [ -n "$active" ] && ! failover_pool_has_id "$pool" "$active"; then
            replacement=$(failover_find_replacement "$pool" "$active")
        fi
        [ -n "$replacement" ] || [ -n "$new_origin" ] || continue

        current=$(jq -c --arg t "$tag" 'first(.outbounds[]? | select(.tag == $t)) // empty' "$XRAY_CONFIG_FILE" 2>/dev/null)
        [ -n "$current" ] || continue

        if [ -z "$replacement" ]; then
            merged=$(printf '%s' "$current" | jq -c --arg o "$new_origin" '.subPool.origin = $o')
        else
            rep=$(subscription_parse_link_to_outbound "$replacement") || continue
            [ -n "$rep" ] || continue
            merged=$(failover_merge_outbound "$current" "$rep" "$replacement" "$tag")
            [ -n "$merged" ] || continue
            merged=$(printf '%s' "$merged" | jq -c --arg o "${new_origin:-$origin}" 'if $o == "" then del(.subPool.origin) else .subPool.origin = $o end')
            failover_validate_outbound "$merged" || continue
        fi

        same=$(jq -n --argjson a "$current" --argjson b "$merged" '
            def ident:
                (.settings.vnext[0] // .settings.servers[0] // .settings // {}) as $s
                | [.protocol, ($s.address // null), ($s.port // null),
                   ($s.users[0].id // $s.password // .streamSettings.hysteriaSettings.auth // null),
                   (.streamSettings.network // null), (.streamSettings.security // null),
                   (.streamSettings.realitySettings.publicKey // null), (.streamSettings.realitySettings.shortId // null),
                   (.streamSettings.realitySettings.serverName // .streamSettings.tlsSettings.serverName // null)];
            ($a | ident) == ($b | ident)')

        if [ "$same" = "true" ]; then
            merged=$(printf '%s' "$current" | jq -c --argjson b "$merged" '.subPool = $b.subPool')
            if [ -n "$merged" ] && failover_config_lock; then
                failover_write_outbound "$tag" "$merged"
                failover_config_unlock
            fi
            continue
        fi

        log_info "Failover: the subscription changed the endpoint of '$tag' - updating it"
        failover_apply_outbound "$tag" "$merged" </dev/null
    done <<EOF
$entries
EOF
}

failover_pool_has_id() {
    awk -v id="${2%%#*}" '{ s = $0; sub(/#.*/, "", s); if (s == id) { f = 1; exit } } END { exit !f }' <<EOF
$1
EOF
}

failover_find_replacement() {
    local pool="$1"
    local link="$2"
    local label hp

    case "$link" in
    *#*)
        label="${link#*#}"
        while IFS= read -r l; do
            case "$l" in
            *#*) [ "${l#*#}" = "$label" ] && printf '%s' "$l" && break ;;
            esac
        done <<EOF | head -n 1 | grep . && return 0
$pool
EOF
        ;;
    esac

    hp=$(failover_link_hostport "$link")
    [ -n "$hp" ] || return 1
    awk -v hp="$hp" '{
        s = $0
        sub(/#.*/, "", s)
        sub(/^[^:]*:\/\//, "", s)
        sub(/[?].*/, "", s)
        sub(/\/.*/, "", s)
        m = split(s, parts, "@")
        if (tolower(parts[m]) == hp) { print; exit }
    }' <<EOF
$pool
EOF
}
