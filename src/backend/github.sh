#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

github_proxy_url() {
    load_xrayui_config
    local url="$1"
    local ghproxy="${github_proxy:-""}"

    # Only modify the URL if it contains 'github.com'
    case "$url" in
    *github.com*)
        if [ -n "$ghproxy" ]; then
            url="${ghproxy}${url}"
        fi
        ;;
    esac

    echo "$url"
}
