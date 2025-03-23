<template>
  <button @click.prevent="showQrCode" class="button_gen button_gen_small">QR</button>
  <modal ref="modalQr" title="QR Code Modal">
    <qrcode-vue :value="link" :size="400" level="H" render-as="svg" />
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref } from "vue";
  import Modal from "../Modal.vue";
  import QrcodeVue from "qrcode.vue";
  import { XrayStreamRealitySettingsObject, XrayStreamTlsSettingsObject } from "@/modules/CommonObjects";

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
    name: "Qr",
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
      const link = ref("");
      const modalQr = ref<InstanceType<typeof Modal> | null>(null);

      const showQrCode = () => {
        const p = props.proxy;
        // Ensure that security is set properly.
        if (!p.streamSettings.security || p.streamSettings.security === "none") {
          alert("Please set security to tls or reality before generating QR code");
          return;
        }

        const wanip = `${window.xray.router.wan_ip}:${p.port}`;
        const security = p.streamSettings.realitySettings ? "reality" : p.streamSettings.tlsSettings ? "tls" : "none";

        let sni = "";
        let pbk = "";
        let shortId = "";
        let fp = "";
        let spx = "";
        let alpn = "";
        if (security === "reality" && p.streamSettings.realitySettings) {
          sni = p.streamSettings.realitySettings.serverNames?.[0]!;
          pbk = p.streamSettings.realitySettings.publicKey!;
          shortId = p.streamSettings.realitySettings.shortIds?.[0]!;
          fp = p.streamSettings.realitySettings.fingerprint!;
          spx = p.streamSettings.realitySettings.spiderX!;
        } else if (security === "tls" && p.streamSettings.tlsSettings) {
          sni = p.streamSettings.tlsSettings.serverName!;
          fp = p.streamSettings.tlsSettings.fingerprint!;
          alpn = p.streamSettings.tlsSettings.alpn?.join(",")!;
        }

        link.value = `${p.protocol}://${props.client.id}@${wanip}?flow=${props.client.flow}&type=raw&security=${security}&spx=${spx}&fp=${fp}&sni=${sni}&alpn=&${alpn}&pbk=${pbk}&sid=${shortId}#${window.xray.router.name}`;

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
