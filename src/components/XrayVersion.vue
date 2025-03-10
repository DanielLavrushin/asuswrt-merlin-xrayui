<template>
  <span class="core-version" v-show="xray_version">
    X-RAY Core
    <a href="#" @click="show">{{ xray_version }}</a>
  </span>
  <xray-core-version-modal ref="modal" v-model:current-version="xray_version"></xray-core-version-modal>
</template>

<script lang="ts">
  import { EngineResponseConfig } from "@/modules/Engine";
  import { defineComponent, inject, onMounted, Ref, ref, watch } from "vue";
  import XrayCoreVersionModal from "./modals/XrayCoreVersionModal.vue";

  export default defineComponent({
    name: "XrayVersion",
    components: {
      XrayCoreVersionModal
    },
    setup() {
      const uiResponse = inject<Ref<EngineResponseConfig>>("uiResponse")!;
      const xray_version = ref("");
      const modal = ref();

      const show = async () => {
        modal.value.show();
      };

      onMounted(async () => {
        watch(
          () => uiResponse?.value.xray?.core_version,
          (value) => {
            if (value) {
              xray_version.value = value ?? "";
            }
          }
        );
      });
      return { xray_version, modal, show };
    }
  });
</script>
<style scoped>
  .core-version {
    background: initial;
    float: right;
    padding-right: 5px;
  }
  .core-version :deep(a) {
    cursor: pointer;
    text-decoration: underline;
  }
</style>
