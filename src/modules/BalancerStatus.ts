export interface ObservatoryEntry {
  alive?: boolean;
  delay?: number;
  outbound_tag?: string;
  last_error_reason?: string;
  last_seen_time?: number;
  last_try_time?: number;
}

export type Observatory = Record<string, ObservatoryEntry>;

export interface RunningBalancer {
  tag: string;
  selector: string[];
  type: string;
  settings: Record<string, unknown>;
  fallbackTag: string;
}

export interface RunningRouting {
  balancers: RunningBalancer[];
  rulesByBalancer: Record<string, string[]>;
  handlerTags: string[];
  defaultTag?: string;
}

export type BalancerViewKind = 'next' | 'tied' | 'rotating' | 'fallback' | 'default' | 'none';

export interface BalancerView {
  kind: BalancerViewKind;
  tags: string[];
  dead: string[];
  total: number;
  delay?: number;
  runnerUp?: { tag: string; delay: number };
}

export interface OutboundMarkItem {
  balancer: string;
  view: BalancerView;
  rules: string[];
}

export interface OutboundMark {
  level: 'next' | 'tied' | 'rotating';
  items: OutboundMarkItem[];
}

type PlainObject = Record<string, unknown>;

const DEAD_DELAY = 99999999;
const METRICS_OUTBOUND = 'sys:metrics_out';

const isObject = (value: unknown): value is PlainObject => !!value && typeof value === 'object' && !Array.isArray(value);
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asString = (value: unknown): string => (typeof value === 'string' ? value : '');
const byTag = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export const toSelector = (value: unknown): string[] => {
  if (typeof value === 'string') return value.split(',');
  return asArray(value).filter((s): s is string => typeof s === 'string');
};

const strategyType = (strategy: unknown): string => (asString(isObject(strategy) ? strategy.type : undefined) || 'random').toLowerCase();

const strategySettings = (strategy: unknown): PlainObject => (isObject(strategy) && isObject(strategy.settings) ? strategy.settings : {});

export const parseDuration = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const units: Record<string, number> = { ns: 1e-6, us: 1e-3, 'µs': 1e-3, ms: 1, s: 1000, m: 60000, h: 3600000 };
  const part = /^(\d+(?:\.\d+)?)(ns|us|µs|ms|s|m|h)/;
  let rest = value.trim();
  let total = 0;
  while (rest) {
    const match = part.exec(rest);
    if (!match) return undefined;
    total += Number.parseFloat(match[1]) * units[match[2]];
    rest = rest.slice(match[0].length);
  }
  return total > 0 ? total : undefined;
};

export const toRunningBalancer = (raw: PlainObject): RunningBalancer => ({
  tag: asString(raw.tag),
  selector: toSelector(raw.selector),
  type: strategyType(raw.strategy),
  settings: strategySettings(raw.strategy),
  fallbackTag: asString(raw.fallbackTag)
});

export const extractRunningRouting = (config: unknown): RunningRouting => {
  const root = isObject(config) ? config : {};
  const routing = isObject(root.routing) ? root.routing : {};

  const balancers = asArray(routing.balancers)
    .filter(isObject)
    .map(toRunningBalancer)
    .filter((b) => b.tag);

  const rulesByBalancer: Record<string, string[]> = {};
  asArray(routing.rules).forEach((rule, index) => {
    if (!isObject(rule)) return;
    const balancerTag = asString(rule.balancerTag);
    if (!balancerTag || asString(rule.outboundTag)) return;
    const names = rulesByBalancer[balancerTag] ?? [];
    names.push(asString(rule.name) || `#${index + 1}`);
    rulesByBalancer[balancerTag] = names;
  });

  const tags = new Set<string>();
  const addTag = (value: unknown) => {
    const tag = asString(value);
    if (tag) tags.add(tag);
  };
  const outbounds = asArray(root.outbounds).filter(isObject);
  outbounds.forEach((o) => addTag(o.tag));
  asArray(isObject(root.reverse) ? root.reverse.portals : undefined)
    .filter(isObject)
    .forEach((p) => addTag(p.tag));
  asArray(root.inbounds)
    .filter(isObject)
    .forEach((inbound) => {
      const settings = isObject(inbound.settings) ? inbound.settings : {};
      asArray(settings.clients)
        .filter(isObject)
        .forEach((client) => addTag(isObject(client.reverse) ? client.reverse.tag : undefined));
    });
  tags.add(METRICS_OUTBOUND);

  const defaultTag = asString(outbounds[0]?.tag) || undefined;

  return { balancers, rulesByBalancer, handlerTags: [...tags], defaultTag };
};

