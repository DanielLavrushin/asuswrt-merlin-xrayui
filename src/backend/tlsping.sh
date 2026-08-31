#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

TLSPING_TIMEOUT=20

tlsping_resolve_ip() {
    nslookup "$1" 2>/dev/null | awk '
        function colons(s,   n) {
            n = gsub(/:/, ":", s)
            return n
        }
        /^Name:/ { seen = 1 }
        seen && /Address/ {
            for (i = 1; i <= NF; i++) {
                if (v4 == "" && $i ~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) {
                    v4 = $i
                } else if (v6 == "" && $i ~ /^[0-9A-Fa-f:.]+$/ && colons($i) >= 2) {
                    v6 = $i
                }
            }
        }
        END {
            if (v4 != "") print v4
            else if (v6 != "") print v6
        }'
}

tlsping_strip_brackets() {
    local v="$1"
    v="${v#[}"
    echo "${v%]}"
}

tlsping_is_ip() {
    set -- "$(tlsping_strip_brackets "$1")"
    if echo "$1" | grep -qE '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$'; then
        return 0
    fi
    echo "$1" | grep -qE '^[0-9A-Fa-f:.]*:[0-9A-Fa-f:.]*:[0-9A-Fa-f:.]*$'
}

tlsping_target() {
    case "$1" in
        \[*\]) echo "$1:$2" ;;
        *:*) echo "[$1]:$2" ;;
        *) echo "$1:$2" ;;
    esac
}

tlsping_run() {
    local target="$1"
    local dial_ip="$2"
    local outfile="$3"
    local pid
    local waited=0

    if [ -n "$dial_ip" ]; then
        xray tls ping -ip "$dial_ip" "$target" >"$outfile" 2>&1 &
    else
        xray tls ping "$target" >"$outfile" 2>&1 &
    fi
    pid=$!

    while [ "$waited" -lt "$TLSPING_TIMEOUT" ]; do
        kill -0 "$pid" 2>/dev/null || break
        sleep 1
        waited=$((waited + 1))
    done

    if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null
        sleep 1
        kill -9 "$pid" 2>/dev/null
        wait "$pid" 2>/dev/null
        return 124
    fi

    wait "$pid"
}

tlsping_section() {
    awk -v marker="$2" '
        $0 == marker { flag = 1; next }
        /^-----/ { flag = 0 }
        flag { print }
    ' "$1"
}

tlsping_certificates_json() {
    local section="$1"
    local leaf_name="$2"

    printf '%s\n' "$section" | awk -v leaf_name="$leaf_name" '
        function trim(v) {
            gsub(/^[ \t]+|[ \t]+$/, "", v)
            return v
        }
        function emit(type, name, hash) {
            hash = trim(hash)
            if (length(hash) == 64 && hash ~ /^[0-9a-fA-F]+$/) {
                print type "\t" trim(name) "\t" toupper(hash)
            }
        }
        /^Cert.s leaf SHA256:/ {
            hash = $0
            sub(/^[^:]*:/, "", hash)
            emit("leaf", leaf_name, hash)
            next
        }
        /^Cert.s CA <.*> SHA256:/ {
            name = $0
            sub(/^[^<]*</, "", name)
            sub(/>[^>]*$/, "", name)
            hash = $0
            sub(/^.*SHA256:/, "", hash)
            emit("ca", name, hash)
            next
        }
    ' | jq -R -s 'split("\n") | map(select(length > 0) | split("\t") | { type: .[0], name: .[1], sha256: .[2] })'
}

tlsping_save() {
    local target="$1"
    local ip="$2"
    local mode="$3"
    local error="$4"
    local certs="$5"
    local sni_error="$6"

    load_ui_response

    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq \
        --arg target "$target" \
        --arg ip "$ip" \
        --arg mode "$mode" \
        --arg error "$error" \
        --arg sniError "$sni_error" \
        --argjson certs "$certs" \
        '.tlsping = { target: $target, ip: $ip, mode: $mode, error: $error, sniError: $sniError, certificates: $certs }')

    if [ -z "$UI_RESPONSE" ]; then
        log_error "Failed to update JSON content with TLS probe results."
        return 1
    fi

    save_ui_response
}

