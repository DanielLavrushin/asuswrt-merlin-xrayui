<template>
  <form method="post" name="form" id="ruleForm" action="/start_apply.htm" target="hidden_frame">
    <input type="hidden" name="current_page" :value="xray_ui_page" />
    <input type="hidden" name="next_page" :value="xray_ui_page" />
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
                              <div class="formfonttitle" id="scripttitle" style="text-align: center">X-RAY Core</div>
                              <div id="formfontdesc" class="formfontdesc">This UI control page provides a simple interface to manage and monitor the X-ray Core's configuration and it's status.</div>
                              <div style="margin: 10px 0 10px 5px" class="splitLine"></div>
                              <table width="100%" bordercolor="#6b8fa3" class="FormTable">
                                <thead>
                                  <tr>
                                    <td colspan="2">Configuration</td>
                                  </tr>
                                </thead>
                                <tbody>
                                  <server-status></server-status>
                                  <ports></ports>
                                  <tr>
                                    <th>Protocol</th>
                                    <td>
                                      <select v-model="inbound.protocol" class="input_option">
                                        <option v-for="protocol in protocols" :key="protocol" :value="protocol">
                                          {{ protocol }}
                                        </option> 'ftgv '
                                      </select>
                                      <span class="hint-color">default: vmess</span>
                                    </td>
                                  </tr>
                                  <sniffing></sniffing>
                                  <tr>
                                    <th>
                                      <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'The underlying protocol of the transport used by the data stream of the connection');">Network</a>
                                    </th>
                                    <td>
                                      <select class="input_option" v-model="inbound.streamSettings.network">
                                        <option v-for="network in networks" :key="network" :value="network">
                                          {{ network }}
                                        </option>
                                      </select>
                                      <span class="hint-color">default: tcp</span>
                                    </td>
                                  </tr>
                                  <component :is="networkComponent" :config="networkConfig" />
                                  <tr>
                                    <th>
                                      <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'Whether to enable transport layer encryption. ');">Security</a>
                                    </th>
                                    <td>
                                      <select class="input_option" v-model="inbound.streamSettings.security">
                                        <template v-for="opt in securities">
                                          <option :key="opt" :value="opt" v-if="validateAvailableSecurity(opt)">
                                            {{ opt.toUpperCase() }}
                                          </option>
                                        </template>
                                      </select>
                                      <span class="hint-color">default: none</span>
                                    </td>
                                  </tr>
                                  <component :is="securityComponent" />
                                </tbody>
                              </table>
                            </div>
                            <div id="divApply" class="apply_gen">
                              <input class="button_gen" @click.prevent="applyServerSettings()" type="button" value="Apply" />
                            </div>
                            <clients></clients>
                            <clients-online></clients-online>
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
  import { defineComponent, computed, ref, watch, onMounted } from "vue";

  import MainMenu from "./asus/MainMenu.vue";
  import TabMenu from "./asus/TabMenu.vue";
  import SubMenu from "./asus/SubMenu.vue";

  import Ports from "./Ports.vue";
  import Clients from "./Clients.vue";
  import ClientsOnline from "./ClientsOnline.vue";
  import ServerStatus from "./ServerStatus.vue";
  import Sniffing from "./Sniffing.vue";

  import NetworkKcp from "./transport/Kcp.vue";
  import NetworkTcp from "./transport/Tcp.vue";

  import SecurityTls from "./security/Tls.vue";
  import SecurityReality from "./security/Reality.vue";

  import engine from "../modules/Engine";
  import xrayConfig, { XrayInboundObject, XrayStreamSettingsObject } from "../modules/XrayConfig";

  export default defineComponent({
    name: "MainForm",
    components: {
      Ports,
      Sniffing,
      NetworkKcp,
      NetworkTcp,
      TabMenu,
      MainMenu,
      SubMenu,
      Clients,
      ServerStatus,
      ClientsOnline,
      SecurityTls,
      SecurityReality,
    },
    methods: {
      validateAvailableSecurity(opt: string): boolean {
        switch (opt) {
          case "reality":
            let isVless = this.xrayConfig.inbounds[0].protocol === "vless";
            if (!isVless && this.xrayConfig.inbounds[0].streamSettings.security === opt) {
              this.xrayConfig.inbounds[0].streamSettings.security = "none";
            }
            return isVless;
        }
        return true;
      },
      applyServerSettings(): void {
        console.log(this.xrayConfig);
      },
    },
    setup() {
      const inbound = ref<XrayInboundObject>(xrayConfig.inbounds?.[0] ?? new XrayInboundObject());

      const networkConfig = ref({
        acceptProxy: false,
        mtu: 1200,
      });

      const networkComponent = computed(() => {
        switch (inbound.value.streamSettings.network) {
          case "tcp":
            return NetworkTcp;
          case "kcp":
            return NetworkKcp;
          default:
            return null;
        }
      });

      const securityComponent = computed(() => {
        switch (inbound.value.streamSettings.security) {
          case "tls":
            return SecurityTls;
          case "reality":
            return SecurityReality;
          default:
            return null;
        }
      });

      watch(
        () => xrayConfig.inbounds?.[0],
        (newObj) => {
          inbound.value = newObj ?? new XrayInboundObject();
          engine.validateInbound(newObj);
        },
        { immediate: true }
      );

      return {
        networks: XrayStreamSettingsObject.networkOptions,
        securities: XrayStreamSettingsObject.securityOptions,
        protocols: XrayInboundObject.protocols,
        xrayConfig,
        inbound,
        networkConfig,
        networkComponent,
        securityComponent,
        xray_ui_page: window.xray.custom_settings.xray_ui_page,
      };
    },
  });
</script>
