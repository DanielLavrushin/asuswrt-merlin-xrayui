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
      <modal ref="modal" :title="$t('com.Backup.manager')" width="560" @close="onClose">
        <div class="backup-manager">
          <div v-if="backups.length === 0" class="backup-empty">
            <div class="backup-empty__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path
                  fill="currentColor"
                  d="M5 4h14a2 2 0 0 1 2 2v2H3V6a2 2 0 0 1 2-2zm-2 6h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8zm6 3v2h6v-2H9z"
                />
              </svg>
            </div>
            <div class="backup-empty__title">{{ $t('com.Backup.empty_title') }}</div>
            <div class="backup-empty__hint">{{ $t('com.Backup.empty_hint') }}</div>
          </div>

          <ul v-else class="backup-list" :aria-label="$t('com.Backup.manager')">
            <li v-for="item in parsedBackups" :key="item.filename" class="backup-card" :class="{ 'backup-card--confirming': item.confirming }">
              <div class="backup-card__main">
                <div class="backup-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path
                      fill="currentColor"
                      d="M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-8 11l-4-4h2.5v-3h3v3H16l-4 4z"
                    />
                  </svg>
                </div>
                <div class="backup-card__text">
                  <div class="backup-card__title" :title="item.filename">{{ item.title }}</div>
                  <div class="backup-card__meta">
                    <span v-if="item.date">{{ formatDate(item.date) }}</span>
                    <span v-if="item.date" class="backup-card__dot">·</span>
                    <span v-if="item.date" class="backup-card__ago">{{ relativeTime(item.date) }}</span>
                    <span v-if="item.size != null" class="backup-card__dot">·</span>
                    <span v-if="item.size != null">{{ formatSize(item.size) }}</span>
                  </div>
                </div>
              </div>

              <div class="backup-card__actions" v-if="!item.confirming">
                <button class="backup-icon-btn" type="button" :title="$t('com.Backup.download')" :aria-label="$t('com.Backup.download')" @click.prevent="download(item.filename)">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M12 3v10.59l3.3-3.3 1.4 1.42L12 16.41 7.3 11.7l1.4-1.41 3.3 3.3V3h2zM5 20v-2h14v2H5z" />
                  </svg>
                </button>
                <button class="backup-icon-btn backup-icon-btn--accent" type="button" :title="$t('com.Backup.restore')" :aria-label="$t('com.Backup.restore')" @click.prevent="askConfirm(item, 'restore')">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7zm-1 4h2v5h-2V9zm0 6h2v2h-2v-2z"
                    />
                  </svg>
                </button>
                <button class="backup-icon-btn backup-icon-btn--danger" type="button" :title="$t('com.Backup.clear')" :aria-label="$t('com.Backup.clear')" @click.prevent="askConfirm(item, 'delete')">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M9 3v1H4v2h16V4h-5V3H9zM6 8v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z"
                    />
                  </svg>
                </button>
              </div>

              <div class="backup-card__confirm" v-else>
                <div class="backup-card__confirm-text">
                  {{ item.confirming === 'delete' ? $t('com.Backup.confirm_delete_q') : $t('com.Backup.confirm_restore_q') }}
                </div>
                <div class="backup-card__confirm-actions">
                  <button class="backup-confirm-btn" type="button" @click.prevent="cancelConfirm(item)">
                    {{ $t('com.Backup.confirm_no') }}
                  </button>
                  <button
                    class="backup-confirm-btn"
                    :class="item.confirming === 'delete' ? 'backup-confirm-btn--danger' : 'backup-confirm-btn--accent'"
                    type="button"
                    @click.prevent="runConfirm(item)"
                  >
                    {{ item.confirming === 'delete' ? $t('com.Backup.confirm_yes_delete') : $t('com.Backup.confirm_yes_restore') }}
                  </button>
                </div>
              </div>
            </li>
          </ul>

          <div class="backup-includes" v-if="backups.length">
            <div class="backup-includes__title">{{ $t('com.Backup.includes_title') }}</div>
            <ul class="backup-includes__list">
              <li>{{ $t('com.Backup.includes_xray') }}</li>
              <li>{{ $t('com.Backup.includes_certs') }}</li>
              <li>{{ $t('com.Backup.includes_custom') }}</li>
              <li>{{ $t('com.Backup.includes_settings') }}</li>
            </ul>
          </div>
        </div>

        <template v-slot:footer>
          <div class="backup-footer">
            <div class="backup-footer__create">
              <input
                type="text"
                class="input_text backup-footer__name"
                v-model="backupName"
                :placeholder="$t('com.Backup.name_placeholder')"
                maxlength="50"
                @keyup.enter="create_backup()"
              />
              <input class="button_gen button_gen_small backup-footer__create-btn" type="button" :value="$t('com.Backup.create_button')" @click.prevent="create_backup()" />
            </div>
            <div class="backup-footer__right">
              <button v-if="backups.length && !clearAllConfirming" class="backup-clear-link" type="button" @click.prevent="clearAllConfirming = true">
                {{ $t('com.Backup.clear') }}
              </button>
              <span v-if="clearAllConfirming" class="backup-clear-inline">
                <span class="backup-clear-inline__text">{{ $t('com.Backup.confirm_clear_all_q') }}</span>
                <button class="backup-confirm-btn" type="button" @click.prevent="clearAllConfirming = false">
                  {{ $t('com.Backup.confirm_no') }}
                </button>
                <button class="backup-confirm-btn backup-confirm-btn--danger" type="button" @click.prevent="clearAll()">
                  {{ $t('com.Backup.confirm_yes_clear') }}
                </button>
              </span>
            </div>
          </div>
        </template>
      </modal>
    </td>
  </tr>
