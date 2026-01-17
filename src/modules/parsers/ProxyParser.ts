import { XrayParsedUrlObject, XrayStreamRealitySettingsObject, XrayStreamTlsSettingsObject } from '../CommonObjects';
import { IProtocolType } from '../Interfaces';
import { XrayOutboundObject } from '../OutboundObjects';
import { XrayStreamHttpSettingsObject, XrayStreamKcpSettingsObject, XrayStreamWsSettingsObject } from '../TransportObjects';
import VlessParser from './VlessParser';
import VmessParser from './VmessParser';
import TrojanParser from './TrojanParser';
import ShadowsocksParser from './ShadowsocksParser';
import HysteriaParser from './HysteriaParser';

export default class ProxyParser {
  private readonly parsedObject!: XrayParsedUrlObject;
  constructor(proxyUrl: string) {
    const url = proxyUrl.trim();
    this.parsedObject = new XrayParsedUrlObject(url);
  }

  public getOutbound = (): XrayOutboundObject<IProtocolType> | null => {
    let proxy = null as XrayOutboundObject<IProtocolType> | null;

    switch (this.parsedObject.protocol) {
      case 'vless':
        proxy = VlessParser(this.parsedObject);
        break;
      case 'vmess':
        proxy = VmessParser(this.parsedObject);
        break;
      case 'trojan':
        proxy = TrojanParser(this.parsedObject);
        break;
      case 'ss':
        proxy = ShadowsocksParser(this.parsedObject);
        break;
      case 'hy2':
      case 'hysteria':
        proxy = HysteriaParser(this.parsedObject);
        break;
    }

    if (proxy) {
      // Hysteria parser handles its own stream settings, so skip post-processing
      if (this.parsedObject.protocol === 'hy2' || this.parsedObject.protocol === 'hysteria') {
        return proxy;
      }

      if (proxy.streamSettings) {
        proxy.streamSettings.network = this.parsedObject.network;
        proxy.streamSettings.security = this.parsedObject.security;
        if (this.parsedObject.security === 'reality') {
          proxy.streamSettings.realitySettings = new XrayStreamRealitySettingsObject(this.parsedObject);
        } else if (this.parsedObject.security === 'tls') {
          proxy.streamSettings.tlsSettings = new XrayStreamTlsSettingsObject(this.parsedObject);
        }

        if (this.parsedObject.network === 'ws') {
          proxy.streamSettings.wsSettings = new XrayStreamWsSettingsObject(this.parsedObject);
        } else if (this.parsedObject.network === 'kcp') {
          proxy.streamSettings.kcpSettings = new XrayStreamKcpSettingsObject(this.parsedObject);
        } else if (this.parsedObject.network === 'xhttp') {
          proxy.streamSettings.xhttpSettings = new XrayStreamHttpSettingsObject(this.parsedObject);
        }
      }

      return proxy;
    }
    return null;
  };
}
