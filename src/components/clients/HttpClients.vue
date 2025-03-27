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
        <th style="min-width: 120px"></th>
      </tr>
      <tr class="row_title">
        <td>
          <input v-model="newClient.user" class="input_25_table" placeholder="User Name" />
        </td>
        <td>
          <input v-model="newClient.pass" type="text" class="input_25_table" placeholder="Password" />
        </td>
        <td>
          <button class="add_btn" @click.prevent="addClient"></button>
        </td>
      </tr>
      <tr v-if="!clients.length" class="data_tr">
        <td colspan="3" style="color: #ffcc00">No clients registered</td>
      </tr>
      <tr v-for="(client, index) in clients" :key="index" class="data_tr">
        <td>{{ client.user }}</td>
        <td>{{ client.pass }}</td>
        <td>
          <button @click.prevent="editClient(client, index)" class="button_gen button_gen_small">&#8494;</button>
          <button @click.prevent="removeClient(client)" class="button_gen button_gen_small">&#10005;</button>
        </td>
      </tr>
    </tbody>
  </table>
  <modal ref="modalQr" title="QR Code Modal">
    <qrcode-vue :value="qr_content" :size="qr_size" level="H" render-as="svg" />
  </modal>
</template>

<script lang="ts">
  import { XrayOptions } from '@/modules/Options';
  import { XrayHttpClientObject } from '@/modules/ClientsObjects';
  import xrayConfig from '@/modules/XrayConfig';
  import { defineComponent, ref } from 'vue';
  import QrcodeVue from 'qrcode.vue';

  import modal from '@main/Modal.vue';

  export default defineComponent({
    name: 'VlessClients',
    components: {
      QrcodeVue,
      modal
    },
    methods: {},
    props: {
      clients: Array<XrayHttpClientObject>
    },

    setup(props) {
      const editingIndex = ref<number | null>(null);
      const clients = ref<XrayHttpClientObject[]>(props.clients ?? []);
      const newClient = ref<XrayHttpClientObject>(new XrayHttpClientObject());
      const modalQr = ref();
      let qr_content = ref('');

      const resetNewForm = () => {
        newClient.value.user = '';
        newClient.value.pass = '';
      };

      const showQrCode = (client: XrayHttpClientObject) => {
        qr_content.value = JSON.stringify(xrayConfig);
        modalQr.value?.show();
      };

      const removeClient = (client: XrayHttpClientObject) => {
        if (!confirm('Are you sure you want to remove this client?')) return;
        clients.value.splice(clients.value.indexOf(client), 1);
      };

      const addClient = () => {
        let client = new XrayHttpClientObject();
        client.user = newClient.value.user;
        client.pass = newClient.value.pass;
        if (!client.user) {
          alert('User Name is required');
          return;
        }
        if (!client.pass) {
          alert('Password is required');
          return;
        }
        clients.value.push(client);
        resetNewForm();
      };

      const editClient = (client: XrayHttpClientObject, index: number) => {
        newClient.value.pass = client.pass;
        newClient.value.user = client.user;
        editingIndex.value = index;
        clients.value.splice(clients.value.indexOf(client), 1);
      };

      return {
        flows: XrayOptions.clientFlowOptions,
        clients,
        qr_content,
        qr_size: 500,
        newClient,
        modalQr,
        showQrCode,
        editClient,
        removeClient,
        addClient
      };
    }
  });
</script>