</template>

<script lang="ts">
  import { defineComponent, ref, inject, computed, Ref } from 'vue';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import engine, { EngineResponseConfig, SubmitActions } from '@/modules/Engine';
  import { useI18n } from 'vue-i18n';

  interface ParsedBackup {
    filename: string;
    title: string;
    date: Date | null;
    size: number | null;
    confirming: 'delete' | 'restore' | null;
  }

  const FILENAME_RE = /^xrayui-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})(?:-(.+))?\.tar\.gz$/;

  export default defineComponent({
    name: 'Backup',
    components: {
      Modal,
      Hint
    },
    setup() {
      const { t, locale } = useI18n();
      const modal = ref();
      const backups = ref<string[]>([]);
      const backupName = ref('');
      const sizes = ref<Record<string, number | null>>({});
      const confirmState = ref<Record<string, 'delete' | 'restore' | null>>({});
      const clearAllConfirming = ref(false);
      const uiResponse = inject<Ref<EngineResponseConfig>>('uiResponse')!;

      const parseFilename = (filename: string): { title: string; date: Date | null } => {
        const m = filename.match(FILENAME_RE);
        if (!m) return { title: filename, date: null };
        const [, y, mo, d, h, mi, s, custom] = m;
        const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
        const title = custom ? custom.replaceAll('-', ' ') : t('com.Backup.untitled');
        return { title, date };
      };

      const parsedBackups = computed<ParsedBackup[]>(() => {
        const list = backups.value.map((filename) => {
          const { title, date } = parseFilename(filename);
          return {
            filename,
            title,
            date,
            size: sizes.value[filename] ?? null,
            confirming: confirmState.value[filename] ?? null
          };
        });
        list.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
        return list;
      });

      const formatDate = (d: Date) => {
        try {
          return d.toLocaleString(locale.value, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch {
          return d.toLocaleString();
        }
      };

      const relativeTime = (d: Date) => {
        const diff = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diff < 60) return t('com.Backup.ago_just_now');
        if (diff < 3600) return t('com.Backup.ago_min', [Math.floor(diff / 60)]);
        if (diff < 86400) return t('com.Backup.ago_hour', [Math.floor(diff / 3600)]);
        return t('com.Backup.ago_day', [Math.floor(diff / 86400)]);
      };

      const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
      };

      const fetchSizes = async () => {
        const targets = backups.value.filter((f) => !(f in sizes.value));
        await Promise.all(
          targets.map(async (filename) => {
            try {
              const res = await fetch(`/ext/xrayui/backup/${filename}`, { method: 'HEAD' });
              const len = res.headers.get('Content-Length');
              sizes.value[filename] = len ? Number(len) : null;
            } catch {
              sizes.value[filename] = null;
            }
          })
        );
      };

      const askConfirm = (item: ParsedBackup, action: 'delete' | 'restore') => {
        Object.keys(confirmState.value).forEach((k) => (confirmState.value[k] = null));
        confirmState.value[item.filename] = action;
        clearAllConfirming.value = false;
      };

      const cancelConfirm = (item: ParsedBackup) => {
        confirmState.value[item.filename] = null;
      };

      const runConfirm = async (item: ParsedBackup) => {
        const action = confirmState.value[item.filename];
        confirmState.value[item.filename] = null;
        if (action === 'delete') {
          await engine.executeWithLoadingProgress(async () => {
            await engine.submit(SubmitActions.clearBackup, { backup: item.filename }, 2000);
          });
        } else if (action === 'restore') {
          await engine.executeWithLoadingProgress(async () => {
            await engine.submit(SubmitActions.restoreBackup, { file: item.filename }, 5000);
          });
        }
      };

      const download = (filename: string) => {
        if (filename) globalThis.location.href = `/ext/xrayui/backup/${filename}`;
      };

      const create_backup = async () => {
        const name = backupName.value.trim();
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmitActions.createBackup, name ? { name } : null, 2000);
        });
        backupName.value = '';
      };

      const clearAll = async () => {
        clearAllConfirming.value = false;
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmitActions.clearBackup, null, 2000);
        });
      };

      const show_backup_modal = () => {
        backups.value = uiResponse.value?.xray?.backups || [];
        sizes.value = {};
        confirmState.value = {};
        clearAllConfirming.value = false;
        modal.value.show();
        fetchSizes();
      };

      const onClose = () => {
        clearAllConfirming.value = false;
        confirmState.value = {};
      };

      return {
        backups,
        backupName,
        modal,
        parsedBackups,
        clearAllConfirming,
        formatDate,
        relativeTime,
        formatSize,
        create_backup,
        clearAll,
        download,
        askConfirm,
        cancelConfirm,
        runConfirm,
        show_backup_modal,
        onClose
      };
    }
  });
