<template>
    <button @click.prevent="showQrCode(client)" class="button_gen button_gen_small">QR</button>
    <modal ref="modalQr" title="QR Code Modal">
        <qrcode-vue :value="link" :size="400" level="H" render-as="svg" />
    </modal>
</template>
<script lang="ts">
import Modal from "../Modal.vue";
import { defineComponent, ref } from "vue";
import QrcodeVue from "qrcode.vue";

export default defineComponent({
    name: "Qr",

    components: {
        Modal,
        QrcodeVue
    },
    methods: {
    },
    props: {
        client: Object,
        proxy: Object
    },
    setup(props) {
        const link = ref("");
        const modalQr = ref();
        const showQrCode = (client: any) => {
            if (props.proxy) {

                var p = props.proxy;

                let wanip = window.xray.router.wan_ip + ":" + p.port;
                let security = p.streamSettings.realitySettings ? 'reality' : p.streamSettings.tlsSettings ? 'tls' : 'none';
                let sni = "";
                let pbk = "";
                let shortId = "";
                let fp = "";
                if (security == 'reality') {
                    sni = p.streamSettings.realitySettings.serverNames[0];
                    pbk = p.streamSettings.realitySettings.publicKey;
                    shortId = p.streamSettings.realitySettings.shortIds[0];
                    fp = p.streamSettings.realitySettings.fingerPrints ? p.streamSettings.realitySettings.fingerPrints[0] : 'chrome'
                } else if (security == 'tls') {
                    sni = p.streamSettings.tlsSettings.serverName;
                    pbk = p.streamSettings.tlsSettings.publicKey;
                    shortId = p.streamSettings.tlsSettings.shortId;
                    fp = p.streamSettings.tlsSettings.fingerPrints ? p.streamSettings.tlsSettings.fingerPrints[0] : 'chrome'
                }
                link.value = p.protocol + "://" + client.id + "@" + wanip + "?flow=" + client.flow + "&type=raw&security=" + security + "&fp=" + fp + "&sni=" + sni + "&pbk=" + pbk + "&sid=" + shortId + "#" + window.xray.router.name;

                modalQr.value.show();
            }

        };
        return {
            showQrCode,
            link,
            modalQr
        };
    },
});
</script>
<style scoped></style>