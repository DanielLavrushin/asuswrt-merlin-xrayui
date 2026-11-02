import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import StreamSettingsModal from './StreamSettingsModal.vue';
import { XraySockoptObject } from '@/modules/CommonObjects';
import { XrayStreamHttpSettingsObject, XrayDownloadSettingsObject } from '@/modules/TransportObjects';

jest.mock('@modules/XrayConfig', () => ({ __esModule: true, default: { outbounds: [] } }));
jest.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const close = jest.fn();
const ModalStub = defineComponent({
  name: 'Modal',
  setup: () => ({ show: jest.fn(), close }),
  template: '<div><slot /><slot name="footer" /></div>'
});

const mountModal = () =>
  mount(StreamSettingsModal, {
    global: { mocks: { $t: (key: string) => key }, stubs: { modal: ModalStub, Modal: ModalStub, hint: true, sockopt: true } }
  });

describe('StreamSettingsModal.vue', () => {
  let alertSpy: jest.SpyInstance;
  beforeEach(() => {
    close.mockClear();
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
  });
  afterEach(() => alertSpy.mockRestore());

  const save = (wrapper: ReturnType<typeof mountModal>) => (wrapper.vm as unknown as { save: () => void }).save();

  it('refuses to save a TCP keepalive above the Linux limit', () => {
    const wrapper = mountModal();
    const vm = wrapper.vm as unknown as { transport: { sockopt?: XraySockoptObject } };
    vm.transport.sockopt = Object.assign(new XraySockoptObject(), { tcpKeepAliveIdle: 86400 });

    save(wrapper);

    expect(alertSpy).toHaveBeenCalledWith('com.SockOpt.alert_keepalive_range');
    expect(wrapper.emitted('save')).toBeUndefined();
    expect(close).not.toHaveBeenCalled();
  });

  const withDownloadKeepAlive = (wrapper: ReturnType<typeof mountModal>, network: string) => {
    const vm = wrapper.vm as unknown as { transport: { network?: string; xhttpSettings?: XrayStreamHttpSettingsObject } };
    const xhttp = new XrayStreamHttpSettingsObject();
    xhttp.extra!.downloadSettings = new XrayDownloadSettingsObject();
    xhttp.extra!.downloadSettings.sockopt = Object.assign(new XraySockoptObject(), { tcpKeepAliveInterval: 40000 });
    vm.transport.xhttpSettings = xhttp;
    vm.transport.network = network;
  };

  it('checks the XHTTP download sockopt too', () => {
    const wrapper = mountModal();
    withDownloadKeepAlive(wrapper, 'xhttp');

    save(wrapper);

    expect(alertSpy).toHaveBeenCalled();
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('ignores a leftover XHTTP download sockopt once another network is selected', () => {
    const wrapper = mountModal();
    withDownloadKeepAlive(wrapper, 'tcp');

    save(wrapper);

    expect(alertSpy).not.toHaveBeenCalled();
    expect(wrapper.emitted('save')).toHaveLength(1);
  });

  it('saves keepalive values within the limit', () => {
    const wrapper = mountModal();
    const vm = wrapper.vm as unknown as { transport: { sockopt?: XraySockoptObject } };
    vm.transport.sockopt = Object.assign(new XraySockoptObject(), { tcpKeepAliveIdle: 32767, tcpKeepAliveInterval: 30 });

    save(wrapper);

    expect(alertSpy).not.toHaveBeenCalled();
    expect(wrapper.emitted('save')).toHaveLength(1);
    expect(close).toHaveBeenCalled();
  });
});
