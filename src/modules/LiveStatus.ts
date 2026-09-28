import { reactive } from 'vue';
import engine, { SubmitActions } from '@/modules/Engine';
import { BalancerView, Observatory, RunningRouting, extractRunningRouting, resolveBalancer, sameBalancer } from '@/modules/BalancerStatus';

export interface StatusEnvelope {
  ok: boolean;
  ts: number;
  pid: number;
  observatory: Observatory;
}

export interface LiveStatusState {
  ok: boolean;
  fresh: boolean;
  ts: number;
  pid: number;
  receivedAt: number;
  observatory: Observatory;
  running?: RunningRouting;
}

const FRESH_CLOCK_WINDOW = 20;

const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export const normalizeStatus = (raw: unknown): StatusEnvelope | undefined => {
  if (!isObject(raw)) return undefined;
  if (raw.v === 2 && 'observatory' in raw) {
    return {
      ok: raw.ok === true,
      ts: Number(raw.ts) || 0,
      pid: Number(raw.pid) || 0,
      observatory: isObject(raw.observatory) ? (raw.observatory as Observatory) : {}
    };
  }
  return { ok: true, ts: 0, pid: 0, observatory: raw as Observatory };
};

export const liveStatus = reactive<LiveStatusState>({
  ok: false,
  fresh: false,
  ts: 0,
  pid: 0,
  receivedAt: 0,
  observatory: {},
  running: undefined
});

const tracker = { lastTs: 0, staleReads: 0, advanced: false, runningPid: 0, generation: 0 };

const updateFreshness = () => {
  liveStatus.fresh = liveStatus.ok && liveStatus.ts > 0 && tracker.advanced && tracker.staleReads < 2;
};

export const applyStatus = (status: StatusEnvelope, nowMs: number = Date.now()): void => {
  if (status.ts > 0 && status.ts !== tracker.lastTs) {
    if (tracker.lastTs > 0 || Math.abs(nowMs / 1000 - status.ts) <= FRESH_CLOCK_WINDOW) tracker.advanced = true;
    tracker.lastTs = status.ts;
    tracker.staleReads = 0;
    liveStatus.receivedAt = nowMs;
  } else {
    tracker.staleReads++;
  }

  liveStatus.ok = status.ok;
  liveStatus.ts = status.ts;
  liveStatus.pid = status.pid;
  liveStatus.observatory = status.observatory;
  updateFreshness();
};

const markFailedRead = () => {
  tracker.staleReads++;
  updateFreshness();
};

const loadRunning = async (pid: number, generation: number): Promise<void> => {
  let config: unknown;
  try {
    config = (await engine.getWebData<unknown>('xray-config')).data;
  } catch {
    config = undefined;
  }
  if (generation !== tracker.generation) return;
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    liveStatus.running = extractRunningRouting(config);
    tracker.runningPid = pid;
  } else {
    liveStatus.running = undefined;
    tracker.runningPid = 0;
  }
};

export const refreshLiveStatus = async (): Promise<boolean> => {
  const generation = tracker.generation;
  let status: StatusEnvelope | undefined;
  try {
    await engine.submit(SubmitActions.checkConnectionStatus, null, 2000);
    status = normalizeStatus(await engine.getConnectionStatus());
  } catch (error) {
    if (generation === tracker.generation) markFailedRead();
    throw error;
  }
  if (generation !== tracker.generation) return false;
  if (!status) {
    markFailedRead();
    return false;
  }
  const reload = status.ok && status.pid > 0 && status.pid !== tracker.runningPid;
  if (reload) liveStatus.running = undefined;
  applyStatus(status);
  if (reload) await loadRunning(status.pid, generation);
  return generation === tracker.generation;
};

export const clearLiveStatus = (): void => {
  Object.assign(tracker, { lastTs: 0, staleReads: 0, advanced: false, runningPid: 0, generation: tracker.generation + 1 });
  Object.assign(liveStatus, { ok: false, fresh: false, ts: 0, pid: 0, receivedAt: 0, observatory: {}, running: undefined });
};

export const observationAge = (tag: string, nowMs: number = Date.now()): number | undefined => {
  const tried = liveStatus.observatory[tag]?.last_try_time;
  if (!tried || !liveStatus.ts) return undefined;
  return Math.max(0, Math.round(liveStatus.ts - tried + (nowMs - liveStatus.receivedAt) / 1000));
};

export type BalancerNow = { state: 'no-data' | 'not-applied' | 'unused' } | { state: 'view'; view: BalancerView };

export const balancerNow = (edited: unknown): BalancerNow => {
  const running = liveStatus.running;
  if (!liveStatus.fresh || !running) return { state: 'no-data' };
  const tag = isObject(edited) && typeof edited.tag === 'string' ? edited.tag : '';
  const current = running.balancers.find((b) => b.tag === tag);
  if (!current || !sameBalancer(edited, current)) return { state: 'not-applied' };
  if (!running.rulesByBalancer[current.tag]?.length) return { state: 'unused' };
  return { state: 'view', view: resolveBalancer(current, liveStatus.observatory, running) };
};
