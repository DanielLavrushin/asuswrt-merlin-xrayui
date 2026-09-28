import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Kcp from './Kcp.vue';
import { XrayStreamSettingsObject } from '@/modules/CommonObjects';
import { XrayStreamKcpSettingsObject } from '@/modules/TransportObjects';
import { setCoreVersion } from '@/modules/CoreVersion';

const mountKcp = () => {
  const transport = new XrayStreamSettingsObject();
  transport.network = 'kcp';
  transport.kcpSettings = new XrayStreamKcpSettingsObject();
  const wrapper = mount(Kcp, {
    props: { transport },
    global: { mocks: { $t: (key: string) => key }, stubs: { hint: true } }
  });
  return { wrapper, transport };
};

const rowInput = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper.findAll('tr').find((row) => row.find('th').text().includes(label))?.find('input');

describe('Kcp.vue', () => {
  afterEach(() => setCoreVersion('0.0.0'));

  it('shows congestion and buffer sizes but not the cwnd fields below 26.4.13', () => {
    setCoreVersion('26.3.27');
    const { wrapper } = mountKcp();
    const text = wrapper.text();

    expect(text).toContain('com.Kcp.label_congestion');
    expect(text).toContain('com.Kcp.label_read_buffer');
    expect(text).toContain('com.Kcp.label_write_buffer');
    expect(text).not.toContain('com.Kcp.label_cwnd_multiplier');
    expect(text).not.toContain('com.Kcp.label_max_sending_window');
  });

  it('shows the cwnd fields instead of congestion and buffer sizes from 26.4.13', () => {
    setCoreVersion('26.4.13');
    const { wrapper } = mountKcp();
    const text = wrapper.text();

    expect(text).not.toContain('com.Kcp.label_congestion');
    expect(text).not.toContain('com.Kcp.label_read_buffer');
    expect(text).not.toContain('com.Kcp.label_write_buffer');
    expect(text).toContain('com.Kcp.label_cwnd_multiplier');
    expect(text).toContain('com.Kcp.label_max_sending_window');
  });

  it('switches the rows when the core version arrives after mounting', async () => {
    const { wrapper } = mountKcp();
    expect(wrapper.text()).toContain('com.Kcp.label_cwnd_multiplier');

    setCoreVersion('26.3.27');
    await nextTick();

    expect(wrapper.text()).not.toContain('com.Kcp.label_cwnd_multiplier');
    expect(wrapper.text()).toContain('com.Kcp.label_congestion');
  });

  it('writes typed cwnd values into the settings as numbers', async () => {
    setCoreVersion('26.7.28');
    const { wrapper, transport } = mountKcp();

    await rowInput(wrapper, 'com.Kcp.label_cwnd_multiplier')!.setValue('3');
    await rowInput(wrapper, 'com.Kcp.label_max_sending_window')!.setValue('4194304');

    expect(transport.kcpSettings!.cwndMultiplier).toBe(3);
    expect(transport.kcpSettings!.maxSendingWindow).toBe(4194304);
  });

  it('leaves a cleared field out of the saved settings', async () => {
    setCoreVersion('26.7.28');
    const { wrapper, transport } = mountKcp();

    await rowInput(wrapper, 'com.Kcp.label_mtu')!.setValue('');
    await rowInput(wrapper, 'com.Kcp.label_uplink_capacity')!.setValue('12');
    transport.normalize();

    expect(JSON.parse(JSON.stringify(transport.kcpSettings))).toEqual({ uplinkCapacity: 12 });
  });
});
