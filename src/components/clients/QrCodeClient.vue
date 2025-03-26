<template>
  <button @click.prevent="showQrCode" class="button_gen button_gen_small">QR</button>
  <modal ref="modalQr" title="QR Code Modal">
    <qrcode-vue :value="link" :size="400" level="H" render-as="svg" />
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import Modal from '../Modal.vue';
  import QrcodeVue from 'qrcode.vue';
  import { XrayStreamRealitySettingsObject, XrayStreamTlsSettingsObject } from '@/modules/CommonObjects';

  interface Client {
    id: string;
    flow: string;
  }

  interface Proxy {
    protocol: string;
    port: number | string;
    streamSettings: {
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
      const link = ref('');
      const modalQr = ref<InstanceType<typeof Modal> | null>(null);

      const showQrCode = () => {
        const p = props.proxy;
        // Ensure that security is set properly.
        if (!p.streamSettings.security || p.streamSettings.security === 'none') {
          alert('Please set security to tls or reality before generating QR code');
          return;
        }

        const wanip = `${window.xray.router.wan_ip}:${p.port}`;
        const security = p.streamSettings.realitySettings ? 'reality' : p.streamSettings.tlsSettings ? 'tls' : 'none';
        const queryParams = Array<{ key: string; value: string }>();

        const addQueryParam = (key: string, value: string) => {
          queryParams.push({ key, value });
        };

        addQueryParam('security', security);
        addQueryParam('flow', props.client.flow);
        addQueryParam('type', 'tcp');
        if (security === 'reality' && p.streamSettings.realitySettings) {
          addQueryParam('sni', p.streamSettings.realitySettings.serverNames?.[0]!);
          addQueryParam('pbk', p.streamSettings.realitySettings.publicKey!);
          addQueryParam('sid', p.streamSettings.realitySettings.shortIds?.[0]!);
          addQueryParam('fp', p.streamSettings.realitySettings.fingerprint ?? 'chrome');
          addQueryParam('spx', p.streamSettings.realitySettings.spiderX ?? '');
        } else if (security === 'tls' && p.streamSettings.tlsSettings) {
          addQueryParam('sni', p.streamSettings.tlsSettings.serverName!);
          addQueryParam('fp', p.streamSettings.tlsSettings.fingerprint ?? 'chrome');
          addQueryParam('alpn', p.streamSettings.tlsSettings.alpn?.join(',')!);
        }

        const queryString = queryParams
          .filter((param) => param.value !== '')
          .map((param) => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
          .join('&');

        link.value = `${p.protocol}://${props.client.id}@${wanip}?${queryString}#${window.xray.router.name}`;
        console.log(link.value);
        modalQr.value?.show();
      };

      return {
        showQrCode,
        link,
        modalQr
      };
    }
  });
</script>
