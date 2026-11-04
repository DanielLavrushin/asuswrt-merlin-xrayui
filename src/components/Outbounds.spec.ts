import { shallowMount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';

const mockConfig: Record<string, unknown> = {};
jest.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
jest.mock('@/modules/Engine', () => ({
  __esModule: true,
  default: {
    get xrayConfig() {
      return mockConfig;
    }
  }
}));
jest.mock('@/modules/Polling', () => ({ createPoller: () => ({ start: () => undefined, stop: () => undefined }) }));
jest.mock('@/modules/LiveStatus', () => ({
  liveStatus: { observatory: {} },
  refreshLiveStatus: async () => false,
  clearLiveStatus: () => undefined,
  observationAge: () => undefined
}));

import Outbounds from './Outbounds.vue';

// a modal whose close() runs the callback given to show(), like Modal.vue
const ModalStub = defineComponent({
  name: 'ModalStub',
  setup(_, { slots, expose }) {
    let onClose: (() => void) | undefined;
    expose({ show: (cb?: () => void) => (onClose = cb), close: () => onClose?.() });
    return () => h('div', slots.default?.());
  }
});

interface OutboundsVm {
  config: { outbounds: { tag: string }[] };
  proxyModal: { close: () => void };
  edit_proxy: (proxy: { tag: string }) => Promise<void>;
}

describe('Outbounds renaming an outbound', () => {
  const outbound = (tag: string) => ({ tag, protocol: 'vless', isSystem: () => false });

  const setup = () => {
    mockConfig.outbounds = [outbound('proxy-swiss'), outbound('proxy')];
    mockConfig.inbounds = [];
    mockConfig.routing = {
      rules: [
        { name: 'swiss rule', outboundTag: 'proxy-swiss' },
        { name: 'proxy rule', outboundTag: 'proxy' }
      ],
      disabled_rules: [{ name: 'disabled swiss rule', outboundTag: 'proxy-swiss' }],
      balancers: [{ tag: 'bal', fallbackTag: 'proxy-swiss' }]
    };
    (window as unknown as { xray: unknown }).xray = { server: { isRunning: false } };
    const wrapper = shallowMount(Outbounds, {
      global: {
        stubs: { modal: ModalStub, Modal: ModalStub, draggable: true, RtlsScanner: true, hint: true },
        provide: { uiResponse: ref({ xray: {} }) },
        mocks: { $t: (k: string) => k }
      }
    });
    const vm = wrapper.vm as unknown as OutboundsVm;
    const routing = mockConfig.routing as {
      rules: { outboundTag: string }[];
      disabled_rules: { outboundTag: string }[];
      balancers: { fallbackTag: string }[];
    };
    return { vm, routing, swiss: vm.config.outbounds[0] };
  };

  it("doesn't take another outbound's rules when the tag passes through its name while typing", async () => {
    const { vm, routing, swiss } = setup();
    await vm.edit_proxy(swiss);
    for (const typed of ['proxy-', 'proxy', 'proxy2']) {
      swiss.tag = typed;
      await nextTick();
    }
    vm.proxyModal.close();

    expect(routing.rules.map((r) => r.outboundTag)).toEqual(['proxy2', 'proxy']);
    expect(routing.disabled_rules[0].outboundTag).toBe('proxy2');
    expect(routing.balancers[0].fallbackTag).toBe('proxy2');
  });

  it('changes a tag that another outbound already has back instead of merging their rules', async () => {
    const { vm, routing, swiss } = setup();
    await vm.edit_proxy(swiss);
    swiss.tag = 'proxy';
    await nextTick();
    vm.proxyModal.close();

    expect(swiss.tag).toBe('proxy-swiss');
    expect(routing.rules.map((r) => r.outboundTag)).toEqual(['proxy-swiss', 'proxy']);
  });
});
