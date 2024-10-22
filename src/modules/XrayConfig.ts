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
  public settings: XrayInboundSettingsObject | undefined;
}

class XrayInboundSettingsObject {
  public clients: XrayInboundClientObject[] = [];

  constructor() {
    if (this.clients.length === 0) {
      this.clients.push(new XrayInboundClientObject());
    }
  }
}

class XrayInboundClientObject {
  public id: string | undefined;
  public email: string | undefined;
  public level: number | undefined;
}
class XrayOutboundObject {}

export default XrayObject;
