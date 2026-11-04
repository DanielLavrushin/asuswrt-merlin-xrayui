import { XrayParsedUrlObject, XrayShadowsocksServerObject, XrayStreamSettingsObject } from '../CommonObjects';
import { isShadowsocksPlainCipher, XrayProtocol } from '../Options';
import { XrayOutboundObject, XrayShadowsocksOutboundObject } from '../OutboundObjects';
import { ApplyCheckError } from '../ApplyChecks';
import { coreSupports } from '../CoreVersion';

export default function ShadowsocksParser(parsedObj: XrayParsedUrlObject): XrayOutboundObject<XrayShadowsocksOutboundObject> | null {
  const method = parsedObj.parsedParams.method ?? 'none';
  // Xray 26.7.11 and later do not start with an unencrypted Shadowsocks outbound.
  if (isShadowsocksPlainCipher(method) && !coreSupports('ssPlainCipher')) {
    throw new ApplyCheckError('error_link_ss_plain_cipher', { tag: parsedObj.tag, method });
  }

  const proxy = new XrayOutboundObject<XrayShadowsocksOutboundObject>();
  proxy.tag = parsedObj.tag;
  proxy.settings = new XrayShadowsocksOutboundObject();
  proxy.protocol = XrayProtocol.SHADOWSOCKS;

  proxy.streamSettings = new XrayStreamSettingsObject();
  proxy.streamSettings.network = parsedObj.network;
  proxy.streamSettings.security = parsedObj.security;

  proxy.settings.servers = [];
  const server = new XrayShadowsocksServerObject();
  server.method = method;
  server.password = parsedObj.parsedParams.pass ?? '';
  server.address = parsedObj.server;
  server.port = parsedObj.port;
  server.email = parsedObj.tag;
  proxy.settings.servers.push(server);
  return proxy;
}
