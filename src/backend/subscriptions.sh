#!/bin/sh
# shellcheck disable=SC2034

subscription_curl() {
    local hwid
    local compressed=""
    hwid=$(get_or_create_hwid)
    if curl --version 2>/dev/null | grep -qE 'libz|zlib/'; then
        compressed="--compressed"
    fi
    # shellcheck disable=SC2086
    curl -fsL $compressed --max-time 20 \
        -A "xrayui/$XRAYUI_VERSION" \
        -H "x-hwid: $hwid" \
        -H "x-device-os: ASUSWRT-Merlin" \
        "$@"
}

subscription_url_host() {
    local h="${1#*://}"
    h="${h%%/*}"
    h="${h%%\?*}"
    printf '%s' "${h##*@}"
}

subscription_b64d() {
    local s pad
    s=$(printf '%s' "$1" | tr -d ' \r\n\t' | tr '_-' '/+')
    pad=$(((4 - ${#s} % 4) % 4))
    case "$pad" in
    1) s="$s=" ;;
    2) s="$s==" ;;
    esac
    printf '%s' "$s" | b64_decode
}

subscription_decode_body() {
    local src="$1"
    local dst="$2"
    local b64="$dst.b64"
    local len pad

    tr -d '\r' <"$src" >"$dst"
    grep -q '://' "$dst" && return 0

    tr -d ' \n\t' <"$dst" | tr '_-' '/+' >"$b64"
    len=$(wc -c <"$b64")
    pad=$(((4 - len % 4) % 4))
    case "$pad" in
    1) printf '=' >>"$b64" ;;
    2) printf '==' >>"$b64" ;;
    esac
    if b64_decode <"$b64" >"$dst.dec" && [ -s "$dst.dec" ]; then
        tr -d '\r' <"$dst.dec" >"$dst"
    fi
    rm -f "$b64" "$dst.dec"
}

subscription_body_has_links() {
    [ -s "$1" ] && grep -qiE '(vless|vmess|trojan|ss|hy2|hysteria2?|wireguard|wg|wgcf)(://|%3A%2F%2F)' "$1"
}

