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
            {{ $t('com.TunInbound.label_gateway') }}
            <hint v-html="$t('com.TunInbound.hint_gateway')"></hint>
          </th>
          <td>
            <textarea class="input_32_table" rows="3" v-model="gatewayList" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
            <span class="hint-color">{{ $t('com.TunInbound.hint_gateway_placeholder') }}</span>
          </td>
        </tr>
        <tr v-if="supportsAutoRoute">
          <th>
            {{ $t('com.TunInbound.label_auto_routing') }}
            <hint v-html="$t('com.TunInbound.hint_auto_routing')"></hint>
          </th>
          <td>
            <textarea class="input_32_table" rows="3" v-model="autoRoutingList" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
            <span class="hint-color">{{ $t('com.TunInbound.hint_auto_routing_placeholder') }}</span>
            <div v-if="autoRoutingBindsOutbounds" class="tun-warning" v-html="$t('com.TunInbound.warn_auto_routing_conflict')"></div>
          </td>
        </tr>
        <tr v-if="supportsGateway">
          <th>
            {{ $t('com.TunInbound.label_auto_outbounds_interface') }}
            <hint v-html="$t('com.TunInbound.hint_auto_outbounds_interface')"></hint>
          </th>
          <td>
            <input
              type="text"
              class="input_20_table"
              v-model="inbound.settings.autoOutboundsInterface"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
            />
            <span class="hint-color">{{ $t('com.TunInbound.hint_auto_outbounds_interface_placeholder') }}</span>
          </td>
        </tr>
        <tr v-if="supportsGateway">
          <th>
            {{ $t('com.TunInbound.label_dns') }}
            <hint v-html="$t('com.TunInbound.hint_dns')"></hint>
          </th>
          <td>
            <textarea class="input_32_table" rows="2" v-model="dnsList" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
            <span class="hint-color">{{ $t('com.TunInbound.hint_dns_placeholder') }}</span>
          </td>
        </tr>
        <tr v-if="supportsDesc">
          <th>
            {{ $t('com.TunInbound.label_desc') }}
            <hint v-html="$t('com.TunInbound.hint_desc')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="inbound.settings.desc" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">default: Wintun</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.TunInbound.label_user_level') }}
            <hint v-html="$t('com.TunInbound.hint_user_level')"></hint>
          </th>
          <td>
            <input
              type="number"
              maxlength="3"
              class="input_6_table"
              v-model.number="inbound.settings.userLevel"
              onkeypress="return validator.isNumber(this, event);"
            />
            <span class="hint-color">default: 0</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed } from 'vue';
  import InboundCommon from './InboundCommon.vue';
  import { XrayProtocol } from '@/modules/CommonObjects';
  import { XrayTunInboundObject, XrayInboundObject } from '@/modules/InboundObjects';
  import { coreSupports } from '@/modules/CoreVersion';
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

      const lines = (field: 'gateway' | 'dns' | 'autoSystemRoutingTable') =>
        computed({
          get: () => (inbound.value.settings?.[field] || []).join('\n'),
          set: (value: string) => {
            if (!inbound.value.settings) return;
            inbound.value.settings[field] = value
              .split('\n')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
          }
        });

      const gatewayList = lines('gateway');
      const dnsList = lines('dns');
      const autoRoutingList = lines('autoSystemRoutingTable');

      const supportsGateway = computed(() => coreSupports('tunGateway'));
      const supportsAutoRoute = computed(() => coreSupports('tunAutoRoute'));
      const supportsDesc = computed(() => coreSupports('tunDesc'));

      const hasAutoRouting = computed(() => (inbound.value.settings?.autoSystemRoutingTable?.length ?? 0) > 0);
      const autoRoutingBindsOutbounds = computed(() => hasAutoRouting.value);

      return {
        inbound,
        gatewayList,
        dnsList,
        autoRoutingList,
        supportsGateway,
        supportsAutoRoute,
        supportsDesc,
        autoRoutingBindsOutbounds
      };
    }
  });
</script>

<style scoped>
  .tun-warning {
    margin-top: 6px;
    padding: 6px 8px;
    border-left: 3px solid #ffcc00;
    background: #3a2d00;
    color: #ffe08a;
    font-size: 11px;
    line-height: 1.4;
  }
</style>
