import { XrayHttpClientObject, XraySocksClientObject, XrayVlessClientObject, XrayVmessClientObject } from './ClientsObjects';
import { ISecurityProtocol, IXrayServer } from './Interfaces';
import XrayOptions, { XrayProtocol, XrayProtocolMode } from './Options';
import { XrayStreamHttpSettingsObject, XrayStreamKcpSettingsObject, XrayStreamTcpSettingsObject, XrayStreamWsSettingsObject, XrayStreamGrpcSettingsObject, XrayStreamHttpUpgradeSettingsObject, XrayStreamSplitHttpSettingsObject } from './TransportObjects';

export class XraySniffingObject {
  static destOverrideOptions = ['http', 'tls', 'quic', 'fakedns'];
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

export class XrayHeaderObject {
  public type = 'none';
  public request?: XrayHeaderRequestObject;
  public response?: XrayHeaderResponseObject;
}

export class XrayHeaderRequestObject {
  public version = '1.1';
  public method = 'GET';
  public path = '/';
  public headers: unknown = {};
}

export class XrayHeaderResponseObject {
  public version = '1.1';
  public status = '200';
  public reason = 'OK';
  public headers: unknown = {};
}

export class XrayXmuxObject {
  public maxConcurrency = 0;
  public maxConnections = 0;
  public cMaxReuseTimes = 0;
  public cMaxLifetimeMs = 0;
}

export class XrayAllocateObject {
  static defaultRefresh = 5;
  static defaultConcurrency = 3;

  public strategy = 'always';
  public refresh? = this.strategy == 'random' ? XrayAllocateObject.defaultRefresh : undefined;
  public concurrency? = this.strategy == 'random' ? XrayAllocateObject.defaultConcurrency : undefined;

  normalize = (): this | undefined => {
    if (this.strategy == 'always') return undefined;
    this.refresh = this.refresh == 0 ? undefined : this.refresh;
    this.concurrency = this.concurrency == 0 ? undefined : this.concurrency;

    return this;
  };
}

export class XrayStreamTlsCertificateObject {
  static usageOptions = XrayOptions.usageOptions;

  public ocspStapling? = 3600;
  public oneTimeLoading? = false;
  public buildChain? = false;
  public usage? = 'encipherment';
  public certificateFile?: string;
  public keyFile?: string;
  public key?: string;
  public certificate?: string;

  public normalize(): this | undefined {
    this.ocspStapling = !this.ocspStapling || this.ocspStapling == 3600 ? undefined : this.ocspStapling;
    this.usage = !this.usage || this.usage == 'encipherment' ? undefined : this.usage;

    if (!this.keyFile && !this.key && !this.certificateFile && !this.certificate) return undefined;
    return this;
  }
}

export class XrayStreamTlsSettingsObject implements ISecurityProtocol {
  static alpnOptions = XrayOptions.alpnOptions;
  static fingerprintOptions = ['', 'randomized', 'random', 'chrome', 'firefox', 'ios', 'android', 'safari', 'edge', '360', 'qq'];
  static tlsVersionsOptions = ['1.0', '1.1', '1.2', '1.3'];

  public serverName?: string;
  public rejectUnknownSni? = false;
  public allowInsecure? = false;
  public disableSystemRoot? = false;
  public enableSessionResumption? = false;
  public alpn? = XrayStreamTlsSettingsObject.alpnOptions;
  public minVersion?: string;
  public maxVersion?: string;
  public certificates?: XrayStreamTlsCertificateObject[] | undefined = [];
  public fingerprint?: string;
  public pinnedPeerCertificateChainSha256?: string;
  public masterKeyLog?: string;

  constructor(parsedObject?: XrayParsedUrlObject | undefined) {
    this.certificates = [];
    this.certificates.push(new XrayStreamTlsCertificateObject());
    if (parsedObject) {
      this.serverName = parsedObject.parsedParams.sni;
    }
  }

