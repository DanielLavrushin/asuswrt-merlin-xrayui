<template>
  <div class="formfontdesc">
    <p>VMess is an encrypted transport protocol commonly used as a bridge between Xray clients and servers.</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">VMess</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>Server address
            <hint>
              The server address, which can be an IP address or domain name.
            </hint>
          </th>
          <td>
            <input type="text" maxlength="15" class="input_20_table" v-model="proxy.settings.vnext[0].address"
              onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off"
              autocapitalize="off" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>Server port
            <hint>
              The port number that the server is listening on. **Required**.
            </hint>
          </th>
          <td>
            <input type="number" maxlength="5" class="input_6_table" v-model="proxy.settings.vnext[0].port"
              autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
          </td>
        </tr>
      </tbody>
    </table>
    <clients :clients="users" mode="outbound"></clients>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { XrayOutboundObject, XrayVmessOutboundObject } from "../../modules/OutboundObjects";
import { XrayProtocol } from "../../modules/CommonObjects";
import { XrayVmessClientObject } from "../../modules/ClientsObjects";
import OutboundCommon from "./OutboundCommon.vue";
import Clients from "./../clients/VmessClients.vue";
import Hint from "../Hint.vue";

export default defineComponent({
  name: "VmessOutbound",
  components: {
    OutboundCommon,
    Clients,
    Hint,
  },
  props: {
    proxy: XrayOutboundObject<XrayVmessOutboundObject>,
  },
  setup(props) {
    const proxy = ref<XrayOutboundObject<XrayVmessOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayVmessOutboundObject>(XrayProtocol.VMESS, new XrayVmessOutboundObject()));

    if (proxy.value.settings.vnext.length == 0) {
      proxy.value.settings.vnext.push({
        address: "",
        port: 443,
        users: [],
      });
    }

    const users = ref(proxy.value.settings.vnext[0].users as XrayVmessClientObject[]);
    watch(
      () => users.value.length,
      (newVal) => {
        proxy.value.settings.vnext[0].users = users.value;
      }
    );
    return {
      proxy,
      users,
    };
  },
});
</script>
