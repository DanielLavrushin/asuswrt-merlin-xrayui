<template>
  <modal ref="modal" :title="$t('components.AllocateModal.modal_title')" width="500">
    <div class="formfontdesc">
      <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
        <thead>
          <tr>
            <td colspan="2">{{ $t("components.AllocateModal.label_settings") }}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>
              {{ $t("components.AllocateModal.label_strategy") }}
              <hint v-html="$t('components.AllocateModal.hint_strategy')"></hint>
            </th>
            <td>
              <select v-model="allocate.strategy" class="input_option">
                <option value="always">always</option>
                <option value="random">random</option>
              </select>
            </td>
          </tr>
          <tr v-if="allocate.strategy == 'random'">
            <th>
              {{ $t("components.AllocateModal.label_refresh") }}
              <hint v-html="$t('components.AllocateModal.hint_refresh')"></hint>
            </th>
            <td>
              <input type="text" maxlength="2" class="input_6_table" v-model="allocate.refresh" onkeypress="return validator.isNumber(this,event);" />
              <span class="hint-color">The minimum is 2, and recommended is 5</span>
            </td>
          </tr>
          <tr v-if="allocate.strategy == 'random'">
            <th>
              {{ $t("components.AllocateModal.label_concurrency") }}
              <hint v-html="$t('components.AllocateModal.hint_concurrency')"></hint>
            </th>
            <td>
              <input type="text" maxlength="2" class="input_6_table" v-model="allocate.concurrency" onkeypress="return validator.isNumber(this,event);" />
              <span class="hint-color">The minimum is 1, and recommended is 3</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="save" />
    </template>
  </modal>
</template>
<script lang="ts">
  import { defineComponent, ref } from "vue";
  import Modal from "../Modal.vue";
  import { XrayAllocateObject } from "../../modules/CommonObjects";
  import { XrayInboundObject } from "../../modules/InboundObjects";
  import { IProtocolType } from "../../modules/Interfaces";
  import Hint from "../Hint.vue";

  export default defineComponent({
    name: "AllocateModal",
    components: {
      Hint,
      Modal
    },
    props: {
      allocate: XrayAllocateObject
    },
    setup(props, { emit }) {
      const modal = ref();
      const allocate = ref<XrayAllocateObject>(props.allocate ?? new XrayAllocateObject());

      const show = (inbound: XrayInboundObject<IProtocolType>) => {
        inbound.allocate = allocate.value = inbound.allocate ?? new XrayAllocateObject();
        modal.value.show();
      };

      const save = () => {
        emit("save", allocate.value);
        modal.value.close();
      };

      return {
        modal,
        allocate,
        show,
        save
      };
    }
  });
</script>

<style scoped></style>
