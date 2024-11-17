<template>
  <tr v-if="transport.tcpSettings">
    <th>
      Accept the PROXY protocol
    </th>
    <td>
      <input type="checkbox" name="xray_network_tcp_accept_proxy" class="input"
        v-model="transport.tcpSettings.acceptProxyProtocol" />
      <span class="hint-color">default: false</span>
    </td>
  </tr>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { XrayStreamSettingsObject } from "../../modules/XrayConfig";

export default defineComponent({
  name: "Tcp",
  props: {
    transport: XrayStreamSettingsObject
  },
  setup(props) {

    const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
    return { transport };
  },
});
</script>
