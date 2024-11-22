import { ITransportNetwork, IClient } from "./Interfaces";
import { XrayOptions, XrayProtocol, XrayProtocolMode } from "./Options";

class XraySniffingObject {
  static destOverrideOptions: string[] = ["http", "tls", "quic", "fakedns"];
  public enabled: boolean = false;
  public metadataOnly: boolean = false;
  public routeOnly: boolean = false;
  public destOverride: string[] = [];
  public domainsExcluded: string[] = [];

  constructor() {}
}

class XrayHeaderObject {
  public type: string = "none";
  public request?: XrayHeaderRequestObject;
  public response?: XrayHeaderResponseObject;
}

class XrayHeaderRequestObject {
  public version: string = "1.1";
  public method: string = "GET";
  public path: string = "/";
  public headers: any = {};
}

class XrayHeaderResponseObject {
  public version: string = "1.1";
  public status: string = "200";
  public reason: string = "OK";
  public headers: any = {};
}

class XrayXmuxObject {
  public maxConcurrency: number = 0;
  public maxConnections: number = 0;
  public cMaxReuseTimes: number = 0;
  public cMaxLifetimeMs: number = 0;
}

class XrayAllocateObject {
  static defaultRefresh: number = 5;
  static defaultConcurrency: number = 3;

  public strategy: string = "always";
  public refresh?: number = this.strategy == "random" ? XrayAllocateObject.defaultRefresh : undefined;
  public concurrency?: number = this.strategy == "random" ? XrayAllocateObject.defaultConcurrency : undefined;

  constructor() {}
}

class XrayStreamTcpSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol: boolean = false;
}

class XrayStreamKcpSettingsObject implements ITransportNetwork {
  public mtu: number = 1350;
  public tti: number = 50;
  public uplinkCapacity: number = 5;
  public downlinkCapacity: number = 20;
  public congestion: boolean = false;
  public readBufferSize: number = 2;
  public writeBufferSize: number = 2;
  public seed?: string;
  public header: XrayHeaderObject = new XrayHeaderObject();
}

class XrayStreamWsSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol: boolean = false;
  public path: string = "/";
  public host?: string;
  public headers: any = {};
}

class XrayStreamHttpSettingsObject implements ITransportNetwork {
  public host?: string[];
  public path: string = "/";
  public headers: any = {};
  read_idle_timeout?: number;
  health_check_timeout?: number;
  public method: string = "PUT";
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
  constructor() {}
}

class XrayStreamTlsSettingsObject {
  static alpnOptions: string[] = ["h2", "http/1.1"];
  static fingerprintOptions: string[] = ["", "randomized", "random", "chrome", "firefox", "ios", "android", "safari", "edge", "360", "qq"];
  static tlsVersionsOptions: string[] = ["1.0", "1.1", "1.2", "1.3"];

  public serverName?: string;
  public rejectUnknownSni: boolean = false;
  public allowInsecure: boolean = false;
  public disableSystemRoot: boolean = false;
  public enableSessionResumption: boolean = false;
  public alpn?: string[] = XrayStreamTlsSettingsObject.alpnOptions;
  public minVersion?: string;
  public maxVersion?: string;
  public certificates: XrayStreamTlsCertificateObject[] = [];
  public fingerprint?: string;
  public pinnedPeerCertificateChainSha256?: string;
  public masterKeyLog?: string;

  constructor() {
    this.certificates.push(new XrayStreamTlsCertificateObject());
  }
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

class XrayStreamGrpcSettingsObject implements ITransportNetwork {
  public serviceName: string = "";
  public multiMode: boolean = false;
  public idle_timeout: number = 60;
  public health_check_timeout: number = 20;
  public initial_windows_size: number = 0;
  public permit_without_stream: boolean = false;
}

class XrayStreamHttpUpgradeSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol: boolean = false;
  public path: string = "/";
  public host?: string;
  public headers: any = {};
}

class XrayStreamSplitHttpSettingsObject implements ITransportNetwork {
  public path: string = "/";
  public host?: string;
  public headers: any = {};
  public scMaxEachPostBytes: number = 1 * 1024 * 1024;
  public scMaxConcurrentPosts?: number;
  public scMinPostsIntervalMs?: number;
  public noSSEHeader: boolean = false;
  public xmux: XrayXmuxObject = new XrayXmuxObject();
}

class XrayLogObject {
  static levelOptions: string[] = ["debug", "info", "warning", "error", "none"];
  public access: string = "";
  public error: string = "";
  public loglevel: string = "warning";
  public dnsLog: boolean = false;
  public maskAddress: string = "";
}

class XrayRoutingObject {
  static domainStrategyOptions: string[] = ["AsIs", "IPIfNonMatch", "IPOnDemand"];
  static domainMatcherOptions: string[] = ["hybrid", "linear"];
  public domainStrategy: string = "AsIs";
  public domainMatcher: string = "hybrid";
  public rules: XrayRoutingRuleObject[] = [];
}

class XrayRoutingRuleObject {
  static networkOptions: string[] = ["", "tcp", "udp", "tcp,udp"];
  static protocolOptions: string[] = ["http", "tls", "bittorrent"];
  public domainMatcher: string = "hybrid";
  public domain?: string[];
  public ip?: string[];
  public port?: string;
  public sourcePort?: string;
  public type: string = "field";
  public network?: string;
  public source?: string[];
  public protocol?: string[] = [];
  public inboundTag?: string[] = [];
  public outboundTag?: string;
  public user: string[] = [];
  public attrs?: any;
}

class XrayStreamSettingsObject {
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

  public normalizeProtocol() {
    const networkOptions = XrayOptions.transportOptions.map((opt) => `${opt}Settings`);
    networkOptions.forEach((prop) => {
      if (this[prop as keyof XrayStreamSettingsObject] && !prop.startsWith(this.network!)) {
        delete this[prop as keyof XrayStreamSettingsObject];
      }
    });
  }
  public normalizeSecurity() {
    const securityOptions = XrayOptions.securityOptions.map((opt) => `${opt}Settings`);
    securityOptions.forEach((prop) => {
      if (this[prop as keyof XrayStreamSettingsObject] && !prop.startsWith(this.security!)) {
        delete this[prop as keyof XrayStreamSettingsObject];
      }
    });
  }
}
class XrayVnextObject {
  public address!: string;
  public port: number = 433;
  public users: IClient[] = [];
}

class XrayProtocolOption {
  public protocol!: XrayProtocol;
  public modes!: XrayProtocolMode;
}

export { XrayProtocolOption, XrayProtocol, XrayVnextObject, XrayStreamTcpSettingsObject, XrayStreamKcpSettingsObject, XrayStreamWsSettingsObject, XrayStreamHttpSettingsObject, XrayStreamGrpcSettingsObject, XrayStreamHttpUpgradeSettingsObject, XrayStreamSplitHttpSettingsObject, XrayStreamTlsSettingsObject, XrayStreamRealitySettingsObject, XrayStreamTlsCertificateObject, XrayStreamSettingsObject, XrayRoutingRuleObject, XrayRoutingObject, XrayLogObject, XrayAllocateObject, XraySniffingObject, XrayHeaderObject, XrayHeaderRequestObject, XrayHeaderResponseObject, XrayXmuxObject };
