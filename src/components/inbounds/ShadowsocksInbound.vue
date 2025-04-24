<template>
  <div class="formfontdesc">
    <p>The Shadowsocks protocol is compatible with most other implementations of Shadowsocks. The server supports TCP and UDP packet forwarding, with an option to selectively disable UDP.</p>
    <table width="100%" class="FormTable modal-form-table">
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
        <tr>
          <th>
            Password
            <hint>The password parameter can be specified for the server at all, but also in the ClientObject being dedicated to the given user. Server-level password is not guaranteed to override the client-specific one.</hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="inbound.settings.password" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <button @click.prevent="generate_password()" class="button_gen button_gen_small">generate</button>
          </td>
        </tr>
      </tbody>
    </table>
    <clients :clients="inbound.settings.clients"></clients>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import Clients from '@clients/ShadowsocksClients.vue';
  import InboundCommon from './InboundCommon.vue';
  import { XrayProtocol } from '@/modules/CommonObjects';
  import { XrayInboundObject } from '@/modules/InboundObjects';
  import { XrayOptions } from '@/modules/Options';
  import { XrayShadowsocksInboundObject } from '@/modules/InboundObjects';
  import Hint from '@main/Hint.vue';
  import engine from '@/modules/Engine';

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

      const generate_password = () => {
        inbound.value.settings.password = engine.generateRandomBase64();
      };
      return {
        inbound,
        networks: XrayOptions.networkOptions,
        generate_password
      };
    }
  });
</script>
