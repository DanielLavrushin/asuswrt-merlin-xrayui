import { plainToInstance } from 'class-transformer';
import engine from '@modules/Engine';
import { XrayWireguardInboundObject, migrateWireguardInbound } from './InboundObjects';
import { XrayProtocol } from './Options';
import { XrayObject } from './XrayConfig';

const wireguardSettings = (settings: Record<string, unknown>) => ({ secretKey: 'key', mtu: 1420, peers: [], ...settings });

describe('migrateWireguardInbound', () => {
  const legacy = (settings: Record<string, unknown>) => ({ protocol: XrayProtocol.WIREGUARD, settings: wireguardSettings(settings) });
  const settingsOf = (inbound: { settings: unknown }) => inbound.settings as Record<string, unknown>;

  it('turns kernelMode off into noKernelTun on', () => {
    const inbound = legacy({ kernelMode: false });
    migrateWireguardInbound(inbound);

    expect(settingsOf(inbound).noKernelTun).toBe(true);
    expect(settingsOf(inbound)).not.toHaveProperty('kernelMode');
  });

  it('drops kernelMode on without enabling noKernelTun', () => {
    const inbound = legacy({ kernelMode: true });
    migrateWireguardInbound(inbound);

    expect(settingsOf(inbound)).not.toHaveProperty('noKernelTun');
    expect(settingsOf(inbound)).not.toHaveProperty('kernelMode');
  });

  it('keeps an explicit noKernelTun, the key core reads, over kernelMode', () => {
    const inbound = legacy({ kernelMode: false, noKernelTun: false });
    migrateWireguardInbound(inbound);

    expect(settingsOf(inbound).noKernelTun).toBe(false);
    expect(settingsOf(inbound)).not.toHaveProperty('kernelMode');
  });

  it('leaves other protocols untouched', () => {
    const inbound = { protocol: XrayProtocol.SOCKS, settings: { kernelMode: false } };
    migrateWireguardInbound(inbound);

    expect(inbound.settings).toEqual({ kernelMode: false });
  });
});

describe('WireGuard inbound load and Apply', () => {
  const loadAndApply = (settings: Record<string, unknown>) => {
    const disk = { inbounds: [{ tag: 'wg-in', protocol: XrayProtocol.WIREGUARD, port: 51820, settings: wireguardSettings(settings) }], outbounds: [] };
    const loaded = engine.hydrateConfig(plainToInstance(XrayObject, disk));
    const written = JSON.parse(JSON.stringify(engine.prepareServerConfig(loaded))) as { inbounds: { settings: Record<string, unknown> }[] };
    return { ui: loaded.inbounds[0].settings as XrayWireguardInboundObject, written: written.inbounds[0].settings };
  };

  it('keeps an inbound that ran on gVisor on gVisor', () => {
    const { ui, written } = loadAndApply({ kernelMode: false });

    expect(ui.noKernelTun).toBe(true);
    expect(written.noKernelTun).toBe(true);
    expect(written).not.toHaveProperty('kernelMode');
  });

  it('writes neither key for an inbound on the kernel interface', () => {
    const { ui, written } = loadAndApply({ kernelMode: true });

    expect(ui.noKernelTun).toBeUndefined();
    expect(written).not.toHaveProperty('noKernelTun');
    expect(written).not.toHaveProperty('kernelMode');
  });
});
