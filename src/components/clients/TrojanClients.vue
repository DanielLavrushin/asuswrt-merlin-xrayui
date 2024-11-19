<template>
  <table class="FormTable SettingsTable tableApi_table" v-if="clients">
    <thead>
      <tr>
        <td colspan="3">Clients</td>
      </tr>
    </thead>
    <tbody>
      <tr class="row_title">
        <th>User</th>
        <th>Password</th>
        <th style="min-width:120px"></th>
      </tr>
      <tr class="row_title">
        <td>
          <input v-model="newClient.email" class="input_25_table" placeholder="User Name" />
        </td>
        <td>
          <input v-model="newClient.password" type="text" class="input_25_table" placeholder="Password" />
        </td>
        <td>
          <button class="add_btn" @click.prevent="addClient"></button>
        </td>
      </tr>
      <tr v-if="!clients.length" class="data_tr">
        <td colspan="3" style="color: #ffcc00">No clients registered</td>
      </tr>
      <tr v-for="(client, index) in clients" :key="index" class="data_tr">
        <td>{{ client.email }}</td>
        <td>{{ client.password }}</td>
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
</template>

<script lang="ts">
import xrayConfig, { XrayTrojanClientObject, XrayOptions } from "../../modules/XrayConfig";
import { defineComponent, ref } from "vue";
import QrcodeVue from "qrcode.vue";

import modal from "../Modal.vue";

export default defineComponent({
  name: "TrojanClients",
  components: {
    QrcodeVue,
    modal,
  },
  methods: {

    resetNewForm() {
      this.newClient.email = "";
      this.newClient.password = "";
    },

    showQrCode(client: XrayTrojanClientObject) {
      this.qr_content = JSON.stringify(xrayConfig);
      this.modalQr.value?.show();
    },

    removeClient(client: XrayTrojanClientObject) {
      this.clients.splice(this.clients.indexOf(client), 1);
    },

    addClient() {
      let client = new XrayTrojanClientObject();
      client.email = this.newClient.email;
      client.password = this.newClient.password;
      if (!client.email) {
        alert("Email is required");
        return;
      }
      if (!client.password) {
        alert("Password is required");
        return;
      }
      this.clients.push(client);
      this.resetNewForm();
    },
  },
  props: {
    clients: Array<XrayTrojanClientObject>,
  },

  setup(props) {

    const clients = ref<XrayTrojanClientObject[]>(props.clients ?? []);
    const newClient = ref<XrayTrojanClientObject>(new XrayTrojanClientObject());
    const modalQr = ref();
    let qr_content = ref("");

    return {
      flows: XrayOptions.clientFlowOptions,
      clients,
      qr_content,
      qr_size: 500,
      newClient,
      modalQr,
    };
  },
});
</script>
