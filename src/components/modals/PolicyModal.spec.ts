import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import PolicyModal from '@modal/PolicyModal.vue';

const ModalStub = defineComponent({
  name: 'ModalStub',
  setup(_, { slots, expose }) {
    expose({ show: () => undefined, close: () => undefined });
    return () => h('div', slots.default?.());
  }
});

const devices = {
  'AA:AA:AA:AA:AA:01': { mac: 'AA:AA:AA:AA:AA:01', name: 'phone', nickName: '', vendor: 'Samsung', wireless: 2, online: '1' },
  'AA:AA:AA:AA:AA:02': { mac: 'AA:AA:AA:AA:AA:02', name: 'nas', nickName: 'NAS', vendor: 'Synology', wireless: 0, online: '1' },
  'AA:AA:AA:AA:AA:03': { mac: 'AA:AA:AA:AA:AA:03', name: 'laptop', nickName: '', vendor: 'Intel', wireless: 2, online: '0' },
  maclist: ['AA:AA:AA:AA:AA:01', 'AA:AA:AA:AA:AA:02', 'AA:AA:AA:AA:AA:03'],
  ClientAPILevel: '7'
};
const devicesOnline = {
  'AA:AA:AA:AA:AA:01': { mac: 'AA:AA:AA:AA:AA:01', name: 'phone', nickName: '', isWL: '2', isOnline: '1' },
  'AA:AA:AA:AA:AA:02': { mac: 'AA:AA:AA:AA:AA:02', name: 'nas', nickName: 'NAS', isWL: '0', isOnline: '1' },
  'AA:AA:AA:AA:AA:03': { mac: 'AA:AA:AA:AA:AA:03', name: 'laptop', nickName: '', isWL: '2', isOnline: '0' },
  'AA:AA:AA:AA:AA:04': { mac: 'AA:AA:AA:AA:AA:04', name: 'guest', nickName: '', isWL: '1', isOnline: '1' },
  maclist: ['AA:AA:AA:AA:AA:01', 'AA:AA:AA:AA:AA:02', 'AA:AA:AA:AA:AA:04'],
  ClientAPILevel: '7'
};

describe('PolicyModal device list', () => {
  beforeEach(() => {
    (window as any).xray = { router: { devices, devices_online: devicesOnline } };
  });

  const mountList = () => {
    const wrapper = shallowMount(PolicyModal, {
      props: { policies: [] },
      global: { stubs: { modal: ModalStub, hint: true, draggable: true, teleport: true }, mocks: { $t: (k: string) => k } }
    });
    const list = (wrapper.vm as unknown as { devices: { mac: string; name: string; isOnline: boolean; isWireless?: boolean }[] }).devices;
    return Object.fromEntries(list.map((d) => [d.mac, d]));
  };

  it('marks Wi-Fi clients from the firmware wireless and isWL fields', () => {
    const list = mountList();
    expect(list['AA:AA:AA:AA:AA:01']).toMatchObject({ name: 'phone', isWireless: true });
    expect(list['AA:AA:AA:AA:AA:02']).toMatchObject({ name: 'NAS', isWireless: false });
    expect(list['AA:AA:AA:AA:AA:03']).toMatchObject({ name: 'laptop', isWireless: true });
    expect(list['AA:AA:AA:AA:AA:04']).toMatchObject({ name: 'AA:AA:AA:AA:AA:04', isWireless: true });
  });

  it('treats clients the firmware reports with isOnline 0 as offline', () => {
    const list = mountList();
    expect(list['AA:AA:AA:AA:AA:01'].isOnline).toBe(true);
    expect(list['AA:AA:AA:AA:AA:03'].isOnline).toBe(false);
    expect(list['AA:AA:AA:AA:AA:04'].isOnline).toBe(true);
  });

  it('skips the maclist and ClientAPILevel keys', () => {
    expect(Object.keys(mountList()).sort()).toEqual(['AA:AA:AA:AA:AA:01', 'AA:AA:AA:AA:AA:02', 'AA:AA:AA:AA:AA:03', 'AA:AA:AA:AA:AA:04']);
  });
});
