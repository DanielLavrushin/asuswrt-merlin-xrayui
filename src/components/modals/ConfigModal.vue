<template>
  <modal ref="modal" :title="$t('components.ConfigModal.modal_title')" width="800px">
    <div class="formfontdesc">
      <div class="configArea">
        <json-pretty :data="configJson" :deep="2" :show-line-number="true" :show-icon="true" :show-line="false"
          :show-length="true"></json-pretty>
      </div>
    </div>
    <template v-slot:footer>
      <label><input type="checkbox" v-model="hideSenseData" @change="hide_sense_data()" />
        {{ $t('components.ConfigModal.hide_sensetive_data') }}</label>
      <input class="button_gen button_gen_small" type="button" :value="$t('components.ConfigModal.copy_to_clipboard')"
        @click.prevent="copy_to_clipboard()" />
      <a class="button_gen button_gen_small" :href="configUri" target="_blank">
        {{ $t('components.ConfigModal.open_raw') }}
      </a>
    </template>
  </modal>
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";
import Modal from "../Modal.vue";
import Hint from "../Hint.vue";
import JsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import { useI18n } from "vue-i18n";
export default defineComponent({
  name: "AllocateModal",
  components: {
    Hint,
    Modal,
    JsonPretty
  },
  props: {},

  setup(props) {
    const { t } = useI18n();
    const modal = ref();
    let originalConfig = {};
    const configJson = ref();
    const configUri = "/ext/xrayui/xray-config.json";
    const hideSenseData = ref(true);

    const load = async () => {
      let response = await fetch(configUri);
      let data = await response.json();
      configJson.value = originalConfig = data;
      hide_sense_data();
    };
    const show = async () => {
      await load();
      modal.value.show();
    };

    const copy_to_clipboard = async () => {
      hide_sense_data();
      const configStr = JSON.stringify(configJson.value, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(configStr);
        } catch (err) {
          console.error("Clipboard API error, falling back", err);
          fallbackCopyTextToClipboard(configStr);
        }
      } else {
        fallbackCopyTextToClipboard(configStr);
      }
    };

    const fallbackCopyTextToClipboard = (text: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";

      document.body.appendChild(textArea);
      textArea.select();

      try {
        // eslint-disable-next-line
        const successful = document.execCommand("copy");
        if (!successful) {
          alert("Copying to clipboard failed. Please copy the text manually:\n\n" + text);
        } else {
          if (hideSenseData.value) {
            alert(t("components.ConfigModal.alert_copy_ok_hiddendata"));
          } else {
            alert(t('components.ConfigModal.alert_copy_ok_nohiddendata'));
          }
        }
      } catch (err) {
        console.error("Fallback copy error:", err);
        alert("Copying to clipboard failed. Please copy the text manually:\n\n" + text);
      }

      document.body.removeChild(textArea);
    };

    const hide_chars = (str: string | number | undefined) => {
      if (str === undefined) return undefined;

      if (typeof str === "string") return str.replace(/./g, "*");

      return parseInt(str.toString().replace(/.\d/g, "0"));
    };
    const maskField = (obj: any, field: string) => {
      if (obj && obj[field] !== undefined) {
        obj[field] = hide_chars(obj[field]);
      }
    };
    const hide_sense_data = () => {
      if (hideSenseData.value) {
        const clone = JSON.parse(JSON.stringify(originalConfig));
        if (clone.inbounds) {
          clone.inbounds.forEach((inbound: any) => {
            if (inbound.settings) {
              maskField(inbound.settings, "secretKey");
              maskField(inbound.settings, "address");
              maskField(inbound.settings, "port");
              maskField(inbound.settings, "password");
            }
            if (inbound.streamSettings) {
              if (inbound.streamSettings.realitySettings) {
                maskField(inbound.streamSettings.realitySettings, "serverName");
                maskField(inbound.streamSettings.realitySettings, "publicKey");
                maskField(inbound.streamSettings.realitySettings, "shortId");
              }
              if (inbound.streamSettings.tlsSecurity) {
                maskField(inbound.streamSettings.tlsSecurity, "serverName");
              }
            }
            if (inbound.clients) {
              inbound.clients.forEach((client: any) => {
                maskField(client, "email");
                maskField(client, "id");
                maskField(client, "user");
                maskField(client, "pass");
              });
            }
          });
        }
        if (clone.outbounds) {
          clone.outbounds.forEach((outbound: any) => {
            if (outbound.streamSettings) {
              if (outbound.streamSettings.realitySettings) {
                maskField(outbound.streamSettings.realitySettings, "serverName");
                maskField(outbound.streamSettings.realitySettings, "publicKey");
                maskField(outbound.streamSettings.realitySettings, "shortId");
              }
              if (outbound.streamSettings.tlsSecurity) {
                maskField(outbound.streamSettings.tlsSecurity, "serverName");
              }
            }
            if (outbound.settings?.servers) {
              outbound.settings.servers.forEach((server: any) => {
                maskField(server, "address");
                maskField(server, "port");
                if (server.users) {
                  server.users.forEach((user: any) => {
                    maskField(user, "email");
                    maskField(user, "id");
                    maskField(user, "password");
                  });
                }
              });
            }
            if (outbound.settings?.vnext) {
              outbound.settings.vnext.forEach((server: any) => {
                maskField(server, "address");
                maskField(server, "port");
                if (server.users) {
                  server.users.forEach((user: any) => {
                    maskField(user, "email");
                    maskField(user, "id");
                    maskField(user, "password");
                  });
                }
              });
            }
          });
        }
        configJson.value = clone;
      } else {
        configJson.value = originalConfig;
      }
    };
    return {
      modal,
      configJson,
      hideSenseData,
      configUri,
      show,
      copy_to_clipboard,
      hide_sense_data
    };
  }
});
</script>

<style scoped>
.configArea {
  background-color: #475a5f;
  text-align: left;
  height: 500px;
  overflow: scroll;
  scrollbar-width: thin;
  scrollbar-color: #ffffff #576d73;
}

:deep(.vjs-value-string) {
  color: #fc0;
}

:deep(.vjs-tree-node.is-highlight),
:deep(.vjs-tree-node:hover) {
  background-color: initial;
}
</style>
