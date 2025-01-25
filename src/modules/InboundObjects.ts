import { IProtocolType } from "./Interfaces";
import { XrayProtocol } from "./Options";
import { XrayAllocateObject, XraySniffingObject, XrayStreamSettingsObject } from "./CommonObjects";
import { XrayVlessClientObject, XrayVmessClientObject, XrayHttpClientObject, XrayShadowsocksClientObject, XrayTrojanClientObject, XraySocksClientObject, XrayWireguardClientObject } from "./ClientsObjects";

class XrayInboundObject<IProtocolType> {
  public protocol!: XrayProtocol;
  public listen?: string;
  public port!: number | string;
  public tag?: string;
  public settings!: IProtocolType;
  public streamSettings?: XrayStreamSettingsObject;
  public allocate?: XrayAllocateObject;
  public sniffing?: XraySniffingObject;

  constructor(protocol: XrayProtocol | undefined = undefined, settings: IProtocolType | undefined = undefined) {
    if (protocol && settings) {
      this.settings = settings;
      this.protocol = protocol;
      this.tag = "ibd-" + this.protocol;
    }
  }
}

class XrayDokodemoDoorInboundObject implements IProtocolType {
  public address?: string;
  public port?: number;
  public network?: string;
  public followRedirect?: boolean;
  public userLevel?: number;
}
class XrayVlessInboundObject implements IProtocolType {
  public decryption = "none";
  public flow = "none";
  public clients: XrayVlessClientObject[] = [];
}

class XrayVmessInboundObject implements IProtocolType {
  public clients: XrayVmessClientObject[] = [];
}

class XrayHttpInboundObject implements IProtocolType {
  public allowTransparen = false;
  public clients: XrayHttpClientObject[] = [];
}

class XrayShadowsocksInboundObject implements IProtocolType {
  public network = "tcp";
  public clients: XrayShadowsocksClientObject[] = [];
}
class XrayTrojanInboundObject implements IProtocolType {
  public clients: XrayTrojanClientObject[] = [];
}
class XraySocksInboundObject implements IProtocolType {
  public ip = "127.0.0.1";
  public auth = "noauth";
  public accounts: XraySocksClientObject[] = [];
  public udp = false;
}

class XrayWireguardInboundObject implements IProtocolType {
  public secretKey!: string;
  public kernelMode = true;
  public mtu = 1420;
  public peers: XrayWireguardClientObject[] = [];
}
export { XrayInboundObject, XrayWireguardInboundObject, XraySocksInboundObject, XrayTrojanInboundObject, XrayShadowsocksInboundObject, XrayHttpInboundObject, XrayVmessInboundObject, XrayVlessInboundObject, XrayDokodemoDoorInboundObject };
