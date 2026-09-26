jest.mock('@/modules/Engine', () => {
  const actual = jest.requireActual('@/modules/Engine');
  return {
    ...actual,
    __esModule: true,
    default: {
      getCookie: jest.fn().mockReturnValue(undefined),
      setCookie: jest.fn(),
      submit: jest.fn(),
      executeWithLoadingProgress: jest.fn(),
      fetchGithubJson: jest.fn().mockResolvedValue({ tag_name: 'v0.70.1', body: '' })
    }
  };
});

import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import Version from '@main/Version.vue';
import engine, { EngineResponseConfig } from '@/modules/Engine';
import { XrayUiGlobal } from '@/global';

describe('Version.vue', () => {
  const ModalStub = defineComponent({
    name: 'Modal',
    setup(_, { slots, expose }) {
      expose({ show: () => {}, close: () => {} });
      return () => h('div', slots.default?.());
    }
  });

  function mountWith(custom_settings: Record<string, string>) {
    window.xray = { router: {}, server: {}, custom_settings } as unknown as XrayUiGlobal;
    const uiResponse = ref(new EngineResponseConfig());
    const wrapper = mount(Version, {
      global: { provide: { uiResponse }, stubs: { modal: ModalStub }, mocks: { $t: (key: string) => key } }
    });
    const respond = async (ui_version: string) => {
      uiResponse.value = { xray: { ui_version, github_proxy: '' } } as EngineResponseConfig;
      await nextTick();
      await flushPromises();
    };
    return { wrapper, respond };
  }
  const label = (wrapper: ReturnType<typeof mountWith>['wrapper']) => wrapper.find('.version a').text().replace(/\s+/g, ' ').trim();

  it('opens without a stored version and shows the one reported by the router', async () => {
    const { wrapper, respond } = mountWith({});
    expect(label(wrapper)).toBe('XRAYUI v');
    await respond('0.70.0');
    expect(label(wrapper)).toBe('! XRAYUI v0.70.0');
  });

  it('adds the patch number to a two-part stored version', async () => {
    const { wrapper, respond } = mountWith({ xray_version: '0.70' });
    await respond('9.9.9');
    expect(label(wrapper)).toBe('! XRAYUI v0.70.0');
  });

  it('shows markup in the release notes as text', async () => {
    (engine.fetchGithubJson as jest.Mock).mockResolvedValueOnce({ tag_name: 'v0.70.1', body: '**Fixed** <img src=x onerror="window.pwned=1">' });
    const { wrapper, respond } = mountWith({ xray_version: '0.70.0' });
    await respond('0.70.0');
    const notes = wrapper.find('.changelog');
    expect(notes.find('img').exists()).toBe(false);
    expect(notes.find('strong').text()).toBe('Fixed');
    expect(notes.text()).toContain('<img src=x onerror="window.pwned=1">');
  });

  it('prefers the stored version', async () => {
    const { wrapper, respond } = mountWith({ xray_version: '0.70.1' });
    await respond('9.9.9');
    expect(label(wrapper)).toBe('XRAYUI v0.70.1');
  });
});
