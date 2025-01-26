# XRAYUI Changelog

## [0.xx.x] - 2025-xx-xx

- ADDED: disaply selected mode in the `Ports Bypass/Redirect Policy`.

## [0.30.0] - 2025-01-26

- IMPROVED: Overall refactoring. The `xrayui` code now has a [![Codacy Badge](https://app.codacy.com/project/badge/Grade/5afa683e2930418a9b13efac6537aad8)](https://app.codacy.com/gh/DanielLavrushin/asuswrt-merlin-xrayui/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade), which required many fixes and changes. See [pull request](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/pull/8).
- ADDED: `logrotate` setup to manage xray log file growth over time.
- FIXED: Wrong `netstat` package name, replaced with `net-tools-netstat`.
- UPDATED: GitHub action to follow build standards.
- UPDATED: Bumped `golang` version to `1.22.2` following security recommendations.

## [0.29.1] - 2025-01-24

- ADDED: `Custom GEODATA Files Manager`. A new button labeled `Manage Local Files` has been added to the `Routing` section. This feature allows you to store rule-based domain and IP lists in standalone geodat files (similar to geosite.dat and geoip.dat). You can compile these files directly from the router's web interface. Assign a tag (e.g., `discord`), and after compiling, use it in the routing rules as `ext:xrayui:discord`.
- ADDED: `Cache-Control` meta tag with a `no-cache` value. This addition attempts to combat Asus web caching mechanisms.
- IMPROVED: Enhanced the installation process by checking for and installing missing `Entware` dependencies before installing XrayUI. The required dependencies now include `sed`, `jq`, `iptables`, `netstat`, `openssl`, and `flock`.
- UPDATED: Modernized the `DOCTYPE` declaration and HTML structure by replacing Asus's `XHTML 1.0 Transitional` with `HTML5` standards.
- FIXED: Resolved a bug in the `Ports Bypass/Redirect Policy` that previously prevented saving empty ports fields.
- FIXED: Corrected issues with the fixme command to ensure it functions as intended.
- FIXED: wrong opkg package check during the installation (openssl should be libopenssl)
- IMPROVED: Ensured that all necessary Merlin script files are executable, addressing issue #7.

## [0.28.0] - 2025-01-22

- ADDED: **IMPORTANT!** For Xray in client mode, a new option called `Ports Bypass/Redirect Policy` has been added to the routing section. This controls how the router manages traffic to different ports. By default, it is set to `redirect` mode, meaning all traffic is redirected to the Xray inbound port. You can add ports to the exclusion list if certain ports should not be handled by Xray. When switching to `bypass` mode, all traffic bypasses Xray, and you can specify ports that should be redirected to Xray. This feature allows for fine-tuning traffic management to Xray directly from the web interface.
- ADDED: A `60-second` waiting period on startup to ensure that Xray starts at the correct time, after applying `iptables` rules.
- FIXED: The Xray server IP is no longer exposed in the logs.

## [0.27.1] - 2025-01-22

- ADDED: `Iptables` rules to ignore Steam/Playstation/XBOX/EGS ports.
- FIXED: Correctly display `Clients Online` in server mode.

## [0.27.0] - 2025-01-21

- ADDED: Import support for outbound configurations in client mode. You can now upload a QR code or provide an xray URL. A new import button was added to the `outbounds` section.
- ADDED: Internal mechanism to parse xray proxy URLs (currently only supports `VLESS`; more protocols coming).
- ADDED: Emergency function `/jffs/scripts/xrayui` fixme to automatically address unexpected `xrayui` issues.
- UPDATED: Refactored stream settings handling and normalization for various proxy types.
- UPDATED: Made the `spiderX` field visible in `REALITY` while in client mode.
- IMPROVED: Enhanced error message output on the Xray-Core router side when xray fails to start. Now a friendly `yellow exclamation` mark indicates what went wrong.
- IMPROVED: Updated default configuration handling to avoid saving default xray parameters, thus reducing noise and file size.
- IMPROVED: Fixed a residual payload issue in `custom_settings` (#2, #7).
- IMPROVED: Normalized the `Sniffing` object when saving settings.
- IMPROVED: Removed the entire `sockopt` entity when it is turned `off`.
- IMPROVED: Added more user-friendly messages and improved validation during `QR` generation.
- FIXED: Removed the hardcoded server port in the connected clients list for server mode (#6).
- FIXED: The security object now correctly retains its default setting visually (`REALITY`, `TLS` - cosmetic fix).
- FIXED: Corrected mapping for inbound types during configuration load.
- FIXED: When the `sockopt.mark` field is empty, it is removed rather than being set as a string.

## [0.26.1] - 2025-01-20

- UPDATED: Added custom firewall script hooks for both `TPROXY` and `DIRECT` modes, executed before final interception rules are applied. This ensures user-defined rules (e.g., WAN interface exclusions) are processed in time.
- ADDED: Display a hint next to the geodata files update button indicating when the files were last updated.
- ADDED: DNAT-based exclusion in `TPROXY` rules to bypass inbound port-forwards (#4).
- IMPROVED: Refactored `SSL certificates` generation and updated output file to cert.crt.
- IMPROVED: Refactored `REALITY` keys generation.
- IMPROVED: Refactored `Wireguard` private/public keys generation.
- UPDATED: Show `regenerate` public key button for a `Wireguard` client only when a private key is generated; hidden otherwise.

## [0.25.0] - 2025-01-19

- ADDED: Exclude `WireGuard` subnet and port from XRAYUI `iptables` rules.
- FIXED: Restored custom `iptables` user scripts logic on xray `start` and `stop`.
- IMPROVED: XRAYUI Change log window redesigned

## [0.24.2] - 2025-01-19

- ADDED: `wan_ip` property to `app.html` in the front-end.
- ADDED: QR code generation for `VLESS` and `VMESS` connections.
- IMPROVED: Error handling for missing config.json; added `generate_default_config` functionality.
- IMPROVED: Backend with minor cosmetic changes.

## [0.23.1] - 2025-01-18

- ADDED: Excluded `STUN` (WebRTC) traffic from Xray routing to resolve compatibility issues with video conferencing applications (e.g., Zoom, Microsoft Teams).
- UPDATED: Improved confidentiality by removing Xray server IPs from being exposed in the logs.
- REMOVED: unused iptables `nat` rules for a `client tproxy` operation mode

## [0.23.0] - 2025-01-18

- ADDED: Numerous hints and detailed help texts for fields; almost all fields now have detailed descriptions.
- ADDED: GitHub `geosite` domain list community link for quicker access (`Routing` section).
- ADDED: User confirmation dialog for deleting items from the form/config.
- ADDED: `Domain Strategy` field in the `sockopt` configuration.
- UPDATED: Show/hide of some transport fields based on proxy type (`inbound` vs. `outbound`).
- FIXED: Display issue with the autogenerated rule name when a user's custom name is provided.
- FIXED: Incorrect description for the `Wireguard` inbound.
- IMPROVED: Minor cosmetic changes to front-end styles.

## [0.22.2] - 2025-01-17

- ADDED: give custom friendly names to the routing rules (added `name` field).
- ADDED: Log an error when curl failed to download/update `geosite` files.
- REMOVED: doublicate `testconfig` invokation form the `xrayui` script
- IMPROVED: minor cosmetic `xrayui` script fixes.
- IMPROVED: routing rules display names and enhance summary.
- IMPROVED: Refactor routing object sotring in json to be optional and update normalization logic.

## [0.22.1] - 2025-01-16

- FIXED: The `Toggle Xray startup on reboot` checkbox occasionally reverted to its previous state.

## [0.22.0] - 2025-01-15

- ADDED: An option to toggle Xray startup on router reboot (enable/disable) (available under `Connection Status`).
- ADDED: Introduced a Transparent Proxy `Mark` field in the `sockopt` configuration.
- ADDED: Added an `Outbound network interface` field in the `sockopt` configuration.
- ADDED: Implemented `sockopt object` normalization.
- IMPROVED: Redesigned outbound proxy server lookup to exclude entries from the NAT and MANGLE tables (issue #3).
- IMPROVED: Refactored client firewall rules configuration by separating DIRECT and TPROXY rules (issue #3).
- IMPROVED: Simplified and optimized the firewall rules cleanup process.
- UPDATED: Increased `configuration apply` time from 5 seconds to 10 seconds to ensure the Xray service fully restarts.
- REMOVED: Deprecated shell functions `client add` and `client delete` .

## [0.21.1] - 2025-01-13

- REMOVED: Comment out redundant iptables rules for TCP DNS redirection (persistent android issue)

## [0.21.0] - 2025-01-13

- ADDED: Support for dynamic changelog display.
- FIXED: Routing issues for Wi-Fi-connected devices by adding OUTPUT chain rules to process locally generated traffic.
- FIXED: DNS redirection inconsistencies by applying rules for both UDP and TCP DNS traffic (dport 53, 853).
- ADDED: Exclusion of traffic destined for the Xray server (SERVER_IP) to prevent routing loops.
- ADDED: Explicit exemption for NTP traffic (dports 123, 323) to ensure reliable time synchronization.
- ADDED: Logging for dropped packets in the XRAYUI chain to facilitate debugging.
- ADDED: PID file check before restarting XRAY server so XRAY is restarted only when it runs
- IMPROVED: Consistent marking of intercepted traffic with 0x8777 for proper routing via table 8777.

## [0.20.1] - 2025-01-12

- ADDED: Custom Scripts for Firewall Rules/IPTABLES (see readme)
- FIXED: wireless devices are not able to connect when enabling xray in a client mode
