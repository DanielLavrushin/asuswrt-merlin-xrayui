<template>
  <div class="formfontdesc">
    <p>Blackhole is an outbound data protocol that blocks all outbound data. When used in conjunction with routing configurations, it can be used to block access to certain websites. OutboundConfigurationObject</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Blackhole</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>Response data</th>
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
  import { defineComponent, ref } from "vue";
  import OutboundCommon from "./OutboundCommon.vue";
  import { XrayProtocol } from "../../modules/CommonObjects";
  import { XrayBlackholeOutboundObject, XrayOutboundObject } from "../../modules/OutboundObjects";

  export default defineComponent({
    name: "BlackholeOutbound",
    components: {
      OutboundCommon,
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
