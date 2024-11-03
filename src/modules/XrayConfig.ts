import { reactive } from "vue";

class XrayObject {
  public inbounds: XrayInboundObject[] = [];
  public outbounds: XrayOutboundObject[] = [];

  constructor() {
    if (this.inbounds.length === 0) {
      this.inbounds.push(new XrayInboundObject());
    }
  }
}

class XrayAllocateObject {
  static defaultRefresh: number = 5;
  static defaultConcurrency: number = 3;

  public strategy: string = "always";
  public refresh: number | undefined = this.strategy == "random" ? XrayAllocateObject.defaultRefresh : undefined;
  public concurrency: number | undefined = this.strategy == "random" ? XrayAllocateObject.defaultConcurrency : undefined;

  constructor() {}
}
class XraySniffingObject {
  static destOverrideOptions: string[] = ["http", "tls", "quic", "fakedns"];
  public enabled: boolean = false;
  public metadataOnly: boolean = false;
  public routeOnly: boolean = false;
  public destOverride: string[] = [];
  public domainsExcluded: string[] = [];

  constructor() {}
}
class XrayStreamTlsSettingsObject {}
class XrayStreamRealitySettingsObject {}
class XrayStreamTcpSettingsObject {}
class XrayStreamKcpSettingsObject {}
class XrayStreamWsSettingsObject {}
class XrayStreamHttpSettingsObject {}
class XrayStreamGrpcSettingsObject {}
class XrayStreamHttpUpgradeSettingsObject {}
class XrayStreamSplitHttpSettingsObject {}

class XrayStreamSettingsObject {
  static networkOptions: string[] = ["tcp", "kcp", "ws", "http", "grpc", "httpupgrade", "splithttp"];
  static securityOptions: string[] = ["none", "tls", "reality"];

  public network: string | undefined = "tcp";
  public security: string | undefined = "tls";

  public tlsSettings: XrayStreamTlsSettingsObject | undefined;
  public realitySettings: XrayStreamRealitySettingsObject | undefined;
  public tcpSettings: XrayStreamTcpSettingsObject | undefined;
  public kcpSettings: XrayStreamKcpSettingsObject | undefined;
  public wsSettings: XrayStreamWsSettingsObject | undefined;
  public httpSettings: XrayStreamHttpSettingsObject | undefined;
  public grpcSettings: XrayStreamGrpcSettingsObject | undefined;
  public httpupgradeSettings: XrayStreamHttpUpgradeSettingsObject | undefined;
  public splithttpSettings: XrayStreamSplitHttpSettingsObject | undefined;
}

class XrayInboundObject {
  static protocols: string[] = ["vless", "vmess", "shadowsocks", "trojan", "wireguard"];

  static defauiltPort: number = 1080;
  static defaultListen: string = "0.0.0.0";
  static defaultProtocol: string = "vmess";

  public port: string | number = XrayInboundObject.defauiltPort;
  public listen: string | undefined = XrayInboundObject.defaultListen;
  public protocol: string = XrayInboundObject.defaultProtocol;
  public allocate: XrayAllocateObject | undefined;
  public settings: XrayInboundSettingsObject | undefined;
  public streamSettings: XrayStreamSettingsObject;
  public sniffing: XraySniffingObject | undefined;

  constructor() {
    this.allocate = new XrayAllocateObject();
    this.settings = new XrayInboundSettingsObject();
    this.sniffing = new XraySniffingObject();
    this.streamSettings = new XrayStreamSettingsObject();
  }
}

class XrayInboundSettingsObject {
  public network: string | undefined;
  public security: string | undefined;
  public clients: XrayInboundClientObject[] = [];

  constructor() {}
}

class XrayInboundClientObject {
  public id: string | undefined;
  public email: string | undefined;
  public level: number | undefined;
}

class XrayOutboundObject {}

let xrayConfig = reactive(new XrayObject());
export default xrayConfig;
export { XrayObject, XrayInboundObject, XrayInboundSettingsObject, XrayInboundClientObject, XrayOutboundObject, XrayAllocateObject, XraySniffingObject, XrayStreamSettingsObject };
