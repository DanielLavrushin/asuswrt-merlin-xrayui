<template>
  <div class="formfontdesc">
    <p>The standard SOCKS protocol implementation is compatible with SOCKS 4, SOCKS 4a, and SOCKS 5.</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">SOCKS</td>
        </tr>
      </thead>
      <tbody>
        <inbound-common :inbound="inbound"></inbound-common>

        <tr>
          <th>
            The authentication method
            <hint> The authentication method for the `SOCKS` protocol, supporting `noauth` for anonymous mode and `password` for username/password authentication. The default value is `noauth`. </hint>
          </th>
          <td>
            <select v-model="inbound.settings.auth" class="input_option">
              <option v-for="flow in authentications" :value="flow" :key="flow">{{ flow }}</option>
            </select>
            <span class="hint-color">default: noauth</span>
          </td>
        </tr>
        <tr>
          <th>
            UDP
            <hint> Enable UDP support for the `SOCKS` protocol. The default value is `false`. </hint>
          </th>
          <td>
            <input type="checkbox" v-model="inbound.settings.udp" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr v-if="inbound.settings.udp">
          <th>
            Local IP address
            <hint> When `UDP` is enabled, Xray needs to know the local IP address. The default value is `127.0.0.1`. </hint>
          </th>
          <td>
            <input type="text" maxlength="15" class="input_20_table" v-model="inbound.settings.ip" onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">default: 127.0.0.1</span>
          </td>
        </tr>
      </tbody>
    </table>
    <clients :clients="inbound.settings.accounts"></clients>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import Clients from '../clients/SocksClients.vue';
  import InboundCommon from './InboundCommon.vue';
  import { XrayProtocol } from '../../modules/CommonObjects';
  import { XrayInboundObject } from '../../modules/InboundObjects';
  import { XraySocksInboundObject } from '../../modules/InboundObjects';
  import Hint from '../Hint.vue';

  export default defineComponent({
    name: 'SocksInbound',
    components: {
      Clients,
      InboundCommon,
      Hint
    },
    props: {
      inbound: XrayInboundObject<XraySocksInboundObject>
    },
    setup(props) {
      const inbound = ref<XrayInboundObject<XraySocksInboundObject>>(props.inbound ?? new XrayInboundObject<XraySocksInboundObject>(XrayProtocol.SOCKS, new XraySocksInboundObject()));
      return {
        inbound,
        authentications: ['noauth', 'password']
      };
    }
  });
</script>
