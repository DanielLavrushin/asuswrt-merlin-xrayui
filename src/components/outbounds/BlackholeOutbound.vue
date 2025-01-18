<template>
  <div class="formfontdesc">
    <p>Blackhole is an outbound data protocol that blocks all outbound data. When used in conjunction with routing
      configurations, it can be used to block access to certain websites. OutboundConfigurationObject</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Blackhole</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr v-if="proxy.settings.response">
          <th>Response data
            <hint>
              Configures the response data for the blackhole.
              <br>
              After receiving the data to be forwarded, the blackhole will send the specified response data and then
              close the connection. The data to be forwarded will be discarded. If this field is not specified, the
              blackhole will simply close the connection
              <ul>
                <li>`none`: The `blackhole` will simply close the connection.</li>
                <li>`http`: The `blackhole` will send a simple `HTTP 403` packet as the response and then close the
                  connection.</li>
              </ul>
            </hint>
          </th>
          <td>
            <select class="input_option" v-model="proxy.settings.response.type">
              <option v-for="opt in responses" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color">Configures the response data for the blackhole.</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import OutboundCommon from "./OutboundCommon.vue";
import { XrayProtocol } from "../../modules/CommonObjects";
import { XrayBlackholeOutboundObject, XrayOutboundObject } from "../../modules/OutboundObjects";
import Hint from "./../Hint.vue";

export default defineComponent({
  name: "BlackholeOutbound",
  components: {
    OutboundCommon,
    Hint
  },
  props: {
    proxy: XrayOutboundObject<XrayBlackholeOutboundObject>,
  },
  setup(props) {
    const proxy = ref<XrayOutboundObject<XrayBlackholeOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayBlackholeOutboundObject>(XrayProtocol.BLACKHOLE, new XrayBlackholeOutboundObject()));
    const responses = ref(["none", "http"]);

    return {
      proxy,
      responses,
    };
  },
});
</script>
