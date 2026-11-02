import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HARNESS = path.join(process.cwd(), 'tests', 'backend', 'failover', 'harness.sh');

const which = (bin: string): string | undefined => {
  const out = spawnSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf8' });
  return out.status === 0 ? out.stdout.trim() : undefined;
};
const BUSYBOX = process.platform === 'linux' ? which('busybox') : undefined;
const HAS_JQ = which('jq') !== undefined;
const SHELLS: [string, string[]][] = [...(BUSYBOX ? [['busybox sh', [BUSYBOX, 'sh']] as [string, string[]]] : []), ['sh', ['sh']]];
const describeIf = HAS_JQ ? describe : describe.skip;

const xhttpOutbound = (xhttpSettings: Record<string, unknown>) => ({
  tag: 'pool',
  protocol: 'vless',
  settings: { vnext: [{ address: 'old.example', port: 443, users: [] }] },
  streamSettings: { network: 'xhttp', security: 'tls', xhttpSettings }
});

const merge = (shell: string[], current: object, replacement: object) => {
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'xrayui-failover-'));
  try {
    const out = spawnSync(shell[0], [...shell.slice(1), HARNESS, state, JSON.stringify(current), JSON.stringify(replacement), 'vless://new', 'pool'], {
      encoding: 'utf8'
    });
    expect(out.error).toBeUndefined();
    return JSON.parse(out.stdout);
  } finally {
    fs.rmSync(state, { recursive: true, force: true });
  }
};

describeIf.each(SHELLS)('failover_merge_outbound under %s', (_name, shell) => {
  const extra = { uplinkHTTPMethod: 'GET', uplinkDataPlacement: 'cookie', xPaddingObfsMode: true, xmux: { maxConnections: 4 }, downloadSettings: { address: 'down.example' } };

  it('drops packet-up-only uplink options when the new server uses another mode', () => {
    const merged = merge(shell, xhttpOutbound({ mode: 'packet-up', extra }), xhttpOutbound({ mode: '', path: '/new' }));
    expect(merged.streamSettings.xhttpSettings).toEqual({ mode: '', path: '/new', extra: { xPaddingObfsMode: true, xmux: { maxConnections: 4 } } });
  });

  it('keeps them when the new server also uses packet-up', () => {
    const merged = merge(shell, xhttpOutbound({ mode: 'packet-up', extra }), xhttpOutbound({ mode: 'packet-up', path: '/new' }));
    expect(merged.streamSettings.xhttpSettings.extra).toEqual({ uplinkHTTPMethod: 'GET', uplinkDataPlacement: 'cookie', xPaddingObfsMode: true, xmux: { maxConnections: 4 } });
  });
});

const CHECK = path.join(process.cwd(), 'tests', 'backend', 'failover', 'check.sh');

const check = (shell: string[], config: object): string[] => {
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'xrayui-failover-check-'));
  try {
    fs.writeFileSync(path.join(state, 'config.json'), JSON.stringify(config));
    const out = spawnSync(shell[0], [...shell.slice(1), CHECK, state], { encoding: 'utf8' });
    expect(out.error).toBeUndefined();
    const log = path.join(state, 'events.log');
    return fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : [];
  } finally {
    fs.rmSync(state, { recursive: true, force: true });
  }
};

describeIf.each(SHELLS)('failover_check under %s', (_name, shell) => {
  const pooled = { outbounds: [{ tag: 'pool', protocol: 'vless', subPool: { enabled: true } }] };

  it('evaluates the pooled outbounds from the observatory', () => {
    expect(check(shell, pooled)).toEqual(['api_fetch_observatory', 'evaluate pool', 'check rc=0']);
  });

  it('skips with a warning when burstObservatory, which reports no probe times, is the observer', () => {
    const events = check(shell, { ...pooled, burstObservatory: { subjectSelector: ['pool'], pingConfig: {} } });
    expect(events).toEqual(['WARN: Failover: auto-fallback needs the plain observatory, burstObservatory reports no probe times - skipping', 'check rc=0']);
  });
});
