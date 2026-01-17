<template>
  <tbody v-if="transport.hysteriaSettings">
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_version') }}
        <hint v-html="$t('com.NetworkHysteria.hint_version')"></hint>
      </th>
      <td>
        <select class="input_option" v-model.number="transport.hysteriaSettings.version">
          <option :value="1">Hysteria 1</option>
          <option :value="2">Hysteria 2</option>
        </select>
        <span class="hint-color">default: 2</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_auth') }}
        <hint v-html="$t('com.NetworkHysteria.hint_auth')"></hint>
      </th>
      <td>
        <input type="text" class="input_25_table" v-model="transport.hysteriaSettings.auth" autocomplete="off" autocorrect="off" autocapitalize="off" />
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_congestion') }}
        <hint v-html="$t('com.NetworkHysteria.hint_congestion')"></hint>
      </th>
      <td>
        <select class="input_option" v-model="transport.hysteriaSettings.congestion">
          <option v-for="(opt, index) in congestionOptions" :key="index" :value="opt">{{ opt }}</option>
        </select>
        <span class="hint-color">default: brutal</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_up') }}
        <hint v-html="$t('com.NetworkHysteria.hint_up')"></hint>
      </th>
      <td>
        <input type="text" class="input_15_table" v-model="transport.hysteriaSettings.up" autocomplete="off" autocorrect="off" autocapitalize="off" />
        <span class="hint-color">e.g., 100mbps</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_down') }}
        <hint v-html="$t('com.NetworkHysteria.hint_down')"></hint>
      </th>
      <td>
        <input type="text" class="input_15_table" v-model="transport.hysteriaSettings.down" autocomplete="off" autocorrect="off" autocapitalize="off" />
        <span class="hint-color">e.g., 100mbps</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_udphop_enabled') }}
        <hint v-html="$t('com.NetworkHysteria.hint_udphop_enabled')"></hint>
      </th>
      <td>
        <input type="checkbox" v-model="udphopEnabled" />
      </td>
    </tr>
    <tr v-if="udphopEnabled">
      <th>
        {{ $t('com.NetworkHysteria.label_udphop_port') }}
        <hint v-html="$t('com.NetworkHysteria.hint_udphop_port')"></hint>
      </th>
      <td>
        <input type="text" class="input_15_table" v-model="transport.hysteriaSettings.udphop!.port" autocomplete="off" autocorrect="off" autocapitalize="off" />
        <span class="hint-color">e.g., 20000-50000</span>
      </td>
    </tr>
    <tr v-if="udphopEnabled">
      <th>
        {{ $t('com.NetworkHysteria.label_udphop_interval') }}
        <hint v-html="$t('com.NetworkHysteria.hint_udphop_interval')"></hint>
      </th>
      <td>
        <input type="number" class="input_6_table" v-model.number="transport.hysteriaSettings.udphop!.interval" autocomplete="off" autocorrect="off" autocapitalize="off" />
        <span class="hint-color">default: 30 (seconds)</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_salamander_enabled') }}
        <hint v-html="$t('com.NetworkHysteria.hint_salamander_enabled')"></hint>
      </th>
      <td>
        <input type="checkbox" v-model="salamanderEnabled" />
      </td>
    </tr>
    <tr v-if="salamanderEnabled">
      <th>
        {{ $t('com.NetworkHysteria.label_salamander_password') }}
        <hint v-html="$t('com.NetworkHysteria.hint_salamander_password')"></hint>
      </th>
      <td>
        <input type="text" class="input_25_table" v-model="salamanderPassword" autocomplete="off" autocorrect="off" autocapitalize="off" />
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts">
  import { defineComponent, ref, watch, computed } from 'vue';
  import Hint from '@main/Hint.vue';
  import { XrayStreamSettingsObject } from '@/modules/CommonObjects';
  import { XrayStreamHysteriaSettingsObject, XrayUdpHopObject, XraySalamanderObject } from '@/modules/TransportObjects';

  export default defineComponent({
    name: 'NetworkHysteria',
    components: {
      Hint
    },
    props: {
      transport: XrayStreamSettingsObject
    },
    setup(props) {
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
      const congestionOptions = XrayStreamHysteriaSettingsObject.congestionOptions;

      const udphopEnabled = computed({
        get: () => !!transport.value.hysteriaSettings?.udphop,
        set: (val) => {
          if (!transport.value.hysteriaSettings) return;
          if (val) {
            transport.value.hysteriaSettings.udphop = new XrayUdpHopObject();
          } else {
            transport.value.hysteriaSettings.udphop = undefined;
          }
        }
      });

      const salamanderEnabled = computed({
        get: () => !!(transport.value.udpmasks && transport.value.udpmasks.length > 0),
        set: (val) => {
          if (val) {
            const salamander = new XraySalamanderObject();
            transport.value.udpmasks = [salamander];
          } else {
            transport.value.udpmasks = undefined;
          }
        }
      });

      const salamanderPassword = computed({
        get: () => transport.value.udpmasks?.[0]?.password ?? '',
        set: (val) => {
          if (transport.value.udpmasks && transport.value.udpmasks.length > 0) {
            transport.value.udpmasks[0].password = val;
          }
        }
      });

      return {
        transport,
        congestionOptions,
        udphopEnabled,
        salamanderEnabled,
        salamanderPassword
      };
    }
  });
</script>
