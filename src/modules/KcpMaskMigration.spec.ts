import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { XrayStreamSettingsObject, XrayHeaderObject } from './CommonObjects';
import {
  XrayStreamKcpSettingsObject,
  XrayMkcpAes128GcmObject,
  XrayMkcpLegacyObject,
  XrayFinalMaskObject,
  XrayFinalMaskSettingsObject,
  XraySalamanderObject,
  XraySudokuObject,
  XrayXicmpObject,
  maskToCoreForm,
  maskFromCoreForm,
  extractKcpMaskingForUi
} from './TransportObjects';
import { setCoreVersion } from './CoreVersion';

function buildKcpStream(headerType?: string, seed?: string): XrayStreamSettingsObject {
  const stream = new XrayStreamSettingsObject();
  stream.network = 'kcp';
  stream.kcpSettings = new XrayStreamKcpSettingsObject();
  stream.kcpSettings.mtu = 1400;
  if (headerType) {
    stream.kcpSettings.header = new XrayHeaderObject();
    stream.kcpSettings.header.type = headerType;
  } else {
    stream.kcpSettings.header = undefined;
  }
  stream.kcpSettings.seed = seed;
  return stream;
}

function plain(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

afterEach(() => setCoreVersion('0.0.0'));

describe('mKCP masking migration', () => {
  describe('serialize (header type)', () => {
    it('emits finalmask separate types on 26.1.31..26.5.x cores', () => {
      setCoreVersion('26.3.27');
      const stream = buildKcpStream('srtp');
      stream.normalize();

      expect(stream.kcpSettings?.header).toBeUndefined();
      expect(plain(stream.finalmask?.udp)).toEqual([{ type: 'header-srtp' }]);
    });

    it('emits mkcp-legacy on 26.6.1+ cores', () => {
      setCoreVersion('26.6.1');
      const stream = buildKcpStream('wechat-video');
      stream.normalize();

      expect(stream.kcpSettings?.header).toBeUndefined();
      expect(plain(stream.finalmask?.udp)).toEqual([{ type: 'mkcp-legacy', settings: { header: 'wechat' } }]);
    });

    it('keeps legacy kcpSettings.header on pre-26.1.31 cores', () => {
      setCoreVersion('26.0.0');
      const stream = buildKcpStream('srtp');
      stream.normalize();

      expect(stream.finalmask).toBeUndefined();
      expect(plain(stream.kcpSettings?.header)).toEqual({ type: 'srtp' });
    });

    it('treats an unknown core version as the newest core', () => {
      setCoreVersion('0.0.0');
      const stream = buildKcpStream('utp');
      stream.normalize();

      expect(stream.kcpSettings?.header).toBeUndefined();
      expect(plain(stream.finalmask?.udp)).toEqual([{ type: 'mkcp-legacy', settings: { header: 'utp' } }]);
    });

    it('does not emit masking when header is none', () => {
      setCoreVersion('26.3.27');
      const stream = buildKcpStream('none');
      stream.normalize();

      expect(stream.finalmask).toBeUndefined();
    });
  });

  describe('serialize (seed)', () => {
    it('maps seed to mkcp-aes128gcm on separate-type cores', () => {
      setCoreVersion('26.3.27');
      const stream = buildKcpStream(undefined, 'p4ss');
      stream.normalize();

      expect(stream.kcpSettings?.seed).toBeUndefined();
      expect(plain(stream.finalmask?.udp)).toEqual([{ type: 'mkcp-aes128gcm', settings: { password: 'p4ss' } }]);
    });

    it('maps seed to mkcp-legacy value on 26.6.1+ cores', () => {
      setCoreVersion('26.6.1');
      const stream = buildKcpStream(undefined, 'p4ss');
      stream.normalize();

      expect(plain(stream.finalmask?.udp)).toEqual([{ type: 'mkcp-legacy', settings: { value: 'p4ss' } }]);
    });

    it('emits both header and seed masks', () => {
      setCoreVersion('26.3.27');
      const stream = buildKcpStream('srtp', 'p4ss');
      stream.normalize();

      expect(plain(stream.finalmask?.udp)).toEqual([{ type: 'header-srtp' }, { type: 'mkcp-aes128gcm', settings: { password: 'p4ss' } }]);
    });
  });

  describe('mask order', () => {
    it('keeps the header first before 26.6.22', () => {
      setCoreVersion('26.6.1');
      const stream = buildKcpStream('wechat-video', 'p4ss');
      stream.normalize();

      expect(plain(stream.finalmask?.udp)).toEqual([
        { type: 'mkcp-legacy', settings: { header: 'wechat' } },
        { type: 'mkcp-legacy', settings: { value: 'p4ss' } }
      ]);
    });

    it('puts the header last from 26.6.22, where the last mask is outermost', () => {
      setCoreVersion('26.6.22');
      const stream = buildKcpStream('wechat-video', 'p4ss');
      stream.normalize();

      expect(plain(stream.finalmask?.udp)).toEqual([
        { type: 'mkcp-legacy', settings: { value: 'p4ss' } },
        { type: 'mkcp-legacy', settings: { header: 'wechat' } }
      ]);
    });

    it('keeps other masks inside the mKCP masks from 26.6.22', () => {
      setCoreVersion('26.7.28');
      const stream = buildKcpStream('srtp', 'p4ss');
      const noise = new XrayFinalMaskObject();
      noise.type = 'salamander';
      noise.settings = plainToInstance(XraySalamanderObject, { password: 'x' });
      stream.finalmask = new XrayFinalMaskSettingsObject();
      stream.finalmask.udp = [noise];
      stream.normalize();

      expect(plain(stream.finalmask?.udp).map((m: any) => m.settings?.header ?? m.settings?.value ?? m.type)).toEqual(['salamander', 'p4ss', 'srtp']);
    });

    const kcpWith = (type: string, settings: any) => {
      const stream = buildKcpStream('srtp', 'p4ss');
      const extra = new XrayFinalMaskObject();
      extra.type = type;
      extra.settings = settings;
      stream.finalmask = new XrayFinalMaskSettingsObject();
      stream.finalmask.udp = [extra];
      stream.normalize();
      return plain(stream.finalmask?.udp).map((m: any) => m.settings?.header ?? m.settings?.value ?? m.type);
    };
    const sudoku = () => plainToInstance(XraySudokuObject, { password: 'x' });
    const xicmp = () => plainToInstance(XrayXicmpObject, { listenIp: '10.0.0.1' });

    it.each([
      ['26.6.1', ['srtp', 'p4ss', 'sudoku']],
      ['26.7.28', ['p4ss', 'srtp', 'sudoku']],
      ['26.9.9', ['sudoku', 'p4ss', 'srtp']]
    ])('places sudoku where %s checks for the innermost mask', (version, expected) => {
      setCoreVersion(version);
      expect(kcpWith('sudoku', sudoku())).toEqual(expected);
    });

    it.each([
      ['26.6.1', ['xicmp', 'srtp', 'p4ss']],
      ['26.7.28', ['xicmp', 'p4ss', 'srtp']],
      ['26.9.9', ['p4ss', 'srtp', 'xicmp']]
    ])('places xicmp where %s checks for the outermost mask', (version, expected) => {
      setCoreVersion(version);
      expect(kcpWith('xicmp', xicmp())).toEqual(expected);
    });

    it('keeps the order stable through load and save on 26.7.28', () => {
      setCoreVersion('26.7.28');
      const stream = new XrayStreamSettingsObject();
      stream.network = 'kcp';
      stream.finalmask = new XrayFinalMaskSettingsObject();
      stream.finalmask.udp = [
        maskFromCoreForm(plainToInstance(XrayFinalMaskObject, { type: 'mkcp-legacy', settings: plainToInstance(XrayMkcpLegacyObject, { value: 'p4ss' }) })),
        maskFromCoreForm(plainToInstance(XrayFinalMaskObject, { type: 'mkcp-legacy', settings: plainToInstance(XrayMkcpLegacyObject, { header: 'wechat' }) }))
      ];
      extractKcpMaskingForUi(stream);
      stream.normalize();

      expect(plain(stream.finalmask?.udp)).toEqual([
        { type: 'mkcp-legacy', settings: { value: 'p4ss' } },
        { type: 'mkcp-legacy', settings: { header: 'wechat' } }
      ]);
    });
  });

  describe('deserialize (finalmask -> UI)', () => {
    function streamWithUdp(udp: XrayFinalMaskObject[]): XrayStreamSettingsObject {
      const stream = new XrayStreamSettingsObject();
      stream.network = 'kcp';
      stream.finalmask = new XrayFinalMaskSettingsObject();
      stream.finalmask.udp = udp;
      return stream;
    }

    function mask(type: string, settings?: any): XrayFinalMaskObject {
      const m = new XrayFinalMaskObject();
      m.type = type;
      m.settings = settings;
      return m;
    }

    it('restores header type from a header-* mask', () => {
      const stream = streamWithUdp([mask('header-srtp')]);
      extractKcpMaskingForUi(stream);

      expect(stream.kcpSettings?.header?.type).toBe('srtp');
      expect(stream.finalmask?.udp).toBeUndefined();
    });

    it('restores seed from an mkcp-aes128gcm mask', () => {
      const aes = new XrayMkcpAes128GcmObject();
      aes.password = 'p4ss';
      const stream = streamWithUdp([mask('mkcp-aes128gcm', aes)]);
      extractKcpMaskingForUi(stream);

      expect(stream.kcpSettings?.seed).toBe('p4ss');
      expect(stream.finalmask?.udp).toBeUndefined();
    });

    it('leaves non-kcp masks in finalmask', () => {
      const stream = streamWithUdp([mask('header-srtp'), mask('salamander')]);
      extractKcpMaskingForUi(stream);

      expect(stream.kcpSettings?.header?.type).toBe('srtp');
      expect(stream.finalmask?.udp?.map((m) => m.type)).toEqual(['salamander']);
    });

    it('ignores non-kcp networks', () => {
      const stream = streamWithUdp([mask('salamander')]);
      stream.network = 'hysteria';
      extractKcpMaskingForUi(stream);

      expect(stream.kcpSettings).toBeUndefined();
    });
  });

  describe('mkcp-legacy <-> canonical translation', () => {
    it('round-trips header-srtp through mkcp-legacy', () => {
      setCoreVersion('26.6.1');
      const canonical = new XrayFinalMaskObject();
      canonical.type = 'header-srtp';

      const core = maskToCoreForm(canonical);
      expect(core.type).toBe('mkcp-legacy');
      expect((core.settings as XrayMkcpLegacyObject).header).toBe('srtp');

      const back = maskFromCoreForm(core);
      expect(back.type).toBe('header-srtp');
    });

    it('round-trips mkcp-aes128gcm through mkcp-legacy value', () => {
      setCoreVersion('26.6.1');
      const aes = new XrayMkcpAes128GcmObject();
      aes.password = 'p4ss';
      const canonical = new XrayFinalMaskObject();
      canonical.type = 'mkcp-aes128gcm';
      canonical.settings = aes;

      const core = maskToCoreForm(canonical);
      expect(core.type).toBe('mkcp-legacy');
      expect((core.settings as XrayMkcpLegacyObject).value).toBe('p4ss');

      const back = maskFromCoreForm(core);
      expect(back.type).toBe('mkcp-aes128gcm');
      expect((back.settings as XrayMkcpAes128GcmObject).password).toBe('p4ss');
    });

    it('maps empty mkcp-legacy to mkcp-original', () => {
      const core = new XrayFinalMaskObject();
      core.type = 'mkcp-legacy';
      core.settings = new XrayMkcpLegacyObject();

      expect(maskFromCoreForm(core).type).toBe('mkcp-original');
    });

    it('does not touch canonical masks below 26.6.1', () => {
      setCoreVersion('26.3.27');
      const canonical = new XrayFinalMaskObject();
      canonical.type = 'header-srtp';
      expect(maskToCoreForm(canonical).type).toBe('header-srtp');
    });
  });
});
