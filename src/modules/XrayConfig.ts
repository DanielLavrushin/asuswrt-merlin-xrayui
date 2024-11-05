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
  public refresh?: number = this.strategy == "random" ? XrayAllocateObject.defaultRefresh : undefined;
  public concurrency?: number = this.strategy == "random" ? XrayAllocateObject.defaultConcurrency : undefined;

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

class XrayStreamTlsCertificateObject {
  static usageOptions: string[] = ["encipherment", "verify", "issue"];

  public ocspStapling: number = 3600;
  public oneTimeLoading: boolean = false;
  public buildChain: boolean = false;
  public usage: string = "encipherment";
  public certificateFile?: string;
  public keyFile?: string;
  public key?: string;
  public certificate?: string;
}

class XrayStreamTlsSettingsObject {
  static alpnOptions: string[] = ["h2", "http/1.1"];
  static fingerprintOptions: string[] = ["", "randomized", "random", "chrome", "firefox", "ios", "android", "safari", "edge", "360", "qq"];
  static tlsVersionsOptions: number[] = [1.0, 1.1, 1.2, 1.3];

  public serverName?: string;
  public rejectUnknownSni: boolean = false;
  public allowInsecure: boolean = false;
  public disableSystemRoot: boolean = false;
  public enableSessionResumption: boolean = false;
  public alpn?: string[] = XrayStreamTlsSettingsObject.alpnOptions;
  public minVersion: number = 1.3;
  public maxVersion: number = 1.3;
  public certificates: XrayStreamTlsCertificateObject[] = [];
  public fingerprint?: string;
  public pinnedPeerCertificateChainSha256?: string;
  public masterKeyLog?: string;

  constructor() {}
}

class XrayStreamRealitySettingsObject {
  public show: boolean = false;
  public dest?: string;
  public xver: number = 0;
  public serverName?: string;
  public serverNames?: string[];
  public privateKey?: string;
  public minClientVer?: number;
  public maxClientVer?: number;
  public maxTimeDiff: number = 0;
  public shortIds: string[] = [];
  public fingerprint?: string;
  public publicKey?: string;
  public shortId?: string;
  public spiderX?: string;
}
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

  public network?: string = "tcp";
  public security?: string = "tls";

  public tlsSettings?: XrayStreamTlsSettingsObject;
  public realitySettings?: XrayStreamRealitySettingsObject;
  public tcpSettings?: XrayStreamTcpSettingsObject;
  public kcpSettings?: XrayStreamKcpSettingsObject;
  public wsSettings?: XrayStreamWsSettingsObject;
  public httpSettings?: XrayStreamHttpSettingsObject;
  public grpcSettings?: XrayStreamGrpcSettingsObject;
  public httpupgradeSettings?: XrayStreamHttpUpgradeSettingsObject;
  public splithttpSettings?: XrayStreamSplitHttpSettingsObject;
}

class XrayInboundObject {
  static protocols: string[] = ["vless", "vmess", "shadowsocks", "trojan", "wireguard"];

  static defauiltPort: number = 1080;
  static defaultListen: string = "0.0.0.0";
  static defaultProtocol: string = "vmess";

  public port: string | number = XrayInboundObject.defauiltPort;
  public listen?: string = XrayInboundObject.defaultListen;
  public protocol: string = XrayInboundObject.defaultProtocol;
  public allocate?: XrayAllocateObject;
  public settings?: XrayInboundSettingsObject;
  public streamSettings: XrayStreamSettingsObject;
  public sniffing?: XraySniffingObject;

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
export { XrayObject, XrayInboundObject, XrayInboundSettingsObject, XrayInboundClientObject, XrayOutboundObject, XrayAllocateObject, XraySniffingObject, XrayStreamSettingsObject, XrayStreamTlsSettingsObject, XrayStreamRealitySettingsObject, XrayStreamTlsCertificateObject };
