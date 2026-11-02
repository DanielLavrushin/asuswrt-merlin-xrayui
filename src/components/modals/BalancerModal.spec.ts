import { shallowMount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import BalancerModal from '@modal/BalancerModal.vue';
import xrayConfig from '@/modules/XrayConfig';
import { XrayBalancerObject, XrayBurstObservatoryObject } from '@/modules/CommonObjects';

jest.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k })
}));

// like Modal.vue, the body renders only once the modal is shown
const ModalStub = defineComponent({
  name: 'ModalStub',
  setup(_, { slots, expose }) {
    const visible = ref(false);
    expose({ show: () => (visible.value = true), close: () => (visible.value = false) });
    return () => h('div', visible.value ? slots.default?.() : []);
  }
});

describe('BalancerModal burstObservatory selectors', () => {
  afterEach(() => {
    xrayConfig.burstObservatory = undefined;
  });

  const openManager = async (balancers: XrayBalancerObject[] = []) => {
    const wrapper = shallowMount(BalancerModal, {
      props: { balancers },
      global: { stubs: { modal: ModalStub, hint: true }, mocks: { $t: (k: string) => k } }
    });
    (wrapper.vm as unknown as { show: () => void }).show();
    await nextTick();
    return wrapper;
  };

  it('leaves a hand-written empty-prefix selector alone when the manager opens', async () => {
    xrayConfig.burstObservatory = Object.assign(new XrayBurstObservatoryObject(), { subjectSelector: ['', 'p-'] });
    await openManager();
    expect(xrayConfig.burstObservatory?.subjectSelector).toEqual(['', 'p-']);
  });

  // Xray splits a balancer selector written as a comma string
  const commaBalancer = () => Object.assign(new XrayBalancerObject(), { tag: 'bal', selector: 'p-,q-' as unknown as string[] });

  it('splits a comma-string balancer selector when switching to burstObservatory', async () => {
    const wrapper = await openManager([commaBalancer()]);
    (wrapper.vm as unknown as { observatoryMode: string }).observatoryMode = 'burst';
    expect(xrayConfig.burstObservatory?.subjectSelector).toEqual(['p-', 'q-']);
  });

  it('opens a balancer whose selector is a comma string for editing', async () => {
    const wrapper = await openManager();
    const vm = wrapper.vm as unknown as { editBalancer: (b: XrayBalancerObject) => void; selectorText: string };
    vm.editBalancer(commaBalancer());
    expect(vm.selectorText).toBe('p-\nq-');
  });

  it('rewrites the selectors from what is typed', async () => {
    xrayConfig.burstObservatory = XrayBurstObservatoryObject.create(['p-']);
    const wrapper = await openManager();
    await wrapper.find('textarea').setValue(' q-\n\nr-');
    expect(xrayConfig.burstObservatory?.subjectSelector).toEqual(['q-', 'r-']);
  });
});
