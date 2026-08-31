import { plainToInstance } from 'class-transformer';
import engine from '@modules/Engine';
import { XrayObject } from '@modules/XrayConfig';
import { XrayDnsServerObject, XrayRoutingRuleObject } from '@modules/CommonObjects';

const buildConfig = () =>
  plainToInstance(XrayObject, {
    inbounds: [],
    outbounds: [],
    routing: {
      rules: [
        { idx: 0, name: 'ads', type: 'field', domain: ['ads.example.com'], outboundTag: 'block' },
        { idx: 1, name: 'work', type: 'field', domain: ['work.example.com'], ip: ['10.0.0.0/8'], outboundTag: 'proxy' }
      ]
    },
    dns: { servers: [{ address: '1.1.1.1', rules: [1] }] }
  });

const dnsServer = (config: XrayObject) => config.dns!.servers![0] as XrayDnsServerObject;

describe('dns server rule associations', () => {
  it('resolves numeric rule references into the routing rule instances on load', () => {
    const config = engine.hydrateConfig(buildConfig());
    const rules = dnsServer(config).rules as XrayRoutingRuleObject[];
    expect(rules).toHaveLength(1);
    expect(rules[0]).toBe(config.routing!.rules![1]);
    expect(dnsServer(config).domains).toEqual([]);
    expect(dnsServer(config).expectIPs).toEqual([]);
  });

  it('keeps the association through a save round-trip', () => {
    const loaded = engine.hydrateConfig(buildConfig());
    const prepared = engine.prepareServerConfig(loaded);
    expect(dnsServer(prepared).rules).toEqual([1]);
  });

  it('keeps the association through repeated saves', () => {
    let config = engine.hydrateConfig(buildConfig());
    for (let i = 0; i < 3; i++) {
      const prepared = engine.prepareServerConfig(config);
      expect(dnsServer(prepared).rules).toEqual([1]);
      config = engine.hydrateConfig(plainToInstance(XrayObject, JSON.parse(JSON.stringify(prepared))));
      expect(dnsServer(config).rules).toHaveLength(1);
    }
  });
});
