<template>
  <tbody v-if="transport.grpcSettings">
    <tr>
      <th>
        Service name
      </th>
      <td>
        <input type="text" maxlength="15" class="input_20_table" v-model="transport.grpcSettings.serviceName" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <tr>
      <th>
        The health check
      </th>
      <td>
        <input type="number" min="10" maxlength="4" class="input_6_table"
          onkeypress="return validator.isNumber(this,event);" v-model="transport.grpcSettings.idle_timeout" />
        <span class="hint-color">default: 10 (minimum)</span>
      </td>
    </tr>
    <tr>
      <th>
        The timeout for the health check
      </th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);"
          v-model="transport.grpcSettings.health_check_timeout" />
        <span class="hint-color">default: 20</span>
      </td>
    </tr>
    <tr>
      <th>Permit without stream</th>
      <td>
        <input v-model="transport.grpcSettings.permit_without_stream" type="checkbox" class="input" />
        <span class="hint-color">default: false</span>
      </td>
    </tr>
    <tr>
      <th>
        The initial window size of the h2 stream
      </th>
      <td>
        <input type="number" maxlength="5" min="0" max="65535" class="input_6_table"
          onkeypress="return validator.isNumber(this,event);" v-model="transport.grpcSettings.initial_windows_size" />
        <span class="hint-color">default: 0</span>
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { XrayStreamSettingsObject } from "../../modules/XrayConfig";

export default defineComponent({
  name: "Grpc",
  props: {
    transport: XrayStreamSettingsObject
  },
  setup(props) {

    const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
    return { transport };
  },
});
</script>
