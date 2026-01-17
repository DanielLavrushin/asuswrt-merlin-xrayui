<template>
  <div class="formfontdesc" v-if="inbound.settings">
    <p>{{ $t('com.ShadowsocksInbound.modal_desc') }}</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t('com.ShadowsocksInbound.modal_title') }}</td>
        </tr>
      </thead>
      <tbody>
        <inbound-common :inbound="inbound"></inbound-common>
        <tr>
          <th>
            {{ $t('com.ShadowsocksInbound.label_network') }}
            <hint v-html="$t('com.ShadowsocksInbound.hint_network')"></hint>
          </th>
          <td>
            <select v-model="inbound.settings.network" class="input_option">
              <option v-for="flow in networks" :value="flow" :key="flow">{{ flow }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.ShadowsocksInbound.label_method') }}
            <hint v-html="$t('com.ShadowsocksInbound.hint_method')"></hint>
          </th>
          <td>
            <select v-model="inbound.settings.method" class="input_option">
              <option v-for="encryption in encryptions" :value="encryption" :key="encryption">{{ encryption }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.ShadowsocksInbound.label_password') }}
            <hint v-html="$t('com.ShadowsocksInbound.hint_password')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="inbound.settings.password" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <button @click.prevent="generate_password()" class="button_gen button_gen_small">generate</button>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.ShadowsocksInbound.label_email') }}
            <hint v-html="$t('com.ShadowsocksInbound.hint_email')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="inbound.settings.email" autocomplete="off" autocorrect="off" autocapitalize="off" placeholder="Optional" />
          </td>
        </tr>
      </tbody>
    </table>
    <clients :clients="inbound.settings.clients"></clients>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import Clients from '@clients/ShadowsocksClients.vue';
  import InboundCommon from './InboundCommon.vue';
  import { XrayProtocol } from '@/modules/CommonObjects';
  import { XrayInboundObject } from '@/modules/InboundObjects';
  import { XrayOptions } from '@/modules/Options';
  import { XrayShadowsocksInboundObject } from '@/modules/InboundObjects';
  import Hint from '@main/Hint.vue';
  import engine from '@/modules/Engine';

  export default defineComponent({
    name: 'ShadowsocksInbound',
    components: {
      Clients,
      InboundCommon,
      Hint
    },
    props: {
      inbound: XrayInboundObject<XrayShadowsocksInboundObject>
    },
    setup(props) {
      const inbound = ref<XrayInboundObject<XrayShadowsocksInboundObject>>(
        props.inbound ?? new XrayInboundObject<XrayShadowsocksInboundObject>(XrayProtocol.SHADOWSOCKS, new XrayShadowsocksInboundObject())
      );

      const generate_password = () => {
        if (inbound.value.settings) {
          inbound.value.settings.password = engine.generateRandomBase64();
        }
      };
      return {
        inbound,
        networks: XrayOptions.networkOptions,
        encryptions: XrayOptions.encryptionOptions,
        generate_password
      };
    }
  });
</script>
