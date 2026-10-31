#!/bin/sh
HARNESS_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_DIR=$(cd "$HARNESS_DIR/../../.." && pwd)
FO_STATE=$1
shift
LC_ALL=C
export LC_ALL

sed -e '/^import /d' "$REPO_DIR/src/backend/failover.sh" >"$FO_STATE/failover.$$.sh"
. "$FO_STATE/failover.$$.sh"
rm -f "$FO_STATE/failover.$$.sh"

failover_merge_outbound "$1" "$2" "$3" "$4"
