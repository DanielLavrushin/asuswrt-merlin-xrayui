import { XrayHttpClientObject, XraySocksClientObject, XrayVlessClientObject, XrayVmessClientObject } from "./ClientsObjects";
import { IXrayServer } from "./Interfaces";
import { XrayOptions, XrayProtocol, XrayProtocolMode } from "./Options";
import { XrayStreamHttpSettingsObject, XrayStreamKcpSettingsObject, XrayStreamTcpSettingsObject, XrayStreamWsSettingsObject, XrayStreamGrpcSettingsObject, XrayStreamHttpUpgradeSettingsObject, XrayStreamSplitHttpSettingsObject } from "./TransportObjects";

class XraySniffingObject {
  static destOverrideOptions: string[] = ["http", "tls", "quic", "fakedns"];
  public enabled?: boolean = false;
  public metadataOnly?: boolean = false;
  public routeOnly?: boolean = false;
  public destOverride?: string[] = [];
  public domainsExcluded?: string[] = [];

  constructor() {}
  normalize() {
    this.destOverride = !this.destOverride || this.destOverride.length == 0 ? undefined : this.destOverride;
    this.domainsExcluded = !this.domainsExcluded || this.domainsExcluded.length == 0 ? undefined : this.domainsExcluded;
    this.enabled = !this.enabled ? undefined : this.enabled;
    this.metadataOnly = !this.metadataOnly ? undefined : this.metadataOnly;
    this.routeOnly = !this.routeOnly ? undefined : this.routeOnly;
  }
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

  constructor(parsedObject?: XrayParsedUrlObject | undefined) {
    this.certificates.push(new XrayStreamTlsCertificateObject());
    if (parsedObject) {
      this.serverName = parsedObject.parsedParams["sni"];
    }
  }
}

class XrayStreamRealitySettingsObject {
  public show: boolean = false;
  public dest?: string;
  public xver?: number;
  public serverName?: string;
  public serverNames?: string[];
  public privateKey?: string;
  public minClientVer?: number;
  public maxClientVer?: number;
  public maxTimeDiff?: number;
  public shortIds?: string[] | undefined;
  public fingerprint?: string;
  public publicKey?: string;
  public shortId?: string;
  public spiderX?: string;

  constructor(parsedObject?: XrayParsedUrlObject | undefined) {
    if (parsedObject) {
      this.serverName = parsedObject.server;
      this.shortId = parsedObject.parsedParams["sid"];
      this.fingerprint = parsedObject.parsedParams["fp"];
      this.publicKey = parsedObject.parsedParams["pbk"];
      this.spiderX = parsedObject.parsedParams["spx"];
      this.serverName = parsedObject.parsedParams["sni"];
    }
  }
}

class XrayLogObject {
  static levelOptions: string[] = ["debug", "info", "warning", "error", "none"];
  public access: string = "";
  public error: string = "";
  public loglevel: string = "warning";
  public dnsLog: boolean = false;
  public maskAddress: string = "";
}

class XrayDnsObject {
  static strategyOptions: string[] = ["UseIP", "UseIPv4", "UseIPv6"];
  public tag?: string = "dnsQuery";
  public hosts?: { [key: string]: string | string[] } | undefined = {};
  public servers: (string | XrayDnsServerObject)[] | undefined = [];
  public clientIp?: string;
  public queryStrategy?: string;
  public disableCache?: boolean;
  public disableFallback?: boolean;
  public disableFallbackIfMatch?: boolean;

  public normalize() {
    this.clientIp = this.clientIp == "" ? undefined : this.clientIp;
    this.queryStrategy = this.queryStrategy == "" ? undefined : this.queryStrategy;
    this.disableCache = !this.disableCache ? undefined : this.disableCache;
    this.disableFallback = !this.disableFallback ? undefined : this.disableFallback;
    this.disableFallbackIfMatch = !this.disableFallbackIfMatch ? undefined : this.disableFallbackIfMatch;
    this.servers = this.servers?.length == 0 ? undefined : this.servers;
    this.hosts = !this.hosts || Object.keys(this.hosts).length == 0 ? undefined : this.hosts;
  }
}