  normalize(): this {
    this.rejectUnknownSni = !this.rejectUnknownSni ? undefined : this.rejectUnknownSni;
    this.allowInsecure = !this.allowInsecure ? undefined : this.allowInsecure;
    this.disableSystemRoot = !this.disableSystemRoot ? undefined : this.disableSystemRoot;
    this.enableSessionResumption = !this.enableSessionResumption ? undefined : this.enableSessionResumption;

    this.alpn = this.alpn?.length == 0 || this.alpn == XrayStreamTlsSettingsObject.alpnOptions ? undefined : this.alpn;
    if (this.certificates && this.certificates.length > 0) {
      this.certificates.forEach((cert) => {
        const c = cert.normalize();
        if (!c) {
          if (this.certificates) {
            this.certificates.splice(this.certificates.indexOf(cert), 1);
          }
        }
      });
    }
    if (this.certificates?.length == 0) {
      this.certificates = undefined;
    }
    return this;
  }
}

export class XrayStreamRealitySettingsObject implements ISecurityProtocol {
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
      this.serverName = parsedObject.parsedParams.server;
      this.shortId = parsedObject.parsedParams.sid;
      this.fingerprint = parsedObject.parsedParams.fp;
      this.publicKey = parsedObject.parsedParams.pbk;
      this.spiderX = parsedObject.parsedParams.spx;
      this.serverName = parsedObject.parsedParams.sni;
    }
  }

  public normalize(): this {
    return this;
  }
}

export class XrayLogObject {
  static levelOptions = ['debug', 'info', 'warning', 'error', 'none'];
  public access?: string;
  public error?: string;
  public loglevel? = 'warning';
  public dnsLog? = false;
  public maskAddress? = '';

  normalize(): this {
    this.access = this.access == '' ? undefined : this.access;
    this.error = this.error == '' ? undefined : this.error;
    this.loglevel = this.loglevel == 'none' ? undefined : this.loglevel;
    this.dnsLog = !this.dnsLog ? undefined : this.dnsLog;
    this.maskAddress = this.maskAddress == '' ? undefined : this.maskAddress;

    return this;
  }
}

export class XrayDnsObject {
  static strategyOptions = ['UseIP', 'UseIPv4', 'UseIPv6'];
  public tag? = 'dnsQuery';
  public hosts?: Record<string, string | string[]> | undefined = {};
  public servers: (string | XrayDnsServerObject)[] | undefined = [];
  public clientIp?: string;
  public queryStrategy?: string = 'UseIP';
  public disableCache?: boolean;
  public disableFallback?: boolean;
  public disableFallbackIfMatch?: boolean;

  public normalize(): this {
    this.clientIp = this.clientIp == '' ? undefined : this.clientIp;
    this.queryStrategy = this.queryStrategy == '' || this.queryStrategy == 'UseIP' ? undefined : this.queryStrategy;
    this.disableCache = !this.disableCache ? undefined : this.disableCache;
    this.disableFallback = !this.disableFallback ? undefined : this.disableFallback;
    this.disableFallbackIfMatch = !this.disableFallbackIfMatch ? undefined : this.disableFallbackIfMatch;
    this.servers = this.servers?.length == 0 ? undefined : this.servers;
    this.hosts = !this.hosts || Object.keys(this.hosts).length == 0 ? undefined : this.hosts;

    return this;
  }

  public default = (): this => {
    this.queryStrategy = 'UseIP';
    return this;
  };
}

export class XrayDnsServerObject {
  public address!: string;
  public port?: number;
  public domains?: string[];
  public expectIPs?: string[];
  public skipFallback?: boolean;
  public clientIP?: string;
}
export const XrayReverseItemType = {
  BRIDGE: 'bridge',
  PORTAL: 'portal'
};

export class XrayReverseItem {
  public tag?: string;
  public domain?: string;
}

export class XrayReverseObject {
  public bridges?: XrayReverseItem[] = [];
  public portals?: XrayReverseItem[] = [];

  public normalize(): this | undefined {
    if (this.bridges && this.bridges.length > 0) {
      this.bridges = this.bridges.filter((bridge) => bridge.tag && bridge.domain);
    } else {
      this.bridges = undefined;
    }

    if (this.portals && this.portals.length > 0) {
      this.portals = this.portals.filter((portal) => portal.tag && portal.domain);
    } else {
      this.portals = undefined;
    }
    if (!this.bridges && !this.portals) {
      return undefined;
    }
    return this;
  }
}

