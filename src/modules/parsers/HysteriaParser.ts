import { XrayParsedUrlObject, XrayStreamSettingsObject, XrayStreamTlsSettingsObject } from '../CommonObjects';
import { XrayOutboundObject, XrayHysteriaOutboundObject } from '../OutboundObjects';
import { XrayStreamHysteriaSettingsObject, XraySalamanderObject } from '../TransportObjects';

export default function HysteriaParser(parsedObj: XrayParsedUrlObject): XrayOutboundObject<XrayHysteriaOutboundObject> | null {
  // Support both hy2:// (Hysteria 2) and hysteria://
  if (parsedObj.protocol !== 'hy2' && parsedObj.protocol !== 'hysteria') return null;

  const proxy = new XrayOutboundObject<XrayHysteriaOutboundObject>();
  proxy.tag = parsedObj.tag;
  proxy.protocol = 'hysteria';
  proxy.settings = new XrayHysteriaOutboundObject();
  proxy.settings.address = parsedObj.server;
  proxy.settings.port = parsedObj.port;

  // Determine version from protocol (hy2:// = version 2, hysteria:// could be version 1)
  if (parsedObj.protocol === 'hy2') {
    proxy.settings.version = 2;
  } else if (parsedObj.parsedParams.version) {
    proxy.settings.version = parseInt(parsedObj.parsedParams.version);
  }

  // Initialize stream settings with hysteria network
  proxy.streamSettings = new XrayStreamSettingsObject();
  proxy.streamSettings.network = 'hysteria';
  proxy.streamSettings.hysteriaSettings = new XrayStreamHysteriaSettingsObject();

  // Set version in hysteria settings as well
  if (proxy.settings.version) {
    proxy.streamSettings.hysteriaSettings.version = proxy.settings.version;
  }

  // Auth string (from password part of URL or auth parameter)
  // For Hysteria, if uuid contains username:password format, extract only the password
  let auth = parsedObj.parsedParams.auth || parsedObj.parsedParams.password || parsedObj.uuid;
  if (auth && auth.includes(':')) {
    // Extract password portion from username:password format
    auth = auth.split(':')[1];
  }
  if (auth) {
    proxy.streamSettings.hysteriaSettings.auth = auth;
  }

  // Congestion control
  if (parsedObj.parsedParams.congestion) {
    proxy.streamSettings.hysteriaSettings.congestion = parsedObj.parsedParams.congestion;
  }

  // Bandwidth settings
  if (parsedObj.parsedParams.up || parsedObj.parsedParams.upmbps) {
    proxy.streamSettings.hysteriaSettings.up = parsedObj.parsedParams.up || parsedObj.parsedParams.upmbps;
  }
  if (parsedObj.parsedParams.down || parsedObj.parsedParams.downmbps) {
    proxy.streamSettings.hysteriaSettings.down = parsedObj.parsedParams.down || parsedObj.parsedParams.downmbps;
  }

  // TLS settings
  const insecure = parsedObj.parsedParams.insecure === '1' || parsedObj.parsedParams.insecure === 'true';
  const sni = parsedObj.parsedParams.sni || parsedObj.parsedParams.peer;
  const alpn = parsedObj.parsedParams.alpn;
  const pinSHA256 = parsedObj.parsedParams.pinSHA256;

  if (sni || insecure || alpn || pinSHA256) {
    proxy.streamSettings.security = 'tls';
    proxy.streamSettings.tlsSettings = new XrayStreamTlsSettingsObject();

    if (sni) {
      proxy.streamSettings.tlsSettings.serverName = sni;
    }
    if (insecure) {
      proxy.streamSettings.tlsSettings.allowInsecure = true;
    }
    if (alpn) {
      // ALPN can be comma-separated
      proxy.streamSettings.tlsSettings.alpn = alpn.split(',').map((a: string) => a.trim());
    }
    if (pinSHA256) {
      // pinSHA256 can be comma-separated for multiple pins
      proxy.streamSettings.tlsSettings.pinnedPeerCertificateSha256 = pinSHA256.split(',').map((p: string) => p.trim());
    }
  }

  // Obfuscation (Salamander)
  const obfs = parsedObj.parsedParams.obfs;
  const obfsPassword = parsedObj.parsedParams['obfs-password'] || parsedObj.parsedParams.obfsPassword;

  if (obfs === 'salamander' && obfsPassword) {
    const salamander = new XraySalamanderObject();
    salamander.password = obfsPassword;
    proxy.streamSettings.udpmasks = [salamander];
  }

  return proxy;
}
