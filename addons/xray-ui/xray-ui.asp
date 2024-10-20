<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="-1" />
    <link rel="shortcut icon" href="images/favicon.png" />
    <link rel="icon" href="images/favicon.png" />
    <title>X-RAY Server</title>
    <link rel="stylesheet" type="text/css" href="index_style.css" />
    <link rel="stylesheet" type="text/css" href="form_style.css" />
    <link rel="stylesheet" type="text/css" href="/js/table/table.css" />

    <script language="JavaScript" type="text/javascript" src="/js/jquery.js"></script>
    <script language="JavaScript" type="text/javascript" src="/js/httpApi.js"></script>
    <script language="JavaScript" type="text/javascript" src="/state.js"></script>
    <script language="JavaScript" type="text/javascript" src="/general.js"></script>
    <script language="JavaScript" type="text/javascript" src="/popup.js"></script>
    <script language="JavaScript" type="text/javascript" src="/help.js"></script>
    <script language="JavaScript" type="text/javascript" src="/tmhist.js"></script>
    <script language="JavaScript" type="text/javascript" src="/tmmenu.js"></script>
    <script language="JavaScript" type="text/javascript" src="/client_function.js"></script>
    <script language="JavaScript" type="text/javascript" src="/validator.js"></script>
    <script type="text/javascript" src="/switcherplugin/jquery.iphone-switch.js"></script>
    <script>
      var xray = {
        server: {
          isRunning: parseInt('<% sysinfo("pid.xray"); %>') > 0,
        },
        client: { isRunning: false },
        commands: {
          refreshConfig: "xrayui_refreshconfig",
          serverStart: "xrayui_serverstatus_start",
          serverRestart: "xrayui_serverstatus_restart",
          serverStop: "xrayui_serverstatus_stop",
          clientDelete: "xrayui_client_delete",
          clientAdd: "xrayui_client_add",
        },
        isEnabled: false,
      };

      var custom_settings;

      function uuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => ((Math.random() * 16) | 0).toString(16));
      }

      function loadCustomSettings() {
        try {
          custom_settings = JSON.parse(`<% get_custom_settings(); %>`);
        } catch (e) {
          console.error("Error parsing custom settings:", e);
        }
      }

      function loadXraySettings() {
        if (custom_settings) {
          xray.isEnabled = custom_settings.xray_enable == "true";
        }
      }

      function initial() {
        setCurrentPage();
        show_menu();
        loadCustomSettings();
        loadXraySettings();
        checkServerStatus();
        refreshConfig();
      }

      function refreshConfig() {
        submitForm(xray.commands.refreshConfig, null, 1);
        setTimeout(load_xray_config, 1e3);
      }

      function load_xray_config() {
        $.ajax({
          url: "/ext/xray-ui/xray-config.json",
          dataType: "json",
          error: function (e) {
            console.error("Error loading xray-config.json", e);
          },
          success: function (json) {
            xray.config = json;
            config_to_form();
            hideLoading();
          },
        });
      }

      function submitForm(action, payload, wait = 0) {
        form = document.formScriptActions;
        form.action_wait.value = wait;
        showLoading();
        let amngCustomField;
        if (payload) {
          for (var prop in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, prop)) {
              custom_settings[prop] = payload[prop];
            }
          }

          form.amng_custom.value = JSON.stringify(custom_settings);
        } else {
          amngCustomField = form.amng_custom;
          if (amngCustomField) {
            amngCustomField = amngCustomField.parentNode.removeChild(amngCustomField);
          }
        }
        form.action_script.value = action;
        form.submit();
        if (!payload && amngCustomField) {
          form.appendChild(amngCustomField);
        }
      }

      function config_to_form() {
        document.form.xray_clients_add_id.value = uuid();
        let inbounds = xray.config.inbounds[0];
        let outbounds = xray.config.outbounds[0];
        let snif_do_row = document.getElementById("xray_sniffing_destoverride");
        let snif_meta_row = document.getElementById("xray_sniffing_metadataonly");

        if (inbounds.port) {
          let port = `${inbounds.port}`.split("-");
          document.form.xray_inbound_port_from.value = port[0];
          document.form.xray_inbound_port_to.value = port[port.length - 1];
        }

        document.form.xray_protocol.value = inbounds.protocol;
        document.form.xray_inbound_address.value = inbounds.listen || "0.0.0.0";

        document.form.xray_sniffing.value = inbounds.settings.sniffing && inbounds.settings.sniffing.enabled;
        snif_meta_row.style.display = inbounds.settings.sniffing && inbounds.settings.sniffing.enabled ? "table-row" : "none";
        snif_do_row.style.display = inbounds.settings.sniffing && inbounds.settings.sniffing.enabled && !inbounds.settings.sniffing.metadataOnly ? "table-row" : "none";

        populate_clients(inbounds.settings.clients);
      }

      function buildSniffing() {
        const form = document.form;
        const snifChck = form.xray_sniffing_enabled.checked;
        const metaChck = form.xray_sniffing_meta_enabled.checked;

        const snif_do_row = document.getElementById("xray_sniffing_destoverride");
        const snif_meta_row = document.getElementById("xray_sniffing_metadataonly");

        snif_meta_row.style.display = snifChck ? "table-row" : "none";
        snif_do_row.style.display = snifChck && !metaChck ? "table-row" : "none";

        const destOverride = snifChck && !metaChck ? ["http", "tls", "quic", "fakedns"].filter((protocol) => form[`xray_sniffing_do_${protocol}`].checked) : [];

        xray.config.inbounds[0].settings.sniffing = {
          enabled: snifChck,
          destOverride: destOverride,
        };

        console.log("sniffing", xray.config.inbounds[0].settings.sniffing);
      }

      function populate_clients(clients = []) {
        const table = document.getElementById("xray_table_clients");
        table.querySelectorAll(".xray_clients_row").forEach((row) => row.remove());
        document.getElementById("xray_table_clients_empty").style.display = clients.length ? "none" : "table-row";

        clients.forEach((client) => {
          const row = document.createElement("tr");
          row.className = "xray_clients_row";

          row.innerHTML = `
            <td>${client.email}</td>
            <td>${client.id}</td>
            <td>
              <input class="remove_btn" title="Delete client entry" />
              <a href="#" class="button_gen button_gen_small">Get Config</a>
            </td>`;
          row.querySelector(".remove_btn").onclick = () => clients_delete(client, row);
          table.appendChild(row);
        });
      }

      function clients_delete(client, row) {
        let inbounds = xray.config.inbounds[0];

        submitForm(xray.commands.clientDelete, { xray_client_email: client.email, xray_client_id: client.id });

        inbounds.settings.clients = inbounds.settings.clients.filter((c) => c.email !== client.email || c.id !== client.id);
        row.remove();
        populate_clients(inbounds.settings.clients);
        setTimeout(() => {
          hideLoading();
        }, 1000);
      }

      function clients_add() {
        let inbounds = xray.config.inbounds[0];
        let client = {
          email: document.form.xray_clients_add_email.value,
          id: document.form.xray_clients_add_id.value,
          level: 0,
        };

        if (inbounds.settings.clients.some((c) => c.email === client.email)) {
          alert("Email already exists");
          return;
        }

        if (client.email.length == 0) {
          alert("Email cannot be empty");
          return;
        }

        const byteLength = new Blob([client.id]);
        if (byteLength > 30) {
          alert("Id must be less than 30 bytes");
        }

        submitForm(xray.commands.clientAdd, { xray_client_email: client.email, xray_client_id: client.id });

        inbounds.settings.clients.push(client);
        populate_clients(inbounds.settings.clients);
        setTimeout(() => {
          document.form.xray_clients_add_email.value = "";
          document.form.xray_clients_add_id.value = uuid();
          hideLoading();
        }, 1000);
      }

      function checkServerStatus() {
        const label = document.getElementById("xray_server_status_label");
        label.innerText = xray.server.isRunning ? "is up & running" : "stopped";
        label.classList.toggle("hint-color", xray.server.isRunning);
      }

      function setCurrentPage() {
        document.form.next_page.value = window.location.pathname.substring(1);
        document.form.current_page.value = window.location.pathname.substring(1);
      }

      function protocolChange() {
        const protocol = document.form.xray_protocol.value;
        const table_clients = document.getElementById("xray_table_inbound_clients");

        const protocolsWithClients = ["vless", "vmess"];
        table_clients.style.display = protocolsWithClients.includes(protocol) ? "block" : "none";
      }

      function serverStatus(action) {
        submitForm(xray.commands[`server${action.charAt(0).toUpperCase() + action.slice(1)}`]);
        document.getElementById("xray_server_status_label").innerText = "processing...";

        setTimeout(() => location.reload(), 2000);
      }

      function hint(link, content) {
        link.onmouseout = nd;
        overlib(content, HAUTO, VAUTO);
      }
    </script>
    <style>
      .button_gen_small {
        min-width: auto;
        border-radius: 4px;
        margin: 5px;
        float: right;
        font-weight: normal;
        height: 20px;
        font-size: 10px;
      }
      .input_100_table {
        width: 70%;
      }
    </style>
  </head>
  <body onload="initial();">
    <div id="TopBanner"></div>
    <div id="Loading" class="popup_bg"></div>
    <iframe name="hidden_frame" id="hidden_frame" src="about:blank" width="0" height="0" frameborder="0"></iframe>
    <form method="post" name="form" id="ruleForm" action="/start_apply.htm" target="hidden_frame">
      <input type="hidden" name="current_page" value="" />
      <input type="hidden" name="next_page" value="" />
      <input type="hidden" name="group_id" value="" />
      <input type="hidden" name="modified" value="0" />
      <input type="hidden" name="action_mode" value="apply" />
      <input type="hidden" name="action_wait" value="5" />
      <input type="hidden" name="first_time" value="" />
      <input type="hidden" name="action_script" value="" />
      <input type="hidden" name="preferred_lang" id="preferred_lang" value="<% nvram_get("preferred_lang"); %>"> <input type="hidden" name="firmver" value="<% nvram_get("firmver"); %>">
      <input type="hidden" name="amng_custom" value="" />
      <table class="content" align="center" cellpadding="0" cellspacing="0">
        <tr>
          <td width="17">&nbsp;</td>
          <td valign="top" width="202">
            <div id="mainMenu"></div>
            <div id="subMenu"></div>
          </td>
          <td valign="top">
            <div id="tabMenu" class="submenuBlock"></div>
            <table width="98%" border="0" align="left" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="top">
                  <table width="760px" border="0" cellpadding="4" cellspacing="0" class="FormTitle" id="FormTitle">
                    <tbody>
                      <tr bgcolor="#4D595D">
                        <td valign="top">
                          <div class="formfontdesc">
                            <div>&nbsp;</div>
                            <div class="formfonttitle" id="scripttitle" style="text-align: center">X-RAY Core</div>
                            <div id="formfontdesc" class="formfontdesc">This UI control page provides a simple interface to manage and monitor the X-ray Core's configuration and it's status.</div>
                            <div style="margin: 10px 0 10px 5px" class="splitLine"></div>
                            <table width="100%" border="1" align="center" cellpadding="2" cellspacing="0" bordercolor="#6b8fa3" class="FormTable SettingsTable" style="border: 0px" id="xray_table_config">
                              <thead>
                                <tr>
                                  <td colspan="2">Configuration</td>
                                </tr>
                              </thead>
                              <tr>
                                <th>Server Status</th>
                                <td>
                                  <span id="xray_server_status_label" class="hint-color"></span>
                                  <span id="xray_server_status_links">
                                    <a id="xray_server_status_restart_link" class="button_gen button_gen_small" href="javascript:serverStatus('restart');void(0);">Restart</a>
                                    <a id="xray_server_status_stop_link" class="button_gen button_gen_small" href="javascript:serverStatus('stop');void(0);">Stop</a>
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <th>
                                  <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'The listening address, either an IP address or a Unix domain socket. The default value is <b>0.0.0.0</b>, which means accepting connections on all network interfaces.');">The listening address</a>
                                </th>
                                <td>
                                  <input type="text" maxlength="15" class="input_20_table" name="xray_inbound_address" onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off" autocapitalize="off" />
                                  <span class="hint-color">default: 0.0.0.0</span>
                                </td>
                              </tr>
                              <tr>
                                <th>Inbound Port</th>
                                <td>
                                  <input type="text" maxlength="5" class="input_6_table" name="xray_inbound_port_from" value="" autocorrect="off" autocapitalize="off" onKeyPress="return validator.isNumber(this,event);" />
                                  -
                                  <input type="text" maxlength="5" class="input_6_table" name="xray_inbound_port_to" value="" autocorrect="off" autocapitalize="off" onKeyPress="return validator.isNumber(this,event);" />
                                </td>
                              </tr>
                              <tr>
                                <th>The port allocation strategy</th>
                                <td>
                                  <select name="xray_port_allocate" class="input_option" onchange="allocateChange(this)">
                                    <option value="always">always</option>
                                    <option value="random">random</option>
                                  </select>
                                </td>
                              </tr>
                              <tr>
                                <th>
                                  <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'The interval for refreshing randomly allocated ports in minutes.');">Refresh</a>
                                </th>
                                <td>
                                  <input type="text" maxlength="2" class="input_6_table" name="xray_allocate_refresh" onkeypress="return validator.isNumber(this,event);" value="" />
                                  <span class="hint-color">The minimum is 2, and recommended is 5</span>
                                </td>
                              </tr>
                              <tr>
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
                                  <input class="button_gen" type="button" value="Renew" onClick="certificate_renew();" />
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
                                  <select name="xray_network" class="input_option">
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
                            </table>
                          </div>
                          <div class="formfontdesc">
                            <table width="100%" border="1" align="center" cellpadding="2" cellspacing="0" bordercolor="#6b8fa3" class="FormTable SettingsTable tableApi_table" style="border: 0px" id="xray_table_inbound_clients">
                              <thead>
                                <tr>
                                  <td colspan="3">Clients</td>
                                </tr>
                              </thead>
                              <tbody id="xray_table_clients">
                                <tr class="row_title">
                                  <th>Username</th>
                                  <th>Id</th>
                                  <th></th>
                                </tr>
                                <tr class="row_title">
                                  <td><input name="xray_clients_add_email" type="text" class="input_25_table" /></td>
                                  <td><input name="xray_clients_add_id" maxlength="36" type="text" class="input_25_table" /></td>
                                  <td>
                                    <input type="button" class="add_btn" onclick="clients_add();" value="" />
                                    <a href="#" class="button_gen button_gen_small" style="visibility: hidden">Get Congig</a>
                                  </td>
                                </tr>
                                <tr class="data_tr" id="xray_table_clients_empty"><td colspan="3" style="color: rgb(255, 204, 0)">No data in table.</td></tr>
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </form>
    <form method="post" name="formScriptActions" action="/start_apply.htm" target="hidden_frame">
      <input type="hidden" name="action_mode" value="apply" />
      <input type="hidden" name="action_script" value="" />
      <input type="hidden" name="modified" value="0" />
      <input type="hidden" name="action_wait" value="" />
      <input type="hidden" name="amng_custom" value="" />
    </form>
    <div id="footer"></div>
  </body>
</html>
