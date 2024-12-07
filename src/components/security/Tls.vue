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
      <tbody v-if="transport.tlsSettings">
        <tr>
          <th>Server Name</th>
          <td>
            <input v-model="transport.tlsSettings.serverName" type="text" class="input_20_table" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>Reject unkown SNI</th>
          <td>
            <input v-model="transport.tlsSettings.rejectUnknownSni" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr>
          <th>Don't use CA</th>
          <td>
            <input v-model="transport.tlsSettings.disableSystemRoot" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr>
          <th>Session Resumption</th>
          <td>
            <input v-model="transport.tlsSettings.enableSessionResumption" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr>
          <th>ALPN</th>
          <td>
            <template v-for="(opt, index) in alpnOptions" :key="index">
              <input type="checkbox" v-model="transport.tlsSettings.alpn" class="input" :value="opt"
                :id="'destopt-' + index" />
              <label :for="'destopt-' + index" class="settingvalue">{{ opt.toUpperCase() }}</label>
            </template>
            <span class="hint-color">default: H2 & HTTP/1.1</span>
          </td>
        </tr>
        <tr>
          <th>TLS Version</th>
          <td>
            <select v-model="transport.tlsSettings.minVersion" class="input_option">
              <option v-for="opt in tlsVersions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            -
            <select v-model="transport.tlsSettings.maxVersion" class="input_option">
              <option v-for="opt in tlsVersions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color">min and max version, default: 1.3</span>
          </td>
        </tr>
        <tr>
          <th>TLS Certificate</th>
          <td>
            <input class="button_gen button_gen_small" type="button" value="Manage"
              @click.prevent="certificate_manage()" />
            <input class="button_gen button_gen_small" type="button" value="Renew"
              @click.prevent="certificate_renew()" />
            <certificates-modal ref="certificatesModal"
              :certificates="transport.tlsSettings.certificates"></certificates-modal>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import engine, { SubmtActions } from "@/modules/Engine";
import { defineComponent, ref, watch } from "vue";
import CertificatesModal from "../modals/CertificatesModal.vue";
import { XrayStreamSettingsObject, XrayStreamTlsSettingsObject, XrayStreamTlsCertificateObject } from "@/modules/CommonObjects";
import { XrayOptions } from "@/modules/Options";


export default defineComponent({
  name: "Tls",
  components: {
    CertificatesModal,
  },
  props: {
    transport: XrayStreamSettingsObject,
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
  setup(props) {
    const certificatesModal = ref();
    const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
    transport.value.tlsSettings = transport.value.tlsSettings ?? new XrayStreamTlsSettingsObject();
    watch(
      () => transport.value.tlsSettings?.minVersion!,
      (newVal) => {
        if (transport.value.tlsSettings && parseFloat(newVal) > parseFloat(transport.value.tlsSettings.maxVersion!)) {
          transport.value.tlsSettings.maxVersion = newVal;
        }
      }
    );

    watch(
      () => transport.value.tlsSettings?.maxVersion!,
      (newVal) => {
        if (transport.value.tlsSettings && parseFloat(newVal) < parseFloat(transport.value.tlsSettings.minVersion!)) {
          transport.value.tlsSettings.minVersion = newVal;
        }
      }
    );

    return {
      transport,
      certificatesModal,
      usageOptions: XrayStreamTlsCertificateObject.usageOptions,
      tlsVersions: XrayOptions.tlsVersionsOptions,
      alpnOptions: XrayOptions.alpnOptions,
    };
  },
});
</script>
<style scoped></style>
