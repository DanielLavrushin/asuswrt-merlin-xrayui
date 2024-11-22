<template>
  <table class="FormTable SettingsTable tableApi_table" v-if="clients">
    <thead>
      <tr>
        <td :colspan="span">Clients</td>
      </tr>
    </thead>
    <tbody>
      <tr class="row_title">
        <th>Id</th>
        <th>Email</th>
        <th v-if="securities.length">Security</th>
        <th></th>
      </tr>
      <tr class="row_title">
        <td>
          <input v-model="newClient.id" maxlength="36" class="input_20_table" placeholder="Unique Id" />
        </td>
        <td>
          <input v-model="newClient.email" type="text" class="input_20_table" placeholder="Email" />
        </td>
        <td style="min-width:120px" v-if="securities.length">
          <select v-model="newClient.security" class="input_12_table">
            <option v-for="opt in securities" :value="opt" :key="opt">{{ opt }}</option>
          </select>
        </td>
        <td>
          <button class="add_btn" @click.prevent="addClient"></button>
        </td>
      </tr>
      <tr v-if="!clients.length" class="data_tr">
        <td :colspan="span" style="color: #ffcc00">No clients registered</td>
      </tr>
      <tr v-for="(client, index) in clients" :key="index" class="data_tr">
        <td>{{ client.id }}</td>
        <td>{{ client.email }}</td>
        <td v-if="securities.length">{{ client.security }}</td>
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
import { defineComponent, ref } from "vue";
import engine from "../../modules/Engine";
import xrayConfig from "../../modules/XrayConfig";
import { XrayVmessClientObject } from "../../modules/ClientsObjects";
import QrcodeVue from "qrcode.vue";

import modal from "../Modal.vue";

export default defineComponent({
  name: "VlessClients",
  components: {
    QrcodeVue,
    modal,
  },
  methods: {


    resetNewForm() {
      this.newClient.id = engine.uuid();
      this.newClient.email = "";
    },

    showQrCode(client: XrayVmessClientObject) {
      this.qr_content = JSON.stringify(xrayConfig);
      this.modalQr.value?.show();
    },

    removeClient(client: XrayVmessClientObject) {
      this.clients.splice(this.clients.indexOf(client), 1);
    },

    addClient() {
      let client = new XrayVmessClientObject();
      client.id = this.newClient.id;
      client.email = this.newClient.email;
      client.security = this.newClient.security;
      if (!client.email) {
        alert("Email is required");
        return;
      }
      if (!client.id) {
        alert("Id is required");
        return;
      }
      this.clients.push(client);
      this.resetNewForm();
    },
  },
  props: {
    clients: Array<XrayVmessClientObject>,
    mode: String
  },

  setup(props) {

    const clients = ref<XrayVmessClientObject[]>(props.clients ?? []);
    const newClient = ref<XrayVmessClientObject>(new XrayVmessClientObject());
    newClient.value.id = engine.uuid();
    const modalQr = ref();
    let qr_content = ref("");

    const mode = ref(props.mode);
    switch (mode.value) {
      case "outbound":
        break;
      default:
        break;
    }

    const span = mode.value == "outbound" ? 4 : 3;

    return {
      securities: mode.value == 'outbound' ? ["aes-128-gcm", "chacha20-poly1305", "auto", "none", "zero"] : [],
      span,
      clients,
      qr_content,
      qr_size: 500,
      newClient,
      modalQr,
    };
  },
});
</script>
