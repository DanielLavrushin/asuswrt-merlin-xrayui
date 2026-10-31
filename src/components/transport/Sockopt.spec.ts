import { mount } from '@vue/test-utils';
import Sockopt from './Sockopt.vue';
import { XrayStreamSettingsObject } from '@/modules/CommonObjects';

jest.mock('@modules/XrayConfig', () => ({ __esModule: true, default: { outbounds: [] } }));

const mountSockopt = (proxyType: string) => {
  const transport = new XrayStreamSettingsObject();
  const wrapper = mount(Sockopt, {
    props: { transport, proxyType },
    global: { mocks: { $t: (key: string) => key }, stubs: { hint: true } }
  });
  return { wrapper, transport };
};

const row = (wrapper: ReturnType<typeof mount>, label: string) => wrapper.findAll('tr').find((r) => r.find('th').exists() && r.find('th').text().includes(label))!;

describe('Sockopt.vue', () => {
  it('writes the TCP keepalive values into the transport as numbers', async () => {
    const { wrapper, transport } = mountSockopt('inbound');

    await row(wrapper, 'com.SockOpt.label_tcp_keepalive_idle').find('input').setValue('300');
    await row(wrapper, 'com.SockOpt.label_tcp_keepalive_interval').find('input').setValue('30');

    expect(transport.sockopt!.tcpKeepAliveIdle).toBe(300);
    expect(transport.sockopt!.tcpKeepAliveInterval).toBe(30);
  });

  it('leaves cleared keepalive fields out of the saved settings', async () => {
    const { wrapper, transport } = mountSockopt('inbound');

    await row(wrapper, 'com.SockOpt.label_tcp_keepalive_idle').find('input').setValue('300');
    await row(wrapper, 'com.SockOpt.label_tcp_keepalive_idle').find('input').setValue('');
    await row(wrapper, 'com.SockOpt.label_tcp_keepalive_interval').find('input').setValue('0');

    expect(transport.sockopt!.normalize()).toBeUndefined();
  });

  it('says keepalive is off by default on an inbound and does not offer negative values', () => {
    const { wrapper } = mountSockopt('inbound');
    const idle = row(wrapper, 'com.SockOpt.label_tcp_keepalive_idle');

    expect(idle.text()).toContain('default: off');
    expect(idle.find('input').attributes('min')).toBe('0');
  });

  it('shows the 45 s outbound default and allows -1 to turn it off', () => {
    const { wrapper } = mountSockopt('outbound');
    const interval = row(wrapper, 'com.SockOpt.label_tcp_keepalive_interval');

    expect(interval.text()).toContain('default: 45 s, -1 = off');
    expect(interval.find('input').attributes('min')).toBe('-1');
  });
});
