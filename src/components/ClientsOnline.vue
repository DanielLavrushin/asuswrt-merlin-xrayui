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
    <form ref="form" method="post" name="clientsOnlineForm" action="/start_apply.htm" target="hidden_frame">
      <input type="hidden" name="action_mode" value="apply" />
      <input type="hidden" name="action_script" value="xrayui_connectedclients" />
    </form>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";
  import axios from "axios";

  interface Client {
    ip: string;
    email: string[];
  }

  export default defineComponent({
    name: "ClientsOnline",
    setup() {
      const clients = ref<Client[]>([]);
      const form = ref<HTMLFormElement | null>(null);
      let intervalId: number | undefined;

      const submitForm = () => {
        if (form.value) {
          form.value.submit();
        }
      };

      const fetchClients = async () => {
        try {
          const response = await axios.get("/ext/xray-ui/clients-online.json");
          clients.value = response.data;
        } catch (error) {
          console.error("Error fetching clients:", error);
        }
      };

      onMounted(() => {
        submitForm();
        fetchClients();

        intervalId = setInterval(() => {
          submitForm();
          fetchClients();
        }, 10000);
      });

      onBeforeUnmount(() => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      });

      return {
        clients,
        form,
      };
    },
  });
</script>
