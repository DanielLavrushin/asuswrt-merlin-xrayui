import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import engine from '@/modules/Engine';

const HARNESS = path.join(process.cwd(), 'tests', 'backend', 'response', 'harness.sh');

const which = (bin: string): string | undefined => {
  const out = spawnSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf8' });
  return out.status === 0 ? out.stdout.trim() : undefined;
};
const BUSYBOX = process.platform === 'linux' ? which('busybox') : undefined;
const HAS_BASE64 = which('base64') !== undefined;
const HAS_OPENSSL = which('openssl') !== undefined;
const SHELLS: [string, string[]][] = [...(BUSYBOX ? [['busybox sh', [BUSYBOX, 'sh']] as [string, string[]]] : []), ['sh', ['sh']]];
const itIf = (condition: boolean) => (condition ? it : it.skip);

const frontend = engine as unknown as { compressPayload(raw: string): string; splitPayload(payload: string, size: number): string[] };

const hex = (i: number) => createHash('sha256').update(String(i)).digest('hex');
const GENERAL = {
  github_proxy: 'https://gh-proxy.example/',
  logs_level: 'info',
  logs_access: true,
  logs_error: false,
  ipsec: 'redirect',
  probe_url: 'https://www.gstatic.com/generate_204',
  hooks: { after_firewall_start: 'logger "правило добавлено"' },
  subscriptions: { links: Array.from({ length: 120 }, (_, i) => `https://sub.example/${hex(i)}`) }
};
const RAW = JSON.stringify(GENERAL);
const GZ = frontend.compressPayload(RAW);
const CHUNKS = frontend.splitPayload(GZ, 2048);
const SETTINGS = ['xray_startup y', ...CHUNKS.map((chunk, i) => `xray_payload${i} ${chunk}`)].join('\n') + '\n';
const PLAIN = frontend.compressPayload(JSON.stringify({ profile: 'b.json' }));
const CONFIG = JSON.stringify({ log: { loglevel: 'warning' }, inbounds: [], outbounds: [] }) + '\n';
const STALE = {
  xray: { profile: 'stale.json', profiles: ['stale.json'], backups: ['stale.tar.gz'], ui_version: '0.69.1' },
  loading: { message: 'Applying general settings...', progress: 10 }
};
const T = 1790000000;
const NOW = Math.floor(Date.now() / 1000);
const LINKS =
  [
    ...Array.from({ length: 20 }, (_, i) => `vless://11111111-2222-3333-4444-555555555555@203.0.113.${i + 1}:443?security=reality&sni=s${i}.example#Server%20${i}`),
    'trojan://secret@203.0.113.30:443#Сервер Б',
    'hy2://pass@203.0.113.31:443?sni=a.example#?>?'
  ].join('\n') + '\n';
const LINKS_B64 = Buffer.from(LINKS).toString('base64').replace(/.{76}/g, '$&\n');
const LINKS_B64URL = Buffer.from(LINKS).toString('base64url');
const LINKS_JUNK = LINKS_B64 + '\n<!-- cached by edge -->\n';
const VMESS = JSON.stringify({ v: '2', ps: 'Сервер ??>', add: '203.0.113.3', port: '443', id: '11111111-2222-3333-4444-555555555555', net: 'ws', path: '/ws?ed=2048' });
const VMESS_B64 = Buffer.from(VMESS).toString('base64url');
const VMESS_JUNK = `${VMESS_B64.slice(0, 40)}%3A${VMESS_B64.slice(40)}`;
const vlessLink = (i: number) =>
  `vless://11111111-2222-3333-4444-${String(i).padStart(12, '0')}@198.51.100.${(i % 250) + 1}:443?encryption=none&security=tls&sni=s${i}.example&type=tcp#Server%20${i}`;
const BIG_LINKS = Array.from({ length: 1500 }, (_, i) => vlessLink(i)).join('\n') + '\n';
const BIG_RULES = Array.from({ length: 2000 }, (_, i) => ({ type: 'field', domain: [`domain:site-${i}.example.com`], outboundTag: 'direct' }));
const SUB_CONFIG = JSON.stringify({
  log: { loglevel: 'warning' },
  inbounds: [],
  outbounds: [
    {
      tag: 'proxy',
      protocol: 'vless',
      surl: 'https://sub.example/big',
      settings: { vnext: [{ address: '203.0.113.200', port: 443, users: [{ id: 'old' }] }] },
      streamSettings: { sockopt: { mark: 255 } }
    },
    { tag: 'json', protocol: 'vless', surl: 'https://sub.example/json', settings: { vnext: [{ address: '203.0.113.201', port: 443, users: [{ id: 'old' }] }] } },
    { tag: 'gone', protocol: 'trojan', surl: 'https://sub.example/gone', settings: { servers: [{ address: '203.0.113.202', port: 443, password: 'x' }] } },
    { tag: 'direct', protocol: 'freedom' }
  ],
  routing: { rules: BIG_RULES }
});
const SUB_JSON = JSON.stringify({
  outbounds: [{ tag: 'json', protocol: 'vless', settings: { vnext: [{ address: 'json.example.com', port: 8443, users: [{ id: 'new', encryption: 'none' }] }] } }],
  routing: { rules: BIG_RULES }
});
const findBinary = (name: string) =>
  (process.env.PATH ?? '')
    .split(path.delimiter)
    .map((d) => path.join(d, name))
    .find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
