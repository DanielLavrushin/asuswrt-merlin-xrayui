import { escapeRegExp } from 'lodash-es';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

const SECRET_FIELDS = new Set([
  'address',
  'authority',
  'bridges.domain',
  'certificate',
  'clientip',
  'clients.auth',
  'decryption',
  'dest',
  'dns',
  'echconfiglist',
  'echserverkeys',
  'email',
  'encryption',
  'endpoint',
  'host',
  'hysteriasettings.auth',
  'id',
  'key',
  'mac',
  'masquerade.url',
  'mldsa65seed',
  'mldsa65verify',
  'pass',
  'password',
  'path',
  'pinnedpeercertificatesha256',
  'pinnedpeercertsha256',
  'portals.domain',
  'presharedkey',
  'privatekey',
  'publickey',
  'reserved',
  'secretkey',
  'seed',
  'servername',
  'servernames',
  'servers',
  'servicename',
  'settings.domain',
  'settings.value',
  'shortid',
  'shortids',
  'spiderx',
  'surl',
  'target',
  'user',
  'verifypeercertbyname',
  'verifypeercertinnames'
]);

const SECRET_BRANCHES = new Set(['headers', 'subpool']);

const IP_FIELDS = new Set(['hosts', 'ip', 'listen', 'sendthrough', 'source', 'sourceip']);

const SHARE_LINK = String.raw`\b(?:vless|vmess|trojan|ss|ssr|socks[45]?|hysteria2?|hy2|tuic|wireguard|wg|anytls)://\S+|\b[a-z][a-z0-9+.-]*://[^\s/?#@]*@\S+`;
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const SINGLE_IP = /^(?:\d{1,3}(?:\.\d{1,3}){3}(?:\/32)?|[0-9a-f]{0,4}(?::[0-9a-f]{0,4}){2,7}(?:\/128)?)$/i;
const LOCAL_ADDRESS = /^(?:localhost|(?:127|10)\.\d|192\.168\.\d|172\.(?:1[6-9]|2\d|3[01])\.\d|169\.254\.\d|0\.0\.0\.0|::|f[cd][0-9a-f]{2}:|fe80:)/i;
const MIN_ECHO_LENGTH = 8;

const stars = (text: string) => '*'.repeat(text.length);

const isObject = (value: Json): value is { [key: string]: Json } => typeof value === 'object' && value !== null && !Array.isArray(value);

const maskValue = (value: Json, found: Set<string>): Json => {
  if (typeof value === 'number') return stars(String(value));
  if (typeof value !== 'string' || value === 'none') return value;
  if (value.length >= MIN_ECHO_LENGTH && !LOCAL_ADDRESS.test(value)) found.add(value);
  return stars(value);
};

const anyLeaf = () => true;

const publicIp = (leaf: Json) => typeof leaf === 'string' && SINGLE_IP.test(leaf) && !LOCAL_ADDRESS.test(leaf);

const maskLeaves = (value: Json, found: Set<string>, test: (leaf: Json) => boolean): Json => {
  if (Array.isArray(value)) return value.map((item) => maskLeaves(item, found, test));
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, maskLeaves(item, found, test)]));
  return test(value) ? maskValue(value, found) : value;
};

const maskField = (value: Json, name: string, found: Set<string>): Json => {
  if (Array.isArray(value)) return value.map((item) => (typeof item === 'object' && item !== null ? maskTree(item, name, found) : maskValue(item, found)));
  return isObject(value) ? maskTree(value, name, found) : maskValue(value, found);
};

const maskTree = (node: Json, parent: string, found: Set<string>): Json => {
  if (Array.isArray(node)) return node.map((item) => maskTree(item, parent, found));
  if (!isObject(node)) return node;
  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => {
      const name = key.toLowerCase();
      if (SECRET_BRANCHES.has(name)) return [key, maskLeaves(value, found, anyLeaf)];
      if (SECRET_FIELDS.has(name) || SECRET_FIELDS.has(`${parent}.${name}`)) return [key, maskField(value, name, found)];
      if (IP_FIELDS.has(name)) return [key, maskLeaves(value, found, publicIp)];
      return [key, maskTree(value, name, found)];
    })
  );
};

const scrubTree = (node: Json, scrub: (text: string) => string, scrubKeys = false): Json => {
  if (typeof node === 'string') return scrub(node);
  if (Array.isArray(node)) return node.map((item) => scrubTree(item, scrub));
  if (!isObject(node)) return node;
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [scrubKeys ? scrub(key) : key, scrubTree(value, scrub, key === 'hosts')]));
};

export function hideSensitiveData(config: unknown): unknown {
  const found = new Set<string>();
  const masked = maskTree(JSON.parse(JSON.stringify(config)) as Json, '', found);
  const echoes = [...found].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const pattern = new RegExp([SHARE_LINK, ...echoes, UUID].join('|'), 'gi');
  return scrubTree(masked, (text) => text.replace(pattern, stars));
}
