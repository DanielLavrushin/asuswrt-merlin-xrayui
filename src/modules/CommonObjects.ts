import { XrayHttpClientObject, XraySocksClientObject, XrayVlessClientObject, XrayVmessClientObject } from "./ClientsObjects";
import { IXrayServer } from "./Interfaces";
import { XrayOptions, XrayProtocol, XrayProtocolMode } from "./Options";
import { XrayStreamHttpSettingsObject, XrayStreamKcpSettingsObject, XrayStreamTcpSettingsObject, XrayStreamWsSettingsObject, XrayStreamGrpcSettingsObject, XrayStreamHttpUpgradeSettingsObject, XrayStreamSplitHttpSettingsObject } from "./TransportObjects";

class XraySniffingObject {
  static destOverrideOptions = ["http", "tls", "quic", "fakedns"];
  public enabled? = false;
  public metadataOnly? = false;
  public routeOnly? = false;
  public destOverride?: string[] = [];
  public domainsExcluded?: string[] = [];

  normalize() {
    this.destOverride = !this.destOverride || this.destOverride.length == 0 ? undefined : this.destOverride;
    this.domainsExcluded = !this.domainsExcluded || this.domainsExcluded.length == 0 ? undefined : this.domainsExcluded;
    this.enabled = !this.enabled ? undefined : this.enabled;
    this.metadataOnly = !this.metadataOnly ? undefined : this.metadataOnly;
    this.routeOnly = !this.routeOnly ? undefined : this.routeOnly;
  }
}

class XrayHeaderObject {
  public type = "none";
  public request?: XrayHeaderRequestObject;
  public response?: XrayHeaderResponseObject;
}

class XrayHeaderRequestObject {
  public version = "1.1";
  public method = "GET";
  public path = "/";
  public headers: any = {};
}

class XrayHeaderResponseObject {
  public version = "1.1";
  public status = "200";
  public reason = "OK";
  public headers: any = {};
}

class XrayXmuxObject {
  public maxConcurrency = 0;
  public maxConnections = 0;
  public cMaxReuseTimes = 0;
  public cMaxLifetimeMs = 0;
}

class XrayAllocateObject {
  static defaultRefresh = 5;
  static defaultConcurrency = 3;

  public strategy = "always";
  public refresh? = this.strategy == "random" ? XrayAllocateObject.defaultRefresh : undefined;
  public concurrency? = this.strategy == "random" ? XrayAllocateObject.defaultConcurrency : undefined;

  normalize = (): this | undefined => {
    if (this.strategy == "always") return undefined;
    this.refresh = this.refresh == 0 ? undefined : this.refresh;
    this.concurrency = this.concurrency == 0 ? undefined : this.concurrency;

    return this;
  };
}

class XrayStreamTlsCertificateObject {
  static usageOptions = ["encipherment", "verify", "issue"];

  public ocspStapling = 3600;
  public oneTimeLoading = false;
  public buildChain = false;
  public usage = "encipherment";
  public certificateFile?: string;
  public keyFile?: string;
  public key?: string;
  public certificate?: string;
}

class XrayStreamTlsSettingsObject {
  static alpnOptions = ["h2", "http/1.1"];
  static fingerprintOptions = ["", "randomized", "random", "chrome", "firefox", "ios", "android", "safari", "edge", "360", "qq"];
  static tlsVersionsOptions = ["1.0", "1.1", "1.2", "1.3"];

  public serverName?: string;
  public rejectUnknownSni = false;
  public allowInsecure = false;
  public disableSystemRoot = false;
  public enableSessionResumption = false;
  public alpn? = XrayStreamTlsSettingsObject.alpnOptions;
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
  public show = false;
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
      this.serverName = parsedObject.parsedParams?.server;
      this.shortId = parsedObject.parsedParams?.sid;
      this.fingerprint = parsedObject.parsedParams?.fp;
      this.publicKey = parsedObject.parsedParams?.pbk;
      this.spiderX = parsedObject.parsedParams?.spx;
      this.serverName = parsedObject.parsedParams?.sni;
    }
  }
}

class XrayLogObject {
  static levelOptions = ["debug", "info", "warning", "error", "none"];
  public access = "";
  public error = "";
  public loglevel = "warning";
  public dnsLog = false;
  public maskAddress = "";
}

class XrayDnsObject {
  static strategyOptions = ["UseIP", "UseIPv4", "UseIPv6"];
  public tag? = "dnsQuery";
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
  static domainStrategyOptions = ["AsIs", "IPIfNonMatch", "IPOnDemand"];
  static domainMatcherOptions = ["hybrid", "linear"];
  public domainStrategy? = "AsIs";
  public domainMatcher? = "hybrid";
  public rules?: XrayRoutingRuleObject[] = [];
  public portsPolicy?: XrayPortsPolicy = new XrayPortsPolicy();

