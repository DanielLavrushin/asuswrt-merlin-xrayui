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
          <span v-if="!isRunning">
            <a class="button_gen button_gen_small button_info" href="#" @click.prevent="testConfig()"
              title="try to retrieve a server-side error">!</a>
          </span>
          <span class="row-buttons">
            <a class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(reconnect)">reconnect</a>
            <a class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(stop)">stop</a>
            <a class="button_gen button_gen_small" href="/ext/xrayui/xray-config.json" target="_blank">show config</a>
          </span>
        </td>
      </tr>
      <import-config v-model:config="config"></import-config>
      <startup-control></startup-control>
    </tbody>
  </table>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import engine, { SubmtActions } from "../modules/Engine";
import StartupControl from "./StartupControl.vue";
import ImportConfig from "./ImportConfig.vue";
import { XrayObject } from "@/modules/XrayConfig";

export default defineComponent({
  name: "ClientStatus",
  components: {
    StartupControl,
    ImportConfig,
  },
  data() {
    return {
      isRunning: window.xray.server.isRunning,
      reconnect: SubmtActions.serverRestart,
      stop: SubmtActions.serverStop,
    };
  },
  props: {
    config: {
      type: XrayObject,
      required: true,
    }
  },
  computed: {
    statusLabel(): string {
      return this.isRunning ? "Connected" : "Disconnected";
    },
  },
  methods: {
    async testConfig() {
      let delay = 1000;
      window.showLoading(delay);
      await engine.submit(SubmtActions.serverTestConfig, null, delay);
      let users = await engine.getXrayResponse();
      window.hideLoading();
      alert(users.xray?.test.replace(/\\"/g, '"'));

    },
    async handleStatus(action: string) {
      let delay = 7000;
      window.showLoading(delay, "waiting");
      await engine.submit(action, null, delay);
      window.location.reload();
    },
  },
  setup(props) {
    const config = ref(props.config);

    return { config };
  },
});
</script>
