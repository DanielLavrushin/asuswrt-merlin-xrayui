<template>
  <div class="formfontdesc">
    <p>{{ $t('com.BlackholeOutbound.modal_desc') }}</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t('com.BlackholeOutbound.modal_title') }}</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr v-if="proxy.settings.response">
          <th>
            {{ $t('com.BlackholeOutbound.label_response') }}
            <hint v-html="$t('com.BlackholeOutbound.hint_response')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="proxy.settings.response.type">
              <option v-for="opt in responses" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import OutboundCommon from './OutboundCommon.vue';
  import { XrayProtocol } from '@/modules/CommonObjects';
  import { XrayBlackholeOutboundObject, XrayOutboundObject } from '@/modules/OutboundObjects';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'BlackholeOutbound',
    components: {
      OutboundCommon,
      Hint
    },
    props: {
      proxy: XrayOutboundObject<XrayBlackholeOutboundObject>
    },
    setup(props) {
      const proxy = ref<XrayOutboundObject<XrayBlackholeOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayBlackholeOutboundObject>(XrayProtocol.BLACKHOLE, new XrayBlackholeOutboundObject()));
      const responses = ref(['none', 'http']);

      return {
        proxy,
        responses
      };
    }
  });
</script>
