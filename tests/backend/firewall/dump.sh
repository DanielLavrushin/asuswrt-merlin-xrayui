#!/bin/sh
HARNESS_DIR=$(cd "$(dirname "$0")" && pwd)
FW_STATE=$1
export FW_STATE
for fam in iptables ip6tables; do
    for tbl in filter nat mangle; do
        [ -f "$FW_STATE/$fam.$tbl.chains" ] || continue
        out=$(FAKE_IPT_FAMILY=$fam "$HARNESS_DIR/bin/iptables" -t "$tbl" -S 2>/dev/null | grep -v '^-P ')
        [ -n "$out" ] && printf '== %s -t %s\n%s\n' "$fam" "$tbl" "$out"
    done
done
for fam in 4 6; do
    [ -s "$FW_STATE/ip.rule.$fam" ] && printf '== ip -%s rule\n%s\n' "$fam" "$(cat "$FW_STATE/ip.rule.$fam")"
    for f in "$FW_STATE"/ip.route."$fam".*; do
        [ -s "$f" ] || continue
        printf '== ip -%s route table %s\n%s\n' "$fam" "${f##*.}" "$(cat "$f")"
    done
done
[ -s "$FW_STATE/ipset.sets" ] && printf '== ipset\n%s\n' "$(cat "$FW_STATE/ipset.sets")"
[ -s "$FW_STATE/ipset.entries" ] && printf '== ipset entries\n%s\n' "$(sort "$FW_STATE/ipset.entries")"
[ -f "$FW_STATE/learned.ipset" ] && printf '== learned file\n%s\n' "$(cat "$FW_STATE/learned.ipset")"
[ -s "$FW_STATE/events.log" ] && printf '== events\n%s\n' "$(cat "$FW_STATE/events.log")"
[ -s "$FW_STATE/messages.log" ] && printf '== messages\n%s\n' "$(cat "$FW_STATE/messages.log")"
exit 0
