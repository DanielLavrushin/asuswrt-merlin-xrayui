<template>
  <form method="post" name="form" id="ruleForm" action="/start_apply.htm" target="hidden_frame">
    <input type="hidden" name="current_page" :value="page" />
    <input type="hidden" name="next_page" :value="page" />
    <input type="hidden" name="group_id" value="" />
    <input type="hidden" name="modified" value="0" />
    <input type="hidden" name="action_mode" value="apply" />
    <input type="hidden" name="action_wait" value="5" />
    <input type="hidden" name="first_time" value="" />
    <input type="hidden" name="action_script" value="" />
    <input type="hidden" name="amng_custom" value="" />
    <table class="content" align="center" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td width="17">&nbsp;</td>
          <td valign="top" width="202">
            <main-menu></main-menu>
            <sub-menu></sub-menu>
          </td>
          <td valign="top">
            <tab-menu></tab-menu>
            <table width="98%" border="0" align="left" cellpadding="0" cellspacing="0">
              <tbody>
                <tr>
                  <td valign="top">
                    <table width="760px" border="0" cellpadding="4" cellspacing="0" id="FormTitle" class="FormTitle">
                      <tbody>
                        <tr bgcolor="#4D595D">
                          <td valign="top">
                            <div class="formfontdesc">
                              <div>&nbsp;</div>
                              <div class="formfonttitle" style="text-align: left">X-RAY UI v{{ version }}</div>
                              <div class="mode-group">
                                <div @click="set_mode('advanced')" :class="{ active: mode === 'advanced' }">advanced</div>
                                <div @click="set_mode('simple')" :class="{ active: mode === 'simple' }">simple</div>
                              </div>
                              <div id="formfontdesc" class="formfontdesc">{{ $t('labels.xrayui_desc') }}</div>
                              <div style="margin: 10px 0 10px 5px" class="splitLine"></div>
                              <service-status v-model:config="config"></service-status>
                              <simple-mode v-if="isSimple" :config="config" @show-sniffing="show_sniffing"></simple-mode>
                              <inbounds v-if="isAdvanced" @show-transport="show_transport" @show-sniffing="show_sniffing"></inbounds>
                              <outbounds v-if="isAdvanced" @show-transport="show_transport"></outbounds>
                              <dns v-if="isAdvanced"></dns>
                              <reverse-proxy v-if="isAdvanced"></reverse-proxy>
                              <routing v-if="isAdvanced"></routing>
                              <sniffing-modal ref="sniffingModal" />
                              <stream-settings-modal ref="transportModal" />
                              <div class="apply_gen">
                                <input class="button_gen" @click.prevent="apply_settings()" type="button" :value="$t('labels.apply')" />
                              </div>
                              <clients-online v-if="isAdvanced && enableClientsCheck"></clients-online>
                              <logs-manager
                                ref="logsManager"
                                v-if="isAdvanced && (config.log?.access != 'none' || config.log?.error != 'none')"
                                v-model:logs="config.log!"
                              ></logs-manager>
                              <version></version>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </form>
</template>

<script lang="ts">
  import { computed, defineComponent, inject, Ref, ref, watch } from 'vue';
  import engine, { EngineResponseConfig, SubmitActions } from '@/modules/Engine';

  import Modal from '@main/Modal.vue';

  import { IProtocolType } from '@/modules/Interfaces';
  import { XrayInboundObject } from '@/modules/InboundObjects';
  import { XrayOutboundObject } from '@/modules/OutboundObjects';

  import ServiceStatus from './ServiceStatus.vue';
  import Inbounds from './Inbounds.vue';
  import Outbounds from './Outbounds.vue';
  import Routing from './Routing.vue';
  import Dns from './Dns.vue';
  import Version from './Version.vue';
  import ClientsOnline from './ClientsOnline.vue';
  import ReverseProxy from './ReverseProxy.vue';

  import SniffingModal from '@modal/SniffingModal.vue';
  import StreamSettingsModal from '@modal/StreamSettingsModal.vue';
  import LogsManager from './Logs.vue';
  import MainMenu from './asus/MainMenu.vue';
  import TabMenu from './asus/TabMenu.vue';
  import SubMenu from './asus/SubMenu.vue';
  import SimpleMode from './SimpleMode.vue';

  export default defineComponent({
    name: 'MainForm',
    components: {
      TabMenu,
      MainMenu,
      SubMenu,
      Modal,
      Routing,
      Inbounds,
      Dns,
      Version,
      Outbounds,
      ServiceStatus,
      SniffingModal,
      ClientsOnline,
      StreamSettingsModal,
      LogsManager,
      ReverseProxy,
      SimpleMode
    },

    setup() {
      const config = ref(engine.xrayConfig);
      const transportModal = ref();
      const sniffingModal = ref();
      const logsManager = ref();
      const enableClientsCheck = ref<boolean>(false);
      const mode = ref<string>(engine.getCookie('xrayui_mode') || 'advanced');
      const isAdvanced = computed(() => mode.value === 'advanced');
      const isSimple = computed(() => mode.value === 'simple');
      const uiResponse = inject<Ref<EngineResponseConfig>>('uiResponse')!;
      watch(
        () => uiResponse?.value,
        (newVal) => {
          if (!newVal) return;
          if (newVal?.xray) {
            enableClientsCheck.value = newVal.xray.clients_check;
          }
        },
        { immediate: true }
      );

      const show_transport = (proxy: XrayInboundObject<IProtocolType> | XrayOutboundObject<IProtocolType>, type: string) => {
        transportModal.value.show(proxy, type);
      };

      const show_sniffing = (proxy: XrayInboundObject<IProtocolType>) => {
        sniffingModal.value.show(proxy);
      };

      const apply_settings = async () => {
        if (logsManager.value?.follow) {
          logsManager.value.follow = false;
          window.showLoading(6000);
        }

        await engine.executeWithLoadingProgress(async () => {
          const cfg = engine.prepareServerConfig(config.value);
          await engine.submit(SubmitActions.configurationApply, cfg);
          await engine.loadXrayConfig();
        });
      };

      const set_mode = (newMode: string) => {
        engine.setCookie('xrayui_mode', newMode);
        mode.value = newMode;
      };

      return {
        logsManager,
        enableClientsCheck,
        config,
        engine,
        transportModal,
        sniffingModal,
        version: window.xray.custom_settings.xray_version,
        page: window.location.pathname.substring(1),
        mode,
        isAdvanced,
        isSimple,
        show_transport,
        show_sniffing,
        apply_settings,
        set_mode
      };
    }
  });
</script>
<style lang="scss">
  .apply_gen {
    margin-bottom: 10px;
  }
  .FormTable {
    tr.proxy-row th {
      font-weight: bold;
    }

    tr.proxy-row:hover th {
      text-shadow: 2px 2px 25px $c_yellow;
    }

    tr.proxy-row:hover > :last-child {
      border-right-color: $c_yellow;
    }

    tr.proxy-row:hover > * {
      border-left-color: $c_yellow;
    }
  }
  .mode-group {
    margin-top: -40px;
    float: right;
    & > div {
      cursor: pointer;
      background: linear-gradient(to bottom, #758084 0%, #546166 36%, #394245 100%);
      border-color: #222728;
      border-width: 1px;
      border-style: solid;
      text-align: center;
      color: #cccccc;
      font-size: 14px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    & > div:first-child {
      width: 110px;
      height: 30px;
      float: left;
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }
    & > div:last-child {
      width: 110px;
      height: 30px;
      float: left;
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
    }

    & > div.active {
      background: unset;
      background-color: #353d40;
      color: white;
    }
  }
</style>
