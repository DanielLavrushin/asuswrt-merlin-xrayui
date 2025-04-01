github_proxy_url() {
    load_xrayui_config
    local github_url="$1"
    local ghproxy="${github_proxy}"
    if [ -z "$ghproxy" ]; then
        github_url="${ghproxy}${github_url}"
    fi
    echo "$github_url"
}
