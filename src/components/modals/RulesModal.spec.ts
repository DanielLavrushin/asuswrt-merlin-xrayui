import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import RulesModal from '@modal/RulesModal.vue';

jest.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k })
}));

const ModalStub = defineComponent({
  name: 'ModalStub',
  setup(_, { slots, expose }) {
    expose({ show: () => undefined, close: () => undefined });
    return () => h('div', slots.default?.());
  }
});

interface RulesModalVm {
  rules: { ip?: string[]; source?: string[]; domain?: string[] }[];
  ips: string;
  source: string;
  domains: string;
  addRule: () => void;
  saveRule: () => void;
}

describe('RulesModal custom geodata lists', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => alertSpy.mockRestore());

  const mountModal = () => {
    const wrapper = shallowMount(RulesModal, {
      props: { rules: [], disabled_rules: [] },
      global: { stubs: { modal: ModalStub, hint: true, draggable: true, teleport: true }, mocks: { $t: (k: string) => k } }
    });
    const vm = wrapper.vm as unknown as RulesModalVm;
    vm.addRule();
    return vm;
  };

  it('refuses ext:xrayui: lists in the target IP list', () => {
    const vm = mountModal();
    vm.ips = '1.1.1.1/32\next:xrayui:viber-geoip';
    vm.saveRule();
    expect(alertSpy).toHaveBeenCalledWith('com.RulesModal.alert_ext_xrayui_in_ips');
    expect(vm.rules).toHaveLength(0);
  });

  it('refuses ext:xrayui: lists in the source IP list', () => {
    const vm = mountModal();
    vm.source = 'EXT:XRAYUI:viber-geoip';
    vm.saveRule();
    expect(alertSpy).toHaveBeenCalled();
    expect(vm.rules).toHaveLength(0);
  });

  it('keeps ext:xrayui: lists in the domain list and other ext: files in IP lists', () => {
    const vm = mountModal();
    vm.domains = 'ext:xrayui:viber';
    vm.ips = 'ext:geoip_custom.dat:viber\ngeoip:cloudflare';
    vm.saveRule();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(vm.rules).toHaveLength(1);
    expect(vm.rules[0].domain).toEqual(['ext:xrayui:viber']);
    expect(vm.rules[0].ip).toEqual(['ext:geoip_custom.dat:viber', 'geoip:cloudflare']);
  });
});
