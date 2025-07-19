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
          <button @click.prevent="editClient(client, index)" class="button_gen button_gen_small">&#8494;</button>
          <button @click.prevent="removeClient(client)" class="button_gen button_gen_small">&#10005;</button>
        </td>
      </tr>
    </tbody>
  </table>
  <modal ref="modalNewClient" title="New Peer">
    <table class="FormTable modal-form-table">
      <tbody>
        <tr>
          <th>Public Key</th>
          <td>
            <input v-model="newClient.publicKey" type="text" class="input_25_table" />
            <span class="row-buttons" v-if="privateKey">
              <input class="button_gen button_gen_small" type="button" value="regenerate" @click.prevent="regen()" />
            </span>
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
      <button @click.prevent="save()" class="button_gen button_gen_small">save</button>
    </template>
  </modal>
</template>

<script lang="ts">
  import xrayConfig from '@/modules/XrayConfig';
  import { XrayWireguardClientObject } from '@/modules/ClientsObjects';
  import { XrayOptions } from '@/modules/Options';
  import { defineComponent, ref } from 'vue';
  import Qr from './QrCodeClient.vue';

  import modal from '@main/Modal.vue';
  import engine, { SubmitActions } from '@/modules/Engine';

  export default defineComponent({
    name: 'WireguardClients',
    components: {
      modal,
      Qr
    },
    methods: {
      async regen() {
        const delay = 2000;
        window.showLoading(delay);
        await engine.submit(SubmitActions.regenerateWireguardKeys, { pk: this.$props.privateKey }, delay);
        let result = await engine.getXrayResponse();
        if (result.wireguard) {
          this.newClient.publicKey = result.wireguard.publicKey;
        }
        window.hideLoading();
      },

      resetNewForm() {
        this.ips = '';
        this.newClient.allowedIPs = [];
        this.newClient.publicKey = '';
      },

      showQrCode(client: XrayWireguardClientObject) {
        this.modalQr.value?.show();
      },

      removeClient(client: XrayWireguardClientObject) {
        if (!confirm('Are you sure you want to remove this client?')) return;
        this.clients.splice(this.clients.indexOf(client), 1);
      },
      addClient() {
        this.modalNewClient.show();
      }
    },
    props: {
      clients: Array<XrayWireguardClientObject>,
      privateKey: String,
      mode: String,
      proxy: {
        type: Object as () => any,
        required: true
      }
    },

    setup(props) {
      const editingIndex = ref<number | null>(null);
      const clients = ref<XrayWireguardClientObject[]>(props.clients ?? []);
      const newClient = ref<XrayWireguardClientObject>(new XrayWireguardClientObject());
      const mode = ref(props.mode);
      const modalQr = ref();
      const modalNewClient = ref();

      const ips = ref('');
      const privateKey = ref<string>(props.privateKey ?? '');

      const editClient = (client: XrayWireguardClientObject, index: number) => {
        newClient.value = { ...client };
        ips.value = client.allowedIPs.join('\n');
        editingIndex.value = index;
        modalNewClient.value?.show();
      };

      const save = () => {
        if (!newClient.value.publicKey) {
          alert('Public key is required');
          return;
        }
        const allowed = ips.value.split('\n').filter(Boolean);
        if (!allowed.length) {
          alert('Allowed IPs is required');
          return;
        }
        newClient.value.allowedIPs = allowed;
        if (editingIndex.value === null) {
          clients.value.push({ ...newClient.value });
        } else {
          clients.value.splice(editingIndex.value, 1, { ...newClient.value });
        }
        modalNewClient.value?.close();
        resetNewForm();
      };
      const resetNewForm = () => {
        ips.value = '';
        newClient.value = new XrayWireguardClientObject();
        editingIndex.value = null;
      };
      return {
        flows: XrayOptions.clientFlowOptions,
        ips,
        clients,
        modalNewClient,
        newClient,
        modalQr,
        mode,
        privateKey,
        editClient,
        save
      };
    }
  });
</script>
