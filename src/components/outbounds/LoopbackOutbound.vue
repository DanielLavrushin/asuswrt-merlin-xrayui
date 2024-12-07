<template>
  <div class="formfontdesc">
    <p>Loopback is an outbound protocol. It can send traffics through corresponding outbound to routing inbound, thus
      rerouting traffics to other routing rules without leaving Xray-core.</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Loopback</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>Inbound Rule</th>
          <td>
            <select class="input_option" v-model="proxy.settings.inboundTag" v-if="inbounds.length">
              <option></option>
              <option v-for="opt in inbounds" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color" v-if="!inbounds.length">This tag can be used as inboundTag in routing rules, all
              traffics going through this outbound can be rerouted with routing rules with corresponding inbound
              tag</span>
            <span class="hint-color" v-if="inbounds.length">Use as an inbound tag for routing.</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import xrayConfig from "../../modules/XrayConfig";
import { XrayProtocol } from "../../modules/CommonObjects";
import { LoopbackOutboundObject, XrayOutboundObject } from "../../modules/OutboundObjects";
import OutboundCommon from "./OutboundCommon.vue";

export default defineComponent({
  name: "LoopbackOutbound",
  components: {
    OutboundCommon,
  },
  props: {
    proxy: XrayOutboundObject<LoopbackOutboundObject>,
  },
  setup(props) {
    const proxy = ref<XrayOutboundObject<LoopbackOutboundObject>>(props.proxy ?? new XrayOutboundObject<LoopbackOutboundObject>(XrayProtocol.LOOPBACK, new LoopbackOutboundObject()));
    const inbounds = ref(Array.from(new Set(xrayConfig.routing?.rules.flatMap((rule) => rule.inboundTag || []).filter((tag) => tag && tag.trim() !== ""))));
    return {
      proxy,
      inbounds,
    };
  },
});
</script>
