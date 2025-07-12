import { XrayParsedUrlObject } from './CommonObjects';
import { XrayStreamKcpSettingsObject, XrayStreamTcpSettingsObject, XrayStreamWsSettingsObject } from './TransportObjects';

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
});
