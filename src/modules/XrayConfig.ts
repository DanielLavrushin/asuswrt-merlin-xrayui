import { reactive } from "vue";

class XrayOptions {
  static transportOptions: string[] = ["tcp", "kcp", "ws", "http", "grpc", "httpupgrade", "splithttp"];
  static securityOptions: string[] = ["none", "tls", "reality"];
  static logOptions: string[] = ["debug", "info", "warning", "error", "none"];
  static networkOptions: string[] = ["tcp", "udp", "tcp,udp"];
  static protocolOptions: string[] = ["http", "tls", "bittorrent"];
  static domainStrategyOptions: string[] = ["AsIs", "IPIfNonMatch", "IPOnDemand"];
  static domainMatcherOptions: string[] = ["hybrid", "linear"];
  static usageOptions: string[] = ["encipherment", "verify", "issue"];
  static alpnOptions: string[] = ["h2", "http/1.1"];
  static fingerprintOptions: string[] = ["randomized", "random", "chrome", "firefox", "ios", "android", "safari", "edge", "360", "qq"];
  static tlsVersionsOptions: string[] = ["1.0", "1.1", "1.2", "1.3"];
}

enum XrayProtocol {
  VLESS = "vless",
  VMESS = "vmess",
  SHADOWSOCKS = "shadowsocks",
  TROJAN = "trojan",
  WIREGUARD = "wireguard",
  SOCKS = "socks",
  HTTP = "http",
  DNS = "dns",
  DOKODEMODOOR = "dokodemo-door",
  FREEDOM = "freedom",
  BLACKHOLE = "blackhole",
  LOOPBACK = "loopback",
}

enum XrayProtocolMode {
  Inbound = 1 << 0,
  Outbound = 1 << 1,
  ServerMode = 1 << 2,
  ClientMode = 1 << 3,
  TwoWays = Inbound | Outbound,
  BothModes = ServerMode | ClientMode,
  All = TwoWays | BothModes,
}

interface IProtocolType {}
interface ITransportNetwork {}

class XrayOutboundObject<IProtocolType> {
  public protocol!: XrayProtocol;
  public sendThrough: string = "0.0.0.0";
  public tag?: string;
  public settings!: IProtocolType;
  public streamSettings?: XrayStreamSettingsObject;

  constructor(protocol: XrayProtocol | undefined = undefined, settings: IProtocolType | undefined = undefined) {
    if (protocol && settings) {
      this.settings = settings;
      this.protocol = protocol;
      this.tag = "obd-" + this.protocol;
    }
  }
}

class XrayInboundObject<IProtocolType> {
  public protocol!: XrayProtocol;
  public listen: string = "127.0.0.1";
  public port!: number | string;
  public tag?: string;
  public settings!: IProtocolType;
  public streamSettings?: XrayStreamSettingsObject;
  public allocate?: XrayAllocateObject;
  public sniffing?: XraySniffingObject;

  constructor(protocol: XrayProtocol | undefined = undefined, settings: IProtocolType | undefined = undefined) {
    if (protocol && settings) {
      this.settings = settings;
      this.protocol = protocol;
      this.tag = "ibd-" + this.protocol;
    }
  }
}

class XrayDokodemoDoorInboundObject implements IProtocolType {
  public address!: string;
  public port?: number;
  public network: string = "tcp";
  public followRedirect: boolean = false;
  public userLevel: number = 0;
}

class XrayVmessInboundObject implements IProtocolType {
  public clients: XrayInboundClientObject[] = [];
}

class XrayBlackholeOutboundObject implements IProtocolType {}

class XrayFreedomOutboundObject implements IProtocolType {}

class XrayInboundClientObject {
  public id: string | undefined;
  public email: string | undefined;
  public level: number | undefined;
}

class XrayProtocolOption {
  public protocol!: XrayProtocol;
  public modes!: XrayProtocolMode;
}

