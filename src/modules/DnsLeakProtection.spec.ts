import { XrayObject } from './XrayConfig';
import { XrayOutboundObject, XrayVlessOutboundObject, XrayFreedomOutboundObject } from './OutboundObjects';
import { XrayInboundObject, XrayDokodemoDoorInboundObject } from './InboundObjects';
import { XrayProtocol } from './Options';
import * as DnsLeakProtection from './DnsLeakProtection';
import { dnsLeakTags } from './DnsLeakProtection';

const makeConfig = (withTproxy = false): XrayObject => {
  const config = new XrayObject();
  const proxy = new XrayOutboundObject<XrayVlessOutboundObject>(XrayProtocol.VLESS, new XrayVlessOutboundObject());
  proxy.tag = 'proxy';
  const direct = new XrayOutboundObject<XrayFreedomOutboundObject>(XrayProtocol.FREEDOM, new XrayFreedomOutboundObject());
  direct.tag = 'direct';
  config.outbounds.push(proxy, direct);

  if (withTproxy) {
    const main = new XrayInboundObject<XrayDokodemoDoorInboundObject>(XrayProtocol.DOKODEMODOOR, new XrayDokodemoDoorInboundObject());
    main.tag = 'all-in';
    main.streamSettings!.sockopt = { tproxy: 'tproxy' } as any;
    config.inbounds.push(main);
  }
  return config;
};

describe('DnsLeakProtection', () => {
  it('starts disabled on a fresh config', () => {
    expect(DnsLeakProtection.isEnabled(makeConfig())).toBe(false);
  });

  it('enable() provisions the inbound, outbound and intercept rule (no proxy picker)', () => {
    const config = makeConfig();
    DnsLeakProtection.enable(config);

    expect(DnsLeakProtection.isEnabled(config)).toBe(true);
    expect(config.inbounds.find((i) => i.tag === dnsLeakTags.DNS_IN_TAG)).toBeDefined();
    expect(config.outbounds.find((o) => o.tag === dnsLeakTags.DNS_OUT_TAG)).toBeDefined();

    const intercept = config.routing!.rules!.find((r) => r.name === dnsLeakTags.RULE_INTERCEPT);
    expect(intercept?.inboundTag).toEqual([dnsLeakTags.DNS_IN_TAG]);
    expect(intercept?.outboundTag).toBe(dnsLeakTags.DNS_OUT_TAG);
  });

  it('adds an upstream fallback rule auto-targeting the first proxy', () => {
    const config = makeConfig();
    DnsLeakProtection.enable(config);
    const upstream = config.routing!.rules!.find((r) => r.name === dnsLeakTags.RULE_UPSTREAM);
    expect(upstream?.inboundTag).toEqual([config.dns!.tag]);
    expect(upstream?.outboundTag).toBe('proxy');
  });

  it('places the upstream fallback after the user rules (lower priority)', () => {
    const config = makeConfig();
    const userRule = { name: 'user', idx: 0, type: 'field', domain: ['x.com'], outboundTag: 'proxy' } as any;
    config.routing = { rules: [userRule] } as any;
    DnsLeakProtection.enable(config);
    const names = config.routing!.rules!.map((r) => r.name);
    expect(names.indexOf('user')).toBeLessThan(names.indexOf(dnsLeakTags.RULE_UPSTREAM));
  });

  it('skips the upstream rule when there is no proxy outbound', () => {
    const config = new XrayObject();
    DnsLeakProtection.enable(config);
    expect(config.routing!.rules!.find((r) => r.name === dnsLeakTags.RULE_UPSTREAM)).toBeUndefined();
  });

  it('does not invent DNS servers — the servers list is user-controlled', () => {
    const config = makeConfig();
    DnsLeakProtection.enable(config);
    expect(config.dns!.servers ?? []).toEqual([]);
  });

  it('detects whether a catch-all fallback server exists', () => {
    const config = makeConfig();
    config.dns!.servers = [{ address: 'https://xbox-dns.ru/dns-query', domains: ['browserleaks.com'] } as any];
    expect(DnsLeakProtection.hasFallbackServer(config)).toBe(false);
    config.dns!.servers.push('8.8.8.8');
    expect(DnsLeakProtection.hasFallbackServer(config)).toBe(true);
  });

  it('hijacks DNS on existing tproxy inbounds (port 53 -> dns-out)', () => {
    const config = makeConfig(true);
    DnsLeakProtection.enable(config);

    const hijack = config.routing!.rules!.find((r) => r.name === dnsLeakTags.RULE_HIJACK);
    expect(hijack?.inboundTag).toEqual(['all-in']);
    expect(hijack?.port).toBe('53');
    expect(hijack?.outboundTag).toBe(dnsLeakTags.DNS_OUT_TAG);
  });

  it('does not create a hijack rule when there is no tproxy inbound', () => {
    const config = makeConfig(false);
    DnsLeakProtection.enable(config);
    expect(config.routing!.rules!.find((r) => r.name === dnsLeakTags.RULE_HIJACK)).toBeUndefined();
  });

  it('is idempotent: repeated enable/repair does not duplicate objects', () => {
    const config = makeConfig(true);
    DnsLeakProtection.enable(config);
    DnsLeakProtection.enable(config);
    DnsLeakProtection.repair(config);

    expect(config.inbounds.filter((i) => i.tag === dnsLeakTags.DNS_IN_TAG).length).toBe(1);
    expect(config.outbounds.filter((o) => o.tag === dnsLeakTags.DNS_OUT_TAG).length).toBe(1);
    expect(config.routing!.rules!.filter((r) => r.name === dnsLeakTags.RULE_INTERCEPT).length).toBe(1);
    expect(config.routing!.rules!.filter((r) => r.name === dnsLeakTags.RULE_HIJACK).length).toBe(1);
  });

  it('repair() is a no-op when protection is disabled', () => {
    const config = makeConfig();
    DnsLeakProtection.repair(config);
    expect(DnsLeakProtection.isEnabled(config)).toBe(false);
    expect(config.inbounds.length).toBe(0);
  });

  it('keeps the domain-less DNS system rules through routing normalize()', () => {
    const config = makeConfig(true);
    DnsLeakProtection.enable(config);
    config.routing!.normalize();

    const names = (config.routing!.rules ?? []).map((r) => r.name);
    expect(names).toContain(dnsLeakTags.RULE_INTERCEPT);
    expect(names).toContain(dnsLeakTags.RULE_HIJACK);

    const intercept = config.routing!.rules!.find((r) => r.name === dnsLeakTags.RULE_INTERCEPT);
    expect(intercept?.outboundTag).toBe(dnsLeakTags.DNS_OUT_TAG);
  });

  it('disable() removes all provisioned wiring', () => {
    const config = makeConfig();
    DnsLeakProtection.enable(config);
    DnsLeakProtection.disable(config);

    expect(DnsLeakProtection.isEnabled(config)).toBe(false);
    expect(config.inbounds.find((i) => i.tag === dnsLeakTags.DNS_IN_TAG)).toBeUndefined();
    expect(config.outbounds.find((o) => o.tag === dnsLeakTags.DNS_OUT_TAG)).toBeUndefined();
    expect(config.routing!.rules!.find((r) => r.name === dnsLeakTags.RULE_INTERCEPT)).toBeUndefined();
    expect(config.routing!.rules!.find((r) => r.name === 'sys:dns.upstream')).toBeUndefined();
  });
});
