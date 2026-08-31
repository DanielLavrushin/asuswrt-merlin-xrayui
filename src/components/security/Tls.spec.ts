import { shallowMount } from '@vue/test-utils';
import { SetupContext, h, nextTick } from 'vue';
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
      getEchKeys: jest.fn().mockResolvedValue({ configList: 'AF3+DQBZ', serverKeys: 'ACB2QeOw' }),
      getTlsPing: jest.fn().mockResolvedValue(undefined),
      delay: jest.fn().mockResolvedValue(undefined),
      executeWithLoadingProgress: jest.fn(async (action: () => Promise<void>) => {
        await action();
      })
    },
    SubmitActions: original.SubmitActions
  };
});
import engine, { SubmitActions } from '@/modules/Engine';
import { setCoreVersion } from '@/modules/CoreVersion';

describe('Tls.vue', () => {
  beforeAll(() => {
    window.showLoading = jest.fn();
    window.hideLoading = jest.fn();
  });

  const modalStub = (name: string) => ({
    name,
    props: { certificates: { type: Array, default: () => [] } },
    setup(_: unknown, ctx: SetupContext) {
      ctx.expose({ show: jest.fn(), close: jest.fn() });
      return () => h('div', [ctx.slots.default?.(), ctx.slots.footer?.()]);
    }
  });

  const CertificatesModalStub = modalStub('CertificatesModal');
  const ModalStub = modalStub('Modal');

  function mountComponent(proxyType: string, transport?: XrayStreamSettingsObject, extraProps: Record<string, unknown> = {}) {
    const t = transport ?? new XrayStreamSettingsObject();
    t.tlsSettings = t.tlsSettings ?? new XrayStreamTlsSettingsObject();
    return shallowMount(Tls, {
      props: { proxyType, transport: t, ...extraProps },
      global: {
        stubs: {
          hint: true,
          'certificates-modal': CertificatesModalStub,
          modal: ModalStub
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

      const input = wrapper.find('textarea[placeholder="udp://1.1.1.1 or base64 ECHConfig"]');
      expect(input.exists()).toBe(true);

      await input.setValue('udp://1.1.1.1');
      expect(transport.tlsSettings!.echConfigList).toBe('udp://1.1.1.1');
    });

    it('shows existing echConfigList value', () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.echConfigList = 'https://1.1.1.1/dns-query';
      const wrapper = mountComponent('outbound', transport);

      const input = wrapper.find('textarea[placeholder="udp://1.1.1.1 or base64 ECHConfig"]');
      expect((input.element as HTMLTextAreaElement).value).toBe('https://1.1.1.1/dns-query');
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
      const serverNameInput = wrapper.find('input.input_20_table[placeholder="example.com"]');
      expect(serverNameInput.exists()).toBe(true);
      const genBtn = wrapper.find('.button_gen_small');
      expect(genBtn.exists()).toBe(true);
    });

    it('binds echServerKeys to tlsSettings', async () => {
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      const wrapper = mountComponent('inbound', transport);

      const input = wrapper.find('.textarea-wrapper textarea');
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

  describe('fetch fingerprints from server', () => {
    const leaf = { type: 'leaf' as const, name: 'example.com', sha256: 'A'.repeat(64) };
    const ca = { type: 'ca' as const, name: 'Example CA', sha256: 'B'.repeat(64) };

    afterEach(() => {
      setCoreVersion('0.0.0');
    });

    interface TlsPingVm {
      fetch_fingerprints: () => Promise<void>;
      apply_fingerprints: () => void;
      tlsPingSelection: string[];
      caPinAllowed: boolean;
    }

    const vmOf = (wrapper: ReturnType<typeof mountComponent>) => wrapper.vm as unknown as TlsPingVm;

    const findFetchButton = (wrapper: ReturnType<typeof mountComponent>) =>
      wrapper.find('input[type="button"][value="com.Tls.label_fetch_fingerprints"]');

    it('hides the fetch button on cores that cannot report certificate hashes', () => {
      setCoreVersion('26.1.31');
      expect(findFetchButton(mountComponent('outbound')).exists()).toBe(false);
    });

    it('shows the fetch button on supported cores', () => {
      setCoreVersion('26.2.4');
      expect(findFetchButton(mountComponent('outbound')).exists()).toBe(true);
    });

    it('disables the fetch button without a server name or address', () => {
      setCoreVersion('26.6.1');
      const wrapper = mountComponent('outbound');
      expect((findFetchButton(wrapper).element as HTMLInputElement).disabled).toBe(true);
    });

    it('probes the server and preselects the leaf certificate', async () => {
      setCoreVersion('26.6.1');
      (engine.getTlsPing as jest.Mock).mockResolvedValueOnce({
        target: 'example.com:8443',
        ip: '1.2.3.4:8443',
        mode: 'sni',
        error: '',
        certificates: [leaf, ca]
      });

      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.serverName = 'example.com';
      const wrapper = mountComponent('outbound', transport, { serverAddress: '1.2.3.4', serverPort: 8443 });

      await vmOf(wrapper).fetch_fingerprints();

      expect(engine.submit).toHaveBeenCalledWith(SubmitActions.tlsPingFetch, { serverName: 'example.com', address: '1.2.3.4', port: 8443 });
      expect(vmOf(wrapper).tlsPingSelection).toEqual([leaf.sha256]);
    });

    it('falls back to port 443 when the outbound has no port', async () => {
      setCoreVersion('26.6.1');
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.serverName = 'example.com';
      const wrapper = mountComponent('outbound', transport);

      await vmOf(wrapper).fetch_fingerprints();

      expect(engine.submit).toHaveBeenCalledWith(SubmitActions.tlsPingFetch, { serverName: 'example.com', address: '', port: 443 });
    });

    it('appends the selected hashes without duplicating existing ones', async () => {
      setCoreVersion('26.6.1');
      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.pinnedPeerCertificateSha256 = [leaf.sha256];
      const wrapper = mountComponent('outbound', transport);

      vmOf(wrapper).tlsPingSelection = [leaf.sha256, ca.sha256];
      vmOf(wrapper).apply_fingerprints();
      await nextTick();

      expect(transport.tlsSettings!.pinnedPeerCertificateSha256).toEqual([leaf.sha256, ca.sha256]);
    });

    it('disables CA rows and drops CA preselection when no server name is set', async () => {
      setCoreVersion('26.6.1');
      (engine.getTlsPing as jest.Mock).mockResolvedValueOnce({
        target: '1.2.3.4:443',
        ip: '1.2.3.4:443',
        mode: 'nosni',
        error: '',
        certificates: [leaf, ca]
      });

      const wrapper = mountComponent('outbound', undefined, { serverAddress: '1.2.3.4', serverPort: 443 });
      await vmOf(wrapper).fetch_fingerprints();

      expect(vmOf(wrapper).tlsPingSelection).toEqual([leaf.sha256]);
      expect(vmOf(wrapper).caPinAllowed).toBe(false);
    });

    it('allows CA rows once a server name is set', async () => {
      setCoreVersion('26.6.1');
      (engine.getTlsPing as jest.Mock).mockResolvedValueOnce({
        target: 'example.com:443',
        ip: '1.2.3.4:443',
        mode: 'sni',
        error: '',
        certificates: [leaf, ca]
      });

      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.serverName = 'example.com';
      transport.tlsSettings.pinnedPeerCertificateSha256 = [ca.sha256];
      const wrapper = mountComponent('outbound', transport);

      await vmOf(wrapper).fetch_fingerprints();

      expect(vmOf(wrapper).caPinAllowed).toBe(true);
      expect(vmOf(wrapper).tlsPingSelection.sort()).toEqual([leaf.sha256, ca.sha256].sort());
    });

    it('rides out a transient read failure and still hides the overlay', async () => {
      setCoreVersion('26.6.1');
      (engine.getTlsPing as jest.Mock)
        .mockRejectedValueOnce(new Error('truncated json'))
        .mockResolvedValueOnce({
          target: 'example.com:443',
          ip: '',
          mode: 'sni',
          error: '',
          certificates: [leaf]
        });

      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.serverName = 'example.com';
      const wrapper = mountComponent('outbound', transport);

      await expect(vmOf(wrapper).fetch_fingerprints()).resolves.toBeUndefined();

      expect(vmOf(wrapper).tlsPingSelection).toEqual([leaf.sha256]);
      expect(window.hideLoading).toHaveBeenCalled();
    });

    it('blames the server name when the SNI handshake failed with one set', async () => {
      setCoreVersion('26.6.1');
      (engine.getTlsPing as jest.Mock).mockResolvedValueOnce({
        target: 'example.com:443',
        ip: '1.2.3.4:443',
        mode: 'nosni',
        error: '',
        sniError: 'remote error: tls: unrecognized name',
        certificates: [leaf]
      });

      const transport = new XrayStreamSettingsObject();
      transport.tlsSettings = new XrayStreamTlsSettingsObject();
      transport.tlsSettings.serverName = 'example.com';
      const wrapper = mountComponent('outbound', transport);

      await vmOf(wrapper).fetch_fingerprints();
      await nextTick();

      expect(wrapper.text()).toContain('com.Tls.hint_fetch_sni_failed');
      expect(wrapper.text()).not.toContain('com.Tls.hint_fetch_nosni');
      expect(wrapper.text()).toContain('remote error: tls: unrecognized name');
    });

    it('tells the user to set a server name when none is configured', async () => {
      setCoreVersion('26.6.1');
      (engine.getTlsPing as jest.Mock).mockResolvedValueOnce({
        target: '1.2.3.4:443',
        ip: '1.2.3.4:443',
        mode: 'nosni',
        error: '',
        sniError: '',
        certificates: [leaf]
      });

      const wrapper = mountComponent('outbound', undefined, { serverAddress: '1.2.3.4', serverPort: 443 });
      await vmOf(wrapper).fetch_fingerprints();
      await nextTick();

      expect(wrapper.text()).toContain('com.Tls.hint_fetch_nosni');
      expect(wrapper.text()).not.toContain('com.Tls.hint_fetch_sni_failed');
    });
  });
});
