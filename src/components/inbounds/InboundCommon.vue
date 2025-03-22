<template>
  <tr>
    <th>
      {{ $t("components.InboundCommon.label_tag") }}
      <hint v-html="$t('components.InboundCommon.hint_tag')"></hint>
    </th>
    <td>
      <input type="text" class="input_20_table" v-model="inbound.tag" />
      <span class="hint-color"></span>
    </td>
  </tr>
  <tr>
    <th>
      {{ $t("components.InboundCommon.label_listen") }}
      <hint v-html="$t('components.InboundCommon.hint_listen')"></hint>
    </th>
    <td>
      <input type="text" maxlength="15" class="input_20_table" v-model="inbound.listen" onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off" autocapitalize="off" />
      <span class="hint-color"></span>
    </td>
  </tr>
  <tr>
    <th>
      {{ $t("components.InboundCommon.label_port") }}
      <hint v-html="$t('components.InboundCommon.hint_port')"></hint>
    </th>
    <td>
      <input type="number" id="po1" maxlength="5" class="input_6_table" v-model="inbound.port" autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
      <span class="row-buttons">
        <a class="button_gen button_gen_small" href="#" @click="show_allocate(inbound)">{{ $t("components.InboundCommon.label_port_allocate") }}</a>
      </span>
      <allocate-modal ref="allocateModal" />
    </td>
  </tr>
</template>

<script lang="ts">
  import { defineComponent, ref, watch } from "vue";
  import AllocateModal from "../modals/AllocateModal.vue";
  import { XrayInboundObject } from "../../modules/InboundObjects";
  import { IProtocolType } from "../../modules/Interfaces";
  import engine from "../../modules/Engine";
  import Hint from "../Hint.vue";

  export default defineComponent({
    name: "InboundCommon",
    components: {
      Hint,
      AllocateModal
    },
    props: {
      inbound: XrayInboundObject<IProtocolType>
    },

    setup(props) {
      const allocateModal = ref();
      const inbound = ref<XrayInboundObject<IProtocolType>>(props.inbound ?? new XrayInboundObject<IProtocolType>());

      const show_allocate = async (inbound: XrayInboundObject<IProtocolType>) => {
        await allocateModal.value.show(inbound);
      };

      return {
        allocateModal,
        inbound,
        engine,
        show_allocate
      };
    }
  });
</script>
