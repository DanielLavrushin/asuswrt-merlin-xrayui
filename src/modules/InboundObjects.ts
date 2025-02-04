/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IProtocolType } from "./Interfaces";
import { XrayAllocateObject, XraySniffingObject, XrayStreamSettingsObject } from "./CommonObjects";
import { XrayVlessClientObject, XrayVmessClientObject, XrayHttpClientObject, XrayShadowsocksClientObject, XrayTrojanClientObject, XraySocksClientObject, XrayWireguardClientObject } from "./ClientsObjects";
import { plainToInstance } from "class-transformer";

class XrayInboundObject<TProxy extends IProtocolType> {
  public protocol!: string;
  public listen? = "0.0.0.0";
  public port!: number | string;
  public tag?: string;
  public settings!: TProxy;
  public streamSettings?: XrayStreamSettingsObject = new XrayStreamSettingsObject();
  public allocate?: XrayAllocateObject;
  public sniffing?: XraySniffingObject;

  constructor(protocol: string | undefined = undefined, settings: TProxy | undefined = undefined) {
    if (protocol && settings) {
      this.settings = settings;
      this.protocol = protocol;
      this.tag = "ibd-" + this.protocol;
    }
  }

  public isSystem = (): boolean => {
    return this.tag?.startsWith("sys:") ?? false;
  };

  normalize = () => {
    this.tag = this.tag === "" ? undefined : this.tag;

    if (this.streamSettings) {
      this.streamSettings = plainToInstance(XrayStreamSettingsObject, this.streamSettings) as XrayStreamSettingsObject;
      this.streamSettings = this.streamSettings.normalize();
    }

    if (this.sniffing) {
      this.sniffing.normalize();
    }

    if (this.allocate) {
      this.allocate = this.allocate.normalize();
    }

    this.settings.normalize && this.settings.normalize();
  };
}

class XrayDokodemoDoorInboundObject implements IProtocolType {
  public address?: string;
  public port?: number;
  public network?: string = "tcp";
  public followRedirect?: boolean;
  public userLevel?: number;

  normalize = () => {
    this.network = this.network && this.network !== "tcp" ? this.network : undefined;
    this.userLevel = this.userLevel && this.userLevel > 0 ? this.userLevel : undefined;
    this.port = this.port && this.port > 0 ? this.port : undefined;
  };
}
class XrayVlessInboundObject implements IProtocolType {
  public decryption = "none";
  public clients: XrayVlessClientObject[] = [];
  normalize = () => void 0;
}

class XrayVmessInboundObject implements IProtocolType {
  public clients: XrayVmessClientObject[] = [];
  normalize = () => void 0;
}

class XrayHttpInboundObject implements IProtocolType {
  public allowTransparen? = false;
  public clients: XrayHttpClientObject[] = [];
  normalize = () => {
    this.allowTransparen = this.allowTransparen ? this.allowTransparen : undefined;
  };
}

class XrayShadowsocksInboundObject implements IProtocolType {
  public network? = "tcp";
  public clients: XrayShadowsocksClientObject[] = [];
  normalize = () => {
    this.network = this.network && this.network !== "tcp" ? this.network : undefined;
  };
}

class XrayTrojanInboundObject implements IProtocolType {
  public clients: XrayTrojanClientObject[] = [];
  normalize = () => void 0;
}

class XraySocksInboundObject implements IProtocolType {
  public ip? = "127.0.0.1";
  public auth? = "noauth";
  public accounts?: XraySocksClientObject[] = [];
  public udp? = false;
  normalize = () => {
    this.ip = !this.ip || this.ip === "127.0.0.1" ? undefined : this.ip;
    this.udp = this.udp ? this.udp : undefined;
    this.auth = this.auth === "noauth" ? undefined : this.auth;
    this.accounts = this.accounts && this.accounts.length > 0 ? this.accounts : undefined;
  };
}

class XrayWireguardInboundObject implements IProtocolType {
  public secretKey!: string;
  public kernelMode = true;
  public mtu = 1420;
  public peers: XrayWireguardClientObject[] = [];
  normalize = () => void 0;
}

export { XrayInboundObject, XrayWireguardInboundObject, XraySocksInboundObject, XrayTrojanInboundObject, XrayShadowsocksInboundObject, XrayHttpInboundObject, XrayVmessInboundObject, XrayVlessInboundObject, XrayDokodemoDoorInboundObject };
