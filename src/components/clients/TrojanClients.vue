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
  import xrayConfig from '@/modules/XrayConfig';
  import { XrayTrojanClientObject } from '@/modules/ClientsObjects';
  import { XrayOptions } from '@/modules/Options';
  import { defineComponent, ref } from 'vue';
  import QrcodeVue from 'qrcode.vue';

  import modal from '@main/Modal.vue';

  export default defineComponent({
    name: 'TrojanClients',
    components: {
      QrcodeVue,
      modal
    },
    methods: {},
    props: {
      clients: Array<XrayTrojanClientObject>
    },

    setup(props) {
      const editingIndex = ref<number | null>(null);
      const clients = ref<XrayTrojanClientObject[]>(props.clients ?? []);
      const newClient = ref<XrayTrojanClientObject>(new XrayTrojanClientObject());
      const modalQr = ref();
      let qr_content = ref('');

      const resetNewForm = () => {
        newClient.value.email = '';
        newClient.value.password = '';
      };

      const showQrCode = (client: XrayTrojanClientObject) => {
        qr_content.value = JSON.stringify(xrayConfig);
        modalQr.value?.show();
      };

      const removeClient = (client: XrayTrojanClientObject) => {
        if (!confirm('Are you sure you want to remove this client?')) return;
        clients.value.splice(clients.value.indexOf(client), 1);
      };

      const addClient = () => {
        let client = new XrayTrojanClientObject();
        client.email = newClient.value.email;
        client.password = newClient.value.password;
        if (!client.email) {
          alert('Email is required');
          return;
        }
        if (!client.password) {
          alert('Password is required');
          return;
        }
        clients.value.push(client);
        resetNewForm();
      };

      const editClient = (client: XrayTrojanClientObject, index: number) => {
        newClient.value.email = client.email;
        newClient.value.password = client.password;
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
        addClient,
        editClient,
        removeClient,
        showQrCode
      };
    }
  });
</script>
