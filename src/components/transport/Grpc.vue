<template>
  <tbody v-if="transport.grpcSettings">
    <tr>
      <th>
        Service name
        <hint>
          A string that specifies the service name, similar to the path in `HTTP/2`.

          The client will use this name for communication, and the server will verify whether the service name matches.
        </hint>
      </th>
      <td>
        <input type="text" maxlength="15" class="input_20_table" v-model="transport.grpcSettings.serviceName" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <tr v-if="isOutbound">
      <th>
        The health check
        <hint>
          The health check is performed when no data transmission occurs for a certain period of time, measured in
          `seconds`. If this value is set to less than `10`, `10` will be used as the `minimum` value.
        </hint>
      </th>
      <td>
        <input type="number" min="10" maxlength="4" class="input_6_table"
          onkeypress="return validator.isNumber(this,event);" v-model="transport.grpcSettings.idle_timeout" />
        <span class="hint-color">default: 10 (minimum)</span>
      </td>
    </tr>
    <tr v-if="isOutbound">
      <th>
        The timeout for the health check
        <hint>
          The timeout for the health check, measured in seconds. If the health check is not completed within this time
          period, it is considered to have failed. The default value is `20`
        </hint>
      </th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);"
          v-model="transport.grpcSettings.health_check_timeout" />
        <span class="hint-color">default: 20</span>
      </td>
    </tr>
    <tr v-if="isOutbound">
      <th>Permit without stream
        <hint>
          If set to `true` allows health checks to be performed when there are no sub-connections. The default value is
          `false`.
        </hint>
      </th>
      <td>
        <input v-model="transport.grpcSettings.permit_without_stream" type="checkbox" class="input" />
        <span class="hint-color">default: false</span>
      </td>
    </tr>
    <tr v-if="isOutbound">
      <th>
        The initial window size of the h2 stream
        <hint>
          The initial window size of the `h2` stream. When the value is less than or equal to `0`, this feature does not
          take effect. When the value is greater than `65535`, the Dynamic Window mechanism will be disabled. The
          default
          value is `0`, which means it is not effective.
        </hint>
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
import { XrayStreamSettingsObject } from "../../modules/CommonObjects";
import Hint from "../Hint.vue";

export default defineComponent({
  name: "Grpc",
  components: {
    Hint,
  },
  props: {
    transport: XrayStreamSettingsObject,
    proxyType: String,
  },
  setup(props) {

    const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
    console.log(props);
    return {
      transport, proxyType: props.proxyType,
      isOutbound: props.proxyType == "outbound"
    };
  },
});
</script>
