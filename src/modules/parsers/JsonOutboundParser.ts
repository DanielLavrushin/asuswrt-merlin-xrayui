import { plainToInstance } from 'class-transformer';
import { IProtocolType } from '../Interfaces';
import { XrayProtocol } from '../Options';
import {
  XrayDnsOutboundObject,
  XrayHttpOutboundObject,
  XrayLoopbackOutboundObject,
  XrayOutboundObject,
  XrayShadowsocksOutboundObject,
  XraySocksOutboundObject,
  XrayTrojanOutboundObject,
  XrayVlessOutboundObject,
  XrayVmessOutboundObject,
  XrayWireguardOutboundObject
} from '../OutboundObjects';

const parseJsonOutbound = (source: XrayOutboundObject<IProtocolType>): XrayOutboundObject<IProtocolType> | null => {
  let outbound: XrayOutboundObject<IProtocolType> | null = null;

  switch (source.protocol) {
    case XrayProtocol.VMESS:
      outbound = plainToInstance(XrayOutboundObject<XrayVmessOutboundObject>, source);
      break;
    case XrayProtocol.VLESS:
      outbound = plainToInstance(XrayOutboundObject<XrayVlessOutboundObject>, source, { enableImplicitConversion: true });
      break;
    case XrayProtocol.SHADOWSOCKS:
      outbound = plainToInstance(XrayOutboundObject<XrayShadowsocksOutboundObject>, source);
      break;
    case XrayProtocol.TROJAN:
      outbound = plainToInstance(XrayOutboundObject<XrayTrojanOutboundObject>, source);
      break;
    case XrayProtocol.WIREGUARD:
      outbound = plainToInstance(XrayOutboundObject<XrayWireguardOutboundObject>, source);
      break;
    case XrayProtocol.LOOPBACK:
      outbound = plainToInstance(XrayOutboundObject<XrayLoopbackOutboundObject>, source);
      break;
    case XrayProtocol.HTTP:
      outbound = plainToInstance(XrayOutboundObject<XrayHttpOutboundObject>, source, { enableImplicitConversion: true });
      break;
    case XrayProtocol.DNS:
      outbound = plainToInstance(XrayOutboundObject<XrayDnsOutboundObject>, source);
      break;
    case XrayProtocol.SOCKS:
      outbound = plainToInstance(XrayOutboundObject<XraySocksOutboundObject>, source);
      break;
    default:
      break;
  }

  if (outbound) {
    outbound.tag = source.tag || `out-${source.protocol.toLowerCase()}`;
  }

  return outbound;
};

export default parseJsonOutbound;
