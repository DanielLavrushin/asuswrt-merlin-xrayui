# XRAYUI Changelog

## [0.37.1] - 2025-02-19

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure that outdated files are updated._

- FIXED: A confusing description under the `Devices` field in the `Redirect/Bypass` manager.
- ADDED: A scrollbar to the `Devices` field to correctly display a large list of devices.
- UPDATED: Renamed `Device policies` to the `Redirect/Bypass policies` in the `Routing` section.

## [0.37.0] - 2025-02-18

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure that outdated files are updated._

- FIXED: a bug where editing a rule changed its position in the list.
- FIXED: a bug that prevented disabling the connection status check in the `General Options`.
- FIXED: a bug where a geosite URL was replaced with a geoip URL.
  > _Important: Double-check your geosite URL. You may need to revert it to its original source._
- ADDED: When Xray runs in `TPROXY` mode, the maximum number of open file descriptors is automatically raised to `65535` to accommodate high connection counts.
- ADDED: Introduced per-device “bypass” and “redirect” policies in both `NAT` (REDIRECT) and `TPROXY` modes.
  - `Bypass` policies now only proxy the specified ports and return all other traffic.
  - `Redirect` policies proxy all traffic except for the listed ports.
    This change unifies behavior between NAT and TPROXY and allows you to configure fine-grained rules per device.
    > _Important: Since the previous setting `Ports redirect/bypass policy` has been removed, you may need to adjust your settings in the new `Device policies` manager._

## [0.36.0] - 2025-02-12

> _Important: Please clear your browser cache (e.g.**Ctrl+F5**) to ensure that outdated files are updated._

- ADDED: It is now possible to `activate` or `deactivate` a rule by clicking a checkbox next to its name in the Routing Rules list.
- ADDED: Display of the `X-Ray Core` process uptime, showing how long the process has been running.
- ADDED: `X-Ray Core` version label in the `Configuration` section, aligned to the right.
- ADDED: General Options window to control settings such as logs, geodata source URLs, etc.
- FIXED: Incorrect modal window translation in general settings.
- FIXED: A bug where pressing the reconnect button spawned a new X-Ray process instead of restarting the existing one.
- UPDATED: When importing a configuration, DNS settings now revert to their default values (`queryStrategy` set to `UseIP` and `domainStrategy` set to `AsIs`).
- REMOVED: DNS `queryStrategy=UseIP` from the configuration, as it is now the default.
- REMOVED: Refactored the `Logs` section to display only logs; other settings were moved into the `General Options` window for log management.

## [0.35.3] - 2025-02-10

> _Important: Please clear your browser cache (e.g.**Ctrl+F5**) to ensure that outdated files are updated._

- ADDED: Support for older `Shadowsocks` encryption methods (`aes-256-gcm`, `aes-128-gcm`, `chacha20-ietf-poly1305`, `none`, and `plain`), alongside the recommended 2022 ciphers.
- CHANGED: Improved password generation logic, setting the password to an empty string for encryption methods that require no key.

## [0.35.2] - 2025-02-09

> _Important: Please clear your browser cache (e.g.**Ctrl+F5**) to ensure that outdated files are updated._

- ADDED: An `edit` button to edit existing proxy users.
- UPDATED: Swapped tags and proxy labels in the `Inbounds` and `Outbounds` display.
- IMPROVED: Enhanced UI for proxy rows with improved styling.
- IMPROVED: Enhanced UI for routing rules rows with improved styling.

## [0.35.1] - 2025-02-08

> _Important: Please clear your browser cache (e.g.**Ctrl+F5**) to ensure that outdated files are updated._

- FIXED: missing compile-time flag `__VUE_PROD_DEVTOOLS__` casued the app crash on production.
- ADDED: Language support.

## [0.34.3] - 2025-02-06

> _Important: Please clear your browser cache (e.g.**Ctrl+F5**) to ensure that outdated files are updated._

