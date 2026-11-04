import { coreChecksOutboundTransportSecurity, coreSupports, coreUsesNarrowPrivateIps } from './CoreVersion';
import { isShadowsocksPlainCipher, XrayProtocol } from './Options';

// A setting the installed Xray refuses to start with. Apply stops and shows com.ApplyChecks.<key>, which names the inbound or outbound.
export class ApplyCheckError extends Error {
  readonly key: string;
  readonly params: Record<string, string>;

  constructor(key: string, params: Record<string, string>) {
    super(`${key}: ${params.tag}`);
    this.name = 'ApplyCheckError';
    this.key = key;
    this.params = params;
  }
}

interface ServerLike {
  address?: unknown;
  method?: string;
  email?: string;
  encryption?: string;
  users?: ServerLike[] | null;
}

interface SettingsLike extends ServerLike {
  vnext?: ServerLike[];
  servers?: ServerLike[];
  clients?: ServerLike[] | null;
}

interface ProxyLike {
  protocol: string;
  tag?: string;
  surl?: string;
  settings?: unknown;
  streamSettings?: { security?: string };
}

// IPs as Xray reads them: 4 bytes for IPv4, 16 for IPv6.
type Ip = number[];

// Go's net.ParseIP: four decimal fields without leading zeros.
const parseIPv4 = (s: string): Ip | undefined => {
  const fields = s.split('.');
  if (fields.length !== 4 || !fields.every((f) => /^(0|[1-9]\d{0,2})$/.test(f) && Number(f) <= 255)) return undefined;
  return fields.map(Number);
};

// Go's net.ParseIP: eight hex groups, one "::" standing for at least one zero group, an IPv4 tail; zones such as %eth0 are refused.
const parseIPv6 = (s: string): Ip | undefined => {
  const groups = (part: string, ipv4Tail: boolean): number[] | undefined => {
    if (part === '') return [];
    const fields = part.split(':');
    const words: number[] = [];
    for (const [i, field] of fields.entries()) {
      const v4 = ipv4Tail && i === fields.length - 1 ? parseIPv4(field) : undefined;
      if (v4) words.push((v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]);
      else if (/^[0-9a-f]{1,4}$/i.test(field)) words.push(parseInt(field, 16));
      else return undefined;
    }
    return words;
  };

  const gap = s.indexOf('::');
  let words: number[] | undefined;
  if (gap < 0) {
    words = groups(s, true);
    if (words?.length !== 8) return undefined;
  } else {
    if (s.includes('::', gap + 1)) return undefined;
    const head = groups(s.slice(0, gap), false);
    const tail = groups(s.slice(gap + 2), true);
    if (!head || !tail || head.length + tail.length > 7) return undefined;
    words = [...head, ...new Array<number>(8 - head.length - tail.length).fill(0), ...tail];
  }
  return words.flatMap((w) => [w >> 8, w & 0xff]);
};

// Xray's net.ParseAddress: strip [brackets] and spaces, then an IP (IPv4-mapped IPv6 becomes IPv4) or else a domain.
const parseAddress = (raw: string): { ip?: Ip; domain: string } => {
  let s = raw;
  if (s.startsWith('[') && s.endsWith(']')) s = s.slice(1, -1);
  s = s.trim();
  // Go picks the family from the first separator, so "1.2.3.4:80" is a (public) domain, not an IP.
  const separator = /[.:%]/.exec(s)?.[0];
  let ip = separator === '.' ? parseIPv4(s) : separator === ':' ? parseIPv6(s) : undefined;
  if (ip?.length === 16 && ip.slice(0, 10).every((b) => b === 0) && ip[10] === 0xff && ip[11] === 0xff) ip = ip.slice(12);
  return { ip, domain: s };
};

const cidr = (rule: string): [Ip, number] => {
  const [address, bits] = rule.split('/');
  return [(address.includes(':') ? parseIPv6(address) : parseIPv4(address))!, Number(bits)];
};

const inRange = (ip: Ip, [network, bits]: [Ip, number]): boolean =>
  ip.length === network.length &&
  network.every((byte, i) => {
    const used = Math.min(8, Math.max(0, bits - i * 8));
    return used === 0 || (ip[i] ^ byte) >> (8 - used) === 0;
  });

// geodata.GetPrivateIPMatcher() in Xray 26.7.11 to 26.10.21.
const SPECIAL_PURPOSE_IPS = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.0.2.0/24',
  '192.88.99.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  '198.51.100.0/24',
  '203.0.113.0/24',
  '224.0.0.0/3',
  '::/127',
  'fc00::/7',
  'fe80::/10',
  'ff00::/8'
].map(cidr);

