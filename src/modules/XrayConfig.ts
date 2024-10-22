import engine from "./Engine";
class XrayObject {
  public inbounds: XrayInboundObject[] = [];
  public outbounds: XrayOutboundObject[] = [];

  constructor() {
    if (this.inbounds.length === 0) {
      this.inbounds.push(new XrayInboundObject());
    }
  }
}

class XrayInboundObject {
  public port: string | undefined;
  public protocol: string | undefined;
}

class XrayOutboundObject {}

export default XrayObject;
