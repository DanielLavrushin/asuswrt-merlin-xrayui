<template>
  <tr>
    <th>
      {{ $t('com.OutboundCommon.label_tag') }}
      <hint v-html="$t('com.OutboundCommon.hint_tag')"></hint>
    </th>
    <td>
      <input type="text" class="input_20_table" v-model="proxy.tag" />
      <span class="hint-color"></span>
    </td>
  </tr>
  <tr>
    <th>
      {{ $t('com.OutboundCommon.label_send_through') }}
      <hint v-html="$t('com.OutboundCommon.hint_send_through')"></hint>
    </th>
    <td>
      <input type="text" class="input_20_table" v-model="proxy.sendThrough" autocomplete="off" autocorrect="off" autocapitalize="off" />
      <span class="hint-color">default: 0.0.0.0</span>
    </td>
  </tr>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { XrayOutboundObject } from '@/modules/OutboundObjects';
  import { IProtocolType } from '@/modules/Interfaces';
  import AllocateModal from '@modal/AllocateModal.vue';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'OutboundCommon',
    components: {
      AllocateModal,
      Hint
    },
    props: {
      proxy: XrayOutboundObject<IProtocolType>
    },
    setup(props) {
      const proxy = ref<XrayOutboundObject<IProtocolType>>(props.proxy ?? new XrayOutboundObject<IProtocolType>());

      return {
        proxy
      };
    }
  });
</script>
