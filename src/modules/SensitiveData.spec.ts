import { get } from 'lodash-es';
import { hideSensitiveData } from './SensitiveData';

const uuid = '6f1c1a9e-3b7d-4d0e-9a51-2c8e5b7f1d42';
const vlessLink = `vless://${uuid}@203.0.113.7:443?security=reality&pbk=Zx8Qk3vW0pTn4Lr5sY7uB2cD9eF1gH6jK8mN0oP3qR4&sid=a1b2c3d4&sni=www.example.com&type=tcp#PRO1VPN`;
const originLink = vlessLink.replace('203.0.113.7', '198.51.100.9');

const poolConfig = () => ({
  outbounds: [
    {
      tag: 'PRO1VPN',
      protocol: 'vless',
      subPool: { enabled: true, active: vlessLink, origin: originLink },
      settings: { vnext: [{ address: '203.0.113.7', port: 443, users: [{ id: uuid, encryption: 'none', flow: 'xtls-rprx-vision' }] }] },
      streamSettings: {
        network: 'tcp',
        security: 'reality',
        realitySettings: { serverName: 'www.example.com', publicKey: 'Zx8Qk3vW0pTn4Lr5sY7uB2cD9eF1gH6jK8mN0oP3qR4', shortId: 'a1b2c3d4', fingerprint: 'chrome' }
      }
    }
  ]
});

const fullConfig = {
  inbounds: [
    {
      protocol: 'vless',
      settings: { decryption: 'mlkem768x25519plus.native.600s.serverPrivateKey', clients: [{ id: 'client-one', email: 'alice@home' }] },
      streamSettings: {
        security: 'reality',
        realitySettings: { target: 'own.example.org:443', serverNames: ['own.example.org'], privateKey: 'realityPrivate', shortIds: ['0123abcd'], mldsa65Seed: 'mldsaSeed' }
      }
    },
    { protocol: 'hysteria', settings: { clients: [{ auth: 'client-auth' }] } },
    { protocol: 'socks', settings: { auth: 'password', accounts: [{ user: 'admin', pass: 'hunter22' }] } }
  ],
  outbounds: [
    {
      protocol: 'wireguard',
      settings: { secretKey: 'wgSecret', address: ['10.0.0.2/32'], reserved: [12, 34, 56], peers: [{ endpoint: 'wg.example.org:51820', publicKey: 'wgPublic', preSharedKey: 'wgPsk' }] }
    },
    {
      protocol: 'hysteria',
      settings: { address: 'hy.example.org', port: 443 },
      streamSettings: { network: 'hysteria', hysteriaSettings: { auth: 'hy-password', masquerade: { type: 'proxy', url: 'https://own.example.org' } } }
    },
    {
      protocol: 'vless',
      settings: { vnext: [{ address: 'grpc.example.org', users: [{ id: 'client-two', encryption: 'mlkem768x25519plus.native.0rtt.serverPublicKey' }] }] },
      streamSettings: {
        network: 'grpc',
        grpcSettings: { serviceName: 'hidden-service', authority: 'grpc.example.org' },
        security: 'tls',
        tlsSettings: { serverName: 'grpc.example.org', pinnedPeerCertSha256: 'AB12CD34', echConfigList: 'echConfig', echServerKeys: 'echKeys', fingerprint: 'chrome' }
      }
    },
    { protocol: 'vmess', streamSettings: { network: 'ws', wsSettings: { path: '/ws', headers: { Host: 'cdn.example.org', 'X-Token': 'token' } } } },
    {
      protocol: 'vmess',
      streamSettings: {
        network: 'kcp',
        kcpSettings: { seed: 'kcp-seed' },
        finalmask: {
          udp: [
            { type: 'mkcp-legacy', settings: { header: 'dns', value: 'tunnel.example.org' } },
            { type: 'xdns', settings: { domain: 't.example.org' } }
          ]
        }
      }
    }
  ],
  dns: { clientIp: '203.0.113.1', servers: [{ address: 'https://dns.example.org/dns-query', clientIP: '203.0.113.2', domains: ['geosite:cn'] }] },
  routing: { rules: [{ domain: ['geosite:netflix'], outboundTag: 'direct' }] },
  reverse: { bridges: [{ tag: 'bridge', domain: 'reverse.internal' }] }
};

