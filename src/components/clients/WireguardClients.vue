<template>
    <table class="FormTable SettingsTable tableApi_table" v-if="clients">
        <thead>
            <tr>
                <td colspan="3">Clients</td>
            </tr>
        </thead>
        <tbody>
            <tr class="row_title">
                <td colspan="3">
                    <button class="add_btn" @click.prevent="addClient"></button>
                </td>
            </tr>
            <tr v-if="!clients.length" class="data_tr">
                <td colspan="3" style="color: #ffcc00">No clients registered</td>
            </tr>
            <tr v-for="(client, index) in clients" :key="index" class="data_tr">
                <td>{{ client.publicKey }}</td>
                <td>{{ client.allowedIPs.join(', ') }}</td>
                <td>
                    <button @click.prevent="showQrCode(client)" class="button_gen button_gen_small">manage</button>
                    <button @click.prevent="removeClient(client)" class="button_gen button_gen_small">remove</button>
                </td>
            </tr>
        </tbody>
    </table>
    <modal ref="modalQr" title="QR Code Modal">
        <qrcode-vue :value="qr_content" :size="qr_size" level="H" render-as="svg" />
    </modal>
    <modal ref="modalNewClient" title="New Peer">
        <table class="FormTable modal-form-table">
            <tbody>
                <tr>
                    <th>Public Key</th>
                    <td>
                        <input v-model="newClient.publicKey" type="text" class="input_25_table" />
                    </td>
                </tr>
                <tr>
                    <th>Allowed IPs</th>
                    <td>
                        <div class="textarea-wrapper">
                            <textarea v-model="ips" rows="25"></textarea>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <template v-slot:footer>
            <button @click.prevent="addClient2()" class="button_gen button_gen_small">save</button>
        </template>
    </modal>
</template>

<script lang="ts">
import xrayConfig, { XrayWireguardClientObject, XrayOptions } from "../../modules/XrayConfig";
import { defineComponent, ref } from "vue";
import QrcodeVue from "qrcode.vue";

import modal from "../Modal.vue";

export default defineComponent({
    name: "WireguardClients",
    components: {
        QrcodeVue,
        modal,
    },
    methods: {

        resetNewForm() {
            this.ips = "";
            this.newClient.allowedIPs = [];
            this.newClient.publicKey = "";
        },

        showQrCode(client: XrayWireguardClientObject) {
            this.qr_content = JSON.stringify(xrayConfig);
            this.modalQr.value?.show();
        },

        removeClient(client: XrayWireguardClientObject) {
            this.clients.splice(this.clients.indexOf(client), 1);
        },
        addClient() {
            this.modalNewClient.show();
        },
        addClient2() {
            let client = new XrayWireguardClientObject();
            client.allowedIPs = this.ips.split("\n");
            client.publicKey = this.newClient.publicKey;
            if (!client.publicKey) {
                alert("Public key is required");
                return;
            }
            if (this.ips.length == 0) {
                alert("Allowed IPs is required");
                return;
            }
            this.clients.push(client);
            this.resetNewForm();
            this.modalNewClient.close();
        },
    },
    props: {
        clients: Array<XrayWireguardClientObject>,
    },

    setup(props) {

        const clients = ref<XrayWireguardClientObject[]>(props.clients ?? []);
        const newClient = ref<XrayWireguardClientObject>(new XrayWireguardClientObject());
        const modalQr = ref();
        const modalNewClient = ref();
        const qr_content = ref("");
        const ips = ref();

        return {
            flows: XrayOptions.clientFlowOptions,
            ips,
            clients,
            modalNewClient,
            qr_content,
            qr_size: 500,
            newClient,
            modalQr,
        };
    },
});
</script>