const xrayProtocols: XrayProtocolOption[] = [
  {
    protocol: XrayProtocol.DOKODEMODOOR,
    modes: XrayProtocolMode.Inbound | XrayProtocolMode.BothModes,
  },
  {
    protocol: XrayProtocol.HTTP,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.BothModes,
  },
  {
    protocol: XrayProtocol.SHADOWSOCKS,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.BothModes,
  },
  {
    protocol: XrayProtocol.SOCKS,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.BothModes,
  },
  {
    protocol: XrayProtocol.TROJAN,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.ServerMode,
  },
  {
    protocol: XrayProtocol.VLESS,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.ServerMode,
  },
  {
    protocol: XrayProtocol.VMESS,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.ServerMode,
  },
  {
    protocol: XrayProtocol.WIREGUARD,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.ServerMode,
  },
  {
    protocol: XrayProtocol.FREEDOM,
    modes: XrayProtocolMode.Outbound | XrayProtocolMode.BothModes,
  },
  {
    protocol: XrayProtocol.BLACKHOLE,
    modes: XrayProtocolMode.Outbound | XrayProtocolMode.BothModes,
  },
  {
    protocol: XrayProtocol.LOOPBACK,
    modes: XrayProtocolMode.Outbound | XrayProtocolMode.BothModes,
  },
  {
    protocol: XrayProtocol.DNS,
    modes: XrayProtocolMode.Outbound | XrayProtocolMode.BothModes,
  },
];

export { XrayBlackholeOutboundObject, XrayFreedomOutboundObject };
export { ITransportNetwork, XrayProtocol, XrayProtocolMode, IProtocolType, XrayProtocolOption, XrayVmessInboundObject, XrayDokodemoDoorInboundObject, xrayProtocols };

class XrayObject {
  public log?: XrayLogObject;
  public inbounds: XrayInboundObject<IProtocolType>[] = [];
  public outbounds: XrayOutboundObject<IProtocolType>[] = [];
  public routing?: XrayRoutingObject;

  constructor() {}
}

class XrayClientObject {
  public log?: XrayLogObject;
  public inbounds: XrayClientInboundObject[] = [];
  public outbounds: XrayClientOutboundObject[] = [];
  public rooting?: XrayRoutingObject;

  constructor() {
    if (this.outbounds.length === 0) {
      this.outbounds.push(new XrayClientOutboundObject("vless", "proxy"));
      this.outbounds[0].settings = new XrayClientSettingsObject();
      this.outbounds.push(new XrayClientOutboundObject("freedom", "direct"));
      this.outbounds.push(new XrayClientOutboundObject("blackhole", "block"));
    }
  }
}
class XrayClientInboundObject {
  public sniffing?: XraySniffingObject;
}
class XrayClientOutboundObject {
  public protocol: string = "vless";
  public tag: string = "proxy";
  public settings?: XrayClientSettingsObject;
  public streamSettings?: XrayStreamSettingsObject;

  constructor(protocol: string | undefined = undefined, tag: string | undefined = undefined) {
    this.protocol = protocol ? protocol : "vless";
    this.tag = tag ? tag : "proxy";
  }
}

class XrayClientSettingsObject {
  public nonIPQuery?: string;
  public vnext: XrayClientVnextObject[] = [];
  constructor() {
    if (this.vnext.length === 0) {
      this.vnext.push(new XrayClientVnextObject());
    }
  }
}

class XrayClientVnextObject {
  public address: string = "";
  public port: number = 0;
  public users: XrayClientUserObject[] = [];
  constructor() {
    if (this.users.length === 0) {
      this.users.push(new XrayClientUserObject());
    }
  }
}

class XrayClientUserObject {
  public id: string = "";
  public flow: string = "xtls-rprx-vision";
  public encryption: string = "none";
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
  public inboundTag?: string;
  public outboundTag?: string;
  public user: string[] = [];
  public attrs?: any;
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
class XrayStreamTcpSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol: boolean = false;
}
class XrayStreamKcpSettingsObject implements ITransportNetwork {}
class XrayStreamWsSettingsObject implements ITransportNetwork {}
class XrayStreamHttpSettingsObject implements ITransportNetwork {}
class XrayStreamGrpcSettingsObject implements ITransportNetwork {}
class XrayStreamHttpUpgradeSettingsObject implements ITransportNetwork {}
class XrayStreamSplitHttpSettingsObject implements ITransportNetwork {}

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

class XrayInboundSettingsObject {
  public network: string | undefined;
  public security: string | undefined;
  public clients: XrayInboundClientObject[] = [];

  constructor() {}
}

let xrayConfig = reactive(new XrayObject());
let xrayClientConfig = reactive(new XrayClientObject());
export default xrayConfig;
export { XrayStreamTcpSettingsObject, XrayStreamKcpSettingsObject };
export { xrayConfig, xrayClientConfig, XrayOptions, XrayClientObject, XrayClientOutboundObject, XrayObject, XrayRoutingObject, XrayRoutingRuleObject, XrayInboundObject, XrayInboundSettingsObject, XrayInboundClientObject, XrayOutboundObject, XrayAllocateObject, XraySniffingObject, XrayStreamSettingsObject, XrayStreamTlsSettingsObject, XrayStreamRealitySettingsObject, XrayStreamTlsCertificateObject };
