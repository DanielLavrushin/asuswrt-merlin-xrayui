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
            <button class="add_btn" @click="addClient">Add</button>
          </td>
        </tr>
        <tr v-if="!clients.length" class="data_tr">
          <td colspan="3" style="color: #ffcc00">No data in table.</td>
        </tr>
        <tr v-for="(client, index) in clients" :key="index" class="data_tr">
          <td>{{ client.email }}</td>
          <td>{{ client.id }}</td>
          <td>
            <button @click="removeClient(client)" class="button_gen button_gen_small">Remove</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
  const zero_uuid = "00000000-0000-0000-0000-000000000000";
  import { engine, SubmtActions } from "../modules/Engine";
  import { defineComponent, ref, PropType } from "vue";
  import { XrayInboundClientObject } from "../modules/XrayConfig";

  export default defineComponent({
    name: "Clients",
    props: {
      clients: {
        type: Array as PropType<XrayInboundClientObject[]>,
        default: () => [],
      },
    },
    methods: {
      uuid() {
        return zero_uuid.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return c === "x" ? r.toString(16) : ((r & 0x3) | 0x8).toString(16);
        });
      },
    },
    setup(props, { emit }) {
      const newClient = ref({
        email: "",
        id: "",
      });

      const resetNewForm = () => {
        newClient.value.id = this.uuid();
        newClient.value.email = "";
      };

      const addClient = () => {
        if (newClient.value.email && newClient.value.id) {
          engine.submit(SubmtActions.clientAdd, newClient.value);

          newClient.value.email = "";
          resetNewForm();
        }
      };

      const removeClient = (client: XrayInboundClientObject) => {
        engine.submit(SubmtActions.clientDelete, client);
      };

      resetNewForm();

      return {
        newClient,
        addClient,
        removeClient,
      };
    },
  });
</script>
