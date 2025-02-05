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
      <tr>
        <th>General options</th>
        <td>
          <span class="row-buttons">
            <input class="button_gen button_gen_small" type="button" value="manage"
              @click.prevent="manage_general_options()" />
          </span>
          <general-options-modal ref="generalOptionsModal" v-model:config="config"></general-options-modal>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import engine, { SubmtActions } from "../modules/Engine";
import GeneralOptionsModal from "./modals/GeneralOptionsModal.vue";
import { XrayObject } from "@/modules/XrayConfig";

export default defineComponent({
  name: "ServerStatus",
  components: {
    GeneralOptionsModal,
  },
  data() {
    return {
      isRunning: window.xray.server.isRunning,
      restart: SubmtActions.serverRestart,
      stop: SubmtActions.serverStop,
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
      await engine.submit(SubmtActions.serverTestConfig, null, delay);
      let users = await engine.getXrayResponse();
      window.hideLoading();
      alert(users.xray?.test);

    },
    async handleStatus(action: string) {
      await engine.executeWithLoadingProgress(async () => {
        await engine.submit(action);
      });
    },
  },
  props: {
    config: {
      type: XrayObject,
      required: true,
    }
  },
  setup(props) {
    const config = ref(props.config);
    const generalOptionsModal = ref();
    const manage_general_options = () => {
      generalOptionsModal.value.show();
    };

    return {
      config,
      generalOptionsModal,
      manage_general_options
    };
  },
});
</script>
