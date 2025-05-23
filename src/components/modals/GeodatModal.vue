<template>
  <modal ref="modal" :title="$t('com.GeodatModal.modal_title')" width="700">
    <div class="formfontdesc">
      <div style="text-align: left">
        <p>
          {{ $t('com.GeodatModal.modal_desc') }}
        </p>
      </div>
      <table class="FormTable modal-form-table">
        <tbody v-if="isLoading">
          <tr>
            <th>
              {{ $t('com.GeodatModal.loading') }}
            </th>
            <td>
              <div class="loading"></div>
            </td>
          </tr>
        </tbody>
        <tbody v-if="geodata && !isLoading">
          <tr>
            <th>
              {{ $t('com.GeodatModal.label_select_file') }}
            </th>
            <td>
              <select v-model="file.tag" class="input_option" @change="loadContent">
                <option value>{{ $t('com.GeodatModal.option_create_new_file') }}</option>
                <option v-for="opt in geodata.tags" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
              <span class="hint-color" v-if="file.tag">ext:xrayui:{{ file.tag ?? '{tag}' }}</span>
            </td>
          </tr>
        </tbody>
        <tbody v-if="geodata && isSelected && !isLoading">
          <tr v-if="isNewFile">
            <th>
              {{ $t('com.GeodatModal.label_tag') }}
              <hint v-html="$t('com.GeodatModal.hint_tag')"></hint>
            </th>
            <td>
              <input v-model="file.tag" class="input_25_table" placeholder="tag" />
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('com.GeodatModal.label_content') }}
              <hint v-html="$t('com.GeodatModal.hint_content')"></hint>
            </th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="file.content" style="height: 300px"></textarea>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <template v-slot:footer>
      <div>
        <input class="button_gen button_gen_small" type="button" :value="$t('labels.delete')" @click.prevent="deletdat" v-show="!isNewFile && isSelected" />
        <input class="button_gen button_gen_small" type="button" :value="$t('com.GeodatModal.recompile_all')" :title="$t('com.GeodatModal.hit_recompile_all')" @click.prevent="complile_all" v-if="!isSelected" />
        <input class="button_gen button_gen_small" type="button" :value="$t('com.GeodatModal.compile')" v-show="isSelected" :title="$t('com.GeodatModal.hit_compile')" @click.prevent="compile" />
      </div>
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import engine, { EngineGeodatConfig, GeodatTagRequest, SubmitActions } from '@/modules/Engine';
  import axios from 'axios';
  import { useI18n } from 'vue-i18n';

  export default defineComponent({
    name: 'GeodatModal',
    components: {
      Modal,
      Hint
    },

    setup() {
      const { t } = useI18n();
      const modal = ref();
      const isLoading = ref(false);
      const isSelected = ref(false);
      const isNewFile = ref(true);
      const isLoadingContent = ref(false);
      const file = ref<GeodatTagRequest>(new GeodatTagRequest());
      const geodata = ref<EngineGeodatConfig | undefined>();

      const show = async () => {
        file.value = new GeodatTagRequest();
        isLoading.value = true;
        isNewFile.value = true;
        isSelected.value = false;
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmitActions.geoDataCustomGetTags);
        }, false);
        geodata.value = await engine.getGeodata();
        isLoading.value = false;
        modal.value.show();
      };

      const getGeodataContent = async (tag: string) => {
        isLoadingContent.value = true;
        const content = await axios.get(`/ext/xrayui/geodata/${tag}.asp`);
        isLoadingContent.value = false;
        return content;
      };

      const loadContent = async () => {
        isSelected.value = true;
        if (!file.value.tag) {
          file.value = new GeodatTagRequest();
        }
        isNewFile.value = !file.value.tag || file.value.tag?.length === 0;
        if (file.value?.tag) {
          const content = await getGeodataContent(file.value.tag);
          file.value.content = content.data;
        }
      };
      const compile = async () => {
        await engine.executeWithLoadingProgress(async () => {
          if (!file.value.content?.length) {
            alert(t('com.GeodatModal.alert_empty_content'));
            return;
          }

          await engine.submit(SubmitActions.geoDataRecompile, file.value);
        });
      };

      const deletdat = async () => {
        if (!confirm(t('com.GeodatModal.alert_delete_confirm'))) return;

        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmitActions.geoDataCustomDeleteTag, { tag: file.value.tag });
          file.value = new GeodatTagRequest();
        });
      };

      const complile_all = async () => {
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmitActions.geoDataRecompileAll, file.value);
        });
      };

      return {
        modal,
        file,
        geodata,
        isLoading,
        isSelected,
        isNewFile,
        isLoadingContent,
        show,
        loadContent,
        compile,
        complile_all,
        deletdat
      };
    }
  });
</script>
<style scoped></style>
