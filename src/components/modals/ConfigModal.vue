<template>
  <modal ref="modal" :title="$t('com.ConfigModal.modal_title')" width="800">
    <div class="formfontdesc">
      <div class="configArea">
        <json-pretty :data="configJson" :deep="2" :show-line-number="true" :show-icon="true" :show-line="false" :show-length="true"> </json-pretty>
      </div>
      <label class="config-size-label"> {{ configSize }}/8000 ({{ ((configSize / 8000) * 100).toFixed(0) }}%) </label>
    </div>
    <template v-slot:footer>
      <label>
        <input type="checkbox" v-model="hideSenseData" @change="hide_sense_data" />
        {{ $t('com.ConfigModal.hide_sensetive_data') }}
      </label>
      <input class="button_gen button_gen_small" type="button" :value="$t('com.ConfigModal.copy_to_clipboard')" @click.prevent="copy_to_clipboard" />
      <a class="button_gen button_gen_small" :href="configUri" target="_blank">
        {{ $t('com.ConfigModal.open_raw') }}
      </a>
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import JsonPretty from 'vue-json-pretty';
  import 'vue-json-pretty/lib/styles.css';
  import { useI18n } from 'vue-i18n';

  export default defineComponent({
    name: 'ConfigModal',
    components: {
      Hint,
      Modal,
      JsonPretty
    },
    setup() {
      const { t } = useI18n();
      const modal = ref<any>(null);
      let originalConfig: any = {};
      const configJson = ref<any>(null);
      const configSize = ref<number>(0);
      const configUri = '/ext/xrayui/xray-config.json';
      const hideSenseData = ref<boolean>(true);
      const sensitiveKeys = ['secretKey', 'address', 'password', 'serverName', 'publicKey', 'shortIds', 'privateKey', 'shortId', 'email', 'id', 'user', 'pass', 'certificate', 'key', 'mac'];

      const maskObject = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map((item) => maskObject(item));
        } else if (obj !== null && typeof obj === 'object') {
          const newObj: any = {};
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              if (sensitiveKeys.includes(key)) {
                // If the value is an array, process each element.
                if (Array.isArray(obj[key])) {
                  newObj[key] = obj[key].map((item) => (typeof item === 'string' || typeof item === 'number' ? hide_chars(item) : maskObject(item)));
                } else if (typeof obj[key] === 'string' || typeof obj[key] === 'number') {
                  newObj[key] = hide_chars(obj[key]);
                } else {
                  newObj[key] = maskObject(obj[key]);
                }
              } else {
                newObj[key] = maskObject(obj[key]);
              }
            }
          }
          return newObj;
        } else {
          return obj;
        }
      };

      // Replaces every character in a string with '*' or returns a masked number.
      const hide_chars = (str: string | number | undefined) => {
        if (str === undefined) return undefined;
        if (typeof str === 'string') return str.replace(/./g, '*');
        return Number(str.toString().replace(/.\d/g, '0'));
      };

      // Loads the configuration from the URI and updates reactive state.
      const load = async () => {
        try {
          const response = await fetch(configUri);
          const data = await response.json();
          originalConfig = data;
          configJson.value = data;
          configSize.value = JSON.stringify(data).length;
          hide_sense_data();
        } catch (error) {
          console.error('Error loading config:', error);
        }
      };

      const show = async () => {
        await load();
        modal.value.show();
      };

      // Copies the configuration (after applying sensitive-data masking) to the clipboard.
      const copy_to_clipboard = async () => {
        hide_sense_data();
        const configStr = JSON.stringify(configJson.value, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(configStr);
            if (hideSenseData.value) {
              alert(t('com.ConfigModal.alert_copy_ok_hiddendata'));
            } else {
              alert(t('com.ConfigModal.alert_copy_ok_nohiddendata'));
            }
          } catch (err) {
            console.error('Clipboard API error, falling back', err);
            fallbackCopyTextToClipboard(configStr);
          }
        } else {
          fallbackCopyTextToClipboard(configStr);
        }
      };

      // Fallback for copying text to clipboard using a temporary textarea.
      const fallbackCopyTextToClipboard = (text: string) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        Object.assign(textArea.style, {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '2em',
          height: '2em',
          padding: '0',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
          background: 'transparent'
        });
        document.body.appendChild(textArea);
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (!successful) {
            alert('Copying to clipboard failed. Please copy the text manually:\n\n' + text);
          } else {
            if (hideSenseData.value) {
              alert(t('com.ConfigModal.alert_copy_ok_hiddendata'));
            } else {
              alert(t('com.ConfigModal.alert_copy_ok_nohiddendata'));
            }
          }
        } catch (err) {
          console.error('Fallback copy error:', err);
          alert('Copying to clipboard failed. Please copy the text manually:\n\n' + text);
        }
        document.body.removeChild(textArea);
      };

      const hide_sense_data = () => {
        if (hideSenseData.value) {
          const clone = JSON.parse(JSON.stringify(originalConfig));
          configJson.value = maskObject(clone);
        } else {
          configJson.value = originalConfig;
        }
      };

      return {
        modal,
        configJson,
        configSize,
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

  .config-size-label {
    float: right;
    font-size: 10px;
  }
</style>
