<template>
  <div class="formfontdesc">
    <p>The Shadowsocks protocol is compatible with most other implementations of Shadowsocks. The server supports TCP and UDP packet forwarding, with an option to selectively disable UDP.</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Shadowsocks</td>
        </tr>
      </thead>
      <tbody>
        <inbound-common :inbound="inbound"></inbound-common>
        <tr>
          <th>
            Network
            <hint> The supported network protocol type. For example, when specified as `tcp`, it will only handle TCP traffic. The default value is `tcp`. </hint>
          </th>
          <td>
            <select v-model="inbound.settings.network" class="input_option">
              <option v-for="flow in networks" :value="flow" :key="flow">{{ flow }}</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
    <clients :clients="inbound.settings.clients"></clients>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import Clients from '../clients/ShadowsocksClients.vue';
  import InboundCommon from './InboundCommon.vue';
  import { XrayProtocol } from '../../modules/CommonObjects';
  import { XrayInboundObject } from '../../modules/InboundObjects';
  import { XrayOptions } from '../../modules/Options';
  import { XrayShadowsocksInboundObject } from '../../modules/InboundObjects';
  import Hint from '../Hint.vue';

  export default defineComponent({
    name: 'ShadowsocksInbound',
    components: {
      Clients,
      InboundCommon,
      Hint
    },
    props: {
      inbound: XrayInboundObject<XrayShadowsocksInboundObject>
    },
    setup(props) {
      const inbound = ref<XrayInboundObject<XrayShadowsocksInboundObject>>(props.inbound ?? new XrayInboundObject<XrayShadowsocksInboundObject>(XrayProtocol.SHADOWSOCKS, new XrayShadowsocksInboundObject()));
      return {
        inbound,
        networks: XrayOptions.networkOptions
      };
    }
  });
</script>
