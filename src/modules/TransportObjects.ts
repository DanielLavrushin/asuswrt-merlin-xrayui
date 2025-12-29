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
  static modes = ['auto', 'packet-up', 'stream-up', 'stream-one'];
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
    this.headers = isObjectEmpty(this.headers) ? undefined : this.headers;
    this.extra = plainToInstance(XrayXhttpExtraObject, this.extra ?? {});
    this.extra = this.extra ? this.extra.normalize() : undefined;

    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayXhttpDownloadSettingsObject {
  public address?: string;
  public port?: number = 443;
  public network?: string = 'xhttp';
  public security?: string = 'tls';
  public tlsSettings?: XrayStreamTlsSettingsObject;
  public realitySettings?: XrayStreamRealitySettingsObject;
  public xhttpSettings?: XrayXhttpDownloadXhttpSettingsObject;
  public sockopt?: XraySockoptObject;

  normalize = (): this | undefined => {
    this.address = !this.address || this.address === '' ? undefined : this.address;
    this.port = !this.port || this.port === 443 ? undefined : this.port;
    // network must always be "xhttp" per XHTTP spec - cannot be omitted
    this.network = 'xhttp';
    this.security = !this.security || this.security === '' ? undefined : this.security;

    if (this.tlsSettings && typeof this.tlsSettings.normalize === 'function') {
      this.tlsSettings = this.tlsSettings.normalize();
    }
    if (!this.tlsSettings || isObjectEmpty(this.tlsSettings)) {
      this.tlsSettings = undefined;
    }

    if (this.realitySettings && typeof this.realitySettings.normalize === 'function') {
      this.realitySettings = this.realitySettings.normalize();
    }
    if (!this.realitySettings || isObjectEmpty(this.realitySettings)) {
      this.realitySettings = undefined;
    }

    if (this.xhttpSettings && typeof this.xhttpSettings.normalize === 'function') {
      this.xhttpSettings = this.xhttpSettings.normalize();
    }
    if (!this.xhttpSettings || isObjectEmpty(this.xhttpSettings)) {
      this.xhttpSettings = undefined;
    }

    if (this.sockopt && typeof this.sockopt.normalize === 'function') {
      this.sockopt = this.sockopt.normalize();
    }
    if (!this.sockopt || isObjectEmpty(this.sockopt)) {
      this.sockopt = undefined;
    }

    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayXhttpDownloadXhttpSettingsObject {
  public host?: string;
  public path?: string = '/';
  public mode?: string = 'auto';
  public extra?: XrayXhttpDownloadExtraObject;

  normalize = (): this | undefined => {
    this.host = !this.host || this.host === '' ? undefined : this.host;
    this.path = this.path === '/' ? undefined : this.path;
    this.mode = this.mode === 'auto' ? undefined : this.mode;
    if (this.extra) {
      this.extra = plainToInstance(XrayXhttpDownloadExtraObject, this.extra);
      this.extra = this.extra.normalize();
    }
    return isObjectEmpty(this) ? undefined : this;
  };
}

export class XrayXhttpDownloadExtraObject {
  xPaddingBytes?: string = '100-1000';
  noSSEHeader?: boolean = false;
  xmux?: XrayXmuxObject;

  normalize = (): this | undefined => {
    this.xPaddingBytes = this.xPaddingBytes === '100-1000' ? undefined : this.xPaddingBytes;
    this.noSSEHeader = !this.noSSEHeader ? undefined : this.noSSEHeader;
    if (this.xmux) {
      this.xmux = plainToInstance(XrayXmuxObject, this.xmux);
      this.xmux = this.xmux.normalize();
    }
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
  downloadSettings?: XrayXhttpDownloadSettingsObject;

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
    if (this.downloadSettings) {
      this.downloadSettings = plainToInstance(XrayXhttpDownloadSettingsObject, this.downloadSettings);
      this.downloadSettings = this.downloadSettings.normalize();
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
