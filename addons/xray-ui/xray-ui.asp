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
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }

      function loadCustomSettings() {
        custom_settings = JSON.parse(`<% get_custom_settings(); %>`);

        for (var prop in custom_settings) {
          if (Object.prototype.hasOwnProperty.call(custom_settings, prop)) {
            if (prop.indexOf("xray") == -1) {
              delete custom_settings[prop];
            }
          }
        }
        console.log(custom_settings);
      }

      function loadXraySettings() {
        if (custom_settings) {
          xray.isEnabled = custom_settings.xray_enable == "true";
        }
        console.log(xray);
      }

      function enable_xray(state) {
        xray.isEnabled = state;
      }

      function initial() {
        setCurrentPage();
        show_menu();
        loadCustomSettings();
        loadXraySettings();
        check_server_status();
        refreshConfig();
      }

      function applySettings() {
        custom_settings.xray_enable = xray.isEnabled;
        document.getElementById("amng_custom").value = JSON.stringify(custom_settings);

        document.form.submit();
      }

      function refreshConfig() {
        document.formScriptActions.action_script.value = xray.commands.refreshConfig;
        document.formScriptActions.submit();
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
          },
        });
      }

      function config_to_form() {
        document.form.xray_clients_add_id.value = uuid();
        let inbounds = xray.config.inbounds[0];
        let outbounds = xray.config.outbounds[0];

        document.form.xray_inbound_port.value = inbounds.port;
        document.form.xray_protocol.value = inbounds.protocol;
        populate_clients(inbounds.settings.clients);
      }

      function populate_clients(clients) {
        document.getElementById("xray_table_clients_empty").style.display = "table-row";
        if (clients.length > 0) {
          populate_clients([]);
          document.getElementById("xray_table_clients_empty").style.display = "none";
        }
        let table = document.getElementById("xray_table_clients");
        table.querySelectorAll(".xray_clients_row").forEach((row) => row.remove());

        clients.forEach((client) => {
          let row = document.createElement("tr");
          row.className = "xray_clients_row";
          row.xray_client = client;
          let email = document.createElement("td");
          email.innerText = client.email;

          let id = document.createElement("td");
          id.innerText = client.id;

          let level = document.createElement("td");
          level.innerText = client.level;

          let actions = document.createElement("td");
          let deleteButton = document.createElement("input");
          deleteButton.classList.add("remove_btn");
          deleteButton.title = "Delete client entry";
          deleteButton.onclick = function () {
            clients_delete(client, row);
          };

          let getConf = document.createElement("a");
          getConf.href = "#";
          getConf.innerText = "Get Config";
          getConf.className = "button_gen button_gen_small";
          getConf.onclick = function () {};

          actions.appendChild(deleteButton);
          actions.appendChild(getConf);

          row.appendChild(email);
          row.appendChild(id);
          row.appendChild(actions);

          table.appendChild(row);
        });
      }

      function clients_delete(client, row) {
        let inbounds = xray.config.inbounds[0];
        let payload = `${xray.commands.clientDelete}_${escape_param(client.email)}_${escape_param(client.id)}`;
        document.formScriptActions.action_script.value = payload;
        document.formScriptActions.submit();
        inbounds.settings.clients = inbounds.settings.clients.filter((c) => c.email !== client.email || c.id !== client.id);
        row.remove();
        populate_clients(inbounds.settings.clients);
      }

      function clients_add() {
        let inbounds = xray.config.inbounds[0];
        let client = {
          email: document.form.xray_clients_add_email.value,
          id: document.form.xray_clients_add_id.value,
          level: 0,
        };

        //validate username
        var isEmailUnique = inbounds.settings.clients.every((c) => c.email !== client.email);
        if (!isEmailUnique) {
          document.form.xray_clients_add_email.value = "";
          alert("Email already exists");
          return;
        }
        if (client.email.length == 0) {
          alert("Email cannot be empty");
          return;
        }
        //validate id lenght
        const byteLength = new Blob([document.form.xray_clients_add_id.value]);
        if (byteLength > 30) {
          alert("Id must be less than 30 bytes");
        }

        let payload = `${xray.commands.clientAdd}_${escape_param(client.email)}_${escape_param(client.id)}_0`;
        document.formScriptActions.action_script.value = payload;
        document.formScriptActions.submit();
        inbounds.settings.clients.push(client);
        populate_clients(inbounds.settings.clients);
        setTimeout(() => {
          document.form.xray_clients_add_email.value = "";
          document.form.xray_clients_add_id.value = uuid();
        }, 200);
      }

      function escape_param(param) {
        param = param.replace("@", "--at--").replace("_", "--under--");
        return param;
      }

      function check_server_status() {
        let label = document.getElementById("xray_server_status_label");
        if (xray.server.isRunning) {
          label.classList.add("hint-color");
          label.innerText = "is up & running";
        } else {
          label.classList.remove("hint-color");
          label.innerText = "stopped";
        }
      }

      function setCurrentPage() {
        document.form.next_page.value = window.location.pathname.substring(1);
        document.form.current_page.value = window.location.pathname.substring(1);
      }

      function hideshow(elm, show) {
        if (elm) {
          if (elm instanceof HTMLElement) {
            elm.style.display = show ? "block" : "none";
          } else if (elm instanceof NodeList || elm instanceof HTMLCollection || elm instanceof Array) {
            elm.forEach((e) => (e.style.display = show ? "block" : "none"));
          } else if (elm instanceof String) {
            document.querySelectorAll(elm).forEach((e) => (e.style.display = show ? "block" : "none"));
          }
        }
      }

      function protocolChange() {
        let protocol = document.form.xray_protocol.value;
        let table_clients = document.getElementById("xray_table_inbound_clients");

        hideshow(table_clients, false);

        switch (protocol) {
          case "vless":
            hideshow(table_clients, true);
            break;
          case "vmess":
            hideshow(table_clients, true);
            break;
          case "http":
            break;
          case "shadowsocks":
            break;
          case "trojan":
            break;
          case "wireguard":
            break;
        }
      }

      function serverStatus(action) {
        switch (action) {
          case "start":
            document.formScriptActions.action_script.value = xray.commands.serverStart;
            break;
          case "restart":
            document.formScriptActions.action_script.value = xray.commands.serverRestart;
            break;
          case "stop":
            document.formScriptActions.action_script.value = xray.commands.serverStop;
            break;
        }
        document.formScriptActions.submit();
        showhide("xray_server_status_links", false);
        document.getElementById("xray_server_status_label").innerText = "processing...";
        setTimeout(() => {
          showhide("xray_server_status_links", true);
          location.reload();
        }, 2e3);
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
      <input type="hidden" name="action_script" value="start_uiDivStats" />
      <input type="hidden" name="current_page" value="" />
      <input type="hidden" name="next_page" value="" />
      <input type="hidden" name="modified" value="0" />
      <input type="hidden" name="action_mode" value="apply" />
      <input type="hidden" name="action_wait" value="2" />
      <input type="hidden" name="first_time" value="" />
      <input type="hidden" name="SystemCmd" value="" />
      <input type="hidden" name="preferred_lang" id="preferred_lang" value="<% nvram_get("preferred_lang"); %>"> <input type="hidden" name="firmver" value="<% nvram_get("firmver"); %>">
      <input type="hidden" name="amng_custom" id="amng_custom" value="" />
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
                                <th>Inbound Port</th>
                                <td>
                                  <input type="text" maxlength="5" class="input_6_table" name="xray_inbound_port" value="" autocorrect="off" autocapitalize="off" onKeyPress="return validator.isNumber(this,event);" />
                                  <span class="hint-color"></span>
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
                                    <option value=""></option>
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
                            <table width="100%" border="1" align="center" cellpadding="2" cellspacing="0" bordercolor="#6b8fa3" class="FormTable SettingsTable tableApi_table" style="border: 0px" id="xray_table_config">
                              <thead>
                                <tr>
                                  <td colspan="2">Logs</td>
                                </tr>
                              </thead>
                              <tr>
                                <th>Status</th>
                                <td></td>
                              </tr>
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
      <input type="hidden" name="productid" value="<% nvram_get("productid"); %>">
      <input type="hidden" name="current_page" value="" />
      <input type="hidden" name="next_page" value="" />
      <input type="hidden" name="action_mode" value="apply" />
      <input type="hidden" name="action_script" value="" />
      <input type="hidden" name="action_wait" value="" />
    </form>
    <div id="footer"></div>
  </body>
</html>
