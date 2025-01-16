# ASUSWRT Merlin XrayUI
This repository provides a lightweight and efficient UI to manage your Xray VPN services on routers running ASUSWRT-Merlin firmware.
![image](https://github.com/user-attachments/assets/0c838b4b-1e0f-4d26-b4ea-a1bc84ac0510)

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
**Q: What if I already have an Xray configuration?**

A: If you already have an Xray configuration file that you want to use, you need to place it in the following location:
```
/opt/etc/xray/config.json
```
Once the file is placed here, the ASUSWRT Merlin XrayUI interface will automatically reflect the changes.

**Q: How can I configure a simple client on my ASUS router?**

A: you can refference this [wiki guide](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/wiki/Xray-Client-Configuration-Guide)


**Q: How can I configure a simple xray server on my ASUS router?**

A: you can refference this [wiki guide](https://github.com/DanielLavrushin/asuswrt-merlin-xrayui/wiki/Xray-Server-Configuration-Guide)
