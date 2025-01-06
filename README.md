# ASUSWRT Merlin XrayUI
This repository provides a lightweight and efficient UI to manage your Xray VPN services on routers running ASUSWRT-Merlin firmware.
![image](https://github.com/user-attachments/assets/0c838b4b-1e0f-4d26-b4ea-a1bc84ac0510)

## Requirements

### SSH Access 
Access your router via SSH to execute installation commands.

### Available Space
Ensure sufficient space in the `/jffs` partition for installing XrayUI and its dependencies.

## Installation
To install the latest version of asuswrt-merlin-xrayui, simply run the following command in your router’s SSH terminal:
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
- Access the X-RAY Tab: Navigate to the VPN section in the router's web UI and look for the new tab labeled X-RAY.

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
