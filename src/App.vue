<template>
  <top-banner></top-banner>
  <loading></loading>
  <main-form></main-form>
  <asus-footer></asus-footer>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted, provide } from "vue";
  import TopBanner from "./components/asus/TopBanner.vue";
  import Loading from "./components/asus/Loading.vue";
  import AsusFooter from "./components/asus/Footer.vue";

  import engine, { EngineResponseConfig, SubmtActions } from "./modules/Engine";
  import MainForm from "./components/MainForm.vue";

  export default defineComponent({
    name: "App",
    components: {
      TopBanner,
      Loading,
      MainForm,
      AsusFooter
    },
    setup() {
      const uiResponse = ref(new EngineResponseConfig());
      engine.mode = window.xray.custom_settings.xray_mode;
      window.scrollTo = () => {};
      const xrayConfig = engine.xrayConfig;
      provide("xrayConfig", xrayConfig);

      onMounted(async () => {
        window.show_menu();
        await engine.loadXrayConfig();
        await engine.submit(SubmtActions.initResponse);
        setTimeout(async () => {
          uiResponse.value = await engine.getXrayResponse();
        }, 1000);
      });

      provide("uiResponse", uiResponse);
      return {
        engine,
        xrayConfig: engine.xrayConfig
      };
    }
  });
</script>

<style>
  #Loading {
    z-index: 9999;
  }

  #overDiv {
    z-index: 9999;
  }

  .hint {
    color: #fc0 !important;
    text-decoration: underline;
    cursor: pointer;
  }

  .hint.tag {
    text-decoration: none;
  }

  input[type="checkbox"],
  input[type="radio"] {
    vertical-align: top;
  }

  .hint-color {
    color: #fc0;
    float: right;
    margin-right: 5px;
  }

  .hint-small {
    font-size: 8pt;
  }

  .hint-color a {
    text-decoration: underline;
    color: #fc0;
  }

  .FormTable {
    margin-bottom: 14px;
  }

  .FormTable td span.label {
    color: white;
    padding: 0 5px;
    border-radius: 4px;
    margin: 4px 0 0 0;
    font-weight: bold;
  }

  .FormTable td span.label-error {
    background-color: red;
  }

  .FormTable td span.label-success {
    background-color: green;
  }

  .FormTable td span.label-warning {
    background-color: #ffcc00;
    color: #596e74;
  }

  .row-buttons {
    float: right;
  }

  .row-buttons label {
    margin-right: 10px;
    vertical-align: middle;
  }

  .button_gen_small {
    min-width: auto;
    border-radius: 4px;
    padding: 3px 5px 5px 5px;
    margin: 2px;
    font-weight: normal;
    height: 20px;
    font-size: 10px;
    color: white !important;
    text-decoration: none !important;
  }

  .input_100_table {
    width: 70%;
  }

  td .hint-color {
    margin-left: 5px;
    vertical-align: middle;
  }

  .FormTable td span.label {
    padding: 3px 5px 3px 5px;
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

  .formfontdesc p {
    text-align: left;
    margin-bottom: 10px;
  }

  .button_info {
    background: initial;
    background-color: #ffcc00;
    font-weight: bold;
    border-radius: 10px;
    padding: 3px 8px 5px 8px;
  }

  select > option[disabled] {
    color: #fc0;
  }

  .xrayui-hint {
    display: none;
  }

  #overDiv blockquote {
    margin: 10px;
    padding: 0 0 0 1em;
    border-left: 3px solid #ffcc00;
  }

  .FormTable td .proxy-label {
    color: white;
    padding: 2px 10px;
    border-radius: 4px;
    margin: 0 0 0 4px;
    font-weight: bold;
    background-color: #929ea1;
    box-shadow: 0 0 2px #000;
  }

  .FormTable td .proxy-label.tag:hover {
    box-shadow: 0 0 5px #ffcc00;
  }

  .FormTable td .proxy-label.tag {
    border: 1px solid #ffcc00;
    text-decoration: none;
    background: transparent;
    color: #fc0;
  }

  .FormTable td .proxy-label.reality {
    background-color: rgb(95, 1, 95);
  }

  .FormTable td .proxy-label.tls {
    background-color: rgb(136, 5, 5);
  }

  .FormTable td .proxy-label.tcp {
    background-color: rgb(35, 46, 46);
  }

  .FormTable td .proxy-label.kcp {
    background-color: rgb(0, 114, 0);
  }

  .FormTable td .proxy-label.ws {
    background-color: rgb(2, 0, 150);
  }

  .FormTable td .proxy-label.xhttp {
    background-color: rgb(153, 130, 0);
  }

  .FormTable td .proxy-label.grpc {
    background-color: rgb(207, 78, 2);
  }

  .FormTable td .proxy-label.httpupgrade {
    background-color: rgb(2, 82, 119);
  }

  .FormTable td .proxy-label.splithttp {
    background-color: rgb(94, 10, 59);
  }

  .FormTable td.height-overflow {
    max-height: 140px;
    overflow: hidden;
    overflow-y: scroll;
    scrollbar-width: thin;
    scrollbar-color: #ffffff #576d73;
  }
  .flex-checkbox {
    border: none !important;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .flex-checkbox > * {
    flex: 0 1 calc(25%);
  }

  .flex-checkbox.flex-checkbox-25 > * {
    flex: 0 1 calc(25%);
  }
  .flex-checkbox.flex-checkbox-50 > * {
    flex: 0 1 calc(50%);
  }
  blockquote {
    margin: 10px 0;
    padding: 5px;
    border-left: 3px solid #ffcc00;
  }
</style>
