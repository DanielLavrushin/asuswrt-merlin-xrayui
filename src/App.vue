<template>
  <top-banner></top-banner>
  <loading></loading>
  <hidden-frame @asus-submit-complete="engine.handleSubmitCompletion"></hidden-frame>
  <main-form></main-form>
  <request-form ref="requestform"></request-form>
  <asus-footer></asus-footer>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted, provide, getCurrentInstance, reactive } from "vue";
  import TopBanner from "./components/asus/TopBanner.vue";
  import Loading from "./components/asus/Loading.vue";
  import HiddenFrame from "./components/asus/HiddenFrame.vue";
  import AsusFooter from "./components/asus/Footer.vue";

  import engine from "./modules/Engine";
  import MainForm from "./components/MainForm.vue";
  import RequestForm from "./components/RequestForm.vue";

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
      const xrayConfig = engine.xrayConfig;
      provide("xrayConfig", xrayConfig);

      const requestform = ref<HTMLFormElement | null>(null);

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      onMounted(async () => {
        window.show_menu();
        const instance = getCurrentInstance();
        const requestform = instance?.proxy?.$refs.requestform as InstanceType<typeof RequestForm>;

        if (requestform) {
          engine.init(requestform);
          engine.submit(window.xray.commands.refreshConfig, null, engine.defaultSubmission);

          await delay(1000);

          await engine.loadXrayConfig();
        } else {
          console.error("Form element is not found");
        }
      });

      return {
        engine,
        requestform,
        xrayConfig: engine.xrayConfig,
      };
    },
  });
</script>

<style>
  input[type="checkbox"],
  input[type="radio"] {
    vertical-align: top;
  }
  .hint-color {
    float: right;
    margin-right: 5px;
  }
  .FormTable td span.label {
    color: white;
    padding: 0 5px;
    border-radius: 5px;
    margin: 4px 0 0 0;
    font-weight: bold;
  }
  .FormTable td span.label-error {
    background-color: red;
  }
  .FormTable td span.label-success {
    background-color: green;
  }
  .row-buttons {
    float: right;
  }
  .button_gen_small {
    min-width: auto;
    border-radius: 4px;
    padding: 3px 5px 5px 5px;
    margin: 2px;
    font-weight: normal;
    height: 20px;
    font-size: 10px;
  }

  .input_100_table {
    width: 70%;
  }

  td .hint-color {
    margin-left: 5px;
    vertical-align: middle;
  }
  .FormTable td span.label {
    padding: 5px;
  }
  .textarea-wrapper {
    margin: 0px 10px 0 2px;
  }

  textarea {
    color: #ffffff;
    background: #596e74;
    border: 1px solid #929ea1;
    font-family: Courier New, Courier, monospace;
    font-size: 13px;
    width: 100%;
    padding: 3px;
    box-sizing: content-box;
    height: 100px;
  }
</style>