process_subscriptions() {
    local config_file="$1"
    local cfg new idx url proto tag hp fetched rep maybe
    local body_file="/tmp/xrayui_surl.$$"
    local temp_config="$config_file.subs.$$"

    cfg=$(cat "$config_file") || return 1
    while IFS= read -r entry; do
        [ -z "$entry" ] && continue
        idx=$(printf '%s' "$entry" | jq -r '.idx')
        url=$(printf '%s' "$entry" | jq -r '.url')
        proto=$(printf '%s' "$entry" | jq -r '.proto')
        tag=$(printf '%s' "$entry" | jq -r '.tag')
        hp=$(printf '%s' "$entry" | jq -r '.hp')
        rep=""

        if ! subscription_curl "$url" </dev/null >"$body_file" 2>/dev/null; then
            log_warn "Subscription URL of outbound '$tag' ($(subscription_url_host "$url")) could not be fetched; keeping its previous settings"
            rm -f "$body_file"
            continue
        fi
        fetched=$(tr -d '\r' <"$body_file")
        rm -f "$body_file"

        if is_json "$fetched"; then
            rep=$(printf '%s' "$fetched" | jq -c --arg t "$tag" --arg p "$proto" '
                (.outbounds // [])
                | (if ($t != "") then (map(select(.tag==$t)) | first) else null end)
                  // (map(select(.protocol==$p)) | first)')
        else
            maybe=$(subscription_b64d "$fetched")
            if is_json "$maybe"; then
                rep=$(printf '%s' "$maybe" | jq -c --arg t "$tag" --arg p "$proto" '
                    (.outbounds // [])
                    | (if ($t != "") then (map(select(.tag==$t)) | first) else null end)
                      // (map(select(.protocol==$p)) | first)')
            else
                rep=$(subscription_pick_from_list "$tag" "$proto" "$fetched" "$hp")
            fi
        fi
        if [ -z "$rep" ] || [ "$rep" = "null" ]; then
            log_warn "Subscription URL of outbound '$tag' ($(subscription_url_host "$url")) returned no usable $proto link; keeping its previous settings"
            continue
        fi
        new=$(printf '%s' "$cfg" | jq -c \
            --arg pos "$idx" \
            --arg url "$url" \
            --arg tag "$tag" \
            --argjson rep "$rep" '
                ($pos|tonumber) as $i
                | (.outbounds[$i] | del(.settings, .streamSettings, .protocol, .subPool)) as $keep
                | (try .outbounds[$i].streamSettings.sockopt catch null) as $sock
                | .outbounds[$i] = (
                    ($keep + $rep + {surl:$url, tag:$tag})
                    | if $sock != null
                        then .streamSettings = ((.streamSettings // {}) + {sockopt:$sock})
                        else .
                        end
                    )') && [ -n "$new" ] && cfg="$new"
    done <<EOF
$(printf '%s' "$cfg" | jq -c '.outbounds
    | to_entries[]
    | select(.value.surl and .value.surl!="")
    | {idx:.key,url:.value.surl,proto:.value.protocol,tag:(.value.tag//""),
       hp:((.value.settings.vnext[0] // .value.settings.servers[0] // .value.settings // {})
           | if (.address // "") == "" then "" else "\(.address):\(.port // "")" | ascii_downcase end)}')
EOF
    printf '%s' "$cfg" | jq -e '.outbounds | type == "array"' >/dev/null 2>&1 || return 1
    printf '%s' "$cfg" >"$temp_config" && mv -f "$temp_config" "$config_file"
    rm -f "$temp_config"
}

subscription_parse_link_to_outbound() {
    local link="$1"
    case "$link" in
    vmess://*) subscription_parse_vmess "$link" ;;
    vless://*) subscription_parse_vless "$link" ;;
    trojan://*) subscription_parse_trojan "$link" ;;
    ss://*) subscription_parse_shadowsocks "$link" ;;
    hy2://*) subscription_parse_hysteria "$link" ;;
    hysteria://*) subscription_parse_hysteria "$link" ;;
    hysteria2://*) subscription_parse_hysteria "$link" ;;
    *) return 1 ;;
    esac
}

subscription_local_addresses() {
    {
        ip -o addr show 2>/dev/null | awk '{ sub(/\/.*/, "", $4); print $4 }'
        nvram get ddns_hostname_x 2>/dev/null
    } | tr 'A-Z' 'a-z' | awk 'NF' | sort -u
}

subscription_outbound_is_unusable() {
    local ob="$1"
    local locals="$2"
    local addr
    printf '%s' "$ob" | jq -e '
        (.settings.vnext[0] // .settings.servers[0] // .settings // {}) as $s
        | (($s.address // "") | tostring | ascii_downcase) as $a
        | ((($s.port // 0) | tonumber?) // 0) as $p
        | (($s.users[0].id // "") | tostring) as $id
        | $a == "" or $a == "0.0.0.0" or $a == "::" or $a == "::1" or $a == "localhost"
          or ($a | startswith("127.")) or $p < 2
          or ($id | test("^0{8}-0{4}-0{4}-0{4}-0{12}$"))' >/dev/null 2>&1 && return 0
    [ -n "$locals" ] || return 1
    addr=$(printf '%s' "$ob" | jq -r '(.settings.vnext[0] // .settings.servers[0] // .settings // {}).address // "" | tostring | ascii_downcase' 2>/dev/null)
    addr="${addr#\[}"
    addr="${addr%\]}"
    printf '%s\n' "$locals" | grep -qxF -- "$addr"
}

subscription_pick_from_list() {
    local tag="$1"
    local proto="$2"
    local fetched="$3"
    local cur_hp="$4"
    local decoded lines line rep locals
    case "$fetched" in
    *://*) decoded="$fetched" ;;
    *) decoded=$(subscription_b64d "$fetched") ;;
    esac
    [ -n "$decoded" ] || decoded="$fetched"

    lines=$(printf '%s\n' "$decoded" | tr -d '\r' | awk -v p="$proto" '
        {
            sub(/^[ \t]+/, "")
            sub(/[ \t]+$/, "")
            i = index($0, "://")
            if (i < 2) next
            s = tolower(substr($0, 1, i - 1))
            if (s == "ss") s = "shadowsocks"
            else if (s == "hy2" || s == "hysteria2") s = "hysteria"
            if (s == p) print
        }')
    [ -n "$lines" ] || return 1
    locals=$(subscription_local_addresses)

    if [ -n "$cur_hp" ]; then
        line=$(printf '%s\n' "$lines" | awk -v hp="$cur_hp" '{
            s = $0
            sub(/#.*/, "", s)
            sub(/^[^:]*:\/\//, "", s)
            sub(/[?].*/, "", s)
            sub(/\/.*/, "", s)
            m = split(s, parts, "@")
            if (tolower(parts[m]) == hp) { print; exit }
        }')
        if [ -n "$line" ] && rep=$(subscription_parse_link_to_outbound "$line") && [ -n "$rep" ] &&
            ! subscription_outbound_is_unusable "$rep" "$locals"; then
            printf '%s' "$rep"
            return 0
        fi
    fi

    if [ -n "$tag" ]; then
        while IFS= read -r line; do
            case "$line" in *#*) ;; *) continue ;; esac
            [ "$(urldecode "${line#*#}")" = "$tag" ] || continue
            if rep=$(subscription_parse_link_to_outbound "$line") && [ -n "$rep" ] &&
                ! subscription_outbound_is_unusable "$rep" "$locals"; then
                printf '%s' "$rep"
                return 0
            fi
        done <<EOF
$lines
EOF
    fi

    while IFS= read -r line; do
        if rep=$(subscription_parse_link_to_outbound "$line") && [ -n "$rep" ] &&
            ! subscription_outbound_is_unusable "$rep" "$locals"; then
            printf '%s' "$rep"
            return 0
        fi
    done <<EOF
$lines
EOF
    return 1
}

subscription_link_fragment() {
    case "$1" in
    *#*) printf '%s' "${1#*#}" ;;
    esac
}

subscription_split_hostport() {
    local hp="$1"
    local host port
    case "$hp" in
    \[*\]:*)
        host="${hp%%\]:*}"
        host="${host#\[}"
        port="${hp##*\]:}"
        ;;
    *:*)
        host="${hp%:*}"
        port="${hp##*:}"
        ;;
    *) return 1 ;;
    esac
    port="${port%%[,-]*}"
    case "$port" in '' | *[!0-9]*) return 1 ;; esac
    [ -n "$host" ] || return 1
    printf '%s %s' "$host" "$port"
}

subscription_kcp_era() {
    local v
    v=$(xrayui_core_version)
    if [ -z "$v" ] || version_ge "$v" "26.6.22"; then
        printf 'mkcp-legacy-reversed'
    elif version_ge "$v" "26.6.1"; then
        printf 'mkcp-legacy'
    elif version_ge "$v" "26.1.31"; then
        printf 'finalmask'
    else
        printf 'legacy'
    fi
}

subscription_parse_network() {
    local net="$1"
    local seed="$2"
    local qhost="$3"
    local mode="$4"
    local path="$5"
    local hdr="$6"
    local svc="$7"
    local auth="$8"
    local era=""
    [ -z "$hdr" ] && hdr="none"
    [ "$net" = "kcp" ] && era=$(subscription_kcp_era)
    jq -nc --arg n "$net" --arg seed "$seed" --arg qh "$qhost" --arg mo "$mode" --arg pa "$path" --arg ht "$hdr" \
        --arg svc "$svc" --arg au "$auth" --arg era "$era" '
        if $n=="xhttp" then
            {xhttpSettings:{
                host:$qh,
                mode:$mo,
                path:$pa,
                scMaxBufferedPosts:30,
                scMaxEachPostBytes:"1000000",
                scStreamUpServerSecs:"20-80",
                scMinPostsIntervalMs:30,
                xPaddingBytes:"100-1000"
            }}
        elif $n=="kcp" then
            ({mtu:1350,tti:50,uplinkCapacity:5,downlinkCapacity:20,congestion:false,readBufferSize:2,writeBufferSize:2}
              + (if $era=="legacy" then {header:{type:$ht}} + (if ($seed|length)>0 then {seed:$seed} else {} end) else {} end)) as $k
            | ({"srtp":"srtp","utp":"utp","wechat-video":"wechat","wechat":"wechat","dtls":"dtls","wireguard":"wireguard"} | .[$ht]) as $h
            | (if $era=="legacy" then []
               else
                 (if $h != null then [if $era=="finalmask" then {type:("header-" + $h)} else {type:"mkcp-legacy",settings:{header:$h}} end] else [] end)
                 + (if ($seed|length)>0 then [if $era=="finalmask" then {type:"mkcp-aes128gcm",settings:{password:$seed}} else {type:"mkcp-legacy",settings:{value:$seed}} end] else [] end)
                 | if $era=="mkcp-legacy-reversed" then reverse else . end
               end) as $udp
            | {kcpSettings:$k} + (if ($udp|length)>0 then {finalmask:{udp:$udp}} else {} end)
        elif $n=="ws" then
            {wsSettings:{
                heartbeatPeriod:0,
                host:$qh,
                path:$pa
            }}
        elif $n=="httpupgrade" then
            {httpupgradeSettings:{
                host:$qh,
                path:$pa
            }}
        elif $n=="grpc" then
            {grpcSettings:(
                {serviceName:(if ($svc|length)>0 then $svc else $pa end)}
                + (if ($au|length)>0 then {authority:$au} elif ($qh|length)>0 then {authority:$qh} else {} end)
                + (if $mo=="multi" then {multiMode:true} else {} end)
            )}
        elif $n=="tcp" then
            {tcpSettings:{header:{type:$ht}}}
        elif $n=="raw" then
            {rawSettings:{header:{type:$ht}}}
        else {} end'
}

subscription_parse_vmess() {
    local link="$1"
    local payload="${link#vmess://}"
    payload="${payload%%#*}"
    local j
    j=$(subscription_b64d "$payload")
    [ -n "$j" ] || return 1

    local add port id ps aid scy tls net path hdr qhost sni fp alpn
    local _vmess_vars
    if ! _vmess_vars=$(printf '%s' "$j" | jq -r '
        "add=" + ((.add // "") | tostring | @sh) + "\n" +
        "port=" + ((.port // 0) | tostring | @sh) + "\n" +
        "id=" + ((.id // "") | tostring | @sh) + "\n" +
        "ps=" + ((.ps // "vmess") | tostring | @sh) + "\n" +
        "aid=" + ((.aid // 0) | tostring | @sh) + "\n" +
        "scy=" + ((.scy // "auto") | tostring | @sh) + "\n" +
        "tls=" + ((.tls // "none") | tostring | @sh) + "\n" +
        "net=" + ((.net // "tcp") | tostring | @sh) + "\n" +
        "path=" + ((.path // "") | tostring | @sh) + "\n" +
        "hdr=" + ((.type // "") | tostring | @sh) + "\n" +
        "qhost=" + ((.host // "") | tostring | @sh) + "\n" +
        "sni=" + ((.sni // "") | tostring | @sh) + "\n" +
        "fp=" + ((.fp // "") | tostring | @sh) + "\n" +
        "alpn=" + ((.alpn // "") | tostring | @sh)
    '); then
        return 1
    fi
    eval "$_vmess_vars"
    [ -n "$add" ] || return 1
    case "$port" in '' | 0 | *[!0-9]*) return 1 ;; esac
    case "$aid" in '' | *[!0-9]*) aid=0 ;; esac

    local seed=""
    [ "$net" = "kcp" ] && seed="$path"
    local mode=""
    [ "$net" = "grpc" ] && mode="$hdr"

    local network
    network=$(subscription_parse_network "$net" "$seed" "$qhost" "$mode" "$path" "$hdr") || return 1

    jq -nc --arg tag "$ps" --arg address "$add" --arg port "$port" \
        --arg id "$id" --arg aid "$aid" --arg scy "$scy" --arg tls "$tls" \
        --arg sni "$sni" --arg fp "$fp" --arg alpn "$alpn" \
        --arg net "$net" --argjson network "$network" '
    {
        protocol:"vmess",
        tag:$tag,
        settings:{
            vnext:[{
                address:$address,
                port:($port|tonumber),
                users:[{
                    id:$id,
                    alterId:($aid|tonumber),
                    security:$scy
                }]
            }]
        },
        streamSettings:(
            {network:$net,security:(if $tls=="tls" then "tls" else "none" end)}
            + (if $tls=="tls" then {
                    tlsSettings:(
                        (if ($sni|length)>0 then {serverName:$sni} else {} end)
                        + (if ($fp|length)>0 then {fingerprint:$fp} else {} end)
                        + (if ($alpn|length)>0 then {alpn:($alpn|split(","))} else {} end)
                    )
               } else {} end)
            + $network
        )
    }'
}

subscription_parse_vless() {
    local link="$1"
    local rest="${link#vless://}"
    local body="${rest%%#*}"
    local userhostport="${body%%\?*}"
    local qs=""
    case "$body" in *\?*) qs="${body#*\?}" ;; esac
    case "$userhostport" in *@*) ;; *) return 1 ;; esac
    local uuid
    uuid=$(urldecode "${userhostport%@*}")
    local hp host port
    hp=$(subscription_split_hostport "$(subscription_parse_hostport "$userhostport")") || return 1
    host="${hp% *}"
    port="${hp##* }"
    local tag
    tag=$(urldecode "$(subscription_link_fragment "$link")")
    [ -z "$tag" ] && tag="vless"
    local net
    net=$(urldecode "$(subscription_parse_kv "$qs" "type")")
    [ -z "$net" ] && net="tcp"
    local sec
    sec=$(urldecode "$(subscription_parse_kv "$qs" "security")")
    [ -z "$sec" ] && sec="none"
    local flow
    flow=$(urldecode "$(subscription_parse_kv "$qs" "flow")")
    local enc
    enc=$(urldecode "$(subscription_parse_kv "$qs" "encryption")")
    [ -z "$enc" ] && enc="none"
    local fp
    fp=$(urldecode "$(subscription_parse_kv "$qs" "fp")")
    local pbk
    pbk=$(urldecode "$(subscription_parse_kv "$qs" "pbk")")
    local sni
    sni=$(urldecode "$(subscription_parse_kv "$qs" "sni")")
    local alpn
    alpn=$(urldecode "$(subscription_parse_kv "$qs" "alpn")")
    local seed
    seed=$(urldecode "$(subscription_parse_kv "$qs" "seed")")
    local sid
    sid=$(urldecode "$(subscription_parse_kv "$qs" "sid")")
    local spx
    spx=$(urldecode "$(subscription_parse_kv "$qs" "spx")")
    local qhost
    qhost=$(urldecode "$(subscription_parse_kv "$qs" "host")")
    local mode
    mode=$(urldecode "$(subscription_parse_kv "$qs" "mode")")
    [ -z "$mode" ] && mode="auto"
    local path
    path=$(urldecode "$(subscription_parse_kv "$qs" "path")")
    local hdr
    hdr=$(urldecode "$(subscription_parse_kv "$qs" "headerType")")
    local svc
    svc=$(urldecode "$(subscription_parse_kv "$qs" "serviceName")")
    local auth
    auth=$(urldecode "$(subscription_parse_kv "$qs" "authority")")
    local ai
    ai=$(urldecode "$(subscription_parse_kv "$qs" "allowInsecure")")
    local ai_supported
    if core_supports_allow_insecure; then ai_supported="1"; else ai_supported="0"; fi
    local network
    network=$(subscription_parse_network "$net" "$seed" "$qhost" "$mode" "$path" "$hdr" "$svc" "$auth") || return 1
    jq -nc --arg tag "$tag" --arg host "$host" --arg port "$port" --arg id "$uuid" \
        --arg flow "$flow" --arg enc "$enc" --arg net "$net" --arg sec "$sec" \
        --arg fp "$fp" --arg pbk "$pbk" --arg sni "$sni" --arg alpn "$alpn" --arg seed "$seed" --arg sid "$sid" --arg spx "$spx" \
        --arg ai "$ai" --arg aisup "$ai_supported" \
        --argjson network "$network" '
    {
        protocol:"vless",
        tag:$tag,
        settings:{
            vnext:[{
                address:$host,
                port:($port|tonumber),
                users:[ if ($flow|length)>0 then {id:$id,flow:$flow,encryption:$enc} else {id:$id,encryption:$enc} end ]
            }]
        },
        streamSettings:(
            {network:$net,security:$sec}
            + (if $sec=="reality" then {
                    realitySettings:{
                        fingerprint:$fp,
                        publicKey:$pbk,
                        serverName:$sni,
                        shortId:$sid,
                        spiderX:$spx
                    }
               } elif $sec=="tls" then {
                    tlsSettings:(
                        (if ($sni|length)>0 then {serverName:$sni} else {} end)
                        + (if ($fp|length)>0 then {fingerprint:$fp} else {} end)
                        + (if ($alpn|length)>0 then {alpn:($alpn|split(","))} else {} end)
                        + (if ($aisup=="1" and ($ai=="1" or $ai=="true")) then {allowInsecure:true} else {} end)
                    )
               } else {} end)
            + $network
        )
    }'
}

subscription_parse_trojan() {
    local link="$1"
    local rest="${link#trojan://}"
    local body="${rest%%#*}"
    local userhostport="${body%%\?*}"
    local qs=""
    case "$body" in *\?*) qs="${body#*\?}" ;; esac
    case "$userhostport" in *@*) ;; *) return 1 ;; esac

    local password
    password=$(urldecode "${userhostport%@*}")
    local hp host port
    hp=$(subscription_split_hostport "$(subscription_parse_hostport "$userhostport")") || return 1
    host="${hp% *}"
    port="${hp##* }"

    local tag
    tag=$(urldecode "$(subscription_link_fragment "$link")")
    [ -z "$tag" ] && tag="trojan"

    local net
    net=$(urldecode "$(subscription_parse_kv "$qs" "type")")
    [ -z "$net" ] && net="tcp"
    local sec
    sec=$(urldecode "$(subscription_parse_kv "$qs" "security")")
    [ -z "$sec" ] && sec="none"

    local fp
    fp=$(urldecode "$(subscription_parse_kv "$qs" "fp")")
    local pbk
    pbk=$(urldecode "$(subscription_parse_kv "$qs" "pbk")")
    local sni
    sni=$(urldecode "$(subscription_parse_kv "$qs" "sni")")
    local sid
    sid=$(urldecode "$(subscription_parse_kv "$qs" "sid")")
    local spx
    spx=$(urldecode "$(subscription_parse_kv "$qs" "spx")")
    local alpn
    alpn=$(urldecode "$(subscription_parse_kv "$qs" "alpn")")
    local ai
    ai=$(urldecode "$(subscription_parse_kv "$qs" "allowInsecure")")
    local ai_supported
    if core_supports_allow_insecure; then ai_supported="1"; else ai_supported="0"; fi

    local qhost
    qhost=$(urldecode "$(subscription_parse_kv "$qs" "host")")
    local mode
    mode=$(urldecode "$(subscription_parse_kv "$qs" "mode")")
    local path
    path=$(urldecode "$(subscription_parse_kv "$qs" "path")")
    local hdr
    hdr=$(urldecode "$(subscription_parse_kv "$qs" "headerType")")
    local seed
    seed=$(urldecode "$(subscription_parse_kv "$qs" "seed")")
    local svc
    svc=$(urldecode "$(subscription_parse_kv "$qs" "serviceName")")
    local auth
    auth=$(urldecode "$(subscription_parse_kv "$qs" "authority")")

    local network
    network=$(subscription_parse_network "$net" "$seed" "$qhost" "$mode" "$path" "$hdr" "$svc" "$auth") || return 1

    jq -nc --arg tag "$tag" --arg host "$host" --arg port "$port" --arg pwd "$password" \
        --arg net "$net" --arg sec "$sec" \
        --arg fp "$fp" --arg pbk "$pbk" --arg sni "$sni" --arg sid "$sid" --arg spx "$spx" \
        --arg alpn "$alpn" --arg ai "$ai" --arg aisup "$ai_supported" \
        --argjson network "$network" '
    {
        protocol:"trojan",
        tag:$tag,
        settings:{
            servers:[{
                address:$host,
                port:($port|tonumber),
                password:$pwd
            }]
        },
        streamSettings:(
            {network:$net,security:$sec}
            + (if $sec=="reality" then {
                    realitySettings:{
                        fingerprint:$fp,
                        publicKey:$pbk,
                        serverName:$sni,
                        shortId:$sid,
                        spiderX:$spx
                    }
               } elif $sec=="tls" then {
                    tlsSettings:(
                        (if ($sni|length)>0 then {serverName:$sni} else {} end)
                        + (if ($fp|length)>0 then {fingerprint:$fp} else {} end)
                        + (if ($alpn|length)>0 then {alpn:($alpn|split(","))} else {} end)
                        + (if ($aisup=="1" and ($ai=="1" or $ai=="true")) then {allowInsecure:true} else {} end)
                    )
               } else {} end)
            + $network
        )
    }'
}

subscription_parse_shadowsocks() {
    local link="$1"
    local rest="${link#ss://}"
    local before_hash="${rest%%#*}"
    local qs=""
    case "$before_hash" in
    *\?*)
        qs="${before_hash#*\?}"
        before_hash="${before_hash%%\?*}"
        ;;
    esac

    local tag
    tag=$(urldecode "$(subscription_link_fragment "$link")")
    [ -z "$tag" ] && tag="ss"

    local methodpass hostport
    case "$before_hash" in
    *@*)
        local left="${before_hash%@*}"
        local right="${before_hash##*@}"
        local decoded_left
        decoded_left=$(subscription_b64d "$left")
        case "$decoded_left" in
        *:*) methodpass="$decoded_left" ;;
        *) methodpass=$(urldecode "$left") ;;
        esac
        hostport="$right"
        ;;
    *)
        local creds_hostport
        creds_hostport=$(subscription_b64d "$before_hash")
        methodpass="${creds_hostport%@*}"
        hostport="${creds_hostport##*@}"
        ;;
    esac

    hostport="${hostport%%/*}"
    local method="${methodpass%%:*}"
    local password="${methodpass#*:}"
    [ -n "$method" ] || return 1
    local hp host port
    hp=$(subscription_split_hostport "$hostport") || return 1
    host="${hp% *}"
    port="${hp##* }"

    local net
    net=$(urldecode "$(subscription_parse_kv "$qs" "type")")
    [ -z "$net" ] && net="tcp"
    local hdr
    hdr=$(urldecode "$(subscription_parse_kv "$qs" "headerType")")
    local qhost
    qhost=$(urldecode "$(subscription_parse_kv "$qs" "host")")
    local mode
    mode=$(urldecode "$(subscription_parse_kv "$qs" "mode")")
    local path
    path=$(urldecode "$(subscription_parse_kv "$qs" "path")")
    local svc
    svc=$(urldecode "$(subscription_parse_kv "$qs" "serviceName")")
    local auth
    auth=$(urldecode "$(subscription_parse_kv "$qs" "authority")")

    local sec
    sec=$(urldecode "$(subscription_parse_kv "$qs" "security")")
    [ -z "$sec" ] && sec="none"
    local fp
    fp=$(urldecode "$(subscription_parse_kv "$qs" "fp")")
    local sni
    sni=$(urldecode "$(subscription_parse_kv "$qs" "sni")")
    local alpn
    alpn=$(urldecode "$(subscription_parse_kv "$qs" "alpn")")
    local ai
    ai=$(urldecode "$(subscription_parse_kv "$qs" "allowInsecure")")
    [ -z "$ai" ] && ai="false"
    local ai_supported
    if core_supports_allow_insecure; then ai_supported="1"; else ai_supported="0"; fi

    local network
    network=$(subscription_parse_network "$net" "" "$qhost" "$mode" "$path" "$hdr" "$svc" "$auth") || return 1

    jq -nc --arg tag "$tag" --arg host "$host" --arg port "$port" \
        --arg method "$method" --arg password "$password" \
        --arg net "$net" --arg sec "$sec" --arg fp "$fp" --arg sni "$sni" \
        --arg alpn "$alpn" --arg ai "$ai" --arg aisup "$ai_supported" --argjson network "$network" '
    {
        protocol:"shadowsocks",
        tag:$tag,
        settings:{
            servers:[{
                address:$host,
                port:($port|tonumber),
                method:$method,
                password:$password,
                level:8
            }]
        },
        streamSettings:(
            {network:$net,security:$sec}
            + (if $sec=="tls" then {
                  tlsSettings:{
                      allowInsecure:($aisup=="1" and ($ai=="true" or $ai=="1" or $ai=="yes")),
                      alpn:(if ($alpn|length)>0 then ($alpn|split(",")) else ["h3","h2","http/1.1"] end),
                      fingerprint:(if ($fp|length)>0 then $fp else "chrome" end),
                      serverName:$sni
                  }
               } else {} end)
            + $network
        )
    }'
}

subscription_parse_hysteria() {
    local link="$1"
    local rest proto

    case "$link" in
    hy2://*)
        proto="hy2"
        rest="${link#hy2://}"
        ;;
    hysteria2://*)
        proto="hysteria2"
        rest="${link#hysteria2://}"
        ;;
    hysteria://*)
        proto="hysteria"
        rest="${link#hysteria://}"
        ;;
    *)
        return 1
        ;;
    esac

    local body="${rest%%#*}"
    local userhostport="${body%%\?*}"
    local qs=""
    case "$body" in *\?*) qs="${body#*\?}" ;; esac

    local auth=""
    case "$userhostport" in
    *@*)
        auth=$(urldecode "${userhostport%@*}")
        case "$auth" in *:*) auth="${auth#*:}" ;; esac
        ;;
    esac

    local hp host port
    hp=$(subscription_split_hostport "$(subscription_parse_hostport "$userhostport")") || return 1
    host="${hp% *}"
    port="${hp##* }"

    local tag
    tag=$(urldecode "$(subscription_link_fragment "$link")")
    [ -z "$tag" ] && tag="hysteria"

    local auth_param
    auth_param=$(urldecode "$(subscription_parse_kv "$qs" "auth")")
    local password_param
    password_param=$(urldecode "$(subscription_parse_kv "$qs" "password")")
    local version
    version=$(urldecode "$(subscription_parse_kv "$qs" "version")")
    local congestion
    congestion=$(urldecode "$(subscription_parse_kv "$qs" "congestion")")
    local up
    up=$(urldecode "$(subscription_parse_kv "$qs" "up")")
    local upmbps
    upmbps=$(urldecode "$(subscription_parse_kv "$qs" "upmbps")")
    local down
    down=$(urldecode "$(subscription_parse_kv "$qs" "down")")
    local downmbps
    downmbps=$(urldecode "$(subscription_parse_kv "$qs" "downmbps")")
    local insecure
    insecure=$(urldecode "$(subscription_parse_kv "$qs" "insecure")")
    local sni
    sni=$(urldecode "$(subscription_parse_kv "$qs" "sni")")
    local peer
    peer=$(urldecode "$(subscription_parse_kv "$qs" "peer")")
    local alpn
    alpn=$(urldecode "$(subscription_parse_kv "$qs" "alpn")")
    local pinSHA256
    pinSHA256=$(urldecode "$(subscription_parse_kv "$qs" "pinSHA256")")
    local obfs
    obfs=$(urldecode "$(subscription_parse_kv "$qs" "obfs")")
    local obfsPassword
    obfsPassword=$(urldecode "$(subscription_parse_kv "$qs" "obfs-password")")
    [ -z "$obfsPassword" ] && obfsPassword=$(urldecode "$(subscription_parse_kv "$qs" "obfsPassword")")

    [ -n "$auth_param" ] && auth="$auth_param"
    [ -n "$password_param" ] && auth="$password_param"

    if [ -z "$version" ] && { [ "$proto" = "hy2" ] || [ "$proto" = "hysteria2" ]; }; then
        version="2"
    fi
    case "$version" in *[!0-9]*) version="" ;; esac

    local final_sni="${sni:-$peer}"

    local hysteria_settings
    hysteria_settings=$(jq -nc \
        --arg auth "$auth" \
        --arg version "$version" '
        {}
        | if ($auth|length)>0 then .auth=$auth else . end
        | if ($version|length)>0 then .version=($version|tonumber) else . end
    ')

    local up_val="${up:-$upmbps}"
    local down_val="${down:-$downmbps}"
    local quic_params
    quic_params=$(jq -nc \
        --arg congestion "$congestion" \
        --arg up "$up_val" \
        --arg down "$down_val" '
        def brutal_unit(v): if (v|test("[^0-9]")) then v else "\(v) mbps" end;
        {}
        | if ($congestion|length)>0 then .congestion=$congestion else . end
        | if ($up|length)>0 then .brutalUp=brutal_unit($up) else . end
        | if ($down|length)>0 then .brutalDown=brutal_unit($down) else . end
    ')

    local tls_settings="null"
    local ai_supported pin_sep core_ver
    if core_supports_allow_insecure; then ai_supported="1"; else ai_supported="0"; fi
    core_ver=$(xrayui_core_version)
    if [ -z "$core_ver" ] || version_ge "$core_ver" "26.3.27"; then pin_sep=","; else pin_sep="~"; fi
    if [ -n "$final_sni" ] || [ "$insecure" = "1" ] || [ "$insecure" = "true" ] || [ -n "$alpn" ] || [ -n "$pinSHA256" ]; then
        tls_settings=$(jq -nc \
            --arg sni "$final_sni" \
            --arg insecure "$insecure" \
            --arg aisup "$ai_supported" \
            --arg alpn "$alpn" \
            --arg pin "$pinSHA256" \
            --arg pinsep "$pin_sep" '
            {}
            | if ($sni|length)>0 then .serverName=$sni else . end
            | if ($aisup=="1" and ($insecure=="1" or $insecure=="true")) then .allowInsecure=true else . end
            | if ($alpn|length)>0 then .alpn=($alpn|split(",")) else . end
            | if ($pin|length)>0 then .pinnedPeerCertSha256=([$pin|splits("[,~]")|gsub("^\\s+|\\s+$";"")]|map(select(length>0))|join($pinsep)) else . end
        ')
    fi

    local udpmasks="null"
    if [ "$obfs" = "salamander" ] && [ -n "$obfsPassword" ]; then
        udpmasks=$(jq -nc --arg pwd "$obfsPassword" '[{type:"salamander",settings:{password:$pwd}}]')
    fi

    jq -nc --arg tag "$tag" --arg host "$host" --arg port "$port" \
        --arg version "$version" \
        --argjson hysteria "$hysteria_settings" \
        --argjson quic "$quic_params" \
        --argjson tls "$tls_settings" \
        --argjson udpmasks "$udpmasks" '
    {
        protocol:"hysteria",
        tag:$tag,
        settings:(
            {
                address:$host,
                port:($port|tonumber)
            }
            + (if ($version|length)>0 then {version:($version|tonumber)} else {} end)
        ),
        streamSettings:(
            {network:"hysteria",hysteriaSettings:$hysteria}
            + (if $tls!=null then {security:"tls",tlsSettings:$tls} else {} end)
            + (if (($quic|length)>0) or ($udpmasks!=null) then
                {finalmask:(
                    (if ($quic|length)>0 then {quicParams:$quic} else {} end)
                    + (if $udpmasks!=null then {udp:$udpmasks} else {} end)
                )}
              else {} end)
        )
    }'
}

subscription_parse_kv() { printf '%s' "$1" | tr '&' '\n' | awk -F= -v k="$2" '$1==k{sub(/^[^=]*=/, ""); print; exit}'; }

subscription_parse_hostport() { printf '%s' "$1" | awk -F@ '{print $NF}' | awk -F/ '{print $1}'; }

cron_subscription_refresh_run() {
    update_loading_progress() { :; }
    load_xrayui_config
    subscription_fetch_protocols cron || return 0
    failover_resync_pool_outbounds
}

subscription_fetch_protocols() {
    local mode="$1"
    local payload="" links url key rc line line_count
    local cache_dir="$ADDON_SHARE_DIR/subcache"
    local tmp_urls="/tmp/xrayui_proto_urls.$$"
    local tmp_keys="/tmp/xrayui_proto_keys.$$"
    local tmp_lines="/tmp/xrayui_proto_links.$$"
    local tmp_pairs="/tmp/xrayui_proto_pairs.$$"
    local tmpc="/tmp/xrayui_proto_c.$$"
    local tmpd="/tmp/xrayui_proto_d.$$"
    local tmp_json="$XRAYUI_SUBSCRIPTIONS_FILE.tmp.$$"

    load_xrayui_config
    if [ "$mode" != "cron" ]; then
        load_ui_response
        payload=$(reconstruct_payload)
    fi

    links=${payload:-$subscriptionLinks}
    links=${links#\"}
    links=${links%\"}
    [ -z "$links" ] && return 0

    mkdir -p "$cache_dir"
    : >"$tmp_lines"
    : >"$tmp_keys"
    printf '%s\n' "$links" | tr '|' '\n' >"$tmp_urls"

    while IFS= read -r url || [ -n "$url" ]; do
        url=$(printf '%s' "$url" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        [ -z "$url" ] && continue
        key=$(printf '%s' "$url" | md5sum | cut -d' ' -f1)
        printf '%s\n' "$key" >>"$tmp_keys"

        update_loading_progress "Fetching content from $(subscription_url_host "$url") ..."
        log_debug "Fetching subscription from $(subscription_url_host "$url") ..."
        : >"$tmpd"
        if subscription_curl "$url" </dev/null >"$tmpc" 2>/dev/null; then
            subscription_decode_body "$tmpc" "$tmpd"
        fi
        rm -f "$tmpc"

        if subscription_body_has_links "$tmpd"; then
            cp "$tmpd" "$cache_dir/$key"
        elif [ -s "$cache_dir/$key" ]; then
            log_warn "Subscription $(subscription_url_host "$url") returned no usable links; using its last good copy"
            cp "$cache_dir/$key" "$tmpd"
        else
            log_warn "Subscription $(subscription_url_host "$url") returned no usable links"
            continue
        fi

        cat "$tmpd" >>"$tmp_lines"
        printf '\n' >>"$tmp_lines"
    done <"$tmp_urls"
    rm -f "$tmp_urls" "$tmpd"

    line_count=$(wc -l <"$tmp_lines")
    update_loading_progress "Processing $line_count links ..."
    log_info "Processing $line_count subscription links ..."

    while IFS= read -r line || [ -n "$line" ]; do
        case "$line" in
        *://*) ;;
        *%3[Aa]%2[Ff]%2[Ff]*) line=$(urldecode "$line") ;;
        esac
        printf '%s\n' "$line"
    done <"$tmp_lines" | awk '
        {
            gsub(/\t/, " ")
            gsub(/^ +| +$/, "")
            if ($0 == "") next
            i = index($0, "://")
            if (i < 2) next
            s = tolower(substr($0, 1, i - 1))
            k = ""
            if (s == "vless") k = "vless"
            else if (s == "vmess") k = "vmess"
            else if (s == "trojan") k = "trojan"
            else if (s == "ss") k = "shadowsocks"
            else if (s == "hy2" || s == "hysteria" || s == "hysteria2") k = "hysteria"
            else if (s == "wireguard" || s == "wg" || s == "wgcf") k = "wireguard"
            if (k == "" || seen[$0]++) next
            print k "\t" $0
        }' >"$tmp_pairs"

    rc=1
    if [ -s "$tmp_pairs" ]; then
        jq -R -s -c '
            split("\n")
            | map(select(length>0) | split("\t") | {name: .[0], link: (.[1:] | join("\t"))})
            | group_by(.name)
            | map({key: .[0].name, value: map(.link)})
            | from_entries
        ' "$tmp_pairs" >"$tmp_json" 2>/dev/null
        if jq -e 'type == "object" and length > 0' "$tmp_json" >/dev/null 2>&1; then
            mv -f "$tmp_json" "$XRAYUI_SUBSCRIPTIONS_FILE"
            rc=0
        fi
    fi

    if [ "$rc" -ne 0 ]; then
        log_error "Subscription refresh found no usable links; the previous list was kept"
    elif [ -z "$payload" ]; then
        for f in "$cache_dir"/*; do
            [ -f "$f" ] || continue
            grep -qx "${f##*/}" "$tmp_keys" || rm -f "$f"
        done
    fi

    rm -f "$tmp_json" "$tmp_lines" "$tmp_pairs" "$tmp_keys"
    return "$rc"
}
