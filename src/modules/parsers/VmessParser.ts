import { XrayVmessClientObject } from '../ClientsObjects';
import { XrayParsedUrlObject, XrayStreamSettingsObject } from '../CommonObjects';
import { XrayOutboundObject, XrayVlessOutboundObject } from '../OutboundObjects';

export default function VlessParser(parsedObj: XrayParsedUrlObject): XrayOutboundObject<XrayVlessOutboundObject> | null {
  const proxy = new XrayOutboundObject<XrayVlessOutboundObject>();
  proxy.tag = parsedObj.tag;
  proxy.settings = new XrayVlessOutboundObject();
  proxy.protocol = parsedObj.protocol;
  proxy.settings.vnext[0] = {
    address: parsedObj.server,
    port: parsedObj.port,
    users: []
  };
  proxy.streamSettings = new XrayStreamSettingsObject();
  proxy.streamSettings.network = parsedObj.network;
  proxy.streamSettings.security = parsedObj.security;

  const user = new XrayVmessClientObject();
  user.id = parsedObj.uuid;
  user.email = parsedObj.parsedParams.email ?? 'user-' + parsedObj.protocol;
  // A link without "scy" means auto, as on the router; 'none' here turned off encryption on cores before 26.7.11.
  user.security = parsedObj.parsedParams.scy || undefined;
  if (proxy.settings.vnext[0].users) proxy.settings.vnext[0].users.push(user);

  return proxy;
}
