<template>
  <div class="formfontdesc">
    <p v-html="$t('components.Reality.modal_desc')"></p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t('components.Reality.modal_title') }}</td>
        </tr>
      </thead>
      <tbody v-if="transport.realitySettings">
        <tr>
          <th>
            {{ $t('components.Reality.label_enable_logs') }}
            <hint v-html="$t('components.Reality.hint_enable_logs')"></hint>
          </th>
          <td>
            <input v-model="transport.realitySettings.show" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr v-if="engine.mode === 'server'">
          <th> {{ $t('components.Reality.label_dest') }}
            <hint v-html="$t('components.Reality.hint_dest')"></hint>
          </th>
          <td>
            <input v-model="transport.realitySettings.dest" type="text" class="input_20_table" />
          </td>
        </tr>
        <tr v-if="engine.mode === 'server'">
          <th>{{ $t('components.Reality.label_server_names') }}
            <hint v-html="$t('components.Reality.hint_server_names')"></hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="serverNames"></textarea>
            </div>
          </td>
        </tr>
        <tr v-if="engine.mode === 'client'">
          <th>{{ $t('components.Reality.label_server_name') }}
            <hint v-html="$t('components.Reality.hint_server_name')"></hint>
          </th>
          <td>
            <input v-model="transport.realitySettings.serverName" type="text" class="input_20_table" />
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr v-if="engine.mode === 'client'">
          <th>{{ $t('components.Reality.label_short_id') }}
            <hint v-html="$t('components.Reality.hint_short_id')"></hint>
          </th>
          <td>
            <input v-model="transport.realitySettings.shortId" type="text" class="input_20_table" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr v-if="engine.mode === 'server' && transport.realitySettings.shortIds">
          <th>{{ $t('components.Reality.label_short_ids') }}
            <hint v-html="$t('components.Reality.hint_short_ids')"></hint>
          </th>
          <td>
            {{ transport.realitySettings.shortIds.length }} item(s)
            <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')"
              @click.prevent="manage_short_ids()" />
            <modal ref="shortIdsModal" width="200" title="Short Id List">
              <div class="textarea-wrapper">
                <textarea v-model="shortIds"></textarea>
              </div>
              <template v-slot:footer>
                <input class="button_gen button_gen_small" type="button" :value="$t('components.Reality.add_new_id')"
                  @click.prevent="append_shortid()" />
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')"
                  @click.prevent="shortIdsModal.close()" />
              </template>
            </modal>
          </td>
        </tr>
        <tr v-if="engine.mode === 'server'">
          <th>{{ $t('components.Reality.label_proxy_version') }}
            <hint v-html="$t('components.Reality.hint_proxy_version')"></hint>
          </th>
          <td>
            <select v-model="transport.realitySettings.xver" class="input_option">
              <option v-for="opt in [0, 1, 2]" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color">default: 0</span>
          </td>
        </tr>
        <tr v-if="engine.mode === 'server'">
          <th>{{ $t('components.Reality.label_private_key') }}
            <hint v-html="$t('components.Reality.hintl_private_key')"></hint>
          </th>
          <td>
            <input v-model="transport.realitySettings.privateKey" type="text" class="input_30_table" />
            <span class="row-buttons">
              <input class="button_gen button_gen_small" type="button" value="Regenerate"
                @click.prevent="regenerate_keys()" />
            </span>
          </td>
        </tr>
        <tr>
          <th>{{ $t('components.Reality.label_public_key') }}
            <hint v-html="$t('components.Reality.hint_public_key')"></hint>
          </th>
          <td>
            <input v-model="transport.realitySettings.publicKey" type="text" class="input_30_table" />
          </td>
        </tr>
        <tr>
          <th>{{ $t('components.Reality.label_spider_x') }}
            <hint v-html="$t('components.Reality.hint_spider_x')"></hint>
          </th>
          <td>
            <input v-model="transport.realitySettings.spiderX" type="text" class="input_30_table" />
          </td>
        </tr>
        <tr v-if="engine.mode === 'client'">
          <th>{{ $t('components.Reality.label_fingerprint') }}
            <hint v-html="$t('components.Reality.hint_fingerprint')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="transport.realitySettings.fingerprint">
              <option v-for="(opt, index) in fingerprints" :key="index" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color">optional</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import Modal from "../Modal.vue";
import engine, { SubmtActions } from "@/modules/Engine";
import { defineComponent, ref, watch } from "vue";
import { XrayStreamRealitySettingsObject, XrayStreamSettingsObject } from "@/modules/CommonObjects";
import XrayOptions from "@/modules/Options";
import Hint from "@/components/Hint.vue";

export default defineComponent({
  name: "Reality",
  components: {
    Modal,
    Hint
  },
  props: {
    transport: XrayStreamSettingsObject,
  },
  methods: {
    manage_short_ids() {
      this.shortIdsModal.show();
    },
    append_shortid() {
      this.shortIds = (this.shortIds + "\n" + this.generateShortId())
        .split("\n")
        .filter(line => line.trim() !== "")
        .join("\n");
    },
    generateShortId: (byteLength = 8) => {
      const array = new Uint8Array(byteLength);
      window.crypto.getRandomValues(array);
      return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
    },
    async regenerate_keys() {
      window.showLoading();
      if (this.transport.realitySettings) {

        await engine.submit(SubmtActions.regenerateRealityKeys, null, 1000);
        let result = await engine.getRealityKeys();
        if (result) {
          this.transport.realitySettings.privateKey = result.privateKey;
          this.transport.realitySettings.publicKey = result.publicKey;
        }
        window.hideLoading();
      }
    },
  },
  setup(props) {
    const shortIdsModal = ref();
    const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
    transport.value.realitySettings = transport.value.realitySettings ?? new XrayStreamRealitySettingsObject();

    const serverNames = ref(transport.value.realitySettings.serverNames?.join("\n") ?? "");
    const shortIds = ref(transport.value.realitySettings.shortIds?.join("\n") ?? "");

    if (engine.mode === 'server') {
      if (!transport.value.realitySettings.shortIds) {
        transport.value.realitySettings.shortIds = [];
      }

      watch(
        () => serverNames.value,
        (newObj) => {
          if (newObj && transport.value.realitySettings) {
            transport.value.realitySettings.serverNames = newObj.split("\n").filter((x) => x);
          }
        },
        { immediate: true }
      );

      watch(
        () => shortIds.value,
        (newObj) => {
          if (newObj && transport.value.realitySettings) {
            transport.value.realitySettings.shortIds = newObj.split("\n").filter((x) => x);
          }
        },
        { immediate: true }
      );
    }

    return {
      engine,
      fingerprints: XrayOptions.fingerprintOptions,
      transport,
      shortIdsModal,
      serverNames,
      shortIds,
    };
  },
});
</script>
<style scoped></style>
