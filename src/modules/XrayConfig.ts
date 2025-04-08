import { reactive } from 'vue';
import { IProtocolType } from './Interfaces';
import { XrayDnsObject, XrayRoutingObject, XrayLogObject, XrayProtocolOption, XrayReverseObject } from './CommonObjects';
import { XrayInboundObject } from './InboundObjects';
import { XrayOutboundObject } from './OutboundObjects';
import { XrayProtocol, XrayProtocolMode } from './Options';

export class XrayObject {
  public log?: XrayLogObject = new XrayLogObject();
  public dns?: XrayDnsObject = new XrayDnsObject();
  public inbounds: XrayInboundObject<IProtocolType>[] = [];
  public outbounds: XrayOutboundObject<IProtocolType>[] = [];
  public routing?: XrayRoutingObject = new XrayRoutingObject();
  public reverse?: XrayReverseObject = new XrayReverseObject();
}

export const xrayProtocols: XrayProtocolOption[] = [
  {
    protocol: XrayProtocol.DOKODEMODOOR,
    modes: XrayProtocolMode.Inbound | XrayProtocolMode.BothModes
  },
  {
    protocol: XrayProtocol.HTTP,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.BothModes
  },
  {
    protocol: XrayProtocol.SHADOWSOCKS,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.BothModes
  },
  {
    protocol: XrayProtocol.SOCKS,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.BothModes
  },
  {
    protocol: XrayProtocol.TROJAN,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.ServerMode
  },
  {
    protocol: XrayProtocol.VLESS,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.ServerMode
  },
  {
    protocol: XrayProtocol.VMESS,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.ServerMode
  },
  {
    protocol: XrayProtocol.WIREGUARD,
    modes: XrayProtocolMode.TwoWays | XrayProtocolMode.ServerMode
  },
  {
    protocol: XrayProtocol.FREEDOM,
    modes: XrayProtocolMode.Outbound | XrayProtocolMode.BothModes
  },
  {
    protocol: XrayProtocol.BLACKHOLE,
    modes: XrayProtocolMode.Outbound | XrayProtocolMode.BothModes
  },
  {
    protocol: XrayProtocol.LOOPBACK,
    modes: XrayProtocolMode.Outbound | XrayProtocolMode.BothModes
  },
  {
    protocol: XrayProtocol.DNS,
    modes: XrayProtocolMode.Outbound | XrayProtocolMode.BothModes
  }
];

let xrayConfig = reactive(new XrayObject());
export default xrayConfig;
export { xrayConfig };
