#!/bin/bash

XRAYUI_VERSION=${1:-"1.0.0"}

NODE_ENV=production npx vite build

echo "Updating XRAYUI_VERSION to $XRAYUI_VERSION in /dist/xrayui"
sed -i "s/^XRAYUI_VERSION=.*/XRAYUI_VERSION=\"$XRAYUI_VERSION\"/" dist/xrayui

tar --transform 's|^|xrayui/|' -czf asuswrt-merlin-xrayui.tar.gz -C dist .
