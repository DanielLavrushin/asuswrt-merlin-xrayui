<template>
  <div class="formfontdesc" v-if="proxy.settings">
    <p>Trojan is designed to work with correctly configured encrypted TLS tunnels.</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Trojan</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common v-model:proxy="proxy" @apply-parsed="applyParsed"></outbound-common>
        <tr>
          <th>
            Server address
            <hint> The server address, which can be an `IPv4`, `IPv6`, or `domain name`. **Required**. </hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.servers[0].address" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr>
          <th>
            Server port
            <hint> The server port, usually the same port that the server is listening on. </hint>
          </th>
          <td>
            <input
              type="number"
              maxlength="5"
              class="input_6_table"
              v-model="proxy.settings.servers[0].port"
              autocorrect="off"
              autocapitalize="off"
              onkeypress="return validator.isNumber(this,event);"
            />
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr>
          <th>
            Email address
            <hint> The email address, optional, used to identify the user. </hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.servers[0].email" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">optional</span>
          </td>
        </tr>
        <tr>
          <th>
            Password
            <hint> The password for authentication. **Required**. It can be any string. </hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.servers[0].password" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">required</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import OutboundCommon from './OutboundCommon.vue';
  import { XrayOutboundObject } from '@/modules/OutboundObjects';
  import { XrayTrojanOutboundObject } from '@/modules/OutboundObjects';
  import { XrayProtocol } from '@/modules/Options';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'HttpOutbound',
    components: {
      OutboundCommon,
      Hint
    },
    props: {
      proxy: XrayOutboundObject<XrayTrojanOutboundObject>
    },
    setup(props, { emit }) {
      const proxy = ref<XrayOutboundObject<XrayTrojanOutboundObject>>(
        props.proxy ?? new XrayOutboundObject<XrayTrojanOutboundObject>(XrayProtocol.TROJAN, new XrayTrojanOutboundObject())
      );

      const applyParsed = (parsed: XrayOutboundObject<XrayTrojanOutboundObject>) => {
        proxy.value.tag = proxy.value.tag || parsed.tag;
        proxy.value.surl = undefined;

        const src = parsed.settings?.servers[0];
        const dst = proxy.value.settings?.servers[0];
        if (src && dst) {
          dst.address = src.address;
          dst.port = src.port;
          dst.email = src.email;
          dst.password = src.password;
        }

        if (parsed.streamSettings) {
          proxy.value.streamSettings = parsed.streamSettings;
        }

        emit('update:proxy', proxy.value);
      };

      return {
        proxy,
        applyParsed
      };
    }
  });
</script>
