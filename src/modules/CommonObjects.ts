import { XrayHttpClientObject, XraySocksClientObject, XrayVlessClientObject, XrayVmessClientObject } from './ClientsObjects';
import { ISecurityProtocol, IXrayServer } from './Interfaces';
import XrayOptions, { XrayProtocol, XrayProtocolMode } from './Options';
import {
  XrayStreamHttpSettingsObject,
  XrayStreamKcpSettingsObject,
  XrayStreamTcpSettingsObject,
  XrayStreamWsSettingsObject,
  XrayStreamGrpcSettingsObject,
  XrayStreamHttpUpgradeSettingsObject,
  XrayStreamSplitHttpSettingsObject,
  XrayStreamHysteriaSettingsObject,
  XrayFinalMaskObject
} from './TransportObjects';

export const isObjectEmpty = (obj: any): boolean => {
  if (obj == null) return true;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'function' || val === undefined) continue;
    if (typeof val === 'object' && isObjectEmpty(val)) continue;
    return false;
  }
  return true;
};

export class XraySniffingObject {
  static readonly destOverrideOptions = ['http', 'tls', 'quic', 'fakedns'];
  public enabled? = false;
  public metadataOnly? = false;
  public routeOnly? = false;
  public destOverride?: string[] = [];
  public domainsExcluded?: string[] = [];

  normalize(): this | undefined {
    this.destOverride = !this.destOverride || this.destOverride.length == 0 ? undefined : this.destOverride;
    this.domainsExcluded = !this.domainsExcluded || this.domainsExcluded.length == 0 ? undefined : this.domainsExcluded;
    this.enabled = !this.enabled ? undefined : this.enabled;
    this.metadataOnly = !this.metadataOnly ? undefined : this.metadataOnly;
    this.routeOnly = !this.routeOnly ? undefined : this.routeOnly;
    return this.enabled ? this : undefined;
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
  maxConcurrency? = '16-32';
  maxConnections? = 0;
  cMaxReuseTimes? = 0;
  hMaxRequestTimes? = '600-900';
  hMaxReusableSecs? = '1800-3000';
  hKeepAlivePeriod? = 0;

  normalize = (): this | undefined => {
    const defModel = new XrayXmuxObject();
    this.maxConcurrency = this.maxConcurrency === defModel.maxConcurrency ? undefined : this.maxConcurrency;
    this.maxConnections = this.maxConnections === 0 ? undefined : this.maxConnections;
    this.cMaxReuseTimes = this.cMaxReuseTimes === 0 ? undefined : this.cMaxReuseTimes;
    this.hMaxRequestTimes = this.hMaxRequestTimes === defModel.hMaxRequestTimes ? undefined : this.hMaxRequestTimes;
    this.hMaxReusableSecs = this.hMaxReusableSecs === defModel.hMaxReusableSecs ? undefined : this.hMaxReusableSecs;
    this.hKeepAlivePeriod = this.hKeepAlivePeriod === 0 ? undefined : this.hKeepAlivePeriod;

    return isObjectEmpty(this) ? undefined : this;
  };
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
  static readonly fingerprintOptions = ['', 'randomized', 'random', 'chrome', 'firefox', 'ios', 'android', 'safari', 'edge', '360', 'qq'];
  static readonly tlsVersionsOptions = ['1.0', '1.1', '1.2', '1.3'];

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
  public pinnedPeerCertificateSha256?: string[];
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
  public show? = false;
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
    this.show = !this.show ? undefined : this.show;
    this.dest = !this.dest || this.dest === '' ? undefined : this.dest;
    this.privateKey = !this.privateKey || this.privateKey === '' ? undefined : this.privateKey;
    this.serverName = !this.serverName || this.serverName === '' ? undefined : this.serverName;
    this.serverNames = !this.serverNames || this.serverNames.length === 0 ? undefined : this.serverNames;
    this.xver = !this.xver || this.xver < 0 ? undefined : this.xver;
    this.minClientVer = !this.minClientVer || this.minClientVer < 0 ? undefined : this.minClientVer;
    this.maxClientVer = !this.maxClientVer || this.maxClientVer < 0 ? undefined : this.maxClientVer;
    this.maxTimeDiff = !this.maxTimeDiff || this.maxTimeDiff < 0 ? undefined : this.maxTimeDiff;
    this.shortIds = !this.shortIds || this.shortIds.length === 0 ? undefined : this.shortIds;
    this.fingerprint = !this.fingerprint || this.fingerprint === '' ? undefined : this.fingerprint;
    this.publicKey = !this.publicKey || this.publicKey === '' ? undefined : this.publicKey;
    return this;
  }
}

