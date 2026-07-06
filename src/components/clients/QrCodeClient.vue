<template>
  <button @click.prevent="showQrCode" class="button_gen button_gen_small">QR</button>
  <modal ref="modalQr" title="QR Code">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 15px">
      <qrcode-vue :value="link" :size="350" level="H" render-as="svg" />
      <table class="FormTable" style="width: 100%; margin-top: 10px">
        <tbody>
          <tr>
            <th>Server Address</th>
            <td style="text-align: left">
              <input v-model="customAddress" type="text" class="input_20_table" />
            </td>
          </tr>
          <tr>
            <th>Connection Name</th>
            <td style="text-align: left">
              <input v-model="customName" type="text" class="input_20_table" />
            </td>
          </tr>
          <tr>
            <th>URL</th>
            <td style="text-align: left">
              <div class="textarea-wrapper">
                <textarea ref="urlTextarea" v-model="link" readonly rows="25" @focus="selectUrl"></textarea>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref, computed } from 'vue';
  import Modal from '@main/Modal.vue';
  import QrcodeVue from 'qrcode.vue';
  import { XrayStreamRealitySettingsObject, XrayStreamTlsSettingsObject } from '@/modules/CommonObjects';
  import XrayOptions from '@/modules/Options';

  interface Client {
    id?: string;
    flow?: string;
    // Shadowsocks specific
    password?: string;
    method?: string;
    email?: string;
    // Hysteria specific
    auth?: string;
  }

  interface Proxy {
    protocol: string;
    port: number | string;
    tag?: string;
    settings?: {
      method?: string;
      password?: string;
    };
    streamSettings?: {
      network?: string;
      security?: string;
      realitySettings?: XrayStreamRealitySettingsObject;
      tlsSettings?: XrayStreamTlsSettingsObject;
      finalmask?: {
        udp?: Array<{
          type?: string;
          settings?: { password?: string };
        }>;
      };
    };
  }

  export default defineComponent({
    name: 'Qr',
    components: {
      Modal,
      QrcodeVue
    },
    props: {
      client: {
        type: Object as () => Client,
        required: true
      },
      proxy: {
        type: Object as () => Proxy,
        required: true
      }
    },
    setup(props) {
      const modalQr = ref<InstanceType<typeof Modal> | null>(null);
      const urlTextarea = ref<HTMLTextAreaElement | null>(null);
      const customAddress = ref('');
      const customName = ref('');

      const selectUrl = () => {
        urlTextarea.value?.select();
      };

      const buildQrLink = () => {
        const p = props.proxy;
        const address = customAddress.value;
        const remark = customName.value;

        // Handle Shadowsocks protocol
        if (p.protocol === 'shadowsocks') {
          const method = props.client.method || p.settings?.method || 'aes-256-gcm';
          const clientPassword = props.client.password || '';
          const is2022Method = method.startsWith('2022-blake3-');

          let password = clientPassword;
          if (is2022Method && p.settings?.password) {
            password = `${p.settings.password}:${clientPassword}`;
          }

          //  https://shadowsocks.org/doc/sip002.html
          if (is2022Method) {
            const encodedMethod = encodeURIComponent(method);
            const encodedPassword = encodeURIComponent(password);
            return `ss://${encodedMethod}:${encodedPassword}@${address}:${p.port}#${encodeURIComponent(remark)}`;
          }

          // Legacy Shadowsocks URI format: ss://base64(method:password)@server:port#remark
          const userInfo = `${method}:${password}`;
          const base64UserInfo = btoa(userInfo);

          return `ss://${base64UserInfo}@${address}:${p.port}#${encodeURIComponent(remark)}`;
        }

        // Handle Hysteria2 protocol
        if (p.protocol === 'hysteria') {
          const auth = props.client.auth || '';
          const queryParams = Array<{ key: string; value: string }>();
          const addParam = (key: string, value: string | undefined) => {
            if (value) queryParams.push({ key, value });
          };

          if (p.streamSettings?.tlsSettings?.serverName) {
            addParam('sni', p.streamSettings.tlsSettings.serverName);
          }
          if (p.streamSettings?.tlsSettings?.allowInsecure) {
            addParam('insecure', '1');
          }
          if (p.streamSettings?.tlsSettings?.alpn?.length) {
            addParam('alpn', p.streamSettings.tlsSettings.alpn.join(','));
          }
          const pinnedCerts = p.streamSettings?.tlsSettings?.pinnedCertificateList() ?? [];
          if (pinnedCerts.length) {
            addParam('pinSHA256', pinnedCerts.join(','));
          }

          const obfsMask = p.streamSettings?.finalmask?.udp?.[0];
          if (obfsMask?.type === 'salamander' && obfsMask.settings?.password) {
            addParam('obfs', 'salamander');
            addParam('obfs-password', obfsMask.settings.password);
          }

          const queryString = queryParams.map((param) => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`).join('&');
          const qs = queryString ? `?${queryString}` : '';
          return `hy2://${encodeURIComponent(auth)}@${address}:${p.port}${qs}#${encodeURIComponent(remark)}`;
        }

        // Handle VLESS/VMESS protocols
        const serverAddress = `${address}:${p.port}`;
        const security = p.streamSettings?.realitySettings ? 'reality' : p.streamSettings?.tlsSettings ? 'tls' : 'none';
        const queryParams = Array<{ key: string; value: string }>();

        const addQueryParam = (key: string, value: string) => {
          queryParams.push({ key, value });
        };

        addQueryParam('security', security);
        addQueryParam('flow', props.client.flow ?? XrayOptions.clientFlowOptions[1]);
        addQueryParam('type', p.streamSettings?.network || 'tcp');

        if (security === 'reality' && p.streamSettings?.realitySettings) {
          addQueryParam('sni', p.streamSettings.realitySettings.serverNames?.[0]!);
          addQueryParam('pbk', p.streamSettings.realitySettings.publicKey!);
          addQueryParam('sid', p.streamSettings.realitySettings.shortIds?.[0]!);
          addQueryParam('fp', p.streamSettings.realitySettings.fingerprint ?? 'firefox');
          addQueryParam('spx', p.streamSettings.realitySettings.spiderX ?? '');
        } else if (security === 'tls' && p.streamSettings?.tlsSettings) {
          addQueryParam('sni', p.streamSettings.tlsSettings.serverName!);
          addQueryParam('fp', p.streamSettings.tlsSettings.fingerprint ?? 'firefox');
          addQueryParam('alpn', p.streamSettings.tlsSettings.alpn?.join(',')!);
        }

        const queryString = queryParams
          .filter((param) => param.value !== '')
          .map((param) => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
          .join('&');

        return `${p.protocol}://${props.client.id}@${serverAddress}?${queryString}#${encodeURIComponent(remark)}`;
      };

      // Computed property that updates when customAddress or customName changes
      const link = computed(() => buildQrLink());

      const showQrCode = () => {
        const p = props.proxy;

        // For VLESS/VMESS, ensure that security is set properly
        if (p.protocol !== 'shadowsocks' && p.protocol !== 'hysteria') {
          if (!p.streamSettings?.security || p.streamSettings.security === 'none') {
            alert('Please set security to tls or reality before generating QR code');
            return;
          }
        }

        // Set defaults when opening modal
        customAddress.value = window.xray?.router?.wan_ip || '';

        // For Shadowsocks, prefer client email; for others, use proxy tag
        if (p.protocol === 'shadowsocks' && props.client.email) {
          customName.value = props.client.email;
        } else {
          customName.value = p.tag || 'XRay';
        }

        modalQr.value?.show();
      };

      return {
        showQrCode,
        link,
        modalQr,
        urlTextarea,
        customAddress,
        customName,
        selectUrl
      };
    }
  });
</script>
