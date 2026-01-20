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
            --argjson rep "$rep" '
                . as $root
                | ($pos|tonumber) as $i
                | (try $root.outbounds[$i].streamSettings.sockopt catch null) as $sock
                | .outbounds[$i] = (
                    ($rep + {surl:$url, tag:$tag})
                    | if $sock != null
                        then .streamSettings = ((.streamSettings // {}) + {sockopt:$sock})
                        else .
                        end
                    )')
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
    hy2://*) subscription_parse_hysteria "$link" ;;
    hysteria://*) subscription_parse_hysteria "$link" ;;
    hysteria2://*) subscription_parse_hysteria "$link" ;;
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

subscription_parse_hysteria() {
    local link="$1"
    local rest proto

    # Determine protocol and extract rest of URL
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

    local userhostport="${rest%%\?*}"
    local qs="${rest#*\?}"
    qs="${qs%%#*}"

    # Extract auth (password) from user@host:port or from query params
    local auth=""
    if echo "$userhostport" | grep -q '@'; then
        auth="${userhostport%%@*}"
        # If auth contains username:password format, extract password
        if echo "$auth" | grep -q ':'; then
            auth="${auth#*:}"
        fi
    fi

    local hostport
    hostport=$(subscription_parse_hostport "$userhostport")
    local host="${hostport%%:*}"
    local port="${hostport##*:}"

    local tag_raw
    tag_raw=$(printf '%s' "$link" | awk -F'#' '{print $2}')
    local tag="$(urldecode "${tag_raw:-hysteria}")"

    # Extract parameters
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

    # Determine final auth value
    [ -n "$auth_param" ] && auth="$auth_param"
    [ -n "$password_param" ] && auth="$password_param"

    # Determine version (hy2:// and hysteria2:// = version 2 by default)
    [ "$proto" = "hy2" ] || [ "$proto" = "hysteria2" ] && [ -z "$version" ] && version="2"

    # Determine SNI
    local final_sni="${sni:-$peer}"

    # Build hysteria settings
    local hysteria_settings
    hysteria_settings=$(jq -nc \
        --arg auth "$auth" \
        --arg version "$version" \
        --arg congestion "$congestion" \
        --arg up "${up:-$upmbps}" \
        --arg down "${down:-$downmbps}" '
        {}
        | if ($auth|length)>0 then .auth=$auth else . end
        | if ($version|length)>0 then .version=($version|tonumber) else . end
        | if ($congestion|length)>0 then .congestion=$congestion else . end
        | if ($up|length)>0 then .up=$up else . end
        | if ($down|length)>0 then .down=$down else . end
    ')

    # Build TLS settings if needed
    local tls_settings="null"
    if [ -n "$final_sni" ] || [ "$insecure" = "1" ] || [ "$insecure" = "true" ] || [ -n "$alpn" ] || [ -n "$pinSHA256" ]; then
        tls_settings=$(jq -nc \
            --arg sni "$final_sni" \
            --arg insecure "$insecure" \
            --arg alpn "$alpn" \
            --arg pin "$pinSHA256" '
            {}
            | if ($sni|length)>0 then .serverName=$sni else . end
            | if ($insecure=="1" or $insecure=="true") then .allowInsecure=true else . end
            | if ($alpn|length)>0 then .alpn=($alpn|split(",")) else . end
            | if ($pin|length)>0 then .pinnedPeerCertificateSha256=($pin|split(",")) else . end
        ')
    fi

    # Build salamander obfuscation if present
    local udpmasks="null"
    if [ "$obfs" = "salamander" ] && [ -n "$obfsPassword" ]; then
        udpmasks=$(jq -nc --arg pwd "$obfsPassword" '[{type:"salamander",password:$pwd}]')
    fi

    jq -nc --arg tag "$tag" --arg host "$host" --arg port "$port" \
        --arg version "$version" \
        --argjson hysteria "$hysteria_settings" \
        --argjson tls "$tls_settings" \
        --argjson udpmasks "$udpmasks" '
    {
        protocol:"hysteria",
        tag:$tag,
        settings:{
            address:$host,
            port:($port|tonumber)
        }
        + (if ($version|length)>0 then {version:($version|tonumber)} else {} end),
        streamSettings:(
            {network:"hysteria",hysteriaSettings:$hysteria}
            + (if $tls!=null then {security:"tls",tlsSettings:$tls} else {} end)
            + (if $udpmasks!=null then {udpmasks:$udpmasks} else {} end)
        )
    }'
}

subscription_parse_kv() { printf '%s' "$1" | tr '&' '\n' | awk -F= -v k="$2" '$1==k{print $2}'; }

subscription_parse_hostport() { printf '%s' "$1" | awk -F@ '{print $NF}' | awk -F/ '{print $1}'; }

subscription_fetch_protocols() {
    load_xrayui_config
    load_ui_response

    payload=$(reconstruct_payload)
    links=${payload:-$subscriptionLinks}
    links=${links#\"}
    links=${links%\"}
    [ -z "$links" ] && return 0

    tmp_json="/tmp/xrayui_proto_json.$$"
    tmp_lines="/tmp/xrayui_proto_links.$$"
    tmp_pairs="/tmp/xrayui_proto_pairs.$$"
    tmp_urls="/tmp/xrayui_proto_urls.$$"
    : >"$tmp_lines"
    : >"$tmp_pairs"
    : >"$tmp_urls"
    printf '%s\n' "$links" | tr '|' '\n' >"$tmp_urls"

    log_debug "Fetching subscription links: $tmp_urls ..."

    while IFS= read -r url; do
        url=$(printf '%s' "$url" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        [ -z "$url" ] && continue

        tmpc="/tmp/xrayui_proto_c.$$"
        tmpd="/tmp/xrayui_proto_d.$$"
        : >"$tmpc"
        : >"$tmpd"

        update_loading_progress "Fetching content from $url ..."
        log_debug "Fetching content from $url ..."
        curl -fsL --max-time 20 -A xrayui/1.0 "$url" </dev/null >"$tmpc" 2>/dev/null || true

        sz=$(wc -c <"$tmpc")
        if [ "$sz" -eq 0 ]; then
            log_debug "No content fetched from $url"
            rm -f "$tmpc" "$tmpd"
            continue
        fi

        tr -d '\r' <"$tmpc" >"$tmpc.tmp" && mv "$tmpc.tmp" "$tmpc"

        prev=$(safe_preview <"$tmpc")

        if grep '://' "$tmpc" >/dev/null 2>&1; then
            cp "$tmpc" "$tmpd"
        else
            if base64 -d <"$tmpc" >"$tmpd" 2>/dev/null; then :; else cp "$tmpc" "$tmpd"; fi
        fi

        prev2=$(safe_preview <"$tmpd")

        cat "$tmpd" >>"$tmp_lines"
        printf '\n' >>"$tmp_lines"

        rm -f "$tmpc" "$tmpd"
    done <"$tmp_urls"
    rm -f "$tmp_urls"

    line_count=$(wc -l <"$tmp_lines")
    update_loading_progress "Processing $line_count links ..."
    log_info "Processing $line_count links ..."
    while IFS= read -r line; do
        line=$(printf '%s' "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        [ -z "$line" ] && continue

        case $line in *%[0-9A-Fa-f][0-9A-Fa-f]*) line=$(urldecode_pct "$line") ;; esac
        case "$line" in *://*) : ;; *) continue ;; esac

        #  case "$line" in *#*) line=${line%%#*} ;; esac
        line=$(printf '%s' "$line" | tr '\t' ' ')

        scheme=${line%%://*}
        scheme=$(printf '%s' "$scheme" | tr '[:upper:]' '[:lower:]')
        case "$scheme" in
        vless) key=vless ;;
        vmess) key=vmess ;;
        trojan) key=trojan ;;
        ss) key=shadowsocks ;; # keep ss:// link, key is "shadowsocks"
        hy2 | hysteria | hysteria2) key=hysteria ;;
        wireguard | wg | wgcf) key=wireguard ;;
        *) continue ;;
        esac
        printf '%s\t%s\n' "$key" "$line" >>"$tmp_pairs"
        log_debug "Parsed protocol: $key from line: $line"
    done <"$tmp_lines"

    log_debug "Parsing protocols from $tmp_pairs ..."

    if [ -s "$tmp_pairs" ]; then
        awk -F '\t' 'NF==2{print $0}' "$tmp_pairs" |
            jq -R -s -c '
          split("\n")
          | map(select(length>0) | split("\t") | {name: .[0], link: .[1]})
          | sort_by(.name)
          | group_by(.name)
          | map({key: (.[0].name), value: (map(.link) | unique)})
          | from_entries
        ' >"$tmp_json" || printf '{}' >"$tmp_json"

        log_debug "Saved protocols to $tmp_json"
    else
        printf '{}' >"$tmp_json"
        log_error "No valid protocols found in $tmp_pairs"
    fi
    mv "$tmp_json" "$XRAYUI_SUBSCRIPTIONS_FILE"

    rm -f "$tmp_json" "$tmp_lines" "$tmp_pairs"
    return 0
}
