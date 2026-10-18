import { plainToInstance } from 'class-transformer';
import { setCoreVersion } from './CoreVersion';
import { XrayStreamHttpSettingsObject } from './TransportObjects';
import { XrayObject } from './XrayConfig';
import engine from './Engine';

const save = (raw: object) => JSON.parse(JSON.stringify(XrayStreamHttpSettingsObject.fromPlain(raw).normalize()));

describe('canonical XHTTP representation', () => {
  beforeEach(() => setCoreVersion('26.6.22'));
  afterEach(() => setCoreVersion('0.0.0'));

  it('merges before defaults, honors explicit nested values and leaves input untouched', () => {
    const raw = { path: '/test', xPaddingObfsMode: true, headers: { A: 'outer' },
      noSSEHeader: true, scMinPostsIntervalMs: 99, extra: {
        xPaddingObfsMode: false, headers: {}, scMinPostsIntervalMs: 0, futureOption: 'retained'
      } };
    const original = JSON.stringify(raw);
    expect(save(raw)).toEqual({ path: '/test', extra: {
      noSSEHeader: true, scMinPostsIntervalMs: 0, futureOption: 'retained'
    } });
    expect(JSON.stringify(raw)).toBe(original);
  });

  it.each(['26.3.27', '26.6.1', '26.6.22', '26.10.17'])('writes session names for core %s and reloads them', (version) => {
    setCoreVersion(version);
    const raw = { path: '/test', sessionIDPlacement: 'header', sessionIDKey: 'outer',
      extra: { sessionPlacement: 'cookie', sessionKey: 'nested' } };
    const legacy = version === '26.3.27' || version === '26.6.1';
    const saved = save(raw);
    expect(saved.extra).toEqual(legacy ? { sessionPlacement: 'cookie', sessionKey: 'nested' } :
      { sessionIDPlacement: 'cookie', sessionIDKey: 'nested' });
    expect(XrayStreamHttpSettingsObject.fromPlain(saved).extra).toMatchObject({ sessionIDPlacement: 'cookie', sessionIDKey: 'nested' });
    expect(save(saved)).toEqual(saved);
  });

  it('prefers modern aliases within the same location', () => {
    expect(save({ extra: { sessionPlacement: 'cookie', sessionIDPlacement: 'header',
      sessionKey: 'old', sessionIDKey: 'new' } }).extra).toEqual({ sessionIDPlacement: 'header', sessionIDKey: 'new' });
  });

  it('preserves ranges and explicit body placement', () => {
    const extra = { scMaxEachPostBytes: '1000-2000', scMinPostsIntervalMs: '10-20',
      scStreamUpServerSecs: 15, uplinkChunkSize: '128-256', uplinkDataPlacement: 'body', sessionIDLength: '8-16' };
    expect(save({ extra })).toEqual({ extra });
  });

  it.each([
    { mode: 'stream-up', extra: { uplinkHTTPMethod: 'GET' } },
    { mode: 'auto', extra: { uplinkDataPlacement: 'header' } },
    { mode: 'stream-one', extra: { downloadSettings: { address: 'down.example.com' } } }
  ])('rejects incompatible mode combinations: %j', (raw) => {
    expect(() => save(raw)).toThrow('XHTTP:');
  });

  it('serializes a cloned editor model and remains stable across save/reload', () => {
    const config = engine.hydrateConfig(plainToInstance(XrayObject, {
      outbounds: [{ protocol: 'vless', tag: 'test', settings: { vnext: [] }, streamSettings: {
        network: 'xhttp', xhttpSettings: { path: '/test', extra: { sessionIDPlacement: 'header', sessionIDKey: 'sid' } }
      } }]
    }));
    const original = JSON.stringify(config);
    setCoreVersion('26.3.27');
    const saved = engine.prepareServerConfig(config);
    expect(JSON.stringify(config)).toBe(original);
    expect(saved.outbounds[0].streamSettings!.xhttpSettings!.extra).toMatchObject({ sessionPlacement: 'header', sessionKey: 'sid' });
    expect(JSON.stringify(engine.prepareServerConfig(saved))).toBe(JSON.stringify(saved));
  });
});
