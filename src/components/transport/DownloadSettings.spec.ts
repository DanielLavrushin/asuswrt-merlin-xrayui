import { mount } from '@vue/test-utils';
import { defineComponent, reactive } from 'vue';
import DownloadSettings from './DownloadSettings.vue';
import Http from './Http.vue';
import { XrayStreamSettingsObject } from '@/modules/CommonObjects';
import { XrayStreamHttpSettingsObject, createXhttpDownloadSettings } from '@/modules/TransportObjects';

const modal = defineComponent({ template: '<div><slot /></div>', setup: () => ({ show: jest.fn() }) });
const options = { mocks: { $t: (key: string) => key }, stubs: { Modal: modal, Hint: true, Sockopt: true } };
const rowInput = (wrapper: ReturnType<typeof mount>, label: string, selector = 'input') =>
  wrapper.findAll('tr').find((row) => row.find('th').exists() && row.find('th').text().startsWith(label))!.find(selector);

describe('download XHTTP editor', () => {
  it('exposes every padding setting and serializes edits for the download transport', async () => {
    const upload = new XrayStreamHttpSettingsObject();
    const download = reactive(createXhttpDownloadSettings(upload));
    download.address = 'down.example.com';
    const wrapper = mount(DownloadSettings, { props: { downloadSettings: download }, global: options });

    await rowInput(wrapper, 'com.Xhttp.label_xPaddingObfsMode').setValue(true);
    await rowInput(wrapper, 'com.Xhttp.label_xPaddingPlacement', 'select').setValue('header');
    await rowInput(wrapper, 'com.Xhttp.label_xPaddingMethod', 'select').setValue('tokenish');
    await rowInput(wrapper, 'com.Xhttp.label_xPaddingKey').setValue('download-pad');
    await rowInput(wrapper, 'com.Xhttp.label_xPaddingHeader').setValue('X-Download-Padding');
    await rowInput(wrapper, 'Header-padding bytes (range)').setValue('128-256');
    await rowInput(wrapper, 'com.DownloadSettings.label_port').setValue('');

    const saved = JSON.parse(JSON.stringify(download.normalize()));
    expect(saved.port).toBe(443);
    expect(saved.xhttpSettings.extra).toMatchObject({
      xPaddingObfsMode: true, xPaddingPlacement: 'header', xPaddingMethod: 'tokenish',
      xPaddingKey: 'download-pad', xPaddingHeader: 'X-Download-Padding', xPaddingBytes: '128-256'
    });
    expect(upload.extra!.xPaddingObfsMode).toBe(false);
    wrapper.unmount();
  });

  it('seeds a new download from the upload and preserves it when reopening the editor', async () => {
    const transport = reactive(new XrayStreamSettingsObject());
    transport.network = 'xhttp';
    transport.xhttpSettings = new XrayStreamHttpSettingsObject();
    transport.xhttpSettings.path = '/split/';
    transport.xhttpSettings.extra!.xPaddingObfsMode = true;
    transport.xhttpSettings.extra!.xPaddingKey = 'shared-pad';
    transport.xhttpSettings.extra!.xPaddingBytes = '128-256';
    const wrapper = mount(Http, { props: { transport, proxyType: 'outbound' }, global: options });

    await wrapper.findAll('tr').find((row) => row.text().includes('com.DownloadSettings.label_uplink_downlink'))!
      .find('input[type="button"]').trigger('click');
    const download = transport.xhttpSettings.extra!.downloadSettings!;
    expect(download.xhttpSettings).toMatchObject({ path: '/split/', extra: { xPaddingObfsMode: true, xPaddingKey: 'shared-pad' } });
    expect(download.xhttpSettings!.extra!.xPaddingBytes).toBe('128-256');
    download.xhttpSettings!.path = '/rewritten/';
    download.xhttpSettings!.extra!.xPaddingKey = 'independent';

    await wrapper.findAll('tr').find((row) => row.text().includes('com.DownloadSettings.label_uplink_downlink'))!
      .find('input[type="button"]').trigger('click');
    expect(transport.xhttpSettings.extra!.downloadSettings).toBe(download);
    expect(download.xhttpSettings).toMatchObject({ path: '/rewritten/', extra: { xPaddingKey: 'independent' } });
    wrapper.unmount();
  });
});


describe('canonical XHTTP editor', () => {
  it('saves uplink, session and range edits in extra', async () => {
    const transport = reactive(new XrayStreamSettingsObject());
    transport.network = 'xhttp';
    transport.xhttpSettings = new XrayStreamHttpSettingsObject();
    const wrapper = mount(Http, { props: { transport, proxyType: 'outbound' }, global: options });
    await rowInput(wrapper, 'Transfer Mode', 'select').setValue('packet-up');
    await rowInput(wrapper, 'com.Xhttp.label_uplinkHTTPMethod', 'select').setValue('GET');
    await rowInput(wrapper, 'com.Xhttp.label_sessionPlacement', 'select').setValue('header');
    await rowInput(wrapper, 'com.Xhttp.label_sessionKey').setValue('sid');
    await rowInput(wrapper, 'com.Xhttp.label_uplinkDataPlacement', 'select').setValue('header');
    await rowInput(wrapper, 'com.Xhttp.label_uplinkChunkSize').setValue('128-256');
    await rowInput(wrapper, 'Max POST size (bytes)').setValue('1000-2000');
    expect(JSON.parse(JSON.stringify(transport.xhttpSettings.normalize()))).toEqual({
      mode: 'packet-up', extra: { uplinkHTTPMethod: 'GET', sessionIDPlacement: 'header', sessionIDKey: 'sid',
        uplinkDataPlacement: 'header', uplinkChunkSize: '128-256', scMaxEachPostBytes: '1000-2000' }
    });
    wrapper.unmount();
  });
});
