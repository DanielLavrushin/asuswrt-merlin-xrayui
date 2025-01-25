import { IProtocolType } from "./Interfaces";
import { XrayProtocol } from "./Options";
import { XrayTrojanServerObject, XrayHttpServerObject, XrayStreamSettingsObject, XraySocksServerObject, XrayVmessServerObject, XrayNoiseObject, XrayShadowsocksServerObject, XrayPeerObject } from "./CommonObjects";
import { XrayVlessServerObject } from "./CommonObjects";
import { plainToInstance } from "class-transformer";

class XrayOutboundObject<IProtocolType> {
  public protocol!: XrayProtocol;
  public sendThrough? = "0.0.0.0";
  public tag?: string;
  public settings!: IProtocolType;
  public streamSettings? = new XrayStreamSettingsObject();

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
  public response?: { type: string } = { type: "none" }; // none, http
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
class XrayTrojanOutboundObject implements IProtocolType {
  public servers: XrayTrojanServerObject[] = [];
  constructor() {
    if (this.servers.length === 0) this.servers.push(new XrayTrojanServerObject());
  }
}

class XrayWireguardOutboundObject implements IProtocolType {
  static strategyOptions = ["ForceIPv6v4", "ForceIPv6", "ForceIPv4v6", "ForceIPv4", "ForceIP"];
  public privateKey!: string;
  public address: string[] = [];
  public peers: XrayPeerObject[] = [];
  public mtu = 1420;
  public reserved?: number[];
  public workers? = window.xray.router.cpu;

  public domainStrategy: string = "ForceIP";
}

class XrayLoopbackOutboundObject implements IProtocolType {
  public inboundTag!: string;
}
class XrayFreedomOutboundObject implements IProtocolType {
  static strategyOptions = ["AsIs", "UseIP", "UseIPv4", "UseIPv6"];
  static fragmentOptions = ["1-3", "tlshello"];
  public domainStrategy? = "AsIs";
  public redirect? = "";
  public fragment?: { packets: string; length: string; interval: string } | null = { packets: "", length: "100-200", interval: "10-20" };
  public noises?: XrayNoiseObject[] = [];
  public proxyProtocol? = 0; // 0: off, 1, 2
}

class XrayDnsOutboundObject implements IProtocolType {
  public address!: string;
  public port = 53;
  public network = "tcp";
  public nonIPQuery = "drop";
}

class XraySocksOutboundObject implements IProtocolType {
  public servers: XraySocksServerObject[] = [];
  constructor() {
    if (this.servers.length === 0) this.servers.push(new XraySocksServerObject());
  }
}

const NormalizeOutbound = <T extends IProtocolType>(proxy: XrayOutboundObject<T>) => {
  proxy.sendThrough = proxy.sendThrough === "0.0.0.0" ? undefined : proxy.sendThrough;
  proxy.tag = proxy.tag === "" ? undefined : proxy.tag;

  proxy.streamSettings = plainToInstance(XrayStreamSettingsObject, proxy.streamSettings);
  proxy.streamSettings?.normalize();

  switch (proxy.protocol) {
    case XrayProtocol.FREEDOM:
      let freedom = proxy.settings as unknown as XrayFreedomOutboundObject;

      freedom.domainStrategy = freedom.domainStrategy === "AsIs" ? undefined : freedom.domainStrategy;
      freedom.fragment = freedom.fragment?.packets === "" ? undefined : freedom.fragment;
      freedom.redirect = freedom.redirect === "" ? undefined : freedom.redirect;
      freedom.noises = !freedom.noises || freedom.noises.length === 0 ? undefined : freedom.noises;
      freedom.proxyProtocol = freedom.proxyProtocol === 0 ? undefined : freedom.proxyProtocol;

      break;
    case XrayProtocol.BLACKHOLE:
      let blackhole = proxy.settings as unknown as XrayBlackholeOutboundObject;
      blackhole.response = blackhole.response?.type === "none" ? undefined : blackhole.response;
      break;
  }

  return proxy;
};

export { NormalizeOutbound, XrayWireguardOutboundObject, XrayTrojanOutboundObject, XraySocksOutboundObject, XrayShadowsocksOutboundObject, XrayDnsOutboundObject, XrayFreedomOutboundObject, XrayLoopbackOutboundObject, XrayBlackholeOutboundObject, XrayHttpOutboundObject, XrayVlessOutboundObject, XrayVmessOutboundObject, XrayOutboundObject };
