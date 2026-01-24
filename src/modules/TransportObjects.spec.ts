import { XrayHeaderObject, XrayParsedUrlObject } from './CommonObjects';
import {
  XrayStreamGrpcSettingsObject,
  XrayStreamHttpSettingsObject,
  XrayStreamHttpUpgradeSettingsObject,
  XrayStreamKcpSettingsObject,
  XrayStreamSplitHttpSettingsObject,
  XrayStreamTcpSettingsObject,
  XrayStreamWsSettingsObject,
  XrayXhttpExtraObject,
  XrayDownloadSettingsObject,
  XraySalamanderObject,
  XrayFinalMaskObject,
  XrayStreamHysteriaSettingsObject,
  XrayUdpHopObject
} from './TransportObjects';

describe('TransportObjects', () => {
  let obj: XrayStreamKcpSettingsObject;
  beforeEach(() => {
    jest.clearAllMocks();
    obj = new XrayStreamKcpSettingsObject();
  });

  it('should parse XrayStreamKcpSettingsObject from parsed URL object', () => {
    const url = 'vless://00000000-0000-0000-0000-000000000000@test_domain.name:12422?type=kcp&headerType=none&headerType=wechat-video&seed=fake_seed&security=none#proxy';
    const parsedObject = new XrayParsedUrlObject(url);
    obj = new XrayStreamKcpSettingsObject(parsedObject);
    expect(obj.seed).toBe('fake_seed');
    expect(obj.header?.type).toBe('wechat-video');
  });

  it('should normalize XrayStreamKcpSettingsObject', () => {
    obj.normalize();

    expect(obj.mtu).toBeUndefined();
    expect(obj.tti).toBeUndefined();
    expect(obj.uplinkCapacity).toBeUndefined();
    expect(obj.downlinkCapacity).toBeUndefined();
    expect(obj.congestion).toBeUndefined();
    expect(obj.readBufferSize).toBeUndefined();
    expect(obj.writeBufferSize).toBeUndefined();
    expect(obj.seed).toBeUndefined();
    expect(obj.header).toBeUndefined();

    obj.mtu = 1450;
    obj.tti = 60;
    obj.uplinkCapacity = 10;
    obj.downlinkCapacity = 30;
    obj.congestion = true;
    obj.readBufferSize = 4;
    obj.writeBufferSize = 4;
    obj.seed = 'test-seed';

    obj.normalize();

    expect(obj.mtu).toBe(1450);
    expect(obj.tti).toBe(60);
    expect(obj.uplinkCapacity).toBe(10);
    expect(obj.downlinkCapacity).toBe(30);
    expect(obj.congestion).toBe(true);
    expect(obj.readBufferSize).toBe(4);
    expect(obj.writeBufferSize).toBe(4);
    expect(obj.seed).toBe('test-seed');
  });

  describe('XrayStreamTcpSettingsObject', () => {
    let tcpSettings: XrayStreamTcpSettingsObject;

    beforeEach(() => {
      tcpSettings = new XrayStreamTcpSettingsObject();
    });

    it('should normalize XrayStreamTcpSettingsObject', () => {
      tcpSettings.acceptProxyProtocol = true;

      tcpSettings.normalize();

      expect(tcpSettings.acceptProxyProtocol).toBe(true);
      tcpSettings.acceptProxyProtocol = false;
      tcpSettings.normalize();
      expect(tcpSettings.acceptProxyProtocol).toBeUndefined();
    });
  });

  describe('XrayStreamWsSettingsObject', () => {
    let wsSettings: XrayStreamWsSettingsObject;

    beforeEach(() => {
      wsSettings = new XrayStreamWsSettingsObject();
    });

    it('should parse XrayStreamWsSettingsObject from parsed URL object', () => {
      const url = 'vless://00000000-0000-0000-0000-000000000000@test_domain.name:12422?type=ws&path=/test&host=test_domain.name';
      const parsedObject = new XrayParsedUrlObject(url);
      wsSettings = new XrayStreamWsSettingsObject(parsedObject);
      expect(wsSettings.path).toBe('/test');
      expect(wsSettings.host).toBe('test_domain.name');
    });

    it('should normalize XrayStreamWsSettingsObject', () => {
      wsSettings.path = '/test';
      wsSettings.host = 'test_domain.name';
      wsSettings.acceptProxyProtocol = true;
      wsSettings.headers = { 'User-Agent': 'Xray' };

      wsSettings.normalize();

      expect(wsSettings.path).toBe('/test');
      expect(wsSettings.host).toBe('test_domain.name');
      expect(wsSettings.acceptProxyProtocol).toBe(true);
      expect(wsSettings.headers).toEqual({ 'User-Agent': 'Xray' });

      wsSettings.path = '/';
      wsSettings.host = undefined;
      wsSettings.acceptProxyProtocol = false;
      wsSettings.headers = {};

      wsSettings.normalize();

      expect(wsSettings.path).toBeUndefined();
      expect(wsSettings.host).toBeUndefined();
      expect(wsSettings.acceptProxyProtocol).toBeUndefined();
      expect(wsSettings.headers).toBeUndefined();
    });
  });

  describe('Additional TransportObjects coverage', () => {
    describe('XrayStreamHttpSettingsObject', () => {
      let http: XrayStreamHttpSettingsObject;

      beforeEach(() => {
        http = new XrayStreamHttpSettingsObject();
      });

      it('normalizes default values away', () => {
        http.normalize();
        expect(http.path).toBeUndefined();
        expect(http.host).toBeUndefined();
        expect(http.extra).toBeUndefined();
      });

      it('retains custom values after normalize', () => {
        http.path = '/custom';
        http.host = 'example.com';
        http.mode = 'stream-one';
        http.normalize();
        expect(http.path).toBe('/custom');
        expect(http.host).toBe('example.com');
        expect(http.mode).toBe('stream-one');
      });
    });

    describe('XrayStreamGrpcSettingsObject', () => {
      it('normalize returns the same instance', () => {
        const grpc = new XrayStreamGrpcSettingsObject();
        const result = grpc.normalize();
        expect(result).toBe(grpc);
      });
    });

    describe('XrayStreamHttpUpgradeSettingsObject', () => {
      it('normalize is idempotent', () => {
        const upgrade = new XrayStreamHttpUpgradeSettingsObject();
        upgrade.acceptProxyProtocol = true;
        const result = upgrade.normalize();
        expect(result).toBe(upgrade);
        expect(upgrade.acceptProxyProtocol).toBe(true);
      });
    });

    describe('XrayStreamSplitHttpSettingsObject', () => {
      it('normalize is a no‑op that returns the same object', () => {
        const split = new XrayStreamSplitHttpSettingsObject();
        split.host = 'split.host';
        const result = split.normalize();
        expect(result).toBe(split);
        expect(split.host).toBe('split.host');
      });
    });
  });

  describe('normalize emptiness checks', () => {
    describe('XrayStreamTcpSettingsObject', () => {
      it('returns undefined when empty', () => {
        const tcp = new XrayStreamTcpSettingsObject();
        expect(tcp.normalize()).toBeUndefined();
      });

      it('returns self when not empty', () => {
        const tcp = new XrayStreamTcpSettingsObject();
        tcp.acceptProxyProtocol = true;
        expect(tcp.normalize()).toBe(tcp);
      });
    });

    describe('XrayStreamWsSettingsObject', () => {
      it('returns undefined when empty', () => {
        const ws = new XrayStreamWsSettingsObject();
        expect(ws.normalize()).toBeUndefined();
      });

      it('returns self when path/host set', () => {
        const ws = new XrayStreamWsSettingsObject();
        ws.path = '/custom';
        ws.host = 'ws.host';
        expect(ws.normalize()).toBe(ws);
      });
    });

    describe('XrayStreamKcpSettingsObject', () => {
      it('returns undefined when header type is none and everything else default', () => {
        const kcp = new XrayStreamKcpSettingsObject();
        kcp.header = new XrayHeaderObject();
        kcp.header.type = 'none';
        expect(kcp.normalize()).toBeUndefined();
      });

      it('returns self when any field deviates from default', () => {
        const kcp = new XrayStreamKcpSettingsObject();
        kcp.mtu = 1400;
        expect(kcp.normalize()).toBe(kcp);
      });
    });
  });

  describe('XrayDownloadSettingsObject', () => {
    it('returns undefined when address is empty', () => {
      const download = new XrayDownloadSettingsObject();
      expect(download.normalize()).toBeUndefined();
    });

    it('returns undefined when address is empty string', () => {
      const download = new XrayDownloadSettingsObject();
      download.address = '';
      expect(download.normalize()).toBeUndefined();
    });

    it('returns self when address is set', () => {
      const download = new XrayDownloadSettingsObject();
      download.address = 'example.com';
      expect(download.normalize()).toBe(download);
    });

    it('clears port when falsy', () => {
      const download = new XrayDownloadSettingsObject();
      download.address = 'example.com';
      download.port = 0;
      download.normalize();
      expect(download.port).toBeUndefined();
    });

    it('retains port when set', () => {
      const download = new XrayDownloadSettingsObject();
      download.address = 'example.com';
      download.port = 443;
      download.normalize();
      expect(download.port).toBe(443);
    });

    it('clears realitySettings when security is tls', () => {
      const download = new XrayDownloadSettingsObject();
      download.address = 'example.com';
      download.security = 'tls';
      download.realitySettings = {} as any;
      download.normalize();
      expect(download.realitySettings).toBeUndefined();
    });

    it('clears tlsSettings when security is reality', () => {
      const download = new XrayDownloadSettingsObject();
      download.address = 'example.com';
      download.security = 'reality';
      download.tlsSettings = {} as any;
      download.normalize();
      expect(download.tlsSettings).toBeUndefined();
    });

    it('clears both tls and reality settings when security is neither', () => {
      const download = new XrayDownloadSettingsObject();
      download.address = 'example.com';
      download.security = 'none';
      download.tlsSettings = {} as any;
      download.realitySettings = {} as any;
      download.normalize();
      expect(download.tlsSettings).toBeUndefined();
      expect(download.realitySettings).toBeUndefined();
    });
  });

  describe('XraySalamanderObject', () => {
    it('returns undefined when password is empty', () => {
      const salamander = new XraySalamanderObject();
      expect(salamander.normalize()).toBeUndefined();
    });

    it('returns undefined when password is empty string', () => {
      const salamander = new XraySalamanderObject();
      salamander.password = '';
      expect(salamander.normalize()).toBeUndefined();
    });

    it('returns self when password is set', () => {
      const salamander = new XraySalamanderObject();
      salamander.password = 'secret';
      expect(salamander.normalize()).toBe(salamander);
      expect(salamander.password).toBe('secret');
    });
  });

  describe('XrayFinalMaskObject', () => {
    it('has default type of salamander', () => {
      const mask = new XrayFinalMaskObject();
      expect(mask.type).toBe('salamander');
    });

    it('returns undefined when settings is undefined', () => {
      const mask = new XrayFinalMaskObject();
      expect(mask.normalize()).toBeUndefined();
    });

    it('returns undefined when settings normalizes to undefined', () => {
      const mask = new XrayFinalMaskObject();
      mask.settings = new XraySalamanderObject();
      mask.settings.password = '';
      expect(mask.normalize()).toBeUndefined();
    });

    it('returns self when settings has valid password', () => {
      const mask = new XrayFinalMaskObject();
      mask.settings = new XraySalamanderObject();
      mask.settings.password = 'secret';
      expect(mask.normalize()).toBe(mask);
      expect(mask.settings?.password).toBe('secret');
    });

    it('produces correct JSON structure for Xray-core', () => {
      const mask = new XrayFinalMaskObject();
      mask.settings = new XraySalamanderObject();
      mask.settings.password = 'mypassword';
      mask.normalize();

      const json = JSON.parse(JSON.stringify(mask));
      expect(json).toEqual({
        type: 'salamander',
        settings: {
          password: 'mypassword'
        }
      });
    });
  });

  describe('XrayUdpHopObject', () => {
    it('returns undefined when empty', () => {
      const hop = new XrayUdpHopObject();
      hop.interval = undefined;
      expect(hop.normalize()).toBeUndefined();
    });

    it('clears default interval of 30', () => {
      const hop = new XrayUdpHopObject();
      hop.port = '10000-20000';
      expect(hop.interval).toBe(30);
      hop.normalize();
      expect(hop.interval).toBeUndefined();
    });

    it('retains non-default interval', () => {
      const hop = new XrayUdpHopObject();
      hop.port = '10000-20000';
      hop.interval = 60;
      hop.normalize();
      expect(hop.interval).toBe(60);
    });

    it('clears empty port string', () => {
      const hop = new XrayUdpHopObject();
      hop.port = '';
      hop.normalize();
      expect(hop.port).toBeUndefined();
    });

    it('retains valid port range', () => {
      const hop = new XrayUdpHopObject();
      hop.port = '10000-20000';
      hop.normalize();
      expect(hop.port).toBe('10000-20000');
    });
  });

  describe('XrayStreamHysteriaSettingsObject', () => {
    it('has correct defaults', () => {
      const hysteria = new XrayStreamHysteriaSettingsObject();
      expect(hysteria.version).toBe(2);
      expect(hysteria.congestion).toBe('');
    });

    it('has correct congestion options', () => {
      expect(XrayStreamHysteriaSettingsObject.congestionOptions).toEqual([
        '',
        'reno',
        'bbr',
        'brutal',
        'force-brutal'
      ]);
    });

    it('clears empty string fields on normalize', () => {
      const hysteria = new XrayStreamHysteriaSettingsObject();
      hysteria.auth = '';
      hysteria.congestion = '';
      hysteria.up = '';
      hysteria.down = '';
      hysteria.normalize();
      expect(hysteria.auth).toBeUndefined();
      expect(hysteria.congestion).toBeUndefined();
      expect(hysteria.up).toBeUndefined();
      expect(hysteria.down).toBeUndefined();
    });

    it('retains non-empty fields', () => {
      const hysteria = new XrayStreamHysteriaSettingsObject();
      hysteria.auth = 'password123';
      hysteria.congestion = 'bbr';
      hysteria.up = '100';
      hysteria.down = '200';
      hysteria.normalize();
      expect(hysteria.auth).toBe('password123');
      expect(hysteria.congestion).toBe('bbr');
      expect(hysteria.up).toBe('100');
      expect(hysteria.down).toBe('200');
    });

    it('normalizes udphop when present', () => {
      const hysteria = new XrayStreamHysteriaSettingsObject();
      hysteria.udphop = new XrayUdpHopObject();
      hysteria.udphop.port = '10000-20000';
      hysteria.udphop.interval = 30;
      hysteria.normalize();
      expect(hysteria.udphop?.port).toBe('10000-20000');
      expect(hysteria.udphop?.interval).toBeUndefined();
    });

    it('clears udphop when it normalizes to undefined', () => {
      const hysteria = new XrayStreamHysteriaSettingsObject();
      hysteria.udphop = new XrayUdpHopObject();
      hysteria.udphop.port = '';
      hysteria.udphop.interval = undefined;
      hysteria.normalize();
      expect(hysteria.udphop).toBeUndefined();
    });
  });
});
