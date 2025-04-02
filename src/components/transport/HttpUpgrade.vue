<template>
  <tbody v-if="transport.httpupgradeSettings">
    <tr v-if="isInbound">
      <th>
        {{ $t('com.HttpUpgrade.label_accept_proxy_protocol') }}
        <hint v-html="$t('com.HttpUpgrade.hint_accept_proxy_protocol')"></hint>
      </th>
      <td>
        <input type="checkbox" name="xray_network_tcp_accept_proxy" class="input" v-model="transport.httpupgradeSettings.acceptProxyProtocol" />
        <span class="hint-color">default: false</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.HttpUpgrade.label_path') }}
        <hint v-html="$t('com.HttpUpgrade.hint_path')"></hint>
      </th>
      <td>
        <input type="text" maxlength="15" class="input_20_table" v-model="transport.httpupgradeSettings.path" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.HttpUpgrade.label_host') }}
        <hint v-html="$t('com.HttpUpgrade.hint_host')"></hint>
      </th>
      <td>
        <input type="text" maxlength="15" class="input_20_table" v-model="transport.httpupgradeSettings.host" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <headers-mapping :headersMap="transport.httpupgradeSettings.headers" @on:header:update="onheaderapupdate" />
  </tbody>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { XrayStreamSettingsObject } from '@/modules/CommonObjects';
  import HeadersMapping from './HeadersMapping.vue';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'HttpUpgrade',
    components: {
      HeadersMapping,
      Hint
    },
    props: {
      transport: XrayStreamSettingsObject,
      proxyType: String
    },
    setup(props) {
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
      const onheaderapupdate = (headers: any) => {
        if (transport.value.httpupgradeSettings) transport.value.httpupgradeSettings.headers = headers;
      };
      return {
        transport,
        isInbound: props.proxyType == 'inbound',
        onheaderapupdate
      };
    }
  });
</script>
