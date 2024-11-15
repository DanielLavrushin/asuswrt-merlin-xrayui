<template>
  <tr>
    <th>Server Name</th>
    <td>
      <input v-model="tlsSettings.serverName" type="text" class="input_20_table" />
      <span class="hint-color"></span>
    </td>
  </tr>
  <tr>
    <th>Reject unkown SNI</th>
    <td>
      <input v-model="tlsSettings.rejectUnknownSni" type="checkbox" class="input" />
      <span class="hint-color">default: false</span>
    </td>
  </tr>
  <tr>
    <th>Don't use CA</th>
    <td>
      <input v-model="tlsSettings.disableSystemRoot" type="checkbox" class="input" />
      <span class="hint-color">default: false</span>
    </td>
  </tr>
  <tr>
    <th>Session Resumption</th>
    <td>
      <input v-model="tlsSettings.enableSessionResumption" type="checkbox" class="input" />
      <span class="hint-color">default: false</span>
    </td>
  </tr>
  <tr>
    <th>ALPN</th>
    <td>
      <slot v-for="(opt, index) in alpnOptions" :key="index">
        <input type="checkbox" v-model="tlsSettings.alpn" class="input" :value="opt" :id="'destopt-' + index" />
        <label :for="'destopt-' + index" class="settingvalue">{{ opt.toUpperCase() }}</label>
      </slot>
      <span class="hint-color">default: H2 & HTTP/1.1</span>
    </td>
  </tr>
  <tr>
    <th>TLS Version</th>
    <td>
      <select v-model="tlsSettings.minVersion" class="input_option">
        <option v-for="opt in tlsVersions" :key="opt" :value="opt">
          {{ opt.toFixed(1) }}
        </option>
      </select>
      -
      <select v-model="tlsSettings.maxVersion" class="input_option">
        <option v-for="opt in tlsVersions" :key="opt" :value="opt">
          {{ opt.toFixed(1) }}
        </option>
      </select>
      <span class="hint-color">min and max version, default: 1.3</span>
    </td>
  </tr>
  <tr>
    <th>TLS Certificate</th>
    <td>
      <input class="button_gen button_gen_small" type="button" value="Manage" @click.prevent="certificate_manage()" />
      <input class="button_gen button_gen_small" type="button" value="Renew" @click.prevent="certificate_renew()" />
      <certificates-modal ref="certificatesModal" :certificates="tlsSettings.certificates"></certificates-modal>
    </td>
  </tr>
</template>

<script lang="ts">
import engine, { SubmtActions } from "@/modules/Engine";
import { defineComponent, ref, watch, reactive } from "vue";
import CertificatesModal from "../modals/CertificatesModal.vue";
import xrayConfig, { XrayStreamTlsSettingsObject, XrayStreamTlsCertificateObject } from "@/modules/XrayConfig";

export default defineComponent({
  name: "Tls",
  components: {
    CertificatesModal,
  },
  methods: {
    certificate_manage() {
      this.certificatesModal.show();
    },
    async certificate_renew() {
      const delay = 5000;
      window.showLoading(delay / 1000);
      await engine.submit(SubmtActions.CertificateRenew, null, delay);
      await engine.loadXrayConfig();
      window.hideLoading();


    },
  },
  setup() {
    const certificatesModal = ref();
    const tlsSettings = ref<XrayStreamTlsSettingsObject>(xrayConfig.inbounds?.[0].streamSettings.tlsSettings ?? new XrayStreamTlsSettingsObject());
    watch(
      () => xrayConfig.inbounds?.[0].streamSettings?.tlsSettings,
      (newObj) => {
        tlsSettings.value = newObj ?? new XrayStreamTlsSettingsObject();
        if (!newObj) {
          xrayConfig.inbounds[0].streamSettings.tlsSettings = tlsSettings.value;
        }
      },
      { immediate: true }
    );

    watch(
      () => tlsSettings.value.minVersion,
      (newVal) => {
        if (newVal > tlsSettings.value.maxVersion) {
          tlsSettings.value.maxVersion = newVal;
        }
      }
    );

    watch(
      () => tlsSettings.value.maxVersion,
      (newVal) => {
        if (newVal < tlsSettings.value.minVersion) {
          tlsSettings.value.minVersion = newVal;
        }
      }
    );

    return {
      tlsSettings,
      certificatesModal,
      usageOptions: XrayStreamTlsCertificateObject.usageOptions,
      tlsVersions: XrayStreamTlsSettingsObject.tlsVersionsOptions,
      alpnOptions: XrayStreamTlsSettingsObject.alpnOptions,
    };
  },
});
</script>
<style scoped></style>
