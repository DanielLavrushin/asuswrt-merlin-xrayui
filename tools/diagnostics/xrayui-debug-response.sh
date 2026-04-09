#!/bin/sh
# Debug script to capture why initial_response() fails
# Usage: curl -sL https://raw.githubusercontent.com/DanielLavrushin/asuswrt-merlin-xrayui/xrayui-diagnostics-tools/tools/diagnostics/xrayui-debug-response.sh -o /tmp/dbg.sh && chmod +x /tmp/dbg.sh && /tmp/dbg.sh
export PATH="/opt/bin:/opt/sbin:/sbin:/bin:/usr/sbin:/usr/bin"

RESP="/www/user/xrayui/xray-ui-response.json"
LOG="/tmp/initresponse_debug.log"

echo "XRAYUI Response Debug"
echo "====================="
echo ""

rm -f "$LOG"

echo "Step 1: Stopping xrayui..."
/jffs/scripts/xrayui service_event stop 2>/dev/null
sleep 2

echo "Step 2: Capturing response file BEFORE startup..."
echo "=== BEFORE STARTUP $(date) ===" >> "$LOG"
if [ -f "$RESP" ]; then
    echo "File exists, size: $(wc -c < "$RESP") bytes" >> "$LOG"
    echo "Content:" >> "$LOG"
    cat "$RESP" >> "$LOG"
else
    echo "File does NOT exist" >> "$LOG"
fi
echo "" >> "$LOG"

echo "Step 3: Starting xrayui in background..."
/jffs/scripts/xrayui service_event startup &
STARTUP_PID=$!

echo "Step 4: Polling response file during startup..."
i=0
while [ "$i" -lt 15 ]; do
    sleep 1
    i=$((i + 1))
    if [ -f "$RESP" ]; then
        SIZE=$(wc -c < "$RESP")
        VALID="invalid"
        jq empty "$RESP" 2>/dev/null && VALID="valid"
        echo "  t=${i}s: size=${SIZE} json=${VALID}" | tee -a "$LOG"

        # Try the exact jq call that fails in initial_response
        UI_RESPONSE=$(cat "$RESP")
        ERR=$(echo "$UI_RESPONSE" | jq --arg geoip "test" --arg geosite "test" --arg geoipurl "test" --arg geositeurl "test" '.geodata.geoip_url = $geoipurl' 2>&1 >/dev/null)
        RC=$?
        if [ "$RC" -ne 0 ]; then
            echo "  >>> JQ FAILED at t=${i}s! exit=$RC err=$ERR" | tee -a "$LOG"
            echo "  >>> File content at failure:" >> "$LOG"
            cat "$RESP" >> "$LOG"
            echo "" >> "$LOG"
            echo "  >>> UI_RESPONSE variable (first 500 chars):" >> "$LOG"
            echo "$UI_RESPONSE" | head -c 500 >> "$LOG"
            echo "" >> "$LOG"
        fi
    else
        echo "  t=${i}s: file missing" | tee -a "$LOG"
    fi
done

echo ""
echo "Step 5: Final state..."
echo "=== AFTER STARTUP $(date) ===" >> "$LOG"
if [ -f "$RESP" ]; then
    SIZE=$(wc -c < "$RESP")
    echo "File size: $SIZE bytes" | tee -a "$LOG"
    jq -r '.xray.core_version // "MISSING"' "$RESP" 2>/dev/null | while read -r v; do
        echo "core_version: $v" | tee -a "$LOG"
    done
    jq -r 'if .loading then "STUCK" else "absent" end' "$RESP" 2>/dev/null | while read -r v; do
        echo "loading: $v" | tee -a "$LOG"
    done
fi

echo ""
echo "Done. Full log saved to $LOG"
echo "Run: cat $LOG"
