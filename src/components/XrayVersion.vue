<template>
  <span class="core-version" v-show="xray_version || core_error">
    X-RAY Core
    <a href="#" :title="xray_version ? undefined : core_error" @click="show">{{ label }}</a>
  </span>
  <xray-core-version-modal ref="modal" v-model:current-version="xray_version"></xray-core-version-modal>
</template>

<script lang="ts">
  import { computed, defineComponent, inject, onMounted, Ref, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { EngineResponseConfig } from '@/modules/Engine';
  import XrayCoreVersionModal from '@modal/XrayCoreVersionModal.vue';

  export default defineComponent({
    name: 'XrayVersion',
    components: {
      XrayCoreVersionModal
    },
    setup() {
      const { t } = useI18n();
      const uiResponse = inject<Ref<EngineResponseConfig>>('uiResponse')!;
      const xray_version = ref('');
      const core_error = ref('');
      const modal = ref();

      const label = computed(() => {
        if (xray_version.value) return xray_version.value;
        return core_error.value === 'not installed' ? t('com.XrayVersion.not_installed') : t('com.XrayVersion.not_working');
      });

      const show = async () => {
        modal.value.show();
      };

      onMounted(async () => {
        watch(
          () => [uiResponse?.value.xray?.core_version, uiResponse?.value.xray?.core_error],
          ([version, error]) => {
            if (version) {
              xray_version.value = version;
              core_error.value = '';
            } else if (error) {
              core_error.value = error;
            }
          }
        );
      });
      return { xray_version, core_error, label, modal, show };
    }
  });
</script>
<style scoped>
  .core-version {
    background: initial;
    float: right;
    padding-right: 5px;
  }
  .core-version :deep(a) {
    cursor: pointer;
    text-decoration: underline;
  }
</style>
