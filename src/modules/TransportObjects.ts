import { XrayHeaderObject, XrayXmuxObject } from "./CommonObjects";
import { ITransportNetwork } from "./Interfaces";

class XrayStreamTcpSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol: boolean = false;
}

class XrayStreamKcpSettingsObject implements ITransportNetwork {
  public mtu: number = 1350;
  public tti: number = 50;
  public uplinkCapacity: number = 5;
  public downlinkCapacity: number = 20;
  public congestion: boolean = false;
  public readBufferSize: number = 2;
  public writeBufferSize: number = 2;
  public seed?: string;
  public header: XrayHeaderObject = new XrayHeaderObject();
}

class XrayStreamWsSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol: boolean = false;
  public path: string = "/";
  public host?: string;
  public headers: any = {};
}

class XrayStreamHttpSettingsObject implements ITransportNetwork {
  public host?: string[];
  public path: string = "/";
  public headers: any = {};
  public read_idle_timeout?: number;
  public health_check_timeout?: number;
  public method: string = "PUT";
}

class XrayStreamGrpcSettingsObject implements ITransportNetwork {
  public serviceName: string = "";
  public multiMode: boolean = false;
  public idle_timeout: number = 60;
  public health_check_timeout: number = 20;
  public initial_windows_size: number = 0;
  public permit_without_stream: boolean = false;
}

class XrayStreamHttpUpgradeSettingsObject implements ITransportNetwork {
  public acceptProxyProtocol: boolean = false;
  public path: string = "/";
  public host?: string;
  public headers: any = {};
}

class XrayStreamSplitHttpSettingsObject implements ITransportNetwork {
  public path: string = "/";
  public host?: string;
  public headers: any = {};
  public scMaxEachPostBytes: number = 1 * 1024 * 1024;
  public scMaxConcurrentPosts?: number;
  public scMinPostsIntervalMs?: number;
  public noSSEHeader: boolean = false;
  public xmux: XrayXmuxObject = new XrayXmuxObject();
}

export { XrayStreamTcpSettingsObject, XrayStreamKcpSettingsObject, XrayStreamWsSettingsObject, XrayStreamHttpSettingsObject, XrayStreamSplitHttpSettingsObject, XrayStreamGrpcSettingsObject, XrayStreamHttpUpgradeSettingsObject };