const EXTERNAL = { RS_EXT_PRINTF: findBinary('printf') ?? '', RS_EXT_ECHO: findBinary('echo') ?? '' };
const poolLink = (i: number, label = `Pool ${i}`) =>
  `vless://11111111-2222-3333-4444-${String(i).padStart(12, '0')}@198.18.${Math.floor(i / 250)}.${(i % 250) + 1}:443?encryption=none&security=reality&pbk=${'k'.repeat(200)}&type=tcp#${encodeURIComponent(label)}`;
const POOL_LABELS: Record<number, string> = { 7: 'Германия Берлин', 123: 'Netherlands AMS', 200: 'ŁÓDŹ Centrum', 250: 'ΕΛΛΆΔΑ Αθήνα', 449: 'ÄRGER Wien' };
const POOL = Array.from({ length: 450 }, (_, i) => poolLink(i, POOL_LABELS[i])).join('\n') + '\n';
const POOL_ENV = {
  ...EXTERNAL,
  RS_POOL_FILTER: ' германия | NETHERLANDS |ärger|łódź|ελλάδα|  ',
  RS_POOL_LABEL: encodeURIComponent('Pool 420'),
  RS_POOL_ADDRESS: 'vless://gone@198.18.1.171:443#nothing'
};
const BIG_GEODATA = Array.from({ length: 9000 }, (_, i) => `domain:list-${i}.example.net`).join('\n');
const BIG_CONFIG_RAW = JSON.stringify({
  log: { loglevel: 'warning' },
  inbounds: [],
  outbounds: [{ tag: 'direct', protocol: 'freedom' }],
  routing: { rules: Array.from({ length: 3000 }, (_, i) => ({ type: 'field', domain: [`domain:big-${hex(i).slice(0, 24)}.example.com`], outboundTag: 'direct' })) }
});
const chunkSettings = (payload: string) =>
  frontend
    .splitPayload(payload, 2048)
    .map((chunk, i) => `xray_payload${i} ${chunk}`)
    .join('\n') + '\n';
const DNS_DOMAINS = Array.from({ length: 4000 }, (_, i) => `domain:host-${i}.example.org`);
const DNS_CONFIG = JSON.stringify({
  inbounds: [],
  outbounds: [{ tag: 'direct', protocol: 'freedom' }],
  routing: { rules: [{ idx: 1, type: 'field', domain: DNS_DOMAINS, outboundTag: 'direct' }] },
  dns: { servers: [{ address: '1.1.1.1', rules: [1] }] }
});
const APPLIED = JSON.stringify({ log: { loglevel: 'debug' }, inbounds: [], outbounds: [{ tag: 'direct', protocol: 'freedom' }] });
const loadingResponse = (message: string) => JSON.stringify({ xray: { profile: 'config.json' }, loading: { message, progress: 100 } });

type Bin = 'host' | 'nobase64' | 'bare';

interface Scenario {
  steps: string[];
  bin?: Bin;
  env?: Record<string, string>;
  files?: Record<string, string>;
  dirs?: string[];
  links?: Record<string, string>;
  mtimes?: Record<string, number>;
}

interface Result {
  response: { xray?: Record<string, unknown>; loading?: unknown };
  events: string[];
  read: (rel: string) => string | undefined;
  stderr: string;
}

