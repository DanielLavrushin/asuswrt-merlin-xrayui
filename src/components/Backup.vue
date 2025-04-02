<template>
  <tr>
    <th>
      {{ $t('com.Backup.manager') }}
      <hint v-html="$t('com.Backup.hint')"></hint>
    </th>
    <td>
      <select v-model="backup" class="input_option" @change="download()" v-if="backups.length">
        <option v-for="p in backups" :value="p" :key="p">{{ p }}</option>
      </select>
      <span class="row-buttons">
        <input class="button_gen button_gen_small" type="button" :value="$t('com.Backup.backup')" @click.prevent="create_backup()" />
        <input class="button_gen button_gen_small" type="button" :value="$t('com.Backup.clear')" @click.prevent="clear()" v-if="backups.length" />
      </span>
    </td>
  </tr>
</template>
<script lang="ts">
  import { defineComponent, ref, watch, inject, Ref } from 'vue';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import engine, { EngineResponseConfig, SubmtActions } from '@/modules/Engine';
  import { useI18n } from 'vue-i18n';

  export default defineComponent({
    name: 'Backup',
    components: {
      Modal,
      Hint
    },
    props: {},
    setup(props) {
      const { t } = useI18n();
      const backup = ref<string>('');
      const modal = ref();
      const backups = ref<string[]>([]);
      const uiResponse = inject<Ref<EngineResponseConfig>>('uiResponse')!;

      const download = () => {
        if (backup.value) {
          const url = `/ext/xrayui/backup/${backup.value}`;
          window.location.href = url;
          backup.value = '';
        }
      };

      const create_backup = async () => {
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmtActions.createBackup, null, 2000);
        });
      };
      const clear = async () => {
        if (!confirm(t('com.Backup.clear_confirm'))) return;

        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmtActions.clearBackup, null, 2000);
        });
      };
      watch(
        () => uiResponse?.value,
        (newVal) => {
          if (newVal) {
            if (newVal?.xray) {
              backups.value = newVal.xray.backups;
            }
          }
        }
      );

      return {
        backup,
        backups,
        modal,
        create_backup,
        clear,
        download
      };
    }
  });
</script>
<style scoped lang="scss"></style>
