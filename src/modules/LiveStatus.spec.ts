import engine from './Engine';
import { applyStatus, balancerNow, clearLiveStatus, liveStatus, normalizeStatus, observationAge, refreshLiveStatus } from './LiveStatus';
import { extractRunningRouting } from './BalancerStatus';
import { XrayBalancerObject, XrayBalancerStrategyObject } from './CommonObjects';

const NOW = 1790000000;
const obs = { 'p-a': { alive: true, delay: 80, outbound_tag: 'p-a', last_try_time: NOW - 12 }, 'p-b': { alive: true, delay: 40, outbound_tag: 'p-b', last_try_time: NOW - 12 } };
const envelope = (ts: number, ok = true) => ({ ok, ts, pid: 4242, observatory: ok ? obs : {} });

describe('normalizeStatus', () => {
  it('reads the status envelope', () => {
    expect(normalizeStatus({ v: 2, ok: true, ts: NOW, pid: 7, observatory: obs })).toEqual({ ok: true, ts: NOW, pid: 7, observatory: obs });
    expect(normalizeStatus({ v: 2, ok: false, ts: NOW, pid: 0, observatory: null })).toEqual({ ok: false, ts: NOW, pid: 0, observatory: {} });
  });

  it('accepts the older bare observatory map, including an outbound tagged v', () => {
    expect(normalizeStatus(obs)).toEqual({ ok: true, ts: 0, pid: 0, observatory: obs });
    const legacy = { v: { alive: true, delay: 5, outbound_tag: 'v' } };
    expect(normalizeStatus(legacy)).toEqual({ ok: true, ts: 0, pid: 0, observatory: legacy });
  });

  it('rejects anything that is not an object', () => {
    expect(normalizeStatus(undefined)).toBeUndefined();
    expect(normalizeStatus('')).toBeUndefined();
    expect(normalizeStatus([])).toBeUndefined();
  });
});

describe('applyStatus', () => {
  beforeEach(() => clearLiveStatus());

  it('trusts a first status written a moment ago', () => {
    applyStatus(envelope(NOW - 3), NOW * 1000);
    expect(liveStatus.fresh).toBe(true);
    expect(liveStatus.observatory).toEqual(obs);
  });

  it('waits for the file to change when the first status is old', () => {
    applyStatus(envelope(NOW - 3600), NOW * 1000);
    expect(liveStatus.fresh).toBe(false);
    applyStatus(envelope(NOW - 3600), (NOW + 9) * 1000);
    expect(liveStatus.fresh).toBe(false);
    applyStatus(envelope(NOW + 18), (NOW + 18) * 1000);
    expect(liveStatus.fresh).toBe(true);
  });

  it('turns stale when the file stops changing for two reads', () => {
    applyStatus(envelope(NOW), NOW * 1000);
    applyStatus(envelope(NOW), (NOW + 9) * 1000);
    expect(liveStatus.fresh).toBe(true);
    applyStatus(envelope(NOW), (NOW + 18) * 1000);
    expect(liveStatus.fresh).toBe(false);
  });

  it('is never fresh when Xray does not answer or the file is the older format', () => {
    applyStatus(envelope(NOW, false), NOW * 1000);
    expect(liveStatus.fresh).toBe(false);
    clearLiveStatus();
    applyStatus({ ok: true, ts: 0, pid: 0, observatory: obs }, NOW * 1000);
    expect(liveStatus.fresh).toBe(false);
  });

  it('adds the time since the status was read to the probe age', () => {
    applyStatus(envelope(NOW), NOW * 1000);
    expect(observationAge('p-a', (NOW + 5) * 1000)).toBe(17);
    expect(observationAge('missing', NOW * 1000)).toBeUndefined();
  });

  it('keeps counting the age from the last new status on a repeated read', () => {
    applyStatus(envelope(NOW), NOW * 1000);
    applyStatus(envelope(NOW), (NOW + 9) * 1000);
    expect(observationAge('p-a', (NOW + 9) * 1000)).toBe(21);
  });

  it('accepts a status whose clock went backwards', () => {
    applyStatus(envelope(NOW), NOW * 1000);
    applyStatus(envelope(NOW - 60), (NOW + 9) * 1000);
    applyStatus(envelope(NOW - 51), (NOW + 18) * 1000);
    expect(liveStatus.fresh).toBe(true);
  });
});

