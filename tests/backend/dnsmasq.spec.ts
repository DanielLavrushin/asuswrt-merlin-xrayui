import { ChildProcess, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HARNESS = path.join(process.cwd(), 'tests', 'backend', 'dnsmasq', 'harness.sh');

const which = (bin: string): string | undefined => {
  const out = spawnSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf8' });
  return out.status === 0 ? out.stdout.trim() : undefined;
};
const BUSYBOX = process.platform === 'linux' ? which('busybox') : undefined;

interface Run {
  config: unknown;
  env?: Record<string, string>;
  steps?: string[];
  prestate?: string;
}

interface Scenario {
  runs: Run[];
  files?: Record<string, string>;
}

interface Result {
  read: (rel: string) => string | undefined;
  lines: (rel: string) => string[] | undefined;
  exists: (rel: string) => boolean;
  header: string;
  ipsetLines: string[];
  sets: Record<string, string>;
  members: (set: string) => string[];
  entries: string[];
  messages: string[];
  events: string[];
  v2dat: string[];
  prime: string;
  stderr: string;
}

const deadPid = (): string => spawnSync('sh', ['-c', 'echo $$'], { encoding: 'utf8' }).stdout.trim();
let lockHolder: ChildProcess | undefined;
const livePid = (): string => {
  lockHolder = spawn('sleep', ['300'], { stdio: 'ignore' });
  return String(lockHolder.pid);
};

const vless = (tag: string) => ({ tag, protocol: 'vless', settings: { vnext: [{ address: '203.0.113.10', port: 443, users: [{ id: 'u' }] }] } });
const freedom = (tag: string | undefined, extra: Record<string, unknown> = {}) => ({ ...(tag === undefined ? {} : { tag }), protocol: 'freedom', ...extra });
const blackhole = (tag: string) => ({ tag, protocol: 'blackhole' });
const BASE_OUTBOUNDS = [vless('proxy'), freedom('direct'), blackhole('block')];
const xray = (rules: unknown[], outbounds: unknown[] = BASE_OUTBOUNDS, routing: Record<string, unknown> = {}) => ({
  inbounds: [],
  outbounds,
  routing: { rules, ...routing }
});
const toProxy = (domain: unknown, ip?: unknown) => ({ ...(domain === undefined ? {} : { domain }), ...(ip === undefined ? {} : { ip }), outboundTag: 'proxy' });
const toDirect = (domain: unknown, ip?: unknown) => ({ ...(domain === undefined ? {} : { domain }), ...(ip === undefined ? {} : { ip }), outboundTag: 'direct' });
const redirect = { ipsec: 'redirect' };
const bypass = { ipsec: 'bypass' };

const SELECTION_OUTBOUNDS = [
  vless('proxy'),
  freedom('direct'),
  freedom('direct-tuned', {
    settings: { domainStrategy: 'UseIPv4', noises: [], proxyProtocol: 0, redirect: '' },
    streamSettings: { sockopt: { dialerProxy: '' } },
    proxySettings: {}
  }),
  freedom('fragment', { settings: { fragment: { packets: 'tlshello', length: '100-200', interval: '10-20' } } }),
  freedom('noises', { settings: { noises: [{ type: 'rand', packet: '10-20', delay: '10-16' }] } }),
  freedom('redirect', { settings: { redirect: '127.0.0.1:5353' } }),
  freedom('proxyprotocol', { settings: { proxyProtocol: 2 } }),
  freedom('dialer', { streamSettings: { sockopt: { dialerProxy: 'proxy' } } }),
  freedom('chained', { proxySettings: { tag: 'proxy' } }),
  freedom('vpn-iface', { streamSettings: { sockopt: { interface: 'wgc1' } } }),
  freedom('vpn-source', { sendThrough: '10.6.0.2' }),
  blackhole('block')
];
const via = (name: string, target: Record<string, string>) => ({ domain: [`via-${name}.example`], ...target });
const SELECTION_RULES = [
  via('proxy', { outboundTag: 'proxy' }),
  via('direct', { outboundTag: 'direct' }),
  via('direct-tuned', { outboundTag: 'direct-tuned' }),
  via('fragment', { outboundTag: 'fragment' }),
  via('noises', { outboundTag: 'noises' }),
  via('redirect', { outboundTag: 'redirect' }),
  via('proxyprotocol', { outboundTag: 'proxyprotocol' }),
  via('dialer', { outboundTag: 'dialer' }),
  via('chained', { outboundTag: 'chained' }),
  via('vpn-iface', { outboundTag: 'vpn-iface' }),
  via('vpn-source', { outboundTag: 'vpn-source' }),
  via('balancer', { balancerTag: 'lb' }),
  via('block', { outboundTag: 'block' }),
  via('unknown-outbound', { outboundTag: 'gone' }),
  { ip: ['198.51.100.1'], outboundTag: 'proxy' },
  { ip: ['198.51.100.2'], outboundTag: 'direct' }
];
const SELECTION_CONFIG = xray(SELECTION_RULES, SELECTION_OUTBOUNDS, { balancers: [{ tag: 'lb', selector: ['proxy'] }] });

const SYNTAX_DOMAINS = [
  'plain.example.com',
  '.dotted.example.org',
  'domain:dom.example.net',
  'full:full.example.net',
  'domain:localhost',
  'regexp:^re\\.example\\.com$',
  'regex:^rx\\.example\\.com$',
  'keyword:kw',
  'dotless:intranet',
  'word',
  'foo:bar.example.com',
  'domain:',
  'domain:bad..name.example',
  'full:a/b.example',
  'domain:with space.example',
  'geosite:google',
  'geosite:netflix@ads',
  'geosite:!cn',
  'ext:xrayui:custom',
  'ext:other.dat:othertag'
];
const SYNTAX_IPS = [
  'geoip:de',
  'geoip:ca',
  'geoip:!ru',
  '!10.0.0.0/8',
  'ext:otherip.dat:corp',
  '203.0.113.5',
  '198.51.100.0/24',
  '0.0.0.0/0',
  '10.0.0.0/33',
  '2001:db8::1',
  '2001:db8:abcd::/48',
  '::/0',
  'fe80::1%eth0',
  'not-an-ip',
  'geosite:google'
];
const SYNTAX_CONFIG = xray([
  toProxy(SYNTAX_DOMAINS, SYNTAX_IPS),
  { domains: ['alias.example.com'], outboundTag: 'proxy' },
  { domain: 'single.example.com', ip: '198.51.100.77', outboundTag: 'proxy' },
  toDirect(['direct-only.example.com'], ['192.0.2.200'])
]);

const LEARNED_PRESTATE =
  'ipset create XRAYUI_PROXY4 hash:net family inet timeout 86400; ipset add XRAYUI_PROXY4 192.0.2.10 timeout 5000; ' +
  'ipset create XRAYUI_PROXY6 hash:net family inet6 timeout 86400; ipset add XRAYUI_PROXY6 2001:db8::10 timeout 5000';
const LEARNED_FILE = '# 1000\nXRAYUI_PROXY4 192.0.2.10 5000\n';
const SOURCES = 'share/dnsmasq/sources.list';
const LEARNED = 'share/dnsmasq/learned.ipset';
const PRIME = 'share/dnsmasq/prime.list';
const DIRECT = 'share/dnsmasq/direct.conf';
const CONF = 'etc/dnsmasq.conf';
const LOCK = 'tmp/xrayui_dnsmasq.lock';

const bigTag = ['[huge]', ...Array.from({ length: 250 }, (_, i) => `host-${String(i).padStart(3, '0')}.example`), 'dotlesstld', 'keyword:huge'].join('\n') + '\n';

const DEAD_PID = deadPid();
const LIVE_PID = BUSYBOX ? livePid() : '0';
const OLD_DIRECT = '# Autogenerated by xrayui on 2026-01-01 00:00:00\nipset=/kept.example.com/XRAYUI_PROXY4\n';

const scenarios: Record<string, Scenario> = {
  'redirect rule selection': { runs: [{ config: SELECTION_CONFIG, env: redirect }] },
  'bypass rule selection': { runs: [{ config: SELECTION_CONFIG, env: bypass }] },
  'redirect with an untagged freedom outbound': {
    runs: [
      {
        config: xray([via('balancer', { balancerTag: 'lb' }), via('proxy', { outboundTag: 'proxy' })], [freedom(undefined), vless('proxy')], {
          balancers: [{ tag: 'lb', selector: ['proxy'] }]
        }),
        env: redirect
      }
    ]
  },
  'redirect entry syntax': { runs: [{ config: SYNTAX_CONFIG, env: redirect }] },
  'redirect entry syntax dual-stack': { runs: [{ config: SYNTAX_CONFIG, env: { ...redirect, DM_IPV6: '1' } }] },
  'bypass attribute filters': {
    runs: [{ config: xray([toDirect(['geosite:netflix@ads', 'geosite:google', 'ext:xrayui:custom@cn', 'kept.example.com'])]), env: { ...bypass, DM_IPV6: '1' } }]
  },
  'redirect with a non-ascii domain': {
    files: { 'opt/sbin/intl.dat': '[intl]\nascii-intl.example\nпочта.рф\nfull:сайт.рф\n' },
    runs: [{ config: xray([toProxy(['пример.рф', 'domain:kremlin.рф', 'ascii.example.com', 'ext:intl.dat:intl'])]), env: redirect }]
  },
  'redirect with a comma-separated domain string': {
    runs: [{ config: xray([{ domain: 'comma-a.example.com,comma-b.example.com', ip: '198.51.100.8,198.51.100.9', outboundTag: 'proxy' }]), env: redirect }]
  },
  'redirect with missing asset files': {
    runs: [{ config: xray([toProxy(['ext:missing.dat:foo', 'kept.example.com'], ['ext:missing-ip.dat:bar', '203.0.113.1'])]), env: redirect }]
  },
  'static networks replace the NET set without touching learned addresses': {
    runs: [
      {
        config: xray([toProxy(['kept.example.com'], ['203.0.113.0/24', 'geoip:de', '2001:db8::/32'])]),
        env: { ...redirect, DM_IPV6: '1' },
        prestate:
          LEARNED_PRESTATE +
          '; ipset create XRAYUI_PROXY4_NET hash:net family inet; ipset add XRAYUI_PROXY4_NET 192.0.2.99' +
          '; ipset create XRAYUI_PROXY4_NET_T777 hash:net family inet; ipset add XRAYUI_PROXY4_NET_T777 192.0.2.98' +
          '; ipset create XRAYUI_BYPASS4_NET hash:net family inet; ipset add XRAYUI_BYPASS4_NET 192.0.2.50' +
          '; ipset create XRAYUI_BYPASS6_NET hash:net family inet6; ipset add XRAYUI_BYPASS6_NET 2001:db8:50::/48'
      }
    ]
  },
  'bypass mode flushes the redirect NET sets': {
    runs: [
      {
        config: xray([toDirect(['kept.example.com'], ['192.0.2.0/24'])]),
        env: bypass,
        prestate: 'ipset create XRAYUI_PROXY4_NET hash:net family inet; ipset add XRAYUI_PROXY4_NET 203.0.113.0/24'
      }
    ]
  },
  'removing a proxied domain flushes learned addresses': {
    files: { [SOURCES]: 'd gone.example.com\nd kept.example.com\nm redirect\n', [LEARNED]: LEARNED_FILE },
    runs: [{ config: xray([toProxy(['kept.example.com'])]), env: { ...redirect, DM_IPV6: '1' }, prestate: LEARNED_PRESTATE }]
  },
  'removing a proxied geosite tag flushes learned addresses': {
    files: { [SOURCES]: 'd kept.example.com\nm redirect\ns <STATE>/opt/sbin/geosite.dat google\ns <STATE>/opt/sbin/geosite.dat youtube\n', [LEARNED]: LEARNED_FILE },
    runs: [{ config: xray([toProxy(['kept.example.com', 'geosite:google'])]), env: redirect, prestate: LEARNED_PRESTATE }]
  },
  'adding proxied entries keeps learned addresses': {
    files: { [SOURCES]: 'd kept.example.com\nm redirect\ns <STATE>/opt/sbin/geosite.dat google\n', [LEARNED]: LEARNED_FILE },
    runs: [
      {
        config: xray([toProxy(['kept.example.com', 'new.example.com', 'geosite:google', 'geosite:youtube'], ['203.0.113.0/24'])]),
        env: redirect,
        prestate: LEARNED_PRESTATE
      }
    ]
  },
  'switching from bypass to redirect flushes learned addresses': {
    files: { [SOURCES]: 'd kept.example.com\nm bypass\n', [LEARNED]: LEARNED_FILE },
    runs: [{ config: xray([toProxy(['kept.example.com'])]), env: redirect, prestate: LEARNED_PRESTATE }]
  },
  'bypass mode drops the learned file': {
    files: { [SOURCES]: 'd kept.example.com\nm bypass\n', [LEARNED]: LEARNED_FILE },
    runs: [{ config: xray([toDirect(['kept.example.com'])]), env: bypass }]
  },
  'unparseable xray config': {
    files: { [SOURCES]: 'd kept.example.com\nm redirect\ns <STATE>/opt/sbin/geosite.dat google\n', [LEARNED]: LEARNED_FILE, 'broken.json': '{ "routing": { "rules": [ ' },
    runs: [
      {
        config: '<STATE>/broken.json',
        env: redirect,
        prestate: LEARNED_PRESTATE + '; ipset create XRAYUI_PROXY4_NET hash:net family inet; ipset add XRAYUI_PROXY4_NET 203.0.113.0/24'
      }
    ]
  },
  'priming fresh tags': {
    files: { [SOURCES]: 'm redirect\ns <STATE>/opt/sbin/geosite.dat google\n' },
    runs: [
      {
        config: xray([toProxy(['explicit.example.com', 'domain:localhost', 'full:full.example.org', 'geosite:google', 'geosite:youtube', 'ext:other.dat:othertag'])]),
        env: redirect
      }
    ]
  },
  'priming caps the list': {
    files: { [SOURCES]: 'm redirect\n', 'opt/sbin/big.dat': bigTag },
    runs: [{ config: xray([toProxy(['a.example.com', 'b.example.com', 'c.example.com', 'ext:big.dat:huge'])]), env: redirect }]
  },
  'priming on the first run': {
    runs: [{ config: xray([toProxy(['explicit.example.com', 'geosite:youtube'])]), env: redirect }]
  },
  'priming in bypass mode': {
    files: { [SOURCES]: 'm bypass\n' },
    runs: [{ config: xray([toDirect(['direct.example.com', 'geosite:youtube'])]), env: bypass }]
  },
  'ipset mode off': {
    files: { [SOURCES]: 'd kept.example.com\nm redirect\n', [LEARNED]: LEARNED_FILE, [PRIME]: 'stale.example.com\n' },
    runs: [{ config: SYNTAX_CONFIG, env: { ipsec: 'off' } }]
  },
  'two runs append conf-file once': {
    runs: [
      { config: xray([toProxy(['kept.example.com'])]), env: redirect },
      { config: xray([toProxy(['kept.example.com', 'second.example.com'])]), env: redirect }
    ]
  },
  'stale lock with a dead pid': {
    runs: [
      {
        config: xray([toProxy(['kept.example.com'])]),
        env: redirect,
        prestate: `mkdir -p "$DM_STATE/${LOCK}"; echo ${DEAD_PID} >"$DM_STATE/${LOCK}/pid"`
      }
    ]
  },
  'lock held by a live process': {
    files: { [DIRECT]: OLD_DIRECT },
    runs: [
      {
        config: xray([toProxy(['kept.example.com', 'new.example.com'])]),
        env: { ...redirect, DM_NO_SLEEP: '1' },
        prestate: `mkdir -p "$DM_STATE/${LOCK}"; echo ${LIVE_PID} >"$DM_STATE/${LOCK}/pid"`
      }
    ]
  },
  'stale lock without a pid file': {
    runs: [{ config: xray([toProxy(['kept.example.com'])]), env: redirect, prestate: `mkdir -p "$DM_STATE/${LOCK}"` }]
  },
  'legacy lock and ipset.rules are removed': {
    files: { 'share/dnsmasq/ipset.rules': 'create XRAYUI_PROXY4 hash:net\n' },
    runs: [{ config: xray([toProxy(['kept.example.com'])]), env: redirect, prestate: 'mkdir -p "$DM_STATE/share/dnsmasq/.lock"' }]
  },
  'dnsmasq_configure in redirect mode twice': {
    runs: [
      { config: xray([toProxy(['kept.example.com'])]), env: redirect, steps: ['configure'] },
      { config: xray([toProxy(['kept.example.com'])]), env: redirect, steps: ['configure'] }
    ]
  },
  'catch-all networks in bypass mode': {
    runs: [{ config: xray([toDirect(['kept.example.com'], ['0.0.0.0/0', '::/0', '192.0.2.0/24'])]), env: { ...bypass, DM_IPV6: '1' } }]
  },
  'unchanged rules reuse the previous output': {
    runs: [
      { config: xray([toProxy(['kept.example.com', 'geosite:google'], ['geoip:de', '203.0.113.0/24'])]), env: redirect },
      { config: xray([toProxy(['kept.example.com', 'geosite:google'], ['geoip:de', '203.0.113.0/24'])]), env: redirect }
    ]
  },
  'a changed dat file invalidates the reuse': {
    runs: [
      { config: xray([toProxy(['kept.example.com', 'geosite:google'])]), env: redirect },
      {
        config: xray([toProxy(['kept.example.com', 'geosite:google'])]),
        env: redirect,
        prestate: 'sed "s/^android$/android\\nnew-in-google.example/" "$DM_STATE/opt/sbin/geosite.dat" >"$DM_STATE/g.tmp" && mv "$DM_STATE/g.tmp" "$DM_STATE/opt/sbin/geosite.dat"'
      }
    ]
  },
  'a lost NET set is reloaded while direct.conf is reused': {
    runs: [
      { config: xray([toProxy(['geosite:google'], ['geoip:de'])]), env: redirect },
      { config: xray([toProxy(['geosite:google'], ['geoip:de'])]), env: redirect, prestate: 'ipset destroy XRAYUI_PROXY4_NET' }
    ]
  },
  'dnsmasq_configure with ipset off': {
    runs: [{ config: xray([toProxy(['kept.example.com'])]), env: { ipsec: 'off' }, steps: ['configure'] }]
  }
};

const exec = (args: string[], env: Record<string, string>) =>
  new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve, reject) => {
    const child = spawn(BUSYBOX!, ['sh', ...args], { env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) => resolve({ stdout, stderr, code }));
  });