</script>

<style scoped lang="scss">
  $card-bg: rgba(255, 255, 255, 0.05);
  $card-border: rgba(255, 255, 255, 0.08);
  $card-hover: rgba(255, 255, 255, 0.09);
  $text-secondary: rgba(255, 255, 255, 0.7);
  $accent: #fc0;
  $danger: #ff6666;
  $ok: #7bd07b;

  .backup-manager {
    text-align: left;
    padding: 4px 6px 0;
  }

  .backup-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 28px 16px 12px;
    color: $text-secondary;

    &__icon {
      color: rgba(255, 255, 255, 0.25);
      margin-bottom: 10px;
    }
    &__title {
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    &__hint {
      font-size: 12px;
    }
  }

  .backup-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .backup-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: $card-bg;
    border: 1px solid $card-border;
    border-radius: 6px;
    transition: background 120ms ease, border-color 120ms ease;

    &:hover {
      background: $card-hover;
    }

    &--confirming {
      border-color: rgba(255, 204, 0, 0.4);
      background: rgba(255, 204, 0, 0.06);
    }

    &__main {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }
    &__icon {
      color: $accent;
      flex-shrink: 0;
      display: flex;
    }
    &__text {
      min-width: 0;
      flex: 1;
    }
    &__title {
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &__meta {
      font-size: 11px;
      color: $text-secondary;
      margin-top: 2px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
    }
    &__dot {
      opacity: 0.5;
    }
    &__actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    &__confirm {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      flex-shrink: 0;
    }
    &__confirm-text {
      font-size: 11px;
      color: #fff;
      text-align: right;
      max-width: 220px;
    }
    &__confirm-actions {
      display: flex;
      gap: 4px;
    }
  }

  .backup-icon-btn {
    background: transparent;
    border: 1px solid transparent;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    border-radius: 4px;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
    padding: 0;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    &:focus-visible {
      outline: none;
      border-color: $accent;
    }
    &--accent:hover {
      color: $accent;
    }
    &--danger:hover {
      color: $danger;
    }
  }

  .backup-confirm-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #fff;
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 11px;
    cursor: pointer;
    transition: background 120ms ease, border-color 120ms ease;

    &:hover {
      background: rgba(255, 255, 255, 0.14);
    }
    &--accent {
      background: rgba(255, 204, 0, 0.15);
      border-color: rgba(255, 204, 0, 0.4);
      color: $accent;
      &:hover {
        background: rgba(255, 204, 0, 0.25);
      }
    }
    &--danger {
      background: rgba(255, 102, 102, 0.15);
      border-color: rgba(255, 102, 102, 0.4);
      color: $danger;
      &:hover {
        background: rgba(255, 102, 102, 0.25);
      }
    }
  }

  .backup-includes {
    margin-top: 14px;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    border-left: 2px solid $accent;

    &__title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: $text-secondary;
      margin-bottom: 6px;
    }
    &__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 12px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.85);

      li {
        position: relative;
        padding-left: 12px;
      }
      li::before {
        content: '';
        position: absolute;
        left: 0;
        top: 7px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: $accent;
      }
    }
  }

  .backup-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    width: 100%;
    flex-wrap: wrap;
    text-align: left;

    &__create {
      display: flex;
      gap: 6px;
      align-items: center;
      flex: 1;
      min-width: 0;
    }
    &__name {
      flex: 1;
      min-width: 140px;
    }
    &__right {
      display: flex;
      align-items: center;
    }
  }

  .backup-clear-link {
    background: transparent;
    border: none;
    color: $text-secondary;
    font-size: 11px;
    cursor: pointer;
    text-decoration: underline;
    padding: 4px 6px;

    &:hover {
      color: $danger;
    }
  }

  .backup-clear-inline {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    &__text {
      font-size: 11px;
      color: #fff;
    }
  }

  @media (max-width: 520px) {
    .backup-card {
      flex-direction: column;
      align-items: stretch;

      &__actions,
      &__confirm {
        align-items: stretch;
      }
      &__confirm-text {
        text-align: left;
        max-width: none;
      }
    }
    .backup-includes__list {
      grid-template-columns: 1fr;
    }
  }
</style>
