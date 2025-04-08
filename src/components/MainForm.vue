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
                              <div id="formfontdesc" class="formfontdesc">{{ $t('labels.xrayui_desc') }}</div>
                              <div style="margin: 10px 0 10px 5px" class="splitLine"></div>
                              <service-status v-model:config="config"></service-status>
                              <inbounds @show-transport="show_transport" @show-sniffing="show_sniffing"></inbounds>
                              <outbounds @show-transport="show_transport"></outbounds>
                              <dns></dns>
                              <reverse-proxy></reverse-proxy>
                              <routing></routing>
                              <sniffing-modal ref="sniffingModal" />
                              <stream-settings-modal ref="transportModal" />
                              <div class="apply_gen">
                                <input class="button_gen" @click.prevent="apply_settings()" type="button" :value="$t('labels.apply')" />
                              </div>
                              <clients-online></clients-online>
                              <logs-manager ref="logsManager" v-if="config.log?.access != 'none' || config.log?.error != 'none'" v-model:logs="config.log!"></logs-manager>
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
  import { defineComponent, ref } from 'vue';
  import engine, { SubmtActions } from '@/modules/Engine';

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
      ReverseProxy
    },

    setup() {
      const config = ref(engine.xrayConfig);
      const transportModal = ref();
      const sniffingModal = ref();
      const logsManager = ref();

      const show_transport = (proxy: XrayInboundObject<IProtocolType> | XrayOutboundObject<IProtocolType>, type: string) => {
        transportModal.value.show(proxy, type);
      };

      const show_sniffing = (proxy: XrayInboundObject<IProtocolType>) => {
        sniffingModal.value.show(proxy);
      };

      const apply_settings = async () => {
        await engine.executeWithLoadingProgress(async () => {
          let cfg = engine.prepareServerConfig(config.value);
          if (logsManager.value && logsManager.value.follow) {
            logsManager.value.follow = false;
            await engine.delay(1000);
          }
          await engine.submit(SubmtActions.configurationApply, cfg);
          await engine.loadXrayConfig();
        });
      };

      return {
        logsManager,
        config,
        engine,
        transportModal,
        sniffingModal,
        version: window.xray.custom_settings.xray_version,
        page: window.location.pathname.substring(1),
        show_transport,
        show_sniffing,
        apply_settings
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
</style>
