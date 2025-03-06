import { XrayParsedUrlObject, XrayProtocol, XrayShadowsocksServerObject, XrayStreamSettingsObject } from "../CommonObjects";
import { XrayOutboundObject, XrayShadowsocksOutboundObject } from "../OutboundObjects";

const ShadowsocksParser = (parsedObj: XrayParsedUrlObject): XrayOutboundObject<XrayShadowsocksOutboundObject> | null => {
  const proxy = new XrayOutboundObject<XrayShadowsocksOutboundObject>();
  proxy.tag = parsedObj.tag;
  proxy.settings = new XrayShadowsocksOutboundObject();
  proxy.protocol = XrayProtocol.SHADOWSOCKS;

  proxy.streamSettings = new XrayStreamSettingsObject();
  proxy.streamSettings.network = parsedObj.network;
  proxy.streamSettings.security = parsedObj.security;

  proxy.settings.servers = [];
  const server = new XrayShadowsocksServerObject();
  server.method = parsedObj.parsedParams.method ?? "none";
  server.password = parsedObj.parsedParams.pass ?? "";
  server.address = parsedObj.server;
  server.port = parsedObj.port;
  server.email = parsedObj.tag;
  proxy.settings.servers.push(server);
  return proxy;
};

export default ShadowsocksParser;