class XrayDnsServerObject {
  public address!: string;
  public port?: number;
  public domains?: string[];
  public expectIPs?: string[];
  public skipFallback?: boolean;
  public clientIP?: string;
}

class XrayRoutingObject {
  static domainStrategyOptions: string[] = ["AsIs", "IPIfNonMatch", "IPOnDemand"];
  static domainMatcherOptions: string[] = ["hybrid", "linear"];
  public domainStrategy?: string = "AsIs";
  public domainMatcher?: string = "hybrid";
  public rules?: XrayRoutingRuleObject[] = [];

  public normalize() {
    this.domainStrategy = this.domainStrategy == "AsIs" ? undefined : this.domainStrategy;
    this.domainMatcher = this.domainMatcher == "hybrid" ? undefined : this.domainMatcher;

    if (this.rules && this.rules.length > 0) {
      this.rules.forEach((rule) => {
        rule.normalize();
      });
    } else {
      this.rules = undefined;
    }
  }
}

class XrayRoutingRuleObject {
  static networkOptions: string[] = ["", "tcp", "udp", "tcp,udp"];
  static protocolOptions: string[] = ["http", "tls", "bittorrent"];
  public name?: string;
  public domainMatcher?: string = "hybrid";
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
  public user?: string[] = [];
  public attrs?: any;

  public normalize() {
    this.domainMatcher = this.domainMatcher == "hybrid" ? undefined : this.domainMatcher;
    this.domain = this.domain?.length == 0 ? undefined : this.domain;
    this.ip = this.ip?.length == 0 ? undefined : this.ip;
    this.protocol = this.protocol?.length == 0 ? undefined : this.protocol;
    this.source = this.source?.length == 0 ? undefined : this.source;
    this.inboundTag = this.inboundTag?.length == 0 ? undefined : this.inboundTag;
    this.user = this.user?.length == 0 ? undefined : this.user;

    this.port = this.port == "" ? undefined : this.port;
    this.sourcePort = this.sourcePort == "" ? undefined : this.sourcePort;
    this.outboundTag = this.outboundTag == "" ? undefined : this.outboundTag;
    this.network = this.network == "" ? undefined : this.network;
  }
}

class XrayStreamSettingsObject {
  public network?: string = "tcp";
  public security?: string = "none";
  public tlsSettings?: XrayStreamTlsSettingsObject;
  public realitySettings?: XrayStreamRealitySettingsObject;
  public tcpSettings?: XrayStreamTcpSettingsObject;
  public kcpSettings?: XrayStreamKcpSettingsObject;
  public wsSettings?: XrayStreamWsSettingsObject;
  public httpSettings?: XrayStreamHttpSettingsObject;
  public grpcSettings?: XrayStreamGrpcSettingsObject;
  public httpupgradeSettings?: XrayStreamHttpUpgradeSettingsObject;
  public splithttpSettings?: XrayStreamSplitHttpSettingsObject;

  public sockopt?: XraySockoptObject;

  public normalize() {
    this.network = this.network == "" || this.network == "tcp" ? undefined : this.network;
    this.security = this.security == "" || this.security == "none" ? undefined : this.security;

    this.normalizeProtocol();
    this.normalizeSecurity();
    this.normalizeSockopt();
  }

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
  public normalizeSockopt() {
    if (this.sockopt) {
      if (!this.sockopt.tproxy || this.sockopt.tproxy == "off") {
        this.sockopt = undefined;
        return;
      }
      this.sockopt.mark = !this.sockopt.mark && this.sockopt.mark == 0 ? undefined : this.sockopt.mark;
      this.sockopt.interface = this.sockopt.interface == "" ? undefined : this.sockopt.interface;
      this.sockopt.tproxy = this.sockopt.tproxy == "off" || this.sockopt.tproxy == "" ? undefined : this.sockopt.tproxy;
    }
  }
}

