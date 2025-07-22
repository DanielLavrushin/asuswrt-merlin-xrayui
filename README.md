![GitHub Release](https://img.shields.io/github/v/release/daniellavrushin/asuswrt-merlin-xrayui?logoColor=violet)
![GitHub Release Date](https://img.shields.io/github/release-date/daniellavrushin/asuswrt-merlin-xrayui)
![GitHub commits since latest release](https://img.shields.io/github/commits-since/daniellavrushin/asuswrt-merlin-xrayui/latest)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/5afa683e2930418a9b13efac6537aad8)](https://app.codacy.com/gh/DanielLavrushin/asuswrt-merlin-xrayui/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
![GitHub Downloads (specific asset, latest release)](https://img.shields.io/github/downloads/daniellavrushin/asuswrt-merlin-xrayui/latest/total)
![image](https://img.shields.io/github/downloads/DanielLavrushin/asuswrt-merlin-xrayui/total?label=total%20downloads)

# ASUSWRT Merlin XrayUI

This repository provides a lightweight and efficient UI to manage your [X-RAY Core](https://github.com/XTLS/Xray-core) services on routers running ASUSWRT-Merlin firmware.

<img width="800" height="1325" alt="image" src="https://github.com/user-attachments/assets/fdea28a1-fcf4-43fb-ab55-f1d8a343e6c5" />

<details>
    <summary>Supported devices</summary>
    In general, all devices that can run Merlin-WRT firmware (`384.15` or later, `3006.102.1` or later) are supported. Below is the list of models where xrayui has been proven to work:

- RT-AC66U
- RT-AC68U
- RT-AX58U
- TUF-AX5400
- RT-AX92U
- RT-AX86U
- RT-AX88U
- GT-AX11000
- GT-AXE11000
- GT-AX6000
- RT-AX86U Pro
- RT-AX88U Pro
- GT-AX11000 Pro
- RT-BE88U
</details>

## Requirements

### SSH Access

Access your router via SSH to execute installation commands.

### Prerequisites

- [Merlin firmware](https://www.asuswrt-merlin.net/download) (`384.15` or later, `3006.102.1` or later)
- [Entware](https://github.com/Entware/Entware/wiki/Install-on-Asus-stock-firmware) installed
  - you can use built-in [amtm](https://diversion.ch/amtm.html) tool to install `Entware`

## Installation

To install the latest version of `ASUSWRT Merlin XrayUI`, simply run the following command in your router’s SSH terminal:

```shell
wget -O /tmp/asuswrt-merlin-xrayui.tar.gz https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/releases/latest/download/asuswrt-merlin-xrayui.tar.gz && rm -rf /jffs/addons/xrayui && tar -xzf /tmp/asuswrt-merlin-xrayui.tar.gz -C /jffs/addons && mv /jffs/addons/xrayui/xrayui /jffs/scripts/xrayui && chmod 0777 /jffs/scripts/xrayui && sh /jffs/scripts/xrayui install
```

### How to uninstall

To uninstall and clean up run the command

```shell
/jffs/scripts/xrayui uninstall
```

## Usage

### Post-Installation Steps

- Log Out and Back In: After installing, log out from the router's browser UI and then log back in.
- Access the X-RAY Tab: Navigate to the `VPN` menu item in the router's web UI and look for the new tab labeled `X-RAY`.

## Custom Scripts for Firewall Rules/IPTABLES

You can enhance the flexibility of your `Xray` configuration by adding custom scripts to handle specific firewall rules during Xray startup and shutdown.
These scripts should be placed in the `/jffs/xrayui_custom` directory and named according to their purpose:

- `firewall_server` - Executed when Xray starts in server mode.
- `firewall_client` - Executed when Xray starts in client mode.
- `firewall_cleanup` - Executed when Xray stops.
  Ensure the scripts are executable (`chmod +x <script>`).

## FAQ

**Q: Telegram group?**

A: [![image](https://github.com/user-attachments/assets/3128e51b-ecaf-4b1e-baf9-74876ba67589)](https://t.me/asusxray)

**Q: Can I import my VPS x-ray connection string?**

A: Yes, you can, and this is even preferable method to start x-ray in a client mode on your router. [Read this guide](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/wiki/Xray-Client-Importing-the-Configuration) for more details.

**Q: What if I already have an Xray configuration?**

A: If you already have an Xray configuration file that you want to use, you need to place it in the following location:

```
/opt/etc/xray/config.json
```

Once the file is placed here, the ASUSWRT Merlin XrayUI interface will automatically reflect the changes.

**Q: What is Bypass/Redirect Policy?**

A: The [Bypass/Redirect Policy](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/wiki/Bypass-Redirect-Policy-Overview) is a set of rules that determines how network traffic is handled by Xray on a per-port or per-device basis.

**Q: How can I configure a simple client on my ASUS router?**

A: you can refference this [wiki guide](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/wiki/Xray-Client-Configuration-Guide)

**Q: How can I configure a simple xray server on my ASUS router?**

A: you can refference this [wiki guide](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/wiki/Xray-Server-Configuration-Guide)

**Q:How to Create a custom geosite file (similar to the community geosite.dat) in XrayUI?**

A: you can refference this [wiki guide](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/wiki/How-to-Create-a-Custom-Tag-File-in-XrayUI)

# Contributing

This article [fully describe how you can contribute](<https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/wiki/Developer-Onboarding-for-XrayUI-(Asuswrt%E2%80%90Merlin)>).
If you have any problems with the XRAYUI, feel free to share them by opening an issue.
You can also suggest/request a new feature to be created or added. Contributions are welcome and encouraged.

# License

XRAYUI is licensed under [(CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
