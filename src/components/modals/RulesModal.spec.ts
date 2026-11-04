import { shallowMount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import RulesModal from '@modal/RulesModal.vue';
import { XrayRoutingRuleObject } from '@/modules/CommonObjects';

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

describe('RulesModal reassigning an inbound', () => {
  interface ReassignVm {
    show: (onClose: () => void) => void;
    reassignField: 'outbound' | 'inbound';
    reassignFrom: string;
    reassignTo: string;
    reassignPlan: { change: XrayRoutingRuleObject[]; skip: XrayRoutingRuleObject[] };
    reassign: () => void;
  }

  const rule = (idx: number, name: string, inboundTag: string[], enabled = true) =>
    Object.assign(new XrayRoutingRuleObject(), { idx, name, outboundTag: 'proxy', inboundTag, enabled });

  const setup = async () => {
    const only = rule(0, 'only socks-in', ['socks-in']);
    const duplicate = rule(1, 'socks-in twice', ['socks-in', 'socks-in']);
    const multi = rule(2, 'socks-in and tproxy-in', ['socks-in', 'tproxy-in']);
    const system = rule(3, 'sys:metrics', ['socks-in', 'tproxy-in']);
    const disabled = rule(4, 'disabled socks-in and new-in', ['socks-in', 'new-in'], false);
    const wrapper = shallowMount(RulesModal, {
      props: { rules: [only, duplicate, multi, system], disabled_rules: [disabled] },
      global: { stubs: { modal: ModalStub, hint: true, draggable: true, teleport: true }, mocks: { $t: (k: string) => k } }
    });
    const vm = wrapper.vm as unknown as ReassignVm;
    vm.show(() => undefined);
    vm.reassignField = 'inbound';
    await nextTick(); // switching the field resets From and To
    vm.reassignFrom = 'i:socks-in';
    return { vm, only, duplicate, multi, system, disabled };
  };

  it("never removes a rule's last inbound, which would make the rule match every inbound", async () => {
    const { vm, only, duplicate, multi, system, disabled } = await setup();
    vm.reassignTo = 'remove';

    expect(vm.reassignPlan.skip).toHaveLength(2);
    vm.reassign();

    expect(only.inboundTag).toEqual(['socks-in']);
    expect(duplicate.inboundTag).toEqual(['socks-in', 'socks-in']);
    expect(multi.inboundTag).toEqual(['tproxy-in']);
    expect(disabled.inboundTag).toEqual(['new-in']);
    expect(disabled.enabled).toBe(false);
    expect(system.inboundTag).toEqual(['socks-in', 'tproxy-in']);
  });

  it('replaces an inbound without listing the new one twice', async () => {
    const { vm, only, multi, system, disabled } = await setup();
    vm.reassignTo = 'i:new-in';
    vm.reassign();

    expect(only.inboundTag).toEqual(['new-in']);
    expect(multi.inboundTag).toEqual(['new-in', 'tproxy-in']);
    expect(disabled.inboundTag).toEqual(['new-in']);
    expect(system.inboundTag).toEqual(['socks-in', 'tproxy-in']);
  });
});
