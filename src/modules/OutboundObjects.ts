/* eslint-disable security/detect-object-injection */
import { IProtocolType } from "./Interfaces";
import { XrayProtocol } from "./Options";
import { XrayTrojanServerObject, XrayHttpServerObject, XrayStreamSettingsObject, XraySocksServerObject, XrayVmessServerObject, XrayNoiseObject, XrayShadowsocksServerObject, XrayPeerObject } from "./CommonObjects";
import { XrayVlessServerObject } from "./CommonObjects";
import { plainToInstance } from "class-transformer";

class XrayOutboundObject<TProxy extends IProtocolType> {
  public protocol!: XrayProtocol;
  public sendThrough? = "0.0.0.0";
  public tag?: string;
  public settings!: TProxy;
  public streamSettings? = new XrayStreamSettingsObject();

  constructor(protocol: XrayProtocol | undefined = undefined, settings: TProxy | undefined = undefined) {
    if (protocol && settings) {
      this.settings = settings;
      this.protocol = protocol;
      this.tag = "obd-" + this.protocol;
    }
  }
  normalize = () => {
    this.sendThrough = this.sendThrough === "0.0.0.0" ? undefined : this.sendThrough;
    this.tag = this.tag === "" ? undefined : this.tag;

    this.streamSettings = plainToInstance(XrayStreamSettingsObject, this.streamSettings) as XrayStreamSettingsObject;
    this.streamSettings.normalize();
    const isEmpty = JSON.stringify(this.streamSettings) === "{}";
    if (isEmpty) {
      this.streamSettings = undefined;
    }

    this.settings.normalize && this.settings.normalize();
  };
}

class XrayVlessOutboundObject implements IProtocolType {
  public vnext: XrayVlessServerObject[] = [];
  constructor() {
    if (this.vnext.length === 0) this.vnext.push(new XrayVlessServerObject());
  }

  normalize = () => void 0;
}

class XrayVmessOutboundObject implements IProtocolType {
  public vnext: XrayVmessServerObject[] = [];
  constructor() {
    if (this.vnext.length === 0) this.vnext.push(new XrayVmessServerObject());
  }

  normalize = () => void 0;
}

class XrayBlackholeOutboundObject implements IProtocolType {
  public response?: { type: string } = { type: "none" }; // none, http
  normalize = () => {
    this.response = this.response?.type === "none" ? undefined : this.response;
  };
}

class XrayHttpOutboundObject implements IProtocolType {
  public servers: XrayHttpServerObject[] = [];
  constructor() {
    if (this.servers.length === 0) this.servers.push(new XrayHttpServerObject());
  }

  normalize = () => void 0;
}
class XrayShadowsocksOutboundObject implements IProtocolType {
  public servers: XrayShadowsocksServerObject[] = [];
  constructor() {
    if (this.servers.length === 0) this.servers.push(new XrayShadowsocksServerObject());
  }

  normalize = () => void 0;
}

class XrayTrojanOutboundObject implements IProtocolType {
  public servers: XrayTrojanServerObject[] = [];
  constructor() {
    if (this.servers.length === 0) this.servers.push(new XrayTrojanServerObject());
  }

  normalize = () => void 0;
}

class XrayWireguardOutboundObject implements IProtocolType {
  static strategyOptions = ["ForceIPv6v4", "ForceIPv6", "ForceIPv4v6", "ForceIPv4", "ForceIP"];
  public privateKey!: string;
  public address: string[] = [];
  public peers: XrayPeerObject[] = [];
  public mtu = 1420;
  public reserved?: number[];
  public workers? = window.xray.router.cpu;

  public domainStrategy = "ForceIP";

  normalize = () => void 0;
}

class XrayLoopbackOutboundObject implements IProtocolType {
  public inboundTag!: string;

  normalize = () => void 0;
}
class XrayFreedomOutboundObject implements IProtocolType {
  static strategyOptions = ["AsIs", "UseIP", "UseIPv4", "UseIPv6"];
  static fragmentOptions = ["1-3", "tlshello"];
  public domainStrategy? = "AsIs";
  public redirect? = "";
  public fragment?: { packets: string; length: string; interval: string } | null = { packets: "", length: "100-200", interval: "10-20" };
  public noises?: XrayNoiseObject[] = [];
  public proxyProtocol? = 0; // 0: off, 1, 2

  normalize = () => {
    this.domainStrategy = this.domainStrategy === "AsIs" ? undefined : this.domainStrategy;
    this.fragment = this.fragment?.packets === "" ? undefined : this.fragment;
    this.redirect = this.redirect === "" ? undefined : this.redirect;
    this.noises = !this.noises || this.noises.length === 0 ? undefined : this.noises;
    this.proxyProtocol = this.proxyProtocol === 0 ? undefined : this.proxyProtocol;
  };
}

class XrayDnsOutboundObject implements IProtocolType {
  public address?: string;
  public port?: number;
  public network?: string = "tcp";
  public nonIPQuery? = "drop";

  normalize = () => {
    this.address = !this.address || this.address === "" ? undefined : this.address;
    this.network = this.network && this.network !== "tcp" ? this.network : undefined;
    this.port = !this.port || this.port === 0 ? undefined : this.port;
    this.nonIPQuery = this.nonIPQuery === "drop" ? undefined : this.nonIPQuery;
  };
}

class XraySocksOutboundObject implements IProtocolType {
  public servers: XraySocksServerObject[] = [];
  constructor() {
    if (this.servers.length === 0) this.servers.push(new XraySocksServerObject());
  }

  normalize = () => void 0;
}

export { XrayWireguardOutboundObject, XrayTrojanOutboundObject, XraySocksOutboundObject, XrayShadowsocksOutboundObject, XrayDnsOutboundObject, XrayFreedomOutboundObject, XrayLoopbackOutboundObject, XrayBlackholeOutboundObject, XrayHttpOutboundObject, XrayVlessOutboundObject, XrayVmessOutboundObject, XrayOutboundObject };
