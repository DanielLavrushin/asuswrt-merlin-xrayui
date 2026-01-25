import { XrayParsedUrlObject, XrayStreamSettingsObject, XrayStreamTlsSettingsObject } from '../CommonObjects';
import { XrayOutboundObject, XrayHysteriaOutboundObject } from '../OutboundObjects';
import { XrayStreamHysteriaSettingsObject, XrayFinalMaskObject, XraySalamanderObject } from '../TransportObjects';

export default function HysteriaParser(parsedObj: XrayParsedUrlObject): XrayOutboundObject<XrayHysteriaOutboundObject> | null {
  if (parsedObj.protocol !== 'hy2' && parsedObj.protocol !== 'hysteria2' && parsedObj.protocol !== 'hysteria') return null;

  const proxy = new XrayOutboundObject<XrayHysteriaOutboundObject>();
  proxy.tag = parsedObj.tag;
  proxy.protocol = 'hysteria';
  proxy.settings = new XrayHysteriaOutboundObject();
  proxy.settings.address = parsedObj.server;
  proxy.settings.port = parsedObj.port;

  if (parsedObj.protocol === 'hy2' || parsedObj.protocol === 'hysteria2') {
    proxy.settings.version = 2;
  } else if (parsedObj.parsedParams.version) {
    proxy.settings.version = parseInt(parsedObj.parsedParams.version);
  }

  proxy.streamSettings = new XrayStreamSettingsObject();
  proxy.streamSettings.network = 'hysteria';
  proxy.streamSettings.hysteriaSettings = new XrayStreamHysteriaSettingsObject();

  if (proxy.settings.version) {
    proxy.streamSettings.hysteriaSettings.version = proxy.settings.version;
  }

  let auth = parsedObj.parsedParams.auth || parsedObj.parsedParams.password || parsedObj.uuid;
  if (auth && auth.includes(':')) {
    auth = auth.split(':')[1];
  }
  if (auth) {
    proxy.streamSettings.hysteriaSettings.auth = auth;
  }

  if (parsedObj.parsedParams.congestion) {
    proxy.streamSettings.hysteriaSettings.congestion = parsedObj.parsedParams.congestion;
  }

  if (parsedObj.parsedParams.up || parsedObj.parsedParams.upmbps) {
    proxy.streamSettings.hysteriaSettings.up = parsedObj.parsedParams.up || parsedObj.parsedParams.upmbps;
  }
  if (parsedObj.parsedParams.down || parsedObj.parsedParams.downmbps) {
    proxy.streamSettings.hysteriaSettings.down = parsedObj.parsedParams.down || parsedObj.parsedParams.downmbps;
  }

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
      proxy.streamSettings.tlsSettings.alpn = alpn.split(',').map((a: string) => a.trim());
    }
    if (pinSHA256) {
      proxy.streamSettings.tlsSettings.pinnedPeerCertificateSha256 = pinSHA256.split(',').map((p: string) => p.trim());
    }
  }

  const obfs = parsedObj.parsedParams.obfs;
  const obfsPassword = parsedObj.parsedParams['obfs-password'] || parsedObj.parsedParams.obfsPassword;

  if (obfs === 'salamander' && obfsPassword) {
    const finalMask = new XrayFinalMaskObject();
    finalMask.settings = new XraySalamanderObject();
    finalMask.settings.password = obfsPassword;
    proxy.streamSettings.udpmasks = [finalMask];
  }

  return proxy;
}
