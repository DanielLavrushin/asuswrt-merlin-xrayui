<template>
  <tbody v-if="transport.wsSettings">
    <tr>
      <th>
        Accept the PROXY protocol
      </th>
      <td>
        <input type="checkbox" name="xray_network_tcp_accept_proxy" class="input"
          v-model="transport.wsSettings.acceptProxyProtocol" />
        <span class="hint-color">default: false</span>
      </td>
    </tr>
    <tr>
      <th>The HTTP path</th>
      <td>
        <input type="text" maxlength="15" class="input_20_table" v-model="transport.wsSettings.path" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <tr>
      <th>The Host header</th>
      <td>
        <input type="text" maxlength="15" class="input_20_table" v-model="transport.wsSettings.host" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <headers-mapping :headersMap="transport.wsSettings.headers" @on:header:update="onheaderapupdate" />
  </tbody>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { XrayStreamSettingsObject } from "../../modules/CommonObjects";

import HeadersMapping from "./HeadersMapping.vue";
export default defineComponent({
  name: "Ws",
  components: {
    HeadersMapping,
  },
  methods: {
    onheaderapupdate(headers: any) {
      if (this.transport.wsSettings)
        this.transport.wsSettings.headers = headers;
    },
  },
  props: {
    transport: XrayStreamSettingsObject
  },
  setup(props) {

    const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());

    return { transport };
  },
});
</script>
