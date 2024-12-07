<template>
  <table width="100%" bordercolor="#6b8fa3" class="FormTable">
    <thead>
      <tr>
        <td colspan="2">Configuration</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>Connection Status</th>
        <td>
          <span class="label" :class="{ 'label-success': isRunning, 'label-error': !isRunning }"
            v-text="statusLabel"></span>
          <span class="row-buttons">
            <a class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(reconnect)">Reconnect</a>
            <a class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(stop)">Stop</a>
            <a class="button_gen button_gen_small" href="/ext/xray-ui/xray-config.json" target="_blank">Show
              config</a>
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import engine from "../modules/Engine";

export default defineComponent({
  name: "ClientStatus",
  data() {
    return {
      isRunning: window.xray.server.isRunning,
      reconnect: window.xray.commands.serverRestart,
      stop: window.xray.commands.serverStop,
    };
  },
  computed: {
    statusLabel(): string {
      return this.isRunning ? "Connected" : "Disconnected";
    },
  },
  methods: {
    async handleStatus(action: string) {
      let delay = 2000;
      window.showLoading(delay / 1000);
      await engine.submit(action, null, delay);
      window.location.reload();
    },
  },
  mounted() { },
});
</script>
