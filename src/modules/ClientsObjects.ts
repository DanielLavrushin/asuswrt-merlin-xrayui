import { IClient } from "./Interfaces";

class XrayWireguardClientObject implements IClient {
  public publicKey!: string;
  public allowedIPs: string[] = [];
}

class XraySocksClientObject implements IClient {
  public pass!: string;
  public user!: string;
}

class XrayShadowsocksClientObject implements IClient {
  public email!: string;
  public password!: string;
  public level?: number;
  public method? = "aes-256-gcm";
}

class XrayVmessClientObject implements IClient {
  public id!: string;
  public email!: string;
  public level?: number;
  public security?: string;
}
class XrayHttpClientObject implements IClient {
  public pass!: string;
  public user!: string;
}
class XrayTrojanClientObject implements IClient {
  public password!: string;
  public email!: string;
}
class XrayVlessClientObject implements IClient {
  public id!: string;
  public email!: string;
  public level?: number;
  public encryption?: string;
  public flow = "none";
}

export { XrayWireguardClientObject, XraySocksClientObject, XrayShadowsocksClientObject, XrayVmessClientObject, XrayHttpClientObject, XrayTrojanClientObject, XrayVlessClientObject };