  public normalize() {
    this.domainStrategy = this.domainStrategy == "AsIs" ? undefined : this.domainStrategy;
    this.domainMatcher = this.domainMatcher == "hybrid" ? undefined : this.domainMatcher;

    if (this.portsPolicy) {
      this.portsPolicy = this.portsPolicy.normalize();
    }
    if (this.rules && this.rules.length > 0) {
      this.rules.forEach((rule) => {
        rule.normalize();
      });
    } else {
      this.rules = undefined;
    }
  }
}

class XrayPortsPolicy {
  static defaultPorts = ["443", "80", "22"];
  static modes = ["redirect", "bypass"];
  public mode? = "redirect";
  public udp? = "";
  public tcp? = "";

  public static vendors: { name: string; tcp: string; udp: string }[] | null = [
    { name: "Default ports", tcp: "443,80,22", udp: "443,80,22" },
    { name: "Steam", tcp: "7777:7788,3478:4380,27000:27100", udp: "7777:7788,3478:4380,27000:27100" },
    { name: "Microsoft Xbox", tcp: "", udp: "3544,4500,500" },
    { name: "Epic Games Store", tcp: "5060,5062,5222,6250", udp: "5060,5062,5222,6250" },
    { name: "Sony Playstation", tcp: "983,987,1935,3974,3658,5223,3478:3480,4658,9293:9297", udp: "983,987,1935,3974,3658,5223,3478:3480,4658,9293:9297" }
  ];

  public normalize = (): this | undefined => {
    this.mode = this.mode && XrayPortsPolicy.modes.includes(this.mode) ? this.mode : undefined;
    this.tcp = this.normalizePorts(this.tcp == "" ? undefined : this.tcp);
    this.udp = this.normalizePorts(this.udp == "" ? undefined : this.udp);

    if (!this.tcp && !this.udp && this.mode == "redirect") {
      return undefined;
    }
    return this;
  };
  public normalizePorts = (ports: string | undefined) => {
    if (!ports) return ports;
    return ports
      .replace(/\n/g, ",")
      .replace(/-/g, ":")
      .replace(/[^0-9,:]/g, "")
      .split(",")
      .filter((x) => x)
      .join(",")
      .trim();
  };
}
class XrayRoutingRuleObject {
  static networkOptions = ["", "tcp", "udp", "tcp,udp"];
  static protocolOptions = ["http", "tls", "bittorrent"];
  public name?: string;
  public domainMatcher? = "hybrid";
  public domain?: string[];
  public ip?: string[];
  public port?: string;
  public sourcePort?: string;
  public type = "field";
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
  public network? = "tcp";
  public security? = "none";
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
      if (this[prop as keyof XrayStreamSettingsObject] && this.network && !prop.startsWith(this.network)) {
        delete this[prop as keyof XrayStreamSettingsObject];
      }
    });
  }

  public normalizeSecurity() {
    const securityOptions = XrayOptions.securityOptions.map((opt) => `${opt}Settings`);
    securityOptions.forEach((prop) => {
      if (this[prop as keyof XrayStreamSettingsObject] && this.security && !prop.startsWith(this.security)) {
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
  public level? = 0;
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
  public method = "2022-blake3-aes-256-gcm";
  public password!: string;
  public uot?: boolean;
  public level? = 0;
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
  static typeOptions = ["rand", "str", "base64"];
  public type = "rand";
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
  static tproxyOptions = ["off", "redirect", "tproxy"];
  static domainStrategyOptions = ["AsIs", "UseIP", "UseIPv4", "UseIPv6"];

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
    this.network = this.parsedParams?.type;
    this.security = this.parsedParams?.security;
  }
}

export { XrayPortsPolicy, XrayParsedUrlObject, XraySockoptObject, XrayDnsObject, XrayDnsServerObject, XrayTrojanServerObject, XrayPeerObject, XrayNoiseObject, XrayShadowsocksServerObject, XrayHttpServerObject, XraySocksServerObject, XrayProtocolOption, XrayProtocol, XrayVlessServerObject, XrayVmessServerObject, XrayStreamTlsSettingsObject, XrayStreamRealitySettingsObject, XrayStreamTlsCertificateObject, XrayStreamSettingsObject, XrayRoutingRuleObject, XrayRoutingObject, XrayLogObject, XrayAllocateObject, XraySniffingObject, XrayHeaderObject, XrayHeaderRequestObject, XrayHeaderResponseObject, XrayXmuxObject };
