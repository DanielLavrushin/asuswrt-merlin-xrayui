<template>
  <div class="version">
    <a href="#" @click.prevent="open_update">
      <span class="button_gen button_gen_small button_info" :title="$t('com.Version.tooltip_update_avialable')" v-if="hasUpdate">!</span>
      XRAYUI v{{ current_version }}</a
    >
  </div>
  <modal ref="updateModal" width="760" :title="$t('com.Version.modal_title')">
    <div class="version-modal">
      <div class="version-status" :class="{ 'has-update': hasUpdate, 'up-to-date': !hasUpdate }">
        <div class="version-status__pills">
          <div class="version-pill" :class="{ 'version-pill--muted': hasUpdate }">
            <span class="version-pill__num">v{{ current_version }}</span>
          </div>
          <template v-if="hasUpdate">
            <span class="version-status__arrow" aria-hidden="true">→</span>
            <div class="version-pill version-pill--latest">
              <span class="version-pill__num">v{{ latest_version }}</span>
            </div>
          </template>
        </div>
        <div class="version-status__badge version-status__badge--ok" v-if="!hasUpdate">
          <span class="version-status__icon" aria-hidden="true">✓</span>
          <span>{{ $t('com.Version.version_is_up_to_date') }}</span>
        </div>
        <div class="version-status__badge version-status__badge--update" v-else>
          <span class="version-status__icon" aria-hidden="true">↑</span>
          <span v-html="$t('com.Version.new_version', [latest_version])"></span>
        </div>
      </div>

      <div class="version-select" v-if="releases.length">
        <label for="xrayui-version-select">{{ $t('com.Version.label_select_version') }}</label>
        <select id="xrayui-version-select" class="input_option" v-model="selected_version">
          <option v-for="r in releases" :key="r.version" :value="r.version">
            v{{ r.version }} ({{ r.date }}){{ r.version === latest_version ? ` ${$t('com.Version.latest_suffix')}` : ''
            }}{{ r.version === current_version ? ` ${$t('com.Version.installed_suffix')}` : '' }}{{ r.prerelease ? ` ${$t('com.Version.prerelease_suffix')}` : '' }}
          </option>
        </select>
        <span class="version-select__warn" v-if="isDowngrade">{{ $t('com.Version.downgrade_warning') }}</span>
      </div>
      <p class="version-select__error" v-else-if="releasesFailed">{{ $t('com.Version.releases_load_failed') }}</p>

      <div class="changelog-card">
        <div class="changelog" v-html="changelog"></div>
      </div>

      <p class="changelog-link" v-html="$t('com.Version.open_chengelog')"></p>
    </div>
    <template v-slot:footer v-if="hasUpdate || selected_version">
      <button class="button_gen button_gen_small" v-if="hasUpdate" @click.prevent="dont_want_update">{{ $t('com.Version.dont_want_update', [latest_version]) }}</button>
      <input class="button_gen button_gen_small button-primary" type="button" :value="installLabel" @click.prevent="update" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref, inject, Ref, watch, computed } from 'vue';
  import Modal from '@main/Modal.vue';
  import vClean from 'version-clean';
  import vCompare from 'version-compare';
  import engine, { SubmitActions, EngineResponseConfig } from '@/modules/Engine';
  import markdownit from 'markdown-it';
  import { useI18n } from 'vue-i18n';

  interface XrayUiRelease {
    version: string;
    date: string;
    prerelease: boolean;
    body: string;
  }

  const RELEASES_TO_SHOW = 15;

  export default defineComponent({
    name: 'Version',
    components: {
      Modal
    },
    setup() {
      const { t } = useI18n();
      const md = markdownit({ html: false, breaks: true });
      const COOKIE_NAME = 'xrayui_dontupdate';
      const ui = inject<Ref<EngineResponseConfig>>('uiResponse');
      const withPatch = (version?: string) => (version && version.split('.').length === 2 ? `${version}.0` : (version ?? ''));

      const current_version = computed(() => withPatch(window.xray.custom_settings.xray_version || ui?.value?.xray?.ui_version));
      const latest_version = ref<string>();
      const updateModal = ref();
      const hasUpdate = ref(false);
      const releases = ref<XrayUiRelease[]>([]);
      const releasesFailed = ref(false);
      const selected_version = ref<string>('');
      const refusedToUpdateVersion = ref(engine.getCookie(COOKIE_NAME));

      const selectedRelease = computed(() => releases.value.find((r) => r.version === selected_version.value));
      const changelog = computed(() => (selectedRelease.value?.body ? md.render(selectedRelease.value.body) : ''));
      const compareSelected = computed(() => (selected_version.value && current_version.value ? vCompare(selected_version.value, current_version.value) : 1));
      const isDowngrade = computed(() => compareSelected.value === -1);
      const installLabel = computed(() => {
        if (!selected_version.value) return t('com.Version.update_now');
        if (compareSelected.value === 0) return t('com.Version.reinstall_now', [selected_version.value]);
        if (compareSelected.value === -1) return t('com.Version.downgrade_now', [selected_version.value]);
        if (selected_version.value === latest_version.value) return t('com.Version.update_now');
        return t('com.Version.install_version', [selected_version.value]);
      });

      const checkLatest = async (proxy?: string) => {
        // one call returns both the latest release and the list used for the downgrade selector
        const gh_releases_url = `https://api.github.com/repos/daniellavrushin/asuswrt-merlin-xrayui/releases?per_page=${RELEASES_TO_SHOW + 5}`;
        try {
          const list = await engine.fetchGithubJson<any[]>(gh_releases_url, proxy);
          if (!Array.isArray(list)) throw new Error('unexpected releases response');
          const all: XrayUiRelease[] = list
            .filter((r: any) => !r.draft && r.tag_name)
            .map((r: any) => ({
              version: String(r.tag_name).replace(/^v/i, ''),
              date: (r.published_at || r.created_at || '').slice(0, 10),
              prerelease: !!r.prerelease,
              body: r.body || ''
            }));
          // look for the latest stable before cutting the list, and keep it selectable if prereleases pushed it past the cut
          const latestRelease = all.find((r) => !r.prerelease);
          const shown = all.slice(0, RELEASES_TO_SHOW);
          if (latestRelease && !shown.includes(latestRelease)) shown.push(latestRelease);
          releases.value = shown;
          releasesFailed.value = false;
          if (!latestRelease) return;
          latest_version.value = vClean(latestRelease.version)!;
          selected_version.value = latestRelease.version;
          hasUpdate.value = !!current_version.value && vCompare(latest_version.value, current_version.value) === 1;
          if (hasUpdate.value === true) {
            window.xray.server.xray_version_latest = latest_version.value;
            if (refusedToUpdateVersion.value != latest_version.value) {
              updateModal.value.show();
            }
          }
        } catch (e) {
          releasesFailed.value = true;
          console.warn('[xrayui] failed to load release info:', e);
        }
      };

      const stop = watch(
        () => ui?.value?.xray,
        (x) => {
          if (!x) return;
          stop();
          checkLatest(x.github_proxy);
        },
        { immediate: true }
      );

      setTimeout(() => {
        if (!latest_version.value && !ui?.value?.xray) checkLatest();
      }, 8000);

      const open_update = () => {
        updateModal.value.show();
      };

      const update = async () => {
        const version = selected_version.value;
        if (version && isDowngrade.value && !confirm(t('com.Version.downgrade_confirm', [version, current_version.value]))) return;
        await engine.executeWithLoadingProgress(async () => {
          // no version -> backend falls back to the latest release, same as before
          await engine.submit(SubmitActions.performUpdate, version ? { version } : undefined);
        });
      };

      const dont_want_update = () => {
        engine.setCookie(COOKIE_NAME, window.xray.server.xray_version_latest);
        updateModal.value.close();
      };

      return {
        updateModal,
        current_version,
        latest_version,
        hasUpdate,
        changelog,
        releases,
        releasesFailed,
        selected_version,
        isDowngrade,
        installLabel,
        open_update,
        update,
        dont_want_update
      };
    }
  });
