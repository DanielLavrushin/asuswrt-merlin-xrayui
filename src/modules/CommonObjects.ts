import { XrayHttpClientObject, XraySocksClientObject, XrayVlessClientObject, XrayVmessClientObject } from "./ClientsObjects";
import { IXrayServer, IClient } from "./Interfaces";
import { XrayOptions, XrayProtocol, XrayProtocolMode } from "./Options";
import { XrayStreamHttpSettingsObject, XrayStreamKcpSettingsObject, XrayStreamTcpSettingsObject, XrayStreamWsSettingsObject, XrayStreamGrpcSettingsObject, XrayStreamHttpUpgradeSettingsObject, XrayStreamSplitHttpSettingsObject } from "./TransportObjects";

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

class XrayServerObject<IClient> implements IXrayServer<IClient> {
  public address!: string;
  public port!: number;
  public users: IClient[] = [];
}

class XrayHttpServerObject extends XrayServerObject<XrayHttpClientObject> {}
class XraySocksServerObject extends XrayServerObject<XraySocksClientObject> {}
class XrayVlessServerObject extends XrayServerObject<XrayVlessClientObject> {}
class XrayVmessServerObject extends XrayServerObject<XrayVmessClientObject> {}

class XrayProtocolOption {
  public protocol!: XrayProtocol;
  public modes!: XrayProtocolMode;
}

export { XrayHttpServerObject, XraySocksServerObject, XrayProtocolOption, XrayProtocol, XrayVlessServerObject, XrayVmessServerObject, XrayStreamTlsSettingsObject, XrayStreamRealitySettingsObject, XrayStreamTlsCertificateObject, XrayStreamSettingsObject, XrayRoutingRuleObject, XrayRoutingObject, XrayLogObject, XrayAllocateObject, XraySniffingObject, XrayHeaderObject, XrayHeaderRequestObject, XrayHeaderResponseObject, XrayXmuxObject };
