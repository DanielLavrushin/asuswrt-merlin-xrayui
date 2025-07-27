<template>
  <div class="formfontdesc" v-if="proxy.settings">
    <p>
      Loopback is an outbound protocol. It can send traffics through corresponding outbound to routing inbound, thus rerouting traffics to other routing rules without leaving
      Xray-core.
    </p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Loopback</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>
            Inbound Rule
            <hint>
              Use as an inbound tag for routing.
              <br />
              This tag can be used as `inboundTag` in routing rules, all traffics going through this outbound can be rerouted with routing rules with corresponding inbound tag.
            </hint>
          </th>
          <td>
            <select class="input_option" v-model="proxy.settings.inboundTag" v-if="inbounds.length">
              <option></option>
              <option v-for="opt in inbounds" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color" v-if="!inbounds.length">no inbound tags defined.</span>
            <span class="hint-color" v-if="inbounds.length">Use as an inbound tag for routing.</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import xrayConfig from '@/modules/XrayConfig';
  import { XrayProtocol } from '@/modules/CommonObjects';
  import { XrayLoopbackOutboundObject, XrayOutboundObject } from '@/modules/OutboundObjects';
  import OutboundCommon from './OutboundCommon.vue';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'LoopbackOutbound',
    components: {
      OutboundCommon,
      Hint
    },
    props: {
      proxy: XrayOutboundObject<XrayLoopbackOutboundObject>
    },
    setup(props) {
      const proxy = ref<XrayOutboundObject<XrayLoopbackOutboundObject>>(
        props.proxy ?? new XrayOutboundObject<XrayLoopbackOutboundObject>(XrayProtocol.LOOPBACK, new XrayLoopbackOutboundObject())
      );
      const inbounds = ref(Array.from(new Set(xrayConfig.routing?.rules?.flatMap((rule) => rule.inboundTag || []).filter((tag) => tag && tag.trim() !== ''))));
      return {
        proxy,
        inbounds
      };
    }
  });
</script>
