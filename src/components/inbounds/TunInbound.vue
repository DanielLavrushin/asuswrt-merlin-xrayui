<template>
  <div class="formfontdesc">
    <p>{{ $t('com.TunInbound.modal_desc') }}</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t('com.TunInbound.modal_title') }}</td>
        </tr>
      </thead>
      <tbody v-if="inbound.settings">
        <inbound-common :inbound="inbound"></inbound-common>
        <tr>
          <th>
            {{ $t('com.TunInbound.label_name') }}
            <hint v-html="$t('com.TunInbound.hint_name')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="inbound.settings.name" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">default: xray0</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.TunInbound.label_mtu') }}
            <hint v-html="$t('com.TunInbound.hint_mtu')"></hint>
          </th>
          <td>
            <input
              type="number"
              maxlength="5"
              class="input_6_table"
              v-model="inbound.settings.mtu"
              autocorrect="off"
              autocapitalize="off"
              onkeypress="return validator.isNumber(this, event);"
            />
            <span class="hint-color">default: 1500</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.TunInbound.label_gso') }}
            <hint v-html="$t('com.TunInbound.hint_gso')"></hint>
          </th>
          <td>
            <input type="checkbox" v-model="inbound.settings.gso" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.TunInbound.label_address') }}
            <hint v-html="$t('com.TunInbound.hint_address')"></hint>
          </th>
          <td>
            <textarea class="input_32_table" rows="3" v-model="addressList" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
            <span class="hint-color">{{ $t('com.TunInbound.hint_address_placeholder') }}</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.TunInbound.label_routes') }}
            <hint v-html="$t('com.TunInbound.hint_routes')"></hint>
          </th>
          <td>
            <textarea class="input_32_table" rows="3" v-model="routesList" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
            <span class="hint-color">{{ $t('com.TunInbound.hint_routes_placeholder') }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, watch } from 'vue';
  import InboundCommon from './InboundCommon.vue';
  import { XrayProtocol } from '@/modules/CommonObjects';
  import { XrayTunInboundObject, XrayInboundObject } from '@/modules/InboundObjects';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'TunInbound',
    components: {
      InboundCommon,
      Hint
    },
    props: {
      inbound: XrayInboundObject<XrayTunInboundObject>
    },
    setup(props) {
      const inbound = ref<XrayInboundObject<XrayTunInboundObject>>(props.inbound ?? new XrayInboundObject<XrayTunInboundObject>(XrayProtocol.TUN, new XrayTunInboundObject()));

      const addressList = computed({
        get: () => (inbound.value.settings?.address || []).join('\n'),
        set: (value: string) => {
          if (inbound.value.settings) {
            inbound.value.settings.address = value
              .split('\n')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
          }
        }
      });

      const routesList = computed({
        get: () => (inbound.value.settings?.routes || []).join('\n'),
        set: (value: string) => {
          if (inbound.value.settings) {
            inbound.value.settings.routes = value
              .split('\n')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
          }
        }
      });

      return {
        inbound,
        addressList,
        routesList
      };
    }
  });
</script>
