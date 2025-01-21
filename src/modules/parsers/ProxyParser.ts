import { XrayParsedUrlObject, XrayStreamRealitySettingsObject, XrayStreamTlsSettingsObject } from "../CommonObjects";
import { IProtocolType } from "../Interfaces";
import { XrayOutboundObject } from "../OutboundObjects";
import { XrayStreamWsSettingsObject } from "../TransportObjects";
import VlessParser from "./VlessParser";

export default class ProxyParser {
  private parsedObject!: XrayParsedUrlObject;
  constructor(proxyUrl: string) {
    const url = proxyUrl.trim();
    this.parsedObject = new XrayParsedUrlObject(url);
    console.log(this.parsedObject);
  }

  getOutbound = (): XrayOutboundObject<IProtocolType> | null => {
    if (this.parsedObject) {
      if (this.parsedObject.protocol === "vless") {
        const proxy = VlessParser(this.parsedObject);
        if (!proxy) return null;

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
          }
        }

        return proxy;
      }
    }

    return null;
  };
}
