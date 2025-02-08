<template>
  <table width="100%" bordercolor="#6b8fa3" class="FormTable">
    <thead>
      <tr>
        <td colspan="2">{{ $t('components.ServerStatus.configuration') }}</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>{{ $t('components.ServerStatus.connection_status') }}</th>
        <td>
          <span class="label" :class="{ 'label-success': isRunning, 'label-error': !isRunning }"
            v-text="statusLabel"></span>
          <span v-if="!isRunning">
            <a class="button_gen button_gen_small button_info" href="#" @click.prevent="testConfig()"
              title="try to retrieve a server-side error">!</a>
          </span>
          <span class="row-buttons">
            <a class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(restart)"> {{
              $t('labels.restart') }}</a>
            <a class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(stop)"> {{ $t('labels.stop')
              }}</a>
            <input class="button_gen button_gen_small" type="button" :value="$t('labels.show_config')"
              @click.prevent="show_config_modal()" />
          </span>
          <config-modal ref="configModal"></config-modal>
        </td>
      </tr>
      <tr>
        <th>{{ $t('components.ClientStatus.general_options') }}</th>
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
import ConfigModal from "./modals/ConfigModal.vue";
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: "ServerStatus",
  components: {
    GeneralOptionsModal,
    ConfigModal
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
      return this.isRunning ? this.$t('components.ClientStatus.xray_running') : this.$t('components.ClientStatus.xray_stopped');
    }
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
    const configModal = ref();
    const manage_general_options = () => {
      generalOptionsModal.value.show();
    };
    const show_config_modal = () => {
      configModal.value.show();
    };
    return {
      config,
      configModal,
      generalOptionsModal,
      manage_general_options,
      show_config_modal
    };
  },
});
</script>
