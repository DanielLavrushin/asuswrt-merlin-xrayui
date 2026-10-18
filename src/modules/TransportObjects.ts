import { plainToInstance } from 'class-transformer';
import {
  XrayHeaderObject,
  XrayParsedUrlObject,
  XrayXmuxObject,
  XraySockoptObject,
  XrayStreamTlsSettingsObject,
  XrayStreamRealitySettingsObject,
  isObjectEmpty
} from './CommonObjects';
import { ITransportNetwork } from './Interfaces';
import { coreAppliesLastMaskOutermost, coreExpectsOutermostMaskLast, coreSupports, coreUsesMkcpLegacyMaskType, mkcpMaskingMode } from './CoreVersion';

const nonDefaultNumber = (value: unknown, defaultValue: number, min = -Infinity): number | undefined => {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed !== defaultValue ? parsed : undefined;
};

export class XrayStreamTcpSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol? = false;

  normalize = (): this | undefined => {
    this.acceptProxyProtocol = !this.acceptProxyProtocol ? undefined : this.acceptProxyProtocol;

    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayStreamKcpSettingsObject implements ITransportNetwork {
  static readonly headerTypes = ['none', 'srtp', 'utp', 'wechat-video', 'dtls', 'wireguard'];

  public mtu? = 1350;
  public tti? = 50;
  public uplinkCapacity? = 5;
  public downlinkCapacity? = 20;
  public congestion? = false;
  public readBufferSize? = 2;
  public writeBufferSize? = 2;
  public cwndMultiplier? = 1;
  public maxSendingWindow? = 2097152;
  public seed?: string;
  public header?: XrayHeaderObject = new XrayHeaderObject();

  constructor(parsedObject?: XrayParsedUrlObject | undefined) {
    if (parsedObject) {
      this.seed = parsedObject.parsedParams.seed;
      if (parsedObject.parsedParams.headerType) {
        this.header = new XrayHeaderObject();
        this.header.type = parsedObject.parsedParams.headerType;
      }
    }
  }

  normalize = (): this | undefined => {
    const legacyTuning = coreSupports('kcpLegacyTuning');
    const cwnd = coreSupports('kcpCwnd');
    this.mtu = nonDefaultNumber(this.mtu, 1350);
    this.tti = nonDefaultNumber(this.tti, 50);
    this.uplinkCapacity = nonDefaultNumber(this.uplinkCapacity, 5);
    this.downlinkCapacity = nonDefaultNumber(this.downlinkCapacity, 20);
    this.congestion = legacyTuning && this.congestion ? this.congestion : undefined;
    this.readBufferSize = legacyTuning ? nonDefaultNumber(this.readBufferSize, 2) : undefined;
    this.writeBufferSize = legacyTuning ? nonDefaultNumber(this.writeBufferSize, 2) : undefined;
    this.cwndMultiplier = cwnd ? nonDefaultNumber(this.cwndMultiplier, 1, 1) : undefined;
    this.maxSendingWindow = cwnd ? nonDefaultNumber(this.maxSendingWindow, 2097152, this.mtu ?? 1350) : undefined;
    this.seed = !this.seed || this.seed == '' ? undefined : this.seed;
    this.header = this.header?.type === 'none' ? undefined : this.header;

    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayStreamWsSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol? = false;
  public path? = '/';
  public host?: string;
  public headers?: Record<string, unknown>;

  constructor(parsedObject?: XrayParsedUrlObject | undefined) {
    if (parsedObject) {
      this.path = parsedObject.parsedParams.path ?? '/';
      this.host = parsedObject.parsedParams.host;
    }
  }
  normalize = (): this | undefined => {
    this.path = this.path === '/' ? undefined : this.path;
    this.host = !this.host ? undefined : this.host;
    this.headers = this.headers && Object.keys(this.headers).length === 0 ? undefined : this.headers;
    this.acceptProxyProtocol = !this.acceptProxyProtocol ? undefined : this.acceptProxyProtocol;

    return isObjectEmpty(this) ? undefined : this;
  };
}

// Only these fields remain outside extra. Other settings have one authoritative copy.
const xhttpOuterFields = new Set(['host', 'path', 'mode', 'extra', 'normalize']);
const xhttpPaddingFields = ['xPaddingBytes', 'xPaddingObfsMode', 'xPaddingKey', 'xPaddingHeader', 'xPaddingPlacement', 'xPaddingMethod'] as const;
type XhttpRange = number | string;

function xhttpExtraFields(source: object): Record<string, unknown> {
  const fields = Object.fromEntries(Object.entries(source).filter(([key, value]) =>
    !xhttpOuterFields.has(key) && value !== undefined && typeof value !== 'function'
  ));
  // Resolve aliases within each source BEFORE merging, so an explicit extra value wins even
  // when it uses the old spelling. The editor always uses the sessionID names.
  for (const [legacy, current] of [['sessionPlacement', 'sessionIDPlacement'], ['sessionKey', 'sessionIDKey']]) {
    if (fields[current] === undefined && fields[legacy] !== undefined) fields[current] = fields[legacy];
    delete fields[legacy];
  }
  return fields;
}

const normalizeXhttpRange = (value: XhttpRange | undefined, defaultValue?: XhttpRange): XhttpRange | undefined => {
  if (typeof value === 'string') value = value.trim();
  return value === '' || value == null || (defaultValue !== undefined && String(value) === String(defaultValue)) ? undefined : value;
};

export class XrayStreamHttpSettingsObject implements ITransportNetwork {
  static modes = ['auto', 'packet-up', 'stream-up', 'stream-one'];
  public host?: string;
  public path? = '/';
  public mode? = 'auto';
  public extra?: XrayXhttpExtraObject = new XrayXhttpExtraObject();

  constructor(parsedObject?: XrayParsedUrlObject) {
    if (parsedObject) {
      const params = parsedObject.parsedParams;
      Object.assign(this, XrayStreamHttpSettingsObject.fromPlain({
        path: params.path ?? '/', mode: params.mode ?? 'auto', host: params.host,
        extra: params.extra ? JSON.parse(params.extra) : undefined
      }));
    }
  }

  /** Migrate raw JSON before class defaults are applied. Does not mutate the source. */
  static fromPlain(source: object = {}): XrayStreamHttpSettingsObject {
    const raw = source as Record<string, unknown>;
    const settings = new XrayStreamHttpSettingsObject();
    for (const field of ['host', 'path', 'mode'] as const) {
      if (raw[field] !== undefined) Object.assign(settings, { [field]: raw[field] });
    }
    const nested = raw.extra && typeof raw.extra === 'object' && !Array.isArray(raw.extra) ? raw.extra : {};
    // Repair earlier UI output by retaining outer-only values. Explicit extra values take
    // precedence, including false, zero and empty maps; defaults are introduced only afterwards.
    settings.extra = plainToInstance(XrayXhttpExtraObject, { ...xhttpExtraFields(raw), ...xhttpExtraFields(nested) });
    const download = settings.extra.downloadSettings;
    if (download) {
      settings.extra.downloadSettings = plainToInstance(XrayDownloadSettingsObject, download);
      settings.extra.downloadSettings.xhttpSettings = XrayStreamHttpSettingsObject.fromPlain(download.xhttpSettings ?? {});
    }
    return settings;
  }

  normalize = (): this | undefined => {
    // Also handles raw/legacy objects passed directly to serialization, and old-core wire names
    // from a previous normalization. No obsolete outer copies survive to resurrect deleted data.
    this.extra = XrayStreamHttpSettingsObject.fromPlain(this).extra;
    for (const key of Object.keys(this)) {
      if (!xhttpOuterFields.has(key)) Reflect.deleteProperty(this, key);
    }
    this.mode = this.mode === 'auto' ? undefined : this.mode;
    this.path = this.path === '/' ? undefined : this.path;
    this.host = this.host || undefined;
    this.extra = this.extra?.normalize();

    if (this.extra?.uplinkHTTPMethod === 'GET' && this.mode !== 'packet-up') {
      throw new Error('XHTTP: uplinkHTTPMethod GET requires packet-up mode.');
    }
    if (['header', 'cookie'].includes(this.extra?.uplinkDataPlacement ?? '') && this.mode !== 'packet-up') {
      throw new Error('XHTTP: header/cookie uplink data placement requires packet-up mode.');
    }
    if (this.extra?.downloadSettings && this.mode === 'stream-one') {
      throw new Error('XHTTP: downloadSettings cannot be used in stream-one mode.');
    }
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayDownloadSettingsObject {
  public address?: string;
  public port? = 443;
  public network = 'xhttp'; // must be "xhttp"
  public security?: string; // 'tls' | 'reality'
  public tlsSettings?: XrayStreamTlsSettingsObject;
  public realitySettings?: XrayStreamRealitySettingsObject;
  public xhttpSettings?: XrayStreamHttpSettingsObject;
  public sockopt?: XraySockoptObject;

  normalize = (): this | undefined => {
    if (!this.address || this.address === '') {
      return undefined;
    }

    // A placeholder does not set a value, and core does not infer the HTTPS port here.
    this.port = this.port || 443;

    if (this.security === 'tls') {
      this.tlsSettings = plainToInstance(XrayStreamTlsSettingsObject, this.tlsSettings ?? {});
      this.tlsSettings = this.tlsSettings ? this.tlsSettings.normalize() : undefined;
      this.realitySettings = undefined;
    } else if (this.security === 'reality') {
      this.realitySettings = plainToInstance(XrayStreamRealitySettingsObject, this.realitySettings ?? {});
      this.realitySettings = this.realitySettings ? this.realitySettings.normalize() : undefined;
      this.tlsSettings = undefined;
    } else {
      this.tlsSettings = undefined;
      this.realitySettings = undefined;
    }

    this.xhttpSettings = XrayStreamHttpSettingsObject.fromPlain(this.xhttpSettings ?? {});
    this.xhttpSettings = this.xhttpSettings ? this.xhttpSettings.normalize() : undefined;

    this.sockopt = plainToInstance(XraySockoptObject, this.sockopt ?? {});
    this.sockopt = this.sockopt ? this.sockopt.normalize() : undefined;

    return isObjectEmpty(this) ? undefined : this;
  };
}

/** Seed a new split download without overwriting independently configured/imported values. */
export function createXhttpDownloadSettings(upload: XrayStreamHttpSettingsObject): XrayDownloadSettingsObject {
  const download = new XrayDownloadSettingsObject();
  download.xhttpSettings = new XrayStreamHttpSettingsObject();
  download.xhttpSettings.path = upload.path;
  const extra = XrayStreamHttpSettingsObject.fromPlain(upload).extra!;
  Object.assign(download.xhttpSettings.extra!, Object.fromEntries(xhttpPaddingFields.map((field) => [field, extra[field]])));
  return download;
}

export class XrayXhttpExtraObject {
  headers?: Record<string, string>;
  xPaddingBytes?: XhttpRange = '100-1000';
  xPaddingObfsMode? = false;
  xPaddingKey? = 'x_padding';
  xPaddingHeader? = 'X-Padding';
  xPaddingPlacement? = 'queryInHeader';
  xPaddingMethod? = 'repeat-x';
  uplinkHTTPMethod? = 'POST';
  sessionIDPlacement? = 'path';
  sessionIDKey?: string;
  sessionIDTable?: string;
  sessionIDLength?: XhttpRange;
  seqPlacement? = 'path';
  seqKey?: string;
  // Core defaults to auto, which lets an inbound accept payloads from multiple placements.
  // An explicit body is not equivalent and must not be normalized away.
  uplinkDataPlacement? = 'auto';
  uplinkDataKey?: string;
  uplinkChunkSize?: XhttpRange;
  noGRPCHeader? = false;
  noSSEHeader? = false;
  scMaxEachPostBytes?: XhttpRange = 1000000;
  scMinPostsIntervalMs?: XhttpRange = 30;
  scMaxBufferedPosts? = 30;
  scStreamUpServerSecs?: XhttpRange = '20-80';
  serverMaxHeaderBytes?: number;
  xmux?: XrayXmuxObject = new XrayXmuxObject();
  downloadSettings?: XrayDownloadSettingsObject;

  normalize = (): this | undefined => {
    this.headers = isObjectEmpty(this.headers) ? undefined : this.headers;
    this.xPaddingBytes = normalizeXhttpRange(this.xPaddingBytes, '100-1000');
    this.xPaddingObfsMode = this.xPaddingObfsMode || undefined;
    if (!this.xPaddingObfsMode) {
      this.xPaddingKey = this.xPaddingHeader = this.xPaddingPlacement = this.xPaddingMethod = undefined;
    } else {
      this.xPaddingKey = !this.xPaddingKey || this.xPaddingKey === 'x_padding' ? undefined : this.xPaddingKey;
      this.xPaddingHeader = !this.xPaddingHeader || this.xPaddingHeader === 'X-Padding' ? undefined : this.xPaddingHeader;
      this.xPaddingPlacement = this.xPaddingPlacement === 'queryInHeader' ? undefined : this.xPaddingPlacement;
      this.xPaddingMethod = this.xPaddingMethod === 'repeat-x' ? undefined : this.xPaddingMethod;
    }
    this.uplinkHTTPMethod = this.uplinkHTTPMethod?.trim().toUpperCase() || undefined;
    if (this.uplinkHTTPMethod === 'POST') this.uplinkHTTPMethod = undefined;
    this.sessionIDPlacement = this.sessionIDPlacement === 'path' ? undefined : this.sessionIDPlacement;
    this.sessionIDKey = this.sessionIDPlacement ? this.sessionIDKey || undefined : undefined;
    this.seqPlacement = this.seqPlacement === 'path' ? undefined : this.seqPlacement;
    this.seqKey = this.seqPlacement ? this.seqKey || undefined : undefined;
    this.uplinkDataPlacement = this.uplinkDataPlacement === 'auto' ? undefined : this.uplinkDataPlacement;
    this.uplinkDataKey = this.uplinkDataKey || undefined;
    this.uplinkChunkSize = normalizeXhttpRange(this.uplinkChunkSize);
    this.sessionIDLength = normalizeXhttpRange(this.sessionIDLength);
    this.noGRPCHeader = this.noGRPCHeader || undefined;
    this.noSSEHeader = this.noSSEHeader || undefined;
    this.scMaxEachPostBytes = normalizeXhttpRange(this.scMaxEachPostBytes, 1000000);
    this.scMinPostsIntervalMs = normalizeXhttpRange(this.scMinPostsIntervalMs, 30);
    this.scMaxBufferedPosts = this.scMaxBufferedPosts === 30 ? undefined : this.scMaxBufferedPosts;
    this.scStreamUpServerSecs = normalizeXhttpRange(this.scStreamUpServerSecs, '20-80');
    this.xmux = plainToInstance(XrayXmuxObject, this.xmux ?? {}).normalize();
    this.downloadSettings = plainToInstance(XrayDownloadSettingsObject, this.downloadSettings ?? {}).normalize();
    if (!coreSupports('xhttpSessionID')) {
      Object.assign(this, { sessionPlacement: this.sessionIDPlacement, sessionKey: this.sessionIDKey });
      delete this.sessionIDPlacement;
      delete this.sessionIDKey;
    }
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayStreamGrpcSettingsObject implements ITransportNetwork {
  public serviceName = '';
  public multiMode = false;
  public idle_timeout = 60;
  public health_check_timeout = 20;
  public initial_windows_size = 0;
  public permit_without_stream = false;
  normalize = (): this => {
    return this;
  };
}

export class XrayStreamHttpUpgradeSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol = false;
  public path = '/';
  public host?: string;
  public headers = {};
  normalize = (): this => {
    return this;
  };
}

/**
 * The pre-24.10.31 SplitHTTP settings shape. Kept as a migration SOURCE only -- there is no
 * longer a class, a UI or a serialization path for it. See migrateSplitHttpToXhttp below.
 */
interface LegacySplitHttpSettings {
  path?: string;
  host?: string;
  headers?: Record<string, string>;
  scMaxEachPostBytes?: number;
  scMaxConcurrentPosts?: number;
  scMinPostsIntervalMs?: number;
  noSSEHeader?: boolean;
  xmux?: XrayXmuxObject;
}

export interface SplitHttpMigratableStream {
  network?: string;
  xhttpSettings?: XrayStreamHttpSettingsObject;
  splithttpSettings?: unknown;
}

/**
 * Folds a legacy `splithttp` transport into `xhttp`.
 *
 * Xray-core 24.10.31 renamed SplitHTTP to XHTTP and they have been ONE transport ever since:
 *   infra/conf/transport_internet.go:20  case "xhttp", "splithttp": return "splithttp", nil
 *   :55-56  XHTTPSettings / SplitHTTPSettings are both *SplitHTTPConfig
 * so this is a pure rename on the wire, not a behaviour change. Core still accepts the old
 * spelling, which is why untouched configs kept working -- but nothing in this codebase can
 * edit them any more, so hydration normalizes them forward.
 *
 * Must run during hydration, BEFORE XrayStreamSettingsObject.normalize(): normalize prunes any
 * `*Settings` key that NET_KEEP does not list for the current network, so an unmigrated
 * `splithttpSettings` would be silently dropped on the next save.
 */
export function migrateSplitHttpToXhttp(stream: SplitHttpMigratableStream): void {
  const legacy = stream.splithttpSettings as LegacySplitHttpSettings | undefined;
  // Case-insensitive: core lowercases before matching (`switch strings.ToLower(string(p))`,
  // infra/conf/transport_internet.go:17), so a hand-written or imported config may legitimately
  // say "SplitHTTP". Matching only the lowercase spelling would leave `network` untouched, and
  // normalize() -- whose NET_KEEP lookup IS case-sensitive -- would then prune the settings away.
  if (stream.network?.toLowerCase() === 'splithttp') stream.network = 'xhttp';
  if (!legacy) return;

  delete stream.splithttpSettings;

  // Core's precedence: `if c.XHTTPSettings != nil { c.SplitHTTPSettings = c.XHTTPSettings }`
  // -- xhttpSettings wins outright when both are present. Match that rather than merging.
  if (stream.xhttpSettings) return;

  const xhttp = new XrayStreamHttpSettingsObject();
  if (legacy.path !== undefined) xhttp.path = legacy.path;
  if (legacy.host !== undefined) xhttp.host = legacy.host;
  if (legacy.headers !== undefined) xhttp.extra!.headers = legacy.headers;

  const extra = xhttp.extra ?? (xhttp.extra = new XrayXhttpExtraObject());
  if (legacy.scMaxEachPostBytes !== undefined) extra.scMaxEachPostBytes = legacy.scMaxEachPostBytes;
  if (legacy.scMinPostsIntervalMs !== undefined) extra.scMinPostsIntervalMs = legacy.scMinPostsIntervalMs;
  if (legacy.noSSEHeader !== undefined) extra.noSSEHeader = legacy.noSSEHeader;
  if (legacy.xmux !== undefined) extra.xmux = plainToInstance(XrayXmuxObject, legacy.xmux);

  // scMaxConcurrentPosts is deliberately dropped: it no longer exists in core's SplitHTTPConfig
  // (transport_method.go:257-288) and json.Unmarshal ignores it, so it has had no effect for some
  // time. It is NOT remapped to xmux.maxConcurrency -- that is a different concept (mux streams
  // per connection), and silently changing its meaning would be worse than losing a dead field.

  stream.xhttpSettings = xhttp;
}

export class XrayUdpHopObject {
  public port?: string;
  public interval? = 30;

  normalize = (): this | undefined => {
    this.port = !this.port || this.port === '' ? undefined : this.port;
    this.interval = this.interval === 30 ? undefined : this.interval;
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XraySalamanderObject {
  public password?: string;

  normalize = (): this | undefined => {
    this.password = !this.password || this.password === '' ? undefined : this.password;
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XraySudokuObject {
  static readonly asciiOptions = ['prefer_entropy', 'prefer_ascii'];

  public password?: string;
  public ascii? = 'prefer_entropy';
  public customTable?: string;
  public customTables?: string[];
  public paddingMin?: number;
  public paddingMax?: number;

  normalize = (): this | undefined => {
    this.password = !this.password || this.password === '' ? undefined : this.password;
    if (!this.password) return undefined;
    this.ascii = this.ascii === 'prefer_entropy' || !this.ascii ? undefined : this.ascii;
    this.customTable = !this.customTable || this.customTable === '' ? undefined : this.customTable;
    this.customTables = this.customTables?.length ? this.customTables.filter((t) => t !== '') : undefined;
    if (this.customTables?.length === 0) this.customTables = undefined;
    this.paddingMin = this.paddingMin != null && this.paddingMin > 0 ? this.paddingMin : undefined;
    this.paddingMax = this.paddingMax != null && this.paddingMax > 0 ? this.paddingMax : undefined;
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayFragmentObject {
  public packets?: string;
  public length?: string;
  public delay?: string;
  public maxSplit?: string;

  normalize = (): this | undefined => {
    this.packets = !this.packets || this.packets === '' ? undefined : this.packets;
    this.length = !this.length || this.length === '' ? undefined : this.length;
    this.delay = !this.delay || this.delay === '' ? undefined : this.delay;
    this.maxSplit = !this.maxSplit || this.maxSplit === '' ? undefined : this.maxSplit;
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayNoiseItemObject {
  public rand?: string;
  public randRange? = '0-255';
  public type?: string;
  public packet?: any[];
  public delay?: string;
}

export class XrayNoiseObject {
  public reset? = 0;
  public noise?: XrayNoiseItemObject[];

  normalize = (): this | undefined => {
    this.reset = this.reset != null && this.reset > 0 ? this.reset : undefined;
    this.noise = this.noise && this.noise.length > 0 ? this.noise : undefined;
    if (!this.noise) return undefined;
    return this;
  };
}

export class XrayHeaderCustomSettingsObject {
  // TCP variant: clients[][], servers[][], errors[][]
  public clients?: any[][];
  public servers?: any[][];
  public errors?: any[][];
  // UDP variant: client[], server[]
  public client?: any[];
  public server?: any[];

  normalize = (): this | undefined => {
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayHeaderDnsObject {
  public domain?: string;

  normalize = (): this | undefined => {
    this.domain = !this.domain || this.domain === '' ? undefined : this.domain;
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayMkcpAes128GcmObject {
  public password?: string;

  normalize = (): this | undefined => {
    this.password = !this.password || this.password === '' ? undefined : this.password;
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayMkcpLegacyObject {
  public header?: string;
  public value?: string;

  normalize = (): this | undefined => {
    this.header = !this.header || this.header === '' ? undefined : this.header;
    this.value = !this.value || this.value === '' ? undefined : this.value;
    return this;
  };
}

export class XrayXdnsObject {
  public domain?: string;

  normalize = (): this | undefined => {
    this.domain = !this.domain || this.domain === '' ? undefined : this.domain;
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayXicmpObject {
  public listenIp? = '0.0.0.0';
  public id? = 0;

  normalize = (): this | undefined => {
    this.listenIp = this.listenIp === '0.0.0.0' || !this.listenIp ? undefined : this.listenIp;
    this.id = this.id === 0 ? undefined : this.id;
    return isObjectEmpty(this) ? undefined : this;
  };
}

export type FinalMaskSettingsType =
  | XraySalamanderObject
  | XraySudokuObject
  | XrayFragmentObject
  | XrayNoiseObject
  | XrayHeaderCustomSettingsObject
  | XrayHeaderDnsObject
  | XrayMkcpAes128GcmObject
  | XrayMkcpLegacyObject
  | XrayXdnsObject
  | XrayXicmpObject;

export class XrayFinalMaskObject {
  static readonly udpMaskTypes = [
    'salamander',
    'sudoku',
    'noise',
    'header-custom',
    'header-dns',
    'header-dtls',
    'header-srtp',
    'header-utp',
    'header-wechat',
    'header-wireguard',
    'mkcp-original',
    'mkcp-aes128gcm',
    'xdns',
    'xicmp'
  ];
  static readonly tcpMaskTypes = ['fragment', 'header-custom', 'sudoku'];
  static readonly noSettingsTypes = new Set([
    'header-dtls',
    'header-srtp',
    'header-utp',
    'header-wechat',
    'header-wireguard',
    'mkcp-original'
  ]);

  public type = 'salamander';
  public settings?: FinalMaskSettingsType;

  normalize = (): this | undefined => {
    if (XrayFinalMaskObject.noSettingsTypes.has(this.type)) {
      this.settings = undefined;
      return this;
    }
    if (this.settings && typeof this.settings.normalize === 'function') {
      this.settings = this.settings.normalize();
    }
    if (!this.settings) return undefined;
    return this;
  };

  static createSettings(type: string): FinalMaskSettingsType | undefined {
    switch (type) {
      case 'salamander':
        return new XraySalamanderObject();
      case 'sudoku':
        return new XraySudokuObject();
      case 'fragment':
        return new XrayFragmentObject();
      case 'noise':
        return new XrayNoiseObject();
      case 'header-custom':
        return new XrayHeaderCustomSettingsObject();
      case 'header-dns':
        return new XrayHeaderDnsObject();
      case 'mkcp-aes128gcm':
        return new XrayMkcpAes128GcmObject();
      case 'mkcp-legacy':
        return new XrayMkcpLegacyObject();
      case 'xdns':
        return new XrayXdnsObject();
      case 'xicmp':
        return new XrayXicmpObject();
      default:
        return undefined;
    }
  }

  static deserializeSettings(type: string, data: any): FinalMaskSettingsType | undefined {
    if (!data) return undefined;
    switch (type) {
      case 'salamander':
        return plainToInstance(XraySalamanderObject, data);
      case 'sudoku':
        return plainToInstance(XraySudokuObject, data);
      case 'fragment':
        return plainToInstance(XrayFragmentObject, data);
      case 'noise':
        return plainToInstance(XrayNoiseObject, data);
      case 'header-custom':
        return plainToInstance(XrayHeaderCustomSettingsObject, data);
      case 'header-dns':
        return plainToInstance(XrayHeaderDnsObject, data);
      case 'mkcp-aes128gcm':
        return plainToInstance(XrayMkcpAes128GcmObject, data);
      case 'mkcp-legacy':
        return plainToInstance(XrayMkcpLegacyObject, data);
      case 'xdns':
        return plainToInstance(XrayXdnsObject, data);
      case 'xicmp':
        return plainToInstance(XrayXicmpObject, data);
      default:
        return undefined;
    }
  }
}

const CANONICAL_HEADER_TO_MKCP_LEGACY: Record<string, string> = {
  'header-dns': 'dns',
  'header-dtls': 'dtls',
  'header-srtp': 'srtp',
  'header-utp': 'utp',
  'header-wechat': 'wechat',
  'header-wireguard': 'wireguard'
};

const MKCP_LEGACY_HEADER_TO_CANONICAL: Record<string, string> = Object.fromEntries(
  Object.entries(CANONICAL_HEADER_TO_MKCP_LEGACY).map(([canonical, legacy]) => [legacy, canonical])
);

export function maskToCoreForm(mask: XrayFinalMaskObject): XrayFinalMaskObject {
  if (!coreUsesMkcpLegacyMaskType()) return mask;

  const legacy = new XrayMkcpLegacyObject();
  if (mask.type in CANONICAL_HEADER_TO_MKCP_LEGACY) {
    legacy.header = CANONICAL_HEADER_TO_MKCP_LEGACY[mask.type];
    if (mask.type === 'header-dns') legacy.value = (mask.settings as XrayHeaderDnsObject)?.domain;
  } else if (mask.type === 'mkcp-aes128gcm') {
    legacy.value = (mask.settings as XrayMkcpAes128GcmObject)?.password;
  } else if (mask.type !== 'mkcp-original') {
    return mask;
  }

  const converted = new XrayFinalMaskObject();
  converted.type = 'mkcp-legacy';
  converted.settings = legacy;
  return converted;
}

export function maskFromCoreForm(mask: XrayFinalMaskObject): XrayFinalMaskObject {
  if (mask.type !== 'mkcp-legacy') return mask;

  const legacy = mask.settings as XrayMkcpLegacyObject;
  const header = legacy?.header;
  const value = legacy?.value;
  const converted = new XrayFinalMaskObject();

  if (header && header in MKCP_LEGACY_HEADER_TO_CANONICAL) {
    converted.type = MKCP_LEGACY_HEADER_TO_CANONICAL[header];
    if (header === 'dns') {
      const dns = new XrayHeaderDnsObject();
      dns.domain = value;
      converted.settings = dns;
    }
  } else if (value) {
    converted.type = 'mkcp-aes128gcm';
    const aes = new XrayMkcpAes128GcmObject();
    aes.password = value;
    converted.settings = aes;
  } else {
    converted.type = 'mkcp-original';
  }
  return converted;
}

const KCP_UI_HEADER_TO_CANONICAL: Record<string, string> = {
  srtp: 'header-srtp',
  utp: 'header-utp',
  'wechat-video': 'header-wechat',
  dtls: 'header-dtls',
  wireguard: 'header-wireguard'
};

const CANONICAL_TO_KCP_UI_HEADER: Record<string, string> = Object.fromEntries(
  Object.entries(KCP_UI_HEADER_TO_CANONICAL).map(([ui, canonical]) => [canonical, ui])
);

const OUTERMOST_MASK_TYPES = new Set(['xicmp', 'realm', 'udphop']);
const INNERMOST_MASK_TYPES = new Set(['sudoku']);

function isKcpUiOwnedMask(mask: XrayFinalMaskObject): boolean {
  return mask.type in CANONICAL_TO_KCP_UI_HEADER || mask.type === 'mkcp-aes128gcm';
}

interface KcpMaskStreamLike {
  network?: string;
  kcpSettings?: XrayStreamKcpSettingsObject;
  finalmask?: XrayFinalMaskSettingsObject;
}

export function migrateKcpMaskingForSerialization(stream: KcpMaskStreamLike): void {
  const kcp = stream.kcpSettings;
  if (!kcp) return;
  if (mkcpMaskingMode() === 'legacy') return;

  const headerType = kcp.header?.type;
  const seed = kcp.seed;
  kcp.header = undefined;
  kcp.seed = undefined;

  const built: XrayFinalMaskObject[] = [];
  if (headerType && headerType in KCP_UI_HEADER_TO_CANONICAL) {
    const mask = new XrayFinalMaskObject();
    mask.type = KCP_UI_HEADER_TO_CANONICAL[headerType];
    built.push(mask);
  }
  if (seed) {
    const mask = new XrayFinalMaskObject();
    mask.type = 'mkcp-aes128gcm';
    const aes = new XrayMkcpAes128GcmObject();
    aes.password = seed;
    mask.settings = aes;
    built.push(mask);
  }

  const preserved = (stream.finalmask?.udp ?? []).filter((mask) => !isKcpUiOwnedMask(mask));
  const outermost = preserved.filter((mask) => OUTERMOST_MASK_TYPES.has(mask.type));
  const innermost = preserved.filter((mask) => INNERMOST_MASK_TYPES.has(mask.type));
  const others = preserved.filter((mask) => !OUTERMOST_MASK_TYPES.has(mask.type) && !INNERMOST_MASK_TYPES.has(mask.type));
  const middle = coreAppliesLastMaskOutermost() ? [...others, ...built.reverse()] : [...built, ...others];
  const udp = coreExpectsOutermostMaskLast() ? [...innermost, ...middle, ...outermost] : [...outermost, ...middle, ...innermost];

  if (udp.length > 0) {
    if (!stream.finalmask) stream.finalmask = new XrayFinalMaskSettingsObject();
    stream.finalmask.udp = udp;
  } else if (stream.finalmask) {
    stream.finalmask.udp = undefined;
  }
}

export function extractKcpMaskingForUi(stream: KcpMaskStreamLike): void {
  if (stream.network !== 'kcp') return;
  const udp = stream.finalmask?.udp;
  if (!udp || udp.length === 0) return;

  let headerType: string | undefined;
  let seed: string | undefined;
  const remaining: XrayFinalMaskObject[] = [];

  for (const mask of udp) {
    if (mask.type in CANONICAL_TO_KCP_UI_HEADER) {
      headerType = CANONICAL_TO_KCP_UI_HEADER[mask.type];
    } else if (mask.type === 'mkcp-aes128gcm') {
      seed = (mask.settings as XrayMkcpAes128GcmObject)?.password;
    } else {
      remaining.push(mask);
    }
  }

  if (headerType === undefined && seed === undefined) return;

  stream.kcpSettings ??= new XrayStreamKcpSettingsObject();
  const kcp = stream.kcpSettings;
  if (headerType !== undefined) {
    kcp.header ??= new XrayHeaderObject();
    kcp.header.type = headerType;
  }
  if (seed !== undefined) kcp.seed = seed;

  stream.finalmask!.udp = remaining.length > 0 ? remaining : undefined;
}

export class XrayQuicParamsUdpHopObject {
  public ports?: string;
  public interval?: string;

  normalize = (): this | undefined => {
    this.ports = !this.ports || this.ports === '' ? undefined : this.ports;
    this.interval = !this.interval || this.interval === '' ? undefined : this.interval;
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayQuicParamsObject {
  static readonly congestionOptions = ['reno', 'bbr', 'brutal', 'force-brutal'];

  public congestion?: string;
  public debug? = false;
  public brutalUp?: string | number;
  public brutalDown?: string | number;
  public udpHop?: XrayQuicParamsUdpHopObject;
  public initStreamReceiveWindow? = 8388608;
  public maxStreamReceiveWindow? = 8388608;
  public initConnectionReceiveWindow? = 20971520;
  public maxConnectionReceiveWindow? = 20971520;
  public maxIdleTimeout? = 30;
  public keepAlivePeriod? = 0;
  public disablePathMTUDiscovery? = false;
  public maxIncomingStreams? = 1024;

  normalize = (): this | undefined => {
    this.congestion = !this.congestion || this.congestion === '' ? undefined : this.congestion;
    this.debug = !this.debug ? undefined : this.debug;
    this.brutalUp = !this.brutalUp || this.brutalUp === '' || this.brutalUp === 0 ? undefined : this.brutalUp;
    this.brutalDown = !this.brutalDown || this.brutalDown === '' || this.brutalDown === 0 ? undefined : this.brutalDown;
    if (this.udpHop) {
      this.udpHop = plainToInstance(XrayQuicParamsUdpHopObject, this.udpHop);
      this.udpHop = this.udpHop.normalize();
    }
    this.initStreamReceiveWindow = this.initStreamReceiveWindow === 8388608 ? undefined : this.initStreamReceiveWindow;
    this.maxStreamReceiveWindow = this.maxStreamReceiveWindow === 8388608 ? undefined : this.maxStreamReceiveWindow;
    this.initConnectionReceiveWindow = this.initConnectionReceiveWindow === 20971520 ? undefined : this.initConnectionReceiveWindow;
    this.maxConnectionReceiveWindow = this.maxConnectionReceiveWindow === 20971520 ? undefined : this.maxConnectionReceiveWindow;
    this.maxIdleTimeout = this.maxIdleTimeout === 30 ? undefined : this.maxIdleTimeout;
    this.keepAlivePeriod = !this.keepAlivePeriod ? undefined : this.keepAlivePeriod;
    this.disablePathMTUDiscovery = !this.disablePathMTUDiscovery ? undefined : this.disablePathMTUDiscovery;
    this.maxIncomingStreams = this.maxIncomingStreams === 1024 ? undefined : this.maxIncomingStreams;
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayFinalMaskSettingsObject {
  public udp?: XrayFinalMaskObject[];
  public tcp?: XrayFinalMaskObject[];
  public quicParams?: XrayQuicParamsObject;

  normalize = (): this | undefined => {
    if (this.udp && this.udp.length > 0) {
      this.udp = this.udp
        .map((mask) => (typeof mask.normalize === 'function' ? mask.normalize() : mask))
        .filter((mask): mask is XrayFinalMaskObject => mask !== undefined)
        .map((mask) => maskToCoreForm(mask));
      if (this.udp.length === 0) this.udp = undefined;
    } else {
      this.udp = undefined;
    }
    if (this.tcp && this.tcp.length > 0) {
      this.tcp = this.tcp
        .map((mask) => (typeof mask.normalize === 'function' ? mask.normalize() : mask))
        .filter((mask): mask is XrayFinalMaskObject => mask !== undefined);
      if (this.tcp.length === 0) this.tcp = undefined;
    } else {
      this.tcp = undefined;
    }
    if (this.quicParams) {
      this.quicParams = plainToInstance(XrayQuicParamsObject, this.quicParams);
      this.quicParams = this.quicParams.normalize();
    }
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayHysteriaMasqueradeObject {
  static readonly typeOptions = ['', 'file', 'proxy', 'string'];

  public type? = '';
  public dir?: string;
  public url?: string;
  public rewriteHost? = false;
  public insecure? = false;
  public content?: string;
  public headers?: Record<string, string>;
  public statusCode?: number;

  normalize = (): this | undefined => {
    this.type = this.type === '' ? undefined : this.type;
    this.dir = this.type === 'file' && this.dir ? this.dir : undefined;
    this.url = this.type === 'proxy' && this.url ? this.url : undefined;
    this.rewriteHost = this.type === 'proxy' && this.rewriteHost ? this.rewriteHost : undefined;
    this.insecure = this.type === 'proxy' && this.insecure ? this.insecure : undefined;
    this.content = this.type === 'string' && this.content ? this.content : undefined;
    this.headers = this.type === 'string' && this.headers && Object.keys(this.headers).length > 0 ? this.headers : undefined;
    this.statusCode = this.type === 'string' && this.statusCode ? this.statusCode : undefined;
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayStreamHysteriaSettingsObject implements ITransportNetwork {
  public version? = 2;
  public auth?: string;
  public udphop?: XrayUdpHopObject;
  public udpIdleTimeout?: number;
  public masquerade?: XrayHysteriaMasqueradeObject;

  normalize = (): this | undefined => {
    // Xray-core 26.3.27+: congestion/brutalUp/brutalDown live under streamSettings.finalmask.quicParams.
    // Strip any stale fields that may exist on objects loaded from older configs.
    delete (this as any).congestion;
    delete (this as any).up;
    delete (this as any).down;

    this.auth = !this.auth || this.auth === '' ? undefined : this.auth;
    this.udpIdleTimeout = this.udpIdleTimeout && this.udpIdleTimeout !== 60 ? this.udpIdleTimeout : undefined;

    if (this.udphop && typeof this.udphop.normalize === 'function') {
      this.udphop = this.udphop.normalize();
    }

    if (this.masquerade && typeof this.masquerade.normalize === 'function') {
      this.masquerade = this.masquerade.normalize();
    }

    return isObjectEmpty(this) ? undefined : this;
  };
}