describe('hideSensitiveData', () => {
  it('masks the subscription pool links of an outbound', () => {
    const masked = hideSensitiveData(poolConfig()) as any;
    const text = JSON.stringify(masked);

    ['6f1c1a9e', '203.0.113.7', '198.51.100.9', 'Zx8Qk3vW', 'www.example.com'].forEach((secret) => expect(text).not.toContain(secret));
    expect(masked.outbounds[0].subPool).toEqual({ enabled: true, active: '*'.repeat(vlessLink.length), origin: '*'.repeat(originLink.length) });
    expect(masked.outbounds[0].tag).toBe('PRO1VPN');
    expect(masked.outbounds[0].settings.vnext[0].users[0]).toMatchObject({ encryption: 'none', flow: 'xtls-rprx-vision' });
    expect(masked.outbounds[0].streamSettings.realitySettings.fingerprint).toBe('chrome');
  });

  it('masks share links and UUIDs in any field', () => {
    const link = 'trojan://secret@198.51.100.9:443';
    const masked = hideSensitiveData({ outbounds: [{ tag: 'node', remark: `backup ${link}`, note: `id ${uuid.toUpperCase()}` }] }) as any;

    expect(masked.outbounds[0].remark).toBe(`backup ${'*'.repeat(link.length)}`);
    expect(masked.outbounds[0].note).toBe(`id ${'*'.repeat(uuid.length)}`);
  });

  it('hides a masked value wherever it is repeated but keeps local addresses readable', () => {
    const masked = hideSensitiveData({
      inbounds: [{ tag: 'dns-in', listen: '127.0.0.1', settings: { address: '127.0.0.1' } }],
      outbounds: [{ tag: 'proxy-vps.example.net', settings: { vnext: [{ address: 'vps.example.net' }] } }],
      dns: { hosts: { 'vps.example.net': '198.51.100.9', 'router.asus.com': '192.168.50.1' } },
      routing: { rules: [{ domain: ['full:vps.example.net', 'geosite:google'], outboundTag: 'direct' }] }
    }) as any;
    const hidden = '*'.repeat('vps.example.net'.length);

    expect(masked.outbounds[0].tag).toBe(`proxy-${hidden}`);
    expect(masked.dns.hosts).toEqual({ [hidden]: '************', 'router.asus.com': '192.168.50.1' });
    expect(masked.routing.rules[0].domain).toEqual([`full:${hidden}`, 'geosite:google']);
    expect(masked.inbounds[0].settings.address).toBe('*********');
    expect(masked.inbounds[0].listen).toBe('127.0.0.1');
  });

  describe('protocol and transport secrets', () => {
    const masked = hideSensitiveData(fullConfig);

    it.each([
      'inbounds[0].settings.decryption',
      'inbounds[0].settings.clients[0].id',
      'inbounds[0].settings.clients[0].email',
      'inbounds[0].streamSettings.realitySettings.target',
      'inbounds[0].streamSettings.realitySettings.serverNames[0]',
      'inbounds[0].streamSettings.realitySettings.privateKey',
      'inbounds[0].streamSettings.realitySettings.shortIds[0]',
      'inbounds[0].streamSettings.realitySettings.mldsa65Seed',
      'inbounds[1].settings.clients[0].auth',
      'inbounds[2].settings.accounts[0].user',
      'inbounds[2].settings.accounts[0].pass',
      'outbounds[0].settings.secretKey',
      'outbounds[0].settings.address[0]',
      'outbounds[0].settings.reserved[0]',
      'outbounds[0].settings.peers[0].endpoint',
      'outbounds[0].settings.peers[0].publicKey',
      'outbounds[0].settings.peers[0].preSharedKey',
      'outbounds[1].settings.address',
      'outbounds[1].streamSettings.hysteriaSettings.auth',
      'outbounds[1].streamSettings.hysteriaSettings.masquerade.url',
      'outbounds[2].settings.vnext[0].users[0].encryption',
      'outbounds[2].streamSettings.grpcSettings.serviceName',
      'outbounds[2].streamSettings.grpcSettings.authority',
      'outbounds[2].streamSettings.tlsSettings.pinnedPeerCertSha256',
      'outbounds[2].streamSettings.tlsSettings.echConfigList',
      'outbounds[2].streamSettings.tlsSettings.echServerKeys',
      'outbounds[3].streamSettings.wsSettings.headers.Host',
      'outbounds[3].streamSettings.wsSettings.headers.X-Token',
      'outbounds[4].streamSettings.kcpSettings.seed',
      'outbounds[4].streamSettings.finalmask.udp[0].settings.value',
      'outbounds[4].streamSettings.finalmask.udp[1].settings.domain',
      'dns.clientIp',
      'dns.servers[0].address',
      'dns.servers[0].clientIP',
      'reverse.bridges[0].domain'
    ])('masks %s', (path) => {
      expect(get(masked, path)).toMatch(/^\*+$/);
    });

    it.each([
      ['inbounds[0].streamSettings.security', 'reality'],
      ['inbounds[2].settings.auth', 'password'],
      ['outbounds[1].streamSettings.hysteriaSettings.masquerade.type', 'proxy'],
      ['outbounds[2].streamSettings.tlsSettings.fingerprint', 'chrome'],
      ['outbounds[4].streamSettings.finalmask.udp[0].settings.header', 'dns'],
      ['dns.servers[0].domains[0]', 'geosite:cn'],
      ['routing.rules[0].domain[0]', 'geosite:netflix'],
      ['reverse.bridges[0].tag', 'bridge']
    ])('keeps %s readable', (path, value) => {
      expect(get(masked, path)).toBe(value);
    });
  });

  it('masks single public IP addresses in address fields but keeps ranges and local addresses', () => {
    const masked = hideSensitiveData({
      inbounds: [
        { listen: '203.0.113.10', port: 443 },
        { listen: '0.0.0.0', port: 1080, settings: { ip: '192.168.50.1' } }
      ],
      routing: {
        rules: [{ ip: ['62.217.1.2', '2001:db8::7', '91.108.4.0/22', '10.0.0.0/8', 'geoip:telegram'], source: ['192.168.50.20', '198.51.100.23'], outboundTag: 'direct' }]
      }
    }) as any;

    expect(masked.inbounds[0].listen).toBe('************');
    expect(masked.inbounds[1]).toMatchObject({ listen: '0.0.0.0', settings: { ip: '192.168.50.1' } });
    expect(masked.routing.rules[0].ip).toEqual(['**********', '***********', '91.108.4.0/22', '10.0.0.0/8', 'geoip:telegram']);
    expect(masked.routing.rules[0].source).toEqual(['192.168.50.20', '*************']);
  });

  it('never rewrites field names, even when a secret matches one', () => {
    const masked = hideSensitiveData({ outbounds: [{ protocol: 'trojan', settings: { servers: [{ address: '198.51.100.9', port: 443, password: 'password' }] } }] }) as any;

    expect(masked.outbounds[0].settings.servers[0]).toEqual({ address: '************', port: 443, password: '********' });
  });

  it('leaves the source config untouched', () => {
    const config = poolConfig();
    const before = JSON.stringify(config);
    hideSensitiveData(config);
    expect(JSON.stringify(config)).toBe(before);
  });
});
