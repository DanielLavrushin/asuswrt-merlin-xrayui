<template>
  <form ref="form" method="post" name="formScriptActions" action="/start_apply.htm" target="hidden_frame">
    <input type="hidden" name="action_mode" value="apply" />
    <input v-model="action_value" type="hidden" name="action_script" value="" />
    <input v-if="amng_custom_value" type="hidden" name="modified" value="0" />
    <input v-if="amng_custom_value" type="hidden" name="action_wait" value="" />
    <input v-if="amng_custom_value" ref="amng_custom" type="hidden" name="amng_custom" :value="amng_custom_value" />
  </form>
</template>

<script lang="ts">
  import { defineComponent, watch, ref } from "vue";

  export default defineComponent({
    name: "RequestForm",
    methods: {
      submit() {
        let form = this.$refs.form as HTMLFormElement;
        form.submit();
      },
      setActionValue(value: string) {
        this.action_value = value;
      },
      setAmgValue(value: string) {
        this.amng_custom_value = value;
      },
      getForm(): HTMLFormElement {
        return this.$refs.form as HTMLFormElement;
      },
    },
    setup() {
      const form = ref<HTMLFormElement>();
      const amng_custom_value = ref();
      const action_value = ref();

      watch(
        () => amng_custom_value.value,
        (newVal) => {
          console.log("amng_custom_value changed:", newVal);
        }
      );

      return {
        form,
        action_value,
        amng_custom_value,
      };
    },
  });
</script>
<style scoped></style>
