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
  XraySudokuObject,
  XrayFragmentObject,
  XrayNoiseObject,
  XrayNoiseItemObject,
  XrayHeaderCustomSettingsObject,
  XrayHeaderDnsObject,
  XrayMkcpAes128GcmObject,
  XrayXdnsObject,
  XrayXicmpObject,
  XrayFinalMaskObject,
  XrayFinalMaskSettingsObject,
  XrayQuicParamsObject,
  XrayQuicParamsUdpHopObject,
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

      it('clears all padding fields when xPaddingObfsMode is false (default)', () => {
        http.normalize();
        expect(http.xPaddingObfsMode).toBeUndefined();
        expect(http.xPaddingKey).toBeUndefined();
        expect(http.xPaddingHeader).toBeUndefined();
        expect(http.xPaddingPlacement).toBeUndefined();
        expect(http.xPaddingMethod).toBeUndefined();
      });

      it('retains non-default padding fields when xPaddingObfsMode is true', () => {
        http.xPaddingObfsMode = true;
        http.xPaddingKey = 'my_key';
        http.xPaddingHeader = 'My-Header';
        http.xPaddingPlacement = 'cookie';
        http.xPaddingMethod = 'tokenish';
        http.normalize();
        expect(http.xPaddingObfsMode).toBe(true);
        expect(http.xPaddingKey).toBe('my_key');
        expect(http.xPaddingHeader).toBe('My-Header');
        expect(http.xPaddingPlacement).toBe('cookie');
        expect(http.xPaddingMethod).toBe('tokenish');
      });

      it('clears default padding sub-fields even when obfs is enabled', () => {
        http.xPaddingObfsMode = true;
        http.normalize();
        expect(http.xPaddingObfsMode).toBe(true);
        expect(http.xPaddingKey).toBeUndefined();
        expect(http.xPaddingHeader).toBeUndefined();
        expect(http.xPaddingPlacement).toBeUndefined();
        expect(http.xPaddingMethod).toBeUndefined();
      });

      it('clears uplinkHTTPMethod when POST (default)', () => {
        http.normalize();
        expect(http.uplinkHTTPMethod).toBeUndefined();
      });

      it('retains non-default uplinkHTTPMethod', () => {
        http.uplinkHTTPMethod = 'PUT';
        http.normalize();
        expect(http.uplinkHTTPMethod).toBe('PUT');
      });

      it('clears sessionKey when sessionPlacement is path (default)', () => {
        http.sessionKey = 'my_session';
        http.normalize();
        expect(http.sessionPlacement).toBeUndefined();
        expect(http.sessionKey).toBeUndefined();
      });

      it('retains sessionKey when sessionPlacement is not path', () => {
        http.sessionPlacement = 'cookie';
        http.sessionKey = 'sid';
        http.normalize();
        expect(http.sessionPlacement).toBe('cookie');
        expect(http.sessionKey).toBe('sid');
      });

      it('clears seqKey when seqPlacement is path (default)', () => {
        http.seqKey = 'my_seq';
        http.normalize();
        expect(http.seqPlacement).toBeUndefined();
        expect(http.seqKey).toBeUndefined();
      });

      it('retains seqKey when seqPlacement is not path', () => {
        http.seqPlacement = 'header';
        http.seqKey = 'x-seq';
        http.normalize();
        expect(http.seqPlacement).toBe('header');
        expect(http.seqKey).toBe('x-seq');
      });

      it('clears uplinkDataPlacement when body (default)', () => {
        http.normalize();
        expect(http.uplinkDataPlacement).toBeUndefined();
      });

      it('retains non-default uplinkDataPlacement', () => {
        http.uplinkDataPlacement = 'cookie';
        http.normalize();
        expect(http.uplinkDataPlacement).toBe('cookie');
      });

      it('clears uplinkChunkSize when below minimum (64)', () => {
        http.uplinkChunkSize = 32;
        http.normalize();
        expect(http.uplinkChunkSize).toBeUndefined();
      });

      it('retains valid uplinkChunkSize', () => {
        http.uplinkChunkSize = 3072;
        http.normalize();
        expect(http.uplinkChunkSize).toBe(3072);
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
      const salamander = new XraySalamanderObject();
      salamander.password = '';
      mask.settings = salamander;
      expect(mask.normalize()).toBeUndefined();
    });

    it('returns self when settings has valid password', () => {
      const mask = new XrayFinalMaskObject();
      const salamander = new XraySalamanderObject();
      salamander.password = 'secret';
      mask.settings = salamander;
      expect(mask.normalize()).toBe(mask);
      expect((mask.settings as XraySalamanderObject)?.password).toBe('secret');
    });

    it('returns self for no-settings types without settings', () => {
      const mask = new XrayFinalMaskObject();
      mask.type = 'header-dtls';
      mask.settings = undefined;
      expect(mask.normalize()).toBe(mask);
      expect(mask.settings).toBeUndefined();
    });

    it('strips settings for no-settings types even if provided', () => {
      const mask = new XrayFinalMaskObject();
      mask.type = 'header-srtp';
      const salamander = new XraySalamanderObject();
      salamander.password = 'should-be-removed';
      mask.settings = salamander;
      mask.normalize();
      expect(mask.settings).toBeUndefined();
    });

    it('createSettings returns correct type for each mask type', () => {
      expect(XrayFinalMaskObject.createSettings('salamander')).toBeInstanceOf(XraySalamanderObject);
      expect(XrayFinalMaskObject.createSettings('sudoku')).toBeInstanceOf(XraySudokuObject);
      expect(XrayFinalMaskObject.createSettings('fragment')).toBeInstanceOf(XrayFragmentObject);
      expect(XrayFinalMaskObject.createSettings('noise')).toBeInstanceOf(XrayNoiseObject);
      expect(XrayFinalMaskObject.createSettings('header-custom')).toBeInstanceOf(XrayHeaderCustomSettingsObject);
      expect(XrayFinalMaskObject.createSettings('header-dns')).toBeInstanceOf(XrayHeaderDnsObject);
      expect(XrayFinalMaskObject.createSettings('mkcp-aes128gcm')).toBeInstanceOf(XrayMkcpAes128GcmObject);
      expect(XrayFinalMaskObject.createSettings('xdns')).toBeInstanceOf(XrayXdnsObject);
      expect(XrayFinalMaskObject.createSettings('xicmp')).toBeInstanceOf(XrayXicmpObject);
      expect(XrayFinalMaskObject.createSettings('header-dtls')).toBeUndefined();
    });

    it('produces correct JSON structure for Xray-core', () => {
      const mask = new XrayFinalMaskObject();
      const salamander = new XraySalamanderObject();
      salamander.password = 'mypassword';
      mask.settings = salamander;
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

  describe('XraySudokuObject', () => {
    it('returns undefined when password is empty', () => {
      const sudoku = new XraySudokuObject();
      expect(sudoku.normalize()).toBeUndefined();
    });

    it('returns self with only password set', () => {
      const sudoku = new XraySudokuObject();
      sudoku.password = 'secret';
      const result = sudoku.normalize();
      expect(result).toBe(sudoku);
      expect(result!.password).toBe('secret');
      expect(result!.ascii).toBeUndefined(); // default prefer_entropy is stripped
    });

    it('keeps prefer_ascii mode', () => {
      const sudoku = new XraySudokuObject();
      sudoku.password = 'secret';
      sudoku.ascii = 'prefer_ascii';
      const result = sudoku.normalize();
      expect(result!.ascii).toBe('prefer_ascii');
    });

    it('strips default prefer_entropy mode', () => {
      const sudoku = new XraySudokuObject();
      sudoku.password = 'secret';
      sudoku.ascii = 'prefer_entropy';
      const result = sudoku.normalize();
      expect(result!.ascii).toBeUndefined();
    });

    it('handles customTables', () => {
      const sudoku = new XraySudokuObject();
      sudoku.password = 'secret';
      sudoku.customTables = ['xpxvvpvv', 'vxpvxvvp'];
      const result = sudoku.normalize();
      expect(result!.customTables).toEqual(['xpxvvpvv', 'vxpvxvvp']);
    });

    it('strips empty customTables', () => {
      const sudoku = new XraySudokuObject();
      sudoku.password = 'secret';
      sudoku.customTables = ['', ''];
      const result = sudoku.normalize();
      expect(result!.customTables).toBeUndefined();
    });

    it('keeps padding values when > 0', () => {
      const sudoku = new XraySudokuObject();
      sudoku.password = 'secret';
      sudoku.paddingMin = 2;
      sudoku.paddingMax = 7;
      const result = sudoku.normalize();
      expect(result!.paddingMin).toBe(2);
      expect(result!.paddingMax).toBe(7);
    });

    it('strips zero padding values', () => {
      const sudoku = new XraySudokuObject();
      sudoku.password = 'secret';
      sudoku.paddingMin = 0;
      sudoku.paddingMax = 0;
      const result = sudoku.normalize();
      expect(result!.paddingMin).toBeUndefined();
      expect(result!.paddingMax).toBeUndefined();
    });

    it('produces correct JSON structure for Xray-core', () => {
      const mask = new XrayFinalMaskObject();
      mask.type = 'sudoku';
      const sudoku = new XraySudokuObject();
      sudoku.password = 'secret';
      sudoku.ascii = 'prefer_ascii';
      sudoku.paddingMin = 2;
      sudoku.paddingMax = 7;
      mask.settings = sudoku;
      mask.normalize();

      const json = JSON.parse(JSON.stringify(mask));
      expect(json).toEqual({
        type: 'sudoku',
        settings: {
          password: 'secret',
          ascii: 'prefer_ascii',
          paddingMin: 2,
          paddingMax: 7
        }
      });
    });
  });

  describe('XrayFinalMaskSettingsObject', () => {
    it('returns undefined when empty', () => {
      const fm = new XrayFinalMaskSettingsObject();
      expect(fm.normalize()).toBeUndefined();
    });

    it('normalizes udp masks', () => {
      const fm = new XrayFinalMaskSettingsObject();
      const mask = new XrayFinalMaskObject();
      const salamander = new XraySalamanderObject();
      salamander.password = 'secret';
      mask.settings = salamander;
      fm.udp = [mask];
      const result = fm.normalize();
      expect(result).toBe(fm);
      expect(result!.udp?.length).toBe(1);
    });

    it('strips empty udp array', () => {
      const fm = new XrayFinalMaskSettingsObject();
      fm.udp = [];
      expect(fm.normalize()).toBeUndefined();
    });

    it('produces correct JSON with both tcp and udp', () => {
      const fm = new XrayFinalMaskSettingsObject();
      const udpMask = new XrayFinalMaskObject();
      const salamander = new XraySalamanderObject();
      salamander.password = 'pass';
      udpMask.settings = salamander;
      fm.udp = [udpMask];

      const tcpMask = new XrayFinalMaskObject();
      tcpMask.type = 'fragment';
      const fragment = new XrayFragmentObject();
      fragment.packets = 'tlshello';
      fragment.length = '100-200';
      tcpMask.settings = fragment;
      fm.tcp = [tcpMask];

      fm.normalize();
      const json = JSON.parse(JSON.stringify(fm));
      expect(json.udp).toBeDefined();
      expect(json.tcp).toBeDefined();
      expect(json.udp.length).toBe(1);
      expect(json.tcp.length).toBe(1);
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
    });

    it('clears empty string auth on normalize', () => {
      const hysteria = new XrayStreamHysteriaSettingsObject();
      hysteria.auth = '';
      hysteria.normalize();
      expect(hysteria.auth).toBeUndefined();
    });

    it('retains non-empty fields', () => {
      const hysteria = new XrayStreamHysteriaSettingsObject();
      hysteria.auth = 'password123';
      hysteria.normalize();
      expect(hysteria.auth).toBe('password123');
    });

    it('strips legacy congestion/up/down fields left over from older configs', () => {
      const hysteria = new XrayStreamHysteriaSettingsObject();
      hysteria.auth = 'auth';
      (hysteria as any).congestion = 'bbr';
      (hysteria as any).up = '100';
      (hysteria as any).down = '200';
      hysteria.normalize();
      expect((hysteria as any).congestion).toBeUndefined();
      expect((hysteria as any).up).toBeUndefined();
      expect((hysteria as any).down).toBeUndefined();
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

  describe('XrayFragmentObject', () => {
    it('returns undefined when empty', () => {
      const frag = new XrayFragmentObject();
      expect(frag.normalize()).toBeUndefined();
    });

    it('retains non-empty values', () => {
      const frag = new XrayFragmentObject();
      frag.packets = 'tlshello';
      frag.length = '100-200';
      frag.delay = '10-20';
      frag.maxSplit = '3-6';
      const result = frag.normalize();
      expect(result).toBe(frag);
      expect(result!.packets).toBe('tlshello');
      expect(result!.length).toBe('100-200');
      expect(result!.delay).toBe('10-20');
      expect(result!.maxSplit).toBe('3-6');
    });

    it('strips empty string values', () => {
      const frag = new XrayFragmentObject();
      frag.packets = '';
      frag.length = '';
      frag.delay = '';
      frag.maxSplit = '';
      expect(frag.normalize()).toBeUndefined();
    });
  });

  describe('XrayNoiseObject', () => {
    it('returns undefined when noise array is empty', () => {
      const noise = new XrayNoiseObject();
      expect(noise.normalize()).toBeUndefined();
    });

    it('returns self when noise items exist', () => {
      const noise = new XrayNoiseObject();
      const item = new XrayNoiseItemObject();
      item.rand = '1-8192';
      item.delay = '10-20';
      noise.noise = [item];
      const result = noise.normalize();
      expect(result).toBe(noise);
      expect(result!.noise!.length).toBe(1);
    });

    it('strips zero reset value', () => {
      const noise = new XrayNoiseObject();
      noise.noise = [new XrayNoiseItemObject()];
      noise.reset = 0;
      noise.normalize();
      expect(noise.reset).toBeUndefined();
    });

    it('retains non-zero reset', () => {
      const noise = new XrayNoiseObject();
      noise.noise = [new XrayNoiseItemObject()];
      noise.reset = 5;
      noise.normalize();
      expect(noise.reset).toBe(5);
    });
  });

  describe('XrayHeaderCustomSettingsObject', () => {
    it('returns undefined when empty', () => {
      const hc = new XrayHeaderCustomSettingsObject();
      expect(hc.normalize()).toBeUndefined();
    });

    it('returns self when UDP client/server set', () => {
      const hc = new XrayHeaderCustomSettingsObject();
      hc.client = [{ rand: 4, type: 'array', packet: [] }];
      hc.server = [{ rand: 4, type: 'array', packet: [] }];
      expect(hc.normalize()).toBe(hc);
    });

    it('returns self when TCP clients/servers set', () => {
      const hc = new XrayHeaderCustomSettingsObject();
      hc.clients = [[{ delay: 0, rand: 4, type: 'array', packet: [] }]];
      expect(hc.normalize()).toBe(hc);
    });
  });

  describe('XrayHeaderDnsObject', () => {
    it('returns undefined when domain empty', () => {
      const dns = new XrayHeaderDnsObject();
      expect(dns.normalize()).toBeUndefined();
    });

    it('returns self when domain set', () => {
      const dns = new XrayHeaderDnsObject();
      dns.domain = 'example.com';
      expect(dns.normalize()).toBe(dns);
      expect(dns.domain).toBe('example.com');
    });
  });

  describe('XrayMkcpAes128GcmObject', () => {
    it('returns undefined when password empty', () => {
      const mkcp = new XrayMkcpAes128GcmObject();
      expect(mkcp.normalize()).toBeUndefined();
    });

    it('returns self when password set', () => {
      const mkcp = new XrayMkcpAes128GcmObject();
      mkcp.password = 'secret';
      expect(mkcp.normalize()).toBe(mkcp);
    });
  });

  describe('XrayXdnsObject', () => {
    it('returns undefined when domain empty', () => {
      const xdns = new XrayXdnsObject();
      expect(xdns.normalize()).toBeUndefined();
    });

    it('returns self when domain set', () => {
      const xdns = new XrayXdnsObject();
      xdns.domain = 't.example.com';
      expect(xdns.normalize()).toBe(xdns);
    });
  });

  describe('XrayXicmpObject', () => {
    it('returns undefined when all defaults', () => {
      const xicmp = new XrayXicmpObject();
      expect(xicmp.normalize()).toBeUndefined();
    });

    it('returns self when listenIp is non-default', () => {
      const xicmp = new XrayXicmpObject();
      xicmp.listenIp = '192.168.1.1';
      expect(xicmp.normalize()).toBe(xicmp);
      expect(xicmp.listenIp).toBe('192.168.1.1');
    });

    it('returns self when id is non-zero', () => {
      const xicmp = new XrayXicmpObject();
      xicmp.id = 5;
      expect(xicmp.normalize()).toBe(xicmp);
      expect(xicmp.id).toBe(5);
    });
  });

  describe('XrayQuicParamsUdpHopObject', () => {
    it('returns undefined when empty', () => {
      const hop = new XrayQuicParamsUdpHopObject();
      expect(hop.normalize()).toBeUndefined();
    });

    it('retains non-empty values', () => {
      const hop = new XrayQuicParamsUdpHopObject();
      hop.ports = '20000-50000';
      hop.interval = '5-10';
      const result = hop.normalize();
      expect(result).toBe(hop);
      expect(result!.ports).toBe('20000-50000');
      expect(result!.interval).toBe('5-10');
    });
  });

  describe('XrayQuicParamsObject', () => {
    it('returns undefined when all defaults', () => {
      const qp = new XrayQuicParamsObject();
      expect(qp.normalize()).toBeUndefined();
    });

    it('retains non-default congestion', () => {
      const qp = new XrayQuicParamsObject();
      qp.congestion = 'bbr';
      const result = qp.normalize();
      expect(result).toBe(qp);
      expect(result!.congestion).toBe('bbr');
    });

    it('retains brutal rates', () => {
      const qp = new XrayQuicParamsObject();
      qp.brutalUp = '60 mbps';
      qp.brutalDown = '30 mbps';
      qp.normalize();
      expect(qp.brutalUp).toBe('60 mbps');
      expect(qp.brutalDown).toBe('30 mbps');
    });

    it('strips zero brutal rates', () => {
      const qp = new XrayQuicParamsObject();
      qp.brutalUp = 0;
      qp.brutalDown = 0;
      qp.normalize();
      expect(qp.brutalUp).toBeUndefined();
      expect(qp.brutalDown).toBeUndefined();
    });

    it('retains non-default QUIC window params', () => {
      const qp = new XrayQuicParamsObject();
      qp.initStreamReceiveWindow = 4194304;
      qp.maxIdleTimeout = 60;
      qp.keepAlivePeriod = 10;
      qp.disablePathMTUDiscovery = true;
      qp.maxIncomingStreams = 2048;
      qp.normalize();
      expect(qp.initStreamReceiveWindow).toBe(4194304);
      expect(qp.maxIdleTimeout).toBe(60);
      expect(qp.keepAlivePeriod).toBe(10);
      expect(qp.disablePathMTUDiscovery).toBe(true);
      expect(qp.maxIncomingStreams).toBe(2048);
    });

    it('normalizes udpHop', () => {
      const qp = new XrayQuicParamsObject();
      qp.congestion = 'brutal';
      qp.udpHop = new XrayQuicParamsUdpHopObject();
      qp.udpHop.ports = '20000-50000';
      qp.udpHop.interval = '5-10';
      qp.normalize();
      expect(qp.udpHop?.ports).toBe('20000-50000');
      expect(qp.udpHop?.interval).toBe('5-10');
    });

    it('strips empty udpHop', () => {
      const qp = new XrayQuicParamsObject();
      qp.congestion = 'bbr';
      qp.udpHop = new XrayQuicParamsUdpHopObject();
      qp.normalize();
      expect(qp.udpHop).toBeUndefined();
    });
  });

  describe('XrayFinalMaskSettingsObject with quicParams', () => {
    it('normalizes quicParams', () => {
      const fm = new XrayFinalMaskSettingsObject();
      const udpMask = new XrayFinalMaskObject();
      const salamander = new XraySalamanderObject();
      salamander.password = 'pass';
      udpMask.settings = salamander;
      fm.udp = [udpMask];
      fm.quicParams = new XrayQuicParamsObject();
      fm.quicParams.congestion = 'force-brutal';
      fm.quicParams.brutalUp = '100 mbps';
      const result = fm.normalize();
      expect(result).toBe(fm);
      expect(result!.quicParams?.congestion).toBe('force-brutal');
      expect(result!.quicParams?.brutalUp).toBe('100 mbps');
    });

    it('strips default quicParams', () => {
      const fm = new XrayFinalMaskSettingsObject();
      const udpMask = new XrayFinalMaskObject();
      const salamander = new XraySalamanderObject();
      salamander.password = 'pass';
      udpMask.settings = salamander;
      fm.udp = [udpMask];
      fm.quicParams = new XrayQuicParamsObject();
      fm.normalize();
      expect(fm.quicParams).toBeUndefined();
    });
  });

  describe('XraySudokuObject customTable', () => {
    it('retains customTable when set', () => {
      const sudoku = new XraySudokuObject();
      sudoku.password = 'secret';
      sudoku.customTable = 'xpxvvpvv';
      const result = sudoku.normalize();
      expect(result!.customTable).toBe('xpxvvpvv');
    });

    it('strips empty customTable', () => {
      const sudoku = new XraySudokuObject();
      sudoku.password = 'secret';
      sudoku.customTable = '';
      const result = sudoku.normalize();
      expect(result!.customTable).toBeUndefined();
    });
  });
});
