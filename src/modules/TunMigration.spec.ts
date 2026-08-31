import { plainToInstance } from 'class-transformer';
import { XrayTunInboundObject, migrateTunInbound } from './InboundObjects';
import { XrayProtocol } from './Options';
import { setCoreVersion } from './CoreVersion';

describe('migrateTunInbound', () => {
  const legacy = (settings: Record<string, unknown>) => ({
    protocol: XrayProtocol.TUN,
    settings: { name: 'xray0', ...settings }
  });

  it('moves address to gateway', () => {
    const inbound = legacy({ address: ['192.168.10.1/24', 'fd00::1/64'] });
    migrateTunInbound(inbound);

    const settings = inbound.settings as Record<string, unknown>;
    expect(settings.gateway).toEqual(['192.168.10.1/24', 'fd00::1/64']);
    expect(settings.address).toBeUndefined();
  });

  it('moves routes to autoSystemRoutingTable', () => {
    const inbound = legacy({ routes: ['10.0.0.0/8'] });
    migrateTunInbound(inbound);

    const settings = inbound.settings as Record<string, unknown>;
    expect(settings.autoSystemRoutingTable).toEqual(['10.0.0.0/8']);
    expect(settings.routes).toBeUndefined();
  });

  it('drops gso, which no released core ever accepted', () => {
    const inbound = legacy({ gso: true });
    migrateTunInbound(inbound);

    expect((inbound.settings as Record<string, unknown>).gso).toBeUndefined();
  });

  it('lowercases the pre-26.4.13 MTU spelling', () => {
    const inbound = legacy({ MTU: 1492 });
    migrateTunInbound(inbound);

    const settings = inbound.settings as Record<string, unknown>;
    expect(settings.mtu).toBe(1492);
    expect(settings.MTU).toBeUndefined();
  });

  it('keeps an already-migrated value and still clears the legacy key', () => {
    const inbound = legacy({ address: ['10.0.0.1/24'], gateway: ['192.168.10.1/24'] });
    migrateTunInbound(inbound);

    const settings = inbound.settings as Record<string, unknown>;
    expect(settings.gateway).toEqual(['192.168.10.1/24']);
    expect(settings.address).toBeUndefined();
  });

  it('leaves non-tun inbounds untouched', () => {
    const inbound = { protocol: XrayProtocol.SOCKS, settings: { address: ['10.0.0.1/24'] } };
    migrateTunInbound(inbound);

    expect((inbound.settings as Record<string, unknown>).address).toEqual(['10.0.0.1/24']);
  });
});

describe('XrayTunInboundObject.normalize', () => {
  const build = (settings: Record<string, unknown>) => plainToInstance(XrayTunInboundObject, { name: 'xray0', ...settings });

  afterEach(() => setCoreVersion('26.7.28'));

  it('keeps the modern field set on a current core', () => {
    setCoreVersion('26.7.28');
    const s = build({ gateway: ['192.168.10.1/24'], autoOutboundsInterface: 'auto', desc: 'Wintun' }).normalize()!;

    expect(s.gateway).toEqual(['192.168.10.1/24']);
    expect(s.autoOutboundsInterface).toBe('auto');
    expect(s.desc).toBe('Wintun');
  });

  it('strips desc below 26.7.28', () => {
    setCoreVersion('26.6.1');
    const s = build({ desc: 'Wintun', gateway: ['192.168.10.1/24'] }).normalize()!;

    expect(s.desc).toBeUndefined();
    expect(s.gateway).toEqual(['192.168.10.1/24']);
  });

  it('strips the core-only fields below 26.4.13 and uppercases MTU', () => {
    setCoreVersion('26.1.31');
    const s = build({ mtu: 1492, gateway: ['192.168.10.1/24'], dns: ['1.1.1.1'], autoSystemRoutingTable: ['0.0.0.0/0'], autoOutboundsInterface: 'auto' }).normalize()!;

    expect(s.dns).toBeUndefined();
    expect(s.autoSystemRoutingTable).toBeUndefined();
    expect(s.autoOutboundsInterface).toBeUndefined();
    expect(s.mtu).toBeUndefined();
    expect((s as unknown as Record<string, unknown>).MTU).toBe(1492);
  });

  it('keeps gateway on every core version, because XRAYUI assigns the addresses itself', () => {
    for (const version of ['26.1.13', '26.3.27', '26.4.13', '26.7.28']) {
      setCoreVersion(version);
      const s = build({ gateway: ['192.168.10.1/24'] }).normalize()!;
      expect(s.gateway).toEqual(['192.168.10.1/24']);
    }
  });

  it('strips the default mtu and a zero user level', () => {
    setCoreVersion('26.7.28');
    const s = build({ mtu: 1500, userLevel: 0, gateway: ['192.168.10.1/24'] }).normalize()!;

    expect(s.mtu).toBeUndefined();
    expect(s.userLevel).toBeUndefined();
  });

  it('drops empty lists', () => {
    setCoreVersion('26.7.28');
    const s = build({ gateway: [], dns: [], autoSystemRoutingTable: [], autoOutboundsInterface: '' }).normalize()!;

    expect(s.gateway).toBeUndefined();
    expect(s.dns).toBeUndefined();
    expect(s.autoSystemRoutingTable).toBeUndefined();
    expect(s.autoOutboundsInterface).toBeUndefined();
  });
});
