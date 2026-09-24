import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { decide, evaluate, parseChain, Packet, Verdict } from './firewall/chain';

const HARNESS_DIR = path.join(process.cwd(), 'tests', 'backend', 'firewall');

interface Scenario {
  config: Record<string, unknown>;
  env?: Record<string, string>;
  steps?: string[];
  prestate?: string;
}

interface Result {
  dump: string;
  stderr: string;
}

const LAN_HOST = '192.168.1.50';
const INTERNET_HOST = '203.0.113.80';
const DEVICE_X = 'AA:BB:CC:DD:EE:01';
const DEVICE_Y = 'AA:BB:CC:DD:EE:02';
const DEVICE_Z = 'AA:BB:CC:DD:EE:03';

const dokodemo = (mode: 'tproxy' | 'redirect', network = 'tcp,udp', extra: Record<string, unknown> = {}) => ({
  tag: `${mode}-in`,
  protocol: 'dokodemo-door',
  port: 12345,
  listen: '0.0.0.0',
  settings: { network, followRedirect: true },
  streamSettings: { sockopt: { tproxy: mode } },
  ...extra
});

const vlessServer = (port: number) => ({ tag: `vless-${port}`, protocol: 'vless', port, settings: { clients: [] } });

const config = (inbounds: unknown[], policies?: unknown[]) => ({
  inbounds,
  outbounds: [
    { tag: 'proxy', protocol: 'vless', settings: { vnext: [{ address: '203.0.113.10', port: 443 }] } },
    { tag: 'direct', protocol: 'freedom' }
  ],
  routing: policies ? { rules: [], policies } : { rules: [] }
});

const policy = (mode: 'redirect' | 'bypass', opts: { mac?: string[]; tcp?: string; udp?: string } = {}) => ({
  name: `${mode} policy`,
  mode,
  enabled: true,
  ...opts
});

const manyPorts = Array.from({ length: 20 }, (_, i) => String(10001 + i)).join(',');

const scenarios: Record<string, Scenario> = {
  'tproxy with default policy': { config: config([dokodemo('tproxy')]) },
  'tproxy dual-stack with a server inbound on 443 and QUIC blocking': {
    config: config([dokodemo('tproxy'), vlessServer(443)]),
    env: { FW_IPV6: '1', xray_block_quic: 'true' }
  },
  'tproxy with a tcp-only inbound': { config: config([dokodemo('tproxy', 'tcp')]) },
  'tproxy with split tcp and udp inbounds': {
    config: config([dokodemo('tproxy', 'tcp'), dokodemo('tproxy', 'udp', { tag: 'tproxy-udp', port: 12346 })])
  },
  'tproxy with ipset redirect mode and QUIC blocking': {
    config: config([dokodemo('tproxy')]),
    env: { ipsec: 'redirect', xray_block_quic: 'true' }
  },
  'redirect with a server inbound on 443': { config: config([dokodemo('redirect'), vlessServer(443)]) },
  'redirect dual-stack with a loopback listener': {
    config: config([dokodemo('redirect', 'tcp,udp', { listen: '127.0.0.1' })]),
    env: { FW_IPV6: '1' }
  },
  'loopback listener that is not the last dokodemo inbound': {
    config: config([dokodemo('redirect', 'tcp,udp', { listen: '127.0.0.1' }), dokodemo('tproxy', 'tcp,udp', { port: 12346 })])
  },
  'tun inbound next to tproxy': {
    config: config([dokodemo('tproxy'), { tag: 'tun-in', protocol: 'tun', settings: { name: 'xray0' } }])
  },
  'dns leak lock with a dedicated DNS inbound': {
    config: {
      ...config([
        dokodemo('tproxy'),
        { tag: 'sys:dns-in', protocol: 'dokodemo-door', port: 5300, listen: '127.0.0.1', settings: { address: '1.1.1.1', port: 53, network: 'tcp,udp' } }
      ]),
      outbounds: [{ tag: 'sys:dns-out', protocol: 'dns' }]
    },
    env: { xray_dns_only: 'true' }
  },
  'policy: redirect one device except mail ports': {
    config: config([dokodemo('tproxy')], [policy('redirect', { mac: [DEVICE_X], tcp: '25,465' })])
  },
  'policy: redirect one device plus everyone except port 25': {
    config: config([dokodemo('tproxy')], [policy('redirect', { mac: [DEVICE_X] }), policy('redirect', { tcp: '25' })])
  },
  'policy: bypass one device except https': {
    config: config([dokodemo('tproxy')], [policy('bypass', { mac: [DEVICE_Y], tcp: '443' })])
  },
  'policy: bypass everyone except web ports': {
    config: config([dokodemo('tproxy')], [policy('bypass', { tcp: '443,80,22', udp: '443,22' })])
  },
  'policy: bypass one device entirely': { config: config([dokodemo('tproxy')], [policy('bypass', { mac: [DEVICE_Y] })]) },
  'policy: redirect only one device': { config: config([dokodemo('tproxy')], [policy('redirect', { mac: [DEVICE_X] })]) },
  'policy: bypass everyone except twenty tcp ports': {
    config: config([dokodemo('tproxy')], [policy('bypass', { tcp: manyPorts })])
  },
  'policy: disabled policies fall back to redirecting everything': {
    config: config([dokodemo('tproxy')], [{ ...policy('bypass'), enabled: false }])
  },
  'ipv4 hooks were wiped by the firmware while ipv6 kept them': {
    config: config([dokodemo('tproxy')]),
    env: { FW_IPV6: '1' },
    prestate:
      'ip6tables -t filter -N XRAYUI; ip6tables -t filter -I INPUT 1 -j XRAYUI; ip6tables -t filter -I FORWARD 1 -j XRAYUI; ip6tables -t mangle -N XRAYUI; ip6tables -t mangle -A PREROUTING -j XRAYUI'
  },
  'stale ipv4 rules while the ipv6 chain is missing': {
    config: config([dokodemo('tproxy')]),
    env: { FW_IPV6: '1' },
    prestate: 'iptables -t mangle -N XRAYUI; iptables -t mangle -A XRAYUI -s 192.168.1.0/24 -p tcp -j TPROXY --on-port 9999 --tproxy-mark 0x10000/0x10000'
  },
  'cleanup after a dual-stack configure': {
    config: config([dokodemo('tproxy'), vlessServer(443)]),
    env: { FW_IPV6: '1', xray_block_quic: 'true', xray_dns_only: 'true' },
    steps: ['configure_firewall', 'cleanup_firewall']
  },
  'cleanup when only ipv4 still has the hooks': {
    config: config([dokodemo('tproxy')]),
    env: { FW_IPV6: '1' },
    steps: ['cleanup_firewall'],
    prestate: 'iptables -t filter -N XRAYUI; iptables -t filter -I INPUT 1 -j XRAYUI; iptables -t mangle -N XRAYUI; iptables -t mangle -A PREROUTING -j XRAYUI'
  }
};

