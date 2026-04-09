#!/bin/sh
# ============================================================================
# XRAYUI Diagnostics Script (standalone)
# Investigates version 0.0 / broken response file issues
#
# Usage (run directly on the router via SSH):
#   curl -sL https://raw.githubusercontent.com/DanielLavrushin/asuswrt-merlin-xrayui/main/tools/diagnostics/xrayui-diag.sh | sh
#
# Or download and run:
#   curl -sLO https://raw.githubusercontent.com/DanielLavrushin/asuswrt-merlin-xrayui/main/tools/diagnostics/xrayui-diag.sh
#   chmod +x xrayui-diag.sh && ./xrayui-diag.sh
# ============================================================================

export PATH="/opt/bin:/opt/sbin:/sbin:/bin:/usr/sbin:/usr/bin"

DIAG_FILE="/tmp/xrayui_diag_$(date +%Y%m%d_%H%M%S).txt"

# Colors (disabled if not a terminal)
if [ -t 1 ]; then
    C_RED='\033[0;31m'
    C_GRN='\033[0;32m'
    C_YLW='\033[0;33m'
    C_CYN='\033[0;36m'
    C_RST='\033[0m'
else
    C_RED='' C_GRN='' C_YLW='' C_CYN='' C_RST=''
fi

ok() { printf "${C_GRN}[OK]${C_RST}   %s\n" "$*"; }
fail() { printf "${C_RED}[FAIL]${C_RST} %s\n" "$*"; }
warn() { printf "${C_YLW}[WARN]${C_RST} %s\n" "$*"; }
info() { printf "${C_CYN}[INFO]${C_RST} %s\n" "$*"; }
hdr() { printf "\n========== %s ==========\n" "$*"; }

# ldd wrapper — BusyBox may not have ldd
check_libs() {
    local bin_path="$1"
    if command -v ldd >/dev/null 2>&1; then
        local ldd_out=$(ldd "$bin_path" 2>&1)
        if echo "$ldd_out" | grep -q "not found"; then
            fail "$bin_path has MISSING shared libraries:"
            echo "$ldd_out" | grep "not found" | while read -r line; do
                echo "       $line"
            done
            return 1
        elif echo "$ldd_out" | grep -qi "not a dynamic executable\|statically linked"; then
            ok "$(basename "$bin_path"): statically linked"
        else
            ok "$(basename "$bin_path") shared libraries: all present"
        fi
    elif [ -d /proc ] && command -v readelf >/dev/null 2>&1; then
        local missing=""
        for lib in $(readelf -d "$bin_path" 2>/dev/null | grep NEEDED | sed 's/.*\[//;s/\]//'); do
            if ! find /opt/lib /lib /usr/lib -name "$lib" 2>/dev/null | grep -q .; then
                missing="$missing $lib"
            fi
        done
        if [ -n "$missing" ]; then
            fail "$(basename "$bin_path") has MISSING libraries:$missing"
            return 1
        else
            ok "$(basename "$bin_path") shared libraries: all found"
        fi
    else
        info "$(basename "$bin_path"): ldd not available, skipping library check"
    fi
    return 0
}

