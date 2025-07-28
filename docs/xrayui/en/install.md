# Install

Get XrayUI running on your Asuswrt‑Merlin router in a few minutes (minutter).

## Requirements

- [Asuswrt‑Merlin](https://www.asuswrt-merlin.net/download) 384.15+ or 3006.102.1+.
- SSH access enabled on the router.
- A USB flash drive for Entware storage.
- Entware installed via [amtm](https://diversion.ch/amtm.html).
- JFFS custom scripts enabled (set it in the MerlinWRT settings).

## Prepare the router

### Enable JFFS custom scripts

On the router web UI: Administration → System → `Enable JFFS custom scripts and configs` → Yes (if not set). Reboot the router.

### Install Entware with amtm

Open an SSH session to the router and run:

```shell
amtm
```

Choose Entware from the menu and follow the prompts.

## Install XrayUI

Run this command in SSH to fetch and install the latest release:

```shell
wget -O /tmp/asuswrt-merlin-xrayui.tar.gz https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/releases/latest/download/asuswrt-merlin-xrayui.tar.gz && rm -rf /jffs/addons/xrayui && tar -xzf /tmp/asuswrt-merlin-xrayui.tar.gz -C /jffs/addons && mv /jffs/addons/xrayui/xrayui /jffs/scripts/xrayui && chmod 0777 /jffs/scripts/xrayui && sh /jffs/scripts/xrayui install
```

## After installation

- Log out of the router UI and log back in.
- Navigate VPN → X‑RAY in the web interface.

## Update

There are 2 ways to perform the update:

1. run the command

   ```shell
   xrayui update
   ```

2. From the Web Interface in the bottom right corner click the yellow version link and the Update window will pop-up. Now you can perform the update from the UI.

## Uninstall

Simply run this command:

```shell
/jffs/scripts/xrayui uninstall
```