tlsping_clear() {
    load_ui_response
    UI_RESPONSE=$(echo "$UI_RESPONSE" | jq 'del(.tlsping)')
    [ -n "$UI_RESPONSE" ] && save_ui_response
}

tlsping_fetch() {
    tlsping_clear
    update_loading_progress "Probing the server certificate..." 0

    local payload address server_name port domain dial_ip target outfile used_ip mode section certs domains failure sni_error
    local rc=0

    payload=$(reconstruct_payload)
    address=$(echo "$payload" | jq -r '.address // empty' 2>/dev/null)
    server_name=$(echo "$payload" | jq -r '.serverName // empty' 2>/dev/null)
    port=$(echo "$payload" | jq -r '.port // empty' 2>/dev/null)

    [ -z "$port" ] && port=443

    if [ -n "$server_name" ]; then
        domain="$server_name"
    else
        domain="$address"
    fi

    if [ -z "$domain" ]; then
        tlsping_save "" "" "" "No server name or address to probe." "[]"
        update_loading_progress "Nothing to probe." 100
        return 1
    fi

    target=$(tlsping_target "$domain" "$port")

    if [ -n "$server_name" ] && [ -n "$address" ] && [ "$address" != "$server_name" ]; then
        if tlsping_is_ip "$address"; then
            dial_ip=$(tlsping_strip_brackets "$address")
        else
            dial_ip=$(tlsping_resolve_ip "$address")
        fi
        if [ -z "$dial_ip" ]; then
            tlsping_save "$target" "" "" "Could not resolve the outbound address $address. Refusing to probe $domain instead, its certificates would not be the ones this outbound connects to." "[]"
            update_loading_progress "Could not resolve the outbound address." 100
            return 1
        fi
    fi
    log_info "Probing TLS certificates of $target${dial_ip:+ via $dial_ip}"

    outfile="/tmp/xrayui-tlsping.$$"
    tlsping_run "$target" "$dial_ip" "$outfile"
    rc=$?

    if [ "$rc" -eq 124 ]; then
        rm -f "$outfile"
        tlsping_save "$target" "$dial_ip" "" "Timed out after ${TLSPING_TIMEOUT}s." "[]"
        update_loading_progress "TLS probe timed out." 100
        return 1
    fi

    used_ip=$(sed -n 's/^Using IP:[[:space:]]*//p' "$outfile" | head -n 1)

    mode="sni"
    section=$(tlsping_section "$outfile" "Pinging with SNI")
    if ! printf '%s\n' "$section" | grep -q '^Handshake succeeded'; then
        sni_error=$(printf '%s\n' "$section" | sed -n 's/^Handshake failure:[[:space:]]*//p' | head -n 1)
        mode="nosni"
        section=$(tlsping_section "$outfile" "Pinging without SNI")
    fi

    if ! printf '%s\n' "$section" | grep -q '^Handshake succeeded'; then
        failure=$(grep -m 1 -E '^(Handshake failure:|Failed to )' "$outfile" | sed 's/^Handshake failure:[[:space:]]*//')
        [ -z "$failure" ] && failure=$(grep -vE '^(-+|TLS ping:|Using IP:|Pinging |TLS ping finished|[[:space:]]*)$' "$outfile" | head -n 1)
        [ -z "$failure" ] && failure="TLS handshake failed."
        rm -f "$outfile"
        tlsping_save "$target" "$used_ip" "" "$failure" "[]"
        update_loading_progress "TLS handshake failed." 100
        return 1
    fi

    domains=$(printf '%s\n' "$section" | sed -n "s/^Cert's allowed domains:[[:space:]]*//p" | head -n 1 | tr -d '[]' | awk '{print $1}')
    certs=$(tlsping_certificates_json "$section" "$domains")
    rm -f "$outfile"

    if [ -z "$certs" ] || [ "$certs" = "[]" ]; then
        tlsping_save "$target" "$used_ip" "$mode" "No certificate hashes reported - the certificate carries no SAN domains, or Xray-core is older than 26.2.4." "[]"
        update_loading_progress "No certificate hashes reported." 100
        return 1
    fi

    tlsping_save "$target" "$used_ip" "$mode" "" "$certs" "$sni_error"
    update_loading_progress "Server certificate probed." 100
}
