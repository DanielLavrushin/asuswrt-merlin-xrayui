import { computeOutboundMarks, describeViewShort, extractRunningRouting, Observatory, parseDuration, resolveBalancer, RunningBalancer, sameBalancer, toSelector } from './BalancerStatus';
import { XrayBalancerObject, XrayBalancerStrategyObject } from './CommonObjects';

const alive = (tag: string, delay: number) => ({ alive: true, delay, outbound_tag: tag, last_try_time: 1000 });
const dead = (tag: string) => ({ delay: 99999999, outbound_tag: tag, last_error_reason: 'dead', last_try_time: 1000 });

const HANDLERS = ['direct', 'p-a', 'p-b', 'p-c', 'p-dead', 'sys:metrics_out'];
const ROUTING = { handlerTags: HANDLERS, defaultTag: 'direct' };
const OBS: Observatory = { 'p-a': alive('p-a', 120), 'p-b': alive('p-b', 40), 'p-c': alive('p-c', 90), 'p-dead': dead('p-dead'), direct: alive('direct', 10) };

const balancer = (over: Partial<RunningBalancer> = {}): RunningBalancer => ({ tag: 'bal', selector: ['p-'], type: 'leastping', settings: {}, fallbackTag: '', ...over });

describe('resolveBalancer', () => {
  it('picks the alive candidate with the lowest delay for leastPing and names the runner-up', () => {
    expect(resolveBalancer(balancer(), OBS, ROUTING)).toEqual({ kind: 'next', tags: ['p-b'], dead: [], total: 4, delay: 40, runnerUp: { tag: 'p-c', delay: 90 } });
  });

  it('never picks an outbound missing from the observatory for leastPing', () => {
    const obs: Observatory = { 'p-a': alive('p-a', 50) };
    expect(resolveBalancer(balancer(), obs, ROUTING).tags).toEqual(['p-a']);
  });

  it('reports every outbound sharing the lowest delay for leastPing', () => {
    const obs: Observatory = { ...OBS, 'p-a': alive('p-a', 40) };
    expect(resolveBalancer(balancer(), obs, ROUTING)).toMatchObject({ kind: 'tied', tags: ['p-a', 'p-b'], delay: 40 });
  });

  it('breaks leastLoad ties by tag and treats the strategy type case-insensitively', () => {
    const obs: Observatory = { ...OBS, 'p-a': alive('p-a', 40) };
    const view = resolveBalancer(balancer({ type: 'leastload' }), obs, ROUTING);
    expect(view).toMatchObject({ kind: 'next', tags: ['p-a'], delay: 40, runnerUp: { tag: 'p-b', delay: 40 } });
    const running = extractRunningRouting({ outbounds: [{ tag: 'direct' }], routing: { balancers: [{ tag: 'x', selector: ['p-'], strategy: { type: 'LeastPing' } }] } });
    expect(running.balancers[0].type).toBe('leastping');
  });

  it('honours maxRTT for leastLoad', () => {
    const view = resolveBalancer(balancer({ type: 'leastload', settings: { maxRTT: '100ms' } }), { 'p-a': alive('p-a', 150), 'p-c': alive('p-c', 99) }, ROUTING);
    expect(view.tags).toEqual(['p-c']);
    const none = resolveBalancer(balancer({ type: 'leastload', settings: { maxRTT: '90ms' } }), { 'p-c': alive('p-c', 90) }, ROUTING);
    expect(none).toMatchObject({ kind: 'default', tags: ['direct'] });
  });

  it.each([
    ['expected 2', { expected: 2 }, { kind: 'rotating', tags: ['p-b', 'p-c'] }],
    ['expected above the live count', { expected: 9 }, { kind: 'rotating', tags: ['p-b', 'p-c', 'p-a'] }],
    ['a cost on the fastest outbound', { costs: [{ match: 'p-b', value: 100 }] }, { kind: 'next', tags: ['p-c'] }],
    ['a regexp cost without a value', { costs: [{ regexp: true, match: 'p-[b]' }] }, { kind: 'next', tags: ['p-b'] }],
    ['a baseline nothing meets', { baselines: ['30ms'] }, { kind: 'default', tags: ['direct'], reason: 'none-usable' }],
    ['a baseline two outbounds meet', { baselines: ['100ms'] }, { kind: 'rotating', tags: ['p-b', 'p-c'] }],
    ['a baseline with expected as the floor', { baselines: ['30ms'], expected: 1 }, { kind: 'next', tags: ['p-b'] }]
  ])('selects leastLoad outbounds like Xray with %s', (_label, settings, expected) => {
    expect(resolveBalancer(balancer({ type: 'leastload', settings }), OBS, ROUTING)).toMatchObject(expected);
  });

  it('weights leastLoad delays by the number a cost matches in the tag', () => {
    const routing = { handlerTags: ['n-1', 'n-9'], defaultTag: 'n-1' };
    const obs: Observatory = { 'n-1': alive('n-1', 50), 'n-9': alive('n-9', 20) };
    const view = resolveBalancer(balancer({ type: 'leastload', selector: ['n-'], settings: { costs: [{ regexp: true, match: '\\d+' }] } }), obs, routing);
    expect(view).toMatchObject({ kind: 'next', tags: ['n-1'], runnerUp: { tag: 'n-9', delay: 20 } });
  });

  it('treats an alive outbound without a delay as 0 ms, as Xray omits a zero delay', () => {
    const obs: Observatory = { ...OBS, 'p-a': { alive: true, outbound_tag: 'p-a' } };
    expect(resolveBalancer(balancer(), obs, ROUTING)).toMatchObject({ kind: 'next', tags: ['p-a'], delay: 0 });
    expect(resolveBalancer(balancer({ type: 'leastload' }), obs, ROUTING)).toMatchObject({ kind: 'next', tags: ['p-a'], delay: 0 });
  });

  it('truncates maxRTT to whole milliseconds like Xray', () => {
    const view = resolveBalancer(balancer({ type: 'leastload', settings: { maxRTT: '40.5ms' } }), OBS, ROUTING);
    expect(view).toMatchObject({ kind: 'default', reason: 'none-usable' });
  });

  it('shows a single remaining outbound of a rotating balancer as the only target', () => {
    const obs: Observatory = { ...OBS, 'p-a': dead('p-a'), 'p-c': dead('p-c') };
    expect(resolveBalancer(balancer({ type: 'random', fallbackTag: 'direct' }), obs, ROUTING)).toMatchObject({ kind: 'next', tags: ['p-b'], delay: 40, dead: [] });
    const routing = { handlerTags: ['p-only'], defaultTag: 'p-only' };
    expect(resolveBalancer(balancer({ type: 'roundrobin' }), {}, routing)).toMatchObject({ kind: 'next', tags: ['p-only'], delay: undefined });
    expect(resolveBalancer(balancer({ type: 'roundrobin' }), { 'p-only': dead('p-only') }, routing)).toMatchObject({ kind: 'next', dead: ['p-only'] });
  });

  it('flags a fallback outbound that does not exist', () => {
    expect(resolveBalancer(balancer({ selector: ['zz-'], fallbackTag: 'gone' }), OBS, ROUTING)).toMatchObject({ kind: 'fallback', tags: ['gone'], dead: ['gone'], reason: 'no-match' });
  });

  it('reports an untagged first outbound as the default route', () => {
    const running = extractRunningRouting({ outbounds: [{ protocol: 'freedom' }, { tag: 'p-a' }] });
    expect(running.defaultTag).toBe('');
    const view = resolveBalancer(balancer(), {}, running);
    expect(view).toMatchObject({ kind: 'default', tags: [''], dead: [] });
    expect(computeOutboundMarks({ ...running, balancers: [balancer()], rulesByBalancer: { bal: ['r'] } }, {})).toEqual({});
  });

  it('keeps a tuned leastLoad with expected 1 as a single pick', () => {
    expect(resolveBalancer(balancer({ type: 'leastload', settings: { expected: 1 } }), OBS, ROUTING).kind).toBe('next');
  });

  it('goes to the fallback outbound when nothing is alive, flagging a dead fallback', () => {
    const obs: Observatory = { 'p-a': dead('p-a'), 'p-b': dead('p-b'), 'p-c': dead('p-c'), 'p-dead': dead('p-dead'), direct: dead('direct') };
    expect(resolveBalancer(balancer({ fallbackTag: 'direct' }), obs, ROUTING)).toMatchObject({ kind: 'fallback', tags: ['direct'], dead: ['direct'] });
    expect(resolveBalancer(balancer(), obs, ROUTING)).toMatchObject({ kind: 'default', tags: ['direct'] });
  });

  it('uses the default route before the first probe finished', () => {
    expect(resolveBalancer(balancer(), {}, ROUTING)).toMatchObject({ kind: 'default', tags: ['direct'], dead: [] });
  });

  it('lists every candidate of a roundRobin balancer without fallback and flags the dead ones', () => {
    const view = resolveBalancer(balancer({ type: 'roundrobin' }), OBS, ROUTING);
    expect(view).toEqual({ kind: 'rotating', tags: ['p-a', 'p-b', 'p-c', 'p-dead'], dead: ['p-dead'], total: 4 });
  });

  it('filters dead candidates of a random balancer with a fallback but keeps unprobed ones', () => {
    const obs: Observatory = { ...OBS };
    delete obs['p-c'];
    const view = resolveBalancer(balancer({ type: 'random', fallbackTag: 'direct' }), obs, ROUTING);
    expect(view).toEqual({ kind: 'rotating', tags: ['p-a', 'p-b', 'p-c'], dead: [], total: 4 });
  });

  it('matches selectors by prefix across every handler, like Xray', () => {
    const routing = { handlerTags: ['proxy1', 'proxy10', 'sys:metrics_out'], defaultTag: 'proxy1' };
    const view = resolveBalancer(balancer({ type: 'random', selector: ['proxy1'] }), {}, routing);
    expect(view.tags).toEqual(['proxy1', 'proxy10']);
    expect(resolveBalancer(balancer({ type: 'random', selector: ['s'] }), {}, routing).tags).toEqual(['sys:metrics_out']);
  });

  it('falls back when no handler matches the selector', () => {
    expect(resolveBalancer(balancer({ selector: ['zz-'] }), OBS, ROUTING)).toMatchObject({ kind: 'default', tags: ['direct'], total: 0, reason: 'no-match' });
  });
});

