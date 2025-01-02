<template>
  <div class="formfontdesc">
    <table class="FormTable SettingsTable tableApi_table">
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
        <tr v-for="client in clients" :key="client.ip" class="data_tr">
          <td><span class="label label-success">online</span> {{ client.ip }}</td>
          <td>{{ client.email.filter(email => email).join(", ") }}</td>
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
        const response = await axios.get("/ext/xrayui/clients-online.json");
        clients.value = response.data;
      } catch (error) {
        console.warn("Error fetching clients:", error);
      }
    };

    if (engine.mode == "server") {
      onMounted(async () => {
        await engine.submit(SubmtActions.clientsOnline);
        await fetchClients();
        intervalId = setInterval(async () => {
          await engine.submit(SubmtActions.clientsOnline);
          await fetchClients();
        }, 3000);
      });
    }

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