export class XrayLogObject {
  static readonly levelOptions = ['debug', 'info', 'warning', 'error', 'none'];
  public access?: string = 'none';
  public error?: string = 'none';
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
  static readonly strategyOptions = ['UseIP', 'UseIPv4', 'UseIPv6'];
  public tag? = 'dnsQuery';
  public hosts?: Record<string, string | string[]> | undefined = {};
  public servers: (string | XrayDnsServerObject)[] | undefined = [];
  public clientIp?: string;
  public queryStrategy?: string = 'UseIP';
  public disableCache?: boolean;
  public disableFallback?: boolean;
  public disableFallbackIfMatch?: boolean;

  public normalize(): this | undefined {
    this.clientIp = this.clientIp == '' ? undefined : this.clientIp;
    this.queryStrategy = this.queryStrategy == '' || this.queryStrategy == 'UseIP' ? undefined : this.queryStrategy;
    this.disableCache = !this.disableCache ? undefined : this.disableCache;
    this.disableFallback = !this.disableFallback ? undefined : this.disableFallback;
    this.disableFallbackIfMatch = !this.disableFallbackIfMatch ? undefined : this.disableFallbackIfMatch;
    this.hosts = !this.hosts || Object.keys(this.hosts).length == 0 ? undefined : this.hosts;

    if (this.servers && this.servers.length > 0) {
      this.servers.forEach((server) => {
        if (server instanceof XrayDnsServerObject) {
          server.normalize?.();
        }
      });
    }

    this.servers = !this.servers || this.servers.length == 0 ? undefined : this.servers;

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
  public rules?: XrayRoutingRuleObject[] | number[] = [];
  public domains?: string[] = [];
  public expectIPs?: string[] = [];
  public skipFallback?: boolean;
  public clientIP?: string;

  public normalize?(): this | undefined {
    this.domains = this.domains?.length == 0 ? undefined : this.domains;
    this.expectIPs = this.expectIPs?.length == 0 ? undefined : this.expectIPs;
    this.clientIP = this.clientIP == '' ? undefined : this.clientIP;

    if (this.rules && this.rules.length > 0) {
      const ruleIdxs: number[] = [];
      this.rules.forEach((rule) => {
        if (rule instanceof XrayRoutingRuleObject) {
          ruleIdxs.push(rule.idx);
        }
      });
      this.rules = ruleIdxs;
    } else {
      this.rules = undefined;
    }

    this.rules = this.rules?.length == 0 ? undefined : this.rules;

    return this;
  }
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
  static readonly domainStrategyOptions = ['AsIs', 'IPIfNonMatch', 'IPOnDemand'];
  static readonly domainMatcherOptions = ['hybrid', 'linear'];
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

    if (Array.isArray(this.rules) && this.rules.length) {
      this.rules = this.rules
        .map((r) => {
          r.normalize();
          return r;
        })
        .filter((r) => {
          if (!r.isSystem()) return true;
          const d = r.domain ?? [];
          return !(d.length === 0 || d.every((s) => s.trim() === ''));
        })
        .sort((a, b) => a.idx - b.idx);

      if (!this.rules.length) this.rules = undefined;
    } else {
      this.rules = undefined;
    }

    return this;
  }

  public create_rule = (name: string, outboundTag: string, network = 'tcp,udp', domains: string[] = [], ips: string[] = [], ports = ''): XrayRoutingRuleObject => {
    const rule = new XrayRoutingRuleObject();
    rule.name = name;
    rule.outboundTag = outboundTag;
    rule.domainMatcher = this.domainMatcher;
    rule.domain = domains;
    rule.ip = ips;
    rule.type = 'field';
    rule.port = ports;
    rule.network = network;
    rule.enabled = true;
    rule.normalize();
    return rule;
  };

