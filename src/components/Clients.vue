<template>
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
          <td>
            <input name="xray_clients_add_email" type="text" class="input_25_table" />
          </td>
          <td>
            <input name="xray_clients_add_id" maxlength="36" type="text" class="input_25_table" />
          </td>

          <td>
            <input type="button" class="add_btn" @click="addClient()" value="" />
            <a href="#" class="button_gen button_gen_small" style="visibility: hidden">Get Congig</a>
          </td>
        </tr>
        <tr class="data_tr" id="xray_table_clients_empty">
          <td colspan="3" style="color: rgb(255, 204, 0)">No data in tab`le.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
  import { defineComponent, inject, computed } from "vue";

  import XrayObject from "../modules/XrayConfig";

  export default defineComponent({
    name: "Clients",
    setup() {
      const serverConfig = inject("serverConfig") as XrayObject;

      const addClient = () => {
        console.log("Server config", serverConfig);
      };

      const xray_ui_page = window.xray.custom_settings.xray_ui_page;

      return {
        xray_ui_page,
        serverConfig,
        addClient,
      };
    },
  });
</script>

<style scoped></style>
