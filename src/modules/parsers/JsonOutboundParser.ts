import { plainToInstance } from 'class-transformer';
import { IProtocolType } from '../Interfaces';
import { migrateSplitHttpToXhttp, XrayStreamGrpcSettingsObject, XrayStreamHttpSettingsObject, XrayStreamTcpSettingsObject } from '../TransportObjects';
import { migrateRawToTcp } from '../CommonObjects';
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
    if (outbound.streamSettings) {
      migrateSplitHttpToXhttp(outbound.streamSettings);
      migrateRawToTcp(outbound.streamSettings);
      if (outbound.streamSettings.tcpSettings) {
        outbound.streamSettings.tcpSettings = plainToInstance(XrayStreamTcpSettingsObject, outbound.streamSettings.tcpSettings);
      }
      if (outbound.streamSettings.grpcSettings) {
        outbound.streamSettings.grpcSettings = plainToInstance(XrayStreamGrpcSettingsObject, outbound.streamSettings.grpcSettings);
      }
      if (outbound.streamSettings.xhttpSettings) {
        outbound.streamSettings.xhttpSettings = XrayStreamHttpSettingsObject.fromPlain(outbound.streamSettings.xhttpSettings);
      }
    }
  }

  return outbound;
};

export default parseJsonOutbound;
