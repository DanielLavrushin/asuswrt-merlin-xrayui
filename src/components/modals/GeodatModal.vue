<template>
  <modal ref="modal" title="Geodat Files Manager" width="700px">
    <div class="formfontdesc">
      <div style="text-align: left;">
        <p>
          Here you can create, edit and manage your own geosite/geoip data files.
        </p>
      </div>
      <table class="FormTable modal-form-table">
        <tbody v-if="isLoading">
          <tr>
            <th>
              Loading...
            </th>
            <td>
              <div class="loading"></div>
            </td>
          </tr>

        </tbody>
        <tbody v-if="geodata && !isLoading">
          <tr>
            <th>
              Select a file
            </th>
            <td>
              <select v-model="file.tag" class="input_option" @change="loadContent">
                <option value>create a new file</option>
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
              Tag
              <hint>
                Tag is the name of the file. It must be unique. You ill use it as `ext:xrayui:{tag}`
              </hint>
            </th>
            <td>
              <input v-model="file.tag" class="input_25_table" placeholder="tag" />
            </td>
          </tr>
          <tr>
            <th>Content
              <hint>
                <p>Here you can edit the content of the tag file.</p>
              </hint>
            </th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="file.content" style="height: 300px;"></textarea>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <template v-slot:footer>
      <div>
        <input class="button_gen button_gen_small" type="button" value="delete" @click.prevent="deletdat"
          v-show="!isNewFile && isSelected" />
        <input class="button_gen button_gen_small" type="button" value="recompile all"
          title="usefull when you edit your tag files directly on your router and only want to recompile the xrayui geodata."
          @click.prevent="complile_all" v-if="!isSelected" />
        <input class="button_gen button_gen_small" type="button" value="compile" v-show="isSelected"
          title="save tag file content and compile into xrayui geodata." @click.prevent="compile" />
      </div>
    </template>
  </modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import Modal from "../Modal.vue";
import Hint from "../Hint.vue";
import engine, { EngineGeodatConfig, GeodatTagRequest, SubmtActions } from "../../modules/Engine";
import axios from "axios";

export default defineComponent({
  name: "GeodatModal",
  components: {
    Modal,
    Hint
  },

  props: {
  },

  setup(props, { emit }) {
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
      await engine.submit(SubmtActions.geoDataCustomGetTags);

      geodata.value = await engine.getGeodata();
      await engine.checkLoadingProgress();
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
      };
      isNewFile.value = !file.value.tag || file.value.tag?.length === 0;
      if (file.value?.tag) {

        const content = await getGeodataContent(file.value.tag);
        file.value.content = content.data;
      }
    };
    const compile = async () => {
      if (!file.value.content?.length) {
        alert("Well... Nice try, but you need to write something into the content field.");
        return;
      }

      const delay = 5000;
      window.showLoading(delay, "waiting");

      await engine.submit(SubmtActions.geoDataRecompile, file.value, delay);

      window.location.reload();
    };

    const deletdat = async () => {
      if (!confirm("Are you sure you want to delete this tag file?")) return;

      await engine.submit(SubmtActions.geoDataCustomDeleteTag, file.value);
      file.value = new GeodatTagRequest();
      await engine.checkLoadingProgress();
      window.location.reload();

    };

    const complile_all = async () => {

      await engine.submit(SubmtActions.geoDataRecompileAll, file.value);
      await engine.checkLoadingProgress();
      window.location.reload();
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
    }
  }
});
</script>
<style scoped></style>
