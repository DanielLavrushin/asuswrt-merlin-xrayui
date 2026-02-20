import { shallowMount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import Tls from '@/components/security/Tls.vue';
import { XrayStreamSettingsObject, XrayStreamTlsSettingsObject } from '@/modules/CommonObjects';

jest.mock('@/modules/Engine', () => {
  const original = jest.requireActual('@/modules/Engine');
  return {
    __esModule: true,
    default: {
      ...original.default,
      submit: jest.fn().mockResolvedValue(undefined),
      getSslCertificates: jest.fn().mockResolvedValue({ certificateFile: 'cert.pem', keyFile: 'key.pem' }),
      getEchKeys: jest.fn().mockResolvedValue({ configList: 'AF3+DQBZ', serverKeys: 'ACB2QeOw' })
    },
    SubmitActions: original.SubmitActions
  };
});
import engine, { SubmitActions } from '@/modules/Engine';

describe('Tls.vue', () => {
  beforeAll(() => {
    window.showLoading = jest.fn();
    window.hideLoading = jest.fn();
  });

  const CertificatesModalStub = defineComponent({
    name: 'CertificatesModal',
    props: { certificates: Array },
    setup(_, { expose }) {
      expose({ show: jest.fn(), close: jest.fn() });
      return () => h('div');
    }
  });

  function mountComponent(proxyType: string, transport?: XrayStreamSettingsObject) {
    const t = transport ?? new XrayStreamSettingsObject();
    t.tlsSettings = t.tlsSettings ?? new XrayStreamTlsSettingsObject();
    return shallowMount(Tls, {
      props: { proxyType, transport: t },
      global: {
        stubs: {
          hint: true,
          'certificates-modal': CertificatesModalStub
        },
        mocks: {
          $t: (key: string) => key
        }
      }
    });
  }

  describe('outbound mode', () => {
    it('renders outbound-only fields', () => {
      const wrapper = mountComponent('outbound');
      expect(wrapper.text()).toContain('com.Tls.label_server_name');
      expect(wrapper.text()).toContain('com.Tls.label_allow_insecure');
      expect(wrapper.text()).toContain('com.Tls.label_session_resumption');
      expect(wrapper.text()).toContain('com.Tls.label_fingerprint');
      expect(wrapper.text()).toContain('com.Tls.label_pinned_peer_certificate');
      expect(wrapper.text()).toContain('com.Tls.label_ech_config_list');
    });

    it('does not render inbound-only fields', () => {
      const wrapper = mountComponent('outbound');
      expect(wrapper.text()).not.toContain('com.Tls.label_reject_unknown_sni');
      expect(wrapper.text()).not.toContain('com.Tls.label_certificate');
      expect(wrapper.text()).not.toContain('com.Tls.label_ech_server_keys');
    });

    it('renders common fields', () => {
      const wrapper = mountComponent('outbound');
      expect(wrapper.text()).toContain('com.Tls.label_dont_use_ca');
      expect(wrapper.text()).toContain('com.Tls.label_alpn');
      expect(wrapper.text()).toContain('com.Tls.label_tls_version');
    });
  });

  describe('inbound mode', () => {
    it('renders inbound-only fields', () => {
      const wrapper = mountComponent('inbound');
      expect(wrapper.text()).toContain('com.Tls.label_reject_unknown_sni');
      expect(wrapper.text()).toContain('com.Tls.label_certificate');
      expect(wrapper.text()).toContain('com.Tls.label_ech_server_keys');
    });

    it('does not render outbound-only fields', () => {
      const wrapper = mountComponent('inbound');
      expect(wrapper.text()).not.toContain('com.Tls.label_server_name');
      expect(wrapper.text()).not.toContain('com.Tls.label_allow_insecure');
      expect(wrapper.text()).not.toContain('com.Tls.label_session_resumption');
      expect(wrapper.text()).not.toContain('com.Tls.label_fingerprint');
      expect(wrapper.text()).not.toContain('com.Tls.label_pinned_peer_certificate');
      expect(wrapper.text()).not.toContain('com.Tls.label_ech_config_list');
      expect(wrapper.text()).not.toContain('com.Tls.label_ech_force_query');
    });
  });

  describe('ECH Config List (outbound)', () => {
    it('binds echConfigList input to tlsSettings', async () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      const wrapper = mountComponent('outbound', transport);

      const input = wrapper.find('input[placeholder="udp://1.1.1.1 or base64 ECHConfig"]');
      expect(input.exists()).toBe(true);

      await input.setValue('udp://1.1.1.1');
      expect(transport.tlsSettings!.echConfigList).toBe('udp://1.1.1.1');
    });

    it('shows existing echConfigList value', () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.echConfigList = 'https://1.1.1.1/dns-query';
      const wrapper = mountComponent('outbound', transport);

      const input = wrapper.find('input[placeholder="udp://1.1.1.1 or base64 ECHConfig"]');
      expect((input.element as HTMLInputElement).value).toBe('https://1.1.1.1/dns-query');
    });
  });

  describe('ECH Force Query (outbound, conditional)', () => {
    it('hides echForceQuery when echConfigList is empty', () => {
      const wrapper = mountComponent('outbound');
      expect(wrapper.text()).not.toContain('com.Tls.label_ech_force_query');
    });

    it('hides echForceQuery when echConfigList is a fixed base64 string', async () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.echConfigList = 'AF7+DQBaAAAgACA51i3Ssu4wUMV4FNCc8iRX5J';
      const wrapper = mountComponent('outbound', transport);
      await nextTick();

      expect(wrapper.text()).not.toContain('com.Tls.label_ech_force_query');
    });

    it('shows echForceQuery when echConfigList contains :// (DNS query)', async () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.echConfigList = 'udp://1.1.1.1';
      const wrapper = mountComponent('outbound', transport);
      await nextTick();

      expect(wrapper.text()).toContain('com.Tls.label_ech_force_query');
    });

    it('shows echForceQuery for https DNS format', async () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.echConfigList = 'example.com+https://1.1.1.1/dns-query';
      const wrapper = mountComponent('outbound', transport);
      await nextTick();

      expect(wrapper.text()).toContain('com.Tls.label_ech_force_query');
    });

    it('renders all 3 force query options', async () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.echConfigList = 'udp://1.1.1.1';
      const wrapper = mountComponent('outbound', transport);
      await nextTick();

      const options = wrapper.findAll('select.input_option option');
      const forceQuerySelect = wrapper.findAll('select.input_option').filter((s) => {
        const opts = s.findAll('option');
        return opts.some((o) => o.text().trim() === 'half');
      });
      expect(forceQuerySelect).toHaveLength(1);

      const opts = forceQuerySelect[0].findAll('option');
      expect(opts.map((o) => o.text().trim())).toEqual(['none', 'half', 'full']);
    });
  });

  describe('ECH Server Keys (inbound)', () => {
    it('renders echServerKeys input and generate button for inbound', () => {
      const wrapper = mountComponent('inbound');
      expect(wrapper.text()).toContain('com.Tls.label_ech_server_keys');
      const serverNameInput = wrapper.find('input.input_12_table[placeholder="example.com"]');
      expect(serverNameInput.exists()).toBe(true);
      const genBtn = wrapper.find('.button_gen_small');
      expect(genBtn.exists()).toBe(true);
    });

    it('binds echServerKeys to tlsSettings', async () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      const wrapper = mountComponent('inbound', transport);

      const input = wrapper.find('input.input_30_table');
      await input.setValue('my-server-key-value');
      expect(wrapper.vm.transport.tlsSettings!.echServerKeys).toBe('my-server-key-value');
    });

    it('does not render echServerKeys for outbound', () => {
      const wrapper = mountComponent('outbound');
      expect(wrapper.text()).not.toContain('com.Tls.label_ech_server_keys');
    });

    it('generates ECH keys via backend', async () => {
      jest.clearAllMocks();
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      const wrapper = mountComponent('inbound', transport);

      wrapper.vm.echServerName = 'google.com';
      await nextTick();

      await wrapper.vm.generate_ech_keys();

      expect(engine.submit).toHaveBeenCalledWith(SubmitActions.generateEchKeys, { serverName: 'google.com' }, 1000);
      expect(engine.getEchKeys).toHaveBeenCalled();
      expect(wrapper.vm.transport.tlsSettings!.echServerKeys).toBe('ACB2QeOw');
      expect(wrapper.vm.generatedEchConfigList).toBe('AF3+DQBZ');
    });

    it('does not call submit when echServerName is empty', async () => {
      jest.clearAllMocks();
      const wrapper = mountComponent('inbound');
      await wrapper.vm.generate_ech_keys();
      expect(engine.submit).not.toHaveBeenCalled();
    });
  });

  describe('TLS version watchers', () => {
    it('adjusts maxVersion when minVersion exceeds it', async () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.minVersion = '1.0';
      transport.tlsSettings.maxVersion = '1.2';
      const wrapper = mountComponent('outbound', transport);

      const tls = wrapper.vm.transport.tlsSettings!;
      tls.minVersion = '1.3';
      await nextTick();

      expect(tls.maxVersion).toBe('1.3');
    });

    it('adjusts minVersion when maxVersion is below it', async () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.minVersion = '1.2';
      transport.tlsSettings.maxVersion = '1.3';
      const wrapper = mountComponent('outbound', transport);

      const tls = wrapper.vm.transport.tlsSettings!;
      tls.maxVersion = '1.0';
      await nextTick();

      expect(tls.minVersion).toBe('1.0');
    });
  });

  describe('pinned certificates', () => {
    it('splits textarea into array', async () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      const wrapper = mountComponent('outbound', transport);

      const textarea = wrapper.find('textarea');
      expect(textarea.exists()).toBe(true);

      await textarea.setValue('abc123\ndef456');
      expect(transport.tlsSettings!.pinnedPeerCertificateSha256).toEqual(['ABC123', 'DEF456']);
    });

    it('shows existing pinned certificates joined by newlines', () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.pinnedPeerCertificateSha256 = ['AABB', 'CCDD'];
      const wrapper = mountComponent('outbound', transport);

      const textarea = wrapper.find('textarea');
      expect((textarea.element as HTMLTextAreaElement).value).toBe('AABB\nCCDD');
    });
  });
});
