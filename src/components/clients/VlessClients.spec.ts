import { mount } from '@vue/test-utils';
import { XrayVlessClientObject } from '@/modules/ClientsObjects';
import VlessClients from './VlessClients.vue';

jest.mock('@/modules/Engine', () => ({
  __esModule: true,
  default: { uuid: () => '00000000-0000-4000-8000-000000000000' }
}));

const ENCRYPTION = 'mlkem768x25519plus.native.0rtt.7fivwFsIyWau-_amQvMC9Ecr6RdxEcYeCSK623Ci31W3V3wTCrrCG1EYFMtGZhiG';

const build = (clients: XrayVlessClientObject[], mode: string) =>
  mount(VlessClients, {
    props: { proxy: {}, clients, mode },
    global: { stubs: { modal: true, Qr: true } }
  });

describe('VlessClients', () => {
  it('keeps the VLESS encryption key when an outbound client is edited', () => {
    const client = Object.assign(new XrayVlessClientObject(), {
      id: '51fd5b40-1234-4a1c-9d43-6c1d0f8b2a11',
      email: 'user-vless',
      flow: 'xtls-rprx-vision',
      encryption: ENCRYPTION
    });
    const clients = [client];
    const vm = build(clients, 'outbound').vm as any;

    vm.editClient(client, 0);
    vm.addClient();

    expect(clients).toHaveLength(1);
    expect(clients[0].encryption).toBe(ENCRYPTION);
    expect(clients[0].flow).toBe('xtls-rprx-vision');
  });

  it('defaults a freshly added outbound client to encryption "none"', () => {
    const clients: XrayVlessClientObject[] = [];
    const vm = build(clients, 'outbound').vm as any;

    vm.addClient();

    expect(clients).toHaveLength(1);
    expect(clients[0].encryption).toBe('none');
  });

  it('does not carry an edited key over to the next client added', () => {
    const client = Object.assign(new XrayVlessClientObject(), {
      id: 'a',
      encryption: ENCRYPTION
    });
    const clients = [client];
    const vm = build(clients, 'outbound').vm as any;

    vm.editClient(client, 0);
    vm.addClient();
    vm.newClient.id = 'b';
    vm.addClient();

    expect(clients.map((c) => c.encryption)).toEqual([ENCRYPTION, 'none']);
  });

  it('leaves encryption untouched for inbound clients', () => {
    const clients: XrayVlessClientObject[] = [];
    const vm = build(clients, 'inbound').vm as any;

    vm.addClient();

    expect(clients[0].encryption).toBeUndefined();
  });
});
