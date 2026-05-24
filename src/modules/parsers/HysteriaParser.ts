import { XrayParsedUrlObject, XrayStreamSettingsObject, XrayStreamTlsSettingsObject } from '../CommonObjects';
import { XrayOutboundObject, XrayHysteriaOutboundObject } from '../OutboundObjects';
import { XrayStreamHysteriaSettingsObject, XrayFinalMaskObject, XrayFinalMaskSettingsObject, XrayQuicParamsObject, XraySalamanderObject } from '../TransportObjects';

// Xray 26.3.27+ expects brutal bandwidth strings like "100 mbps".
// URL convention: `up`/`down`/`upmbps`/`downmbps` carry a bare number in mbps.
function toBrutalBandwidth(raw: string): string {
  return /\D/.test(raw) ? raw : `${raw} mbps`;
}

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
  if (auth) {
    try {
      auth = decodeURIComponent(auth);
    } catch {
      // keep raw value if not a valid percent-encoded string
    }
    proxy.streamSettings.hysteriaSettings.auth = auth;
  }

  const up = parsedObj.parsedParams.up || parsedObj.parsedParams.upmbps;
  const down = parsedObj.parsedParams.down || parsedObj.parsedParams.downmbps;
  const congestion = parsedObj.parsedParams.congestion;

  if (congestion || up || down) {
    const quicParams = new XrayQuicParamsObject();
    if (congestion) quicParams.congestion = congestion;
    if (up) quicParams.brutalUp = toBrutalBandwidth(up);
    if (down) quicParams.brutalDown = toBrutalBandwidth(down);
    proxy.streamSettings.finalmask = new XrayFinalMaskSettingsObject();
    proxy.streamSettings.finalmask.quicParams = quicParams;
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
    const salamander = new XraySalamanderObject();
    salamander.password = obfsPassword;
    finalMask.settings = salamander;
    proxy.streamSettings.finalmask ??= new XrayFinalMaskSettingsObject();
    proxy.streamSettings.finalmask.udp = [finalMask];
  }

  return proxy;
}
