<template>
  <tr>
    <th>
      {{ $t("components.OutboundCommon.label_tag") }}
      <hint v-html="$t('components.OutboundCommon.hint_tag')"></hint>
    </th>
    <td>
      <input type="text" class="input_20_table" v-model="proxy.tag" />
      <span class="hint-color"></span>
    </td>
  </tr>
  <tr>
    <th>
      {{ $t("components.OutboundCommon.label_send_through") }}
      <hint v-html="$t('components.OutboundCommon.hint_send_through')"></hint>
    </th>
    <td>
      <input type="text" class="input_20_table" v-model="proxy.sendThrough" autocomplete="off" autocorrect="off" autocapitalize="off" />
      <span class="hint-color">default: 0.0.0.0</span>
    </td>
  </tr>
</template>

<script lang="ts">
  import { defineComponent, ref } from "vue";
  import { XrayOutboundObject } from "../../modules/OutboundObjects";
  import { IProtocolType } from "../../modules/Interfaces";
  import AllocateModal from "../modals/AllocateModal.vue";
  import Hint from "./../Hint.vue";

  export default defineComponent({
    name: "OutboundCommon",
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
