<template>
  <form ref="form" method="post" name="formScriptActions" action="/start_apply.htm" target="hidden_frame">
    <input type="hidden" name="action_mode" value="apply" />
    <input type="hidden" name="action_script" value="" />
    <input type="hidden" name="modified" value="0" />
    <input type="hidden" name="action_wait" value="" />
    <input type="hidden" name="amng_custom" value="" />
  </form>
</template>

<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    name: "RequestForm",
    methods: {
      getForm(): HTMLFormElement {
        return this.$refs.form as HTMLFormElement;
      },
    },
  });
</script>
<style scoped></style>
