export type Verdict = 'proxy' | 'direct' | 'drop' | 'accept';

export interface Packet {
  src: string;
  dst: string;
  proto: 'tcp' | 'udp' | 'icmp';
  dport: number;
  mac?: string;
  iface?: string;
  ctstate?: 'NEW' | 'DNAT' | 'ESTABLISHED';
  sets?: string[];
}

export const LOCAL_ADDRESSES = ['127.0.0.1', '10.8.0.1', '192.0.2.3', '192.168.1.1', '192.168.101.1'];

const ipToInt = (ip: string): number => ip.split('.').reduce((acc, octet) => acc * 256 + Number(octet), 0);

const inCidr = (ip: string, cidr: string): boolean => {
  const [net, bits = '32'] = cidr.split('/');
  const size = 2 ** (32 - Number(bits));
  return Math.floor(ipToInt(ip) / size) === Math.floor(ipToInt(net) / size);
};

const portIn = (port: number, list: string): boolean =>
  list.split(',').some((item) => {
    const [from, to = from] = item.split(':').map(Number);
    return port >= from && port <= to;
  });

const addrType = (ip: string): string[] => {
  const types: string[] = [];
  if (LOCAL_ADDRESSES.includes(ip)) types.push('LOCAL');
  if (ip === '255.255.255.255' || ip.endsWith('.255')) types.push('BROADCAST');
  return types;
};

export function parseChain(dump: string, family: 'iptables' | 'ip6tables', table: string, chain = 'XRAYUI'): string[][] {
  const lines = dump.split('\n');
  const header = lines.indexOf(`== ${family} -t ${table}`);
  if (header === -1) return [];
  const rules: string[][] = [];
  for (const line of lines.slice(header + 1)) {
    if (line.startsWith('== ')) break;
    const tokens = line.split(' ');
    if (tokens[0] === '-A' && tokens[1] === chain) rules.push(tokens.slice(2));
  }
  return rules;
}

function matches(rule: string[], pkt: Packet): boolean {
  let negate = false;
  for (let i = 0; i < rule.length; i++) {
    const tok = rule[i];
    const next = rule[i + 1];
    let ok: boolean;
    switch (tok) {
      case '!':
        negate = true;
        continue;
      case '-j':
        return true;
      case '-m':
        i++;
        continue;
      case '-s':
        ok = inCidr(pkt.src, next);
        i++;
        break;
      case '-d':
        ok = inCidr(pkt.dst, next);
        i++;
        break;
      case '-i':
        ok = (pkt.iface ?? 'br0') === next;
        i++;
        break;
      case '-p':
        ok = pkt.proto === next;
        i++;
        break;
      case '--dport':
      case '--dports':
        ok = pkt.proto !== 'icmp' && portIn(pkt.dport, next);
        i++;
        break;
      case '--mac-source':
        ok = (pkt.mac ?? '').toUpperCase() === next.toUpperCase();
        i++;
        break;
      case '--src-type':
        ok = addrType(pkt.src).includes(next);
        i++;
        break;
      case '--dst-type':
        ok = addrType(pkt.dst).includes(next);
        i++;
        break;
      case '--ctstate':
        ok = next.split(',').includes(pkt.ctstate ?? 'NEW');
        i++;
        break;
      case '--match-set':
        ok = (pkt.sets ?? []).includes(next);
        i += 2;
        break;
      case '--transparent':
      case '--mark':
        ok = false;
        if (tok === '--mark') i++;
        break;
      case '--tcp-flags':
        i += 2;
        continue;
      default:
        throw new Error(`chain evaluator: unsupported token "${tok}" in rule: ${rule.join(' ')}`);
    }
    if (negate) ok = !ok;
    negate = false;
    if (!ok) return false;
  }
  return true;
}

const TERMINAL: Record<string, Verdict> = { TPROXY: 'proxy', DNAT: 'proxy', REDIRECT: 'proxy', RETURN: 'direct', DROP: 'drop', ACCEPT: 'accept' };

export function decide(rules: string[][], pkt: Packet): { verdict: Verdict; rule?: string[] } {
  for (const rule of rules) {
    if (!matches(rule, pkt)) continue;
    const verdict = TERMINAL[rule[rule.indexOf('-j') + 1]];
    if (verdict) return { verdict, rule };
  }
  return { verdict: 'direct' };
}

export const evaluate = (rules: string[][], pkt: Packet): Verdict => decide(rules, pkt).verdict;