describe('extractRunningRouting', () => {
  const config = {
    inbounds: [{ tag: 'in', settings: { clients: [{ id: 'x', reverse: { tag: 'rev-client' } }] } }],
    outbounds: [{ tag: 'p-a' }, { tag: 'direct' }],
    reverse: { portals: [{ tag: 'portal-1', domain: 'r.example' }] },
    routing: {
      balancers: [{ tag: 'bal', selector: 'p-a,p-b', strategy: { type: 'leastPing' }, fallbackTag: 'direct' }, { selector: ['x'] }],
      rules: [
        { name: 'video', balancerTag: 'bal' },
        { balancerTag: 'bal', idx: 4 },
        { name: 'both', balancerTag: 'bal', outboundTag: 'direct' },
        { name: 'plain', outboundTag: 'direct' }
      ]
    }
  };

  it('collects balancers, the rules that really use them, handler tags and the default outbound', () => {
    const running = extractRunningRouting(config);
    expect(running.balancers).toEqual([{ tag: 'bal', selector: ['p-a', 'p-b'], type: 'leastping', settings: {}, fallbackTag: 'direct' }]);
    expect(running.rulesByBalancer).toEqual({ bal: ['video', '#5'] });
    expect(running.handlerTags).toEqual(['p-a', 'direct', 'portal-1', 'rev-client', 'sys:metrics_out']);
    expect(running.defaultTag).toBe('p-a');
  });

  it('survives an empty or malformed configuration', () => {
    expect(extractRunningRouting(undefined)).toEqual({ balancers: [], rulesByBalancer: {}, handlerTags: ['sys:metrics_out'], defaultTag: undefined });
    expect(extractRunningRouting({ routing: { balancers: 'x', rules: [null, 3] }, outbounds: null })).toMatchObject({ balancers: [], rulesByBalancer: {} });
  });
});

