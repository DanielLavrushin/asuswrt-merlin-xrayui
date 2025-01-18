<template>
  <modal ref="modal" title="The port allocation strategy">
    <div class="formfontdesc">
      <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
        <thead>
          <tr>
            <td colspan="2">Settings</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Strategy
              <hint>
                The port allocation strategy.
                <ul>
                  <li>`always`: all specified ports in port will be allocated, and Xray will listen on these ports.</li>
                  <li>`random`: ports will be randomly selected from the port range every refresh minutes, and
                    concurrency ports will be listened on.</li>
                </ul>
              </hint>
            </th>
            <td>
              <select v-model="allocate.strategy" class="input_option">
                <option value="always">always</option>
                <option value="random">random</option>
              </select>
            </td>
          </tr>
          <tr v-if="allocate.strategy == 'random'">
            <th>Refresh
              <hint>
                The interval for refreshing randomly allocated ports in minutes. The minimum value is `2`, and it is
                recommended to set to `5`. This property is only effective when `strategy` is set to `random`.
              </hint>
            </th>
            <td>
              <input type="text" maxlength="2" class="input_6_table" v-model="allocate.refresh"
                onkeypress="return validator.isNumber(this,event);" />
              <span class="hint-color">The minimum is 2, and recommended is 5</span>
            </td>
          </tr>
          <tr v-if="allocate.strategy == 'random'">
            <th>Concurrency
              <hint>
                The number of randomly allocated ports. The `minimum` value is `1`, and the `maximum` value is one-third
                of
                the port range. It is recommended to set to `3`.
              </hint>
            </th>
            <td>
              <input type="text" maxlength="2" class="input_6_table" v-model="allocate.concurrency"
                onkeypress="return validator.isNumber(this,event);" />
              <span class="hint-color">The minimum is 1, and recommended is 3</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" value="Save" @click.prevent="save" />
    </template>
  </modal>
</template>
<script lang="ts">
import { defineComponent, ref, } from "vue";
import Modal from "../Modal.vue";
import { XrayAllocateObject } from "../../modules/CommonObjects";
import { XrayInboundObject } from "../../modules/InboundObjects";
import { IProtocolType } from "../../modules/Interfaces";
import Hint from "../Hint.vue";

export default defineComponent({
  name: "AllocateModal",
  components: {
    Hint,
    Modal,
  },
  props: {
    allocate: XrayAllocateObject,
  },
  methods: {
    show(inbound: XrayInboundObject<IProtocolType>) {
      inbound.allocate = this.allocate = inbound.allocate ?? new XrayAllocateObject();
      this.modal.show();
    },
    save() {
      this.$emit("save", this.allocate);
      this.modal.close();
    },
  },
  setup(props) {
    const modal = ref();

    const allocate = ref<XrayAllocateObject>(props.allocate ?? new XrayAllocateObject());
    return {
      modal,
      allocate
    };
  },
});
</script>

<style scoped></style>
