/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IClient } from './Interfaces';
import { coreSupports } from './CoreVersion';

export class XrayWireguardClientObject implements IClient {
  public publicKey!: string;
  public allowedIPs: string[] = [];

  normalize = () => void 0;
}

export class XraySocksClientObject implements IClient {
  public pass!: string;
  public user!: string;
  normalize = () => void 0;
}

export class XrayShadowsocksClientObject implements IClient {
  public email!: string;
  public password!: string;
  public level?: number;
  public method? = 'aes-256-gcm';
  normalize = () => void 0;
}

export class XrayVmessClientObject implements IClient {
  public id!: string;
  public email?: string;
  public level?: number;
  public security?: string;
  normalize = (): this => {
    this.email = this.email === '' ? undefined : this.email;
    this.level = this.level === 0 ? undefined : this.level;
    // Empty means core's default 'auto', so leave the key out. none/zero are dropped where core turns them into auto anyway.
    const removed = !coreSupports('vmessPlainSecurity') && ['none', 'zero'].includes(this.security?.toLowerCase() ?? '');
    this.security = this.security && !removed ? this.security : undefined;
    return this;
  };
}

export class XrayHttpClientObject implements IClient {
  public pass!: string;
  public user!: string;
  normalize = () => void 0;
}

export class XrayTrojanClientObject implements IClient {
  public password!: string;
  public email!: string;
  normalize = () => void 0;
}

export class XrayHysteriaClientObject implements IClient {
  public auth!: string;
  public email?: string;
  normalize = (): this => {
    this.email = this.email === '' ? undefined : this.email;
    return this;
  };
}

export class XrayVlessClientObject implements IClient {
  public id!: string;
  public email?: string;
  public level?: number;
  public encryption?: string;
  public flow? = 'none';
  normalize = (): this => {
    this.encryption = this.encryption === '' ? 'none' : this.encryption;
    this.flow = this.flow === '' || this.flow === 'none' ? undefined : this.flow;
    this.email = this.email === '' ? undefined : this.email;
    this.level = this.level === 0 ? undefined : this.level;
    return this;
  };
}
