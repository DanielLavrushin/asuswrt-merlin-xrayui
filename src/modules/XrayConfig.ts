class XrayObject {
  public inbounds: XrayInboundObject[] = [];
  public outbounds: XrayOutboundObject[] = [];
}

class XrayInboundObject {
  public port: number | undefined;
  public protocol: string | undefined;
}

class XrayOutboundObject {}

export default XrayObject;
