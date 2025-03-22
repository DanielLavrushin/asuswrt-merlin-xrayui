<template>
  <div class="formfontdesc" v-if="enable_check()">
    <table class="FormTable SettingsTable tableApi_table">
      <thead>
        <tr>
          <td colspan="3">Clients Online</td>
        </tr>
      </thead>
      <tbody v-if="logsEnabled">
        <tr class="row_title">
          <th>Ip</th>
          <th>Client</th>
        </tr>
        <tr v-for="client in clients" :key="client.ip" class="data_tr">
          <td><span class="label label-success">online</span> {{ client.ip }}</td>
          <td>{{ client.email.filter((email) => email).join(", ") }}</td>
        </tr>
        <tr v-if="!clients.length" class="data_tr">
          <td colspan="3" style="color: #ffcc00">No one is online</td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr class="data_tr">
          <td colspan="3" style="color: #ffcc00">
            To check online users, xray logging must be enabled. Would you like to enable it?
            <br />
            <input class="button_gen button_gen_small" type="button" value="enable logs" @click.prevent="enable_logs" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from "vue";
  import axios from "axios";
  import engine, { SubmtActions } from "../modules/Engine";
  import xrayConfig from "@/modules/XrayConfig";
  import { XrayProtocol } from "@/modules/Options";

  interface Client {
    ip: string;
    email: string[];
  }

  export default defineComponent({
    name: "ClientsOnline",
    setup() {
      const clients = ref<Client[]>([]);
      let pollTimeout: number | null = null;

      const fetchClients = async () => {
        try {
          const response = await axios.get("/ext/xrayui/clients-online.json");
          clients.value = response.data;
        } catch (error) {
          console.warn("Error fetching clients:", error);
        }
      };

      const logsEnabled = ref(false);

      const enable_logs = async () => {
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmtActions.enableLogs);
        });
      };

      const pollClients = async () => {
        if (!enable_check()) {
          return;
        }
        await engine.submit(SubmtActions.clientsOnline);
        await fetchClients();
        pollTimeout = window.setTimeout(pollClients, 3000);
      };

      onMounted(async () => {
        await engine.submit(SubmtActions.clientsOnline);
        await fetchClients();
        pollClients();
      });

      watch(
        () => xrayConfig.log,
        (logs) => {
          logsEnabled.value = logs !== undefined;
        },
        { immediate: true }
      );

      onBeforeUnmount(() => {
        if (pollTimeout !== null) {
          clearTimeout(pollTimeout);
        }
      });

      const enable_check = () => {
        const proxy = xrayConfig.inbounds?.find((o) => !o.tag?.startsWith("sys:") && o.protocol !== XrayProtocol.FREEDOM && o.protocol !== XrayProtocol.DOKODEMODOOR && o.protocol !== XrayProtocol.BLACKHOLE);
        return proxy !== undefined;
      };

      return {
        logsEnabled,
        clients,
        enable_logs,
        enable_check
      };
    }
  });
</script>
