<template>
  <tbody v-if="transport.grpcSettings">
    <tr>
      <th>
        {{ $t('components.Grpc.label_service_name') }}
        <hint v-html="$t('components.Grpc.hint_service_name')"></hint>
      </th>
      <td>
        <input type="text" maxlength="15" class="input_20_table" v-model="transport.grpcSettings.serviceName" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <tr v-if="isOutbound">
      <th>
        {{ $t('components.Grpc.label_health_check') }}
        <hint v-html="$t('components.Grpc.hint_health_check')"></hint>
      </th>
      <td>
        <input type="number" min="10" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.grpcSettings.idle_timeout" />
        <span class="hint-color">default: 10 (minimum)</span>
      </td>
    </tr>
    <tr v-if="isOutbound">
      <th>
        {{ $t('components.Grpc.label_health_check_timeout') }}
        <hint v-html="$t('components.Grpc.hint_health_check_timeout')"></hint>
      </th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.grpcSettings.health_check_timeout" />
        <span class="hint-color">default: 20</span>
      </td>
    </tr>
    <tr v-if="isOutbound">
      <th>
        {{ $t('components.Grpc.label_permit_without_stream') }}
        <hint v-html="$t('components.Grpc.hint_permit_without_stream')"></hint>
      </th>
      <td>
        <input v-model="transport.grpcSettings.permit_without_stream" type="checkbox" class="input" />
        <span class="hint-color">default: false</span>
      </td>
    </tr>
    <tr v-if="isOutbound">
      <th>
        {{ $t('components.Grpc.label_initial_windows_size') }}
        <hint v-html="$t('components.Grpc.hint_initial_windows_size')"></hint>
      </th>
      <td>
        <input type="number" maxlength="5" min="0" max="65535" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.grpcSettings.initial_windows_size" />
        <span class="hint-color">default: 0</span>
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { XrayStreamSettingsObject } from '@/modules/CommonObjects';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'Grpc',
    components: {
      Hint
    },
    props: {
      transport: XrayStreamSettingsObject,
      proxyType: String
    },
    setup(props) {
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
      return {
        transport,
        proxyType: props.proxyType,
        isOutbound: props.proxyType == 'outbound'
      };
    }
  });
</script>
