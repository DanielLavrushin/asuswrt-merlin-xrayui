import { XrayParsedUrlObject, XrayStreamSettingsObject, XrayTrojanServerObject } from '../CommonObjects';
import { XrayProtocol } from '../Options';
import { XrayOutboundObject, XrayTrojanOutboundObject } from '../OutboundObjects';

export default function TrojanParser(parsedObj: XrayParsedUrlObject): XrayOutboundObject<XrayTrojanOutboundObject> | null {
  if (parsedObj.protocol !== XrayProtocol.TROJAN) return null;
  const proxy = new XrayOutboundObject<XrayTrojanOutboundObject>();
  proxy.tag = parsedObj.tag;
  proxy.settings = new XrayTrojanOutboundObject();
  proxy.protocol = parsedObj.protocol;

  proxy.streamSettings = new XrayStreamSettingsObject();
  proxy.streamSettings.network = parsedObj.network;
  proxy.streamSettings.security = parsedObj.security;

  proxy.settings.servers = [];
  const server = new XrayTrojanServerObject();
  server.email = parsedObj.tag;
  server.password = parsedObj.uuid;
  server.address = parsedObj.server;
  server.port = parsedObj.port;
  proxy.settings.servers.push(server);
  return proxy;
}