export const resolveBalancer = (balancer: RunningBalancer, observatory: Observatory, routing: Pick<RunningRouting, 'handlerTags' | 'defaultTag'>): BalancerView => {
  const matches = (tag: string) => balancer.selector.some((prefix) => tag.startsWith(prefix));
  const candidates = routing.handlerTags.filter(matches).sort(byTag);
  const total = candidates.length;
  const entry = (tag: string) => observatory[tag];
  const alive = (tag: string) => entry(tag)?.alive === true;
  const delayOf = (tag: string) => entry(tag)?.delay ?? DEAD_DELAY;

  const fallback = (): BalancerView => {
    const tag = balancer.fallbackTag || routing.defaultTag;
    if (!tag) return { kind: 'none', tags: [], dead: [], total };
    return {
      kind: balancer.fallbackTag ? 'fallback' : 'default',
      tags: [tag],
      dead: entry(tag) && !alive(tag) ? [tag] : [],
      total,
      delay: alive(tag) ? delayOf(tag) : undefined
    };
  };

  if (!candidates.length) return fallback();

  if (balancer.type === 'leastping' || balancer.type === 'leastload') {
    const settings = balancer.settings;
    const leastLoad = balancer.type === 'leastload';
    const maxRtt = leastLoad ? parseDuration(settings.maxRTT) : undefined;
    const live = candidates
      .filter((tag) => alive(tag) && delayOf(tag) < DEAD_DELAY && (!maxRtt || delayOf(tag) < maxRtt))
      .sort((a, b) => delayOf(a) - delayOf(b) || byTag(a, b));
    if (!live.length) return fallback();

    const tuned = leastLoad && (Number(settings.expected) > 1 || asArray(settings.baselines).length > 0 || asArray(settings.costs).length > 0);
    if (tuned) return { kind: 'rotating', tags: live, dead: [], total };

    const best = delayOf(live[0]);
    const tied = live.filter((tag) => delayOf(tag) === best);
    if (!leastLoad && tied.length > 1) return { kind: 'tied', tags: tied, dead: [], total, delay: best };

    const runner = leastLoad ? live[1] : live.find((tag) => delayOf(tag) !== best);
    return {
      kind: 'next',
      tags: [live[0]],
      dead: [],
      total,
      delay: best,
      runnerUp: runner ? { tag: runner, delay: delayOf(runner) } : undefined
    };
  }

  const filtered = !!balancer.fallbackTag;
  const eligible = filtered ? candidates.filter((tag) => !entry(tag) || alive(tag)) : candidates;
  if (!eligible.length) return fallback();
  return {
    kind: 'rotating',
    tags: eligible,
    dead: filtered ? [] : candidates.filter((tag) => !!entry(tag) && !alive(tag)),
    total
  };
};

const LEVEL_RANK: Record<OutboundMark['level'], number> = { next: 3, tied: 2, rotating: 1 };

const markLevel = (kind: BalancerViewKind): OutboundMark['level'] | undefined => {
  switch (kind) {
    case 'next':
    case 'fallback':
    case 'default':
      return 'next';
    case 'tied':
      return 'tied';
    case 'rotating':
      return 'rotating';
    default:
      return undefined;
  }
};

export const computeOutboundMarks = (routing: RunningRouting, observatory: Observatory): Record<string, OutboundMark> => {
  const marks: Record<string, OutboundMark> = {};
  routing.balancers.forEach((balancer) => {
    const rules = routing.rulesByBalancer[balancer.tag];
    if (!rules?.length) return;
    const view = resolveBalancer(balancer, observatory, routing);
    const level = markLevel(view.kind);
    if (!level) return;
    view.tags.forEach((tag) => {
      const mark = marks[tag] ?? { level, items: [] };
      if (LEVEL_RANK[level] > LEVEL_RANK[mark.level]) mark.level = level;
      mark.items.push({ balancer: balancer.tag, view, rules });
      marks[tag] = mark;
    });
  });
  return marks;
};

export const sameBalancer = (edited: unknown, running: RunningBalancer | undefined): boolean => {
  if (!running || !isObject(edited)) return false;
  const current = toRunningBalancer(edited);
  return (
    current.tag === running.tag &&
    current.type === running.type &&
    current.fallbackTag === running.fallbackTag &&
    JSON.stringify(current.selector) === JSON.stringify(running.selector) &&
    JSON.stringify(current.settings) === JSON.stringify(running.settings)
  );
};

export type Translate = (key: string, args: unknown[]) => string;

export const describeViewShort = (view: BalancerView, t: Translate): string => {
  switch (view.kind) {
    case 'next':
      return `${view.tags[0]} · ${view.delay} ms`;
    case 'tied':
      return t('com.BalancerModal.now_tied', [view.tags.join(', '), view.delay]);
    case 'rotating':
      return view.dead.length
        ? t('com.BalancerModal.now_rotating_dead', [view.tags.length, view.total, view.dead.length])
        : t('com.BalancerModal.now_rotating', [view.tags.length, view.total]);
    case 'fallback':
      return t('com.BalancerModal.now_fallback', [view.tags[0]]);
    case 'default':
      return t('com.BalancerModal.now_default', [view.tags[0]]);
    default:
      return t('com.BalancerModal.now_none', []);
  }
};
