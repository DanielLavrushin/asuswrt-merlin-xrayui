<template>
  <div class="formfontdesc">
    <p>The SOCKS protocol is a standard protocol implementation that is compatible with Socks 5.</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">SOCKS</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>
            Server address
            <hint> The server address. **Required**. </hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.servers[0].address" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            Server port
            <hint> The server port. **Required**. </hint>
          </th>
          <td>
            <input type="number" maxlength="5" class="input_6_table" v-model="proxy.settings.servers[0].port" autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
          </td>
        </tr>
      </tbody>
    </table>
    <clients :clients="proxy.settings.servers[0].users" mode="outbound"></clients>
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { XrayOutboundObject, XraySocksOutboundObject } from '../../modules/OutboundObjects';
  import { XrayProtocol } from '../../modules/CommonObjects';
  import OutboundCommon from './OutboundCommon.vue';
  import Clients from './../clients/SocksClients.vue';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'VlessOutbound',
    components: {
      OutboundCommon,
      Clients,
      Hint
    },
    props: {
      proxy: XrayOutboundObject<XraySocksOutboundObject>
    },
    setup(props) {
      const proxy = ref<XrayOutboundObject<XraySocksOutboundObject>>(props.proxy ?? new XrayOutboundObject<XraySocksOutboundObject>(XrayProtocol.SOCKS, new XraySocksOutboundObject()));

      return {
        proxy
      };
    }
  });
</script>
