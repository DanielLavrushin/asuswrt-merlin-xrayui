import { XrayParsedUrlObject } from '../CommonObjects';
import HysteriaParser from './HysteriaParser';

describe('HysteriaParser', () => {
  describe('protocol detection', () => {
    it('returns null for non-hysteria protocols', () => {
      const url = 'vless://uuid@server:443?type=tcp#tag';
      const parsed = new XrayParsedUrlObject(url);
      expect(HysteriaParser(parsed)).toBeNull();
    });

    it('parses hy2:// protocol', () => {
      const url = 'hy2://password@server.com:443#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);
      expect(result).not.toBeNull();
      expect(result?.protocol).toBe('hysteria');
      expect(result?.settings?.version).toBe(2);
    });

    it('parses hysteria2:// protocol', () => {
      const url = 'hysteria2://password@server.com:443#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);
      expect(result).not.toBeNull();
      expect(result?.settings?.version).toBe(2);
    });

    it('parses hysteria:// protocol with version param', () => {
      const url = 'hysteria://password@server.com:443?version=2#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);
      expect(result).not.toBeNull();
      expect(result?.settings?.version).toBe(2);
    });
  });

  describe('basic parsing', () => {
    it('parses server and port', () => {
      const url = 'hy2://password@example.com:8443#mytag';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.settings?.address).toBe('example.com');
      expect(result?.settings?.port).toBe(8443);
      expect(result?.tag).toBe('mytag');
    });

    it('sets network to hysteria', () => {
      const url = 'hy2://password@server.com:443#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.network).toBe('hysteria');
      expect(result?.streamSettings?.hysteriaSettings).toBeDefined();
    });
  });

  describe('authentication', () => {
    it('parses auth from uuid field', () => {
      const url = 'hy2://mypassword@server.com:443#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.hysteriaSettings?.auth).toBe('mypassword');
    });

    it('parses auth from auth param', () => {
      const url = 'hy2://user@server.com:443?auth=secretpass#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.hysteriaSettings?.auth).toBe('secretpass');
    });

    it('parses auth from password param', () => {
      const url = 'hysteria2://user@server.com:443?password=secretpass#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.hysteriaSettings?.auth).toBe('secretpass');
    });

    it('extracts password after colon in auth', () => {
      const url = 'hysteria2://user:actualpassword@server.com:443#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.hysteriaSettings?.auth).toBe('actualpassword');
    });
  });

  describe('bandwidth settings', () => {
    it('parses up and down params', () => {
      const url = 'hysteria2://pass@server.com:443?up=100&down=200#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.hysteriaSettings?.up).toBe('100');
      expect(result?.streamSettings?.hysteriaSettings?.down).toBe('200');
    });

    it('parses upmbps and downmbps params', () => {
      const url = 'hysteria2://pass@server.com:443?upmbps=50&downmbps=100#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.hysteriaSettings?.up).toBe('50');
      expect(result?.streamSettings?.hysteriaSettings?.down).toBe('100');
    });

    it('parses congestion param', () => {
      const url = 'hysteria2://pass@server.com:443?congestion=bbr#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.hysteriaSettings?.congestion).toBe('bbr');
    });
  });

  describe('TLS settings', () => {
    it('parses sni param', () => {
      const url = 'hysteria2://pass@server.com:443?sni=example.com#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.security).toBe('tls');
      expect(result?.streamSettings?.tlsSettings?.serverName).toBe('example.com');
    });

    it('parses peer param as sni', () => {
      const url = 'hysteria2://pass@server.com:443?peer=example.com#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.tlsSettings?.serverName).toBe('example.com');
    });

    it('parses insecure=1', () => {
      const url = 'hysteria2://pass@server.com:443?insecure=1#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.security).toBe('tls');
      expect(result?.streamSettings?.tlsSettings?.allowInsecure).toBe(true);
    });

    it('parses insecure=true', () => {
      const url = 'hysteria2://pass@server.com:443?insecure=true#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.tlsSettings?.allowInsecure).toBe(true);
    });

    it('parses alpn param', () => {
      const url = 'hysteria2://pass@server.com:443?alpn=h3,h2#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.tlsSettings?.alpn).toEqual(['h3', 'h2']);
    });

    it('parses pinSHA256 param', () => {
      const url = 'hysteria2://pass@server.com:443?pinSHA256=abc123,def456#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.tlsSettings?.pinnedPeerCertificateSha256).toEqual(['abc123', 'def456']);
    });

    it('does not set TLS when no TLS params present', () => {
      const url = 'hysteria2://pass@server.com:443#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      // security defaults to 'none', not 'tls'
      expect(result?.streamSettings?.security).not.toBe('tls');
      expect(result?.streamSettings?.tlsSettings).toBeUndefined();
    });
  });

  describe('Salamander obfuscation (udpmasks)', () => {
    it('parses salamander obfuscation with obfs-password', () => {
      const url = 'hysteria2://pass@server.com:443?obfs=salamander&obfs-password=secret#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.udpmasks).toBeDefined();
      expect(result?.streamSettings?.udpmasks?.length).toBe(1);
      expect(result?.streamSettings?.udpmasks?.[0].type).toBe('salamander');
      expect(result?.streamSettings?.udpmasks?.[0].settings?.password).toBe('secret');
    });

    it('parses salamander obfuscation with obfsPassword', () => {
      const url = 'hysteria2://pass@server.com:443?obfs=salamander&obfsPassword=secret#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.udpmasks?.[0].settings?.password).toBe('secret');
    });

    it('does not set udpmasks when obfs is not salamander', () => {
      const url = 'hy2://pass@server.com:443?obfs=other&obfs-password=secret#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.udpmasks).toBeUndefined();
    });

    it('does not set udpmasks when obfs-password is missing', () => {
      const url = 'hy2://pass@server.com:443?obfs=salamander#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result?.streamSettings?.udpmasks).toBeUndefined();
    });

    it('produces correct JSON structure for Xray-core udpmasks', () => {
      const url = 'hy2://pass@server.com:443?obfs=salamander&obfs-password=mypass#proxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      const udpmasks = result?.streamSettings?.udpmasks;
      expect(udpmasks).toBeDefined();

      const json = JSON.parse(JSON.stringify(udpmasks));
      expect(json).toEqual([
        {
          type: 'salamander',
          settings: {
            password: 'mypass'
          }
        }
      ]);
    });
  });

  describe('full URL parsing', () => {
    it('parses complete hysteria2 URL with all options', () => {
      const url = 'hysteria2://myauth@proxy.example.com:8443?sni=sni.example.com&insecure=1&alpn=h3&obfs=salamander&obfs-password=obfspass&up=100&down=200&congestion=bbr#MyProxy';
      const parsed = new XrayParsedUrlObject(url);
      const result = HysteriaParser(parsed);

      expect(result).not.toBeNull();
      expect(result?.tag).toBe('MyProxy');
      expect(result?.protocol).toBe('hysteria');
      expect(result?.settings?.address).toBe('proxy.example.com');
      expect(result?.settings?.port).toBe(8443);
      expect(result?.settings?.version).toBe(2);

      expect(result?.streamSettings?.network).toBe('hysteria');
      expect(result?.streamSettings?.hysteriaSettings?.auth).toBe('myauth');
      expect(result?.streamSettings?.hysteriaSettings?.up).toBe('100');
      expect(result?.streamSettings?.hysteriaSettings?.down).toBe('200');
      expect(result?.streamSettings?.hysteriaSettings?.congestion).toBe('bbr');

      expect(result?.streamSettings?.security).toBe('tls');
      expect(result?.streamSettings?.tlsSettings?.serverName).toBe('sni.example.com');
      expect(result?.streamSettings?.tlsSettings?.allowInsecure).toBe(true);
      expect(result?.streamSettings?.tlsSettings?.alpn).toEqual(['h3']);

      expect(result?.streamSettings?.udpmasks?.[0].type).toBe('salamander');
      expect(result?.streamSettings?.udpmasks?.[0].settings?.password).toBe('obfspass');
    });
  });
});
