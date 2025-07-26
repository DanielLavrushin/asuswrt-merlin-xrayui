#!/bin/sh
# shellcheck disable=SC2034

process_subscriptions() {
    local config_file="$1"
    local cfg=$(cat "$1")
    local idx url proto tag fetched rep
    local temp_config="/tmp/xray_server_config_new.json"
    while IFS= read -r entry; do
        [ -z "$entry" ] && continue
        idx=$(printf '%s' "$entry" | jq -r '.idx')
        url=$(printf '%s' "$entry" | jq -r '.url')
        proto=$(printf '%s' "$entry" | jq -r '.proto')
        tag=$(printf '%s' "$entry" | jq -r '.tag')
        fetched=$(curl -fsL "$url") || continue
        if is_json "$fetched"; then
            rep=$(printf '%s' "$fetched" | jq -c --arg t "$tag" --arg p "$proto" '
                (.outbounds // [])
                | map(select((($t != "") and (.tag==$t)) or (.protocol==$p)))
                | first')
        else
            local maybe
            maybe=$(b64d "$fetched")
            if is_json "$maybe"; then
                rep=$(printf '%s' "$maybe" | jq -c --arg t "$tag" --arg p "$proto" '
                    (.outbounds // [])
                    | map(select((($t != "") and (.tag==$t)) or (.protocol==$p)))
                    | first')
            else
                local lst
                lst=$(subscription_process_url_list "$proto" "$fetched")
                rep=$(subscription_select_outbound_by_proto "$proto" "$lst")
            fi
        fi
        [ -z "$rep" ] || [ "$rep" = "null" ] && continue
        cfg=$(printf '%s' "$cfg" | jq -c \
            --arg pos "$idx" \
            --arg url "$url" \
            --arg tag "$tag" \
            --argjson rep "$rep" \
            '.outbounds[( $pos|tonumber )] = ($rep + {surl:$url, tag:$tag})')
    done <<EOF
$(printf '%s' "$cfg" | jq -c '.outbounds
    | to_entries[]
    | select(.value.surl and .value.surl!="")
    | {idx:.key,url:.value.surl,proto:.value.protocol,tag:(.value.tag//"")}')
EOF
    printf '%s' "$cfg" >"$temp_config" && cp "$temp_config" "$config_file" && rm -f "$temp_config"
}

subscription_parse_link_to_outbound() {
    local link="$1"
    case "$link" in
    vmess://*) subscription_parse_vmess "$link" ;;
    vless://*) subscription_parse_vless "$link" ;;
    trojan://*) subscription_parse_trojan "$link" ;;
    ss://*) subscription_parse_shadowsocks "$link" ;;
    *) return 1 ;;
    esac
}

subscription_select_outbound_by_proto() {
    local proto="$1"
    shift
    printf '%s\n' "$*" | jq -c --arg p "$proto" '
        map(select(.protocol==$p)) | first // empty'
}

subscription_process_url_list() {
    local proto="$1"
    local fetched="$2"
    local decoded
    decoded=$(echo "$fetched" | base64 -d 2>/dev/null) || decoded="$fetched"
    echo "$decoded" | tr -d '\r' | while IFS= read -r line; do
        [ -z "$line" ] && continue
        subscription_parse_link_to_outbound "$line" || true
    done | jq -s '.'
}

subscription_parse_network() {
    local net="$1"
    local seed="$2"
    local qhost="$3"
    local mode="$4"
    local path="$5"
    local hdr="$6"
    [ -z "$hdr" ] && hdr="none"
    jq -nc --arg n "$net" --arg seed "$seed" --arg qh "$qhost" --arg mo "$mode" --arg pa "$path" --arg ht "$hdr" '
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
            {kcpSettings:{
                mtu:1350,
                tti:50,
                uplinkCapacity:5,
                downlinkCapacity:20,
                congestion:false,
                readBufferSize:2,
                writeBufferSize:2,
                header:{type:$ht},
                seed:$seed
            }}
        elif $n=="ws" then
            {wsSettings:{
                heartbeatPeriod:0,
                host:$qh,
                path:$pa
            }}
        elif $n=="grpc" then
            {grpcSettings:{
                authority:$qh,
                serviceName:$pa
            }}
        elif $n=="tcp" then
            {tcpSettings:{header:{type:$ht}}}
        else {} end'
}
subscription_parse_vmess() {
    local link="$1"
    local payload="${link#vmess://}"
    local j
    j=$(echo "$payload" | base64 -d 2>/dev/null) || return 1

    local add port id ps aid scy tls net path hdr qhost
    add=$(echo "$j" | jq -r '.add')
    port=$(echo "$j" | jq -r '.port')
    id=$(echo "$j" | jq -r '.id')
    ps=$(echo "$j" | jq -r '.ps // "vmess"')
    aid=$(echo "$j" | jq -r '.aid // 0')
    scy=$(echo "$j" | jq -r '.scy // "auto"')
    tls=$(echo "$j" | jq -r '.tls // "none"')
    net=$(echo "$j" | jq -r '.net // "tcp"')
    path=$(echo "$j" | jq -r '.path // ""')
    hdr=$(echo "$j" | jq -r '.type // ""')
    qhost=$(echo "$j" | jq -r '.host // ""')

    local seed=""
    [ "$net" = "kcp" ] && seed="$path"

    local network
    network=$(subscription_parse_network "$net" "$seed" "$qhost" "" "$path" "$hdr")

    jq -nc --arg tag "$ps" --arg address "$add" --arg port "$port" \
        --arg id "$id" --arg aid "$aid" --arg scy "$scy" --arg tls "$tls" \
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
            + $network
        )
    }'
}

subscription_parse_vless() {
    local link="$1"
    local rest="${link#vless://}"
    local userhostport="${rest%%\?*}"
    local qs="${rest#*\?}"
    qs="${qs%%#*}"
    local uuid="${userhostport%%@*}"
    local hostport
    hostport=$(subscription_parse_hostport "$userhostport")
    local host="${hostport%%:*}"
    local port="${hostport##*:}"
    local tag_raw
    tag_raw=$(printf '%s' "$link" | awk -F'#' '{print $2}')
    local tag="$(urldecode "${tag_raw:-vless}")"
    local net
    net=$(urldecode "$(subscription_parse_kv "$qs" "type")")
    [ -z "$net" ] && net="tcp"
    local sec
    sec=$(urldecode "$(subscription_parse_kv "$qs" "security")")
    [ -z "$sec" ] && sec="none"
    local flow
    flow=$(urldecode "$(subscription_parse_kv "$qs" "flow")")
    local fp
    fp=$(urldecode "$(subscription_parse_kv "$qs" "fp")")
    local pbk
    pbk=$(urldecode "$(subscription_parse_kv "$qs" "pbk")")
    local sni
    sni=$(urldecode "$(subscription_parse_kv "$qs" "sni")")
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
    [ -z "$path" ] && path=""
    local hdr
    hdr=$(urldecode "$(subscription_parse_kv "$qs" "headerType")")
    local network
    network=$(subscription_parse_network "$net" "$seed" "$qhost" "$mode" "$path" "$hdr")
    jq -nc --arg tag "$tag" --arg host "$host" --arg port "$port" --arg id "$uuid" \
        --arg flow "$flow" --arg net "$net" --arg sec "$sec" \
        --arg fp "$fp" --arg pbk "$pbk" --arg sni "$sni" --arg seed "$seed" --arg sid "$sid" --arg spx "$spx" \
        --argjson network "$network" '
    {
        protocol:"vless",
        tag:$tag,
        settings:{
            vnext:[{
                address:$host,
                port:($port|tonumber),
                users:[ if ($flow|length)>0 then {id:$id,flow:$flow,encryption:"none"} else {id:$id,encryption:"none"} end ]
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
               } else {} end)
            + $network
        )
    }'
}

subscription_parse_trojan() {
    local link="$1"
    local rest="${link#trojan://}"
    local userhostport="${rest%%\?*}"
    local qs="${rest#*\?}"
    qs="${qs%%#*}"

    local password="${userhostport%%@*}"
    local hostport
    hostport=$(subscription_parse_hostport "$userhostport")
    local host="${hostport%%:*}"
    local port="${hostport##*:}"

    local tag_raw
    tag_raw=$(printf '%s' "$link" | awk -F'#' '{print $2}')
    local tag="$(urldecode "${tag_raw:-trojan}")"

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

    local qhost
    qhost=$(urldecode "$(subscription_parse_kv "$qs" "host")")
    local mode
    mode=$(urldecode "$(subscription_parse_kv "$qs" "mode")")
    local path
    path=$(urldecode "$(subscription_parse_kv "$qs" "path")")
    local hdr
    hdr=$(urldecode "$(subscription_parse_kv "$qs" "headerType")")

    local network
    network=$(subscription_parse_network "$net" "$sid" "$qhost" "$mode" "$path" "$hdr")

    jq -nc --arg tag "$tag" --arg host "$host" --arg port "$port" --arg pwd "$password" \
        --arg net "$net" --arg sec "$sec" \
        --arg fp "$fp" --arg pbk "$pbk" --arg sni "$sni" --arg sid "$sid" --arg spx "$spx" \
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

    local tag_raw
    tag_raw=$(printf '%s' "$link" | awk -F'#' '{print $2}')
    local tag="$(urldecode "${tag_raw:-ss}")"

    local methodpass hostport
    if echo "$before_hash" | grep -q '@'; then
        local left="${before_hash%@*}"
        local right="${before_hash#*@}"
        local decoded_left
        decoded_left=$(echo "$left" | base64 -d 2>/dev/null) || decoded_left="$left"
        if echo "$decoded_left" | grep -q ':'; then
            methodpass="$decoded_left"
        else
            methodpass="$left"
        fi
        hostport="$right"
    else
        local creds_hostport
        creds_hostport=$(echo "$before_hash" | base64 -d 2>/dev/null)
        methodpass="${creds_hostport%@*}"
        hostport="${creds_hostport#*@}"
    fi

    hostport="${hostport%%\?*}"
    local method="${methodpass%%:*}"
    local password="${methodpass#*:}"
    local host="${hostport%%:*}"
    local port="${hostport##*:}"

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

    local network
    network=$(subscription_parse_network "$net" "" "$qhost" "$mode" "$path" "$hdr")

    jq -nc --arg tag "$tag" --arg host "$host" --arg port "$port" \
        --arg method "$method" --arg password "$password" \
        --arg net "$net" --arg sec "$sec" --arg fp "$fp" --arg sni "$sni" \
        --arg alpn "$alpn" --arg ai "$ai" --argjson network "$network" '
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
                      allowInsecure:($ai=="true" or $ai=="1" or $ai=="yes"),
                      alpn:(if ($alpn|length)>0 then ($alpn|split(",")) else ["h3","h2","http/1.1"] end),
                      fingerprint:(if ($fp|length)>0 then $fp else "chrome" end),
                      serverName:$sni
                  }
               } else {} end)
            + $network
        )
    }'
}

subscription_parse_kv() { printf '%s' "$1" | tr '&' '\n' | awk -F= -v k="$2" '$1==k{print $2}'; }
subscription_parse_hostport() { printf '%s' "$1" | awk -F@ '{print $NF}' | awk -F/ '{print $1}'; }
