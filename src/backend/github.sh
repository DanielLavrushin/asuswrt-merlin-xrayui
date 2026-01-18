#!/bin/sh
# shellcheck disable=SC2034  # codacy:Unused variables

github_proxy_url() {
    load_xrayui_config
    local url="$1"
    local ghproxy="${github_proxy:-""}"

    if [ -z "$url" ] || [ "$url" = "null" ]; then
        echo "$url"
        return
    fi

    case "$url" in
    *github.com*)
        if [ -n "$ghproxy" ] && [ "$ghproxy" != "null" ]; then
            url="${ghproxy}${url}"
        fi
        ;;
    esac

    echo "$url"
}
