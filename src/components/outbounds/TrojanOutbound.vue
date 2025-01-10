<template>
  <div class="formfontdesc">
    <p>Trojan is designed to work with correctly configured encrypted TLS tunnels.</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Trojan</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>Server address</th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.servers[0].address" autocomplete="off"
              autocorrect="off" autocapitalize="off" />
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr>
          <th>Server port</th>
          <td>
            <input type="number" maxlength="5" class="input_6_table" v-model="proxy.settings.servers[0].port"
              autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr>
          <th>Email address</th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.servers[0].email" autocomplete="off"
              autocorrect="off" autocapitalize="off" />
            <span class="hint-color">optional</span>
          </td>
        </tr>
        <tr>
          <th>Password</th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.servers[0].password" autocomplete="off"
              autocorrect="off" autocapitalize="off" />
            <span class="hint-color">required</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";
import OutboundCommon from "./OutboundCommon.vue";
import { XrayOutboundObject } from "../../modules/OutboundObjects";
import { XrayTrojanOutboundObject } from "../../modules/OutboundObjects";
import { XrayProtocol } from "../../modules/Options";
export default defineComponent({
  name: "HttpOutbound",
  components: {
    OutboundCommon,
  },
  props: {
    proxy: XrayOutboundObject<XrayTrojanOutboundObject>,
  },
  methods: {},
  setup(props) {
    const proxy = ref<XrayOutboundObject<XrayTrojanOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayTrojanOutboundObject>(XrayProtocol.TROJAN, new XrayTrojanOutboundObject()));
    return {
      proxy,
    };
  },
});
</script>