</script>
<style scoped lang="scss">
  .version {
    padding-top: 10px;

    a {
      text-decoration: underline;
      font-size: 10px;
      color: #ffcc00;
      font-weight: bold;
      position: absolute;
      bottom: 0;
      right: 5px;
    }
  }

  .version-modal {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .version-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 14px;
    padding: 12px 14px;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.05));
    border: 1px solid #222;
    border-left: 3px solid #6b7a7f;
    border-radius: 4px;

    &.up-to-date {
      border-left-color: #4caf50;
    }
    &.has-update {
      border-left-color: #ffcc00;
    }
  }

  .version-status__pills {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .version-status__arrow {
    color: #ffcc00;
    font-weight: bold;
    font-size: 16px;
    line-height: 1;
  }

  .version-pill {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 4px 12px;
    background-color: #2f3a3e;
    border: 1px solid #222;
    border-radius: 999px;
    font-family: 'Courier New', Courier, monospace;
    color: #ffffff;

    &__num {
      font-weight: bold;
      font-size: 13px;
      letter-spacing: 0.3px;
    }

    &--muted {
      opacity: 0.7;
      .version-pill__num {
        font-weight: normal;
      }
    }

    &--latest {
      border-color: #ffcc00;
      box-shadow: 0 0 0 1px rgba(255, 204, 0, 0.25);
      .version-pill__num {
        color: #ffcc00;
      }
    }
  }

  .version-status__badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.3;

    &--ok {
      color: #d4f0d6;
      background-color: #3d524a;
      border: 1px solid rgba(76, 175, 80, 0.45);
    }

    &--update {
      color: #ffeaa0;
      background-color: #4d4830;
      border: 1px solid rgba(255, 204, 0, 0.45);

      :deep(strong) {
        text-shadow: none;
        color: #ffe066;
      }
    }
  }

  .version-status__icon {
    font-weight: bold;
    font-size: 13px;
    line-height: 1;
  }

  .version-select {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;

    label {
      font-weight: bold;
      color: #ffffff;
    }

    &__warn {
      flex-basis: 100%;
      color: #ff9a3c;
      font-size: 11px;
    }

    &__error {
      margin: 0;
      color: #ff9a3c;
      font-size: 11px;
    }
  }

  .changelog-card {
    background-color: #2f3a3e;
    border: 1px solid #222;
    border-radius: 4px;
    overflow: hidden;
  }

  .changelog {
    padding: 12px 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 12px;
    line-height: 1.55;
    color: #e6e6e6;

    :deep(h1),
    :deep(h2),
    :deep(h3) {
      display: inline-block;
      margin: 0 0 10px 0;
      padding: 3px 10px;
      font-size: 12px;
      font-family: 'Courier New', Courier, monospace;
      font-weight: bold;
      color: #ffe066;
      background-color: #463e23;
      border: 1px solid rgba(255, 204, 0, 0.35);
      border-radius: 3px;
      letter-spacing: 0.3px;
    }

    :deep(p) {
      margin: 6px 0;
    }

    :deep(blockquote) {
      margin: 10px 0;
      padding: 8px 12px;
      background-color: #3d3a26;
      border: 1px solid rgba(255, 204, 0, 0.3);
      border-left: 3px solid #ffcc00;
      border-radius: 3px;
      color: #f5e29a;
      font-size: 12px;

      p {
        margin: 0;
      }

      strong,
      em {
        color: #ffe066;
      }
    }

    :deep(ul),
    :deep(ol) {
      margin: 8px 0;
      padding-left: 20px;
    }

    :deep(ul li),
    :deep(ol li) {
      margin: 4px 0;
      padding: 4px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      &:last-child {
        border-bottom: none;
      }
    }

    :deep(code) {
      padding: 1px 5px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      font-weight: bold;
      color: #ffcc00;
      background-color: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 3px;
    }

    :deep(strong) {
      color: #ffffff;
    }

    :deep(p > a > img),
    :deep(p > img) {
      vertical-align: middle;
      margin: 3px 4px 3px 0;
      border-radius: 3px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
      transition: transform 0.12s ease;
    }
    :deep(p > a:hover > img) {
      transform: translateY(-1px);
    }
  }

  .changelog-link {
    margin: 0;
    text-align: center;
    font-size: 11px;
    color: #a0a8ab;

    :deep(a) {
      color: #ffcc00;
      text-decoration: underline;
    }
  }

  .version-modal :deep(a) {
    color: #ffcc00;
    text-decoration: underline;
  }
</style>
