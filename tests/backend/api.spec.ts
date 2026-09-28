import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HARNESS = path.join(process.cwd(), 'tests', 'backend', 'api', 'harness.sh');

const which = (bin: string): string | undefined => {
  const out = spawnSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf8' });
  return out.status === 0 ? out.stdout.trim() : undefined;
};
const BUSYBOX = process.platform === 'linux' ? which('busybox') : undefined;
const HAS_JQ = which('jq') !== undefined;
const SHELLS: [string, string[]][] = [...(BUSYBOX ? [['busybox sh', [BUSYBOX, 'sh']] as [string, string[]]] : []), ['sh', ['sh']]];
const describeIf = HAS_JQ ? describe : describe.skip;

const API_CONFIG = JSON.stringify({ inbounds: [{ tag: 'sys:metrics_in', listen: '127.0.0.1', port: 10086 }] });
const OBSERVATORY = {
  'p-a': { alive: true, delay: 94, outbound_tag: 'p-a', last_seen_time: 1789999990, last_try_time: 1789999990 },
  'p-b': { delay: 99999999, outbound_tag: 'p-b', last_error_reason: 'dead', last_try_time: 1789999990 }
};
const VARS = JSON.stringify({ cmdline: ['xray'], memstats: { Alloc: 1 }, observatory: OBSERVATORY, stats: { inbound: {}, outbound: {}, user: {} } });

interface Scenario {
  steps: string[];
  env?: Record<string, string>;
  files?: Record<string, string>;
}

interface Result {
  events: string[];
  status?: Record<string, unknown>;
  observatory?: string;
}

const run = (shell: string[], scenario: Scenario): Result => {
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'xrayui-api-'));
  try {
    const files = { 'opt/etc/xray/xrayui/config-api.json': API_CONFIG, ...scenario.files };
    Object.entries(files).forEach(([rel, content]) => {
      const file = path.join(state, rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    });
    const out = spawnSync(shell[0], [...shell.slice(1), HARNESS, state, ...scenario.steps], { encoding: 'utf8', env: { ...process.env, ...scenario.env } });
    expect(out.error).toBeUndefined();
    const read = (rel: string) => (fs.existsSync(path.join(state, rel)) ? fs.readFileSync(path.join(state, rel), 'utf8') : undefined);
    const status = read('share/xray_connection_status.json');
    return {
      events: (read('events.log') ?? '').split('\n').filter(Boolean),
      status: status ? JSON.parse(status) : undefined,
      observatory: read('observatory.out')
    };
  } finally {
    fs.rmSync(state, { recursive: true, force: true });
  }
};

const balancerConfig = (balancer: Record<string, unknown>) => JSON.stringify({ outbounds: [{ tag: 'p-a' }], routing: { balancers: [{ tag: 'bal', selector: ['p-'], ...balancer }] } });

describeIf.each(SHELLS)('api.sh under %s', (_name, shell) => {
  it('writes a status envelope with the observatory and the daemon pid', () => {
    const r = run(shell, { steps: ['status'], env: { RS_PID: '4242' }, files: { 'vars.json': VARS } });
    expect(r.status).toEqual({ v: 2, ok: true, ts: 1790000000, pid: 4242, observatory: OBSERVATORY });
    expect(r.events).toEqual(['curl -fsS --max-time 5 http://127.0.0.1:10086/debug/vars', 'status rc=0']);
  });

  it('writes an empty observatory when Xray reports none', () => {
    const r = run(shell, { steps: ['status'], env: { RS_PID: '4242' }, files: { 'vars.json': JSON.stringify({ observatory: null }) } });
    expect(r.status).toEqual({ v: 2, ok: true, ts: 1790000000, pid: 4242, observatory: {} });
  });

  it('marks the status as unavailable and logs when a running Xray does not answer', () => {
    const r = run(shell, { steps: ['status'], env: { RS_PID: '4242' } });
    expect(r.status).toEqual({ v: 2, ok: false, ts: 1790000000, pid: 4242, observatory: {} });
    expect(r.events).toContain('ERROR: Failed to fetch or parse observatory data');
  });

  it('replaces the last status without calling curl or logging when Xray is stopped', () => {
    const r = run(shell, { steps: ['status'], files: { 'vars.json': VARS, 'share/xray_connection_status.json': JSON.stringify(OBSERVATORY) } });
    expect(r.status).toEqual({ v: 2, ok: false, ts: 1790000000, pid: 0, observatory: {} });
    expect(r.events).toEqual(['status rc=0']);
  });

  it('keeps the observatory map that auto-fallback reads', () => {
    const ok = run(shell, { steps: ['observatory'], files: { 'vars.json': VARS } });
    expect(JSON.parse(ok.observatory ?? '')).toEqual(OBSERVATORY);
    expect(ok.events).toContain('observatory rc=0');
    const down = run(shell, { steps: ['observatory'] });
    expect(down.events).toContain('observatory rc=1');
  });

  it.each([
    ['leastPing', { strategy: { type: 'leastPing' } }, 0],
    ['leastLoad in any letter case', { strategy: { type: 'LEASTLOAD' } }, 0],
    ['random with a fallback outbound', { fallbackTag: 'direct' }, 0],
    ['roundRobin with a fallback outbound', { strategy: { type: 'roundRobin' }, fallbackTag: 'direct' }, 0],
    ['random without a fallback outbound', {}, 1],
    ['roundRobin without a fallback outbound', { strategy: { type: 'roundRobin' } }, 1]
  ])('loads the observatory for a %s balancer with both checks off', (_label, balancer, rc) => {
    const r = run(shell, {
      steps: ['required'],
      env: { RS_CHECK_CONNECTION: 'false', RS_CLIENTS_CHECK: 'false' },
      files: { 'opt/etc/xray/config.json': balancerConfig(balancer) }
    });
    expect(r.events).toEqual([`required rc=${rc}`]);
  });

  it('needs the API configuration when either check is on, and not without a configuration', () => {
    expect(run(shell, { steps: ['required'], env: { RS_CHECK_CONNECTION: 'true', RS_CLIENTS_CHECK: 'false' } }).events).toEqual(['required rc=0']);
    expect(run(shell, { steps: ['required'], env: { RS_CHECK_CONNECTION: 'false', RS_CLIENTS_CHECK: 'true' } }).events).toEqual(['required rc=0']);
    expect(run(shell, { steps: ['required'], env: { RS_CHECK_CONNECTION: 'false', RS_CLIENTS_CHECK: 'false' } }).events).toEqual(['required rc=1']);
  });
});
