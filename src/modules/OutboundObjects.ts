import { IProtocolType } from "./Interfaces";
import { XrayProtocol } from "./Options";
import { XrayTrojanServerObject, XrayHttpServerObject, XrayStreamSettingsObject, XraySocksServerObject, XrayVmessServerObject, XrayNoiseObject, XrayShadowsocksServerObject, XrayPeerObject } from "./CommonObjects";
import { XrayVlessServerObject } from "./CommonObjects";

class XrayOutboundObject<IProtocolType> {
  public protocol!: XrayProtocol;
  public sendThrough: string = "0.0.0.0";
  public tag?: string;
  public settings!: IProtocolType;
  public streamSettings?: XrayStreamSettingsObject;

  constructor(protocol: XrayProtocol | undefined = undefined, settings: IProtocolType | undefined = undefined) {
    if (protocol && settings) {
      this.settings = settings;
      this.protocol = protocol;
      this.tag = "obd-" + this.protocol;
    }
  }
}

class XrayVlessOutboundObject implements IProtocolType {
  public vnext: XrayVlessServerObject[] = [];
  constructor() {
    if (this.vnext.length === 0) this.vnext.push(new XrayVlessServerObject());
  }
}

class XrayVmessOutboundObject implements IProtocolType {
  public vnext: XrayVmessServerObject[] = [];
  constructor() {
    if (this.vnext.length === 0) this.vnext.push(new XrayVmessServerObject());
  }
}

class XrayBlackholeOutboundObject implements IProtocolType {
  public response: { type: string } = { type: "none" }; // none, http
}

class XrayHttpOutboundObject implements IProtocolType {
  public servers: XrayHttpServerObject[] = [];
  constructor() {
    if (this.servers.length === 0) this.servers.push(new XrayHttpServerObject());
  }
}
class XrayShadowsocksOutboundObject implements IProtocolType {
  public servers: XrayShadowsocksServerObject[] = [];
  constructor() {
    if (this.servers.length === 0) this.servers.push(new XrayShadowsocksServerObject());
  }
}
class TrojanOutboundObject implements IProtocolType {
  public servers: XrayTrojanServerObject[] = [];
  constructor() {
    if (this.servers.length === 0) this.servers.push(new XrayTrojanServerObject());
  }
}

class WireguardOutboundObject implements IProtocolType {
  static strategyOptions: string[] = ["ForceIPv6v4", "ForceIPv6", "ForceIPv4v6", "ForceIPv4", "ForceIP"];
  public privateKey!: string;
  public address: string[] = [];
  public peers: XrayPeerObject[] = [];
  public mtu: number = 1420;
  public reserved?: number[];
  public workers?: number = window.xray.router.cpu;

  public domainStrategy: string = "ForceIP";
}

class LoopbackOutboundObject implements IProtocolType {
  public inboundTag!: string;
}
class XrayFreedomOutboundObject implements IProtocolType {
  static strategyOptions: string[] = ["AsIs", "UseIP", "UseIPv4", "UseIPv6"];
  static fragmentOptions: string[] = ["1-3", "tlshello"];
  public domainStrategy: string = "AsIs";
  public redirect: string = "";
  public fragment?: { packets: string; length: string; interval: string } | null = { packets: "tlshello", length: "100-200", interval: "10-20" };
  public noises: XrayNoiseObject[] = [];
  public proxyProtocol: number = 0; // 0: off, 1, 2
}

class XrayDnsOutboundObject implements IProtocolType {
  public address!: string;
  public port: number = 53;
  public network: string = "tcp";
  public nonIPQuery: string = "drop";
}

class XraySocksOutboundObject implements IProtocolType {
  public servers: XraySocksServerObject[] = [];
  constructor() {
    if (this.servers.length === 0) this.servers.push(new XraySocksServerObject());
  }
}

export { WireguardOutboundObject, TrojanOutboundObject, XraySocksOutboundObject, XrayShadowsocksOutboundObject, XrayDnsOutboundObject, XrayFreedomOutboundObject, LoopbackOutboundObject, XrayBlackholeOutboundObject, XrayHttpOutboundObject, XrayVlessOutboundObject, XrayVmessOutboundObject, XrayOutboundObject };
