<template>
  <div class="formfontdesc">
    <p>VLESS is a stateless lightweight transport protocol, which is divided into inbound and outbound parts, and can be
      used as a bridge between Xray clients and servers. Unlike VMess, VLESS does not rely on system time, and the
      authentication method is also UUID.</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">VLESS</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>Server address
            <hint>
              Server address, pointing to the server, supporting domain names, `IPv4` and `IPv6`.
            </hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.vnext[0].address" autocomplete="off"
              autocorrect="off" autocapitalize="off" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>Server port
            <hint>
              Server port, usually the same as the port listened by the server.
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
import { XrayOutboundObject, XrayVlessOutboundObject } from "../../modules/OutboundObjects";
import { XrayProtocol } from "../../modules/CommonObjects";
import { XrayVlessClientObject } from "../../modules/ClientsObjects";
import OutboundCommon from "./OutboundCommon.vue";
import Clients from "./../clients/VlessClients.vue";
import Hint from "./../Hint.vue";

export default defineComponent({
  name: "VlessOutbound",
  components: {
    OutboundCommon,
    Clients,
    Hint
  },
  props: {
    proxy: XrayOutboundObject<XrayVlessOutboundObject>,
  },
  setup(props) {
    const proxy = ref<XrayOutboundObject<XrayVlessOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayVlessOutboundObject>(XrayProtocol.VLESS, new XrayVlessOutboundObject()));

    if (proxy.value.settings.vnext.length == 0) {
      proxy.value.settings.vnext.push({
        address: "",
        port: 443,
        users: [],
      });
    }

    const users = ref(proxy.value.settings.vnext[0].users as XrayVlessClientObject[]);
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
