#!/bin/sh
HARNESS_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_DIR=$(cd "$HARNESS_DIR/../../.." && pwd)
ST_STATE=$1
shift

mkdir -p "$ST_STATE/tmp" "$ST_STATE/jffs/addons"
sed -e '/^import /d' \
    -e "s#/tmp/#$ST_STATE/tmp/#g" \
    -e "s#/jffs/#$ST_STATE/jffs/#g" \
    "${ST_HELPER_SCRIPT:-$REPO_DIR/src/backend/_helper.sh}" >"$ST_STATE/helper.$$.sh"
. "$ST_STATE/helper.$$.sh"
rm -f "$ST_STATE/helper.$$.sh"

ev() { printf '%s\n' "$*" >>"$ST_STATE/events.log"; }
log_error() { ev "ERROR: $*"; }
log_warn() { ev "WARN: $*"; }
log_info() { :; }
log_ok() { :; }
log_debug() { :; }

mv() {
    local src="" dst="" arg
    for arg do
        src=$dst
        dst=$arg
    done
    src=${src#"$ST_STATE"/}
    dst=${dst#"$ST_STATE"/}
    ev "mv ${src%/*} -> ${dst%/*}"
    command mv "$@"
}

if [ -n "${ST_FAIL_WRITE:-}" ]; then
    cat() {
        command cat "$@" | head -c 16
        return 1
    }
fi

for step in "$@"; do
    eval "$step"
    ev "$step rc=$?"
done
