import { XrayVlessClientObject } from "../ClientsObjects";
import { XrayParsedUrlObject, XrayProtocol, XrayStreamSettingsObject } from "../CommonObjects";
import { XrayOutboundObject, XrayVlessOutboundObject } from "../OutboundObjects";

const VlessParser = (parsedObj: XrayParsedUrlObject): XrayOutboundObject<XrayVlessOutboundObject> | null => {
  if (parsedObj.protocol !== "vless") return null;
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

  const user = new XrayVlessClientObject();
  user.id = parsedObj.uuid;
  user.flow = parsedObj.parsedParams.flow;
  user.encryption = parsedObj.parsedParams.encryption ?? "none";
  user.email = parsedObj.parsedParams.email ?? "user-" + parsedObj.protocol;
  if (proxy.settings.vnext[0].users) proxy.settings.vnext[0].users.push(user);

  return proxy;
};

export default VlessParser;
