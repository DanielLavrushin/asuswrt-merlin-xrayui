<template>
  <modal ref="modal" :title="$t('components.XrayCoreVersionModal.modal_title')" width="400px">
    <div class="formfontdesc">
      <p>
        {{ $t("components.XrayCoreVersionModal.modal_desc") }}
        <select class="input_option" v-model="selected_url">
          <option v-for="(opt, index) in xray_versions" :key="index" :value="opt.url">{{ opt.version }}</option>
        </select>
      </p>
    </div>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('components.XrayCoreVersionModal.switch')" @click.prevent="switch_version()" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref } from "vue";
  import axios from "axios";
  import Modal from "../Modal.vue";
  import Hint from "../Hint.vue";
  import engine, { SubmtActions } from "@/modules/Engine";

  export default defineComponent({
    name: "XrayCoreVersionModal",
    components: {
      Hint,
      Modal
    },
    props: {
      currentVersion: {
        type: String,
        required: true
      }
    },
    setup(props) {
      const modal = ref();
      const selected_url = ref("");

      const xray_versions = ref<{ version: string; url: string }[]>([]);
      const load_xray_versions = async () => {
        const response = await axios.get("https://api.github.com/repos/XTLS/Xray-core/releases");
        for (const release of response.data.slice(0, 5)) {
          xray_versions.value.push({
            version: release.tag_name.replace(/[^\d\.]/, ""),
            url: release.assets_url
          });
        }
      };
      const show = async () => {
        selected_url.value = props.currentVersion;
        await engine.executeWithLoadingProgress(async () => {
          await load_xray_versions();
        }, false);
        selected_url.value = xray_versions.value.filter((x) => x.version === props.currentVersion)?.[0]?.url || "";
        modal.value.show();
      };
      const switch_version = async () => {
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmtActions.xrayVersionSwitch, { url: selected_url.value });
        });
      };

      return {
        modal,
        show,
        switch_version,
        selected_url,
        xray_versions
      };
    }
  });
</script>
