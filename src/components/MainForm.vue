<template>
  <form method="post" name="form" id="ruleForm" action="/start_apply.htm" target="hidden_frame">
    <input type="hidden" name="current_page" :value="xray_page" />
    <input type="hidden" name="next_page" :value="xray_page" />
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
                              <div class="xray_type_switches">
                                <div class="xray_type_switch left" :class="{ selected: engine.mode === 'server' }" @click.prevent="switch_type('server')">
                                  <div>{{ $t("labels.server") }}</div>
                                </div>
                                <div class="xray_type_switch right" :class="{ selected: engine.mode === 'client' }" @click.prevent="switch_type('client')">
                                  <div>{{ $t("labels.client") }}</div>
                                </div>
                              </div>
                              <div id="formfontdesc" class="formfontdesc">{{ $t("labels.xrayui_desc") }}</div>
                              <div style="margin: 10px 0 10px 5px" class="splitLine"></div>
                              <server-status v-if="engine.mode == 'server'" v-model:config="config"></server-status>
                              <client-status v-if="engine.mode == 'client'" v-model:config="config"></client-status>
                              <inbounds @show-transport="show_transport" @show-sniffing="show_sniffing"></inbounds>
                              <outbounds @show-transport="show_transport"></outbounds>
                              <dns></dns>
                              <routing></routing>
                              <sniffing-modal ref="sniffingModal" />
                              <stream-settings-modal ref="transportModal" />
                              <div class="apply_gen">
                                <input class="button_gen" @click.prevent="apply_settings()" type="button" :value="$t('labels.apply')" />
                              </div>
                              <clients-online v-if="engine.mode == 'server'"></clients-online>
                              <logs-manager v-if="config.log" v-model:logs="config.log"></logs-manager>
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
  import { defineComponent, ref } from "vue";
  import engine, { SubmtActions } from "../modules/Engine";

  import Modal from "./Modal.vue";

  import { IProtocolType } from "../modules/Interfaces";
  import { XrayInboundObject } from "../modules/InboundObjects";
  import { XrayOutboundObject } from "../modules/OutboundObjects";

  import ServerStatus from "./ServerStatus.vue";
  import ClientStatus from "./ClientStatus.vue";
  import Inbounds from "./Inbounds.vue";
  import Outbounds from "./Outbounds.vue";
  import Routing from "./Routing.vue";
  import Dns from "./Dns.vue";
  import Version from "./Version.vue";
  import ClientsOnline from "./ClientsOnline.vue";

  import SniffingModal from "./modals/SniffingModal.vue";
  import StreamSettingsModal from "./modals/StreamSettingsModal.vue";
  import LogsManager from "./Logs.vue";
  import MainMenu from "./asus/MainMenu.vue";
  import TabMenu from "./asus/TabMenu.vue";
  import SubMenu from "./asus/SubMenu.vue";

  export default defineComponent({
    name: "MainForm",
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
      ServerStatus,
      ClientStatus,
      SniffingModal,
      ClientsOnline,
      StreamSettingsModal,
      LogsManager
    },
    methods: {},

    setup() {
      const config = ref(engine.xrayConfig);
      const transportModal = ref();
      const sniffingModal = ref();
      const switch_type = async (type: string) => {
        engine.mode = type;
        let delay = 1000;
        window.showLoading(delay);
        window.xray.custom_settings.xray_mode = type;
        await engine.submit(SubmtActions.configurationSetMode, { mode: type }, delay);
        window.location.reload();
      };
      const show_transport = (proxy: XrayInboundObject<IProtocolType> | XrayOutboundObject<IProtocolType>, type: string) => {
        console.log("show_transport", proxy, type);
        transportModal.value.show(proxy, type);
      };

      const show_sniffing = (proxy: XrayInboundObject<IProtocolType>) => {
        sniffingModal.value.show(proxy);
      };

      const apply_settings = async () => {
        await engine.executeWithLoadingProgress(async () => {
          let cfg = engine.prepareServerConfig(config.value);
          await engine.submit(SubmtActions.configurationApply, cfg);
          await engine.loadXrayConfig();
        });
      };

      return {
        config,
        engine,
        transportModal,
        sniffingModal,
        version: window.xray.custom_settings.xray_version,
        xray_page: window.xray.custom_settings.xray_page,
        switch_type,
        show_transport,
        show_sniffing,
        apply_settings
      };
    }
  });
</script>
<style scoped>
  .xray_type_switches {
    margin-top: -40px;
    float: right;
  }

  .xray_type_switch {
    cursor: pointer;
    width: 110px;
    height: 30px;
    float: left;
    background: linear-gradient(to bottom, #758084 0%, #546166 36%, #394245 100%);
    border-color: #222728;
    border-width: 1px;
    border-style: solid;
  }

  .xray_type_switch.left {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }

  .xray_type_switch.right {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  .xray_type_switch.selected {
    background: none;
    background-color: #353d40;
    border-color: #222728;
    border-width: 1px;
    border-style: inset;
  }

  .xray_type_switch.selected div {
    color: #ffffff;
    font-weight: bold;
  }

  .xray_type_switch div {
    text-align: center;
    color: #cccccc;
    font-size: 14px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .apply_gen {
    margin-bottom: 10px;
  }
</style>
<style>
  .FormTable tr.proxy-row th {
    font-weight: bold;
  }

  .FormTable tr.proxy-row:hover th {
    text-shadow: 2px 2px 25px #fc0;
  }

  .FormTable tr.proxy-row:hover > :last-child {
    border-right-color: #fc0;
  }

  .FormTable tr.proxy-row:hover > * {
    border-left-color: #fc0;
  }
</style>
