<template>
  <table class="FormTable SettingsTable tableApi_table" v-if="clients">
    <thead>
      <tr>
        <td colspan="4">Clients</td>
      </tr>
    </thead>
    <tbody>
      <tr class="row_title">
        <th>Email</th>
        <th>password</th>
        <th v-if="!is2022MultiUser">Encryption</th>
        <th></th>
      </tr>
      <tr class="row_title">
        <td>
          <input v-model="newClient.email" class="input_20_table" placeholder="Email" />
        </td>
        <td>
          <input v-model="newClient.password" type="text" class="input_20_table" placeholder="Password" />
          <button @click.prevent="regenerate()" class="button_gen button_gen_small" title="randomly generate password">re</button>
        </td>
        <td v-if="!is2022MultiUser" style="min-width: 120px">
          <select v-model="newClient.method" class="input_12_table">
            <option v-for="flow in encryptions" :value="flow" :key="flow">{{ flow }}</option>
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
        <td>{{ client.email }}</td>
        <td>{{ client.password }}</td>
        <td v-if="!is2022MultiUser">{{ client.method }}</td>
        <td>
          <qr :client="client" :proxy="proxy"></qr>
          <button @click.prevent="removeClient(client)" class="button_gen button_gen_small" title="delete">&#10005;</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
  import { XrayOptions } from '@/modules/Options';
  import { XrayShadowsocksClientObject } from '@/modules/ClientsObjects';
  import { defineComponent, ref, computed } from 'vue';
  import engine from '@/modules/Engine';
  import Qr from './QrCodeClient.vue';

  export default defineComponent({
    name: 'ShadowsocksClients',
    components: {
      Qr
    },
    methods: {
      regenerate() {
        this.newClient.password = engine.generateRandomBase64();
      },

      resetNewForm() {
        this.newClient.password = engine.generateRandomBase64();
        this.newClient.email = '';
        this.newClient.method = 'aes-256-gcm';
      },

      removeClient(client: XrayShadowsocksClientObject) {
        if (!confirm('Are you sure you want to remove this client?')) return;
        this.clients.splice(this.clients.indexOf(client), 1);
      },

      addClient() {
        let client = new XrayShadowsocksClientObject();
        client.password = this.newClient.password;
        client.email = this.newClient.email;
        client.method = this.is2022MultiUser ? undefined : this.newClient.method;
        if (!client.email) {
          alert('Email is required');
          return;
        }
        if (!client.password) {
          alert('Password is required');
          return;
        }
        this.clients.push(client);
        this.resetNewForm();
      }
    },
    props: {
      clients: Array<XrayShadowsocksClientObject>,
      proxy: {
        type: Object as () => any,
        required: false
      }
    },

    setup(props) {
      const clients = ref<XrayShadowsocksClientObject[]>(props.clients ?? []);
      const newClient = ref<XrayShadowsocksClientObject>(new XrayShadowsocksClientObject());
      newClient.value.password = engine.generateRandomBase64();

      const is2022MultiUser = computed(() => {
        const serverMethod = props.proxy?.settings?.method;
        return serverMethod?.startsWith('2022-blake3-') ?? false;
      });

      const clientEncryptions = computed(() => {
        return XrayOptions.encryptionOptions.filter((method) => !method.startsWith('2022-blake3-'));
      });

      return {
        flows: XrayOptions.clientFlowOptions,
        encryptions: clientEncryptions,
        clients,
        newClient,
        proxy: props.proxy,
        is2022MultiUser
      };
    }
  });
</script>