const scenarios: Record<string, Scenario> = {
  'profiles and backups': {
    steps: ['respond'],
    env: { profile: 'b.json' },
    files: {
      'opt/etc/xray/config.json': '{}',
      'opt/etc/xray/b.json': '{}',
      'opt/etc/xray/my profile.json': '{}',
      'opt/etc/xray/notes.txt': '',
      'opt/etc/xray/config.json-temp.bak': '{}',
      'store/shared.json': '{}',
      'share/backup/old.tar.gz': '',
      'share/backup/xrayui-2026-09-01.tar.gz': '',
      'share/backup/before update.tar.gz': '',
      'share/backup/notes.txt': ''
    },
    dirs: ['opt/etc/xray/foo.json', 'share/backup/folder.tar.gz'],
    links: { 'opt/etc/xray/linked.json': 'store/shared.json', 'opt/etc/xray/dangling.json': 'store/gone.json' },
    mtimes: {
      'share/backup/old.tar.gz': T - 300,
      'share/backup/xrayui-2026-09-01.tar.gz': T - 200,
      'share/backup/before update.tar.gz': T - 100,
      'share/backup/folder.tar.gz': T,
      'share/backup/notes.txt': T
    }
  },
  'symlinked profile directory': {
    steps: ['respond'],
    files: { 'store/xray/a.json': '{}', 'store/xray/config.json': '{}' },
    dirs: ['opt/etc'],
    links: { 'opt/etc/xray': 'store/xray' }
  },
  'custom geodata files': {
    steps: ['tagfiles'],
    files: { 'share/data/b.dat': '', 'share/data/a.dat': '', 'share/data/my list.dat': '' },
    dirs: ['share/data/nested.dat']
  },
  'subscription body with base64': { steps: ['sub_body'], files: { payload: LINKS_B64 } },
  'subscription body without base64': { steps: ['sub_body'], bin: 'nobase64', files: { payload: LINKS_B64 } },
  'subscription body without base64 or openssl': { steps: ['sub_body'], bin: 'bare', files: { payload: LINKS_B64 } },
  'plain subscription body': { steps: ['sub_body'], bin: 'bare', files: { payload: LINKS } },
  'url-safe subscription body with base64': { steps: ['sub_body'], files: { payload: LINKS_B64URL } },
  'url-safe subscription body without base64': { steps: ['sub_body'], bin: 'nobase64', files: { payload: LINKS_B64URL } },
  'subscription body with junk with base64': { steps: ['sub_body'], files: { payload: LINKS_JUNK } },
  'subscription body with junk without base64': { steps: ['sub_body'], bin: 'nobase64', files: { payload: LINKS_JUNK } },
  'vmess link with base64': { steps: ['sub_link'], files: { payload: VMESS_B64 } },
  'vmess link without base64': { steps: ['sub_link'], bin: 'nobase64', files: { payload: VMESS_B64 } },
  'vmess link without base64 or openssl': { steps: ['sub_link'], bin: 'bare', files: { payload: VMESS_B64 } },
  'vmess link with junk with base64': { steps: ['sub_link'], files: { payload: VMESS_JUNK } },
  'vmess link with junk without base64': { steps: ['sub_link'], bin: 'nobase64', files: { payload: VMESS_JUNK } },
  'stale staging sessions': {
    steps: ['sweep'],
    files: { 'tmp/xrayui-staging/old/chunk-0': 'x', 'tmp/xrayui-staging/fresh/chunk-0': 'x', 'tmp/xrayui-staging/stray': '' },
    mtimes: { 'tmp/xrayui-staging/old': NOW - 900, 'tmp/xrayui-staging/fresh': NOW - 60, 'tmp/xrayui-staging/stray': NOW - 900 }
  },
  'error progress cleanup': {
    steps: ['clear_loading'],
    files: { 'www/xray-ui-response.json': loadingResponse('Error: settings upload was empty or corrupted. Try again.') }
  },
  'success progress cleanup': { steps: ['clear_loading'], files: { 'www/xray-ui-response.json': loadingResponse('General settings applied.') } },
  'error progress replaced during the wait': {
    steps: ['clear_loading'],
    env: { RS_NEXT_LOADING: JSON.stringify({ xray: { profile: 'config.json' }, loading: { message: 'Restarting Xray service...', progress: 35 } }) },
    files: { 'www/xray-ui-response.json': loadingResponse('Error: another restart or switch is in progress. Try again.') }
  },
  'large subscriptions': {
    steps: ['subs'],
    env: EXTERNAL,
    files: { 'opt/etc/xray/config.json': SUB_CONFIG, 'sub/big': Buffer.from(BIG_LINKS).toString('base64'), 'sub/json': SUB_JSON }
  },
  'subscription picked by its name': {
    steps: ['subs'],
    env: EXTERNAL,
    files: {
      'opt/etc/xray/config.json': JSON.stringify({
        inbounds: [],
        outbounds: [{ tag: 'Узел 7', protocol: 'vless', surl: 'https://sub.example/named', settings: { vnext: [{ address: '203.0.113.250', port: 443, users: [{ id: 'old' }] }] } }]
      }),
      'sub/named': Array.from({ length: 20 }, (_, i) => poolLink(i, `Узел ${i}`)).join('\n') + '\n'
    }
  },
  'large plain subscription': {
    steps: ['subs'],
    env: EXTERNAL,
    files: { 'opt/etc/xray/config.json': SUB_CONFIG, 'sub/big': BIG_LINKS, 'sub/json': Buffer.from(SUB_JSON).toString('base64') }
  },
  'large failover pool': { steps: ['pool_ops'], env: POOL_ENV, files: { pool: POOL } },
  'config update that emits two documents': { steps: ['update_file'], env: { RS_FILTER: '., .' }, files: { 'opt/etc/xray/config.json': CONFIG } },
  'config update through a symlink': {
    steps: ['update_file'],
    env: { RS_FILTER: '.log.loglevel = "info"' },
    files: { 'store/real.json': CONFIG },
    dirs: ['opt/etc/xray'],
    links: { 'opt/etc/xray/config.json': 'store/real.json' }
  },
  'apply a config over 128 KiB': {
    steps: ['apply'],
    env: EXTERNAL,
    files: { 'opt/etc/xray/config.json': CONFIG, 'jffs/addons/custom_settings.txt': chunkSettings(frontend.compressPayload(BIG_CONFIG_RAW)) }
  },
  'save a custom geodata list over 128 KiB': {
    steps: ['geodata_save'],
    env: EXTERNAL,
    dirs: ['share/data'],
    files: { 'jffs/addons/custom_settings.txt': chunkSettings(frontend.compressPayload(JSON.stringify({ tag: 'biglist', content: BIG_GEODATA }))) }
  },
  'save a custom geodata list loaded back from the router': {
    steps: ['geodata_save'],
    dirs: ['share/data'],
    files: { 'jffs/addons/custom_settings.txt': chunkSettings(frontend.compressPayload(JSON.stringify({ tag: 'short', content: 'domain:a.example\ndomain:b.example\n\n' }))) }
  },
  'save a custom geodata list with a path in its tag': {
    steps: ['geodata_save'],
    dirs: ['share/data'],
    files: { 'jffs/addons/custom_settings.txt': chunkSettings(frontend.compressPayload(JSON.stringify({ tag: '../escape', content: 'domain:x.example' }))) }
  },
  'config update': { steps: ['update_file'], env: { RS_FILTER: '.log.loglevel = "info"' }, files: { 'opt/etc/xray/config.json': CONFIG } },
  'config update with a broken filter': { steps: ['update_file'], env: { RS_FILTER: '.log.loglevel = ' }, files: { 'opt/etc/xray/config.json': CONFIG } },
  'config update that is not an object': { steps: ['update_file'], env: { RS_FILTER: '.inbounds' }, files: { 'opt/etc/xray/config.json': CONFIG } },
  'general options save with a large config': {
    steps: ['save_general'],
    env: EXTERNAL,
    files: { 'opt/etc/xray/config.json': SUB_CONFIG, 'jffs/addons/custom_settings.txt': SETTINGS }
  },
  'apply with large DNS rule domains': {
    steps: ['apply'],
    env: EXTERNAL,
    files: { 'opt/etc/xray/config.json': CONFIG, 'jffs/addons/custom_settings.txt': `xray_payload0 ${DNS_CONFIG}\n` }
  },
  apply: {
    steps: ['apply'],
    files: { 'opt/etc/xray/config.json': CONFIG, 'jffs/addons/custom_settings.txt': `xray_payload0 ${APPLIED}\n` }
  },
  'apply without a current config': {
    steps: ['apply'],
    dirs: ['opt/etc/xray'],
    files: { 'jffs/addons/custom_settings.txt': `xray_payload0 ${APPLIED}\n` }
  },
  'empty directories': { steps: ['respond'], dirs: ['opt/etc/xray', 'share/backup'] },
  'missing directories': { steps: ['respond'] },
  'gz payload with base64': { steps: ['decode'], files: { payload: GZ } },
  'gz payload without base64': { steps: ['decode'], bin: 'nobase64', files: { payload: GZ } },
  'gz payload without base64 or openssl': { steps: ['decode'], bin: 'bare', files: { payload: GZ } },
  'plain payload': { steps: ['decode'], bin: 'bare', files: { payload: PLAIN } },
  'failing save': { steps: ['save_general'], env: { RS_APPLY_RC: '1' }, files: { 'opt/etc/xray/config.json': CONFIG } },
  'succeeding save': { steps: ['save_general'], env: { RS_APPLY_RC: '0' }, files: { 'opt/etc/xray/config.json': CONFIG } },
  'save without base64': {
    steps: ['save_general'],
    bin: 'nobase64',
    files: { 'opt/etc/xray/config.json': CONFIG, 'jffs/addons/custom_settings.txt': SETTINGS }
  },
  'save without base64 or openssl': {
    steps: ['save_general'],
    bin: 'bare',
    files: { 'opt/etc/xray/config.json': CONFIG, 'jffs/addons/custom_settings.txt': SETTINGS }
  }
};

