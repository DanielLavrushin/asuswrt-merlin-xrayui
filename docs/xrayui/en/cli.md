# Command‑line (CLI)

`xrayui` lives at `/jffs/scripts/xrayui` and is run over SSH on your router. It is also possible to invoke short version of the command (`xrayui <command>` instead of `/jffs/scripts/xrayui <command>`).

## Quick reference

[[toc]]

## Service lifecycle

### `xrayui start`

Start Xray and all UI dependencies; sets up routing/policies as needed.

### `xrayui stop`

Stop Xray cleanly and remove any rules/routes XrayUI added.

### `xrayui restart`

Stop, then start again; rebuild routes from scratch.

### `xrayui version`

Print the current XrayUI version and the installed Xray‑core version.

```bash
xrayui version
# XRAYUI: 0.56.1, XRAY-CORE: 25.6.8
```

## Updates

### `xrayui update`

Update XrayUI to the latest stable release.

### `xrayui update <version>`

Install a specific XrayUI version.

### `xrayui update xray <version|latest>`

Pin or upgrade the Xray‑core package.

## Health & diagnostics

### `xrayui fixme`

Run a quick self‑diagnostic and attempt safe auto‑repair.

### `xrayui diagnostics`

Full diagnostics bundle: environment, iptables/routing, and XrayUI checks.

### `xrayui diagnostics xrayui`

Diagnostics focused on XrayUI files, status, and service hooks.

### `xrayui diagnostics env`

Collect system and environment details relevant to Xray.

### `xrayui diagnostics iptables`

Audit routing/firewall rules managed by XrayUI.

## Automation (cron)

### `xrayui cron addjobs`

Create recommended cron tasks: log rotation, update checks, GeoData refresh.

### `xrayui cron deletejobs`

Remove all cron tasks previously created by `addjobs`.

## Install, backup, and UI maintenance

### `xrayui install` / `xrayui uninstall`

Install or completely remove the plugin and its service unit.

### `xrayui backup`

Create a backup of configuration and data you can copy off‑router. Backups are stored in `/opt/share/xrayui/backup` directory.

At the moment XRAYUI backup these entities:

```bash
/jffs/xrayui_custom # user xrayui trigger scripts
/opt/etc/xray # all JSON files and certificates
/opt/etc/xrayui.conf # config file containing xrayui general settings
/opt/share/xrayui/data # user defined geodat decompiled (sources) files
```

> [!Caution]
> There is no way at the moment to restore backup, this is a manual process.

### `xrayui remount_ui`

Re‑mount the X‑RAY tab into the web UI (useful after firmware/UI refreshes).

Advanced: service events

These are primarily called by hooks or the web UI but are safe to invoke from SSH when troubleshooting.

### `xrayui service_event startup`

Post‑boot initialization.

### `xrayui service_event configuration logs fetch`

Export service logs to the web UI’s log viewer.

### `xrayui service_event firewall configure`

Apply iptables rules without restarting Xray.

### `xrayui service_event firewall cleanup`

Remove iptables rules without restarting Xray.