  public default = (outboundTag: string, unblockItems?: string[] | undefined): this => {
    this.rules = [];

    if (!unblockItems || unblockItems.length == 0) {
      const rule = this.create_rule('myip.com to proxy', outboundTag, 'tcp,udp', ['domain:myip.com']);
      this.rules.push(rule);
    } else if (unblockItems.length > 0) {
      unblockItems.forEach((item) => {
        const gs = item.toLowerCase();
        if (this.rules) {
          switch (gs) {
            case 'discord':
              this.rules.push(this.create_rule(`${gs} to ${outboundTag}`, outboundTag, 'tcp,udp', ['geosite:discord']));
              this.rules.push(this.create_rule(`${gs} ip to ${outboundTag}`, outboundTag, 'udp', [], [], '50000-50100,6463-6472'));
              break;
            case 'kinopub':
              this.rules.push(
                this.create_rule(`${item} to ${outboundTag}`, outboundTag, 'tcp,udp', [
                  `kino.pub`,
                  `kinopub.online`,
                  `gfw.ovh`,
                  `vjs.zencdn.net`,
                  `m.pushbr.com`,
                  `mos-gorsud.co`,
                  `zamerka.com`,
                  `"regexp:(\\w+)-static-[0-9]+\\.cdntogo\\.net$"`
                ])
              );
              break;
            case 'envato':
              this.rules.push(
                this.create_rule(`${gs} to ${outboundTag}`, outboundTag, 'tcp,udp', [
                  `domain:envato.com`,
                  `domain:envato.net`,
                  `domain:envatoelements.com`,
                  `domain:envatousercontent.com`
                ])
              );
              break;
            case 'facebook':
              this.rules.push(this.create_rule(`${gs} to ${outboundTag}`, outboundTag, 'tcp,udp', [`geosite:${gs}`, `geosite:facebook-dev`]));
              break;
            case 'metacritic':
              this.rules.push(this.create_rule(`${gs} to ${outboundTag}`, outboundTag, 'tcp,udp', [`domain:metacritic.com`]));
              break;
            case 'wikipedia':
              this.rules.push(this.create_rule(`${gs} to ${outboundTag}`, outboundTag, 'tcp,udp', [`geosite:wikimedia`]));
              break;
            case 'google':
              this.rules.push(
                this.create_rule(`${gs} to ${outboundTag}`, outboundTag, 'tcp,udp', [
                  `geosite:google`,
                  `geosite:google-play`,
                  `geosite:google-registry`,
                  `geosite:google-ads`,
                  `geosite:google-trust-services`,
                  `geosite:google-scholar`
                ])
              );
              break;
            default: {
              this.rules.push(this.create_rule(`${gs} to ${outboundTag}`, outboundTag, 'tcp,udp', [`geosite:${gs}`]));
              break;
            }
          }
        }
      });
    }

    return this;
  };

  public basicBypass = (outboundTag: string): this => {
    this.rules = [];

    const domainRule = this.create_rule('Common services (domains)', outboundTag, 'tcp,udp', [
      'geosite:google',
      'geosite:meta',
      'geosite:telegram',
      'geosite:x',
      'geosite:discord',
      'geosite:rutracker',
      'geosite:tiktok',
      'geosite:netflix',
      'geosite:github',
      'geosite:cloudflare',
      'geosite:category-media-ru',
      'geosite:kinopub',
      'geosite:akamai',
      'domain:themoviedb.org',
      'domain:ntc.party'
    ]);
    this.rules.push(domainRule);

    const ipRule = this.create_rule('Common services (IPs)', outboundTag, 'tcp,udp', [], ['geoip:telegram', 'geoip:cloudflare', '130.255.77.28']);
    this.rules.push(ipRule);

    const discordPortsRule = this.create_rule('Discord voice/video', outboundTag, 'udp', [], [], '50000-51000,1400,3478-3481,5349,19294-19344');
    this.rules.push(discordPortsRule);

    return this;
  };
}

