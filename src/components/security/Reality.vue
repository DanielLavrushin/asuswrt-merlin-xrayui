<template></template>

<script lang="ts">
  import { defineComponent, ref, watch, reactive } from "vue";
  import xrayConfig, { XrayStreamRealitySettingsObject } from "@/modules/XrayConfig";

  export default defineComponent({
    name: "Reality",
    setup() {
      const realitySettings = ref<XrayStreamRealitySettingsObject>(xrayConfig.inbounds?.[0].streamSettings.realitySettings ?? new XrayStreamRealitySettingsObject());

      watch(
        () => xrayConfig.inbounds?.[0].streamSettings?.realitySettings,
        (newObj) => {
          realitySettings.value = newObj ?? new XrayStreamRealitySettingsObject();
          if (!newObj) {
            xrayConfig.inbounds[0].streamSettings.realitySettings = realitySettings.value;
          }
        },
        { immediate: true }
      );

      return {
        realitySettings,
      };
    },
  });
</script>
<style scoped></style>
