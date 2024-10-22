<template>
  <top-banner></top-banner>
  <loading></loading>
  <hidden-frame></hidden-frame>
  <main-form></main-form>
  <request-form ref="requestform"></request-form>
  <asus-footer></asus-footer>
</template>

<script lang="ts">
  import { defineComponent, getCurrentInstance, onMounted, ref } from "vue";

  import engine from "./modules/Engine";
  import TopBanner from "./components/TopBanner.vue";
  import Loading from "./components/Loading.vue";
  import HiddenFrame from "./components/HiddenFrame.vue";
  import MainForm from "./components/MainForm.vue";
  import RequestForm from "./components/RequestForm.vue";
  import AsusFooter from "./components/Footer.vue";

  export default defineComponent({
    name: "App",
    components: {
      TopBanner,
      Loading,
      HiddenFrame,
      MainForm,
      RequestForm,
      AsusFooter,
    },
    setup() {
      const requestform = ref<HTMLFormElement | null>(null);

      onMounted(() => {
        window.show_menu();
        const instance = getCurrentInstance();
        const requestform = instance?.proxy?.$refs.requestform as InstanceType<typeof RequestForm>;

        if (requestform) {
          let form = requestform.getForm();
          engine.init(form);
          engine.submit("xrayui_refreshconfig");
          setTimeout(engine.loadXrayConfig, 1e3);
        } else {
          console.error("Form element is not found");
        }
      });

      return {
        requestform,
      };
    },
  });
</script>

<style>
  .button_gen_small {
    min-width: auto;
    border-radius: 4px;
    margin: 5px;
    float: right;
    font-weight: normal;
    height: 20px;
    font-size: 10px;
  }

  .input_100_table {
    width: 70%;
  }
</style>
