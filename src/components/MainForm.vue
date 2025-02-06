<template>
  <form method="post" name="form" id="ruleForm" action="/start_apply.htm" target="hidden_frame">
    <input type="hidden" name="current_page" :value="xray_page" />
    <input type="hidden" name="next_page" :value="xray_page" />
    <input type="hidden" name="group_id" value="" />
    <input type="hidden" name="modified" value="0" />
    <input type="hidden" name="action_mode" value="apply" />
    <input type="hidden" name="action_wait" value="5" />
    <input type="hidden" name="first_time" value="" />
    <input type="hidden" name="action_script" value="" />
    <input type="hidden" name="amng_custom" value="" />
    <table class="content" align="center" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td width="17">&nbsp;</td>
          <td valign="top" width="202">
            <main-menu></main-menu>
            <sub-menu></sub-menu>
          </td>
          <td valign="top">
            <tab-menu></tab-menu>
            <table width="98%" border="0" align="left" cellpadding="0" cellspacing="0">
              <tbody>
                <tr>
                  <td valign="top">
                    <table width="760px" border="0" cellpadding="4" cellspacing="0" id="FormTitle" class="FormTitle">
                      <tbody>
                        <tr bgcolor="#4D595D">
                          <td valign="top">
                            <div class="formfontdesc">
                              <div>&nbsp;</div>
                              <div class="formfonttitle" style="text-align: center">X-RAY UI v{{ version }}</div>
                              <div class="xray_type_switches">
                                <div class="xray_type_switch left" :class="{ selected: engine.mode === 'server' }"
                                  @click.prevent="switch_type('server')">
                                  <div>{{ $t('labels.server') }}</div>
                                </div>
                                <div class="xray_type_switch right" :class="{ selected: engine.mode === 'client' }"
                                  @click.prevent="switch_type('client')">
                                  <div>{{ $t('labels.client') }}</div>
                                </div>
                              </div>
                              <div id="formfontdesc" class="formfontdesc">{{ $t('labels.xrayui_desc') }}</div>
                              <div style="margin: 10px 0 10px 5px" class="splitLine"></div>
                              <mode-server v-model:config="xrayConfig"></mode-server>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </form>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import MainMenu from "./asus/MainMenu.vue";
import TabMenu from "./asus/TabMenu.vue";
import SubMenu from "./asus/SubMenu.vue";

import ModeServer from "./ModeServer.vue";

import engine, { SubmtActions } from "../modules/Engine";
export default defineComponent({
  name: "MainForm",
  components: {
    TabMenu,
    MainMenu,
    SubMenu,
    ModeServer
  },
  methods: {
    async switch_type(type: string) {
      engine.mode = type;
      let delay = 1000;
      window.showLoading(delay);
      window.xray.custom_settings.xray_mode = type;
      await engine.submit(SubmtActions.configurationSetMode, { mode: type }, delay);
      window.location.reload();
    }
  },

  setup() {
    return {
      engine,
      version: window.xray.custom_settings.xray_version,
      xrayConfig: engine.xrayConfig,
      xray_page: window.xray.custom_settings.xray_page
    };
  }
});
</script>
<style scoped>
.xray_type_switches {
  margin-top: -40px;
  float: right;
}

.xray_type_switch {
  cursor: pointer;
  width: 110px;
  height: 30px;
  float: left;
  background: linear-gradient(to bottom, #758084 0%, #546166 36%, #394245 100%);
  border-color: #222728;
  border-width: 1px;
  border-style: solid;
}

.xray_type_switch.left {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.xray_type_switch.right {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

.xray_type_switch.selected {
  background: none;
  background-color: #353d40;
  border-color: #222728;
  border-width: 1px;
  border-style: inset;
}

.xray_type_switch.selected div {
  color: #ffffff;
  font-weight: bold;
}

.xray_type_switch div {
  text-align: center;
  color: #cccccc;
  font-size: 14px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