describe('computeOutboundMarks', () => {
  it('marks outbounds only for balancers used by a rule and keeps the strongest level', () => {
    const routing = {
      balancers: [balancer({ tag: 'fast' }), balancer({ tag: 'spread', type: 'roundrobin', fallbackTag: 'direct' }), balancer({ tag: 'idle' })],
      rulesByBalancer: { fast: ['video'], spread: ['web'] },
      handlerTags: HANDLERS,
      defaultTag: 'direct'
    };
    const marks = computeOutboundMarks(routing, OBS);
    expect(Object.keys(marks).sort()).toEqual(['p-a', 'p-b', 'p-c']);
    expect(marks['p-b'].level).toBe('next');
    expect(marks['p-b'].items.map((i) => i.balancer)).toEqual(['fast', 'spread']);
    expect(marks['p-a'].level).toBe('rotating');
    expect(marks['p-a'].items[0].rules).toEqual(['web']);
  });
});

describe('sameBalancer', () => {
  const running = extractRunningRouting({ routing: { balancers: [{ tag: 'bal', selector: ['p-'] }] } }).balancers[0];

  it('matches an unchanged balancer from the editor', () => {
    const edited = Object.assign(new XrayBalancerObject(), { tag: 'bal', selector: ['p-'] });
    expect(sameBalancer(edited, running)).toBe(true);
  });

  it('detects edits that are not applied yet', () => {
    const strategy = Object.assign(new XrayBalancerStrategyObject(), { type: 'leastPing' });
    expect(sameBalancer(Object.assign(new XrayBalancerObject(), { tag: 'bal', selector: ['p-'], strategy }), running)).toBe(false);
    expect(sameBalancer(Object.assign(new XrayBalancerObject(), { tag: 'bal', selector: ['p-', 'q-'] }), running)).toBe(false);
    expect(sameBalancer(Object.assign(new XrayBalancerObject(), { tag: 'bal', selector: ['p-'], fallbackTag: 'direct' }), running)).toBe(false);
    expect(sameBalancer(undefined, running)).toBe(false);
  });
});

