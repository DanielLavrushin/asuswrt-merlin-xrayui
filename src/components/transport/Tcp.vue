<template>
  <tbody v-if="transport.tcpSettings">
    <tr v-if="isInbound">
      <th>
        Accept the PROXY protocol
      </th>
      <td>
        <input type="checkbox" name="xray_network_tcp_accept_proxy" class="input"
          v-model="transport.tcpSettings.acceptProxyProtocol" />
        <span class="hint-color">default: false</span>
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { XrayStreamSettingsObject } from "../../modules/CommonObjects";

export default defineComponent({
  name: "Tcp",
  props: {
    transport: XrayStreamSettingsObject,
    proxyType: String,
  },
  setup(props) {

    const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
    return {
      transport,
      isInbound: props.proxyType == "inbound"

    };
  },
});
</script>
