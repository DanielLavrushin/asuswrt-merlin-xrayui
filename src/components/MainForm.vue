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
                    <table width="760px" border="0" cellpadding="4" cellspacing="0" class="FormTitle">
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
                                  <tr>
                                    <th>
                                      <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'The listening address, either an IP address or a Unix domain socket. The default value is <b>0.0.0.0</b>, which means accepting connections on all network interfaces.');">The listening address</a>
                                    </th>
                                    <td>
                                      <input type="text" maxlength="15" class="input_20_table" v-model="listen" onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off" autocapitalize="off" />
                                      <span class="hint-color">default: 0.0.0.0</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Inbound Port</th>
                                    <td>
                                      <input type="text" maxlength="5" class="input_6_table" v-model="server_port1" autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
                                      -
                                      <input type="text" maxlength="5" class="input_6_table" v-model="server_port2" autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>The port allocation strategy</th>
                                    <td>
                                      <select name="xray_allocate" class="input_option" onchange="allocateChange()">
                                        <option value="always">always</option>
                                        <option value="random">random</option>
                                      </select>
                                    </td>
                                  </tr>
                                  <tr class="xray_alopt_row">
                                    <th>
                                      <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'The interval for refreshing randomly allocated ports in minutes.');">Refresh</a>
                                    </th>
                                    <td>
                                      <input type="text" maxlength="2" class="input_6_table" name="xray_allocate_refresh" onkeypress="return validator.isNumber(this,event);" value="" />
                                      <span class="hint-color">The minimum is 2, and recommended is 5</span>
                                    </td>
                                  </tr>
                                  <tr class="xray_alopt_row">
                                    <th>
                                      <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'The number of randomly allocated ports.');">Concurrency</a>
                                    </th>
                                    <td>
                                      <input type="text" maxlength="2" class="input_6_table" name="xray_allocate_concurrency" onkeypress="return validator.isNumber(this,event);" value="" />
                                      <span class="hint-color">The minimum is 1, and recommended is 3</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      Protocol
                                      <br />
                                      <i>The connection protocol name.</i>
                                    </th>
                                    <td>
                                      <select name="xray_protocol" class="input_option" onchange="protocolChange(this)">
                                        <option value="vless">vless</option>
                                        <option value="vmess">vmess</option>
                                        <option value="http">http</option>
                                        <option value="shadowsocks">shadowsocks</option>
                                        <option value="trojan">trojan</option>
                                        <option value="wireguard">wireguard</option>
                                      </select>
                                      <span class="hint-color">default: vmess</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>TLS Certificate</th>
                                    <td>
                                      <input class="button_gen" type="button" value="Renew" onclick="certificate_renew();" />
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'Traffic sniffing is mainly used in transparent proxies.');">Sniffing</a>
                                    </th>
                                    <td>
                                      <input type="radio" name="xray_sniffing" id="xray_sniffing_enabled" class="input" value="true" onchange="buildSniffing()" />
                                      <label for="xray_sniffing_enabled" class="settingvalue">Enabled</label>
                                      <input type="radio" name="xray_sniffing" id="xray_sniffing_disabled" class="input" value="false" onchange="buildSniffing()" checked />
                                      <label for="xray_sniffing_disabled" class="settingvalue">Disabled</label>
                                    </td>
                                  </tr>
                                  <tr id="xray_sniffing_metadataonly">
                                    <th>
                                      <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'When enabled, only use the connection\'s metadata to sniff the target address. ');">Metadata only</a>
                                    </th>
                                    <td>
                                      <input type="radio" name="xray_sniffing_meta" id="xray_sniffing_meta_enabled" class="input" value="true" onchange="buildSniffing()" />
                                      <label for="xray_sniffing_meta_enabled" class="settingvalue">Enabled</label>
                                      <input type="radio" name="xray_sniffing_meta" id="xray_sniffing_meta_disabled" class="input" value="false" onchange="buildSniffing()" checked />
                                      <label for="xray_sniffing_meta_disabled" class="settingvalue">Disabled</label>
                                    </td>
                                  </tr>
                                  <tr id="xray_sniffing_destoverride">
                                    <th>
                                      <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'When the traffic is of a specified type, reset the destination of the current connection to the target address included in the list.');">Destination Override</a>
                                    </th>
                                    <td>
                                      <input type="checkbox" name="xray_sniffing_do_http" id="xray_sniffing_do_http" class="input" value="http" onchange="buildSniffing()" />
                                      <label for="xray_sniffing_do_http" class="settingvalue">HTTP</label>
                                      <input type="checkbox" name="xray_sniffing_do_tls" id="xray_sniffing_do_tls" class="input" value="tls" onchange="buildSniffing()" />
                                      <label for="xray_sniffing_do_tls" class="settingvalue">TLS</label>
                                      <input type="checkbox" name="xray_sniffing_do_quic" id="xray_sniffing_do_quic" class="input" value="quic" onchange="buildSniffing()" />
                                      <label for="xray_sniffing_do_quic" class="settingvalue">QUIC</label>
                                      <input type="checkbox" name="xray_sniffing_do_fakedns" id="xray_sniffing_do_fakedns" class="input" value="fakedns" onchange="buildSniffing()" />
                                      <label for="xray_sniffing_do_fakedns" class="settingvalue">FAKEDNS</label>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'The underlying protocol of the transport used by the data stream of the connection');">Network</a>
                                    </th>
                                    <td>
                                      <select class="input_option" v-model="selectedNetwork">
                                        <option value="tcp">tcp</option>
                                        <option value="kcp">kcp</option>
                                        <option value="ws">ws</option>
                                        <option value="http">http</option>
                                        <option value="grpc">grpc</option>
                                        <option value="httpupgrade">httpupgrade</option>
                                        <option value="splithttp">splithttp</option>
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
                                      <select name="xray_security" class="input_option">
                                        <option value="none">none</option>
                                        <option value="tls">tls</option>
                                        <option value="reality">reality</option>
                                      </select>
                                      <span class="hint-color">default: none</span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div id="divApply" class="apply_gen">
                              <input class="button_gen" @click.prevent="applyServerSettings()" type="button" value="Apply" />
                            </div>
                            <clients :clients="serverConfig.inbounds[0].settings?.clients"></clients>
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
  import { defineComponent, inject, computed, ref } from "vue";
  import MainMenu from "./MainMenu.vue";
  import TabMenu from "./asus/TabMenu.vue";
  import SubMenu from "./asus/SubMenu.vue";
  import Clients from "./Clients.vue";
  import ClientsOnline from "./ClientsOnline.vue";
  import ServerStatus from "./ServerStatus.vue";

  import NetworkKcp from "./transport/Kcp.vue";
  import NetworkTcp from "./transport/Tcp.vue";

  import XrayObject from "../modules/XrayConfig";

  export default defineComponent({
    name: "MainForm",
    components: {
      NetworkKcp,
      NetworkTcp,
      TabMenu,
      MainMenu,
      SubMenu,
      Clients,
      ServerStatus,
      ClientsOnline,
    },
    setup() {
      const selectedNetwork = ref("tcp");
      const networkConfig = ref({
        acceptProxy: false,
        mtu: 1350,
      });

      const networkComponent = computed(() => {
        switch (selectedNetwork.value) {
          case "tcp":
            return NetworkTcp;
          case "kcp":
            return NetworkKcp;
          default:
            return null;
        }
      });

      const serverConfig = inject("serverConfig") as XrayObject;
      const listen = computed({
        get() {
          if (serverConfig.inbounds?.[0]?.listen) {
            return serverConfig.inbounds?.[0]?.listen;
          }
          return "0.0.0.0";
        },
        set(value: string) {
          serverConfig.inbounds[0].listen == value;
        },
      });

      const server_port1 = computed({
        get() {
          if (serverConfig.inbounds?.[0]?.port) {
            let port = `${serverConfig.inbounds[0].port}`.split("-");
            return parseInt(port[0], 10);
          }
          return 1080;
        },
        set(value: number) {
          if (serverConfig.inbounds?.[0]) {
            const port2 = server_port2.value;
            if (value === port2) {
              serverConfig.inbounds[0].port == `${value}`;
            } else {
              serverConfig.inbounds[0].port = `${value}-${port2}`;
            }
          }
        },
      });

      const server_port2 = computed({
        get() {
          if (serverConfig.inbounds?.[0]?.port) {
            let port = `${serverConfig.inbounds[0].port}`.split("-");
            return parseInt(port[1] || port[0], 10);
          }
          return 1080;
        },
        set(value: number) {
          if (serverConfig.inbounds?.[0]) {
            const port1 = server_port1.value;
            if (port1 === value) {
              serverConfig.inbounds[0].port = `${port1}`;
            } else {
              serverConfig.inbounds[0].port = `${port1}-${value}`;
            }
          }
        },
      });

      const applyServerSettings = () => {
        console.log("Server config", serverConfig.inbounds[0].port);
      };

      const xray_ui_page = window.xray.custom_settings.xray_ui_page;

      return {
        listen: listen,
        server_port1,
        server_port2,
        xray_ui_page,
        serverConfig,
        selectedNetwork,
        networkConfig,
        networkComponent,
        applyServerSettings,
      };
    },
  });
</script>