export class XrayRoutingPolicy {
  static readonly defaultPorts = ['443', '80', '22'];
  static readonly modes = ['redirect', 'bypass'];
  public name?: string;
  public mac?: string[] = [];
  public tcp? = '';
  public udp? = '';
  public mode?: string = 'redirect';
  public enabled? = true;

  public static readonly vendors: { name: string; tcp: string; udp: string }[] | null = [
    { name: 'Default ports', tcp: '443,80,22', udp: '443,22' },
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
    this.udp = `443,22`;
    return this;
  };
}

export class XrayRoutingRuleObject {
  static readonly sysMetricsRuleName = 'sys:metrics';
  static readonly networkOptions = ['', 'tcp', 'udp', 'tcp,udp'];
  static readonly protocolOptions = ['http', 'tls', 'bittorrent'];
  public idx = 0;
  public name?: string;
  public enabled? = true;
  public filtered? = false;
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
    this.filtered = undefined; // This property is used for filtering in the UI, not for backend processing.
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

type StreamKey = keyof XrayStreamSettingsObject;

const NET_KEEP: Record<string, StreamKey[]> = {
  tcp: ['tcpSettings'],
  kcp: ['kcpSettings'],
  ws: ['wsSettings'],
  xhttp: ['xhttpSettings'],
  httpupgrade: ['httpupgradeSettings'],
  grpc: ['grpcSettings'],
  splithttp: ['splithttpSettings'],
  hysteria: ['hysteriaSettings']
};

const SEC_KEEP: Record<string, StreamKey[]> = {
  tls: ['tlsSettings'],
  reality: ['realitySettings']
};

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
  public hysteriaSettings?: XrayStreamHysteriaSettingsObject;
  public udpmasks?: XrayFinalMaskObject[];
  public sockopt?: XraySockoptObject;

  public normalize(): this | undefined {
    this.network = this.network && this.network !== 'tcp' ? this.network : undefined;
    this.security = this.security && this.security !== 'none' ? this.security : undefined;

    const allowed = new Set<StreamKey>([...(NET_KEEP[this.network ?? ''] ?? []), ...(SEC_KEEP[this.security ?? ''] ?? [])]);

    (Object.keys(this) as StreamKey[])
      .filter((k) => k.endsWith('Settings'))
      .forEach((k) => {
        if (!allowed.has(k)) (this as any)[k] = undefined;
      });

    if (this.normalizeAllSettings) this.normalizeAllSettings();

    if (this.udpmasks && this.udpmasks.length > 0) {
      this.udpmasks = this.udpmasks
        .map((mask) => (typeof mask.normalize === 'function' ? mask.normalize() : mask))
        .filter((mask): mask is XrayFinalMaskObject => mask !== undefined);
      if (this.udpmasks.length === 0) this.udpmasks = undefined;
    } else {
      this.udpmasks = undefined;
    }

    if (this.sockopt && typeof this.sockopt.normalize === 'function') this.sockopt = this.sockopt.normalize();

    return isObjectEmpty(this) ? undefined : this;
  }

