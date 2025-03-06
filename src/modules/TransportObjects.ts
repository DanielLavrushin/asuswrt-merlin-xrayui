import { XrayHeaderObject, XrayParsedUrlObject, XrayXmuxObject } from "./CommonObjects";
import { ITransportNetwork } from "./Interfaces";

class XrayStreamTcpSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol? = false;
  normalize = () => {
    this.acceptProxyProtocol = !this.acceptProxyProtocol ? undefined : this.acceptProxyProtocol;
  };
}

class XrayStreamKcpSettingsObject implements ITransportNetwork {
  static headerTypes = ["none", "srtp", "utp", "wechat-video", "dtls", "wireguard"];

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

  normalize = () => {
    this.mtu = this.mtu === 1350 ? undefined : this.mtu;
    this.tti = this.tti === 50 ? undefined : this.tti;
    this.uplinkCapacity = this.uplinkCapacity === 5 ? undefined : this.uplinkCapacity;
    this.downlinkCapacity = this.downlinkCapacity === 20 ? undefined : this.downlinkCapacity;
    this.congestion = !this.congestion ? undefined : this.congestion;
    this.readBufferSize = this.readBufferSize === 2 ? undefined : this.readBufferSize;
    this.writeBufferSize = this.writeBufferSize === 2 ? undefined : this.writeBufferSize;
    this.seed = !this.seed || this.seed == "" ? undefined : this.seed;
    this.header = this.header?.type === "none" ? undefined : this.header;
  };
}

class XrayStreamWsSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol = false;
  public path = "/";
  public host?: string;
  public headers: Record<string, unknown> | undefined = {};

  constructor(parsedObject?: XrayParsedUrlObject | undefined) {
    if (parsedObject) {
      this.path = parsedObject.parsedParams.path ?? "/";
      this.host = parsedObject.parsedParams.host;
    }
  }
  normalize = () => void 0;
}

class XrayStreamHttpSettingsObject implements ITransportNetwork {
  public host?: string[];
  public path = "/";
  public headers = {};
  public read_idle_timeout?: number;
  public health_check_timeout?: number;
  public method = "PUT";
  normalize = () => void 0;
}

class XrayStreamGrpcSettingsObject implements ITransportNetwork {
  public serviceName = "";
  public multiMode = false;
  public idle_timeout = 60;
  public health_check_timeout = 20;
  public initial_windows_size = 0;
  public permit_without_stream = false;
  normalize = () => void 0;
}

class XrayStreamHttpUpgradeSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol = false;
  public path = "/";
  public host?: string;
  public headers = {};
  normalize = () => void 0;
}

class XrayStreamSplitHttpSettingsObject implements ITransportNetwork {
  public path = "/";
  public host?: string;
  public headers = {};
  public scMaxEachPostBytes = 1 * 1024 * 1024;
  public scMaxConcurrentPosts?: number;
  public scMinPostsIntervalMs?: number;
  public noSSEHeader = false;
  public xmux: XrayXmuxObject = new XrayXmuxObject();
  normalize = () => void 0;
}

export { XrayStreamTcpSettingsObject, XrayStreamKcpSettingsObject, XrayStreamWsSettingsObject, XrayStreamHttpSettingsObject, XrayStreamSplitHttpSettingsObject, XrayStreamGrpcSettingsObject, XrayStreamHttpUpgradeSettingsObject };
