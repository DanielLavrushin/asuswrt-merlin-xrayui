<template>
  <span class="core-version" v-show="xray_version">X-RAY Core {{ xray_version }}</span>
</template>

<script lang="ts">
  import { EngineResponseConfig } from "@/modules/Engine";
  import { defineComponent, inject, onMounted, Ref, ref, watch } from "vue";

  export default defineComponent({
    name: "XrayVersion",
    setup() {
      const uiResponse = inject<Ref<EngineResponseConfig>>("uiResponse")!;
      const xray_version = ref<string>();

      onMounted(async () => {
        watch(
          () => uiResponse?.value.xray?.core_version,
          (value) => {
            if (value) {
              xray_version.value = value;
            }
          }
        );
      });
      return { xray_version };
    }
  });
</script>
<style scoped>
  .core-version {
    background: initial;
    float: right;
    padding-right: 5px;
  }
</style>
