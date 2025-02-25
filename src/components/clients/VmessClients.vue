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
        <td style="min-width: 120px" v-if="securities.length">
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
          <qr ref="modalQr" :client="client" :proxy="proxy"></qr>
          <button @click.prevent="editClient(client, index)" class="button_gen button_gen_small">&#8494;</button>
          <button @click.prevent="removeClient(client)" class="button_gen button_gen_small">&#10005;</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
  import { defineComponent, ref } from "vue";
  import engine from "../../modules/Engine";
  import xrayConfig from "../../modules/XrayConfig";
  import { XrayVmessClientObject } from "../../modules/ClientsObjects";
  import Qr from "./QrCodeClient.vue";

  import modal from "../Modal.vue";

  export default defineComponent({
    name: "VlessClients",
    components: {
      Qr,
      modal
    },
    methods: {
      resetNewForm() {
        this.newClient.id = engine.uuid();
        this.newClient.email = "";
        this.newClient.security = "auto";
      },

      removeClient(client: XrayVmessClientObject) {
        if (!confirm("Are you sure you want to remove this client?")) return;
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
      }
    },
    props: {
      proxy: Object,
      clients: Array<XrayVmessClientObject>,
      mode: String
    },

    setup(props) {
      const editingIndex = ref<number | null>(null);
      const clients = ref<XrayVmessClientObject[]>(props.clients ?? []);
      const newClient = ref<XrayVmessClientObject>(new XrayVmessClientObject());
      newClient.value.id = engine.uuid();
      const modalQr = ref();

      const mode = ref(props.mode);
      switch (mode.value) {
        case "outbound":
          break;
        default:
          break;
      }

      const span = mode.value == "outbound" ? 4 : 3;

      const resetNewForm = () => {
        newClient.value.id = engine.uuid();
        newClient.value.email = "";
        newClient.value.security = "auto";
      };

      const removeClient = (client: XrayVmessClientObject) => {
        if (!confirm("Are you sure you want to remove this client?")) return;
        clients.value.splice(clients.value.indexOf(client), 1);
      };

      const addClient = () => {
        let client = new XrayVmessClientObject();
        client.id = newClient.value.id;
        client.email = newClient.value.email;
        client.security = newClient.value.security;
        if (!client.email) {
          alert("Email is required");
          return;
        }
        if (!client.id) {
          alert("Id is required");
          return;
        }
        clients.value.push(client);
        resetNewForm();
      };

      const editClient = (client: XrayVmessClientObject, index: number) => {
        newClient.value.id = client.id;
        newClient.value.email = client.email;
        newClient.value.security = client.security;
        editingIndex.value = index;
        clients.value.splice(clients.value.indexOf(client), 1);
      };

      return {
        proxy: props.proxy,
        securities: mode.value == "outbound" ? ["aes-128-gcm", "chacha20-poly1305", "auto", "none", "zero"] : [],
        span,
        clients,
        newClient,
        modalQr,
        editClient,
        removeClient,
        addClient
      };
    }
  });
</script>