const isDir = (p: string) => path.isAbsolute(p) && fs.existsSync(p) && fs.statSync(p).isDirectory();

const mirror = (dir: string, without: string[]): string => {
  fs.mkdirSync(dir, { recursive: true });
  const seen = new Set(without);
  for (const d of (process.env.PATH ?? '').split(path.delimiter).filter(isDir)) {
    for (const name of fs.readdirSync(d)) {
      if (seen.has(name)) continue;
      seen.add(name);
      fs.symlinkSync(path.join(d, name), path.join(dir, name));
    }
  }
  return dir;
};

const BINS_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'xrayui-response-bin-'));
const BINS: Record<Bin, string> = {
  host: process.env.PATH ?? '/usr/bin:/bin',
  nobase64: mirror(path.join(BINS_ROOT, 'nobase64'), ['base64']),
  bare: mirror(path.join(BINS_ROOT, 'bare'), ['base64', 'openssl'])
};
const OVERRIDES = Object.fromEntries(Object.entries(process.env).filter((e): e is [string, string] => /^RS_[A-Z]+_SCRIPT$/.test(e[0]) && e[1] !== undefined));

const exec = (shell: string[], args: string[], env: Record<string, string>) =>
  new Promise<{ stderr: string; code: number | null }>((resolve, reject) => {
    const child = spawn(shell[0], [...shell.slice(1), ...args], { env });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) => resolve({ stderr, code }));
  });

