<template>
  <tr>
    <th>
      {{ $t('com.InboundCommon.label_tag') }}
      <hint v-html="$t('com.InboundCommon.hint_tag')"></hint>
    </th>
    <td>
      <input type="text" class="input_20_table" v-model="inbound.tag" />
      <span class="hint-color"></span>
    </td>
  </tr>
  <tr>
    <th>
      {{ $t('com.InboundCommon.label_listen') }}
      <hint v-html="$t('com.InboundCommon.hint_listen')"></hint>
    </th>
    <td>
      <input
        type="text"
        class="input_20_table"
        v-model="inbound.listen"
        @keypress="filterIPAddressKey"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
      />
      <span class="hint-color"></span>
    </td>
  </tr>
  <tr>
    <th>
      {{ $t('com.InboundCommon.label_port') }}
      <hint v-html="$t('com.InboundCommon.hint_port')"></hint>
    </th>
    <td>
      <input type="number" maxlength="5" class="input_6_table" v-model="inbound.port" autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this, event);" />
    </td>
  </tr>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { XrayInboundObject } from '@/modules/InboundObjects';
  import { IProtocolType } from '@/modules/Interfaces';
  import engine from '@/modules/Engine';
  import Hint from '@main/Hint.vue';
  import { filterIPAddressKey } from '@/modules/validators';

  export default defineComponent({
    name: 'InboundCommon',
    components: {
      Hint
    },
    props: {
      inbound: XrayInboundObject<IProtocolType>
    },

    setup(props) {
      const inbound = ref<XrayInboundObject<IProtocolType>>(props.inbound ?? new XrayInboundObject<IProtocolType>());

      return {
        inbound,
        engine,
        filterIPAddressKey
      };
    }
  });
</script>
