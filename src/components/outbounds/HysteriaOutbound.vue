<template>
  <div class="formfontdesc" v-if="proxy.settings">
    <p>{{ $t('com.HysteriaOutbound.modal_desc') }}</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t('com.HysteriaOutbound.modal_title') }}</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common v-model:proxy="proxy"></outbound-common>
        <tr>
          <th>
            {{ $t('com.HysteriaOutbound.label_address') }}
            <hint v-html="$t('com.HysteriaOutbound.hint_address')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.address" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.HysteriaOutbound.label_port') }}
            <hint v-html="$t('com.HysteriaOutbound.hint_port')"></hint>
          </th>
          <td>
            <input
              type="number"
              maxlength="5"
              class="input_6_table"
              v-model.number="proxy.settings.port"
              autocorrect="off"
              autocapitalize="off"
              onkeypress="return validator.isNumber(this, event);"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { XrayOutboundObject, XrayHysteriaOutboundObject } from '@/modules/OutboundObjects';
  import { XrayProtocol, XrayStreamSettingsObject } from '@/modules/CommonObjects';
  import { XrayStreamHysteriaSettingsObject } from '@/modules/TransportObjects';
  import OutboundCommon from './OutboundCommon.vue';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'HysteriaOutbound',
    components: {
      OutboundCommon,
      Hint
    },
    props: {
      proxy: XrayOutboundObject<XrayHysteriaOutboundObject>
    },
    setup(props) {
      const proxy = ref<XrayOutboundObject<XrayHysteriaOutboundObject>>(
        props.proxy ?? new XrayOutboundObject<XrayHysteriaOutboundObject>(XrayProtocol.HYSTERIA, new XrayHysteriaOutboundObject())
      );

      if (!proxy.value.streamSettings) {
        proxy.value.streamSettings = new XrayStreamSettingsObject();
        proxy.value.streamSettings.network = 'hysteria';
        proxy.value.streamSettings.security = 'tls';
      }

      if (!proxy.value.streamSettings.hysteriaSettings) {
        proxy.value.streamSettings.hysteriaSettings = new XrayStreamHysteriaSettingsObject();
      }

      if (proxy.value.settings) {
        proxy.value.settings.version = 2;
      }
      if (proxy.value.streamSettings.hysteriaSettings) {
        proxy.value.streamSettings.hysteriaSettings.version = 2;
      }

      return {
        proxy
      };
    }
  });
</script>