async function run(scenario: Scenario): Promise<Result> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xrayui-dnsmasq-'));
  const fill = (text: string) => text.split('<STATE>').join(dir);
  const scrub = (text: string) => text.split(dir).join('<STATE>');
  try {
    for (const [rel, content] of Object.entries(scenario.files ?? {})) {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), fill(content));
    }
    let stderr = '';
    for (const [i, r] of scenario.runs.entries()) {
      let configPath: string;
      if (typeof r.config === 'string') {
        configPath = fill(r.config);
      } else {
        configPath = path.join(dir, `config.${i}.json`);
        fs.writeFileSync(configPath, JSON.stringify(r.config));
      }
      const env = { PATH: process.env.PATH ?? '/usr/bin:/bin', HOME: os.tmpdir(), DM_PRESTATE: r.prestate ?? '', ...r.env };
      const out = await exec([HARNESS, dir, configPath, ...(r.steps ?? ['ipset_domains'])], env);
      stderr += out.stderr;
      if (out.code === 70) throw new Error(out.stderr);
    }
    const readRaw = (rel: string) => {
      const p = path.join(dir, rel);
      return fs.existsSync(p) && fs.statSync(p).isFile() ? scrub(fs.readFileSync(p, 'utf8')) : undefined;
    };
    const snapshot: Record<string, string | undefined> = {};
    for (const rel of [
      SOURCES,
      LEARNED,
      PRIME,
      DIRECT,
      CONF,
      'ipset.sets',
      'ipset.entries',
      'messages.log',
      'events.log',
      'v2dat.calls',
      'prime.log',
      'share/dnsmasq/ipset.rules'
    ]) {
      snapshot[rel] = readRaw(rel);
    }
    const existing = new Set(
      [LOCK, 'share/dnsmasq/.stage', 'share/dnsmasq/.lock', LEARNED, PRIME, 'share/dnsmasq/ipset.rules'].filter((rel) => fs.existsSync(path.join(dir, rel)))
    );
    const split = (text?: string) => (text === undefined ? undefined : text.split('\n').filter((l) => l !== ''));
    const direct = split(snapshot[DIRECT]) ?? [];
    const entries = split(snapshot['ipset.entries']) ?? [];
    const sets: Record<string, string> = {};
    for (const line of split(snapshot['ipset.sets']) ?? []) {
      const [name, ...rest] = line.split(' ');
      sets[name] = rest.join(' ');
    }
    return {
      read: (rel) => snapshot[rel],
      lines: (rel) => split(snapshot[rel]),
      exists: (rel) => existing.has(rel),
      header: direct[0] ?? '',
      ipsetLines: direct.slice(1),
      sets,
      members: (set) =>
        entries
          .filter((l) => l.split(' ')[0] === set)
          .map((l) => l.split(' ').slice(1).join(' '))
          .sort(),
      entries,
      messages: split(snapshot['messages.log']) ?? [],
      events: split(snapshot['events.log']) ?? [],
      v2dat: split(snapshot['v2dat.calls']) ?? [],
      prime: snapshot['prime.log'] ?? '',
      stderr: scrub(stderr)
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const results = new Map<string, Promise<Result>>();
const result = (name: string): Promise<Result> => {
  if (!scenarios[name]) throw new Error(`unknown scenario ${name}`);
  if (!results.has(name)) results.set(name, run(scenarios[name]));
  return results.get(name)!;
};

const domainsIn = (r: Result, set: string) =>
  r.ipsetLines
    .filter((l) => l.split('/')[2] === set || l.split('/')[2]?.split(',')[0] === set)
    .map((l) => l.split('/')[1])
    .sort();
const skipped = (r: Result) =>
  r.messages
    .map((m) => /^WARN: dnsmasq: rule entry '(.*)' is not added to the ipset: (.*)$/.exec(m))
    .filter((m): m is RegExpExecArray => m !== null)
    .reduce<Record<string, string>>((acc, m) => ({ ...acc, [m[1]]: m[2] }), {});

jest.setTimeout(180000);

afterAll(() => {
  lockHolder?.kill();
});

const describeWithBusybox = BUSYBOX ? describe : describe.skip;

describeWithBusybox('dnsmasq.sh ipset domains', () => {
  beforeAll(async () => {
    await Promise.all(Object.keys(scenarios).map((name) => result(name).catch(() => undefined)));
  });

  describe('rule selection', () => {
    it('sends every non-direct rule to the proxy set in redirect mode', async () => {
      const r = await result('redirect rule selection');
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toEqual(
        expect.arrayContaining([
          'via-balancer.example',
          'via-block.example',
          'via-chained.example',
          'via-dialer.example',
          'via-fragment.example',
          'via-noises.example',
          'via-proxy.example',
          'via-proxyprotocol.example',
          'via-redirect.example',
          'via-unknown-outbound.example'
        ])
      );
      expect(domainsIn(r, 'XRAYUI_PROXY4')).not.toContain('via-direct.example');
      expect(domainsIn(r, 'XRAYUI_PROXY4')).not.toContain('via-direct-tuned.example');
      expect(r.members('XRAYUI_PROXY4_NET')).toEqual(['198.51.100.1']);
      expect(r.ipsetLines.every((l) => l.endsWith('/XRAYUI_PROXY4'))).toBe(true);
    });

    it('sends only plain freedom rules to the bypass set in bypass mode', async () => {
      const r = await result('bypass rule selection');
      expect(domainsIn(r, 'XRAYUI_BYPASS4').filter((d) => !d.startsWith('via-vpn-'))).toEqual(['via-direct-tuned.example', 'via-direct.example']);
      expect(r.members('XRAYUI_BYPASS4_NET')).toEqual(['198.51.100.2']);
      expect(r.ipsetLines.every((l) => l.endsWith('/XRAYUI_BYPASS4'))).toBe(true);
    });

    it('treats a freedom outbound bound to another interface as non-direct', async () => {
      expect(domainsIn(await result('redirect rule selection'), 'XRAYUI_PROXY4')).toContain('via-vpn-iface.example');
      expect(domainsIn(await result('bypass rule selection'), 'XRAYUI_BYPASS4')).not.toContain('via-vpn-iface.example');
    });

    it('treats a freedom outbound with a custom source address as non-direct', async () => {
      expect(domainsIn(await result('redirect rule selection'), 'XRAYUI_PROXY4')).toContain('via-vpn-source.example');
      expect(domainsIn(await result('bypass rule selection'), 'XRAYUI_BYPASS4')).not.toContain('via-vpn-source.example');
    });

    it('does not mistake a balancer rule for an untagged freedom outbound', async () => {
      const r = await result('redirect with an untagged freedom outbound');
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toEqual(['via-balancer.example', 'via-proxy.example']);
    });
  });

  describe('entry syntax', () => {
    it('turns plain, dotted, domain: and full: entries into ipset lines', async () => {
      const r = await result('redirect entry syntax');
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toEqual(
        expect.arrayContaining(['plain.example.com', 'dotted.example.org', 'dom.example.net', 'full.example.net', 'localhost', 'alias.example.com', 'single.example.com'])
      );
      expect(domainsIn(r, 'XRAYUI_PROXY4')).not.toContain('direct-only.example.com');
    });

    it('expands geosite and ext tags, keeping full: lines and dropping keyword/regexp lines', async () => {
      const r = await result('redirect entry syntax');
      const d = domainsIn(r, 'XRAYUI_PROXY4');
      expect(d).toEqual(expect.arrayContaining(['www.google.com', 'google.com', 'googleapis.com', 'android', 'scholar.google.ae']));
      expect(d).toEqual(expect.arrayContaining(['netflix.com', 'nflxvideo.net']));
      expect(d).toEqual(expect.arrayContaining(['custom-one.example', 'custom-two.example', 'other-site.example']));
      expect(d).not.toContain('baidu.com');
      expect(r.ipsetLines.some((l) => /keyword|regexp|googlevideo|\^/.test(l))).toBe(false);
    });

    it('produces exactly the expected direct.conf for the syntax fixture', async () => {
      const r = await result('redirect entry syntax');
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toEqual(
        [
          'alias.example.com',
          'android',
          'custom-one.example',
          'custom-two.example',
          'dom.example.net',
          'dotted.example.org',
          'full.example.net',
          'google.com',
          'googleapis.com',
          'localhost',
          'netflix.com',
          'nflxvideo.net',
          'other-site.example',
          'plain.example.com',
          'scholar.google.ae',
          'single.example.com',
          'www.google.com'
        ].sort()
      );
    });

    it('logs every explicit entry it cannot turn into an ipset entry', async () => {
      const s = skipped(await result('redirect entry syntax'));
      expect(s['regexp:^re\\.example\\.com$']).toMatch(/pattern/);
      expect(s['regex:^rx\\.example\\.com$']).toMatch(/pattern/);
      expect(s['keyword:kw']).toMatch(/pattern/);
      expect(s['dotless:intranet']).toMatch(/pattern/);
      expect(s['word']).toMatch(/substring/);
      expect(s['foo:bar.example.com']).toMatch(/unsupported prefix/);
      expect(s['domain:']).toMatch(/unsupported prefix/);
      expect(s['domain:bad..name.example']).toMatch(/not a valid domain/);
      expect(s['full:a/b.example']).toMatch(/not a valid domain/);
      expect(s['domain:with space.example']).toMatch(/not a valid domain/);
      expect(s['geosite:!cn']).toMatch(/negated/);
      expect(s['geoip:!ru']).toMatch(/negated/);
      expect(s['!10.0.0.0/8']).toMatch(/negated/);
      expect(s['0.0.0.0/0']).toBeUndefined();
      expect(s['10.0.0.0/33']).toMatch(/not an IP/);
      expect(s['::/0']).toBeUndefined();
      expect(s['fe80::1%eth0']).toMatch(/not an IP/);
      expect(s['not-an-ip']).toMatch(/not an IP/);
      expect(s['geosite:google']).toMatch(/not an IP/);
      expect(Object.keys(s)).not.toEqual(expect.arrayContaining(['geoip:de']));
      expect(Object.keys(s)).not.toContain('geoip:ca');
      expect(Object.keys(s)).not.toContain('geosite:netflix@ads');
    });

    it('routes literals, geoip and ext ip tags into the IPv4 NET set', async () => {
      const r = await result('redirect entry syntax');
      expect(r.members('XRAYUI_PROXY4_NET')).toEqual(
        ['0.0.0.0/1', '100.64.0.0/10', '128.0.0.0/1', '198.51.100.0/24', '198.51.100.77', '203.0.113.5', '24.48.0.0/13', '5.1.0.0/16'].sort()
      );
      expect(r.sets['XRAYUI_PROXY4_NET']).toBe('hash:net inet');
      expect(r.members('XRAYUI_PROXY4_NET')).not.toContain('5.3.0.0/16');
      expect(r.members('XRAYUI_PROXY4_NET')).not.toContain('192.0.2.200');
    });

    it('treats hex-looking country codes as geoip tags, not IPv6 literals', async () => {
      const r = await result('redirect entry syntax');
      expect(r.v2dat).toContain('v2dat unpack geoip -p -f ca -f de <STATE>/opt/sbin/geoip.dat');
      expect(r.v2dat).toContain('v2dat unpack geoip -p -f corp <STATE>/opt/sbin/otherip.dat');
      expect(r.v2dat).toContain('v2dat unpack geosite -p -f google -f netflix <STATE>/opt/sbin/geosite.dat');
      expect(r.v2dat).toContain('v2dat unpack geosite -p -f custom <STATE>/opt/sbin/xrayui');
      expect(r.v2dat).toContain('v2dat unpack geosite -p -f othertag <STATE>/opt/sbin/other.dat');
      expect(r.v2dat).toHaveLength(5);
    });

    it('records the domain sources it used', async () => {
      const r = await result('redirect entry syntax');
      expect(r.lines(SOURCES)).toEqual([
        'd alias.example.com',
        'd dom.example.net',
        'd dotted.example.org',
        'd full.example.net',
        'd localhost',
        'd plain.example.com',
        'd single.example.com',
        'm redirect',
        's <STATE>/opt/sbin/geosite.dat google',
        's <STATE>/opt/sbin/geosite.dat netflix',
        's <STATE>/opt/sbin/other.dat othertag',
        's <STATE>/opt/sbin/xrayui custom'
      ]);
    });

    it('writes a header followed by sorted unique lines', async () => {
      const r = await result('redirect entry syntax');
      expect(r.header).toMatch(/^# Autogenerated by xrayui on \d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
      expect(r.ipsetLines).toEqual([...new Set(r.ipsetLines)].sort());
    });

    it('does not load IPv6 networks while IPv6 is off', async () => {
      const r = await result('redirect entry syntax');
      expect(r.sets['XRAYUI_PROXY6_NET']).toBeUndefined();
      expect(r.ipsetLines.some((l) => l.includes('XRAYUI_PROXY6'))).toBe(false);
    });

    it('adds the IPv6 set to every ipset line and loads the IPv6 NET set when IPv6 is on', async () => {
      const r = await result('redirect entry syntax dual-stack');
      expect(r.ipsetLines.length).toBeGreaterThan(0);
      expect(r.ipsetLines.every((l) => l.endsWith('/XRAYUI_PROXY4,XRAYUI_PROXY6'))).toBe(true);
      expect(r.members('XRAYUI_PROXY6_NET')).toEqual(['2001:db8:100::/40', '2001:db8:abcd::/48', '2001:db8::1', '2607:f8b0::/32', '2a00:1450::/32', '8000::/1', '::/1'].sort());
      expect(r.sets['XRAYUI_PROXY6_NET']).toBe('hash:net inet6');
      expect(r.members('XRAYUI_PROXY4_NET')).toEqual((await result('redirect entry syntax')).members('XRAYUI_PROXY4_NET'));
    });

    it('skips attribute-filtered tags and exact-match geosite entries in bypass mode but keeps them in redirect mode', async () => {
      const b = await result('bypass attribute filters');
      expect(skipped(b)['geosite:netflix@ads']).toMatch(/attribute filters/);
      expect(skipped(b)['ext:xrayui:custom@cn']).toMatch(/attribute filters/);
      expect(domainsIn(b, 'XRAYUI_BYPASS4')).toEqual(['android', 'google.com', 'googleapis.com', 'kept.example.com']);
      expect(b.ipsetLines.every((l) => l.endsWith('/XRAYUI_BYPASS4,XRAYUI_BYPASS6'))).toBe(true);
      expect(b.v2dat).toEqual(['v2dat unpack geosite -p -f google <STATE>/opt/sbin/geosite.dat']);
      const r = await result('redirect entry syntax');
      expect(r.lines(SOURCES)).toContain('s <STATE>/opt/sbin/geosite.dat netflix');
    });

    it('never writes a domain the router dnsmasq rejects as a config error', async () => {
      const r = await result('redirect with a non-ascii domain');
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toEqual(['ascii-intl.example', 'ascii.example.com']);
      expect(r.ipsetLines.every((l) => /^ipset=\/[A-Za-z0-9._-]+\/[A-Z0-9_,]+$/.test(l))).toBe(true);
    });

    it('splits comma-separated string lists the way Xray does', async () => {
      const r = await result('redirect with a comma-separated domain string');
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toEqual(['comma-a.example.com', 'comma-b.example.com']);
      expect(r.members('XRAYUI_PROXY4_NET')).toEqual(['198.51.100.8', '198.51.100.9']);
    });

    it('never lets a catch-all network bypass Xray', async () => {
      const r = await result('catch-all networks in bypass mode');
      expect(skipped(r)['0.0.0.0/0']).toMatch(/catch-all/);
      expect(skipped(r)['::/0']).toMatch(/catch-all/);
      expect(r.members('XRAYUI_BYPASS4_NET')).toEqual(['192.0.2.0/24']);
      expect(r.members('XRAYUI_BYPASS6_NET')).toEqual([]);
    });

    it('warns and carries on when an asset file is missing', async () => {
      const r = await result('redirect with missing asset files');
      expect(r.messages).toContain('WARN: dnsmasq: <STATE>/opt/sbin/missing.dat not found; its geosite tags are skipped');
      expect(r.messages).toContain('WARN: dnsmasq: <STATE>/opt/sbin/missing-ip.dat not found; its geoip tags are skipped');
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toEqual(['kept.example.com']);
      expect(r.members('XRAYUI_PROXY4_NET')).toEqual(['203.0.113.1']);
      expect(r.v2dat).toEqual([]);
    });
  });

  describe('static network sets', () => {
    it('replaces the NET set content and leaves learned sets untouched', async () => {
      const r = await result('static networks replace the NET set without touching learned addresses');
      expect(r.members('XRAYUI_PROXY4_NET')).toEqual(['203.0.113.0/24', '5.1.0.0/16']);
      expect(r.members('XRAYUI_PROXY6_NET')).toEqual(['2001:db8::/32', '2a00:1450::/32']);
      expect(r.members('XRAYUI_PROXY4')).toEqual(['192.0.2.10 timeout 5000']);
      expect(r.members('XRAYUI_PROXY6')).toEqual(['2001:db8::10 timeout 5000']);
      expect(r.sets['XRAYUI_PROXY4']).toBe('hash:net inet timeout 86400');
      expect(r.messages.filter((m) => m.startsWith('ERROR'))).toEqual([]);
    });

    it('destroys leftover temporary sets and leaves none behind', async () => {
      const r = await result('static networks replace the NET set without touching learned addresses');
      expect(Object.keys(r.sets).filter((s) => /_T\d+$/.test(s))).toEqual([]);
    });

    it('flushes the NET sets of the other mode', async () => {
      const r = await result('static networks replace the NET set without touching learned addresses');
      expect(r.sets['XRAYUI_BYPASS4_NET']).toBeDefined();
      expect(r.members('XRAYUI_BYPASS4_NET')).toEqual([]);
      expect(r.members('XRAYUI_BYPASS6_NET')).toEqual([]);
      const b = await result('bypass mode flushes the redirect NET sets');
      expect(b.members('XRAYUI_PROXY4_NET')).toEqual([]);
      expect(b.members('XRAYUI_BYPASS4_NET')).toEqual(['192.0.2.0/24']);
    });
  });

  describe('reusing unchanged output', () => {
    it('skips the geodata unpack when rules and geodata are unchanged', async () => {
      const r = await result('unchanged rules reuse the previous output');
      expect(r.v2dat).toEqual(['v2dat unpack geoip -p -f de <STATE>/opt/sbin/geoip.dat', 'v2dat unpack geosite -p -f google <STATE>/opt/sbin/geosite.dat']);
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toEqual(['android', 'google.com', 'googleapis.com', 'kept.example.com', 'scholar.google.ae', 'www.google.com']);
      expect(r.members('XRAYUI_PROXY4_NET')).toEqual(['203.0.113.0/24', '5.1.0.0/16']);
      expect(r.exists(LOCK)).toBe(false);
    });

    it('regenerates direct.conf when a geodata file changes', async () => {
      const r = await result('a changed dat file invalidates the reuse');
      expect(r.v2dat.filter((c) => c.includes('geosite'))).toHaveLength(2);
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toContain('new-in-google.example');
    });

    it('reloads the static networks when their set is gone but reuses direct.conf', async () => {
      const r = await result('a lost NET set is reloaded while direct.conf is reused');
      expect(r.v2dat.filter((c) => c.includes('geosite'))).toHaveLength(1);
      expect(r.v2dat.filter((c) => c.includes('geoip'))).toHaveLength(2);
      expect(r.members('XRAYUI_PROXY4_NET')).toEqual(['5.1.0.0/16']);
    });
  });

  describe('learned set invalidation', () => {
    it('flushes learned sets and drops the saved file when a proxied domain is removed', async () => {
      const r = await result('removing a proxied domain flushes learned addresses');
      expect(r.members('XRAYUI_PROXY4')).toEqual([]);
      expect(r.members('XRAYUI_PROXY6')).toEqual([]);
      expect(r.sets['XRAYUI_PROXY4']).toBe('hash:net inet timeout 86400');
      expect(r.exists(LEARNED)).toBe(false);
      expect(r.messages).toContain('INFO: dnsmasq: proxied domains were removed from the rules; clearing learned addresses');
      expect(r.lines(SOURCES)).toEqual(['d kept.example.com', 'm redirect']);
    });

    it('flushes learned sets when a proxied geosite tag is removed', async () => {
      const r = await result('removing a proxied geosite tag flushes learned addresses');
      expect(r.members('XRAYUI_PROXY4')).toEqual([]);
      expect(r.exists(LEARNED)).toBe(false);
    });

    it('keeps learned sets when proxied sources only grew', async () => {
      const r = await result('adding proxied entries keeps learned addresses');
      expect(r.members('XRAYUI_PROXY4')).toEqual(['192.0.2.10 timeout 5000']);
      expect(r.read(LEARNED)).toBe(LEARNED_FILE);
      expect(r.messages.some((m) => m.includes('clearing learned'))).toBe(false);
    });

    it('flushes learned sets when the ipset mode changes to redirect', async () => {
      const r = await result('switching from bypass to redirect flushes learned addresses');
      expect(r.members('XRAYUI_PROXY4')).toEqual([]);
      expect(r.exists(LEARNED)).toBe(false);
      expect(r.messages).toContain('INFO: dnsmasq: ipset mode changed; clearing learned addresses');
    });

    it('drops the saved learned file outside redirect mode', async () => {
      expect((await result('bypass mode drops the learned file')).exists(LEARNED)).toBe(false);
      expect((await result('ipset mode off')).exists(LEARNED)).toBe(false);
    });

    it('does not treat an unreadable Xray config as removed rules', async () => {
      const r = await result('unparseable xray config');
      expect(r.members('XRAYUI_PROXY4')).toEqual(['192.0.2.10 timeout 5000']);
      expect(r.read(LEARNED)).toBe(LEARNED_FILE);
      expect(r.members('XRAYUI_PROXY4_NET')).toEqual(['203.0.113.0/24']);
    });
  });

  describe('priming', () => {
    it('primes explicit names and the domains of tags that are new since the last run', async () => {
      const r = await result('priming fresh tags');
      expect(r.lines(PRIME)).toEqual(['explicit.example.com', 'full.example.org', 'youtube.com', 'm.youtube.com', 'ytimg.com', 'other-site.example']);
      expect(r.prime).toMatch(/^== <STATE>\/tmp\/xrayui_prime\.\d+\.list\n/);
      expect(r.prime.split('\n').slice(1).join('\n')).toBe(r.read(PRIME));
    });

    it('caps the prime list at 200 names with explicit names first', async () => {
      const r = await result('priming caps the list');
      const list = r.lines(PRIME)!;
      expect(list).toHaveLength(200);
      expect(list.slice(0, 3)).toEqual(['a.example.com', 'b.example.com', 'c.example.com']);
      expect(list[3]).toBe('host-000.example');
      expect(list[199]).toBe('host-196.example');
      expect(list).not.toContain('dotlesstld');
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toHaveLength(254);
    });

    it('primes only explicit names when there is no previous sources list', async () => {
      const r = await result('priming on the first run');
      expect(r.lines(PRIME)).toEqual(['explicit.example.com']);
    });

    it('primes bypass-mode rules too', async () => {
      const r = await result('priming in bypass mode');
      expect(r.lines(PRIME)).toEqual(['direct.example.com', 'youtube.com', 'ytimg.com']);
    });

    it('removes the prime list and does nothing when the ipset mode is off', async () => {
      const r = await result('ipset mode off');
      expect(r.exists(PRIME)).toBe(false);
      expect(r.prime).toBe('');
      expect(r.ipsetLines).toEqual([]);
      expect(r.v2dat).toEqual([]);
      expect(r.lines(SOURCES)).toEqual(['m off']);
      expect(r.sets).toEqual({});
    });
  });

  describe('dnsmasq.conf and housekeeping', () => {
    it('appends the conf-file line once across runs', async () => {
      const r = await result('two runs append conf-file once');
      expect(r.lines(CONF)).toEqual([`conf-file=<STATE>/${DIRECT}`]);
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toEqual(['kept.example.com', 'second.example.com']);
      expect(r.events).toEqual(['cleanup_stale_asdfiles', 'ipset_domains rc=0', 'cleanup_stale_asdfiles', 'ipset_domains rc=0']);
    });

    it('appends the conf-file line even when the ipset mode is off', async () => {
      expect((await result('ipset mode off')).lines(CONF)).toEqual([`conf-file=<STATE>/${DIRECT}`]);
    });

    it('removes the lock and staging directories after a run', async () => {
      for (const name of ['redirect entry syntax', 'two runs append conf-file once', 'ipset mode off']) {
        const r = await result(name);
        expect(r.exists(LOCK)).toBe(false);
        expect(r.exists('share/dnsmasq/.stage')).toBe(false);
      }
    });

    it('recovers a stale lock left by a dead process', async () => {
      const r = await result('stale lock with a dead pid');
      expect(r.messages).toContain(`WARN: dnsmasq: removing a stale lock left by PID ${DEAD_PID}`);
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toEqual(['kept.example.com']);
      expect(r.events).toContain('ipset_domains rc=0');
      expect(r.exists(LOCK)).toBe(false);
    });

    it('gives up and leaves a lock held by a live process in place', async () => {
      const r = await result('lock held by a live process');
      expect(r.messages).toContain('WARN: dnsmasq: could not acquire lock after 60s; keeping the previous ipset configuration');
      expect(r.events).toContain('ipset_domains rc=1');
      expect(r.exists(LOCK)).toBe(true);
      expect(r.read(DIRECT)).toBe(OLD_DIRECT);
    });

    it('keeps the previous direct.conf wired into dnsmasq when the lock cannot be taken', async () => {
      const r = await result('lock held by a live process');
      expect(r.lines(CONF)).toContain(`conf-file=<STATE>/${DIRECT}`);
    });

    it('recovers a lock directory without a pid file', async () => {
      const r = await result('stale lock without a pid file');
      expect(r.messages).toContain('WARN: dnsmasq: removing a stale lock');
      expect(domainsIn(r, 'XRAYUI_PROXY4')).toEqual(['kept.example.com']);
      expect(r.exists(LOCK)).toBe(false);
    });

    it('removes the legacy lock directory and ipset.rules file', async () => {
      const r = await result('legacy lock and ipset.rules are removed');
      expect(r.exists('share/dnsmasq/.lock')).toBe(false);
      expect(r.exists('share/dnsmasq/ipset.rules')).toBe(false);
    });

    it('keeps stderr clean', async () => {
      for (const name of ['redirect entry syntax', 'redirect entry syntax dual-stack', 'priming fresh tags', 'ipset mode off', 'two runs append conf-file once']) {
        expect((await result(name)).stderr).toBe('');
      }
    });

    it('caps the dnsmasq cache TTL once inside the xrayui block in ipset modes only', async () => {
      const r = await result('dnsmasq_configure in redirect mode twice');
      const conf = r.lines(CONF)!;
      expect(conf.filter((l) => l === 'max-cache-ttl=3600')).toHaveLength(1);
      expect(conf.filter((l) => l === 'max-ttl=3600')).toHaveLength(1);
      expect(conf.filter((l) => l.startsWith('conf-file='))).toHaveLength(1);
      const start = conf.indexOf('#xrayui start');
      const end = conf.indexOf('#xrayui end');
      expect(start).toBeGreaterThanOrEqual(0);
      expect(conf.indexOf('max-cache-ttl=3600')).toBeGreaterThan(start);
      expect(conf.indexOf(`conf-file=<STATE>/${DIRECT}`)).toBeLessThan(end);
      expect(conf.filter((l) => l === '#xrayui start')).toHaveLength(1);
      const off = await result('dnsmasq_configure with ipset off');
      expect(off.lines(CONF)).not.toContain('max-cache-ttl=3600');
      expect(off.lines(CONF)).not.toContain('max-ttl=3600');
    });
  });
});
