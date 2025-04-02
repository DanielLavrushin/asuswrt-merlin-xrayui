<template>
  <div class="version">
    <a href="#" @click.prevent="open_update">
      <span class="button_gen button_gen_small button_info" :title="$t('com.Version.tooltip_update_avialable')" v-if="hasUpdate">!</span>
      XRAYUI v{{ current_version }}</a
    >
  </div>
  <modal ref="updateModal" width="600" :title="$t('com.Version.modal_title')">
    <div class="modal-content">
      <p class="current-version">{{ $t('com.Version.current_version', [current_version]) }}</p>
      <div v-if="hasUpdate" class="update-details">
        <p v-html="$t('com.Version.new_version', [latest_version])"></p>
      </div>
      <p v-else class="no-updates">{{ $t('com.Version.version_is_up_to_date') }}</p>

      <div class="textarea-wrapper">
        <div class="changelog" v-html="changelog"></div>
        <p v-html="$t('com.Version.open_chengelog')"></p>
      </div>
    </div>
    <template v-slot:footer v-if="hasUpdate">
      <button class="button_gen button_gen_small" @click.prevent="dont_want_update">{{ $t('com.Version.dont_want_update', [latest_version]) }}</button>
      <input class="button_gen button_gen_small button-primary" type="button" :value="$t('com.Version.update_now')" @click.prevent="update" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import Modal from '@main/Modal.vue';
  import axios from 'axios';
  import vClean from 'version-clean';
  import vCompare from 'version-compare';
  import engine, { SubmtActions } from '@/modules/Engine';
  import markdownit from 'markdown-it';

  export default defineComponent({
    name: 'Version',
    components: {
      Modal
    },
    setup() {
      const md = markdownit({ html: true, breaks: true });
      let tempcurvers = window.xray.custom_settings.xray_version;
      if (tempcurvers.split('.').length === 2) {
        tempcurvers += '.0';
      }
      const COOKIE_NAME = 'xrayui_dontupdate';

      const current_version = ref<string>(tempcurvers);
      const latest_version = ref<string>();
      const updateModal = ref();
      const hasUpdate = ref(false);
      const changelog = ref<string>('');
      const refusedToUpdateVersion = ref(engine.getCookie(COOKIE_NAME));

      setTimeout(async () => {
        const gh_releases_url = 'https://api.github.com/repos/daniellavrushin/asuswrt-merlin-xrayui/releases';

        const response = await axios.get(gh_releases_url);

        if (response.data.length > 0) {
          latest_version.value = vClean(response.data[0].tag_name)!;
          hasUpdate.value = vCompare(latest_version.value, current_version.value) === 1;
          if (hasUpdate.value === true) {
            window.xray.server.xray_version_latest = latest_version.value;
            if (refusedToUpdateVersion.value != latest_version.value) {
              updateModal.value.show();
            }
          }

          changelog.value = md.render(response.data[0].body);
        }
      }, 2000);

      const open_update = () => {
        updateModal.value.show();
      };

      const update = async () => {
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmtActions.performUpdate);
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
  .textarea-wrapper {
    .changelog {
      text-align: left;
      background-color: #2f3a3e;
      border: 1px solid #222;
      padding: 0 10px;
      min-height: 150px;
      font-family: 'Courier New', Courier, monospace;

      :deep(h2) {
        margin: 5px;
      }

      :deep(ul) {
        margin: 5px;
        padding: 0 10px;
      }

      :deep(ul li) {
        margin: 5px;
        padding-bottom: 5px;
        border-bottom: 1px dashed #222;
      }

      :deep(ul li):last-child {
        border-bottom: none;
      }

      :deep(code) {
        font-weight: bold;
      }
    }

    :deep(a) {
      color: #ffcc00;
      text-decoration: underline;
    }
  }

  .modal-content :deep(strong),
  .modal-content :deep(code) {
    text-shadow: 1px 1px 2px #ffcc00;
  }
</style>
