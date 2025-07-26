<template>
  <div class="formfontdesc">
    <p>{{ $t('com.SockOpt.hint') }}</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Settings</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>
            {{ $t('com.SockOpt.label_tproxy_enable') }}
            <hint v-html="$t('com.SockOpt.hint_tproxy_enable')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="sockopt.tproxy">
              <option v-for="(opt, index) in tproxyOptions" :key="index" :value="opt">{{ opt }}</option>
            </select>
            <span class="hint-color">default: off</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.SockOpt.label_tproxy_interface') }}
            <hint v-html="$t('com.SockOpt.hint_tproxy_interface')"></hint>
          </th>
          <td>
            <input type="number" maxlength="15" class="input_20_table" v-model="sockopt.interface" />
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.SockOpt.label_tproxy_domain_strategy') }}
            <hint v-html="$t('com.SockOpt.hint_tproxy_domain_strategy')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="sockopt.domainStrategy">
              <option v-for="(opt, index) in domainStrategyOptions" :key="index" :value="opt">{{ opt }}</option>
            </select>
            <span class="hint-color">default: AsIs</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.SockOpt.label_tproxy_mark') }}
            <hint v-html="$t('com.SockOpt.hint_tproxy_mark')"></hint>
          </th>
          <td>
            <input type="number" maxlength="3" class="input_6_table" v-model="sockopt.mark" />
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.SockOpt.label_tcpmptcp') }}
            <hint v-html="$t('com.SockOpt.hint_tcpmptcp')"></hint>
          </th>
          <td>
            <input type="checkbox" v-model="sockopt.tcpMptcp" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.SockOpt.label_tcp_no_delay') }}
            <hint v-html="$t('com.SockOpt.hint_tcp_no_delay')"></hint>
          </th>
          <td>
            <input type="checkbox" v-model="sockopt.tcpNoDelay" />
            <span class="hint-color">default false, recommended to be enabled with "Multipath": true</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.SockOpt.label_dealer_proxy') }}
            <hint v-html="$t('com.SockOpt.hint_dealer_proxy')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="sockopt.dialerProxy">
              <option value="">none</option>
              <option v-for="(opt, index) in outboundOptions" :key="index" :value="opt">{{ opt }}</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, ref, watch } from 'vue';
  import { XraySockoptObject, XrayStreamSettingsObject } from '@/modules/CommonObjects';
  import Hint from '@main/Hint.vue';
  import xrayConfig from '@modules/XrayConfig';
  export default defineComponent({
    name: 'Sockopt',
    components: {
      Hint
    },
    props: {
      transport: XrayStreamSettingsObject
    },
    setup(props) {
      const sockopt = ref<XraySockoptObject>(props.transport?.sockopt ?? new XraySockoptObject());

      const outboundOptions = computed(() => {
        return xrayConfig.outbounds.filter((outbound) => outbound.tag).map((outbound) => outbound.tag);
      });
      watch(
        () => props.transport,
        () => {
          if (props.transport && !props.transport?.sockopt) {
            props.transport.sockopt = sockopt.value;
          }
          sockopt.value = props.transport?.sockopt ?? new XraySockoptObject();
        },
        { immediate: true }
      );

      return {
        sockopt,
        domainStrategyOptions: XraySockoptObject.domainStrategyOptions,
        tproxyOptions: XraySockoptObject.tproxyOptions,
        outboundOptions
      };
    }
  });
</script>
