jest.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k })
}));

import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import XrayVersion from '@main/XrayVersion.vue';
import { EngineResponseConfig } from '@/modules/Engine';

describe('XrayVersion.vue', () => {
  const ModalStub = defineComponent({
    name: 'XrayCoreVersionModal',
    props: { currentVersion: { type: String, default: '' } },
    setup(props, { expose }) {
      expose({ show: () => {} });
      return () => h('div', { class: 'modal-stub' }, props.currentVersion);
    }
  });

  function mountVersion() {
    const uiResponse = ref(new EngineResponseConfig());
    const wrapper = mount(XrayVersion, {
      global: { provide: { uiResponse }, stubs: { XrayCoreVersionModal: ModalStub } }
    });
    const respond = async (xray: Partial<EngineResponseConfig['xray']>) => {
      uiResponse.value = { xray } as EngineResponseConfig;
      await nextTick();
    };
    return { wrapper, respond };
  }

  it('stays hidden until the router reports the core', () => {
    const { wrapper } = mountVersion();
    expect(wrapper.find('.core-version').isVisible()).toBe(false);
  });

  it('shows the installed core version and passes it to the update window', async () => {
    const { wrapper, respond } = mountVersion();
    await respond({ core_version: '26.7.28', core_error: '' });
    expect(wrapper.find('.core-version').isVisible()).toBe(true);
    expect(wrapper.find('.core-version a').text()).toBe('26.7.28');
    expect(wrapper.find('.core-version a').attributes('title')).toBeUndefined();
    expect(wrapper.find('.modal-stub').text()).toBe('26.7.28');
  });

  it('shows a missing core instead of a fake version', async () => {
    const { wrapper, respond } = mountVersion();
    await respond({ core_version: '', core_error: 'not installed' });
    expect(wrapper.find('.core-version').isVisible()).toBe(true);
    expect(wrapper.find('.core-version a').text()).toBe('com.XrayVersion.not_installed');
    expect(wrapper.find('.modal-stub').text()).toBe('');
  });

  it('shows a core that fails to run, with the reason on hover', async () => {
    const { wrapper, respond } = mountVersion();
    await respond({ core_version: '', core_error: 'fatal error: runtime: cannot allocate memory' });
    expect(wrapper.find('.core-version a').text()).toBe('com.XrayVersion.not_working');
    expect(wrapper.find('.core-version a').attributes('title')).toBe('fatal error: runtime: cannot allocate memory');
  });
});
