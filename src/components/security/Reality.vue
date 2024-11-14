<template>
  <tr>
    <th>Enable Logs</th>
    <td>
      <input v-model="realitySettings.show" type="checkbox" class="input" />
      <span class="hint-color">default: false</span>
    </td>
  </tr>
  <tr>
    <th>Dest</th>
    <td>
      <input v-model="realitySettings.dest" type="text" class="input_20_table" />
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
      {{ realitySettings.shortIds.length }} item(s)
      <input class="button_gen button_gen_small" type="button" value="Manage" @click.prevent="manage_short_ids()" />
      <modal ref="shortIdsModal" width="600" title="Short Id List">
        <div class="textarea-wrapper">
          <textarea v-model="shortIds"></textarea>
        </div>
        <input class="button_gen button_gen_small" type="button" value="Add new id" @click.prevent="append_shortid()" />
      </modal>
    </td>
  </tr>
  <tr>
    <th>PROXY Version</th>
    <td>
      <select v-model="realitySettings.xver" class="input_option">
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
      <input v-model="realitySettings.privateKey" type="text" class="input_30_table" readonly />
      <span class="row-buttons">
        <input class="button_gen button_gen_small" type="button" value="Regenerate"
          @click.prevent="regenerate_keys()" />
      </span>
    </td>
  </tr>
  <tr>
    <th>Public Key</th>
    <td>
      <input v-model="realitySettings.publicKey" type="text" class="input_30_table" readonly />
    </td>
  </tr>
  <tr>
    <th>Spider X</th>
    <td>
      <input v-model="realitySettings.spiderX" type="text" class="input_30_table" />
    </td>
  </tr>
</template>

<script lang="ts">
import Modal from "../Modal.vue";
import engine, { SubmtActions } from "@/modules/Engine";
import { defineComponent, ref, watch, reactive } from "vue";
import xrayConfig, { XrayStreamRealitySettingsObject } from "@/modules/XrayConfig";

export default defineComponent({
  name: "Reality",
  components: {
    Modal,
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
      await engine.submit(SubmtActions.regenerateRealityKeys, null, 1000);
      let result = await engine.getRealityKeys();
      this.realitySettings.privateKey = result.privateKey;
      this.realitySettings.publicKey = result.publicKey;
      window.hideLoading();
    },
  },
  setup() {
    const shortIdsModal = ref();
    const realitySettings = ref<XrayStreamRealitySettingsObject>(xrayConfig.inbounds?.[0].streamSettings.realitySettings ?? new XrayStreamRealitySettingsObject());
    const serverNames = ref(realitySettings.value.serverNames?.join("\n") ?? "");
    const shortIds = ref(realitySettings.value.shortIds?.join("\n") ?? "");
    watch(
      () => serverNames.value,
      (newObj) => {
        if (newObj) {
          realitySettings.value.serverNames = newObj.split("\n").filter((x) => x);
        }
      },
      { immediate: true }
    );
    watch(
      () => shortIds.value,
      (newObj) => {
        if (newObj) {
          realitySettings.value.shortIds = newObj.split("\n").filter((x) => x);
        }
      },
      { immediate: true }
    );
    watch(
      () => xrayConfig.inbounds?.[0].streamSettings?.realitySettings,
      (newObj) => {
        realitySettings.value = newObj ?? new XrayStreamRealitySettingsObject();
        if (!newObj) {
          xrayConfig.inbounds[0].streamSettings.realitySettings = realitySettings.value;
        }
      },
      { immediate: true }
    );

    return {
      shortIdsModal,
      realitySettings,
      serverNames,
      shortIds,
    };
  },
});
</script>
<style scoped></style>
