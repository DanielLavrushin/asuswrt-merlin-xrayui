<template>
  <div class="formfontdesc">
    <p>Configures REALITY. REALITY is a piece of advanced encryption technology developed in-house, with higher security
      than vanilla TLS, but configs of both are largely the same.</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Settings</td>
        </tr>
      </thead>
      <tbody v-if="transport.realitySettings">
        <tr>
          <th>Enable Logs</th>
          <td>
            <input v-model="transport.realitySettings.show" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr v-if="engine.mode === 'server'">
          <th>Dest</th>
          <td>
            <input v-model="transport.realitySettings.dest" type="text" class="input_20_table" />
            <span class="hint-color">same as dest in VLESS</span>
          </td>
        </tr>
        <tr v-if="engine.mode === 'server'">
          <th>Server names</th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="serverNames"></textarea>
            </div>
          </td>
        </tr>
        <tr v-if="engine.mode === 'client'">
          <th>Server name</th>
          <td>
            <input v-model="transport.realitySettings.serverName" type="text" class="input_20_table" />
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr v-if="engine.mode === 'client'">
          <th>Short id</th>
          <td>
            <input v-model="transport.realitySettings.shortId" type="text" class="input_20_table" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr v-if="engine.mode === 'server' && transport.realitySettings.shortIds">
          <th>Short Ids</th>
          <td>
            {{ transport.realitySettings.shortIds.length }} item(s)
            <input class="button_gen button_gen_small" type="button" value="manage"
              @click.prevent="manage_short_ids()" />
            <modal ref="shortIdsModal" width="200" title="Short Id List">
              <div class="textarea-wrapper">
                <textarea v-model="shortIds"></textarea>
              </div>
              <template v-slot:footer>
                <input class="button_gen button_gen_small" type="button" value="add new id"
                  @click.prevent="append_shortid()" />
                <input class="button_gen button_gen_small" type="button" value="save"
                  @click.prevent="shortIdsModal.close()" />
              </template>
            </modal>
          </td>
        </tr>
        <tr v-if="engine.mode === 'server'">
          <th>PROXY Version</th>
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
          <th>Private Key</th>
          <td>
            <input v-model="transport.realitySettings.privateKey" type="text" class="input_30_table" />
            <span class="row-buttons">
              <input class="button_gen button_gen_small" type="button" value="Regenerate"
                @click.prevent="regenerate_keys()" />
            </span>
          </td>
        </tr>
        <tr>
          <th>Public Key</th>
          <td>
            <input v-model="transport.realitySettings.publicKey" type="text" class="input_30_table" />
          </td>
        </tr>
        <tr v-if="engine.mode === 'server' && transport.realitySettings">
          <th>Spider X</th>
          <td>
            <input v-model="transport.realitySettings.spiderX" type="text" class="input_30_table" />
          </td>
        </tr>
        <tr v-if="engine.mode === 'client'">
          <th>Fingerprint</th>
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

export default defineComponent({
  name: "Reality",
  components: {
    Modal,
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
        this.transport.realitySettings.privateKey = result.privateKey;
        this.transport.realitySettings.publicKey = result.publicKey;
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
