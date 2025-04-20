<template>
  <tr>
    <th>
      {{ $t('com.Backup.manager') }}
      <hint v-html="$t('com.Backup.hint')"></hint>
    </th>
    <td>
      <span class="row-buttons">
        <input class="button_gen button_gen_small" type="button" :value="$t('com.Backup.backup')" @click.prevent="show_backup_modal()" />
      </span>
      <modal ref="modal" :title="$t('com.Backup.manager')" width="500">
        <table class="FormTable modal-form-table">
          <tbody>
            <tr v-for="b in backups" :key="b">
              <td>
                {{ b }}
              </td>
              <td>
                <span class="row-buttons">
                  <input class="button_gen button_gen_small" type="button" :value="$t('com.Backup.download')" @click.prevent="download(b)" />
                  <input class="button_gen button_gen_small" type="button" :value="$t('com.Backup.restore')" @click.prevent="restore(b)" />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <template v-slot:footer>
          <input class="button_gen button_gen_small" type="button" :value="$t('com.Backup.backup')" @click.prevent="create_backup()" />
          <input class="button_gen button_gen_small" type="button" :value="$t('com.Backup.clear')" @click.prevent="clear()" v-if="backups.length" />
        </template>
      </modal>
    </td>
  </tr>
</template>
<script lang="ts">
  import { defineComponent, ref, watch, inject, Ref } from 'vue';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import engine, { EngineResponseConfig, SubmitActions } from '@/modules/Engine';
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
      const modal = ref();
      const backups = ref<string[]>([]);
      const uiResponse = inject<Ref<EngineResponseConfig>>('uiResponse')!;

      const restore = async (backup: string) => {
        if (!confirm(t('com.Backup.restore_confirm'))) return;

        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmitActions.restoreBackup, { file: backup }, 5000);
        });
      };
      const download = (backup: string) => {
        if (backup) {
          const url = `/ext/xrayui/backup/${backup}`;
          window.location.href = url;
        }
      };

      const create_backup = async () => {
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmitActions.createBackup, null, 2000);
        });
      };
      const clear = async () => {
        if (!confirm(t('com.Backup.clear_confirm'))) return;

        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmitActions.clearBackup, null, 2000);
        });
      };

      const show_backup_modal = () => {
        backups.value = uiResponse.value?.xray?.backups || [];
        modal.value.show();
      };

      return {
        backups,
        modal,
        create_backup,
        clear,
        restore,
        download,
        show_backup_modal
      };
    }
  });
</script>
<style scoped lang="scss"></style>
