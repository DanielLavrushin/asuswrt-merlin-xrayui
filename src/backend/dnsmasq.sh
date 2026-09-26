#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

DNSMASQ_PRIME_LIMIT=200
DNSMASQ_PRIME_SHARE_MIN=20

dnsmasq_configure() {
    # Fallback to /etc/dnsmasq.conf if $1 is empty (can happen when another
    # addon sourced in dnsmasq.postconf clobbers the positional parameters)
    local CONFIG="${1:-/etc/dnsmasq.conf}"

    load_ui_response
    load_xrayui_config

    log_info "Configuring dnsmasq..."

    # Check if the 'xray' daemon is running
    local xray_pid=$(get_xray_daemon_pid)
    if [ -z "$xray_pid" ]; then
        log_warn "Xray daemon not found. Skipping dnsmasq configuration."
        return
    fi

    log_debug "config: $CONFIG"
    log_debug "XRAY_CONFIG_FILE: $XRAY_CONFIG_FILE"
    log_debug "logs_dnsmasq setting: $logs_dnsmasq"

    touch "$CONFIG"
    local CONFIG_TMP="${CONFIG}.xrayui.new"
    sed "/^#${ADDON_TAG} start$/,/^#${ADDON_TAG} end$/d" "$CONFIG" >"$CONFIG_TMP" && mv -f "$CONFIG_TMP" "$CONFIG"

    pc_append "" "$CONFIG"
    pc_append "#$ADDON_TAG start" "$CONFIG"

    if [ "$logs_dnsmasq" = "true" ]; then

        grep -qE '^log-queries' "$CONFIG" || pc_append "log-queries" "$CONFIG" >/dev/null && log_debug "log-queries enabled"
        grep -qE '^log-async' "$CONFIG" || pc_append "log-async=25" "$CONFIG" >/dev/null && log_debug "log-async enabled"
        grep -qE '^log-facility' "$CONFIG" || pc_append "log-facility=/opt/var/log/dnsmasq.log" "$CONFIG" >/dev/null && log_debug "log-facility enabled"
    fi

    case "${ipsec:-off}" in
    bypass | redirect)
        grep -qE '^max-cache-ttl=' "$CONFIG" || pc_append "max-cache-ttl=3600" "$CONFIG"
        grep -qE '^max-ttl=' "$CONFIG" || pc_append "max-ttl=3600" "$CONFIG"
        ;;
    esac

    log_debug "dnsmasq: found inbound DNS server"

    local has_dnsmasq_servers
    local SRV_LIST
    SRV_LIST=$(jq -r '
        .inbounds[]
        | select(.protocol == "dokodemo-door")
        | select(.listen // "127.0.0.1")
        | select(.settings and (.settings | length > 0))
        | select(.settings.followRedirect != true)
        | select((.settings.port // 0) == 53)
        | "\(.listen // "127.0.0.1")#\(.port)"
 ' "$XRAY_CONFIG_FILE")

    if [ -n "$SRV_LIST" ]; then
        printf '%s\n' "$SRV_LIST" | while IFS= read -r srv; do
            [ -z "$srv" ] && continue
            pc_append "no-resolv" "$CONFIG" && log_debug "dnsmasq: no-resolv enabled"
            pc_append "server=$srv" "$CONFIG" && log_debug "dnsmasq: added inbound DNS server=$srv"
        done
        has_dnsmasq_servers="true"
    fi

    local dns_wiring=""
    jq -e '(.outbounds // []) | any(.tag == "sys:dns-out")' "$XRAY_CONFIG_FILE" >/dev/null 2>&1 && dns_wiring="true"

    if { [ "$xray_dns_only" = "true" ] || [ "$dns_wiring" = "true" ]; } && [ "$has_dnsmasq_servers" = "true" ]; then
        log_debug "dnsmasq: DNS-only mode active, disabling all other DNS"
        sed '/^[[:space:]]*servers-file=/ s/^/#/' "$CONFIG" >"$CONFIG_TMP" && mv -f "$CONFIG_TMP" "$CONFIG" && log_debug "dnsmasq: commented servers-file"
    fi

    dnsmasq_xray_ipset_domains "$CONFIG"

    pc_append "#$ADDON_TAG end" "$CONFIG"

    log_ok "dnsmasq configured"
}

dnsmasq_has_xrayui_block() {
    grep -qx "#$ADDON_TAG start" /etc/dnsmasq.conf 2>/dev/null
}

dnsmasq_keep_previous() {
    [ -s "$2" ] || return 0
    grep -qF "conf-file=$2" "$1" || pc_append "conf-file=$2" "$1"
}

dnsmasq_lock() {
    local tries=0 holder
    while ! mkdir "$DNSMASQ_LOCK_DIR" 2>/dev/null; do
        tries=$((tries + 1))
        if [ "$tries" -gt 60 ]; then
            log_warn "dnsmasq: could not acquire lock after 60s; keeping the previous ipset configuration"
            return 1
        fi
        holder=$(cat "$DNSMASQ_LOCK_DIR/pid" 2>/dev/null)
        if { [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; } || { [ -z "$holder" ] && [ "$tries" -gt 5 ]; }; then
            log_warn "dnsmasq: removing a stale lock${holder:+ left by PID $holder}"
            rm -rf "$DNSMASQ_LOCK_DIR"
            continue
        fi
        sleep 1
    done
    echo "$$" >"$DNSMASQ_LOCK_DIR/pid"
}

dnsmasq_rule_entries() {
    jq -r --arg mode "$1" '
        def arr: if . == null then [] elif type == "array" then . elif type == "string" then split(",") else [.] end;
        def plain_freedom:
            .protocol == "freedom"
            and (.settings.fragment == null)
            and (((.settings.noises // []) | length) == 0)
            and ((.settings.redirect // "") == "")
            and ((.settings.proxyProtocol // 0) == 0)
            and ((.streamSettings.sockopt.dialerProxy // "") == "")
            and ((.streamSettings.sockopt.interface // "") == "")
            and ((.streamSettings.sockopt.mark // 0) == 0)
            and ((.sendThrough // "0.0.0.0") | (. == "0.0.0.0" or . == "::" or . == ""))
            and ((.proxySettings.tag // "") == "");
        [ (.outbounds // [])[] | select(plain_freedom) | .tag | strings ] as $free
        | (.routing.rules // [])[]
        | select((.outboundTag as $t | any($free[]; . == $t)) == ($mode == "bypass"))
        | (((.domain | arr) + (.domains | arr))[] | "d " + tostring),
          ((.ip | arr)[] | "i " + tostring)
    ' "$2"
}

dnsmasq_ipset_skip() {
    log_warn "dnsmasq: rule entry '$1' is not added to the ipset: $2"
}

dnsmasq_flush_sets() {
    local s
    for s in "$@"; do
        [ -n "$s" ] && ipset flush "$s" 2>/dev/null
    done
    return 0
}

dnsmasq_set_count() {
    ipset list -t "$1" 2>/dev/null | awk -F': ' '/^Number of entries/ { print $2 }'
}

dnsmasq_cache_key() {
    local entries="$1" sources="$2" site_tags="$3" ip_tags="$4" f
    shift 4
    {
        printf '%s\n' "$*"
        cat "$entries" "$sources"
        for f in $(cut -d' ' -f1 "$site_tags" "$ip_tags" | sort -u) "$0"; do
            printf '%s %s %s\n' "$f" "$(ls -ln "$f" 2>/dev/null | awk '{ print $5 }')" "$(date -r "$f" +%s 2>/dev/null)"
        done
    } | md5sum | cut -d' ' -f1
}

dnsmasq_xray_ipset_domains() {
    CONFIG="$1"

    local DNSMASQ_DIR="$ADDON_SHARE_DIR/dnsmasq"
    local DIRECT_CONF="$DNSMASQ_DIR/direct.conf"
    local SOURCES="$DNSMASQ_DIR/sources.list"
    local PRIME_LIST="$DNSMASQ_DIR/prime.list"
    local CACHE_FILE="$DNSMASQ_DIR/cache.key"

    local V2DAT="$ADDON_SHARE_DIR/v2dat"
    local ASSET_DIR="/opt/sbin"
    local V4_RE='^([0-9]{1,3}\.){3}[0-9]{1,3}(/([1-9]|[12][0-9]|3[0-2]))?$'
    local V6_RE='^[0-9A-Fa-f.]*:[0-9A-Fa-f:.]*(/([1-9]|[1-9][0-9]|1[01][0-9]|12[0-8]))?$'

    local ipset_mode="${ipsec:-off}"
    local ipv6=""
    is_ipv6_enabled && ipv6=1

    log_debug "dnsmasq ipset mode: $ipset_mode"

    mkdir -p "$DNSMASQ_DIR" 2>/dev/null || return 1

    DNSMASQ_LOCK_DIR="/tmp/${ADDON_TAG}_dnsmasq.lock"
    DNSMASQ_STAGE="$DNSMASQ_DIR/.stage"
    if ! dnsmasq_lock; then
        dnsmasq_keep_previous "$CONFIG" "$DIRECT_CONF"
        return 1
    fi

    trap 'exec 3>&- 2>/dev/null; rm -rf "$DNSMASQ_STAGE" "$DNSMASQ_LOCK_DIR" 2>/dev/null' EXIT
    trap 'exit 1' INT TERM HUP

    rmdir "$DNSMASQ_DIR/.lock" 2>/dev/null
    rm -f "$DNSMASQ_DIR/ipset.rules" 2>/dev/null

    cleanup_stale_asdfiles

    rm -rf "$DNSMASQ_STAGE"
    mkdir -p "$DNSMASQ_STAGE" || return 1

    local TMP="$DNSMASQ_STAGE/direct.conf"
    local PROFILE="$DNSMASQ_STAGE/profile.json"
    local ENTRIES="$DNSMASQ_STAGE/entries"
    local LITERALS="$DNSMASQ_STAGE/literals"
    local SITE_TAGS="$DNSMASQ_STAGE/site.tags"
    local IP_TAGS="$DNSMASQ_STAGE/ip.tags"
    local NETS4="$DNSMASQ_STAGE/nets4"
    local NETS6="$DNSMASQ_STAGE/nets6"
    local SOURCES_NEW="$DNSMASQ_STAGE/sources"
    local EXPLICIT="$DNSMASQ_STAGE/explicit"
    local FRESH="$DNSMASQ_STAGE/fresh"

    touch "$ENTRIES" "$LITERALS" "$SITE_TAGS" "$IP_TAGS" "$NETS4" "$NETS6" "$SOURCES_NEW" "$EXPLICIT" "$FRESH" || return 1

    local SET_V4="" SET_V6="" NET_V4="" NET_V6=""
    case "$ipset_mode" in
    bypass)
        SET_V4="$IPSET_BYPASS_V4"
        SET_V6="$IPSET_BYPASS_V6"
        NET_V4="$IPSET_BYPASS_NET_V4"
        NET_V6="$IPSET_BYPASS_NET_V6"
        ;;
    redirect)
        SET_V4="$IPSET_PROXY_V4"
        SET_V6="$IPSET_PROXY_V6"
        NET_V4="$IPSET_PROXY_NET_V4"
        NET_V6="$IPSET_PROXY_NET_V6"
        ;;
    esac

    if [ -n "$SET_V4" ]; then
        if ! cp "$XRAY_CONFIG_FILE" "$PROFILE" 2>/dev/null ||
            ! jq -e 'type == "object"' "$PROFILE" >/dev/null 2>&1 ||
            ! dnsmasq_rule_entries "$ipset_mode" "$PROFILE" >"$ENTRIES.raw" 2>/dev/null; then
            log_warn "dnsmasq: cannot read $XRAY_CONFIG_FILE; keeping the previous ipset configuration"
            dnsmasq_keep_previous "$CONFIG" "$DIRECT_CONF"
            return 1
        fi
        sort -u "$ENTRIES.raw" >"$ENTRIES"
    fi

    case "$ipset_mode" in
    bypass) dnsmasq_flush_sets "$IPSET_PROXY_NET_V4" "$IPSET_PROXY_NET_V6" ;;
    redirect) dnsmasq_flush_sets "$IPSET_BYPASS_NET_V4" "$IPSET_BYPASS_NET_V6" ;;
    esac
    [ "$ipset_mode" = "redirect" ] || rm -f "$IPSET_LEARNED_FILE"

    exec 3>"$TMP"
    printf '# Autogenerated by %s on %s\n' \
        "$ADDON_TAG" "$(date '+%Y-%m-%d %H:%M:%S')" >&3

    printf 'm %s\n' "$ipset_mode" >>"$SOURCES_NEW"

    local cache_key="" cache_hit="" nets_ok=""

    if [ -n "$SET_V4" ]; then
        local kind entry rest file tag name fp
        while read -r kind entry; do
            [ -n "$entry" ] || continue

            if [ "$kind" = "i" ]; then
                case "$entry" in
                geoip:!* | !*) dnsmasq_ipset_skip "$entry" "negated matches are not supported" ;;
                geoip:?*) printf '%s %s\n' "$ASSET_DIR/geoip.dat" "${entry#geoip:}" >>"$IP_TAGS" ;;
                ext:?*:?*)
                    rest=${entry#ext:}
                    case "${rest#*:}" in
                    !*) dnsmasq_ipset_skip "$entry" "negated matches are not supported" ;;
                    *) printf '%s %s\n' "$ASSET_DIR/${rest%%:*}" "${rest#*:}" >>"$IP_TAGS" ;;
                    esac
                    ;;
                *) printf '%s\n' "$entry" >>"$LITERALS" ;;
                esac
                continue
            fi

            name=""
            case "$entry" in
            geosite:?* | ext:?*:?*)
                case "$entry" in
                geosite:*)
                    file="$ASSET_DIR/geosite.dat"
                    tag=${entry#geosite:}
                    ;;
                *)
                    rest=${entry#ext:}
                    file="$ASSET_DIR/${rest%%:*}"
                    tag=${rest#*:}
                    ;;
                esac
                case "$tag" in
                !*)
                    dnsmasq_ipset_skip "$entry" "negated matches are not supported"
                    continue
                    ;;
                *@*)
                    if [ "$ipset_mode" = "bypass" ]; then
                        dnsmasq_ipset_skip "$entry" "attribute filters are not supported in bypass mode"
                        continue
                    fi
                    tag=${tag%%@*}
                    ;;
                esac
                fp=""
                if [ "$file" = "$ASSET_DIR/$ADDON_TAG" ]; then
                    fp=$(md5sum "$ADDON_SHARE_DIR/data/$tag" 2>/dev/null | cut -d' ' -f1)
                fi
                printf '%s %s\n' "$file" "$tag" >>"$SITE_TAGS"
                printf 's %s %s%s\n' "$file" "$tag" "${fp:+ $fp}" >>"$SOURCES_NEW"
                ;;
            domain:?* | full:?*) name=${entry#*:} ;;
            regexp:* | regex:* | keyword:* | dotless:*) dnsmasq_ipset_skip "$entry" "pattern matches cannot be turned into an ipset" ;;
            *:*) dnsmasq_ipset_skip "$entry" "unsupported prefix" ;;
            .?*) name=${entry#.} ;;
            *.*) name=$entry ;;
            *) dnsmasq_ipset_skip "$entry" "substring matches cannot be turned into an ipset" ;;
            esac

            [ -n "$name" ] || continue
            case "$name" in
            *[!A-Za-z0-9._-]* | .* | -* | *..*)
                dnsmasq_ipset_skip "$entry" "not a valid domain name (international names must be written in punycode, xn--...)"
                continue
                ;;
            esac
            dnsmasq_domain_to_ipset "$name" "$SET_V4" "$SET_V6" "$ipv6"
            printf 'd %s\n' "$name" >>"$SOURCES_NEW"
            case "$name" in
            *.*) printf '%s\n' "$name" >>"$EXPLICIT" ;;
            esac
        done <"$ENTRIES"

        cache_key=$(dnsmasq_cache_key "$ENTRIES" "$SOURCES_NEW" "$SITE_TAGS" "$IP_TAGS" \
            "$ipset_mode" "$ipv6" "$SET_V4" "$SET_V6" "$NET_V4" "$NET_V6")
        if [ -s "$DIRECT_CONF" ] && [ -f "$CACHE_FILE" ] && [ "$(sed -n 1p "$CACHE_FILE")" = "$cache_key" ]; then
            cache_hit="true"
            local c6=""
            [ -n "$ipv6" ] && c6=$(dnsmasq_set_count "$NET_V6")
            if [ -n "$(dnsmasq_set_count "$NET_V4")" ] &&
                [ "$(sed -n 2p "$CACHE_FILE")" = "$(dnsmasq_set_count "$NET_V4")" ] &&
                [ "$(sed -n 3p "$CACHE_FILE")" = "$c6" ]; then
                nets_ok="true"
            fi
            log_debug "dnsmasq: rules and geodata unchanged; reusing $DIRECT_CONF${nets_ok:+ and the loaded networks}"
        fi

        if [ -z "$nets_ok" ]; then
            if [ -s "$LITERALS" ]; then
                if [ "$ipset_mode" = "redirect" ]; then
                    awk '
                        $0 == "0.0.0.0/0" { print "0.0.0.0/1"; print "128.0.0.0/1"; next }
                        $0 == "::/0" { print "::/1"; print "8000::/1"; next }
                        { print }' "$LITERALS" >"$LITERALS.x" && mv -f "$LITERALS.x" "$LITERALS"
                fi
                grep -E "$V4_RE" "$LITERALS" >>"$NETS4"
                grep -E "$V6_RE" "$LITERALS" >>"$NETS6"
                grep -vE "$V4_RE" "$LITERALS" | grep -vE "$V6_RE" | while read -r entry; do
                    case "$entry" in
                    */0) dnsmasq_ipset_skip "$entry" "catch-all networks cannot be used to bypass Xray" ;;
                    *) dnsmasq_ipset_skip "$entry" "not an IP address or network" ;;
                    esac
                done
            fi

            if [ -s "$IP_TAGS" ]; then
                for file in $(cut -d' ' -f1 "$IP_TAGS" | sort -u); do
                    if [ ! -f "$file" ]; then
                        log_warn "dnsmasq: $file not found; its geoip tags are skipped"
                        continue
                    fi
                    set --
                    for tag in $(awk -v f="$file" '$1 == f { print $2 }' "$IP_TAGS" | sort -u); do
                        set -- "$@" -f "$tag"
                    done
                    log_debug "dnsmasq: unpacking geoip from $file: $*"
                    $IONICE $NICE "$V2DAT" unpack geoip -p "$@" "$file" |
                        awk -v g4="$NETS4" -v g6="$NETS6" '
                            /^#/ || NF != 1 { next }
                            index($0, ":") { print >>g6; next }
                            { print >>g4 }'
                done
            fi
        fi

        if [ -z "$cache_hit" ] && [ -s "$SITE_TAGS" ]; then
            local fresh_tags="" share="$DNSMASQ_PRIME_LIMIT" n
            if [ -s "$SOURCES" ]; then
                fresh_tags=$(awk '
                    NR == FNR { if ($1 == "s") seen[$2 " " tolower($3)] = 1; next }
                    !(($1 " " tolower($2)) in seen) { print tolower($2) }' "$SOURCES" "$SITE_TAGS" | sort -u | tr '\n' ' ')
                n=$(printf '%s\n' $fresh_tags | grep -c .)
                if [ "$n" -gt 0 ]; then
                    share=$((DNSMASQ_PRIME_LIMIT / n))
                    [ "$share" -lt "$DNSMASQ_PRIME_SHARE_MIN" ] && share=$DNSMASQ_PRIME_SHARE_MIN
                fi
            fi
            for file in $(cut -d' ' -f1 "$SITE_TAGS" | sort -u); do
                if [ ! -f "$file" ]; then
                    log_warn "dnsmasq: $file not found; its geosite tags are skipped"
                    continue
                fi
                set --
                for tag in $(awk -v f="$file" '$1 == f { print $2 }' "$SITE_TAGS" | sort -u); do
                    set -- "$@" -f "$tag"
                done
                log_debug "dnsmasq: unpacking geosite from $file: $*"
                $IONICE $NICE "$V2DAT" unpack geosite -p "$@" "$file" |
                    dnsmasq_geosite_to_ipset "$SET_V4" "$SET_V6" "$ipv6" "$fresh_tags" "$FRESH" "$share" "$ipset_mode" >&3
            done
        fi
    fi

    exec 3>&-

    if [ -z "$cache_hit" ]; then
        {
            head -n1 "$TMP"
            tail -n +2 "$TMP" | sort -u
        } >"${TMP}.uniq" &&
            mv -f "${TMP}.uniq" "$TMP"

        chmod 644 "$TMP"
        mv -f "$TMP" "$DIRECT_CONF"
    fi

    if [ -n "$NET_V4" ] && [ -z "$nets_ok" ]; then
        dnsmasq_load_nets "$NET_V4" inet "$NETS4"
        [ -n "$ipv6" ] && dnsmasq_load_nets "$NET_V6" inet6 "$NETS6"
    fi

    if [ -n "$cache_key" ]; then
        local c6=""
        [ -n "$ipv6" ] && c6=$(dnsmasq_set_count "$NET_V6")
        printf '%s\n%s\n%s\n' "$cache_key" "$(dnsmasq_set_count "$NET_V4")" "$c6" >"$CACHE_FILE"
    else
        rm -f "$CACHE_FILE"
    fi

    awk '{ if ($1 == "d") $2 = tolower($2); else if ($1 == "s") $3 = tolower($3); print }' "$SOURCES_NEW" | sort -u >"$SOURCES_NEW.n"
    if [ "$ipset_mode" = "redirect" ] && [ -s "$SOURCES" ] &&
        awk 'NR == FNR { cur[$0] = 1; next } !($0 in cur) { gone = 1; exit } END { exit !gone }' "$SOURCES_NEW.n" "$SOURCES"; then
        if grep -qx "m $ipset_mode" "$SOURCES"; then
            log_info "dnsmasq: proxied domains were removed from the rules; clearing learned addresses"
        else
            log_info "dnsmasq: ipset mode changed; clearing learned addresses"
        fi
        dnsmasq_flush_sets "$SET_V4" "$SET_V6"
        rm -f "$IPSET_LEARNED_FILE"
    fi
    mv -f "$SOURCES_NEW.n" "$SOURCES"

    if [ -n "$SET_V4" ]; then
        awk '!seen[$0]++' "$EXPLICIT" "$FRESH" | head -n "$DNSMASQ_PRIME_LIMIT" >"$PRIME_LIST.new" &&
            mv -f "$PRIME_LIST.new" "$PRIME_LIST"
    else
        rm -f "$PRIME_LIST"
    fi

    grep -qF "conf-file=$DIRECT_CONF" "$CONFIG" ||
        pc_append "conf-file=$DIRECT_CONF" "$CONFIG"

    if [ -s "$PRIME_LIST" ]; then
        local prime_copy="/tmp/${ADDON_TAG}_prime.$$.list"
        local dnsmasq_pid
        dnsmasq_pid=$(cat /var/run/dnsmasq.pid 2>/dev/null)
        if cp "$PRIME_LIST" "$prime_copy" 2>/dev/null; then
            (
                trap - EXIT INT TERM HUP
                exec 3>&- 7>&- 8>&- 9>&- 386>&- 387>&-
                dnsmasq_prime "$prime_copy" "$dnsmasq_pid"
            ) </dev/null >/dev/null 2>&1 &
        fi
    fi
}

dnsmasq_domain_to_ipset() {
    if [ -n "$4" ]; then
        printf 'ipset=/%s/%s,%s\n' "$1" "$2" "$3" >&3
    else
        printf 'ipset=/%s/%s\n' "$1" "$2" >&3
    fi
}

dnsmasq_geosite_to_ipset() {
    awk -v v4="$1" -v v6="$2" -v ip6="$3" -v fresh=" $4 " -v out="$5" -v share="$6" -v mode="$7" '
        /^#/ { tag = tolower($2); take = index(fresh, " " tag " ") > 0; next }
        /^(keyword|regexp):/ { next }
        mode == "bypass" && /^full:/ { next }
        { sub(/^(full|domain):/, "") }
        NF != 1 || /[^A-Za-z0-9._-]/ || /^[.-]/ || /\.\./ { next }
        {
            if (ip6) printf "ipset=/%s/%s,%s\n", $0, v4, v6
            else printf "ipset=/%s/%s\n", $0, v4
            if (take && per[tag] < share && index($0, ".")) { print >>out; per[tag]++ }
        }'
}

dnsmasq_load_nets() {
    local s="$1" fam="$2" src="$3"
    local t="${s}_T$$"
    local rules="$src.rules"
    local n hs=1024 mx out

    ipset list -n 2>/dev/null | grep -E "^${s}_T[0-9]+$" | while read -r stale; do
        ipset destroy "$stale" 2>/dev/null
    done

    LC_ALL=C sort -u "$src" >"$src.sorted"
    n=$(wc -l <"$src.sorted")
    [ "$n" -gt 2000 ] && hs=4096
    [ "$n" -gt 8000 ] && hs=16384
    [ "$n" -gt 32000 ] && hs=65536
    [ "$n" -gt 128000 ] && hs=262144
    mx=$((n + n / 2 + 4096))
    [ "$mx" -lt 65536 ] && mx=65536

    if ! ipset list -t "$s" >/dev/null 2>&1; then
        ipset create "$s" hash:net family "$fam" 2>/dev/null || {
            log_error "dnsmasq: cannot create ipset $s"
            return 1
        }
    fi

    {
        printf 'create %s hash:net family %s hashsize %s maxelem %s\n' "$t" "$fam" "$hs" "$mx"
        awk -v S="$t" 'NF { print "add", S, $0 }' "$src.sorted"
        printf 'swap %s %s\n' "$s" "$t"
        printf 'destroy %s\n' "$t"
    } >"$rules"

    if out=$(ipset -exist restore <"$rules" 2>&1); then
        log_debug "dnsmasq: loaded $n networks into $s"
    else
        ipset destroy "$t" 2>/dev/null
        log_error "dnsmasq: failed to load networks into $s: $out"
        return 1
    fi
}

dnsmasq_listening() {
    netstat -lnu 2>/dev/null | grep -qE '(127\.0\.0\.1|0\.0\.0\.0):53 '
}

dnsmasq_prime_wait() {
    local old_pid="$1" tries=0 pid
    while [ "$tries" -lt 90 ]; do
        pid=$(cat /var/run/dnsmasq.pid 2>/dev/null)
        if [ -n "$pid" ] && [ "$pid" != "$old_pid" ] && kill -0 "$pid" 2>/dev/null && dnsmasq_listening; then
            sleep 1
            return 0
        fi
        tries=$((tries + 1))
        sleep 1
    done
    return 1
}

dnsmasq_prime() {
    local list="$1" old_pid="$2" lock="/tmp/${ADDON_TAG}_dnsmasq_prime.lock" ok=0 total=0 name

    if which flock >/dev/null 2>&1 && touch "$lock" 2>/dev/null; then
        exec 7>"$lock"
        flock 7
    fi

    if ! dnsmasq_prime_wait "$old_pid"; then
        rm -f "$list"
        log_debug "dnsmasq: did not come back within 90s; ipset warm-up skipped"
        return 0
    fi

    while read -r name; do
        [ -n "$name" ] || continue
        total=$((total + 1))
        if nslookup "$name" 127.0.0.1 >/dev/null 2>&1; then
            ok=$((ok + 1))
            continue
        fi
        dnsmasq_listening && continue
        dnsmasq_prime_wait "" || break
        nslookup "$name" 127.0.0.1 >/dev/null 2>&1 && ok=$((ok + 1))
    done <"$list"
    rm -f "$list"

    log_debug "dnsmasq: $ok of $total rule domains resolved through dnsmasq to warm the ipset"
}

dnsmasq_restart() {
    log_info "Restarting dnsmasq"
    update_loading_progress "Restarting dnsmasq..."

    local old_pid
    old_pid=$(cat /var/run/dnsmasq.pid 2>/dev/null)

    if service restart_dnsmasq >/dev/null 2>&1; then
        log_ok "DNS service restarted successfully."
    else
        log_error "Failed to restart DNS service."
    fi

    (
        trap - EXIT INT TERM HUP
        exec 3>&- 7>&- 8>&- 9>&- 386>&- 387>&-
        dnsmasq_restart_verify "$old_pid"
    ) </dev/null >/dev/null 2>&1 &
}

dnsmasq_restart_verify() {
    local old_pid="$1" attempt=1 waited pid

    while :; do
        waited=0
        while [ "$waited" -lt 90 ]; do
            sleep 3
            waited=$((waited + 3))
            pid=$(cat /var/run/dnsmasq.pid 2>/dev/null)
            if [ -z "$pid" ] || [ "$pid" = "$old_pid" ] || ! kill -0 "$pid" 2>/dev/null; then
                continue
            fi
            if [ -z "$(get_xray_daemon_pid)" ] || dnsmasq_has_xrayui_block; then
                return 0
            fi
            old_pid="$pid"
        done
        [ "$attempt" -ge 2 ] && break
        attempt=2
        log_warn "dnsmasq did not restart with the $ADDON_TITLE configuration within 90s; requesting the restart again."
        service restart_dnsmasq >/dev/null 2>&1
    done

    log_error "dnsmasq is not running with the $ADDON_TITLE configuration."
    return 1
}
