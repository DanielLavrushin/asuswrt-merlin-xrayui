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
  }

  interface Proxy {
    protocol: string;
    port: number | string;
    tag?: string;
    settings?: {
      method?: string;
    };
    streamSettings?: {
      security?: string;
      realitySettings?: XrayStreamRealitySettingsObject;
      tlsSettings?: XrayStreamTlsSettingsObject;
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
          const password = props.client.password || '';

          // Shadowsocks URI format: ss://base64(method:password)@server:port#remark
          const userInfo = `${method}:${password}`;
          const base64UserInfo = btoa(userInfo);

          return `ss://${base64UserInfo}@${address}:${p.port}#${encodeURIComponent(remark)}`;
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
        addQueryParam('type', 'tcp');

        if (security === 'reality' && p.streamSettings?.realitySettings) {
          addQueryParam('sni', p.streamSettings.realitySettings.serverNames?.[0]!);
          addQueryParam('pbk', p.streamSettings.realitySettings.publicKey!);
          addQueryParam('sid', p.streamSettings.realitySettings.shortIds?.[0]!);
          addQueryParam('fp', p.streamSettings.realitySettings.fingerprint ?? 'chrome');
          addQueryParam('spx', p.streamSettings.realitySettings.spiderX ?? '');
        } else if (security === 'tls' && p.streamSettings?.tlsSettings) {
          addQueryParam('sni', p.streamSettings.tlsSettings.serverName!);
          addQueryParam('fp', p.streamSettings.tlsSettings.fingerprint ?? 'chrome');
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
        if (p.protocol !== 'shadowsocks') {
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