function run(scenario: Scenario, parallel = 1): Promise<Result> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xrayui-fw-'));
  const configPath = path.join(dir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(scenario.config));
  const env = { PATH: process.env.PATH ?? '/usr/bin:/bin', HOME: os.tmpdir(), FW_PRESTATE: scenario.prestate ?? '', ...scenario.env };
  const exec = (args: string[]) =>
    new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      const child = spawn('sh', args, { env });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stderr += d));
      child.on('error', reject);
      child.on('close', () => resolve({ stdout, stderr }));
    });
  const scrub = (text: string) => text.split(dir).join('<STATE>');
  const harnessArgs = [path.join(HARNESS_DIR, 'harness.sh'), dir, configPath, ...(scenario.steps ?? ['configure_firewall'])];
  return Promise.all(Array.from({ length: parallel }, () => exec(harnessArgs)))
    .then(async (runs) => {
      const dump = await exec([path.join(HARNESS_DIR, 'dump.sh'), dir]);
      return { dump: scrub(dump.stdout), stderr: scrub(runs.map((r) => r.stderr).join('')) };
    })
    .finally(() => fs.rmSync(dir, { recursive: true, force: true }));
}

const results = new Map<string, Promise<Result>>();
const result = (name: string): Promise<Result> => {
  if (!results.has(name)) results.set(name, run(scenarios[name]));
  return results.get(name)!;
};

const ruleLines = (dump: string, needle: string) => dump.split('\n').filter((line) => line.startsWith('-') && line.includes(needle));

const verdict = async (name: string, pkt: Partial<Packet>, table = 'mangle'): Promise<Verdict> => {
  const { dump } = await result(name);
  const packet: Packet = { src: LAN_HOST, dst: INTERNET_HOST, proto: 'tcp', dport: 443, mac: DEVICE_Z, ...pkt };
  return evaluate(parseChain(dump, 'iptables', table), packet);
};

jest.setTimeout(120000);

const describeOnLinux = process.platform === 'linux' ? describe : describe.skip;

describeOnLinux('firewall.sh generated rules', () => {
  it.concurrent.each(Object.keys(scenarios))('%s', async (name) => {
    const { dump, stderr } = await result(name);
    expect(`${dump}== stderr\n${stderr}`).toMatchSnapshot();
  });
});

