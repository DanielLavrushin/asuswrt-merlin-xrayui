/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IClient } from './Interfaces';

class XrayWireguardClientObject implements IClient {
  public publicKey!: string;
  public allowedIPs: string[] = [];

  normalize = () => void 0;
}

class XraySocksClientObject implements IClient {
  public pass!: string;
  public user!: string;
  normalize = () => void 0;
}

class XrayShadowsocksClientObject implements IClient {
  public email!: string;
  public password!: string;
  public level?: number;
  public method? = 'aes-256-gcm';
  normalize = () => void 0;
}

class XrayVmessClientObject implements IClient {
  public id!: string;
  public email!: string;
  public level?: number;
  public security?: string;
  normalize = () => void 0;
}

class XrayHttpClientObject implements IClient {
  public pass!: string;
  public user!: string;
  normalize = () => void 0;
}

class XrayTrojanClientObject implements IClient {
  public password!: string;
  public email!: string;
  normalize = () => void 0;
}

class XrayVlessClientObject implements IClient {
  public id!: string;
  public email!: string;
  public level?: number;
  public encryption?: string;
  public flow? = 'none';
  normalize = () => void 0;
}

export { XrayWireguardClientObject, XraySocksClientObject, XrayShadowsocksClientObject, XrayVmessClientObject, XrayHttpClientObject, XrayTrojanClientObject, XrayVlessClientObject };
