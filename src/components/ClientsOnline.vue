<template>
  <div class="formfontdesc">
    <table class="FormTable SettingsTable tableApi_table" id="xray_table_inbound_clients">
      <thead>
        <tr>
          <td colspan="3">Clients Online</td>
        </tr>
      </thead>
      <tbody>
        <tr class="row_title">
          <th>Ip</th>
          <th>Client</th>
        </tr>
        <tr v-for="client in clients" :key="client.ip">
          <td><span class="label label-success">online</span> {{ client.ip }}</td>
          <td>{{ client.email.join(", ") }}</td>
        </tr>
        <tr v-if="!clients.length" class="data_tr">
          <td colspan="3" style="color: #ffcc00">No one is online</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";
  import axios from "axios";
  import engine, { SubmtActions } from "../modules/Engine";

  interface Client {
    ip: string;
    email: string[];
  }

  export default defineComponent({
    name: "ClientsOnline",
    setup() {
      const clients = ref<Client[]>([]);
      let intervalId: number | undefined;

      const fetchClients = async () => {
        try {
          const response = await axios.get("/ext/xray-ui/clients-online.json");
          clients.value = response.data;
        } catch (error) {
          console.error("Error fetching clients:", error);
        }
      };

      onMounted(() => {
        engine.submit(SubmtActions.clientsOnline, null, fetchClients);

        intervalId = setInterval(() => {
          engine.submit(SubmtActions.clientsOnline, null, fetchClients);
        }, 3000);
      });

      onBeforeUnmount(() => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      });

      return {
        clients,
      };
    },
  });
</script>