describe('balancerNow', () => {
  const running = extractRunningRouting({
    outbounds: [{ tag: 'direct' }, { tag: 'p-a' }, { tag: 'p-b' }],
    routing: {
      balancers: [
        { tag: 'fast', selector: ['p-'], strategy: { type: 'leastPing' } },
        { tag: 'idle', selector: ['p-'] }
      ],
      rules: [{ name: 'video', balancerTag: 'fast' }]
    }
  });
  const edited = (tag: string, type = 'random') => Object.assign(new XrayBalancerObject(), { tag, selector: ['p-'], strategy: Object.assign(new XrayBalancerStrategyObject(), { type }) });

  beforeEach(() => {
    clearLiveStatus();
    applyStatus(envelope(NOW), NOW * 1000);
    liveStatus.running = running;
  });

  it('resolves an applied balancer used by a rule', () => {
    expect(balancerNow(edited('fast', 'leastPing'))).toMatchObject({ state: 'view', view: { kind: 'next', tags: ['p-b'] } });
  });

  it('says when the balancer is not used, not applied yet, or there is no live data', () => {
    expect(balancerNow(edited('idle'))).toEqual({ state: 'unused' });
    expect(balancerNow(edited('fast', 'roundRobin'))).toEqual({ state: 'not-applied' });
    expect(balancerNow(edited('new'))).toEqual({ state: 'not-applied' });
    liveStatus.fresh = false;
    expect(balancerNow(edited('fast', 'leastPing'))).toEqual({ state: 'no-data' });
  });
});

describe('refreshLiveStatus', () => {
  const config = { outbounds: [{ tag: 'direct' }, { tag: 'p-a' }], routing: { balancers: [{ tag: 'fast', selector: ['p-'] }], rules: [{ balancerTag: 'fast' }] } };
  let status: unknown;
  let disk: unknown;

  beforeEach(() => {
    clearLiveStatus();
    status = { v: 2, ok: true, ts: Math.floor(Date.now() / 1000), pid: 100, observatory: obs };
    disk = config;
    jest.spyOn(engine, 'submit').mockResolvedValue(undefined as never);
    jest.spyOn(engine, 'getConnectionStatus').mockImplementation(async () => status as never);
    jest.spyOn(engine, 'getWebData').mockImplementation(async () => ({ data: disk }) as never);
  });

  afterEach(() => jest.restoreAllMocks());

  it('loads the running configuration once per Xray process', async () => {
    await expect(refreshLiveStatus()).resolves.toBe(true);
    expect(liveStatus.fresh).toBe(true);
    expect(liveStatus.running?.balancers.map((b) => b.tag)).toEqual(['fast']);
    await refreshLiveStatus();
    expect(engine.getWebData).toHaveBeenCalledTimes(1);
    status = { ...(status as object), pid: 101, ts: (status as { ts: number }).ts + 9 };
    disk = { ...config, routing: { balancers: [{ tag: 'slow', selector: ['p-'] }], rules: [] } };
    await refreshLiveStatus();
    expect(engine.getWebData).toHaveBeenCalledTimes(2);
    expect(liveStatus.running?.balancers.map((b) => b.tag)).toEqual(['slow']);
  });

  it('does not keep a configuration that failed to load as text', async () => {
    disk = '{"outbounds": [';
    await refreshLiveStatus();
    expect(liveStatus.running).toBeUndefined();
    disk = config;
    await refreshLiveStatus();
    expect(liveStatus.running?.balancers).toHaveLength(1);
  });

  it('goes stale when the status cannot be read', async () => {
    await refreshLiveStatus();
    expect(liveStatus.fresh).toBe(true);
    status = '<html>login</html>';
    await expect(refreshLiveStatus()).resolves.toBe(false);
    (engine.getConnectionStatus as jest.Mock).mockRejectedValue(new Error('network'));
    await expect(refreshLiveStatus()).rejects.toThrow('network');
    expect(liveStatus.fresh).toBe(false);
  });

  it('drops a refresh that finishes after the page left advanced mode', async () => {
    let release: () => void = () => undefined;
    (engine.submit as jest.Mock).mockImplementation(() => new Promise<void>((resolve) => (release = resolve)));
    const pending = refreshLiveStatus();
    clearLiveStatus();
    release();
    await expect(pending).resolves.toBe(false);
    expect(liveStatus.fresh).toBe(false);
    expect(liveStatus.running).toBeUndefined();
  });
});
