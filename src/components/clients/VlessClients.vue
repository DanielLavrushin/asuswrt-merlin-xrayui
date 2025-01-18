<template>
  <table class="FormTable SettingsTable tableApi_table" v-if="clients">
    <thead>
      <tr>
        <td colspan="4">Clients</td>
      </tr>
    </thead>
    <tbody>
      <tr class="row_title">
        <th>Id</th>
        <th>Email</th>
        <th>Flow</th>
        <th style="min-width:120px"></th>
      </tr>
      <tr class="row_title">
        <td>
          <input v-model="newClient.id" maxlength="36" class="input_20_table" placeholder="Unique Id" />
        </td>
        <td>
          <input v-model="newClient.email" type="text" class="input_20_table" placeholder="Email" />
        </td>

        <td style="min-width:120px">
          <select v-model="newClient.flow" class="input_12_table">
            <option v-for="flow in flows" :value="flow" :key="flow">{{ flow }}</option>
          </select>
        </td>
        <td>
          <button class="add_btn" @click.prevent="addClient"></button>
        </td>
      </tr>
      <tr v-if="!clients.length" class="data_tr">
        <td colspan="4" style="color: #ffcc00">No clients registered</td>
      </tr>
      <tr v-for="(client, index) in clients" :key="index" class="data_tr">
        <td>{{ client.id }}</td>
        <td>{{ client.email }}</td>
        <td style="min-width:120px">{{ client.flow }}</td>
        <td>
          <qr v-if="isServerMode" ref="modalQr" :client="client" :proxy="proxy"></qr>
          <button @click.prevent="removeClient(client)" class="button_gen button_gen_small">remove</button>
        </td>
      </tr>
    </tbody>
  </table>

</template>

<script lang="ts">
import { engine } from "../../modules/Engine";
import { XrayVlessClientObject } from "../../modules/ClientsObjects";
import { XrayOptions } from "../../modules/Options";
import { defineComponent, ref } from "vue";
import modal from "../Modal.vue";
import Qr from "./QrCodeClient.vue";

export default defineComponent({
  name: "VlessClients",
  components: {
    modal,
    Qr
  },
  methods: {

    resetNewForm() {
      this.newClient.id = engine.uuid();
      this.newClient.email = "";
      this.newClient.flow = XrayOptions.clientFlowOptions[0];
    },

    removeClient(client: XrayVlessClientObject) {
      if (!confirm("Are you sure you want to remove this client?")) return;
      this.clients.splice(this.clients.indexOf(client), 1);
    },

    addClient() {
      let client = new XrayVlessClientObject();
      client.id = this.newClient.id;
      client.email = this.newClient.email;
      client.flow = this.newClient.flow;
      if (!client.email) {
        alert("Email is required");
        return;
      }
      if (!client.id) {
        alert("Id is required");
        return;
      }

      if (this.mode == "outbound") {
        client.encryption = "none";
      }

      this.clients.push(client);
      this.resetNewForm();
    },
  },
  props: {
    proxy: Object,
    clients: Array<XrayVlessClientObject>,
    mode: String,
  },

  setup(props) {
    const clients = ref<XrayVlessClientObject[]>(props.clients ?? []);
    const newClient = ref<XrayVlessClientObject>(new XrayVlessClientObject());
    const mode = ref(props.mode);
    newClient.value.id = engine.uuid();
    const modalQr = ref();
    const flows = ref();

    switch (mode.value) {
      case "outbound":
        flows.value = ["xtls-rprx-vision", "xtls-rprx-vision-udp443"];
        break;
      default:
        flows.value = XrayOptions.clientFlowOptions;
        break;
    }


    return {
      flows,
      clients,
      newClient,
      modalQr,
      isServerMode: engine.mode == "server",
    };
  },
});
</script>
