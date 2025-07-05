import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import SniffingModal from '@modal/SniffingModal.vue';
import { XraySniffingObject } from '@/modules/CommonObjects';

describe('SniffingModal.vue', () => {
  let sniff: XraySniffingObject;
  const closeSpy = jest.fn();
  let onCloseDomains: (() => void) | null = null;
  // 1) Stub the *lowercase* <teleport> so it inlines its children
  const TeleportStub = defineComponent({
    name: 'teleport',
    setup(_, { slots }) {
      return () => slots.default?.();
    }
  });

  // 2) Stub the *lowercase* <modal> tag (that your component uses)…
  //    and expose no-ops for show/close.
  const ModalStub = defineComponent({
    name: 'modal',
    props: { title: String, width: String },
    setup(_, { slots, expose }) {
      expose({
        show: (cb?: () => void) => {
          onCloseDomains = cb ?? null;
        },
        close: () => {
          if (onCloseDomains) onCloseDomains();
          closeSpy();
        }
      });
      return () => h('div', { 'data-test': 'modal-stub' }, slots.default?.());
    }
  });

  beforeEach(() => {
    sniff = new XraySniffingObject();
    sniff.enabled = true;
    sniff.metadataOnly = false;
    sniff.destOverride = ['http', 'tls'];
    closeSpy.mockClear();
  });

  function mountComponent() {
    return mount(SniffingModal, {
      props: { sniffing: sniff },
      global: {
        stubs: {
          teleport: TeleportStub, // override the real <teleport>
          modal: ModalStub, // override the real <modal>
          hint: true // no-op for <hint>
        },
        mocks: {
          $t: (k: string) => k
        }
      }
    });
  }
  it('renders exactly one checkbox per destOverride option', () => {
    const wrapper = mountComponent();

    const boxes = wrapper.findAll('input[id^="destopt-"]');
    expect(boxes).toHaveLength(XraySniffingObject.destOverrideOptions.length);

    const checkedValues = boxes.filter((w) => (w.element as HTMLInputElement).checked).map((w) => (w.element as HTMLInputElement).value);
    expect(checkedValues).toEqual(['http', 'tls']);
  });

  it('watch on metadataOnly clears destOverride', async () => {
    const wrapper = mountComponent();

    wrapper.vm.sniffing.metadataOnly = true;
    await nextTick();

    expect(wrapper.vm.sniffing.destOverride).toEqual([]);
  });

  it('save() calls modal.close() and emits "save"', async () => {
    const wrapper = mountComponent();
    const destOpts = wrapper.findAll('input[id^="destopt-"]');
    await destOpts[0].setValue(false);
    const modalWrapper = wrapper.findComponent(ModalStub);
    if (modalWrapper.vm.$.exposed) {
      modalWrapper.vm.$.exposed.close = closeSpy;
    }
    wrapper.vm.save();

    const ev = wrapper.emitted('save')!;
    expect(ev).toHaveLength(1);
    const emittedValue = wrapper.emitted('save')![0][0] as { value: XraySniffingObject };
    expect(emittedValue.value).toHaveProperty('enabled', true);
    expect(emittedValue.value).toHaveProperty('metadataOnly', false);
    expect(emittedValue.value).toHaveProperty('destOverride', ['tls']);
    expect(closeSpy).toHaveBeenCalled();
  });

  it('turn off sniffing"', async () => {
    const wrapper = mountComponent();
    const sniffRadioOff = wrapper.find('input[id="snifoff"]');
    await sniffRadioOff.setValue(true);

    wrapper.vm.save();

    const ev = wrapper.emitted('save')!;
    expect(ev).toHaveLength(1);
    const emittedValue = wrapper.emitted('save')![0][0] as { value: XraySniffingObject };
    expect(emittedValue.value).toHaveProperty('enabled', false);
    expect(emittedValue.value).toHaveProperty('destOverride', []);
    expect(closeSpy).toHaveBeenCalled();
  });

  it('manage excluded domains list', async () => {
    const wrapper = mountComponent();

    wrapper.vm.manage_domains_exclude();
    await nextTick();

    const ta = wrapper.find('textarea');
    expect(ta.exists()).toBe(true);
    expect((ta.element as HTMLTextAreaElement).value).toBe('');

    ta.setValue('example.com\ntest.com');
    wrapper.vm.modalDomains.close();
    await nextTick();

    expect(wrapper.vm.sniffing.domainsExcluded).toEqual(['example.com', 'test.com']);
  });
});