export class XrayRoutingObject {
  static domainStrategyOptions = ['AsIs', 'IPIfNonMatch', 'IPOnDemand'];
  static domainMatcherOptions = ['hybrid', 'linear'];
  public domainStrategy? = 'AsIs';
  public domainMatcher? = 'hybrid';
  public rules?: XrayRoutingRuleObject[] = [];
  public disabled_rules?: XrayRoutingRuleObject[] = [];
  public policies?: XrayRoutingPolicy[] = [];

  public normalize(): this {
    this.domainStrategy = this.domainStrategy == 'AsIs' ? undefined : this.domainStrategy;
    this.domainMatcher = this.domainMatcher == 'hybrid' ? undefined : this.domainMatcher;

    if (this.policies) {
      this.policies.forEach((policy) => {
        policy.normalize();
      });
    }

    if (this.disabled_rules && this.disabled_rules.length > 0) {
      this.disabled_rules.forEach((rule) => {
        rule.normalize();
      });
      this.disabled_rules = this.disabled_rules.sort((a, b) => a.idx - b.idx);
    } else {
      this.disabled_rules = undefined;
    }

    if (this.rules && this.rules.length > 0) {
      this.rules.forEach((rule) => {
        rule.normalize();
      });
      this.rules = this.rules.sort((a, b) => a.idx - b.idx);
    } else {
      this.rules = undefined;
    }

    return this;
  }

  public default = (outboundTag: string, unblockItems: string[] | undefined): this => {
    this.rules = [];
    if (!unblockItems || unblockItems.length == 0) {
      const rule = new XrayRoutingRuleObject();
      rule.name = 'myip.com to proxy';
      rule.domain = ['domain:myip.com'];
      rule.outboundTag = outboundTag;

      this.rules.push(rule);
    } else if (unblockItems.length > 0) {
      unblockItems.forEach((item) => {
        const gs = item.toLowerCase();
        const rule = new XrayRoutingRuleObject();
        rule.name = `${item} to ${outboundTag}`;
        rule.outboundTag = outboundTag;

        switch (gs) {
          case 'kinopub':
            rule.ip = [`89.34.0.0/16`, `31.40.0.0/16`, `93.189.57.0/24`, `93.189.61.0/24`, `194.59.142.0/24`];
            break;
          case 'envato':
            rule.domain = [`domain:envato.com`, `domain:envato.net`, `domain:envatoelements.com`, `domain:envatousercontent.com`];
            break;
          case 'facebook':
            rule.domain = [`geosite:${gs}`, `geosite:facebook-dev`];
            break;
          case 'metacritic':
            rule.domain = [`domain:metacritic.com`];
            break;
          case 'wikipedia':
            rule.domain = [`geosite:wikimedia`];
            break;
          default: {
            rule.domain = [`geosite:${gs}`];
            break;
          }
        }

        if (this.rules) {
          this.rules.push(rule);
        }
      });
    }

    return this;
  };
}

export class XrayRoutingPolicy {
  static defaultPorts = ['443', '80', '22'];
  static modes = ['redirect', 'bypass'];
  public name?: string;
  public mac?: string[] = [];
  public tcp? = '';
  public udp? = '';
  public mode?: string = 'redirect';
  public enabled? = true;

  public static vendors: { name: string; tcp: string; udp: string }[] | null = [
    { name: 'Default ports', tcp: '443,80,22', udp: '443,80,22' },
    { name: 'Steam', tcp: '7777:7788,3478:4380,27000:27100', udp: '7777:7788,3478:4380,27000:27100' },
    { name: 'Microsoft Xbox', tcp: '', udp: '3544,4500,500' },
    { name: 'Epic Games Store', tcp: '5060,5062,5222,6250', udp: '5060,5062,5222,6250' },
    { name: 'Sony Playstation', tcp: '983,987,1935,3974,3658,5223,3478:3480,4658,9293:9297', udp: '983,987,1935,3974,3658,5223,3478:3480,4658,9293:9297' }
  ];

  public normalize = (): this | undefined => {
    this.mode = this.mode && XrayRoutingPolicy.modes.includes(this.mode) ? this.mode : undefined;
    this.tcp = this.normalizePorts(this.tcp == '' ? undefined : this.tcp);
    this.udp = this.normalizePorts(this.udp == '' ? undefined : this.udp);
    this.mac = this.mac?.length == 0 ? undefined : this.mac;

    if (!this.tcp && !this.udp && this.mode == 'redirect') {
      return undefined;
    }
    return this;
  };
  public normalizePorts = (ports: string | undefined) => {
    if (!ports) return ports;
    return ports
      .replace(/\n/g, ',')
      .replace(/-/g, ':')
      .replace(/[^0-9,:]/g, '')
      .split(',')
      .filter((x) => x)
      .join(',')
      .trim();
  };

