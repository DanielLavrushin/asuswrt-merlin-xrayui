<template>
  <modal ref="modal" :title="$t('com.XrayCoreVersionModal.modal_title')" width="520">
    <div class="formfontdesc">
      <p>
        {{ $t('com.XrayCoreVersionModal.modal_desc') }}
        <span class="current-version" v-if="currentVersion">
          {{ $t('com.XrayCoreVersionModal.current_installed') }}
          <strong>v{{ currentVersion }}</strong>
        </span>
      </p>
      <table class="FormTable modal-form-table full-width">
        <tbody>
          <tr>
            <th>{{ $t('com.XrayCoreVersionModal.label_version') }}</th>
            <td>
              <select v-if="isLoading" class="input_option" disabled>
                <option>{{ $t('com.XrayCoreVersionModal.loading') }}</option>
              </select>
              <select v-else class="input_option" v-model="selected_url">
                <option v-for="opt in xray_versions" :key="opt.version" :value="opt.url">
                  {{ opt.version }}{{ opt.prerelease ? ` ${$t('com.XrayCoreVersionModal.prerelease_suffix')}` : '' }}
                </option>
                <option disabled value="">────────────</option>
                <option :value="CUSTOM_VALUE">{{ $t('com.XrayCoreVersionModal.custom_option') }}</option>
              </select>
              <span class="hint-color prerelease-tag" v-if="selectedIsPrerelease">
                {{ $t('com.XrayCoreVersionModal.prerelease_warning') }}
              </span>
            </td>
          </tr>
          <tr v-if="isCustom">
            <th>{{ $t('com.XrayCoreVersionModal.custom_version_label') }}</th>
            <td>
              <input
                id="xray-core-custom-version"
                ref="custom_input"
                type="text"
                class="input_25_table"
                v-model="custom_version"
                :placeholder="$t('com.XrayCoreVersionModal.custom_version_placeholder')"
                autocomplete="off"
                spellcheck="false"
              />
              <span class="hint-color">{{ $t('com.XrayCoreVersionModal.custom_version_hint') }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <template #footer>
      <input
        class="button_gen button_gen_small"
        type="button"
        :value="$t('com.XrayCoreVersionModal.switch')"
        :disabled="!canSwitch"
        @click.prevent="switch_version"
      />
    </template>
  </modal>
</template>

<script lang="ts">
  import { computed, defineComponent, nextTick, ref } from 'vue';
  import axios from 'axios';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import engine, { SubmitActions } from '@/modules/Engine';
  import { useI18n } from 'vue-i18n';

  interface XrayVersion {
    version: string;
    url: string;
    prerelease: boolean;
  }

  const VERSIONS_TO_SHOW = 20;
  const CUSTOM_VALUE = '__custom__';
  const VERSION_RE = /^\d+\.\d+(\.\d+)?(-[\w.]+)?$/;

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
      const custom_input = ref<HTMLInputElement | null>(null);
      const selected_url = ref<string>('');
      const custom_version = ref<string>('');
      const isLoading = ref(false);

      const xray_versions = ref<XrayVersion[]>([]);

      const isCustom = computed(() => selected_url.value === CUSTOM_VALUE);

      const selectedIsPrerelease = computed(() => {
        if (isCustom.value) return false;
        return xray_versions.value.find((v) => v.url === selected_url.value)?.prerelease ?? false;
      });

      const canSwitch = computed(() => {
        if (isLoading.value) return false;
        if (isCustom.value) return VERSION_RE.test(custom_version.value.trim().replace(/^v/i, ''));
        return !!selected_url.value;
      });

      const load_xray_versions = async () => {
        try {
          const response = await axios.get('https://api.github.com/repos/XTLS/Xray-core/releases', { params: { per_page: 30 } });

          xray_versions.value = response.data
            .filter((release: any) => !release.draft)
            .slice(0, VERSIONS_TO_SHOW)
            .map((release: any) => ({
              version: release.tag_name.replace(/^v/i, ''),
              url: release.assets_url,
              prerelease: !!release.prerelease
            }));
        } catch (error) {
          console.error('Error loading xray versions:', error);
        }
      };

      const show = async () => {
        custom_version.value = '';
        selected_url.value = '';
        isLoading.value = true;
        modal.value?.show();
        try {
          await load_xray_versions();
        } finally {
          isLoading.value = false;
        }
        const found = xray_versions.value.find((x) => x.version === props.currentVersion);
        selected_url.value = found ? found.url : xray_versions.value[0]?.url || '';
      };

      const switch_version = async () => {
        if (isCustom.value) {
          const custom = custom_version.value.trim().replace(/^v/i, '');
          if (!VERSION_RE.test(custom)) {
            alert(t('com.XrayCoreVersionModal.error_invalid_custom_version'));
            await nextTick();
            custom_input.value?.focus();
            return;
          }
          await engine.executeWithLoadingProgress(async () => {
            await engine.submit(SubmitActions.xrayVersionSwitch, { version: custom });
          });
          return;
        }
        if (!selected_url.value) {
          alert(t('com.XrayCoreVersionModal.error_no_version_selected'));
          return;
        }
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmitActions.xrayVersionSwitch, { url: selected_url.value });
        });
      };

      return {
        modal,
        custom_input,
        show,
        switch_version,
        selected_url,
        custom_version,
        xray_versions,
        isLoading,
        isCustom,
        selectedIsPrerelease,
        canSwitch,
        CUSTOM_VALUE
      };
    }
  });
</script>
<style scoped lang="scss">
  .current-version {
    display: inline-block;
    margin-left: 6px;
    opacity: 0.9;

    strong {
      color: #ffcc00;
      font-family: 'Courier New', Courier, monospace;
    }
  }

  .prerelease-tag {
    display: inline-block;
    margin-left: 8px;
    color: #ff9a3c;
    font-weight: bold;
  }

  .full-width {
    width: 100%;
  }

  td .input_25_table {
    margin-right: 6px;
  }

  td .hint-color {
    display: inline-block;
    margin-top: 4px;
    font-size: 11px;
    line-height: 1.4;
  }
</style>
