<template>
  <div class="formfontdesc">
    <p>Configures vanilla TLS. The TLS encryption suite is provided by Golang, which often uses TLS 1.3, and has no
      support for DTLS.</p>
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
        <tr>
          <th>Dest</th>
          <td>
            <input v-model="transport.realitySettings.dest" type="text" class="input_20_table" />
            <span class="hint-color">same as dest in VLESS</span>
          </td>
        </tr>
        <tr>
          <th>Server Names</th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="serverNames"></textarea>
            </div>
          </td>
        </tr>
        <tr>
          <th>Short Ids</th>
          <td>
            {{ transport.realitySettings.shortIds.length }} item(s)
            <input class="button_gen button_gen_small" type="button" value="Manage"
              @click.prevent="manage_short_ids()" />
            <modal ref="shortIdsModal" width="200" title="Short Id List">
              <div class="textarea-wrapper">
                <textarea v-model="shortIds"></textarea>
              </div>
              <template v-slot:footer>
                <input class="button_gen button_gen_small" type="button" value="Add new id"
                  @click.prevent="append_shortid()" />
              </template>
            </modal>
          </td>
        </tr>
        <tr>
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
        <tr>
          <th>Private Key</th>
          <td>
            <input v-model="transport.realitySettings.privateKey" type="text" class="input_30_table" readonly />
            <span class="row-buttons">
              <input class="button_gen button_gen_small" type="button" value="Regenerate"
                @click.prevent="regenerate_keys()" />
            </span>
          </td>
        </tr>
        <tr>
          <th>Public Key</th>
          <td>
            <input v-model="transport.realitySettings.publicKey" type="text" class="input_30_table" readonly />
          </td>
        </tr>
        <tr v-if="transport.realitySettings">
          <th>Spider X</th>
          <td>
            <input v-model="transport.realitySettings.spiderX" type="text" class="input_30_table" />
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
      this.shortIds += this.generateShortId() + "\n";
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

    return {
      transport,
      shortIdsModal,
      serverNames,
      shortIds,
    };
  },
});
</script>
<style scoped></style>
