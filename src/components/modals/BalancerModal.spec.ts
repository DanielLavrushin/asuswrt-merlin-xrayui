import { shallowMount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import BalancerModal from '@modal/BalancerModal.vue';
import xrayConfig from '@/modules/XrayConfig';
import { XrayBurstObservatoryObject } from '@/modules/CommonObjects';

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

  const openManager = async () => {
    const wrapper = shallowMount(BalancerModal, {
      props: { balancers: [] },
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

  it('rewrites the selectors from what is typed', async () => {
    xrayConfig.burstObservatory = XrayBurstObservatoryObject.create(['p-']);
    const wrapper = await openManager();
    await wrapper.find('textarea').setValue(' q-\n\nr-');
    expect(xrayConfig.burstObservatory?.subjectSelector).toEqual(['q-', 'r-']);
  });
});
