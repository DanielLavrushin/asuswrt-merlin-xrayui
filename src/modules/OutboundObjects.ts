import { IProtocolType } from "./Interfaces";
import { XrayProtocol } from "./Options";
import { XrayStreamSettingsObject } from "./CommonObjects";
import { XrayVnextObject } from "./CommonObjects";
import { XraySocksClientObject } from "./ClientsObjects";

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
  public vnext: XrayVnextObject[] = [];
}

class XrayVmessOutboundObject implements IProtocolType {
  public vnext: XrayVnextObject[] = [];
}

class XrayBlackholeOutboundObject implements IProtocolType {}

class XrayHttpOutboundObject implements IProtocolType {
  public host: string[] = [];
  public path?: string;
  public method: string = "PUT";
  read_idle_timeout?: number = 10;
  health_check_timeout?: number = 15;
  public headers: any = {};
}

class LoopbackOutboundObject implements IProtocolType {
  public inboundTag!: string;
}
class XrayFreedomOutboundObject implements IProtocolType {}

class XrayDnsOutboundObject implements IProtocolType {
  public address!: string;
  public port: number = 53;
  public network: string = "tcp";
  public nonIPQuery: string = "drop";
}

class XraySocksOutboundObject implements IProtocolType {
  public address!: string;
  public port!: number;
  public users: XraySocksClientObject[] = [];
}

export { XraySocksOutboundObject, XrayDnsOutboundObject, XrayFreedomOutboundObject, LoopbackOutboundObject, XrayBlackholeOutboundObject, XrayHttpOutboundObject, XrayVlessOutboundObject, XrayVmessOutboundObject, XrayOutboundObject };