# ── Run all checks, tee to file ──
run_diagnostics() {

    hdr "XRAYUI DIAGNOSTICS"
    info "Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    # ── System ──
    hdr "SYSTEM"
    info "Model:    $(nvram get productid 2>/dev/null || echo 'N/A')"
    info "Firmware: $(nvram get buildno 2>/dev/null || echo 'N/A') ext:$(nvram get extendno 2>/dev/null || echo 'N/A')"
    info "Arch:     $(uname -m)"
    info "Kernel:   $(uname -r)"
    info "Uptime:   $(uptime 2>/dev/null || cat /proc/uptime 2>/dev/null)"
    echo ""

    # ── Disk space ──
    hdr "DISK SPACE"
    df -h /jffs /opt /tmp /www 2>/dev/null || df /jffs /opt /tmp /www 2>/dev/null || warn "df not available"
    echo ""

    # ── Entware ──
    hdr "ENTWARE"
    if [ -x /opt/bin/opkg ]; then
        ok "opkg found: /opt/bin/opkg"
    else
        fail "opkg NOT found or not executable"
    fi
    echo ""

    # ── Critical packages ──
    hdr "CRITICAL PACKAGES"
    for pkg in jq sed grep curl xray; do
        pkg_path=$(which "$pkg" 2>/dev/null)
        if [ -n "$pkg_path" ]; then
            pkg_opkg=$(opkg list-installed 2>/dev/null | grep "^${pkg} " || echo "not from opkg")
            ok "$pkg: $pkg_path ($pkg_opkg)"
        else
            fail "$pkg: NOT FOUND"
        fi
    done
    echo ""

    # ── jq deep check ──
    hdr "JQ HEALTH CHECK"
    jq_path=$(which jq 2>/dev/null)
    if [ -z "$jq_path" ]; then
        fail "jq is NOT installed — this will break response generation entirely"
    else
        info "jq path: $jq_path"
        info "jq version: $(jq --version 2>&1)"

        # file type
        if command -v file >/dev/null 2>&1; then
            info "jq binary: $(file "$jq_path" 2>/dev/null)"
        fi

        check_libs "$jq_path"

        # functional tests
        t1=$(echo '{"a":"b"}' | jq -r '.a' 2>&1)
        if [ "$t1" = "b" ]; then
            ok "jq basic read test: PASS"
        else
            fail "jq basic read test: FAIL (got: '$t1')"
        fi

        t2=$(echo '{}' | jq --arg v "1.2.3" '.xray.core_version = $v' 2>&1)
        if echo "$t2" | jq -r '.xray.core_version' 2>/dev/null | grep -q "1.2.3"; then
            ok "jq nested assign test: PASS"
        else
            fail "jq nested assign test: FAIL (got: '$t2')"
        fi

        t3=$(echo '{}' | jq '.a = 1' 2>/dev/null | jq '.b = 2' 2>/dev/null | jq '.c = 3' 2>&1)
        if echo "$t3" | jq -e '.a == 1 and .b == 2 and .c == 3' >/dev/null 2>&1; then
            ok "jq chained pipe test: PASS"
        else
            fail "jq chained pipe test: FAIL (got: '$t3')"
        fi

        t4=$(echo '{}' | jq --argjson v 42 '.num = $v' 2>&1)
        if echo "$t4" | jq -e '.num == 42' >/dev/null 2>&1; then
            ok "jq --argjson test: PASS"
        else
            fail "jq --argjson test: FAIL (got: '$t4')"
        fi
    fi
    echo ""

    # ── sed health check ──
    hdr "SED HEALTH CHECK"
    sed_path=$(which sed 2>/dev/null)
    if [ -z "$sed_path" ]; then
        fail "sed is NOT installed"
    else
        info "sed path: $sed_path"
        info "sed version: $(sed --version 2>&1 | head -1)"

        if command -v file >/dev/null 2>&1; then
            info "sed binary: $(file "$sed_path" 2>/dev/null)"
        fi

        check_libs "$sed_path"

        # functional tests
        s1=$(echo "hello world" | sed 's/world/test/' 2>&1)
        if [ "$s1" = "hello test" ]; then
            ok "sed basic substitution: PASS"
        else
            fail "sed basic substitution: FAIL (got: '$s1')"
        fi

        # test sed -E (extended regex, used in install.sh)
        s2=$(echo "user42.asp" | sed -E 's/.*user([0-9]+)\.asp$/\1/' 2>&1)
        if [ "$s2" = "42" ]; then
            ok "sed extended regex (-E): PASS"
        else
            fail "sed extended regex (-E): FAIL (got: '$s2')"
        fi

        # test sed with delete pattern (used in _helper.sh for cleanup_payload)
        s3=$(printf 'xray_payload0=abc\nother=def\nxray_payload1=ghi\n' | sed '/^xray_payload/d' 2>&1)
        if echo "$s3" | grep -q "other=def" && ! echo "$s3" | grep -q "xray_payload"; then
            ok "sed pattern delete: PASS"
        else
            fail "sed pattern delete: FAIL (got: '$s3')"
        fi

        # test sed on shebang removal (used in response.sh for firewall hooks)
        s4=$(printf '#!/bin/sh\necho hello\n' | sed '1{/^#!/d}' 2>&1)
        if [ "$s4" = "echo hello" ]; then
            ok "sed shebang removal: PASS"
        else
            fail "sed shebang removal: FAIL (got: '$s4')"
        fi
    fi
    echo ""

    # ── grep health check ──
    hdr "GREP HEALTH CHECK"
    grep_path=$(which grep 2>/dev/null)
    if [ -z "$grep_path" ]; then
        fail "grep is NOT installed"
    else
        info "grep path: $grep_path"
        info "grep version: $(grep --version 2>&1 | head -1)"

        check_libs "$grep_path"

        # test grep -oE (used for xray version parsing)
        g1=$(echo "Xray 1.8.24 (Xray, Penetrates Everything.)" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" 2>&1 | head -n 1)
        if [ "$g1" = "1.8.24" ]; then
            ok "grep -oE version parse: PASS"
        else
            fail "grep -oE version parse: FAIL (got: '$g1')"
        fi
    fi
    echo ""

    # ── Xray binary ──
    hdr "XRAY BINARY"
    xray_path=$(which xray 2>/dev/null)
    if [ -z "$xray_path" ]; then
        fail "xray NOT FOUND in PATH"
        info "PATH=$PATH"
        if [ -f /opt/sbin/xray ]; then
            warn "/opt/sbin/xray exists but is not reachable"
            ls -la /opt/sbin/xray
            if [ ! -x /opt/sbin/xray ]; then
                fail "/opt/sbin/xray is NOT executable"
            fi
            check_libs /opt/sbin/xray
        else
            fail "/opt/sbin/xray does NOT exist on disk"
        fi
    else
        ok "xray found: $xray_path"
        ls -la "$xray_path"

        if command -v file >/dev/null 2>&1; then
            info "xray binary: $(file "$xray_path" 2>/dev/null)"
        fi

        check_libs "$xray_path"

        info "--- xray version (raw output) ---"
        xray version 2>&1
        info "--- end raw output ---"

        raw_ver=$(xray version 2>&1)
        xray_exit=$?
        info "xray version exit code: $xray_exit"

        parsed_ver=$(echo "$raw_ver" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -n 1)
        if [ -n "$parsed_ver" ]; then
            ok "Parsed xray version: $parsed_ver"
        else
            fail "Could NOT parse version from xray output"
            warn "This is likely the cause of 'version 0.0' in the UI"
        fi
    fi
    echo ""

    # ── Geodata ──
    hdr "GEODATA FILES"
    for f in /opt/sbin/geoip.dat /opt/sbin/geosite.dat; do
        if [ -f "$f" ]; then
            ok "$f ($(ls -lh "$f" | awk '{print $5}'), $(date -r "$f" '+%Y-%m-%d %H:%M' 2>/dev/null || echo 'date N/A'))"
        else
            warn "$f: MISSING"
        fi
    done
    echo ""

    # ── XRAYUI config ──
    hdr "XRAYUI CONFIG"
    if [ -f /opt/etc/xrayui.conf ]; then
        ok "/opt/etc/xrayui.conf exists"
        ls -la /opt/etc/xrayui.conf
        echo "--- contents (sensitive values redacted) ---"
        sed 's/\(qrcode_settings=\).*/\1[REDACTED]/' /opt/etc/xrayui.conf
        echo "--- end ---"
    else
        warn "/opt/etc/xrayui.conf: MISSING"
    fi
    echo ""

    # ── Response file ──
    hdr "UI RESPONSE FILE"
    resp_file="/www/user/xrayui/xray-ui-response.json"
    info "Expected at: $resp_file"

    if [ -f "$resp_file" ]; then
        ls -la "$resp_file"
        fsize=$(wc -c <"$resp_file")
        info "Size: $fsize bytes"

        if [ "$fsize" -lt 5 ]; then
            fail "Response file is suspiciously small ($fsize bytes)!"
            echo "--- raw contents ---"
            cat "$resp_file"
            echo ""
            echo "--- end ---"
        else
            if which jq >/dev/null 2>&1; then
                if jq empty "$resp_file" 2>/dev/null; then
                    ok "JSON validation: VALID"
                else
                    fail "JSON validation: INVALID"
                    echo "--- first 500 bytes ---"
                    dd if="$resp_file" bs=500 count=1 2>/dev/null
                    echo ""
                    echo "--- end ---"
                fi

                info "Key fields from response:"
                echo "  core_version: $(jq -r '.xray.core_version // "MISSING"' "$resp_file" 2>/dev/null)"
                echo "  ui_version:   $(jq -r '.xray.ui_version // "MISSING"' "$resp_file" 2>/dev/null)"
                echo "  profile:      $(jq -r '.xray.profile // "MISSING"' "$resp_file" 2>/dev/null)"
                echo "  loading:      $(jq -r 'if .loading then "PRESENT (stuck?)" else "absent (good)" end' "$resp_file" 2>/dev/null)"
                echo "  profiles:     $(jq -r 'if .xray.profiles then (.xray.profiles | length | tostring) else "MISSING" end' "$resp_file" 2>/dev/null) entries"
                echo "  uptime:       $(jq -r '.xray.uptime // "MISSING"' "$resp_file" 2>/dev/null)"
            else
                warn "Cannot validate JSON — jq not available"
                echo "--- first 500 bytes ---"
                dd if="$resp_file" bs=500 count=1 2>/dev/null
                echo ""
                echo "--- end ---"
            fi
        fi
    else
        fail "Response file does NOT exist!"
        resp_dir=$(dirname "$resp_file")
        if [ -d "$resp_dir" ]; then
            warn "Parent directory $resp_dir exists. Contents:"
            ls -la "$resp_dir/" 2>/dev/null
        else
            fail "Parent directory $resp_dir does NOT exist either"
        fi
    fi
    echo ""

    # ── Web directory ──
    hdr "WEB DIRECTORY"
    if [ -d /www/user/xrayui ]; then
        ls -la /www/user/xrayui/ 2>/dev/null | head -20
    else
        fail "/www/user/xrayui/ does NOT exist"
    fi
    echo ""

    # ── Xray config files ──
    hdr "XRAY CONFIG FILES"
    if [ -d /opt/etc/xray ]; then
        ls -la /opt/etc/xray/*.json 2>/dev/null || warn "No .json files in /opt/etc/xray/"
        if [ -f /opt/etc/xray/config.json ]; then
            if which jq >/dev/null 2>&1; then
                if jq empty /opt/etc/xray/config.json 2>/dev/null; then
                    ok "config.json: valid JSON"
                else
                    fail "config.json: INVALID JSON"
                fi
            fi
        fi
    else
        fail "/opt/etc/xray/ directory does NOT exist"
    fi
    echo ""

    # ── Process status ──
    hdr "PROCESS STATUS"
    xray_pid=$(pidof xray 2>/dev/null)
    if [ -n "$xray_pid" ]; then
        ok "Xray is running (PID: $xray_pid)"
        ls -la /proc/$xray_pid/exe 2>/dev/null || true
    else
        warn "Xray is NOT running"
    fi

    if [ -f /var/run/xray.pid ]; then
        info "PID file: /var/run/xray.pid (content: $(cat /var/run/xray.pid 2>/dev/null))"
    else
        info "PID file: not present"
    fi
    echo ""

    # ── Script hooks ──
    hdr "SCRIPT HOOKS"
    # Check main script exists
    if [ -f /jffs/scripts/xrayui ]; then
        ok "/jffs/scripts/xrayui exists ($(wc -c </jffs/scripts/xrayui) bytes)"
        ls -la /jffs/scripts/xrayui
    else
        fail "/jffs/scripts/xrayui: MISSING (critical!)"
    fi
    # Check hook scripts
    for script in /jffs/scripts/post-mount /jffs/scripts/service-event /jffs/scripts/nat-start /jffs/scripts/dnsmasq.postconf; do
        if [ -f "$script" ]; then
            hook_line=$(grep "xrayui" "$script" 2>/dev/null | head -3)
            if [ -n "$hook_line" ]; then
                ok "$script:"
                echo "$hook_line" | while read -r line; do
                    echo "       $line"
                done
            else
                warn "$script exists but has NO xrayui entries"
            fi
        else
            info "$script: not present"
        fi
    done
    echo ""

    # ── Simulate response generation ──
    hdr "RESPONSE GENERATION SIMULATION"
    info "Reproducing the same pipeline used by initial_response()..."

    sim_ok=true
    SIM_RESP="{}"

    # Step 1: basic jq assign
    SIM_RESP=$(echo "$SIM_RESP" | jq --arg v "test" '.step1 = $v' 2>&1)
    if [ $? -ne 0 ]; then
        fail "Step 1 (basic assign): FAILED — $SIM_RESP"
        sim_ok=false
    else
        ok "Step 1 (basic jq assign): PASS"
    fi

    # Step 2: --argjson
    if [ "$sim_ok" = true ]; then
        SIM_RESP=$(echo "$SIM_RESP" | jq --argjson v 42 '.step2 = $v' 2>&1)
        if [ $? -ne 0 ]; then
            fail "Step 2 (--argjson): FAILED — $SIM_RESP"
            sim_ok=false
        else
            ok "Step 2 (--argjson): PASS"
        fi
    fi

    # Step 3: multi-arg with version
    if [ "$sim_ok" = true ]; then
        test_ver=$(xray version 2>/dev/null | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -n 1)
        SIM_RESP=$(echo "$SIM_RESP" | jq --arg xv "$test_ver" --arg uv "1.0.0" \
            '.xray.core_version = $xv | .xray.ui_version = $uv' 2>&1)
        if [ $? -ne 0 ]; then
            fail "Step 3 (version assign): FAILED — $SIM_RESP"
            sim_ok=false
        else
            ok "Step 3 (version assign): PASS (core_version='$test_ver')"
        fi
    fi

    # Step 4: find + jq profiles
    if [ "$sim_ok" = true ]; then
        test_profiles=$(find /opt/etc/xray -maxdepth 1 -type f -name "*.json" -exec basename {} \; 2>/dev/null | jq -R -s -c 'split("\n")[:-1]' 2>&1)
        [ -z "$test_profiles" ] && test_profiles="[]"
        SIM_RESP=$(echo "$SIM_RESP" | jq --argjson p "$test_profiles" '.xray.profiles = $p' 2>&1)
        if [ $? -ne 0 ]; then
            fail "Step 4 (profiles): FAILED — $SIM_RESP"
            sim_ok=false
        else
            ok "Step 4 (profiles): PASS"
        fi
    fi

    # Step 5: del(.loading)
    if [ "$sim_ok" = true ]; then
        SIM_RESP=$(echo "$SIM_RESP" | jq 'del(.loading)' 2>&1)
        if [ $? -ne 0 ]; then
            fail "Step 5 (del loading): FAILED — $SIM_RESP"
            sim_ok=false
        else
            ok "Step 5 (del loading): PASS"
        fi
    fi

    # Step 6: write to temp file
    if [ "$sim_ok" = true ]; then
        echo "$SIM_RESP" >/tmp/xrayui_diag_test.json 2>&1
        if [ $? -ne 0 ]; then
            fail "Step 6 (write to /tmp): FAILED"
            sim_ok=false
        else
            ok "Step 6 (write to /tmp): PASS"
            rm -f /tmp/xrayui_diag_test.json
        fi
    fi

    echo ""
    if [ "$sim_ok" = true ]; then
        ok "SIMULATION: ALL STEPS PASSED"
        info "Simulated response:"
        echo "$SIM_RESP" | jq . 2>/dev/null || echo "$SIM_RESP"
    else
        fail "SIMULATION: FAILED — see errors above"
    fi
    echo ""

    # ── Syslog ──
    hdr "RECENT XRAYUI SYSLOG (last 40 lines)"
    if [ -f /tmp/syslog.log ]; then
        grep -i "XRAYUI\|xray" /tmp/syslog.log 2>/dev/null | tail -40 || warn "No matching syslog entries"
    else
        warn "/tmp/syslog.log not found"
    fi
    echo ""

    # ── Relevant opkg packages ──
    hdr "INSTALLED PACKAGES (relevant)"
    opkg list-installed 2>/dev/null | grep -iE "^(jq|curl|sed|grep|openssl|libc |librt|libpthread|zlib|base64|coreutils|iptables|flock|unzip) " || warn "Could not list packages"
    echo ""

    hdr "END OF DIAGNOSTICS"
}

# ── Main ──
echo "XRAYUI Diagnostics — collecting data..."
echo "Output will be saved to: $DIAG_FILE"
echo ""

run_diagnostics 2>&1 | tee "$DIAG_FILE"

echo ""
echo "=============================================="
echo "Diagnostics saved to: $DIAG_FILE"
echo ""
echo "You can copy-paste the output above, or run:"
echo "  cat $DIAG_FILE"
echo "=============================================="
