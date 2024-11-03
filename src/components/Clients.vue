<template>
  <div class="formfontdesc">
    <table class="FormTable SettingsTable tableApi_table" id="xray_table_inbound_clients">
      <thead>
        <tr>
          <td colspan="3">Clients</td>
        </tr>
      </thead>
      <tbody>
        <tr class="row_title">
          <th>Username</th>
          <th>Id</th>
          <th></th>
        </tr>
        <tr class="row_title">
          <td>
            <input v-model="newClient.email" type="text" class="input_25_table" placeholder="Username" />
          </td>
          <td>
            <input v-model="newClient.id" maxlength="36" class="input_25_table" placeholder="Client ID" />
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
          <td>{{ client.id }}</td>
          <td>
            <button @click.prevent="showQrCode()" class="button_gen button_gen_small">QR</button>
            <button @click.prevent="removeClient(client)" class="button_gen button_gen_small">Remove</button>
          </td>
        </tr>
      </tbody>
    </table>
    <modal ref="modalRef" title="QR Code Modal">
      <qrcode-vue :value="qr_content" :size="qr_size" level="H" render-as="svg" />
    </modal>
  </div>
</template>

<script lang="ts">
  const zero_uuid = "10000000-1000-4000-8000-100000000000";
  import { engine, SubmtActions } from "../modules/Engine";
  import xrayConfig from "../modules/XrayConfig";
  import { defineComponent, ref, reactive, watch } from "vue";
  import { XrayInboundClientObject } from "../modules/XrayConfig";
  import QrcodeVue from "qrcode.vue";

  import modal from "./Modal.vue";

  export default defineComponent({
    name: "Clients",
    components: {
      QrcodeVue,
      modal,
    },
    methods: {},
    setup(props, { emit }) {
      let uuid = () => {
        return zero_uuid.replace(/[018]/g, (c) => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16));
      };

      const clients = ref<XrayInboundClientObject[]>(xrayConfig.inbounds[0].settings?.clients ?? []);

      watch(
        () => xrayConfig?.inbounds[0].settings?.clients,
        (newClients) => {
          clients.value = newClients ?? [];
        },
        { immediate: true }
      );

      const newClient = ref({
        email: "",
        id: "",
      });

      const resetNewForm = () => {
        newClient.value.id = uuid();
        newClient.value.email = "";
      };

      const addClient = async () => {
        if (newClient.value.email && newClient.value.id) {
          engine.submit(SubmtActions.clientAdd, newClient.value, async () => {
            newClient.value.email = "";
            resetNewForm();
            await engine.loadXrayConfig();
            window.hideLoading();
          });
        }
      };

      const removeClient = (client: XrayInboundClientObject) => {
        engine.submit(SubmtActions.clientDelete, client, async () => {
          await engine.loadXrayConfig();
          window.hideLoading();
        });
      };

      const modalRef = ref();
      let qr_content = ref("");
      const showQrCode = () => {
        qr_content.value = JSON.stringify(xrayConfig);
        modalRef.value?.show();
      };

      resetNewForm();
      return {
        clients,
        qr_content,
        qr_size: 500,
        newClient,
        addClient,
        removeClient,
        showQrCode,
        modalRef,
      };
    },
  });
</script>