  private normalizeAllSettings?(): void {
    (Object.keys(this) as StreamKey[])
      .filter((k) => k.endsWith('Settings'))
      .forEach((k) => {
        const obj = (this as any)[k];
        if (obj && typeof obj.normalize === 'function') (this as any)[k] = obj.normalize();
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
  static readonly typeOptions = ['rand', 'str', 'base64'];
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
  static readonly tproxyOptions = ['off', 'redirect', 'tproxy'];
  static readonly domainStrategyOptions = ['AsIs', 'UseIP', 'UseIPv4', 'UseIPv6'];

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
    this.mark = !this.mark && this.mark == 0 ? undefined : this.mark;
    this.interface = this.interface == '' ? undefined : this.interface;
    this.tproxy = this.tproxy == 'off' || this.tproxy == '' ? undefined : this.tproxy;
    this.tcpMptcp = !this.tcpMptcp ? undefined : this.tcpMptcp;
    this.tcpNoDelay = !this.tcpNoDelay ? undefined : this.tcpNoDelay;
    this.domainStrategy = this.domainStrategy == 'AsIs' ? undefined : this.domainStrategy;
    this.dialerProxy = this.dialerProxy == '' ? undefined : this.dialerProxy;
    return isObjectEmpty(this) ? undefined : this;
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
  public url!: string;

  private fixPct(input: string) {
    return input.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
  }

  public constructor(rawUrl: string) {
    const trimmed = rawUrl.trim();
    this.url = trimmed;
    const [protocol, afterScheme] = trimmed.split('://');
    this.protocol = protocol;
    const extraParams = {} as Record<string, string>;

    if (protocol === XrayProtocol.VMESS) {
      const vmessJson = JSON.parse(atob(afterScheme.replaceAll(' ', ''))) as ParseJsonObject;
      this.server = vmessJson.add;
      this.port = parseInt(vmessJson.port, 10);
      this.uuid = vmessJson.id;
      this.tag = vmessJson.ps || vmessJson.add;
      this.network = vmessJson.net;
      this.security = vmessJson.tls;
      this.parsedParams = vmessJson;
      return;
    } else if (protocol === 'ss') {
      const hashIdx = afterScheme.indexOf('#');
      const restNoFrag = hashIdx >= 0 ? afterScheme.slice(0, hashIdx) : afterScheme;
      const [authHost] = restNoFrag.split('?');
      const [userinfo] = authHost.split('@');

      const is2022Format = userinfo.startsWith('2022-blake3-');

      let method: string;
      let pass: string;

      if (is2022Format) {
        const decoded = decodeURIComponent(userinfo);
        const colonIdx = decoded.indexOf(':');
        method = decoded.slice(0, colonIdx);
        pass = decoded.slice(colonIdx + 1);
      } else {
        const ssDecoded = atob(userinfo);
        const [decodedMethod, ...passParts] = ssDecoded.split(':');
        method = decodedMethod;
        const fullPass = passParts.join(':');
        const [pass2] = fullPass.split('@');
        pass = pass2 ?? fullPass;

        const [, server] = ssDecoded.split('@');
        if (server) {
          const [server2, port2] = server.split(':');
          if (port2) {
            this.port = parseInt(port2, 10);
            this.server = server2;
          } else {
            this.server = server;
          }
        }
      }

      extraParams.method = method;
      extraParams.pass = pass;
    }

    const hashIdx = afterScheme.indexOf('#');
    const fragment = hashIdx >= 0 ? afterScheme.slice(hashIdx + 1) : '';
    const rest = hashIdx >= 0 ? afterScheme.slice(0, hashIdx) : afterScheme;

    const [authHost, queryFragmentRaw] = rest.split('?');
    const [uuid, serverPort] = authHost.split('@');
    const [server, port] = (serverPort || '').split(':');
    let queryRaw = queryFragmentRaw || '';

    this.server = this.server ?? server;
    let tag = fragment ? decodeURIComponent(fragment) : this.server;

    if (!queryRaw) {
      queryRaw = 'type=tcp&security=none';
    }

    const safeQuery = this.fixPct(queryRaw);
    const params = new URLSearchParams(safeQuery);
    params.forEach((value: string, key: string) => {
      this.parsedParams[key] = value;
    });

    Object.keys(extraParams).forEach((key) => {
      this.parsedParams[key] = extraParams[key];
    });

    this.tag = tag;
    this.port = this.port ?? parseInt(port, 10);
    this.uuid = uuid;
    this.network = this.parsedParams.type;
    this.security = this.parsedParams.security;
  }
}

export class XrayFakeDnsObject {
  public ipPool?: string;
  public poolSize = 65535;

  public normalize(): this | undefined {
    this.ipPool = this.ipPool == '' ? undefined : this.ipPool;
    this.poolSize = this.poolSize <= 0 || this.poolSize > 65535 ? 65535 : this.poolSize;

    if (!this.ipPool) {
      return undefined;
    }
    return this;
  }
}

export { XrayProtocol };
