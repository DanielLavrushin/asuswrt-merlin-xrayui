# XRAYUI Changelog

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
