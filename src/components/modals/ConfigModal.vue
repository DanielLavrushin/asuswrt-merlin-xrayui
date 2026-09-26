<template>
  <modal ref="modal" :title="$t('com.ConfigModal.modal_title')" width="800">
    <div class="formfontdesc">
      <div class="configArea">
        <json-pretty :data="configJson" :deep="2" :show-line-number="true" :show-icon="true" :show-line="false" :show-length="true"> </json-pretty>
      </div>
      <label class="config-size-label"> {{ configSize }}/8000 ({{ ((configSize / 8000) * 100).toFixed(0) }}%) </label>
    </div>
    <template v-slot:footer>
      <label class="hide-sensitive">
        <input type="checkbox" v-model="hideSenseData" @change="hide_sense_data" />
        {{ $t('com.ConfigModal.hide_sensetive_data') }}
      </label>
      <input class="button_gen button_gen_small" type="button" :value="$t('com.ConfigModal.save_to_file')" @click.prevent="save_to_file" />
      <input class="button_gen button_gen_small" type="button" :value="$t('com.ConfigModal.open_raw')" @click.prevent="open_raw" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import Modal from '@main/Modal.vue';
  import JsonPretty from 'vue-json-pretty';
  import 'vue-json-pretty/lib/styles.css';
  import engine from '@modules/Engine';
  import xrayConfig from '@modules/XrayConfig';
  import { hideSensitiveData } from '@modules/SensitiveData';

  export default defineComponent({
    name: 'ConfigModal',
    components: {
      Modal,
      JsonPretty
    },
    setup() {
      const modal = ref<any>(null);
      let originalConfig: any = {};
      const configJson = ref<any>(null);
      const configSize = ref<number>(0);
      const hideSenseData = ref<boolean>(true);

      const load = async () => {
        try {
          const json = JSON.stringify(engine.prepareServerConfig(xrayConfig));
          originalConfig = JSON.parse(json);
          configSize.value = json.length;
          hide_sense_data();
        } catch (error) {
          console.error('Error loading config:', error);
        }
      };

      const show = async () => {
        hideSenseData.value = true;
        await load();
        modal.value.show();
      };

      const open_raw = () => {
        engine.openText(
          engine.getWebData<string>('xray-config', { responseType: 'text' }).then((response) => response.data),
          'application/json;charset=utf-8'
        );
      };

      const save_to_file = () => {
        hide_sense_data();
        const configStr = JSON.stringify(configJson.value, null, 2);
        const blob = new Blob([configStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'config.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };

      const hide_sense_data = () => {
        configJson.value = hideSenseData.value ? hideSensitiveData(originalConfig) : originalConfig;
      };

      return {
        modal,
        configJson,
        configSize,
        hideSenseData,
        open_raw,
        show,
        save_to_file,
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

  .hide-sensitive {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .hide-sensitive input {
    margin: 0;
  }
</style>