async function run(shell: string[], scenario: Scenario): Promise<Result> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xrayui-response-'));
  const at = (rel: string) => path.join(dir, rel);
  try {
    for (const rel of scenario.dirs ?? []) fs.mkdirSync(at(rel), { recursive: true });
    const files = { 'www/xray-ui-response.json': JSON.stringify(STALE), ...scenario.files };
    for (const [rel, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(at(rel)), { recursive: true });
      fs.writeFileSync(at(rel), content);
    }
    for (const [rel, target] of Object.entries(scenario.links ?? {})) fs.symlinkSync(at(target), at(rel));
    for (const [rel, time] of Object.entries(scenario.mtimes ?? {})) fs.utimesSync(at(rel), time, time);
    const env = { PATH: BINS[scenario.bin ?? 'host'], HOME: os.tmpdir(), ...OVERRIDES, ...scenario.env };
    const out = await exec(shell, [HARNESS, dir, ...scenario.steps], env);
    if (out.code === 70) throw new Error(out.stderr);
    const read = (rel: string) => (fs.existsSync(at(rel)) && fs.statSync(at(rel)).isFile() ? fs.readFileSync(at(rel), 'utf8') : undefined);
    const snapshot: Record<string, string | undefined> = {};
    for (const rel of [
      'www/xray-ui-response.json',
      'events.log',
      'decoded',
      'opt/etc/xray/config.json',
      'jffs/addons/custom_settings.txt',
      'share/data/biglist',
      'share/data/short',
      'share/escape'
    ])
      snapshot[rel] = read(rel);
    return {
      response: JSON.parse(snapshot['www/xray-ui-response.json'] ?? '{}'),
      events: (snapshot['events.log'] ?? '').split('\n').filter((l) => l !== ''),
      read: (rel) => snapshot[rel],
      stderr: out.stderr
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const results = new Map<string, Promise<Result>>();
const result = (shell: string[], name: string): Promise<Result> => {
  if (!scenarios[name]) throw new Error(`unknown scenario ${name}`);
  const key = `${shell.join(' ')}:${name}`;
  if (!results.has(key)) results.set(key, run(shell, scenarios[name]));
  return results.get(key)!;
};
const finalProgress = (r: Result) => r.events.filter((e) => e.startsWith('PROGRESS: ') && e.endsWith('|100'));

jest.setTimeout(120000);

afterAll(() => {
  fs.rmSync(BINS_ROOT, { recursive: true, force: true });
});

const LARGE_VALUES: Record<string, string[]> = {
  'failover.sh': ['pool', 'list', 'labeled', 'matched', 'candidates', 'failed', 'FAILOVER_STATE'],
  'subscriptions.sh': ['fetched', 'decoded', 'lines', 'cfg'],
  '_helper.sh': ['decoded', 'raw', 'assembled'],
  'response.sh': ['incoming_config'],
  'geodata.sh': ['datfile', 'filecontent'],
  'general_opts.sh': ['json_content'],
  'install.sh': ['json_content'],
  'api.sh': ['json_content']
};

it('never passes large values to printf, echo or [ in the backend', () => {
  const offenders: string[] = [];
  for (const [file, names] of Object.entries(LARGE_VALUES)) {
    const vars = names.join('|');
    const ref = `\\$(?:(?:${vars})|\\{(?:${vars})(?!:\\+)(?:\\}|[#%:][^"]*))"`;
    const pattern = new RegExp(`(\\[ !?\\s*-[nz] "${ref}|\\btest -[nz] "${ref}|\\[ "${ref} !?=|(printf|echo)\\b[^|;]*"${ref})`);
    fs.readFileSync(path.join(process.cwd(), 'src', 'backend', file), 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (pattern.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
      });
  }
  expect(offenders).toEqual([]);
});

it('builds the gz fixtures exactly as the frontend submits them', () => {
  expect(GZ.startsWith('gz:')).toBe(true);
  expect(CHUNKS.length).toBeGreaterThan(1);
  expect(PLAIN.startsWith('gz:')).toBe(false);
  for (const encoded of [VMESS_B64, LINKS_B64URL]) {
    expect(encoded.length % 4).not.toBe(0);
    expect(encoded).toMatch(/[-_]/);
  }
  expect(LINKS_JUNK.length).toBeGreaterThan(2048);
  for (const big of [BIG_LINKS, SUB_CONFIG, SUB_JSON]) expect(big.length).toBeGreaterThan(131072);
  expect(DNS_CONFIG.length).toBeLessThan(131072);
  expect(POOL.length).toBeGreaterThan(131072);
  expect(BIG_CONFIG_RAW.length).toBeGreaterThan(131072);
  expect(BIG_GEODATA.length).toBeGreaterThan(131072);
  expect(DNS_CONFIG.length * 2).toBeGreaterThan(131072);
  expect(EXTERNAL.RS_EXT_PRINTF).not.toBe('');
  expect(EXTERNAL.RS_EXT_ECHO).not.toBe('');
});

describe.each(SHELLS)('response backend under %s', (_label, shell) => {
  const get = (name: string) => result(shell, name);

  beforeAll(async () => {
    await Promise.all(Object.keys(scenarios).map((name) => get(name).catch(() => undefined)));
  });

  describe('initial_response with firmware BusyBox find', () => {
    it('lists regular and symlinked profile files and skips directories, dangling links and other files', async () => {
      const r = await get('profiles and backups');
      expect(r.response.xray?.profiles).toEqual(['b.json', 'config.json', 'linked.json', 'my profile.json']);
      expect(r.response.xray?.profile).toBe('b.json');
    });

    it('lists backups newest first and skips directories and other files', async () => {
      const r = await get('profiles and backups');
      expect(r.response.xray?.backups).toEqual(['before update.tar.gz', 'xrayui-2026-09-01.tar.gz', 'old.tar.gz']);
    });

    it('follows a symlinked profile directory', async () => {
      const r = await get('symlinked profile directory');
      expect(r.response.xray?.profiles).toEqual(['a.json', 'config.json']);
    });

    it.each(['empty directories', 'missing directories'])('returns empty lists and the default profile for %s', async (name) => {
      const r = await get(name);
      expect(r.response.xray?.profiles).toEqual([]);
      expect(r.response.xray?.backups).toEqual([]);
      expect(r.response.xray?.profile).toBe('config.json');
    });

    it('writes a complete response without calling find', async () => {
      for (const name of ['profiles and backups', 'symlinked profile directory', 'empty directories', 'missing directories']) {
        const r = await get(name);
        expect(r.events).toContain('initial_response rc=0');
        expect(r.response.loading).toBeUndefined();
        expect(r.response.xray?.core_version).toBe('26.3.27');
        expect(r.response.xray?.ui_version).toBe('0.70.0');
        expect(r.stderr).not.toContain('find: unrecognized');
      }
    });
  });

  describe('get_custom_geodata_tagfiles with firmware BusyBox find', () => {
    it('lists custom geodata files without their extension and skips directories', async () => {
      const r = await get('custom geodata files');
      expect(r.events).toContain('tagfiles rc=0');
      expect((r.response as { geodata?: { tags?: string[] } }).geodata?.tags).toEqual(['a', 'b', 'my list']);
      expect(r.stderr).not.toContain('find: unrecognized');
    });
  });

  describe('subscription decoding', () => {
    itIf(HAS_BASE64)('decodes a base64 subscription body with base64', async () => {
      const r = await get('subscription body with base64');
      expect(r.read('decoded')).toBe(LINKS);
    });

    itIf(HAS_OPENSSL)('decodes a base64 subscription body with openssl when base64 is missing', async () => {
      const r = await get('subscription body without base64');
      expect(r.read('decoded')).toBe(LINKS);
    });

    it('keeps the body as it is when neither base64 nor openssl is available', async () => {
      const r = await get('subscription body without base64 or openssl');
      expect(r.events).toContain('subscription_decode_body rc=0');
      expect(r.read('decoded')).toBe(LINKS_B64);
    });

    it('passes a plain list of links through unchanged', async () => {
      const r = await get('plain subscription body');
      expect(r.read('decoded')).toBe(LINKS);
    });

    itIf(HAS_BASE64)('decodes an unpadded URL-safe subscription body with base64', async () => {
      const r = await get('url-safe subscription body with base64');
      expect(r.read('decoded')).toBe(LINKS);
    });

    itIf(HAS_OPENSSL)('decodes an unpadded URL-safe subscription body with openssl when base64 is missing', async () => {
      const r = await get('url-safe subscription body without base64');
      expect(r.read('decoded')).toBe(LINKS);
    });

    it.each(['subscription body with junk with base64', 'subscription body with junk without base64'])('keeps a body with non-base64 junk undecoded: %s', async (name) => {
      const r = await get(name);
      expect(r.read('decoded')).toBe(LINKS_JUNK);
    });

    itIf(HAS_BASE64)('decodes an unpadded URL-safe vmess link with base64', async () => {
      const r = await get('vmess link with base64');
      expect(r.read('decoded')).toBe(VMESS);
    });

    itIf(HAS_OPENSSL)('decodes an unpadded URL-safe vmess link with openssl when base64 is missing', async () => {
      const r = await get('vmess link without base64');
      expect(r.read('decoded')).toBe(VMESS);
    });

    it('returns nothing for a vmess link when neither base64 nor openssl is available', async () => {
      const r = await get('vmess link without base64 or openssl');
      expect(r.read('decoded')).toBe('');
    });

    it.each(['vmess link with junk with base64', 'vmess link with junk without base64'])('rejects a vmess link with non-base64 characters: %s', async (name) => {
      const r = await get(name);
      expect(r.events).toContain('subscription_b64d rc=1');
      expect(r.read('decoded')).toBe('');
    });
  });

  describe('sweep_stale_staging with firmware BusyBox find', () => {
    it('removes staging sessions older than five minutes and keeps recent ones and plain files', async () => {
      const r = await get('stale staging sessions');
      expect(r.events).toContain('sweep rc=0');
      expect(r.events).toContain('staging: fresh stray ');
      expect(r.stderr).not.toContain('find: unrecognized');
    });
  });

  describe('remove_loading_progress', () => {
    const sleeps = (res: Result) => res.events.filter((e) => e.startsWith('sleep '));

    it('keeps an error on screen longer before clearing it', async () => {
      const r = await get('error progress cleanup');
      expect(sleeps(r)).toEqual(['sleep 1', 'sleep 5']);
      expect(r.response.loading).toBeUndefined();
      expect(r.response.xray?.profile).toBe('config.json');
    });

    it('clears other messages after the usual delay', async () => {
      const r = await get('success progress cleanup');
      expect(sleeps(r)).toEqual(['sleep 1']);
      expect(r.response.loading).toBeUndefined();
    });

    it('leaves the progress of an action that started during the wait', async () => {
      const r = await get('error progress replaced during the wait');
      expect(sleeps(r)).toEqual(['sleep 1', 'sleep 5']);
      expect(r.response.loading).toEqual({ message: 'Restarting Xray service...', progress: 35 });
    });
  });

  describe('process_subscriptions with bodies and a config over 128 KiB', () => {
    const outbound = (r: Result, tag: string) => (JSON.parse(r.read('opt/etc/xray/config.json') ?? '{}').outbounds as Record<string, any>[]).find((o) => o.tag === tag);

    it.each(['large subscriptions', 'large plain subscription'])('refreshes every reachable outbound: %s', async (name) => {
      const r = await get(name);
      expect(r.events).toContain('process_subscriptions rc=0');
      expect(r.stderr).not.toContain('Argument list too long');
      const proxy = outbound(r, 'proxy');
      expect(proxy?.settings.vnext[0].address).toBe('198.51.100.1');
      expect(proxy?.streamSettings.sockopt).toEqual({ mark: 255 });
      expect(proxy?.surl).toBe('https://sub.example/big');
      expect(outbound(r, 'json')?.settings.vnext[0].address).toBe('json.example.com');
      expect(outbound(r, 'gone')?.settings.servers[0].address).toBe('203.0.113.202');
      expect(r.events.some((e) => e.startsWith("WARN: Subscription URL of outbound 'gone'"))).toBe(true);
      expect(JSON.parse(r.read('opt/etc/xray/config.json') ?? '{}').routing.rules).toHaveLength(BIG_RULES.length);
    });
  });

  describe('subscription picked by its name', () => {
    it('picks the link whose percent-encoded name matches the outbound tag', async () => {
      const r = await get('subscription picked by its name');
      expect(r.events).toContain('process_subscriptions rc=0');
      const ob = JSON.parse(r.read('opt/etc/xray/config.json') ?? '{}').outbounds[0];
      expect(ob.tag).toBe('Узел 7');
      expect(ob.settings.vnext[0].address).toBe('198.18.0.8');
    });
  });

  describe('auto-fallback pool over 128 KiB', () => {
    it('filters, orders and searches the whole pool without jq regex support', async () => {
      const r = await get('large failover pool');
      expect(r.stderr).not.toContain('Argument list too long');
      expect(r.stderr).not.toContain('ONIGURUMA');
      expect(r.events).toContain('all: 450');
      expect(r.events).toContain(`filtered: ${[7, 123, 200, 250, 449].map((i) => poolLink(i, POOL_LABELS[i])).join(' ')} `);
      expect(r.events).toContain('unmatched: 450');
      expect(r.events).toContain('WARN: Failover: no pool entry matches the rotation filters - using the whole pool');
      expect(r.events).toContain(`next: ${poolLink(401)}`);
      expect(r.events).toContain(`origin: ${poolLink(300)}`);
      expect(r.events).toContain('has known rc=0');
      expect(r.events).toContain('has unknown rc=1');
      expect(r.events).toContain('list has rc=0');
      expect(r.events).toContain(`by label: ${poolLink(420)}`);
      expect(r.events).toContain(`by address: ${poolLink(420)}`);
    });
  });

  describe('jq_update_file', () => {
    it('updates the file when the filter produces an object', async () => {
      const r = await get('config update');
      expect(r.events).toContain('jq_update_file rc=0');
      expect(JSON.parse(r.read('opt/etc/xray/config.json') ?? '{}').log.loglevel).toBe('info');
    });

    it.each(['config update with a broken filter', 'config update that is not an object', 'config update that emits two documents'])(
      'leaves the file untouched and removes its temp files: %s',
      async (name) => {
        const r = await get(name);
        expect(r.events).toContain('jq_update_file rc=1');
        expect(r.read('opt/etc/xray/config.json')).toBe(CONFIG);
        expect(r.events).toContain('files: config.json ');
      }
    );

    it('writes through a symlinked config and keeps the link', async () => {
      const r = await get('config update through a symlink');
      expect(r.events).toContain('jq_update_file rc=0');
      expect(JSON.parse(r.read('opt/etc/xray/config.json') ?? '{}').log.loglevel).toBe('info');
      expect(r.events).toContain('files: config.json ');
    });
  });

  describe('saving a configuration over 128 KiB', () => {
    itIf(HAS_BASE64)('saves General Options without emptying a large config', async () => {
      const r = await get('general options save with a large config');
      expect(r.stderr).not.toContain('Argument list too long');
      const config = JSON.parse(r.read('opt/etc/xray/config.json') ?? '{}');
      expect(config.log.loglevel).toBe('info');
      expect(config.routing.rules).toHaveLength(BIG_RULES.length);
      expect(finalProgress(r)).toEqual(['PROGRESS: General settings applied.|100']);
    });

    it('applies a config whose DNS rule domains grow it past 128 KiB', async () => {
      const r = await get('apply with large DNS rule domains');
      expect(r.stderr).not.toContain('Argument list too long');
      expect(r.events).toContain('apply_config rc=0');
      const config = JSON.parse(r.read('opt/etc/xray/config.json') ?? '{}');
      expect(config.routing.rules[0].domain).toHaveLength(DNS_DOMAINS.length);
      expect(config.dns.servers[0].domains).toHaveLength(DNS_DOMAINS.length);
    });
  });

  describe('uploads over 128 KiB', () => {
    itIf(HAS_BASE64)('applies a configuration whose decoded size is over 128 KiB', async () => {
      const r = await get('apply a config over 128 KiB');
      expect(r.stderr).not.toContain('Argument list too long');
      expect(r.events).toContain('apply_config rc=0');
      expect(JSON.parse(r.read('opt/etc/xray/config.json') ?? '{}').routing.rules).toHaveLength(3000);
    });

    itIf(HAS_BASE64)('saves a custom geodata list over 128 KiB', async () => {
      const r = await get('save a custom geodata list over 128 KiB');
      expect(r.stderr).not.toContain('Argument list too long');
      expect(r.events).toContain('geodata_recompile rc=0');
      expect(r.events).toContain('recompile_all');
      expect(r.read('share/data/biglist')).toBe(`${BIG_GEODATA}\n`);
    });

    itIf(HAS_BASE64)('does not add blank lines when a list is saved again', async () => {
      const r = await get('save a custom geodata list loaded back from the router');
      expect(r.events).toContain('geodata_recompile rc=0');
      expect(r.read('share/data/short')).toBe('domain:a.example\ndomain:b.example\n');
    });

    itIf(HAS_BASE64)('refuses a custom geodata tag that contains a path', async () => {
      const r = await get('save a custom geodata list with a path in its tag');
      expect(r.events).toContain('geodata_recompile rc=1');
      expect(r.events).not.toContain('recompile_all');
      expect(r.read('share/escape')).toBeUndefined();
    });
  });

  describe('apply_config', () => {
    it('writes the new configuration without reporting the end of the action itself', async () => {
      const r = await get('apply');
      expect(r.events).toContain('apply_config rc=0');
      expect(JSON.parse(r.read('opt/etc/xray/config.json') ?? '{}')).toMatchObject(JSON.parse(APPLIED));
      expect(finalProgress(r)).toEqual([]);
    });

    it('ends with an error when the current configuration cannot be backed up', async () => {
      const r = await get('apply without a current config');
      expect(r.events).toContain('apply_config rc=1');
      expect(finalProgress(r)).toEqual([expect.stringMatching(/^PROGRESS: Error: failed to back up/)]);
      expect(r.read('opt/etc/xray/config.json')).toBeUndefined();
    });
  });

  describe('decode_payload', () => {
    itIf(HAS_BASE64)('decodes a frontend gz payload with base64', async () => {
      const r = await get('gz payload with base64');
      expect(r.events).toContain('decode_payload rc=0');
      expect(r.read('decoded')).toBe(`${RAW}\n`);
    });

    itIf(HAS_OPENSSL)('decodes a frontend gz payload with openssl when base64 is missing', async () => {
      const r = await get('gz payload without base64');
      expect(r.events).toContain('decode_payload rc=0');
      expect(r.read('decoded')).toBe(`${RAW}\n`);
    });

    it('fails without output when neither base64 nor openssl is available', async () => {
      const r = await get('gz payload without base64 or openssl');
      expect(r.events).toContain('decode_payload rc=1');
      expect(r.read('decoded')).toBe('');
    });

    it('passes a plain payload through unchanged', async () => {
      const r = await get('plain payload');
      expect(r.events).toContain('decode_payload rc=0');
      expect(r.read('decoded')).toBe(`${PLAIN}\n`);
    });
  });

  describe('applygeneraloptions dispatch', () => {
    it('neither rebuilds the response nor reports success when the save fails', async () => {
      const r = await get('failing save');
      expect(r.events).toContain('apply_general_options');
      expect(finalProgress(r)).toEqual([]);
      expect(r.events.some((e) => e.startsWith('OK: Saved initial response'))).toBe(false);
      expect(r.response).toEqual(STALE);
    });

    it('rebuilds the response and then reports success when the save succeeds', async () => {
      const r = await get('succeeding save');
      const order = ['apply_general_options', 'OK: Saved initial response successfully.', 'PROGRESS: General settings applied.|100'];
      expect(r.events.filter((e) => order.includes(e))).toEqual(order);
      expect(finalProgress(r)).toEqual(['PROGRESS: General settings applied.|100']);
    });

    itIf(HAS_OPENSSL)('saves a gz payload on a router without base64', async () => {
      const r = await get('save without base64');
      expect(r.events).toContain('SET: ipsec=redirect');
      expect(r.events).toContain(`SET: subscriptionLinks=${GENERAL.subscriptions.links.join('|')}`);
      expect(JSON.parse(r.read('opt/etc/xray/config.json') ?? '{}').log.loglevel).toBe('info');
      expect((r.response.xray?.hooks as Record<string, string>).after_firewall_start).toBe(GENERAL.hooks.after_firewall_start);
      expect(r.read('jffs/addons/custom_settings.txt')).toBe('xray_startup y\n');
      expect(finalProgress(r)).toEqual(['PROGRESS: General settings applied.|100']);
    });

    it('changes nothing and reports an error on a router without base64 or openssl', async () => {
      const r = await get('save without base64 or openssl');
      expect(finalProgress(r)).toEqual([expect.stringMatching(/^PROGRESS: Error: /)]);
      expect(r.events.some((e) => e.startsWith('SET: '))).toBe(false);
      expect(r.read('opt/etc/xray/config.json')).toBe(CONFIG);
      expect(r.response).toEqual(STALE);
    });
  });
});
