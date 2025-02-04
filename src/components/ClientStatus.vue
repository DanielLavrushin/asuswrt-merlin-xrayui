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
          <span class="label" :class="connectionClasses" v-text="statusLabel"></span>
          <span v-if="!isRunning">
            <a class="button_gen button_gen_small button_info" href="#" @click.prevent="testConfig()" title="try to retrieve a server-side error">!</a>
          </span>
          <span :class="[' label', 'flag', 'fi', contryCodeClass]"></span>
          <span class="row-buttons">
            <a class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(reconnect)">reconnect</a>
            <a class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(stop)">stop</a>
            <a class="button_gen button_gen_small" href="/ext/xrayui/xray-config.json" target="_blank">show config</a>
          </span>
        </td>
      </tr>
      <import-config v-model:config="config"></import-config>
      <general-options v-model:config="config"></general-options>
    </tbody>
  </table>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, watch } from "vue";
  import engine, { EngineClientConnectionStatus, SubmtActions } from "../modules/Engine";
  import GeneralOptions from "./GeneralOptions.vue";
  import ImportConfig from "./ImportConfig.vue";
  import { XrayObject } from "@/modules/XrayConfig";
  import { XrayRoutingRuleObject } from "@/modules/CommonObjects";

  export default defineComponent({
    name: "ClientStatus",
    components: {
      GeneralOptions,
      ImportConfig
    },
    props: {
      config: {
        type: XrayObject,
        required: true
      }
    },
    computed: {
      statusLabel(): string {
        return !this.checkConEnabled ? (this.isRunning ? "XRAY is running " : "XRAY is stopped") : this.connectionStationLabel;
      }
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
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(action);
        });
      }
    },
    setup(props) {
      const config = ref(props.config);
      const contryCodeClass = ref<string>("flag-icon flag-icon-unknown");
      const connectionStatus = ref<boolean>(false);
      const connectionStationLabel = ref<string>("Checking connection...");
      const connectionClasses = computed(() => ({
        "label-success": isRunning.value,
        "label-error": !isRunning.value,
        "label-warning": checkConEnabled.value && !connectionStatus.value
      }));

      const isRunning = ref<boolean>(window.xray.server.isRunning);
      const checkConEnabled = ref(false);

      const checkConnection = async (): Promise<EngineClientConnectionStatus | null> => {
        const rule = config.value.routing?.rules?.find((r) => r.name === XrayRoutingRuleObject.connectionCheckRuleName);
        checkConEnabled.value = rule !== undefined;
        if (checkConEnabled.value) {
          const status = await engine.getClientConnectionStatus();
          if (status) {
            isRunning.value = window.xray.server.isRunning;
            connectionStatus.value = status.connected ?? false;
            connectionStationLabel.value = status.connected ? "XRAY is connected!" : "Checking connection...";
            contryCodeClass.value = `fi-${status.countryCode?.toLowerCase()}`;
            return status;
          }
        }
        return null;
      };

      watch(
        () => config.value.routing?.rules?.length,
        (newObj) => {
          if (newObj && newObj > 0 && isRunning.value) {
            const rule = config.value.routing?.rules?.find((r) => r.name === XrayRoutingRuleObject.connectionCheckRuleName);

            if (rule) {
              const checkConnectionInterval = setInterval(async () => {
                const result = await checkConnection();
                if (result?.connected) {
                  clearInterval(checkConnectionInterval);
                }
              }, 3000);
            }
          }
        },
        { immediate: true }
      );

      return {
        config,
        isRunning,
        connectionClasses,
        contryCodeClass,
        connectionStationLabel,
        reconnect: SubmtActions.serverStart,
        stop: SubmtActions.serverStop,
        checkConEnabled,
        checkConnection
      };
    }
  });
</script>
<style scoped>
  .FormTable td span.label.flag {
    margin-left: 5px;
  }
</style>
