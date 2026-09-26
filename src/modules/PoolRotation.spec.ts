jest.mock('axios', () => ({ get: jest.fn() }));

import axios from 'axios';
import engine from '@modules/Engine';
import { XrayObject } from '@modules/XrayConfig';

const get = axios.get as jest.Mock;

const A = 'vless://a@1.1.1.1:443?type=tcp#A';
const B = 'vless://b@2.2.2.2:443?type=tcp#B';

const outbound = (address: string, id: string, active: string) => ({
  tag: 'proxy',
  protocol: 'vless',
  settings: { vnext: [{ address, port: 443, users: [{ id, encryption: 'none' }] }] },
  streamSettings: { network: 'tcp', security: 'none', sockopt: { mark: 255 } },
  subPool: { enabled: true, active }
});

const configWith = (ob: object) => ({ inbounds: [], outbounds: [ob] }) as unknown as XrayObject;

async function loadPage(): Promise<XrayObject> {
  get.mockResolvedValueOnce({ data: configWith(outbound('1.1.1.1', 'a', A)) });
  return (await engine.loadXrayConfig())!;
}

async function applyAfterRouterSwitched(config: XrayObject) {
  get.mockResolvedValueOnce({ data: configWith(outbound('2.2.2.2', 'b', B)) });
  await engine.keepRotatedOutbounds(config);
  return config.outbounds[0] as any;
}

describe('Engine.keepRotatedOutbounds', () => {
  beforeEach(() => get.mockReset());

  it('adopts a switch made by the router while the page was open', async () => {
    const proxy = await applyAfterRouterSwitched(await loadPage());

    expect(proxy.settings.vnext[0].address).toBe('2.2.2.2');
    expect(proxy.subPool.active).toBe(B);
  });

  it('keeps a top-level edit such as mux', async () => {
    const config = await loadPage();
    (config.outbounds[0] as any).mux = { enabled: true, concurrency: 8 };

    const proxy = await applyAfterRouterSwitched(config);

    expect(proxy.settings.vnext[0].address).toBe('2.2.2.2');
    expect(proxy.mux).toEqual({ enabled: true, concurrency: 8 });
  });

  it('keeps an edited sockopt on top of the new server', async () => {
    const config = await loadPage();
    config.outbounds[0].streamSettings!.sockopt!.mark = 100;

    const proxy = await applyAfterRouterSwitched(config);

    expect(proxy.settings.vnext[0].address).toBe('2.2.2.2');
    expect(proxy.streamSettings.sockopt.mark).toBe(100);
  });

  it('does not overwrite an edited transport', async () => {
    const config = await loadPage();
    config.outbounds[0].streamSettings!.security = 'tls';

    const proxy = await applyAfterRouterSwitched(config);

    expect(proxy.settings.vnext[0].address).toBe('1.1.1.1');
    expect(proxy.streamSettings.security).toBe('tls');
    expect(proxy.subPool.active).toBe(A);
  });

  it('does not overwrite a server edited by hand', async () => {
    const config = await loadPage();
    (config.outbounds[0].settings as any).vnext[0].address = '9.9.9.9';

    const proxy = await applyAfterRouterSwitched(config);

    expect(proxy.settings.vnext[0].address).toBe('9.9.9.9');
  });

  it('does not overwrite a server picked from the dropdown', async () => {
    const config = await loadPage();
    config.outbounds[0].subPool!.active = 'vless://c@3.3.3.3:443?type=tcp#C';

    const proxy = await applyAfterRouterSwitched(config);

    expect(proxy.settings.vnext[0].address).toBe('1.1.1.1');
    expect(proxy.subPool.active).toBe('vless://c@3.3.3.3:443?type=tcp#C');
  });
});
