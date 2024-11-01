<template>
  <iframe name="hidden_frame" id="hidden_frame" src="about:blank" width="0" height="0" frameborder="0"></iframe>
</template>

<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    name: "HiddenFrame",
  });
</script>
<style scoped></style>
