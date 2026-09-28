import { applyStatus, balancerNow, clearLiveStatus, liveStatus, normalizeStatus, observationAge } from './LiveStatus';
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
