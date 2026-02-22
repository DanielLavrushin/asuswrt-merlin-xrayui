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
    this.mtu = this.mtu === 1350 ? undefined : this.mtu;
    this.tti = this.tti === 50 ? undefined : this.tti;
    this.uplinkCapacity = this.uplinkCapacity === 5 ? undefined : this.uplinkCapacity;
    this.downlinkCapacity = this.downlinkCapacity === 20 ? undefined : this.downlinkCapacity;
    this.congestion = !this.congestion ? undefined : this.congestion;
    this.readBufferSize = this.readBufferSize === 2 ? undefined : this.readBufferSize;
    this.writeBufferSize = this.writeBufferSize === 2 ? undefined : this.writeBufferSize;
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

export class XrayStreamHttpSettingsObject implements ITransportNetwork {
  static modes = ['auto', 'stream-up', 'stream-one'];
  public host?: string;
  public path? = '/';
  public mode? = 'auto';
  xPaddingBytes? = '100-1000';
  noGRPCHeader? = false;
  noSSEHeader? = false;
  scMaxEachPostBytes? = 1000000;
  scMinPostsIntervalMs? = 30;
  scMaxBufferedPosts? = 30;
  scStreamUpServerSecs? = '20-80';

  // Anti-detection / obfuscation fields (Xray-core PR #5414)
  xPaddingObfsMode? = false;
  xPaddingKey? = 'x_padding';
  xPaddingHeader? = 'X-Padding';
  xPaddingPlacement? = 'queryInHeader';
  xPaddingMethod? = 'repeat-x';
  uplinkHTTPMethod? = 'POST';
  sessionPlacement? = 'path';
  sessionKey?: string;
  seqPlacement? = 'path';
  seqKey?: string;
  uplinkDataPlacement? = 'body';
  uplinkDataKey?: string;
  uplinkChunkSize?: number;

  public headers? = {};

  public extra?: XrayXhttpExtraObject = new XrayXhttpExtraObject();

  constructor(parsedObject?: XrayParsedUrlObject | undefined) {
    if (parsedObject) {
      this.path = parsedObject.parsedParams.path ?? '/';
      this.mode = parsedObject.parsedParams.mode ?? 'auto';
      this.host = parsedObject.parsedParams.host;
    }
  }