class XrayServerObject<IClient> implements IXrayServer<IClient> {
  public address!: string;
  public port!: number;
  public users?: IClient[] | undefined = [];
}
class XrayTrojanServerObject extends XrayServerObject<XrayHttpClientObject> {
  public email?: string;
  public password!: string;
  public level?: number = 0;
  constructor() {
    super();
    delete this.users;
  }
}
class XrayHttpServerObject extends XrayServerObject<XrayHttpClientObject> {}
class XraySocksServerObject extends XrayServerObject<XraySocksClientObject> {}
class XrayVlessServerObject extends XrayServerObject<XrayVlessClientObject> {}
class XrayVmessServerObject extends XrayServerObject<XrayVmessClientObject> {}
class XrayShadowsocksServerObject extends XrayServerObject<XrayVmessClientObject> {
  public email?: string;
  public method: string = "2022-blake3-aes-256-gcm";
  public password!: string;
  public uot?: boolean;
  public level?: number = 0;
  constructor() {
    super();
    delete this.users;
  }
}

class XrayProtocolOption {
  public protocol!: XrayProtocol;
  public modes!: XrayProtocolMode;
}

class XrayNoiseObject {
  static typeOptions: string[] = ["rand", "str", "base64"];
  public type: string = "rand";
  public packet!: string;
  public delay: string | number = 0;
}

class XrayPeerObject {
  public endpoint!: string;
  public publicKey!: string;
  public preSharedKey?: string;
  public allowedIPs?: string[];
  public keepAlive?: number;
}

class XraySockoptObject {
  static tproxyOptions: string[] = ["off", "redirect", "tproxy"];
  static domainStrategyOptions: string[] = ["AsIs", "UseIP", "UseIPv4", "UseIPv6"];

  public mark?: number;
  public tcpFastOpen?: boolean;
  public tproxy?: string;
  public domainStrategy?: string;
  public dialerProxy?: string;
  public acceptProxyProtocol?: boolean;
  public tcpKeepAliveInterval?: number;
  public tcpcongestion?: string;
  public interface?: string;
  public tcpMptcp?: boolean;
  public tcpNoDelay?: boolean;
}

class XrayParsedUrlObject {
  public server!: string;
  public port!: number;
  public protocol!: string;
  public tag!: string;
  public uuid!: string;
  public network!: string;
  public security!: string;
  public parsedParams: Record<string, string> = {};

  public constructor(url: string) {
    const [protocol, rest] = url.split("://");
    const [authHost, queryFragment] = rest.split("?");
    const [uuid, serverPort] = authHost.split("@");
    const [server, port] = serverPort.split(":");
    const [query, tag] = queryFragment.split("#");

    const params = new URLSearchParams(query);

    params.forEach((value, key) => {
      this.parsedParams[key] = value;
    });

    this.tag = tag;
    this.server = server;
    this.port = parseInt(port);
    this.protocol = protocol;
    this.uuid = uuid;
    this.network = this.parsedParams["type"];
    this.security = this.parsedParams["security"];
  }
}
export { XrayParsedUrlObject, XraySockoptObject, XrayDnsObject, XrayDnsServerObject, XrayTrojanServerObject, XrayPeerObject, XrayNoiseObject, XrayShadowsocksServerObject, XrayHttpServerObject, XraySocksServerObject, XrayProtocolOption, XrayProtocol, XrayVlessServerObject, XrayVmessServerObject, XrayStreamTlsSettingsObject, XrayStreamRealitySettingsObject, XrayStreamTlsCertificateObject, XrayStreamSettingsObject, XrayRoutingRuleObject, XrayRoutingObject, XrayLogObject, XrayAllocateObject, XraySniffingObject, XrayHeaderObject, XrayHeaderRequestObject, XrayHeaderResponseObject, XrayXmuxObject };
