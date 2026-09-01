/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IProtocolType } from './Interfaces';
import { XrayAllocateObject, XraySniffingObject, XrayStreamSettingsObject, isObjectEmpty } from './CommonObjects';
import {
  XrayVlessClientObject,
  XrayVmessClientObject,
  XrayHttpClientObject,
  XrayShadowsocksClientObject,
  XrayTrojanClientObject,
  XraySocksClientObject,
  XrayWireguardClientObject,
  XrayHysteriaClientObject
} from './ClientsObjects';
import { plainToInstance } from 'class-transformer';
import { normalizeIPAddress } from './validators';
import { XrayProtocol } from './Options';
import { coreSupports, tunUsesUppercaseMtu } from './CoreVersion';

export class XrayInboundObject<TProxy extends IProtocolType> {
  public protocol!: string;
  public listen? = '0.0.0.0';
  public port!: number | string;
  public tag?: string;
  public settings?: TProxy;
  public streamSettings?: XrayStreamSettingsObject = new XrayStreamSettingsObject();
  public allocate?: XrayAllocateObject;
  public sniffing?: XraySniffingObject;

  constructor(protocol: string | undefined = undefined, settings: TProxy | undefined = undefined) {
    if (protocol && settings) {
      this.settings = settings;
      this.protocol = protocol;
      this.tag = 'ibd-' + this.protocol;
    }
  }

  public isSystem = (): boolean => {
    return this.tag?.startsWith('sys:') ?? false;
  };