- FIXED: Resolved an issue during configuration import where routing rules were incorrectly assigned to a default `proxy` tag instead of the imported one (#21).
- ADDED: Introduced an `Outbound` column to the routing rules list for improved clarity.

## [0.34.2] - 2025-02-05

> _Important: Please clear your browser cache (e.g.**Ctrl+F5**) to ensure that outdated files are updated._

- ADDED: Ability to define an array of users on the routing rule level. The rule will now take effect when the source user's email matches any address in the array.
- FIXED: Resolved an issue where QR code PNG images with transparent backgrounds could not be read.
- FIXED: Addressed a warning in the `import manager` related to replacing a configuration when the full config import checkbox was unchecked.
- IMPROVED: Enhanced the inbound/outbound tag editing so that any changes are now automatically propagated to the corresponding rules.
- UPDATED: Relocated XRAYUI options (`Check Connection` and `Restart on Reboot`) to the General Options window.

## [0.34.0] - 2025-02-05

> _Important: Please clear your browser cache (e.g.**Ctrl+F5**) to ensure that outdated files are updated._

- ADDED: Version command to display the current XRAYUI version. Usage: `/jffs/scripts/xrayui version`.
- ADDED: Symlink to `/jffs/scripts/xrayui` for direct invocation of `xrayui`.
- ADDED: XRAYUI configuration file (`/opt/etc/xrayui.conf`) to allow specifying custom community `geosite` and `geoip` URLs.
- FIXED: `HTTP` Inbound type error in the `allowTransparent` property.
- FIXED: Custom geodata tag files were not loaded properly.
- FIXED: Unable to delete large custom geodata files.
- REMOVED: Constraints on the address field that prevented entering domain names.
- UPDATED: Due to limitations in `curl` on some routers, the connection-check logic was moved from the server-side to the client-side, and the endpoint was switched from `freeapi.com` to `ip-api.com`.

## [0.33.0] - 2025-02-04

> _Important: Please clear your browser cache (e.g.**Ctrl+F5**) to ensure that outdated files are updated._

- UPDATED: Introduced a `General options` row in the `Configuration` section.
- ADDED: A new option, `Check connection to xray server`, in the `General options` section of Client mode. Enabling it allows XRAYUI to check the connection status of the outbound proxy. After restarting Xray, the check sends a connection request to an external service ([freeipapi.com](https://freeipapi.com)) to verify that the connection is truly established via the outbound proxy. Next to the status, a flag representing the X-RAY outbound server `country` location appears to indicate the connection status. Please note that it takes a couple of seconds after restart to validate the connection. When this option is enabled, XRAYUI automatically adds some system configurations (an inbound `SOCKS` proxy and a system routing rule).
- ADDED: A new modal window for browsing the raw Xray configuration file. It replaces the old `show config` button in the `Configuration` section. You can now view a nicely formatted JSON version of your configuration and choose to hide sensitive data before copying and sharing it. However, it is still recommended reviewing the configuration carefully before sharing to ensure that no sensitive information is accidentally exposed.
- IMPROVED: Compliance with `Codacy` code standards.

## [0.32.1] - 2025-02-02

> _Important: Please clear your browser cache (e.g.**Ctrl+F5**) to ensure that outdated files are updated._

- ADDED: When importing a new client configuration, it is now possible to select the services to unblock. They will automatically be added to the `routing rules`, so there's no need to set them up manually later.
- ADDED: A checkbox `Don't break my network devices` in the `import configuration` window. This will set the default mode to `bypass`, potentially preventing disruption to `IoT` devices on the network.
- FIXED: Correctly display advanced `DNS` server name when defined.
- FIXED: The `bypass`/`redirect` mode dropdown value sometimes remains unchanged.
- FIXED: A bug with loading display function was not resolved.
- FIXED: Implement normalization methods for TLS security protocol classes and update interfaces.
- REMOVED: Unused/abandoned parts of the code.
- IMPROVED: Mounting of the menu during installation.
- IMPROVED: Minor cosmetic fixes and changes.

## [0.31.1] - 2025-01-30

> _Important: Please clear your browser cache (e.g.**Ctrl+F5**) to ensure that outdated files are updated._

- ADDED: `transport` and `secururity` labels for Outbounds proxies.
- IMPROVED: visual `proxy`, `transport` and `security` labels.
- IMPROVED: Enhanced the visual loading and waiting display for a smoother user experience.

## [0.31.0] - 2025-01-29

> _Important: Please clear your browser cache (e.g.**Ctrl+F5**) to ensure that outdated files are updated._

- ADDED: Display selected mode in the `Ports Bypass/Redirect Policy`.
- ADDED: A new `Logs` section to monitor the Xray logs from the web UI.
- UPDATED: Moved the outbounds `import` button to the `Configuration` section.
- IMPROVED: Completely refactored the process of importing a new configuration connection in a `client` mode. The Import row has been migrated to the `Configuration` section and is now located under `Import Config File`. In the import modal, a new checkbox titled `I'd like to have a complete setup!` has been introduced. Enabling this option will create all required and missing configuration options (Inbounds, Outbounds, DNS settings etc.) when importing a server connection URL, allowing to set up a complete Xray client configuration with a single click. **Note: Enabling this will overwrite all previous configurations**.
- IMPROVED: Enhanced the visual loading and waiting display for a smoother user experience.
- IMPROVED: Removed the `TCP fragmentation` checkbox from the FREEDOM proxy and simplified the fragment packet method handling.

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
