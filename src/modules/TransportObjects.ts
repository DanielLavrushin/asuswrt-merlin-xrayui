import { XrayHeaderObject, XrayParsedUrlObject, XrayXmuxObject } from "./CommonObjects";
import { ITransportNetwork } from "./Interfaces";

class XrayStreamTcpSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol: boolean = false;
}

class XrayStreamKcpSettingsObject implements ITransportNetwork {
  public mtu = 1350;
  public tti = 50;
  public uplinkCapacity = 5;
  public downlinkCapacity = 20;
  public congestion = false;
  public readBufferSize = 2;
  public writeBufferSize = 2;
  public seed?: string;
  public header: XrayHeaderObject = new XrayHeaderObject();
}

class XrayStreamWsSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol = false;
  public path = "/";
  public host?: string;
  public headers: unknown = {};

  constructor(parsedObject?: XrayParsedUrlObject | undefined) {
    if (parsedObject) {
      this.path = parsedObject.parsedParams.path ?? "/";
      this.host = parsedObject.parsedParams.host;
    }
  }
}

class XrayStreamHttpSettingsObject implements ITransportNetwork {
  public host?: string[];
  public path = "/";
  public headers = {};
  public read_idle_timeout?: number;
  public health_check_timeout?: number;
  public method = "PUT";
}

class XrayStreamGrpcSettingsObject implements ITransportNetwork {
  public serviceName = "";
  public multiMode = false;
  public idle_timeout = 60;
  public health_check_timeout = 20;
  public initial_windows_size = 0;
  public permit_without_stream = false;
}

class XrayStreamHttpUpgradeSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol = false;
  public path = "/";
  public host?: string;
  public headers = {};
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
}

export { XrayStreamTcpSettingsObject, XrayStreamKcpSettingsObject, XrayStreamWsSettingsObject, XrayStreamHttpSettingsObject, XrayStreamSplitHttpSettingsObject, XrayStreamGrpcSettingsObject, XrayStreamHttpUpgradeSettingsObject };