  normalize = (): this | undefined => {
    this.tag = this.tag === '' ? undefined : this.tag;
    this.listen = normalizeIPAddress(this.listen);
    this.listen = this.listen === '' || this.listen === '0.0.0.0' ? undefined : this.listen;

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

    if (this.settings && typeof (this.settings as any).normalize === 'function') {
      this.settings = (this.settings as any).normalize();
    }
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayDokodemoDoorInboundObject implements IProtocolType {
  public address?: string;
  public port?: number;
  public network?: string = 'tcp';
  public followRedirect?: boolean;
  public userLevel?: number;

  normalize = (): this | undefined => {
    this.network = this.network && this.network !== 'tcp' ? this.network : undefined;
    this.userLevel = this.userLevel && this.userLevel > 0 ? this.userLevel : undefined;
    this.port = this.port && this.port > 0 ? this.port : undefined;
    this.address = this.address && this.address !== '' ? this.address : undefined;
    return isObjectEmpty(this) ? undefined : this;
  };
}
export class XrayVlessInboundObject implements IProtocolType {
  public decryption = 'none';
  public clients: XrayVlessClientObject[] = [];
  getUserNames = (): string[] => {
    return this.clients.map((c) => c.email).filter((email): email is string => email !== undefined);
  };
  normalize = (): this | undefined => {
    this.clients = this.clients.map((c) => plainToInstance(XrayVlessClientObject, c).normalize());
    return this;
  };
}

export class XrayVmessInboundObject implements IProtocolType {
  public clients: XrayVmessClientObject[] = [];
  getUserNames = (): string[] => {
    return this.clients.map((c) => c.email).filter((email): email is string => email !== undefined);
  };
  normalize = (): this | undefined => {
    this.clients = this.clients.map((c) => plainToInstance(XrayVmessClientObject, c).normalize());
    return this;
  };
}

export class XrayHttpInboundObject implements IProtocolType {
  public allowTransparent? = false;
  public clients: XrayHttpClientObject[] = [];
  normalize = (): this | undefined => {
    this.allowTransparent = this.allowTransparent ? this.allowTransparent : undefined;
    return isObjectEmpty(this) ? undefined : this;
  };

  getUserNames = (): string[] => {
    return this.clients.map((c) => c.user);
  };
}

export class XrayShadowsocksInboundObject implements IProtocolType {
  public network? = 'tcp';
  public password? = '';
  public method? = 'aes-256-gcm';
  public email? = '';
  public clients: XrayShadowsocksClientObject[] = [];
  normalize = (): this | undefined => {
    this.network = this.network && this.network !== 'tcp' ? this.network : undefined;

    // For Shadowsocks 2022 multi-user mode, client methods must be empty
    const is2022Method = this.method?.startsWith('2022-blake3-');
    if (is2022Method) {
      // Keep the server method for 2022 ciphers, clear client methods
      // Server password is REQUIRED for 2022 multi-user mode
      this.clients.forEach((client) => {
        client.method = undefined;
      });
    } else {
      // For non-2022 methods, use default normalization
      this.method = this.method && this.method !== '' && this.method !== 'aes-256-gcm' ? this.method : undefined;
      // For legacy Shadowsocks, password can be optional (client-only mode)
      this.password = this.password && this.password !== '' ? this.password : undefined;
    }

    this.email = this.email && this.email !== '' ? this.email : undefined;

    return isObjectEmpty(this) ? undefined : this;
  };

  getUserNames = (): string[] => {
    return this.clients.map((c) => c.email);
  };
}

export class XrayTrojanInboundObject implements IProtocolType {
  public clients: XrayTrojanClientObject[] = [];
  getUserNames = (): string[] => {
    return this.clients.map((c) => c.email);
  };
  normalize = (): this | undefined => {
    return this;
  };
}

export class XraySocksInboundObject implements IProtocolType {
  public ip? = '127.0.0.1';
  public auth? = 'noauth';
  public accounts?: XraySocksClientObject[] = [];
  public udp? = false;
  normalize = (): this | undefined => {
    this.ip = normalizeIPAddress(this.ip);
    this.ip = !this.ip || this.ip === '127.0.0.1' ? undefined : this.ip;
    this.udp = this.udp ? this.udp : undefined;
    this.auth = this.auth === 'noauth' ? undefined : this.auth;
    this.accounts = this.accounts && this.accounts.length > 0 ? this.accounts : undefined;
    return isObjectEmpty(this) ? undefined : this;
  };
  getUserNames = (): string[] => {
    return this.accounts?.map((c) => c.user) ?? [];
  };
}

export class XrayWireguardInboundObject implements IProtocolType {
  public secretKey!: string;
  public kernelMode = true;
  public mtu = 1420;
  public peers: XrayWireguardClientObject[] = [];

  normalize = (): this | undefined => {
    return this;
  };
}

export class XrayHysteriaInboundObject implements IProtocolType {
  public version? = 2;
  public clients: XrayHysteriaClientObject[] = [];

  getUserNames = (): string[] => {
    return this.clients.map((c) => c.email).filter((email): email is string => email !== undefined);
  };

  normalize = (): this | undefined => {
    this.clients = this.clients.map((c) => plainToInstance(XrayHysteriaClientObject, c).normalize());
    return this;
  };
}

const tunList = (value?: string[]): string[] | undefined => (value && value.length > 0 ? value : undefined);

export class XrayTunInboundObject implements IProtocolType {
  public name? = 'xray0';
  public desc?: string;
  public mtu? = 1500;
  public gateway?: string[];
  public dns?: string[];
  public userLevel?: number;
  public autoSystemRoutingTable?: string[];
  public autoOutboundsInterface?: string;

  stripUnsupported = (): void => {
    if (!coreSupports('tunDesc')) this.desc = undefined;
    if (!coreSupports('tunGateway')) {
      this.dns = undefined;
      this.autoOutboundsInterface = undefined;
    }
    if (!coreSupports('tunAutoRoute')) {
      this.autoSystemRoutingTable = undefined;
    }
    if (this.mtu !== undefined && tunUsesUppercaseMtu()) {
      (this as unknown as Record<string, unknown>).MTU = this.mtu;
      this.mtu = undefined;
    }
  };

  normalize = (): this | undefined => {
    this.name = this.name === '' ? undefined : this.name;
    this.desc = this.desc === '' ? undefined : this.desc;
    this.mtu = this.mtu && this.mtu > 0 && this.mtu !== 1500 ? this.mtu : undefined;
    this.userLevel = this.userLevel ? this.userLevel : undefined;
    this.autoOutboundsInterface = this.autoOutboundsInterface === '' ? undefined : this.autoOutboundsInterface;
    this.gateway = tunList(this.gateway);
    this.dns = tunList(this.dns);
    this.autoSystemRoutingTable = tunList(this.autoSystemRoutingTable);
    this.stripUnsupported();
    return isObjectEmpty(this) ? undefined : this;
  };
}

interface LegacyTunSettings {
  gso?: boolean;
  address?: string[];
  routes?: string[];
}

export function migrateTunInbound(inbound: { protocol?: string; settings?: unknown }): void {
  if (inbound.protocol !== XrayProtocol.TUN || !inbound.settings) return;

  const settings = inbound.settings as XrayTunInboundObject & LegacyTunSettings & { MTU?: number };
  const legacy = settings as LegacyTunSettings;

  if (settings.MTU !== undefined) {
    settings.mtu = settings.MTU;
    delete settings.MTU;
  }

  if (legacy.address?.length && !settings.gateway?.length) {
    settings.gateway = legacy.address;
  }
  delete legacy.address;
  delete legacy.routes;
  delete legacy.gso;
}
