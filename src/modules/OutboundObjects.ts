import { IProtocolType } from "./Interfaces";
import { XrayProtocol } from "./Options";
import { XrayHttpServerObject, XrayStreamSettingsObject, XraySocksServerObject, XrayVmessServerObject } from "./CommonObjects";
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

class LoopbackOutboundObject implements IProtocolType {
  public inboundTag!: string;
}
class XrayFreedomOutboundObject implements IProtocolType {
  static strategyOptions: string[] = ["AsIs", "UseIP", "UseIPv4", "UseIPv6"];
  static fragmentOptions: string[] = ["1-3", "tlshello"];
  public domainStrategy: string = "AsIs";
  public redirect: string = "";
  public fragment: { packets: string; length: string; interval: string } = { packets: "tlshello", length: "30", interval: "2" };
  public noises: string[] = [];
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

export { XraySocksOutboundObject, XrayDnsOutboundObject, XrayFreedomOutboundObject, LoopbackOutboundObject, XrayBlackholeOutboundObject, XrayHttpOutboundObject, XrayVlessOutboundObject, XrayVmessOutboundObject, XrayOutboundObject };
