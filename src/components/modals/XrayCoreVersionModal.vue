<template>
  <modal ref="modal" :title="$t('components.XrayCoreVersionModal.modal_title')" width="300">
    <div class="formfontdesc">
      <p>{{ $t('components.XrayCoreVersionModal.modal_desc') }}</p>
      <p>
        <select class="input_option" v-model="selected_url">
          <option v-for="(opt, index) in xray_versions" :key="index" :value="opt.url">
            {{ opt.version }}
          </option>
        </select>
      </p>
    </div>
    <template #footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('components.XrayCoreVersionModal.switch')" @click.prevent="switch_version" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import axios from 'axios';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import engine, { SubmtActions } from '@/modules/Engine';
  import { useI18n } from 'vue-i18n';

  interface XrayVersion {
    version: string;
    url: string;
  }

  export default defineComponent({
    name: 'XrayCoreVersionModal',
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
      const { t } = useI18n();
      const modal = ref<InstanceType<typeof Modal> | null>(null);
      const selected_url = ref<string>('');

      const xray_versions = ref<XrayVersion[]>([]);

      const load_xray_versions = async () => {
        try {
          const response = await axios.get('https://api.github.com/repos/XTLS/Xray-core/releases');
          xray_versions.value = response.data.slice(0, 6).map((release: any) => ({
            version: release.tag_name.replace(/[^\d\.]/g, ''),
            url: release.assets_url
          }));
        } catch (error) {
          console.error('Error loading xray versions:', error);
        }
      };

      const show = async () => {
        // Set a fallback value
        selected_url.value = props.currentVersion;
        await engine.executeWithLoadingProgress(async () => {
          await load_xray_versions();
        }, false);
        // Try to find a matching version by comparing the version strings
        const found = xray_versions.value.find((x) => x.version === props.currentVersion);
        selected_url.value = found ? found.url : xray_versions.value[0]?.url || '';
        modal.value?.show();
      };

      const switch_version = async () => {
        if (!selected_url.value) {
          alert(t('components.XrayCoreVersionModal.error_no_version_selected'));
          return;
        }
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
