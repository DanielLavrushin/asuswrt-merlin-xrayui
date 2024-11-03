<template>
  <iframe name="hidden_frame" id="hidden_frame" src="about:blank" width="0" height="0" frameborder="0" @load="onLoad"></iframe>
</template>

<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    name: "HiddenFrame",
    emits: ["asus-submit-complete"],
    methods: {
      onLoad() {
        setTimeout(() => {
          this.$emit("asus-submit-complete");
        }, 200);
      },
    },
  });
</script>
<style scoped></style>
