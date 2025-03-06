import { XrayParsedUrlObject, XrayStreamRealitySettingsObject, XrayStreamTlsSettingsObject } from "../CommonObjects";
import { IProtocolType } from "../Interfaces";
import { XrayOutboundObject } from "../OutboundObjects";
import { XrayStreamKcpSettingsObject, XrayStreamWsSettingsObject } from "../TransportObjects";
import VlessParser from "./VlessParser";
import VmessParser from "./VmessParser";
import TrojanParser from "./TrojanParser";
import ShadowsocksParser from "./ShadowsocksParser";

export default class ProxyParser {
  private parsedObject!: XrayParsedUrlObject;
  constructor(proxyUrl: string) {
    const url = proxyUrl.trim();
    this.parsedObject = new XrayParsedUrlObject(url);
  }

  public getOutbound = (): XrayOutboundObject<IProtocolType> | null => {
    let proxy = null as XrayOutboundObject<IProtocolType> | null;

    switch (this.parsedObject.protocol) {
      case "vless":
        proxy = VlessParser(this.parsedObject);
        break;
      case "vmess":
        proxy = VmessParser(this.parsedObject);
        break;
      case "trojan":
        proxy = TrojanParser(this.parsedObject);
        break;
      case "ss":
        proxy = ShadowsocksParser(this.parsedObject);
        break;
    }

    if (proxy) {
      if (proxy.streamSettings) {
        proxy.streamSettings.network = this.parsedObject.network;
        proxy.streamSettings.security = this.parsedObject.security;
        if (this.parsedObject.security === "reality") {
          proxy.streamSettings.realitySettings = new XrayStreamRealitySettingsObject(this.parsedObject);
        } else if (this.parsedObject.security === "tls") {
          proxy.streamSettings.tlsSettings = new XrayStreamTlsSettingsObject(this.parsedObject);
        }

        if (this.parsedObject.network === "ws") {
          proxy.streamSettings.wsSettings = new XrayStreamWsSettingsObject(this.parsedObject);
        } else if (this.parsedObject.network === "kcp") {
          proxy.streamSettings.kcpSettings = new XrayStreamKcpSettingsObject(this.parsedObject);
        }
      }

      return proxy;
    }
    return null;
  };
}