// Go's IsPrivate, IsLoopback and IsLinkLocalUnicast, used since 26.10.31. CGNAT 100.64.0.0/10 (Tailscale) is public here.
const PRIVATE_IPS = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '127.0.0.0/8', '169.254.0.0/16', 'fc00::/7', '::1/128', 'fe80::/10'].map(cidr);

// geodata.GetPrivateDomainMatcher(): these names and their subdomains, and names without a dot.
const PRIVATE_DOMAINS = ['lan', 'localdomain', 'example', 'invalid', 'localhost', 'test', 'local', 'home.arpa', 'internal'];
const DOTLESS_DOMAIN = /^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/;

// requiresTransportSecurity() in Xray's infra/conf/xray.go.
const isPublicAddress = (address: string): boolean => {
  const { ip, domain } = parseAddress(address);
  if (ip) return !(coreUsesNarrowPrivateIps() ? PRIVATE_IPS : SPECIAL_PURPOSE_IPS).some((range) => inRange(ip, range));
  const name = domain.toLowerCase().replace(/\.$/, '');
  return !DOTLESS_DOMAIN.test(name) && !PRIVATE_DOMAINS.some((d) => name === d || name.endsWith(`.${d}`));
};

const shadowsocksProblem = (proxy: ProxyLike, inbound: boolean): ApplyCheckError | undefined => {
  const settings = proxy.settings as SettingsLike | undefined;
  if (proxy.protocol !== XrayProtocol.SHADOWSOCKS || !settings) return undefined;
  const tag = proxy.tag ?? proxy.protocol;

  if (inbound) {
    if (settings.method?.startsWith('2022-blake3-')) return undefined;
    // "clients" replaces "users"; with either present Xray reads only the clients' methods, and has never accepted none/plain there.
    const users = settings.clients ?? settings.users;
    if (users) {
      const client = users.find((user) => isShadowsocksPlainCipher(user.method));
      return client && new ApplyCheckError('error_ss_plain_cipher_client', { tag, client: client.email ?? '', method: client.method ?? '' });
    }
  }

  // The short form ("address" right in settings) wins over "servers", as in Xray.
  const server = inbound || settings.address != null ? settings : settings.servers?.[0];
  if (!coreSupports('ssPlainCipher') && isShadowsocksPlainCipher(server?.method)) {
    return new ApplyCheckError('error_ss_plain_cipher', { tag, method: server?.method ?? '' });
  }
  return undefined;
};

// validateOutboundTransportSecurity() in Xray's infra/conf/xray.go.
const transportSecurityProblem = (proxy: ProxyLike): ApplyCheckError | undefined => {
  const settings = proxy.settings as SettingsLike | undefined;
  const vless = proxy.protocol === XrayProtocol.VLESS;
  if ((!vless && proxy.protocol !== XrayProtocol.TROJAN) || !settings) return undefined;
  if (['tls', 'reality'].includes(proxy.streamSettings?.security?.toLowerCase() ?? '')) return undefined;

  const shortForm = settings.address != null;
  if (!coreChecksOutboundTransportSecurity(shortForm)) return undefined;
  const server = shortForm ? settings : (vless ? settings.vnext : settings.servers)?.[0];
  const encryption = shortForm ? settings.encryption : server?.users?.[0]?.encryption;
  if (vless && encryption && encryption !== 'none') return undefined;

  // An empty address or one read from an environment variable (env:NAME) cannot be judged here.
  const address = typeof server?.address === 'string' ? server.address : '';
  if (!address.trim() || address.startsWith('env:') || !isPublicAddress(address)) return undefined;
  return new ApplyCheckError(vless ? 'error_vless_no_tls' : 'error_trojan_no_tls', { tag: proxy.tag ?? proxy.protocol, address });
};

// Runs on the prepared config, the same JSON Xray gets. Outbounds with a Subscription URL are skipped: the router replaces
// their settings with the subscription's when Xray starts.
export function checkBeforeApply(config: { inbounds?: ProxyLike[]; outbounds?: ProxyLike[] }): void {
  const problem =
    config.inbounds?.map((proxy) => shadowsocksProblem(proxy, true)).find(Boolean) ??
    config.outbounds
      ?.filter((proxy) => !proxy.surl?.trim())
      .map((proxy) => shadowsocksProblem(proxy, false) ?? transportSecurityProblem(proxy))
      .find(Boolean);
  if (problem) throw problem;
}