  normalize = (): this | undefined => {
    this.mode = this.mode === 'auto' ? undefined : this.mode;
    this.path = this.path === '/' ? undefined : this.path;
    this.host = !this.host || this.host === '' ? undefined : this.host;
    this.xPaddingBytes = this.xPaddingBytes === '100-1000' ? undefined : this.xPaddingBytes;
    this.noGRPCHeader = !this.noGRPCHeader ? undefined : this.noGRPCHeader;
    this.noSSEHeader = !this.noSSEHeader ? undefined : this.noSSEHeader;
    this.scMaxEachPostBytes = this.scMaxEachPostBytes == 1000000 ? undefined : this.scMaxEachPostBytes;
    this.scMinPostsIntervalMs = this.scMinPostsIntervalMs == 30 ? undefined : this.scMinPostsIntervalMs;
    this.scMaxBufferedPosts = this.scMaxBufferedPosts == 30 ? undefined : this.scMaxBufferedPosts;
    this.scStreamUpServerSecs = this.scStreamUpServerSecs === '20-80' ? undefined : this.scStreamUpServerSecs;

    // Anti-detection fields normalization
    this.xPaddingObfsMode = !this.xPaddingObfsMode ? undefined : this.xPaddingObfsMode;
    if (!this.xPaddingObfsMode) {
      this.xPaddingKey = undefined;
      this.xPaddingHeader = undefined;
      this.xPaddingPlacement = undefined;
      this.xPaddingMethod = undefined;
    } else {
      this.xPaddingKey = !this.xPaddingKey || this.xPaddingKey === 'x_padding' ? undefined : this.xPaddingKey;
      this.xPaddingHeader = !this.xPaddingHeader || this.xPaddingHeader === 'X-Padding' ? undefined : this.xPaddingHeader;
      this.xPaddingPlacement = this.xPaddingPlacement === 'queryInHeader' ? undefined : this.xPaddingPlacement;
      this.xPaddingMethod = this.xPaddingMethod === 'repeat-x' ? undefined : this.xPaddingMethod;
    }

    this.uplinkHTTPMethod = !this.uplinkHTTPMethod || this.uplinkHTTPMethod === 'POST' ? undefined : this.uplinkHTTPMethod;

    this.sessionPlacement = this.sessionPlacement === 'path' ? undefined : this.sessionPlacement;
    if (!this.sessionPlacement) this.sessionKey = undefined;
    else this.sessionKey = !this.sessionKey || this.sessionKey === '' ? undefined : this.sessionKey;

    this.seqPlacement = this.seqPlacement === 'path' ? undefined : this.seqPlacement;
    if (!this.seqPlacement) this.seqKey = undefined;
    else this.seqKey = !this.seqKey || this.seqKey === '' ? undefined : this.seqKey;

    this.uplinkDataPlacement = this.uplinkDataPlacement === 'body' ? undefined : this.uplinkDataPlacement;
    this.uplinkDataKey = !this.uplinkDataKey || this.uplinkDataKey === '' ? undefined : this.uplinkDataKey;
    this.uplinkChunkSize = !this.uplinkChunkSize || this.uplinkChunkSize < 64 ? undefined : this.uplinkChunkSize;

    this.headers = isObjectEmpty(this.headers) ? undefined : this.headers;
    this.extra = plainToInstance(XrayXhttpExtraObject, this.extra ?? {});
    this.extra = this.extra ? this.extra.normalize() : undefined;

    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayDownloadSettingsObject {
  public address?: string;
  public port?: number;
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

    this.port = !this.port ? undefined : this.port;

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

    this.xhttpSettings = plainToInstance(XrayStreamHttpSettingsObject, this.xhttpSettings ?? {});
    this.xhttpSettings = this.xhttpSettings ? this.xhttpSettings.normalize() : undefined;

    this.sockopt = plainToInstance(XraySockoptObject, this.sockopt ?? {});
    this.sockopt = this.sockopt ? this.sockopt.normalize() : undefined;

    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayXhttpExtraObject {
  xPaddingBytes? = '100-1000';
  noGRPCHeader? = false;
  noSSEHeader? = false;
  scMaxEachPostBytes? = 1000000;
  scMinPostsIntervalMs? = 30;
  scMaxBufferedPosts? = 30;
  scStreamUpServerSecs? = '20-80';
  xmux?: XrayXmuxObject = new XrayXmuxObject();
  downloadSettings?: XrayDownloadSettingsObject;

  normalize = (): this | undefined => {
    this.xPaddingBytes = this.xPaddingBytes === '100-1000' ? undefined : this.xPaddingBytes;
    this.noGRPCHeader = !this.noGRPCHeader ? undefined : this.noGRPCHeader;
    this.noSSEHeader = !this.noSSEHeader ? undefined : this.noSSEHeader;
    this.scMaxEachPostBytes = this.scMaxEachPostBytes == 1000000 ? undefined : this.scMaxEachPostBytes;
    this.scMinPostsIntervalMs = this.scMinPostsIntervalMs == 30 ? undefined : this.scMinPostsIntervalMs;
    this.scMaxBufferedPosts = this.scMaxBufferedPosts == 30 ? undefined : this.scMaxBufferedPosts;
    this.scStreamUpServerSecs = this.scStreamUpServerSecs === '20-80' ? undefined : this.scStreamUpServerSecs;
    this.xmux = plainToInstance(XrayXmuxObject, this.xmux ?? {});
    this.xmux = this.xmux ? this.xmux.normalize() : undefined;
    this.downloadSettings = plainToInstance(XrayDownloadSettingsObject, this.downloadSettings ?? {});
    this.downloadSettings = this.downloadSettings ? this.downloadSettings.normalize() : undefined;
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

export class XrayStreamSplitHttpSettingsObject implements ITransportNetwork {
  public path = '/';
  public host?: string;
  public headers = {};
  public scMaxEachPostBytes = 1 * 1024 * 1024;
  public scMaxConcurrentPosts?: number;
  public scMinPostsIntervalMs?: number;
  public noSSEHeader = false;
  public xmux: XrayXmuxObject = new XrayXmuxObject();
  normalize = (): this => {
    return this;
  };
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

export class XrayFinalMaskObject {
  public type = 'salamander';
  public settings?: XraySalamanderObject;

  normalize = (): this | undefined => {
    if (this.settings && typeof this.settings.normalize === 'function') {
      this.settings = this.settings.normalize();
    }
    if (!this.settings) return undefined;
    return this;
  };
}

export class XrayStreamHysteriaSettingsObject implements ITransportNetwork {
  static readonly congestionOptions = ['', 'reno', 'bbr', 'brutal', 'force-brutal'];

  public version? = 2;
  public auth?: string;
  public congestion? = '';
  public up?: string;
  public down?: string;
  public udphop?: XrayUdpHopObject;

  constructor() {
    this.version = 2;
    this.congestion = '';
  }

  normalize = (): this | undefined => {
    this.auth = !this.auth || this.auth === '' ? undefined : this.auth;
    this.congestion = !this.congestion || this.congestion === '' ? undefined : this.congestion;
    this.up = !this.up || this.up === '' ? undefined : this.up;
    this.down = !this.down || this.down === '' ? undefined : this.down;

    if (this.udphop && typeof this.udphop.normalize === 'function') {
      this.udphop = this.udphop.normalize();
    }

    return isObjectEmpty(this) ? undefined : this;
  };
}
