# XRAYUI Changelog

## [0.62.3] - 2026-01-19

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: `Hysteria` outbound now correctly saves version field and properly removes empty configuration values.
- IMPROVED: `Hysteria` transport now supports all congestion control algorithms (`auto`, `reno`, `bbr`, `brutal`, `force-brutal`).
- IMPROVED: Added support for Hysteria subscription links (`hysteria://`, `hy2://`, `hysteria2://`).
- REMOVED: `Hysteria` version selector removed from UI as only Hysteria 2 is supported by Xray-core.

## [0.62.2] - 2026-01-19

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: `Shadowsocks` 2022 multi-user mode now works correctly - server method is preserved and client methods are properly cleared when using `2022-blake3-*` encryption methods.
- FIXED: Xray version switching no longer attempts to download from invalid URLs when `github_proxy` is set to `null`.
- ADDED: `proxy.lavrush.in` to the github proxies list.

## [0.62.1] - 2026-01-17

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: `TUN` inbound support. Network layer 3 interface for routing raw network traffic through Xray on router devices, enabling proxy support for applications/devices without built-in proxy capabilities.
- ADDED: `Hysteria` outbound protocol and transport support (versions 1 and 2).
- ADDED: `Hysteria` URL import support for `hy2://` and `hysteria://` protocols with TLS and Salamander obfuscation parsing.
- IMPROVED: `XHTTP` transport UI now includes "Uplink/Downlink Separation" configuration option (outbound only).
- ADDED: `TLS` security settings now support `PinnedPeerCertificateSha256` field for certificate pinning (outbound only).
- IMPROVED: Geodata files are now automatically updated when geosite or geoip URLs are changed in general settings.
- FIXED: Backend scripts no longer create backup files in `/jffs/.asdbk/`, preventing JFFS partition overflow over time.
- FIXED: `Shadowsocks` inbound now includes top-level `method` and `email` fields, resolving "unsupported cipher method" errors when using Shadowsocks 2022 protocols (fixes #259).
- FIXED: `Shadowsocks` inbound QR code generation now works correctly, generating proper Shadowsocks URI format (fixes #260).
- IMPROVED: `Shadowsocks` inbound UI now fully supports multi-language translations (EN, RU, UK, DE, CN).
- IMPROVED: QR code generation now includes editable server address and connection name fields, allowing customization for DDNS or custom naming (fixes #262).
- IMPROVED: QR code modal now displays the full connection URL in a copyable text area for easier sharing without additional tools (fixes #261).

## [0.61.0] - 2025-10-25

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: `B4SNI` [Support](https://github.com/DanielLavrushin/b4sni). Introduce a new way of monitoring and inspecting SNI extraction.
- FIXED: `Logrotate` no longer spams errors in `syslog` when xray-core logs are disabled.
- FIXED: `DNSMasq logs` - IP-to-domain resolution now works correctly with custom dnsmasq log locations set via `dnsmasq.conf.add`
- IMPROVED: `Scribe` integration check now happens earlier to avoid unnecessary warnings when disabled.
- IMPROVED: When uninstalling, ask for removing the `/opt/etc/xrayui.conf`
- DOCS: [Routing Rules Guide](https://daniellavrushin.github.io/asuswrt-merlin-xrayui/en/routing)
- DOCS: [Using v2dat to Inspect Geosite and GeoIP Databases](https://daniellavrushin.github.io/asuswrt-merlin-xrayui/en/v2dat)
- DOCS: [Using b4sni tool to Inspect SNI](https://daniellavrushin.github.io/asuswrt-merlin-xrayui/en/b4sni)

## [0.60.0] - 2025-09-08

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: support for a new `url:` prefix in custom geosite files, allowing users to specify URLs that will be fetched and included as domain lists during compilation. The backend parses and fetches these lists, integrating them into the output `ext:xrayui:` dat extension. For more details, see the [documentation](https://daniellavrushin.github.io/asuswrt-merlin-xrayui/en/custom-geodata#interface-overview).
- IMPROVED: Modified backend logic to recompile all geodata (including [custom sources](https://daniellavrushin.github.io/asuswrt-merlin-xrayui/en/custom-geodata)) after updates, ensuring new remote lists are processed.
- IMPROVED: Clarified in documentation that enabling auto-update will also recompile custom geodat files, ensuring remote sources are refreshed automatically.

## [0.59.2] - 2025-09-07

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- IMPROVED: Remove `DIVERT` rules from mangle table during cleanup.
- FIXED: when XrayUI is running in `Redirect` mode, any IP addresses defined in the routing rules are now also added into the system’s fast lookup list (`ipset`).

## [0.59.0] - 2025-08-23

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: `Reality TLS (REALITY) Scanner` (RTLS) under `Outbounds`. Discovers usable REALITY endpoints by probing domains, IPs, and CIDRs. [See the manual](https://daniellavrushin.github.io/asuswrt-merlin-xrayui/en/rtls-scanner)
- IMPROVED: Backups list is now sorted by file modification time with the newest first.
- FIXED: Eliminated duplicate `IPv6` rules in `ip6tables` for the XRAYUI chain by validating existence before insert and hardening IPv4/IPv6 address handling to prevent cross-family leakage (e.g., 127.0.0.1 vs ::1).
- FIXED: Hooks are correctly removed when the script fields are cleared. Empty or whitespace-only values (and the literal null) delete the corresponding hook files, and the UI no longer shows null after reload.

## [0.58.4] - 2025-08-18

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: IPv6 TPROXY “mixed‑family” rule handling in firewall.sh — restored per‑family loopback translation (127.0.0.1↔::1) and proper v4/v6 skipping so IPv6 CIDRs aren’t sent to iptables (v4) and IPv4 tokens aren’t sent to ip6tables (v6). This eliminates invalid mask '64' / getaddrinfo errors and restores XRAY VPS connectivity on IPv6‑preferred networks again (with respect to the version `0.58.1`). #226
- IMPROVED: Do not apply TUF/ROG styles on GNUTON firmwares.

## [0.58.3] - 2025-08-17

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: DoH log entries were not correctly parsed in the access.log.
- FIXED: When subscription enabled it was not possible to preserve sockopt object settings after applying changes.
- IMPROVED: Display active/all rule and policy counters.

## [0.58.1] - 2025-08-05

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: A new option under `General Settings` → `Logs` named `Integrate XRAYUI logs with Scribe`. Enabling this option routes XRAYUI system log output to the `Scribe` module. A separate XRAYUI log section appears in the System Log menu when `Scribe UI` is enabled. This feature is only available then `Scribe` is deployed to your a router.
- ADDED: A **DNS leak protection** toggle at `General Options` → `DNS` → `Prevent DNS leaks`. This forces the router to send DNS only through Xray and disables alternate system resolvers. Note: this switch does not create the DNS inbound for you—configure a dedicated DNS inbound first. For setup steps, see [this guide](https://daniellavrushin.github.io/asuswrt-merlin-xrayui/en/dns-leak).
- IMPROVED: Device Policies routing should now covers all edge cases.
- IMPROVED: XRAY Config is now saved to your PC instead of copied to the clipboard, making it easier to share with others.

## [0.57.1] - 2025-08-01

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: Domains from the rules where destination is `BLACKHOLE` are now correctly set in the IPSET when using `Redirect` mode.
- FIXED: GeoIP subnet lists are now properly unpacked and loaded into IPSET, including large lists.

## [0.57.0] - 2025-07-30

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: Tag autocomplete for `Geosite`/`GeoIP` rules. While editing a rule, start typing `geosite:`, `geoip:` or `ext:xrayui:` and XRAYUI will instantly suggest matching tags, fetched on the fly from the installed geodat files.
- ADDED: Broader rule coverage – IP ranges referenced by `geoip:` rules are now added to `IPSET` along with domains, so both domain‑based and address‑based traffic are handled consistently (both in ipset `redirect` and `bypass` modes).
- IMPROVED: Much faster rule generation – applying the `IPSET` rules now finishes in about a second instead of nearly a minute to infinity.
- UPDATED: The internal `v2dat` geodata util [updated to version 2.2.0](https://github.com/DanielLavrushin/v2dat/releases/tag/v2.2.0).

## [0.56.2] - 2025-07-29

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- IMPROVED: Exclude blocked domains from the `IPSET` rules in `REDIRECT` mode. This should boost performance during xrayui startup when `IPSET` mode is set to `REDIRECT`.
- IMPROVED: Devices List in the R/B Policies window.
- FIXED: Some routers missing the `base64` util now get it installed if it’s not present.
- FIXED: Correctly parse `Shadowsocks` subscriptrion in the `Outbounds`.

## [0.56.1] - 2025-07-27

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: `Subscription Sources`. A new `Subscriptions` tab has been added to `General Options`. Add subscription source links that contain one or more outbound protocol descriptors (e.g., ss://, vmess://, vless://). Links with Base64‑encoded content are also supported. After adding sources, press the `Fetch` button next to the field to load the outbound links. When finished, XRAYUI will show a drop‑down field in the Outbound modal window.
- ADDED: Full subscription link support. XRAYUI now auto‑detects and parses JSON or Base64 subscription URLs. Supports `VLESS`, `VMess`, `Trojan`, and `Shadowsocks`. Paste the link in the Outbound modal form.
- ADDED: It is now possible to select the Outbound tag in the Transparent Proxy (`sockopt`) window (`DealerProxy` setting).
- FIXED: `XHTTP` Transport now correctly saves to the configuration. [#180](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/issues/180)
- FIXED: The `Complete setup` action in the import window was broken.
- FIXED: Import failed when a protocol URL had incomplete parameters.
- FIXED: Not all devices were listed in `Routing Policies`. ([#190](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/issues/190))
- ADDED: Introduced a new checkbox option,`Keep my rules and policies`, to retain existing routing rules during configuration imports. Updated the import logic to support this feature.
- IMPROVED: Import window refactored. Improved file handling and parsing for configuration imports (e.g., JSON and QR code support) with better error handling and user alerts.
- IMPROVED: Display a more accurate configuration size.
- IMPROVED: `Sockopt` (Transparent Proxy) window translated into several languages.

## [0.55.0] - 2025-07-24

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: a `Rules Filter` feature to help you quickly find a specific rule in the list. Available in the bottom-left corner of the `Routing Rules` window.
- ADDED: Start Xray with `nice -n 19` and `ionice -c3` to minimize CPU and disk I/O contention with other system processes.
- ADDED: A new `Time Delay` option in `General Settings`. This value in seconds delays the heavy XRAYUI settings from being applied after the XRAY service starts. The optimal delay may vary by router model; a 10–20 second delay is recommended for low/mid-range routers. Default is `10 seconds`. This delay can help to reduce the CPU spikes on XRAY start/restart.
- CHANGED: Removed the `flow` user property from `VLESS` Outbound when set to `none`.
- IMPROVED: Geosite File Extraction Tool: Achieved a 20x performance improvement in the [v2dat](https://github.com/DanielLavrushin/v2dat/releases/tag/v2.0.0) tool.
- IMPROVED: Made minor improvements to the firewall settings.
- IMPROVED: Policy Rework: Policies now exhibit smarter behavior for better network routing.
- FIXED: Mobile Usability: Fixed an issue where checkboxes inside draggable elements were not clickable on mobile devices.

## [0.54.1] - 2025-07-23

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: XRAY does not work in the `REDIRECT` mode.
- FIXED: Unable to save network type `HTTPUpgrade` from the Transport window.

## [0.54.0] - 2025-07-22

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- IMPROVED: `iptables` rule set has been completely overhauled.
- ADDED: New rule excludes `BROADCAST` packets from the processing chain.
- ADDED: UDP traffic for `GlobalProtect` is now explicitly bypassed.
- FIXED: Orphaned `MAC` addresses once forgotten by the router always show up in the routing‑policy device list, struck through in red so you can disable them—even in offline‑only view.
- FIXED: DNS packets from certain LAN subnets are now reinjected into the chain instead of being dropped.
- FIXED: `IPv4/IPv6` subnet ranges are parsed correctly again.
- FIXED: Per‑device MAC‑address rules are once more inserted into iptables, restoring MAC‑based bypass/redirect behavior.
- IMPROVED: Logs modal window has been refactored.

## [0.53.2] - 2025-07-20

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: Unable to save HTTPUPGRADE Transport.
- FIXED: Check for both status native and `InstantGuard` IPSEC.
- FIXED: `IPV6` Logs are correctly parsed.
- IMPROVED: `IPV6` routing rules are correctly set in the iptables.

## [0.53.1] - 2025-07-20

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: It is now possible to add a `subscription URL` to a specific Outbound connection. XRAYUI will fetch connection updates on every service restart. While a URL is set, certain settings are disabled because they are managed by the subscription.
- ADDED: It is now possible to edit the hook scripts from the UI (`firewall_before_start`, `firewall_after_start`, and after `firewall_after_cleanup`) directly from the web interface. Available in `General Options` → Hooks (Triggers).
- ADDED: Connection check per outbound.
  > If you previously had connection check option enabled, it is recommended to turn it off and on again.
- ADDED: Loopback RETURN rule in mangle table for `127.0.0.0/8` packets.
- ADDED: LAN/Wi-Fi global IPv6 addresses are now excluded when configuring firewall rules.
- ADDED: `IPsec` VPN subnet exclusion – skips subnet rule when IPsec is disabled.
- ADDED: Numeric `startup delay` field in `General Settings` to specify the wait time before Xray starts after router reboot.
- ADDED: It is now possible to set a XRAY start delay on router reboot (in seconds), this setting is located in General Settings.
- FIXED: Log rotation now works: logs automatically rotate when they hit the configured size.
- FIXED: Don't resolve log IPs when dnsmasq is disabled.
- FIXED: Correctly resolve a device name by an ip6 in the logs.
- FIXED: Switching inbound/outbound transport no longer retains the previous object in the config.
- FIXED: Sort profiles alphabetically.
- FIXED: `Wireguard` Inbound private/public key regeneration.
- IMPROVED: prune empty config objects on save to prevent ghost entries like `settings: {}` in the final output.
- REMOVED: General connection check. Country flags were removed.
- REMOVED: Manual order button from the Rules modal window.
- REMOVED: Manual order button from the Policies modal window.

## [0.52.2] - 2025-07-13

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: Log filters for target, inbound, and outbound now work as expected.
- FIXED: Source-network extraction now accepts valid `IPv4`/`IPv6` CIDR notation, resolving connection issues on `PPPoE` links.
- FIXED: Dynamic `WAN` interface detection is now handled correctly in the XRAYUI firewall configuration.
- ADDED: Predefined `Discord` IP/port rules are included when importing a configuration.
- ADDED: The `TPROXY` (transparent proxy) option is now enabled by default on configuration import.
- ADDED: `Simplified-Chinese` language support — thanks to `@cdzqs`.
- ADDED: Enhanced `IPv6` support — DNS/DHCPv6 and ICMPv6 traffic are automatically excluded.
- IMPROVED: Faster, more stable IP-to-domain-name resolution in logs.
- IMPROVED: Logs now show the device nickname (if set) instead of the raw hostname.
- IMPROVED: Refactored `Clients Online` component; uses the Xray API, reports active users accurately, and reduces router CPU/RAM usage.
- REMOVED: UDP port `80` has been dropped from the default port list in Policies Manager.

## [0.52.1] - 2025-06-22

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: Log filters for `target`, `inbound`, and `outbound` now work correctly.
- FIXED: Source-network extraction now recognizes valid IPv4 and IPv6 CIDR notation, resolving connection issues on `PPPoE` connections.
- FIXED: Add support for dynamic `WAN` interface handling in XRAYUI firewall configuration
- ADDED: Predefined `Discord` IP/port rules are now included when importing a configuration.
- IMPROVED: Faster and more stable IP-to-domain-name resolution in logs.
- IMPROVED: Logs now display the device **nickname** (if defined) instead of the device name.
- REMOVED: UDP port `80` has been removed from the default port list in the Policies Manager.

## [0.51.0] - 2025-06-08

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: `FakeDNS` support — create and manage xray-core FakeDNS objects. _Visible only when at least one inbound is in **tproxy** mode; shows up as a “Fake DNS” row in **DNS**._
- ADDED: Feature to associate `DNS` servers with specific routing rules (available in `Advanced mode`) to simplify domain management - this include now the IPs from the rules.
- ADDED: Drag-and-drop reordering for `inbounds`.
- ADDED: Drag-and-drop reordering for `outbounds`.
- ADDED: Drag-and-drop reordering for `device policies`.
- REMOVED: Old sort buttons on inbounds and outbounds (replaced by drag-and-drop).
- REMOVED: 60 seconds delay on router reboot (experemental).

## [0.50.3] - 2025-06-07

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- IMPROVED: Sort `ipset` rules and remove duplicate entries.
- FIXED: Enhance interface list generation in set_route_localnet function for improved handling of wireless interfaces

## [0.50.1] - 2025-06-05

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: Simple routing rules that have no domains are now automatically removed from the configuration, so Xray no longer routes all traffic through them.

## [0.50.0] - 2025-05-31

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- IMPROVED: Removed explicit restart of the `firewall` and `dnsmasq` services.
- IMPROVED: Move startup to the post-mount event.
- ADDED: Introduce a new feature: `Advanced/Simple` toggle. A new button in the top-right corner lets you switch between Advanced and Simple modes. `Advanced mode` retains full access to every option (default). `Simple mode` surfaces only the most common Xray settings for VLESS/VMess proxies, making quick edits easier. `Heads-up`: If your configuration depends on less-common settings, stay in Advanced mode — hanging them in Simple mode may trigger unexpected errors.
- ADDED: Added drag-and-drop sorting to the rules list: users can now grab the dotted handle of any rule, drag it up or down, and drop it to instantly change the order. [#125](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/issues/125)
- FIXED: Don't interfere with global fonts. [#130](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/issues/130)

## [0.49.4] - 2025-05-07

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- IMPROVED: Removed explicit restart of the `firewall` and `dnsmasq` services.

## [0.49.3] - 2025-05-06

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- IMPROVED: Settings page could fail to open when hidden formatting codes were present in the stored data. These codes are now removed before the page processes the information, ensuring reliable loading.
- IMPROVED: Backup configuration file on saving. Now XRAYUI stores 3 last backups in the `/opt/etc/xray/` directory. Just in case :).
- FIXED: Secondary WAN IPv4 addresses are now detected correctly, even on firmware versions that store them under the older wanX_ipaddr variable. This ensures both WAN links are taken into account when creating exclusion rules for the firewall.

## [0.49.2] - 2025-05-04

- FIXED: Ensure xray proc is running to apply heavy `bypass`/`redirect` ipsec configurations during the `dnsmasq` restarts.

## [0.49.1] - 2025-05-04

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- IMPROVED: `DNS → ipset` engine updated with a clear three-mode switch. Modes `off`, `bypass`, and `redirect` provide, respectively, no ipset handling, whitelist-style bypassing, or smart-proxy redirection. Early-return and TPROXY rules are generated dynamically, ensuring that only traffic matching the selected mode is processed by Xray.
- IMPROVED: The process that generates the `dnsmasq` configuration and populates it with domain entries now completes significantly faster, reducing overall dnsmasq service restart time.

## [0.49.0] - 2025-05-04

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: Missing shebang when `/jffs/scripts/file` is initially empty.
- FIXED: Bug when updating a specific _xray-core_ version from the CLI.
- FIXED: Made the `dnsmasq` config-update task synchronous.
- FIXED: Complete rework of the `xhttp` transport ([#121](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/issues/121)).
- ADDED: Ability to update to **pre-release** and **draft** versions.
- ADDED: **Enable DNS bypass (ipset)** — adds a `dnsmasq` + `ipset` layer in front of Xray; domains routed via `FREEDOM` are resolved into an ipset and hit an early `RETURN` rule, so the router handles them directly and Xray stays idle for that traffic.

## [0.48.5] - 2025-04-29

- REMOVED: rules excluding `STUN` (WebRTC) traffic.
- REMOVED: the priority `101` parameter in the `ip rule add` command for policy rules.

## [0.48.0] - 2025-04-29

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: Verify the readiness of the router's `JFFS` partition during installation, ensuring that required configurations are enabled.
- IMPROVED: Enhance `TPROXY` rules and improve exclusion handling in firewall configuration.
- ADDED: Added rules to exclude traffic destined for the router's IP on `UDP` port `53`.
- ADDED: Enhanced `TPROXY` rules by introducing connection marking for locally-owned `UDP` sockets and saving marks to improve traffic handling.
- ADDED: Added rules to exclude traffic for specific tunnel UDP ports (`500`, `4500`, `51820`).

## [0.47.11] - 2025-04-27

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: A new `Enable debug logs` option in the `General Settings`, allowing users to toggle debug logging.
- ADDED: Backup management by adding specific backup deletion option.
- IMPROVED: Enhanced diagnostics output by adding kernel module checks and improving log formatting.
- IMPROVED: Increase maxlength for web socket transport `path` and `host` inputs to allow longer values (up to 256 characters).
- FIXED: Firewall rules by clamping MSS for Xray-originated TCP flows and adding new rules for `IPsec` IKE/NAT-T traffic
- FIXED: `bypass` policies were ignored in `TPROXY` mode.

## [0.47.2] - 2025-04-27

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- IMPROVED: `IPv6` rules handling.

## [0.47.1] - 2025-04-27

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: `IPv6` support.
- ADDED: Added a rule to clamp the `TCP MSS` to the path `MTU` for all forwarded SYN packets in both `IPv4` and `IPv6`. This improves TCP performance by avoiding fragmentation.
- IMPROVED: Diagnostics provides more useful information.

## [0.46.6] - 2025-04-25

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: Added a safety check that blocks deletion of a proxy while it is still referenced by any firewall/routing rule.
- IMPROVED: Re-factored the iptables module: local-subnet exclusion rules are now generated in a single, cleaner block for easier maintenance and faster rule-matching.
- IMPROVED: Small resolution support for modals.

## [0.46.1] - 2025-04-24

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: `Json` configuration import.
- FIXED: Front-end styles for `ROG` and `TUF` design.
- ADDED: `DNAT` support for `dokodemo‑door` inbounds bound to a specific listen address (anything other than `0.0.0.0`)—those rules now use `-j DNAT --to-destination` instead of a generic `REDIRECT`.
- ADDED: Source‑subnet filtering in client mode—all `dokodemo-door` REDIRECT/TPROXY rules are now prefixed with `-s <local_lan_subnet>`, so only LAN traffic is captured.
- ADDED: listen‑address restriction for server inbounds—ACCEPT rules for `non‑0.0.0.0` binds now include `-d <listen_ip>`, limiting them to the configured interface.
- ADDED: Filtering options for logs by source, target, inbound, and outbound in Logs component.
- ADDED: a new CLI command `xrayui diagnostics iptables` to display diagnostics routing information.
- IMPROVED: Moved logs window to a modal.

## [0.45.0] - 2025-04-21

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: A `password` field and generation functionality to `Shadowsocks` inbound form.
- ADDED: New option under General Settings — `Clients Online Status Check`. This feature is disabled by default. When enabled, XRAYUI will actively check which clients are currently connected to Xray.
- REMOVED: XRAYUI no longer relies on Xray installed via Entware. It now fetches the latest version directly from the official [Xray-core repository](https://github.com/XTLS/Xray-core/releases) on GitHub.
- IMPROVED: Prerelease and draft versions of `Xray Core` are now excluded from the update list.
- IMPROVED: Update response handling and improve loading progress management.
- IMPROVED: Enhanced the Xray version switch module to support switching to a specific version or the latest release. Use `xrayui update xray xx.xx.xx` or `xrayui update xray latest` to switch Xray-core versions directly from the CLI.
- IMPROVED: Enhance response handling with cache-busting and improve service restart logic.

## [0.44.3] - 2025-04-20

- IMPROVED: Fine-tuned dnsmasq configuration handling for better log management. The XRAYUI now conditionally appends logging directives (`log-queries`, `log-async`, and `log-facility`) only if they are not already present, ensuring idempotent and non-intrusive updates. This prevents duplicate entries and respects existing user settings while enabling useful diagnostic logging when the dnsmasq option is enabled.
- ADDED: `ADDON_DEBUG` flag (values: 0 or 1) to xrayui.conf, enabling optional diagnostic output for advanced debugging. Can be set manually by editing the file.
- ADDED: A new `Skip testing XRAY` option under General Options. This allows users to bypass the XRAY configuration test step. While the test can help diagnose issues with the configuration file, it may consume system resources—so disabling it can improve performance on low-end routers.

## [0.44.1] - 2025-04-18

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: A critical compatibility issue with the `Diversion` module. `XrayUI` and `Diversion` now correctly detect and synchronize the `dnsmasq` logging state, preventing duplicate or conflicting log entries when you enable or disable dnsmasq logging in either module.
  > _Note: If you’ve already turned on `dnsmasq` logging in `Diversion`, enabling it afterward in XrayUI works perfectly; the modules will detect the existing settings and avoid duplicates. However, if you first enable `dnsmasq` logging in `XrayUI` and then go into `Diversion` and enable it there, you will end up with conflicting log directives and potential DNS service failures. To prevent this, only manage dnsmasq logging from one module—either Diversion or XrayUI—but not both._
- IMPROVED: Refactored the internal logging system for better maintainability and clarity.
- IMPROVED: Added checks for any inbound `TProxy` flags when increasing the maximum file descriptor limit.

## [0.44.0] - 2025-04-18

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: Option to automatically clear logs on `XRAY` service restart.
- ADDED: Configurable log size limit in general settings. When the file exceeds the defined size, it will be rotated automatically.
- ADDED: Automatic geosite update toggle in general settings. When enabled, the job will update geodata files nightly.
- IMPROVED: Log parsing logic for better accuracy.
- FIXED: `Logrotate` cron job now reliably created during installation.
- REMOVED: `daily` and `compress` directives from logrotate configuration to prevent unnecessary log rotation and reduce overhead.

## [0.43.3] - 2025-04-17

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: Connected clients were not displayed correctly due to improper parsing of the access log.
- IMPROVED: Added calls to restart the `dnsmasq` service after enabling or disabling logging, ensuring the changes take effect immediately.
- IMPROVED: Enhanced log output.

## [0.43.1] - 2025-04-16

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: an issue where non-object `DNS server entries` (like string addresses) were being dropped from the configuration.
- FIXED: Ensure correct profile is used for data operations in backend.
- FIXED: Logs parsing.
- ADDED: A new checkbox in `General Settings` to enable `dnsmasq` logging. When enabled, `dnsmasq` logs will be activated and IP addresses in the xray access logs will be replaced with the corresponding domain names.

## [0.43.0] - 2025-04-14

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: Added missing `DNS` tag to the inbounds list in the routing rules form to ensure proper configuration.
- FIXED: `General Settings` were not updating the current profile.
- FIXED: Unable to enable logging when using the default import.
- ADDED: Feature to associate `DNS` servers with specific routing rules (available in `Advanced mode`) to simplify domain management.
- ADDED: `Import JSON` – Use this option when you have a client configuration file that you want to import into the router. The configuration will be automatically adjusted for compatibility with your router.
- ADDED: `Restore from File` (Import) – Use this option to upload a previously working configuration file as is, without modifications.
- ADDED: Restoring from a previously created backup is now supported.
- IMPROVED: Refactored the `service_event` case statement in xrayui for better structure and readability.
- IMPROVED: Refactored `Backup Manager`.

## [0.42.9] - 2025-04-09

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: potential fix to correctly remount the plugin after a router reboot.
- FIXED: Resolved bug where the default inbound configuration value `tcp` was ignored when applying firewall rules.

## [0.42.8] - 2025-04-08

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: Support added for configuring multiple `DOKODEMO` inbounds.
- ADDED: Inbound `DOKODEMO` proxies can now be split by processing method—either Direct (`REDIRECT`) or `TPROXY`, and by network protocol (`TCP`, `UDP`, or `both`).
- IMPROVED: Disable log fetching during configuration updates to prevent unexpected page reloads.

## [0.42.7] - 2025-04-06

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: Resolved installation freeze issues in the web UI.
- FIXED: Configuration changes are now saved to the default profile (`config.json`) instead of the active profile.
- ADDED: Introduced the `xrayui update x.xx.x` argument to install a specific version; leaving it blank installs the latest version.
- IMPROVED: Implemented a locking mechanism for `XRAYUI` operations and enhanced `NTP` synchronization.
- IMPROVED: The import URL parser now displays an error message if it fails to parse the input.
- IMPROVED: Only apply the GitHub proxy to URLs that begin with `github.com`.

## [0.42.5] - 2025-04-03

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: Resolved an issue that sometimes caused errors when updating log file locations, ensuring your log files are stored correctly.
- ADDED: Automatic backup of the `Xray` configuration before installation, including a timestamp.

## [0.42.4] - 2025-04-03

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: unable to deselect `GitHub Proxy` option.
- FIXED: Proxy the download link when updating the `XRAY-Core` from Github.

## [0.42.3] - 2025-04-03

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: A new `GitHub Proxy` option in `General Settings`. You can now select a proxy server if access to `github.com` is restricted in your region.
- ADDED: Automatic downloading of `geodata` files during installation.
- ADDED: A `backup` feature that allows you to perform a full backup of all xray/xrayui user configuration files and download them.
- IMPROVED: Eliminated storing logs in the `/tmp` folder. If you previously stored logs there, please remove the old files or reboot your router.
- REMOVED: The ability to define a custom log path. Logs are now hardcoded to the `/opt/share/xrayui/logs` directory.
- FIXED: Minor issues encountered during installation.
- FIXED: Prevented saving an empty profile name.
- FIXED: Not possible to correctly select profile.
- REFACTORED: Backend code has been split into more readable sections.

## [0.41.4] - 2025-03-27

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: Consolidated and fixed firewall script handling (NAT restart hook).
- UPDATED: Migrated from `webpack` to `vite`.
- UPDATED: Reduced `logrotate` retention period from 7 days to 2 days.

## [0.41.3] - 2025-03-23

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: well-known geodata sources selection to the Genral Options.
- FIXED: QR import for `REALITY` and `TLS`.
- FIXED: When updating, the `logrotate` file is no longer overwritten if it already exists.
- FIXED: The `logrotate` file is now updated with the new log file paths when the logs path in the `XRAY` config is changed.
- IMPROVED: Config masking when sharing.
- IMPROVED: Minor front-end refactoring.

## [0.41.0] - 2025-03-22

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- CHANGED: `Client/Server` mode. XRAYUI now operates as a single proxy service on the router. This is a critical change that might affect some configurations. This change means that `XRAYUI` can configure `XRAY` to act as both a server and a client simultaneously. External devices can now connect to your home network, while local devices continue to be routed through the external VPS. In client mode, `XRAYUI` still expects at least one `dokodemo` inbound. Please report any issues on [GitHub](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/issues) if you encounter any.
- CHANGED: `logrotate`: use configurable log file paths for access and error logs.
- CHANGED: Switched to `SCSS`.
- FIXED: Ensured that `shortId` is generated correctly.
- FIXED: Reset the `XRAY` versions list before loading new data.
- FIXED: Display log times in local time zone and improve log entry parsing.
- ADDED: It is now possible to specify a custom logs location in the general settings.
- ADDED: Configuration Profiles. You can now easily switch between configuration files using a new selection option in the Main Configuration section. This option dynamically lists all available JSON configuration files from the `/opt/etc/xray` directory, enabling quick and flexible profile management.
- IMPROVED: Default settings are now correctly applied for proxy configurations.

## [0.40.0] - 2025-03-11

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- ADDED: You can now update the `XRAY-CORE` binaries directly from the official repository. Click on the Xray-core version (on the top right corner) to open the `switch` modal window and initiate the update.
- ADDED: Reverse proxy UI support. A new section `Reverse Proxy` has been added. When adding `bridge` or `portal` items to the reverse configuration, you can immediately reference them in `routing` configuration.

## [0.39.1] - 2025-03-06

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure outdated files are updated._

- FIXED: Importing an `mKCP` configuration.
- FIXED: Numeric values in the `mKCP` saved as strings.
  > _(If you had non-default values set for KCP, we recommend first reverting them to default values, applying the configuration, and then setting them to your desired values. This will reconvert previously saved values to numeric types.)_
- ADDED: A new `Configuration for packet header obfuscation` field to the `mKCP` configuration.

## [0.39.0] - 2025-03-05

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure that outdated files are updated._

- ADDED: Support for detailed importing of configuration links for `Vmess`, `Shadowsocks`, and `Trojan`.
  - **Vmess:** Configuration links are decoded. All essential connection parameters (such as server address, port, UUID, and network settings) are extracted.
  - **Shadowsocks:** Encrypted user credentials are decoded to retrieve the encryption method and password.
  - **Trojan:** Connection details, including host, port, and security settings, are accurately parsed.
- IMPROVED: General frontend code refactor/cleanup.
- FIXED: Add a delay before fetching Xray response data on page initial load.

## [0.38.3] - 2025-02-25

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure that outdated files are updated._

- FIXED: Resolved an issue where sorting rules were not applied correctly in the final rules array.
  > Please reapply your settings (no additional changes needed).
- FIXED: The page now remains responsive even when there is no internet connection.

## [0.38.2] - 2025-02-24

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure that outdated files are updated._

- ADDED: an exclusion rule for `NTP` traffic (UDP port `123`), preventing time synchronization services from being inadvertently redirected to `xray`.
- FIXED: an issue where logs were not correctly parsed in `xray-core 25.2`.
- REMOVED: the loading window that appeared on page load, improving the user experience.
- ADDED: a visible character counter showing current `config.json` size, helping users keep track of the configuration file limit.

## [0.38.1] - 2025-02-20

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure that outdated files are updated._

- FIXED: a new version window fix.

## [0.38.0] - 2025-02-20

> _Important: Please clear your browser cache (e.g. **Ctrl+F5**) to ensure that outdated files are updated._

- ADDED: When a new version is available, an update modal automatically appears on page load. The modal includes a `Don't want to update` button which, when clicked, dismisses the modal and prevents future notifications for that specific version.
- ADDED: a new filter text box to filter the big list of devices (appears next to `Show all devices` checkbox).
- IMPROVED: Enhanced X-RAY `access` log display. Access logs now show the source device name (if available) and the target domain name (if available), providing clearer context for connections. **This is not precise though**.

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
