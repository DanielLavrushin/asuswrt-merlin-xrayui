import { plainToInstance } from 'class-transformer';
import { GetXrayConfig } from '@/../tests/FakesLoader';

const diskConfig = GetXrayConfig('main.json');
diskConfig.outbounds.push({
  tag: 'kcp-out',
  protocol: 'vless',
  settings: { vnext: [{ address: '10.0.0.2', port: 443, users: [{ id: '00000000-0000-0000-0000-000000000000', encryption: 'none' }] }] },
  streamSettings: {
    network: 'kcp',
    kcpSettings: { uplinkCapacity: 12, downlinkCapacity: 100 },
    finalmask: { udp: [{ type: 'mkcp-legacy', settings: { value: 'p4ss' } }, { type: 'mkcp-legacy', settings: { header: 'wechat' } }] }
  }
});

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: JSON.parse(JSON.stringify(diskConfig)) }))
}));

import engine from '@modules/Engine';
import { XrayObject } from './XrayConfig';
import { setCoreVersion } from './CoreVersion';
import { XrayStreamKcpSettingsObject } from './TransportObjects';
import { XraySniffingObject } from './CommonObjects';

const kcpOutbound = (config: XrayObject) => config.outbounds.find((o) => o.tag === 'kcp-out')!;

describe('unapplied changes', () => {
  let config: XrayObject;

  beforeEach(async () => {
    setCoreVersion('26.7.28');
    config = (await engine.loadXrayConfig())!;
  });

  afterEach(() => {
    setCoreVersion('0.0.0');
    delete diskConfig.dns.hosts;
  });

  it('reports nothing right after loading from the router', () => {
    expect(engine.hasUnappliedChanges(config)).toBe(false);
  });

  it('reports an edited mKCP value', () => {
    kcpOutbound(config).streamSettings!.kcpSettings!.uplinkCapacity = 30;
    expect(engine.hasUnappliedChanges(config)).toBe(true);
  });

  it('clears once the value is set back', () => {
    const kcp = kcpOutbound(config).streamSettings!.kcpSettings!;
    kcp.uplinkCapacity = 30;
    kcp.uplinkCapacity = 12;
    expect(engine.hasUnappliedChanges(config)).toBe(false);
  });

  it('ignores a settings object recreated with the same values', () => {
    const stream = kcpOutbound(config).streamSettings!;
    stream.kcpSettings = plainToInstance(XrayStreamKcpSettingsObject, { seed: 'p4ss', header: { type: 'wechat-video' }, downlinkCapacity: 100, uplinkCapacity: 12 });
    expect(engine.hasUnappliedChanges(config)).toBe(false);
  });

  it('ignores key order inside maps', async () => {
    diskConfig.dns.hosts = { 'a.example': '10.0.0.1', 'b.example': '10.0.0.2' };
    config = (await engine.loadXrayConfig())!;
    config.dns!.hosts = { 'b.example': '10.0.0.2', 'a.example': '10.0.0.1' };
    expect(engine.hasUnappliedChanges(config)).toBe(false);
    config.dns!.hosts['c.example'] = '10.0.0.3';
    expect(engine.hasUnappliedChanges(config)).toBe(true);
  });

  it('ignores an empty sniffing block added by opening the sniffing window', () => {
    const inbound = config.inbounds.find((i) => !i.sniffing)!;
    inbound.sniffing = new XraySniffingObject();
    expect(engine.hasUnappliedChanges(config)).toBe(false);
  });

  it('stays clean when the core version becomes known after loading', async () => {
    setCoreVersion('0.0.0');
    config = (await engine.loadXrayConfig())!;
    expect(engine.hasUnappliedChanges(config)).toBe(false);
    setCoreVersion('26.7.28');
    expect(engine.hasUnappliedChanges(config)).toBe(false);
  });

  it('reports an imported configuration until it is applied', async () => {
    const imported = plainToInstance(XrayObject, JSON.parse(JSON.stringify(diskConfig)));
    imported.outbounds.pop();
    config = (await engine.loadXrayConfig(imported))!;
    expect(engine.hasUnappliedChanges(config)).toBe(true);
  });
});
