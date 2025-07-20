import { XrayHeaderObject, XrayParsedUrlObject } from './CommonObjects';
import {
  XrayStreamGrpcSettingsObject,
  XrayStreamHttpSettingsObject,
  XrayStreamHttpUpgradeSettingsObject,
  XrayStreamKcpSettingsObject,
  XrayStreamSplitHttpSettingsObject,
  XrayStreamTcpSettingsObject,
  XrayStreamWsSettingsObject,
  XrayXhttpExtraObject
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
        expect(http.extra).toBeDefined();
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

    describe('XrayXhttpExtraObject', () => {
      it('delegates normalize to xmux', () => {
        const extra = new XrayXhttpExtraObject();
        const mockXmux = { normalize: jest.fn(() => undefined) } as any;
        extra.xmux = mockXmux;
        extra.normalize();
        expect(mockXmux.normalize).toHaveBeenCalledTimes(1);
        expect(extra.xmux).toBeUndefined();
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
});
