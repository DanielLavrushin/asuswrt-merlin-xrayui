#!/usr/bin/env bash
# ── extract_cmd.sh ───────────────────────────────────────────────
# Recursively collect <% … %> blocks from *text files only*,
# deduplicate them, and store the list next to this script.
#   ./extract_cmd.sh [-e "ext1 ext2 …"] [files | dirs …]
# ----------------------------------------------------------------
set -euo pipefail

# ── 1. Defaults ─────────────────────────────────────────────────
exts_default=(html htm js css tpl asp php jsx tsx vue shtml txt)

# ── 2. CLI parsing: optional  -e | --exts  ----------------------
exts=("${exts_default[@]}")
while [[ $# -gt 0 ]]; do
    case $1 in
    -e | --exts)
        IFS=' ' read -r -a exts <<<"$2"
        shift 2
        ;;
    --)
        shift
        break
        ;;
    -*)
        echo "Unknown option: $1" >&2
        exit 1
        ;;
    *) break ;;
    esac
done
inputs=("$@") # whatever is left

# ── 3. Where to put the output ----------------------------------
script_dir=$(cd -- "$(dirname -- "$0")" && pwd)
out_file="$script_dir/extracted_commands.txt"
: >"$out_file"

# ── 4. Build the file list safely (no eval) ---------------------
declare -a files

build_ext_args() {   # -> array: ( -iname '*.html' -o … )
    local -n _out=$1 # nameref to caller-supplied array
    _out=()
    for ext in "${exts[@]}"; do
        _out+=(-iname "*.${ext,,}" -o -iname "*.${ext^^}" -o)
    done
    unset '_out[-1]' # drop trailing -o
}

declare -a find_filter
build_ext_args find_filter

collect_files() {
    local path=$1
    while IFS= read -r -d '' f; do files+=("$f"); done \
        < <(find "$path" -type f \( "${find_filter[@]}" \) -print0)
}

if ((${#inputs[@]} == 0)); then
    collect_files .
else
    for arg in "${inputs[@]}"; do
        if [[ -d $arg ]]; then
            collect_files "$arg"
        elif [[ -f $arg ]]; then
            files+=("$arg")
        else
            printf '⚠️  Skipping “%s” (not a file/dir)\n' "$arg" >&2
        fi
    done
fi

printf "🗂  Scanning %d file(s)…\n" "${#files[@]}"

# ── 5. Extract <% … %> blocks ----------------------------------
perl -0777 -ne '
    BEGIN { $n = 0 }                         # progress counter
    END   { print STDERR "\n" }               # tidy newline
    { print STDERR (++$n % 60 ? "." : ".\n") }

    while (/<%([\s\S]*?)%>/g) {
        $cmd = $1;
        next if $cmd =~ /[^\x09\x0A\x0D\x20-\x7E]/;   # skip binary
        $cmd =~ s/^\s+|\s+$//g;
        $cmd =~ s/\s+/ /g;
        $seen{$cmd} = 1;
    }
    END { print "$_\n" for sort { lc($a) cmp lc($b) } keys %seen }
' "${files[@]}" >"$out_file"

printf "\n✅  Wrote %d unique command(s) → %s\n" \
    "$(wc -l <"$out_file")" "$out_file"