  public default = (): this => {
    this.mode = 'bypass';
    this.name = 'bypass xray except web traffic';
    this.tcp = `443,80,22`;
    this.udp = `443,80,22`;
    return this;
  };
}

export class XrayRoutingRuleObject {
  static connectionCheckRuleName = 'sys:connection-check';
  static networkOptions = ['', 'tcp', 'udp', 'tcp,udp'];
  static protocolOptions = ['http', 'tls', 'bittorrent'];
  public idx = 0;
  public name?: string;
  public enabled? = true;
  public domainMatcher? = 'hybrid';
  public domain?: string[];
  public ip?: string[];
  public port?: string;
  public sourcePort?: string;
  public type = 'field';
  public network?: string;
  public source?: string[];
  public protocol?: string[] = [];
  public inboundTag?: string[] = [];
  public outboundTag?: string;
  public user?: string[] = [];
  public attrs?: unknown;

  public normalize() {
    this.enabled = undefined;
    this.domainMatcher = this.domainMatcher == 'hybrid' ? undefined : this.domainMatcher;
    this.domain = this.domain?.length == 0 ? undefined : this.domain;
    this.ip = this.ip?.length == 0 ? undefined : this.ip;
    this.protocol = this.protocol?.length == 0 ? undefined : this.protocol;
    this.source = this.source?.length == 0 ? undefined : this.source;
    this.inboundTag = this.inboundTag?.length == 0 ? undefined : this.inboundTag;
    this.user = this.user?.length == 0 ? undefined : this.user;

    this.port = this.port == '' ? undefined : this.port;
    this.sourcePort = this.sourcePort == '' ? undefined : this.sourcePort;
    this.outboundTag = this.outboundTag == '' ? undefined : this.outboundTag;
    this.network = this.network == '' ? undefined : this.network;
  }

  public isSystem = (): boolean => {
    return this.name?.startsWith('sys:') ?? false;
  };
}

export class XrayStreamSettingsObject {
  public network? = 'tcp';
  public security? = 'none';
  public tlsSettings?: XrayStreamTlsSettingsObject;
  public realitySettings?: XrayStreamRealitySettingsObject;
  public tcpSettings?: XrayStreamTcpSettingsObject;
  public kcpSettings?: XrayStreamKcpSettingsObject;
  public wsSettings?: XrayStreamWsSettingsObject;
  public xhttpSettings?: XrayStreamHttpSettingsObject;
  public grpcSettings?: XrayStreamGrpcSettingsObject;
  public httpupgradeSettings?: XrayStreamHttpUpgradeSettingsObject;
  public splithttpSettings?: XrayStreamSplitHttpSettingsObject;

  public sockopt?: XraySockoptObject;

  public normalize(): this | undefined {
    this.network = this.network == '' || this.network == 'tcp' ? undefined : this.network;
    this.security = this.security == '' || this.security == 'none' ? undefined : this.security;

    this.normalizeAllSettings();
    this.sockopt = this.sockopt?.normalize();

    if (JSON.stringify(this) === JSON.stringify({})) return undefined;
    return this;
  }
  normalizeAllSettings(): void {
    Object.keys(this)
      .filter((key) => key.endsWith('Settings'))
      .forEach((key) => {
        const setting = this[key as keyof XrayStreamSettingsObject] as { normalize?: () => void } | undefined;
        setting?.normalize?.();
      });
  }
}

export class XrayServerObject<IClient> implements IXrayServer<IClient> {
  public address!: string;
  public port!: number;
  public users?: IClient[] | undefined = [];
}

export class XrayTrojanServerObject extends XrayServerObject<XrayHttpClientObject> {
  public email?: string;
  public password!: string;
  public level? = 0;
  constructor() {
    super();
    delete this.users;
  }
}

