<template>
  <modal width="450" ref="modalList" :title="$t('components.ReverseItemsModal.modal_title')">
    <table class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="3">{{ $t("components.ReverseItemsModal.modal_title2") }}</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index">
          <td>{{ item.tag }}</td>
          <td>{{ item.domain }}</td>
          <td>
            <input class="button_gen button_gen_small" type="button" :value="$t('labels.delete')" @click.prevent="deleteItem(item)" />
          </td>
        </tr>
        <tr>
          <td><input v-model="newItem.tag" placeholder="tag" class="input_15_table" /></td>
          <td><input v-model="newItem.domain" placeholder="domain" class="input_20_table" /></td>
          <td>
            <input class="button_gen button_gen_small" type="button" :value="$t('labels.add')" @click.prevent="addItem" :disabled="!newItem.tag || !newItem.domain" />
          </td>
        </tr>
      </tbody>
    </table>
  </modal>
</template>
<script lang="ts">
  import { defineComponent, ref } from "vue";
  import Modal from "./../Modal.vue";
  import { XrayReverseItemType, XrayReverseItem } from "@/modules/CommonObjects";
  export default defineComponent({
    name: "ReverseItemsModal",
    components: {
      Modal
    },
    props: {
      items: {
        type: Array as () => XrayReverseItem[],
        required: true
      }
    },
    setup(props, { emit }) {
      const items = ref(props.items);
      const newItem = ref<XrayReverseItem>({ tag: "", domain: "" });
      const modalList = ref();
      const reverse_type = ref("");
      const show = (type: string) => {
        reverse_type.value = type;
        items.value = props.items;
        modalList.value.show();
      };
      const addItem = () => {
        props.items.push({ tag: newItem.value.tag!.trim(), domain: newItem.value.domain!.trim() });
        console.log("items", props.items);
        newItem.value.tag = "";
        newItem.value.domain = "";
      };
      const deleteItem = (item: XrayReverseItem) => {
        const index = props.items.indexOf(item);
        props.items.splice(index, 1);
        emit("update:items", items.value);
      };

      return { XrayReverseItemType, modalList, items, newItem, show, deleteItem, addItem };
    }
  });
</script>