describeOnLinux('firewall.sh behaviour', () => {
  it('keeps proxying LAN https when the router also runs a server inbound on 443', async () => {
    const name = 'tproxy dual-stack with a server inbound on 443 and QUIC blocking';
    expect(await verdict(name, { proto: 'tcp', dport: 443 })).toBe('proxy');
    expect(await verdict(name, { proto: 'tcp', dport: 443, dst: '192.168.1.1' })).toBe('direct');
    const nat = 'redirect with a server inbound on 443';
    expect(await verdict(nat, { proto: 'tcp', dport: 443 }, 'nat')).toBe('proxy');
    expect(await verdict(nat, { proto: 'tcp', dport: 443, dst: '192.0.2.3' }, 'nat')).toBe('direct');
  });

  it('opens server inbound ports only for traffic addressed to the router', async () => {
    const name = 'tproxy dual-stack with a server inbound on 443 and QUIC blocking';
    const wanClient = { src: '198.51.100.7', iface: 'eth0', proto: 'tcp' as const, dport: 443 };
    expect(await verdict(name, { ...wanClient, dst: '192.0.2.3' }, 'filter')).toBe('accept');
    expect(await verdict(name, { ...wanClient, dst: LAN_HOST }, 'filter')).toBe('direct');
    const { dump } = await result(name);
    const v6Accepts = parseChain(dump, 'ip6tables', 'filter').filter((r) => r.includes('--dport') && r.includes('ACCEPT'));
    expect(v6Accepts.length).toBeGreaterThan(0);
    v6Accepts.forEach((rule) => expect(rule.join(' ')).toContain('-m addrtype --dst-type LOCAL'));
  });

  it('drops QUIC only for LAN clients heading out', async () => {
    const name = 'tproxy dual-stack with a server inbound on 443 and QUIC blocking';
    expect(await verdict(name, { proto: 'udp', dport: 443 })).toBe('drop');
    expect(await verdict(name, { proto: 'udp', dport: 443, dst: '192.168.1.1' })).not.toBe('drop');
    expect(await verdict(name, { proto: 'udp', dport: 443, src: '198.51.100.7', iface: 'eth0', dst: '192.0.2.3' })).not.toBe('drop');
    expect(await verdict(name, { proto: 'udp', dport: 443, src: '198.51.100.7', iface: 'eth0', dst: LAN_HOST })).not.toBe('drop');
    const ipset = 'tproxy with ipset redirect mode and QUIC blocking';
    expect(await verdict(ipset, { proto: 'udp', dport: 443, sets: ['XRAYUI_PROXY4'] })).toBe('drop');
    expect(await verdict(ipset, { proto: 'udp', dport: 443 })).toBe('direct');
  });

  it('leaves UDP alone when the inbound only accepts TCP', async () => {
    const name = 'tproxy with a tcp-only inbound';
    expect(await verdict(name, { proto: 'tcp', dport: 80 })).toBe('proxy');
    expect(await verdict(name, { proto: 'udp', dport: 3478 })).toBe('direct');
    const { dump } = await result(name);
    expect(dump).not.toMatch(/-p udp -j TPROXY/);
  });

  it('sends each protocol to the inbound that accepts it', async () => {
    const name = 'tproxy with split tcp and udp inbounds';
    const { dump } = await result(name);
    const rules = parseChain(dump, 'iptables', 'mangle');
    const target = (proto: 'tcp' | 'udp') => decide(rules, { src: LAN_HOST, dst: INTERNET_HOST, proto, dport: 3478, mac: DEVICE_Z });
    expect(target('tcp').verdict).toBe('proxy');
    expect(target('tcp').rule?.join(' ')).toContain('--on-port 12345');
    expect(target('udp').verdict).toBe('proxy');
    expect(target('udp').rule?.join(' ')).toContain('--on-port 12346');
  });

  it('redirects only the listed device, minus its excluded ports', async () => {
    const name = 'policy: redirect one device except mail ports';
    expect(await verdict(name, { mac: DEVICE_X, dport: 80 })).toBe('proxy');
    expect(await verdict(name, { mac: DEVICE_X, dport: 25 })).toBe('direct');
    expect(await verdict(name, { mac: DEVICE_X, proto: 'udp', dport: 3478 })).toBe('proxy');
    expect(await verdict(name, { mac: DEVICE_Z, dport: 80 })).toBe('direct');
  });

  it('combines a device redirect with an everyone-except-port rule', async () => {
    const name = 'policy: redirect one device plus everyone except port 25';
    expect(await verdict(name, { mac: DEVICE_X, dport: 25 })).toBe('proxy');
    expect(await verdict(name, { mac: DEVICE_Z, dport: 80 })).toBe('proxy');
    expect(await verdict(name, { mac: DEVICE_Z, dport: 25 })).toBe('direct');
    expect(await verdict(name, { mac: DEVICE_Z, proto: 'udp', dport: 3478 })).toBe('proxy');
  });

  it('bypasses the listed device except its listed ports', async () => {
    const name = 'policy: bypass one device except https';
    expect(await verdict(name, { mac: DEVICE_Y, dport: 443 })).toBe('proxy');
    expect(await verdict(name, { mac: DEVICE_Y, dport: 80 })).toBe('direct');
    expect(await verdict(name, { mac: DEVICE_Y, proto: 'udp', dport: 443 })).toBe('direct');
    expect(await verdict(name, { mac: DEVICE_Z, dport: 80 })).toBe('proxy');
  });

  it('bypasses everyone except the listed web ports', async () => {
    const name = 'policy: bypass everyone except web ports';
    expect(await verdict(name, { dport: 443 })).toBe('proxy');
    expect(await verdict(name, { dport: 8080 })).toBe('direct');
    expect(await verdict(name, { proto: 'udp', dport: 443 })).toBe('proxy');
    expect(await verdict(name, { proto: 'udp', dport: 53 })).toBe('direct');
  });

  it('keeps the single-device policies working', async () => {
    expect(await verdict('policy: bypass one device entirely', { mac: DEVICE_Y })).toBe('direct');
    expect(await verdict('policy: bypass one device entirely', { mac: DEVICE_Z })).toBe('proxy');
    expect(await verdict('policy: redirect only one device', { mac: DEVICE_X })).toBe('proxy');
    expect(await verdict('policy: redirect only one device', { mac: DEVICE_Z })).toBe('direct');
    expect(await verdict('policy: disabled policies fall back to redirecting everything', { mac: DEVICE_Z })).toBe('proxy');
  });

  it('honours port lists longer than the multiport limit', async () => {
    const name = 'policy: bypass everyone except twenty tcp ports';
    const { stderr } = await result(name);
    expect(stderr).not.toMatch(/too many ports/);
    expect(await verdict(name, { dport: 10001 })).toBe('proxy');
    expect(await verdict(name, { dport: 10020 })).toBe('proxy');
    expect(await verdict(name, { dport: 10021 })).toBe('direct');
  });

  it('restores ipv4 hooks even when ipv6 still has them', async () => {
    const { dump } = await result('ipv4 hooks were wiped by the firmware while ipv6 kept them');
    const v4filter = dump.split('== iptables -t filter')[1].split('== ')[0];
    expect(v4filter).toContain('-A INPUT -j XRAYUI');
    expect(v4filter).toContain('-A FORWARD -j XRAYUI');
    const v4mangle = dump.split('== iptables -t mangle')[1].split('== ')[0];
    expect(v4mangle).toContain('-A PREROUTING -j XRAYUI');
  });

  it('flushes stale ipv4 rules even when the ipv6 chain is new', async () => {
    const { dump } = await result('stale ipv4 rules while the ipv6 chain is missing');
    expect(dump).not.toContain('--on-port 9999');
  });

  it('removes every hook, chain and TPROXY route rule on cleanup', async () => {
    const { dump } = await result('cleanup after a dual-stack configure');
    expect(ruleLines(dump, 'XRAYUI')).toEqual([]);
    expect(dump).not.toMatch(/fwmark/);
  });

  it('removes ipv4 hooks on cleanup even when ipv6 has none', async () => {
    const { dump } = await result('cleanup when only ipv4 still has the hooks');
    expect(ruleLines(dump, 'XRAYUI')).toEqual([]);
  });

  it('serializes concurrent firewall updates', async () => {
    const tables = (dump: string) => dump.split('== ip -4 rule')[0];
    const single = await result('tproxy with default policy');
    const racing = await run(scenarios['tproxy with default policy'], 3);
    expect(tables(racing.dump)).toBe(tables(single.dump));
  });

  it('enables route_localnet when any dokodemo inbound listens on loopback', async () => {
    const { dump } = await result('loopback listener that is not the last dokodemo inbound');
    expect(dump).toContain('set_route_localnet 1');
  });

  it('does not emit port rules for inbounds without a port', async () => {
    const { stderr } = await result('tun inbound next to tproxy');
    expect(stderr).not.toMatch(/null/);
  });
});