export class XrayHttpServerObject extends XrayServerObject<XrayHttpClientObject> {}
export class XraySocksServerObject extends XrayServerObject<XraySocksClientObject> {}
export class XrayVlessServerObject extends XrayServerObject<XrayVlessClientObject> {}
export class XrayVmessServerObject extends XrayServerObject<XrayVmessClientObject> {}
export class XrayShadowsocksServerObject extends XrayServerObject<XrayVmessClientObject> {
  public email?: string;
  public method = '2022-blake3-aes-256-gcm';
  public password!: string;
  public uot?: boolean;
  public level? = 0;
  constructor() {
    super();
    delete this.users;
  }
}

export class XrayProtocolOption {
  public protocol!: string;
  public modes!: XrayProtocolMode;
}

export class XrayNoiseObject {
  static typeOptions = ['rand', 'str', 'base64'];
  public type = 'rand';
  public packet!: string;
  public delay: string | number = 0;
}

export class XrayPeerObject {
  public endpoint!: string;
  public publicKey!: string;
  public preSharedKey?: string;
  public allowedIPs?: string[];
  public keepAlive?: number;
}

export class XraySockoptObject {
  static tproxyOptions = ['off', 'redirect', 'tproxy'];
  static domainStrategyOptions = ['AsIs', 'UseIP', 'UseIPv4', 'UseIPv6'];

  public mark?: number;
  public tcpFastOpen?: boolean;
  public tproxy?: string;
  public domainStrategy?: string = 'AsIs';
  public dialerProxy?: string;
  public acceptProxyProtocol?: boolean;
  public tcpKeepAliveInterval?: number;
  public tcpcongestion?: string;
  public interface?: string;
  public tcpMptcp?: boolean;
  public tcpNoDelay?: boolean;

  normalize = (): this | undefined => {
    if (this.tproxy == 'off') return undefined;

    this.mark = !this.mark && this.mark == 0 ? undefined : this.mark;
    this.interface = this.interface == '' ? undefined : this.interface;
    this.tproxy = this.tproxy == 'off' || this.tproxy == '' ? undefined : this.tproxy;
    this.tcpMptcp = !this.tcpMptcp ? undefined : this.tcpMptcp;
    this.tcpNoDelay = !this.tcpNoDelay ? undefined : this.tcpNoDelay;
    this.domainStrategy = this.domainStrategy == 'AsIs' ? undefined : this.domainStrategy;
    return this;
  };
}

export interface ParseJsonObject {
  add: string;
  id: string;
  ps: string;
  net: string;
  tls: string;
  port: string;
  [key: string]: string;
}

export class XrayParsedUrlObject {
  public server!: string;
  public port!: number;
  public protocol!: string;
  public tag!: string;
  public uuid!: string;
  public network?: string;
  public security?: string;
  public parsedParams: Record<string, string | undefined> = {};

  public constructor(url: string) {
    const [protocol, rest] = url.split('://');
    this.protocol = protocol;
    const extraParams = {} as Record<string, string>;

    if (protocol === XrayProtocol.VMESS) {
      const vmessJson = JSON.parse(atob(rest)) as ParseJsonObject;
      this.server = vmessJson.add;
      this.port = parseInt(vmessJson.port);
      this.uuid = vmessJson.id;
      this.tag = vmessJson.ps;
      this.network = vmessJson.net;
      this.security = vmessJson.tls;
      this.parsedParams = vmessJson;
      return;
    } else if (protocol === 'ss') {
      const [authHost] = rest.split('?');
      const [uuid] = authHost.split('@');
      const ssDecoded = atob(uuid);
      const [method, pass] = ssDecoded.split(':');
      extraParams.method = method;
      extraParams.pass = pass;
    }

    const [authHost, queryFragment] = rest.split('?');
    const [uuid, serverPort] = authHost.split('@');
    const [server, port] = serverPort.split(':');
    const [query, tag] = queryFragment.split('#');

    const params = new URLSearchParams(query);
    params.forEach((value: string, key: string) => {
      // eslint-disable-next-line
      this.parsedParams[key] = value;
    });

    Object.keys(extraParams).forEach((key) => {
      // eslint-disable-next-line
      this.parsedParams[key] = extraParams[key];
    });

    this.tag = tag;
    this.server = server;
    this.port = parseInt(port);
    this.uuid = uuid;
    this.network = this.parsedParams.type;
    this.security = this.parsedParams.security;
  }
}

export { XrayProtocol };
