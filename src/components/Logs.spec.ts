jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('@/modules/Engine', () => {
  const actual = jest.requireActual('@/modules/Engine');
  return {
    ...actual,
    __esModule: true,
    default: { submit: jest.fn().mockResolvedValue(undefined), openText: jest.fn() }
  };
});

import axios from 'axios';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import Logs from '@main/Logs.vue';
import engine from '@/modules/Engine';

const ModalStub = defineComponent({
  name: 'Modal',
  setup(_, { slots, expose }) {
    expose({ show: () => undefined, close: () => undefined });
    return () => h('div', [slots.default?.(), slots.footer?.()]);
  }
});

describe('Logs.vue', () => {
  const get = axios.get as jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    get.mockReset();
    (engine.openText as jest.Mock).mockReset();
    (window as any).xray = { router: { devices_online: {} } };
  });
  afterEach(() => jest.useRealTimers());

  const open = async () => {
    const wrapper = mount(Logs, {
      props: { logs: { access: '/opt/share/xrayui/logs/xray_access.log', error: '/opt/share/xrayui/logs/xray_error.log' } as any },
      global: { stubs: { modal: ModalStub }, mocks: { $t: (key: string) => key } }
    });
    await wrapper.find('.actions input[type="button"]').trigger('click');
    await flushPromises();
    jest.advanceTimersByTime(2000);
    await flushPromises();
    return wrapper;
  };

  it('reads the log excerpts from their login-protected raw names as text', async () => {
    get.mockResolvedValue({ data: 'line' });
    const wrapper = await open();

    expect(get).toHaveBeenCalledWith('/ext/xrayui/xray_access_partial.cab', { responseType: 'text', headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } });
    await wrapper.find('select').setValue('/ext/xrayui/xray_error_partial.cab');
    jest.advanceTimersByTime(2000);
    await flushPromises();
    expect(get).toHaveBeenLastCalledWith('/ext/xrayui/xray_error_partial.cab', expect.anything());
  });

  it('opens the shown log as plain text and never the other file', async () => {
    get.mockResolvedValueOnce({ data: 'access line' });
    const wrapper = await open();

    await wrapper.find('input[value="raw"]').trigger('click');
    expect(engine.openText).toHaveBeenLastCalledWith('access line');

    get.mockResolvedValueOnce({ data: '' });
    await wrapper.find('select').setValue('/ext/xrayui/xray_error_partial.cab');
    await wrapper.find('input[value="raw"]').trigger('click');
    expect(engine.openText).toHaveBeenLastCalledWith('');
  });

  it('keeps the viewer working when a refresh fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    get.mockRejectedValue(new Error('offline'));
    const wrapper = await open();

    expect(wrapper.find('input[value="raw"]').exists()).toBe(true);
  });
});
