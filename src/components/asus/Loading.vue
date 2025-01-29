<template>
  <div id="Loading" class="popup_bg"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Loading",
});
</script>

<style scoped>
.popup_bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

:deep(.loadingBlock) {
  font-size: 14px;
}
</style>
