import { XrayObject } from './XrayConfig';
import { XrayInboundObject, XrayDokodemoDoorInboundObject } from './InboundObjects';
import { XrayOutboundObject, XrayDnsOutboundObject } from './OutboundObjects';
import { XrayDnsObject, XrayRoutingObject, XrayRoutingRuleObject } from './CommonObjects';
import { XrayProtocol } from './Options';

const DNS_IN_TAG = 'sys:dns-in';
const DNS_OUT_TAG = 'sys:dns-out';
const RULE_INTERCEPT = 'sys:dns.intercept';
const RULE_UPSTREAM = 'sys:dns.upstream';
const RULE_HIJACK = 'sys:dns.hijack';
const DNS_IN_PORT = 53000;
const DNS_TAG_DEFAULT = 'dnsQuery';

const findInbound = (config: XrayObject) => config.inbounds.find((i) => i.tag === DNS_IN_TAG) as XrayInboundObject<XrayDokodemoDoorInboundObject> | undefined;
const findOutbound = (config: XrayObject) => config.outbounds.find((o) => o.tag === DNS_OUT_TAG) as XrayOutboundObject<XrayDnsOutboundObject> | undefined;
const removeRule = (config: XrayObject, name: string) => {
  if (config.routing?.rules) config.routing.rules = config.routing.rules.filter((r) => r.name !== name);
};

const tproxyInboundTags = (config: XrayObject): string[] =>
  config.inbounds.flatMap((i) => (i.tag && i.tag !== DNS_IN_TAG && i.streamSettings?.sockopt?.tproxy === 'tproxy' ? [i.tag] : []));

export const dnsLeakTags = { DNS_IN_TAG, DNS_OUT_TAG, RULE_INTERCEPT, RULE_UPSTREAM, RULE_HIJACK };

export const isEnabled = (config: XrayObject): boolean => !!findInbound(config) && !!findOutbound(config);

export const hasFallbackServer = (config: XrayObject): boolean =>
  (config.dns?.servers ?? []).some((s) => typeof s === 'string' || (!s.domains?.length && !s.rules?.length));

const firstProxyTag = (config: XrayObject): string | undefined =>
  config.outbounds.find((o) => !o.isSystem() && o.protocol !== XrayProtocol.FREEDOM && o.protocol !== XrayProtocol.BLACKHOLE && o.protocol !== XrayProtocol.DNS && !!o.tag)?.tag;

const ensureRule = (config: XrayObject, name: string, inboundTag: string, outboundTag: string) => {
  removeRule(config, name);
  const rule = new XrayRoutingRuleObject();
  rule.name = name;
  rule.type = 'field';
  rule.inboundTag = [inboundTag];
  rule.outboundTag = outboundTag;
  rule.domain = undefined;
  rule.ip = undefined;
  config.routing!.rules!.push(rule);
  return rule;
};

export const enable = (config: XrayObject): void => {
  if (!config.dns) config.dns = new XrayDnsObject();
  if (!config.dns.tag) config.dns.tag = DNS_TAG_DEFAULT;

  if (!findInbound(config)) {
    const inbound = new XrayInboundObject<XrayDokodemoDoorInboundObject>(XrayProtocol.DOKODEMODOOR, new XrayDokodemoDoorInboundObject());
    inbound.tag = DNS_IN_TAG;
    inbound.listen = '127.0.0.1';
    inbound.port = DNS_IN_PORT;
    inbound.settings!.network = 'tcp,udp';
    inbound.settings!.followRedirect = false;
    inbound.settings!.address = '1.1.1.1';
    inbound.settings!.port = 53;
    config.inbounds.push(inbound);
  }

  if (!findOutbound(config)) {
    const outbound = new XrayOutboundObject<XrayDnsOutboundObject>(XrayProtocol.DNS, new XrayDnsOutboundObject());
    outbound.tag = DNS_OUT_TAG;
    config.outbounds.push(outbound);
  }

  if (!config.routing) config.routing = new XrayRoutingObject();
  if (!config.routing.rules) config.routing.rules = [];

  ensureRule(config, RULE_INTERCEPT, DNS_IN_TAG, DNS_OUT_TAG);

  removeRule(config, RULE_UPSTREAM);
  const proxyTag = firstProxyTag(config);
  if (proxyTag) {
    ensureRule(config, RULE_UPSTREAM, config.dns.tag!, proxyTag);
  }

  removeRule(config, RULE_HIJACK);
  const tproxyTags = tproxyInboundTags(config);
  if (tproxyTags.length > 0) {
    const hijack = new XrayRoutingRuleObject();
    hijack.name = RULE_HIJACK;
    hijack.type = 'field';
    hijack.inboundTag = tproxyTags;
    hijack.port = '53';
    hijack.network = 'tcp,udp';
    hijack.outboundTag = DNS_OUT_TAG;
    config.routing!.rules!.push(hijack);
  }
};

export const disable = (config: XrayObject): void => {
  config.inbounds = config.inbounds.filter((i) => i.tag !== DNS_IN_TAG);
  config.outbounds = config.outbounds.filter((o) => o.tag !== DNS_OUT_TAG);
  removeRule(config, RULE_INTERCEPT);
  removeRule(config, RULE_UPSTREAM);
  removeRule(config, RULE_HIJACK);
};

export const repair = (config: XrayObject): void => {
  if (!isEnabled(config)) return;
  enable(config);
};
