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
            <th>Strategy</th>
            <td>
              <select v-model="allocate.strategy" class="input_option">
                <option value="always">always</option>
                <option value="random">random</option>
              </select>
            </td>
          </tr>
          <tr v-if="allocate.strategy == 'random'">
            <th>
              <a class="hintstyle" href="javascript:void(0);"
                onmouseover="hint(this,'The interval for refreshing randomly allocated ports in minutes.');">Refresh</a>
            </th>
            <td>
              <input type="text" maxlength="2" class="input_6_table" v-model="allocate.refresh"
                onkeypress="return validator.isNumber(this,event);" />
              <span class="hint-color">The minimum is 2, and recommended is 5</span>
            </td>
          </tr>
          <tr v-if="allocate.strategy == 'random'">
            <th>
              <a class="hintstyle" href="javascript:void(0);"
                onmouseover="hint(this,'The number of randomly allocated ports.');">Concurrency</a>
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
import { XrayAllocateObject, XrayInboundObject, IProtocolType } from "../../modules/XrayConfig";

export default defineComponent({
  name: "AllocateModal",
  components: {
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
