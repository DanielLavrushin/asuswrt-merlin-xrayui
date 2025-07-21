<template>
  <div class="formfontdesc" v-if="enable_check()">
    <table class="FormTable SettingsTable tableApi_table">
      <thead>
        <tr>
          <td colspan="3">{{ $t('com.ClientsOnline.title') }}</td>
        </tr>
      </thead>
      <tbody>
        <tr class="row_title">
          <th>{{ $t('com.ClientsOnline.label_ip') }}</th>
          <th>{{ $t('com.ClientsOnline.label_client') }}</th>
        </tr>
        <tr v-for="client in clients" :key="client.ip" class="data_tr">
          <td>
            <span class="label label-success">{{ $t('com.ClientsOnline.online') }}</span>
            {{ client.ip }}
          </td>
          <td>{{ client.email.filter((email) => email).join(', ') }}</td>
        </tr>
        <tr v-if="!clients.length" class="data_tr">
          <td colspan="3" style="color: #ffcc00">{{ $t('com.ClientsOnline.noone_is_online') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from 'vue';
  import axios from 'axios';
  import engine, { SubmitActions } from '@/modules/Engine';
  import xrayConfig from '@/modules/XrayConfig';
  import { XrayProtocol } from '@/modules/Options';

  interface Client {
    ip: string;
    email: string[];
  }

  export default defineComponent({
    name: 'ClientsOnline',
    setup() {
      const clients = ref<Client[]>([]);
      let pollTimeout: number | null = null;

      // Determines if the component should continue polling.
      const enable_check = () =>
        xrayConfig.inbounds?.some(
          (o) => !o.tag?.startsWith('sys:') && o.protocol !== XrayProtocol.FREEDOM && o.protocol !== XrayProtocol.DOKODEMODOOR && o.protocol !== XrayProtocol.BLACKHOLE
        ) ?? false;

      // Fetch client data from the server.
      const fetchClients = async () => {
        try {
          const response = await axios.get('/ext/xrayui/clients-online.json');
          clients.value = response.data;
        } catch (error) {
          console.warn('Error fetching clients:', error);
        }
      };

      const pollClients = async () => {
        if (!enable_check()) {
          pollTimeout = window.setTimeout(pollClients, 3000);
          return;
        }

        try {
          await engine.submit(SubmitActions.clientsOnline);
          await fetchClients();
        } catch (error) {
          console.error('Error during polling:', error);
        } finally {
          pollTimeout = window.setTimeout(pollClients, 3000);
        }
      };

      onMounted(async () => {
        try {
          await engine.submit(SubmitActions.clientsOnline);
          await fetchClients();
        } catch (error) {
          console.error('Error during initial fetch:', error);
        }
        pollClients();
      });

      onBeforeUnmount(() => {
        if (pollTimeout !== null) {
          clearTimeout(pollTimeout);
        }
      });

      return {
        clients,
        enable_check
      };
    }
  });
</script>
