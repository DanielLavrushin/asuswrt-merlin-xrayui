<template>
  <top-banner></top-banner>
  <loading></loading>
  <main-form></main-form>
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

export default defineComponent({
  name: "App",
  components: {
    TopBanner,
    Loading,
    HiddenFrame,
    MainForm,
    AsusFooter
  },
  setup() {
    engine.mode = window.xray.custom_settings.xray_mode;
    window.scrollTo = () => { };
    const xrayConfig = engine.xrayConfig;
    provide("xrayConfig", xrayConfig);

    onMounted(async () => {
      window.show_menu();
      window.showLoading(null, "waiting");
      await engine.loadXrayConfig();
      window.hideLoading();
    });

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
  text-decoration: underline !important;
  cursor: pointer;
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

select>option[disabled] {
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
</style>
