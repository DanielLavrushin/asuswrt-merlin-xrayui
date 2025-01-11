<template>
  <table width="100%" bordercolor="#6b8fa3" class="FormTable">
    <thead>
      <tr>
        <td colspan="2">Configuration</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>Server Status</th>
        <td>
          <span class="label" :class="{ 'label-success': isRunning, 'label-error': !isRunning }"
            v-text="statusLabel"></span>
          <span v-if="!isRunning">
            <a class="button_gen button_gen_small button_info" href="#" @click.prevent="testConfig()"
              title="try to retrieve a server-side error">!</a>
          </span>
          <span class="row-buttons">
            <a class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(restart)">Restart</a>
            <a class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(stop)">Stop</a>
            <a class="button_gen button_gen_small" href="/ext/xrayui/xray-config.json" target="_blank">Show config</a>
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
  name: "ServerStatus",
  data() {
    return {
      isRunning: window.xray.server.isRunning,
      restart: window.xray.commands.serverRestart,
      stop: window.xray.commands.serverStop,
    };
  },
  computed: {
    statusLabel(): string {
      return this.isRunning ? "is up & running" : "stopped";
    },
  },
  methods: {
    async testConfig() {
      let delay = 1000;
      window.showLoading(delay);
      await engine.submit(window.xray.commands.testConfig, null, delay);
      let usres = await engine.getEngineConfig();
      window.hideLoading();
      alert(usres.xray?.test);

    },
    async handleStatus(action: string) {
      let delay = 5000;
      window.showLoading(delay, "waiting");
      await engine.submit(action, null, delay);
      window.location.reload();
    },
  },
  mounted() { },
});
</script>
