<template>
  <div class="formfontdesc">
    <p>HTTP is a protocol that is used for communication over the internet. Please note that HTTP does not provide
      encryption for data transmission and is not suitable for transmitting sensitive information over public networks,
      as it can be easily targeted for attacks. HTTP can only proxy TCP protocols, and cannot handle UDP-based
      protocols.</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">HTTP/2</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>Proxy address
            <hint>
              The address of the HTTP proxy server. **Required**.
            </hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.servers[0].address" autocomplete="off"
              autocorrect="off" autocapitalize="off" />
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr>
          <th>Proxy port
            <hint>
              The port of the HTTP proxy server. **Required**.
            </hint>
          </th>
          <td>
            <input type="number" maxlength="5" class="input_6_table" v-model="proxy.settings.servers[0].port"
              autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
          </td>
        </tr>
      </tbody>
    </table>
    <clients :clients="proxy.settings.servers[0].users"></clients>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import OutboundCommon from "./OutboundCommon.vue";
import { XrayOutboundObject } from "../../modules/OutboundObjects";
import { XrayHttpOutboundObject } from "../../modules/OutboundObjects";
import { XrayProtocol, XrayOptions } from "../../modules/Options";
import Clients from "./../clients/HttpClients.vue";
import Hint from "../Hint.vue";

export default defineComponent({
  name: "HttpOutbound",
  components: {
    OutboundCommon,
    Clients,
    Hint,
  },
  props: {
    proxy: XrayOutboundObject<XrayHttpOutboundObject>,
  },
  setup(props) {
    const proxy = ref<XrayOutboundObject<XrayHttpOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayHttpOutboundObject>(XrayProtocol.HTTP, new XrayHttpOutboundObject()));

    return {
      proxy,
      methods: XrayOptions.httpMethods,
    };
  },
});
</script>
