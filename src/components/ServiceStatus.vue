<template>
  <table width="100%" class="FormTable">
    <thead>
      <tr>
        <td colspan="2">
          {{ $t('com.ClientStatus.configuration') }}
          <xray-version></xray-version>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>{{ $t('com.ClientStatus.connection_status') }}</th>
        <td>
          <span class="label" :class="connectionClasses" v-text="statusLabel"></span>
          <span v-if="!isRunning">
            <a class="button_gen button_gen_small button_info" href="#" @click.prevent="testConfig()" title="try to retrieve a server-side error">!</a>
          </span>
          <span :class="[' label', 'flag', 'fi', contryCodeClass]"></span>
          <span class="row-buttons">
            <a v-if="!isRunning" class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(connect)">{{ $t('labels.start') }} </a>
            <a v-if="isRunning" class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(reconnect)">{{ $t('labels.restart') }} </a>
            <a v-if="isRunning" class="button_gen button_gen_small" href="#" @click.prevent="handleStatus(stop)">{{ $t('labels.stop') }}</a>
            <input class="button_gen button_gen_small" type="button" :value="$t('labels.show_config')" @click.prevent="show_config_modal()" />
          </span>
          <config-modal ref="configModal" />
        </td>
      </tr>
      <profiles />
      <process-uptime />
      <import-config v-model:config="config" />
      <tr>
        <th>{{ $t('com.ClientStatus.general_options') }}</th>
        <td>
          <span class="row-buttons">
            <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage_general_options()" v-show="uiResponse?.xray" />
          </span>
          <general-options-modal ref="generalOptionsModal" v-model:config="config"></general-options-modal>
        </td>
      </tr>
      <backup />
    </tbody>
  </table>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, watch, inject, Ref, onMounted } from 'vue';
  import engine, { EngineResponseConfig, SubmitActions } from '@/modules/Engine';
  import GeneralOptionsModal from '@modal/GeneralOptionsModal.vue';
  import ImportConfig from './ImportConfig.vue';
  import { XrayObject } from '@/modules/XrayConfig';
  import { XrayRoutingRuleObject } from '@/modules/CommonObjects';
  import ConfigModal from '@modal/ConfigModal.vue';
  import axios from 'axios';
  import { useI18n } from 'vue-i18n';
  import ProcessUptime from './ProcessUptime.vue';
  import XrayVersion from './XrayVersion.vue';
  import Profiles from './Profiles.vue';
  import Backup from './Backup.vue';
  import { XrayProtocol } from '@/modules/Options';

  class IpApiResponse {
    public status?: string;
    public countryCode?: string;
    public country?: string;
    public query?: string;
    public city?: string;
    public connected?: boolean;
  }
  export default defineComponent({
    name: 'ServiceStatus',
    components: {
      GeneralOptionsModal,
      ImportConfig,
      ConfigModal,
      ProcessUptime,
      XrayVersion,
      Profiles,
      Backup
    },
    props: {
      config: {
        type: XrayObject,
        required: true
      }
    },
    computed: {
      statusLabel(): string {
        return !this.checkConEnabled ? (this.isRunning ? this.$t('com.ClientStatus.xray_running') : this.$t('com.ClientStatus.xray_stopped')) : this.connectionStationLabel;
      }
    },
    setup(props) {
      const { t } = useI18n();
      const config = ref(props.config);
      const configModal = ref();
      const generalOptionsModal = ref();
      const contryCodeClass = ref<string>('flag-icon flag-icon-unknown');
      const connectionStatus = ref<boolean>(false);
      const connectionStationLabel = ref<string>(t('com.ClientStatus.xray_running'));
      const connectionClasses = computed(() => ({
        'label-success': isRunning.value,
        'label-error': !isRunning.value,
        'label-warning': checkConEnabled.value && !connectionStatus.value
      }));

      const uiResponse = inject<Ref<EngineResponseConfig>>('uiResponse')!;

      const isRunning = ref<boolean>(window.xray.server.isRunning);
      const checkConEnabled = ref(false);

      const show_config_modal = () => {
        configModal.value.show();
      };

      const checkConnection = async (): Promise<IpApiResponse | null> => {
        const rule = config.value.routing?.rules?.find((r) => r.name === XrayRoutingRuleObject.connectionCheckRuleName);
        checkConEnabled.value = rule !== undefined;
        if (checkConEnabled.value) {
          const response = await axios.get<IpApiResponse>('http://ip-api.com/json/', {
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
              Expires: '0'
            }
          });
          const status = response.data;
          //  const status = await engine.getClientConnectionStatus();
          if (status.status === 'success') {
            status.connected = config.value.outbounds?.find((o) => o.protocol !== XrayProtocol.BLACKHOLE && o.protocol !== XrayProtocol.FREEDOM && o.settings?.isTargetAddress?.(status.query!)) !== undefined;
            isRunning.value = window.xray.server.isRunning;
            connectionStatus.value = status.connected;
            connectionStationLabel.value = status.connected ? t('com.ClientStatus.xray_connected') : t('com.ClientStatus.xray_connecting');
            contryCodeClass.value = `fi-${status.countryCode?.toLowerCase()}`;
            return status;
          }
        }
        return null;
      };

      const manage_general_options = () => {
        generalOptionsModal.value.show();
      };

      const testConfig = async () => {
        let delay = 1000;
        window.showLoading(delay);
        await engine.submit(SubmitActions.serverTestConfig, null, delay);
        let users = await engine.getXrayResponse();
        window.hideLoading();
        alert(users.xray?.test.replace(/\\"/g, '"'));
      };

      const handleStatus = async (action: string) => {
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(action);
        });
      };

      onMounted(async () => {
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
                }, 5000);
              }
            }
          },
          { immediate: true }
        );
      });

      return {
        config,
        configModal,
        isRunning,
        connectionClasses,
        contryCodeClass,
        connectionStationLabel,
        generalOptionsModal,
        connect: SubmitActions.serverStart,
        reconnect: SubmitActions.serverRestart,
        stop: SubmitActions.serverStop,
        checkConEnabled,
        uiResponse,
        checkConnection,
        show_config_modal,
        manage_general_options,
        testConfig,
        handleStatus
      };
    }
  });
</script>
<style scoped>
  .FormTable td span.label.flag {
    margin-left: 5px;
  }
</style>