describe('helpers', () => {
  it('parses Go durations', () => {
    expect(parseDuration('1s')).toBe(1000);
    expect(parseDuration('1m30s')).toBe(90000);
    expect(parseDuration('250ms')).toBe(250);
    expect(parseDuration('.5s')).toBe(500);
    expect(parseDuration('1.s')).toBe(1000);
    expect(parseDuration('300μs')).toBeCloseTo(0.3);
    expect(parseDuration('fast')).toBeUndefined();
    expect(parseDuration(5)).toBeUndefined();
  });

  it('reads selectors given as an array or a comma string', () => {
    expect(toSelector(['a', 1, 'b'])).toEqual(['a', 'b']);
    expect(toSelector('a,b')).toEqual(['a', 'b']);
    expect(toSelector(undefined)).toEqual([]);
  });

  it('describes a view in one short line', () => {
    const t = (key: string, args: unknown[]) => `${key}:${args.join('|')}`;
    expect(describeViewShort({ kind: 'next', tags: ['p-b'], dead: [], total: 3, delay: 40 }, t)).toBe('com.BalancerModal.now_next:p-b|40');
    expect(describeViewShort({ kind: 'next', tags: ['p-b'], dead: [], total: 3 }, t)).toBe('p-b');
    expect(describeViewShort({ kind: 'default', tags: [''], dead: [], total: 0 }, t)).toBe('com.BalancerModal.now_default:no tag');
    expect(describeViewShort({ kind: 'rotating', tags: ['a', 'b'], dead: ['b'], total: 3 }, t)).toBe('com.BalancerModal.now_rotating_dead:2|3|1');
    expect(describeViewShort({ kind: 'default', tags: ['direct'], dead: [], total: 0 }, t)).toBe('com.BalancerModal.now_default:direct');
  });
});
