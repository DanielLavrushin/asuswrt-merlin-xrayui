<template>
  <div class="formfontdesc">
    <p>{{ $t("components.Tls.modal_desc") }}</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t("components.Tls.modal_title") }}</td>
        </tr>
      </thead>
      <tbody v-if="transport.tlsSettings">
        <tr v-if="proxyType === 'outbound'">
          <th>
            {{ $t("components.Tls.label_server_name") }}
            <hint v-html="$t('components.Tls.hint_server_name')"></hint>
          </th>
          <td>
            <input v-model="transport.tlsSettings.serverName" type="text" class="input_20_table" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr v-if="proxyType === 'outbound'">
          <th>
            {{ $t("components.Tls.label_allow_insecure") }}
            <hint v-html="$t('components.Tls.hint_allow_insecure')"></hint>
          </th>
          <td>
            <input v-model="transport.tlsSettings.allowInsecure" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr v-if="proxyType === 'inbound'">
          <th>
            {{ $t("components.Tls.label_reject_unknown_sni") }}
            <hint v-html="$t('components.Tls.hint_reject_unknown_sni')"></hint>
          </th>
          <td>
            <input v-model="transport.tlsSettings.rejectUnknownSni" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.Tls.label_dont_use_ca") }}
            <hint v-html="$t('components.Tls.hint_dont_use_ca')"></hint>
          </th>
          <td>
            <input v-model="transport.tlsSettings.disableSystemRoot" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr v-if="proxyType === 'outbound'">
          <th>
            {{ $t("components.Tls.label_session_resumption") }}
            <hint v-html="$t('components.Tls.hint_session_resumption')"></hint>
          </th>
          <td>
            <input v-model="transport.tlsSettings.enableSessionResumption" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.Tls.label_alpn") }}
            <hint v-html="$t('components.Tls.hint_alpn')"></hint>
          </th>
          <td>
            <template v-for="(opt, index) in alpnOptions" :key="index">
              <input type="checkbox" v-model="transport.tlsSettings.alpn" class="input" :value="opt" :id="'destopt-' + index" />
              <label :for="'destopt-' + index" class="settingvalue">{{ opt.toUpperCase() }}</label>
            </template>
            <span class="hint-color">default: H2 & HTTP/1.1</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.Tls.label_tls_version") }}
            <hint v-html="$t('components.Tls.hint_tls_version')"></hint>
          </th>
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
        <tr v-if="proxyType === 'outbound'">
          <th>
            {{ $t("components.Tls.label_fingerprint") }}
            <hint v-html="$t('components.Tls.hint_fingerprint')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="transport.tlsSettings.fingerprint">
              <option v-for="(opt, index) in fingerprints" :key="index" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color">optional</span>
          </td>
        </tr>
        <tr v-if="proxyType === 'inbound'">
          <th>
            {{ $t("components.Tls.label_certificate") }}
            <hint v-html="$t('components.Tls.hint_certificate')"></hint>
          </th>
          <td>
            <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="certificate_manage()" />
            <input class="button_gen button_gen_small" type="button" :value="$t('labels.renew')" @click.prevent="certificate_renew()" />
            <certificates-modal ref="certificatesModal" :certificates="transport.tlsSettings.certificates"></certificates-modal>
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
  import Hint from "@/components/Hint.vue";

  export default defineComponent({
    name: "Tls",
    components: {
      CertificatesModal,
      Hint
    },
    props: {
      proxyType: {
        type: String,
        required: true
      },
      transport: XrayStreamSettingsObject
    },
    setup(props) {
      const proxyType = ref(props.proxyType);
      const certificatesModal = ref();
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
      transport.value.tlsSettings = transport.value.tlsSettings ?? new XrayStreamTlsSettingsObject();

      const certificate_manage = () => {
        certificatesModal.value.show();
      };
      const certificate_renew = async () => {
        const delay = 5000;
        window.showLoading(delay);
        await engine.submit(SubmtActions.regenerateSslCertificates, null, delay);
        const result = await engine.getSslCertificates();
        if (result && transport.value.tlsSettings) {
          transport.value.tlsSettings.certificates = [];
          let cert = new XrayStreamTlsCertificateObject();
          cert.certificateFile = result.certificateFile;
          cert.keyFile = result.keyFile;
          transport.value.tlsSettings.certificates.push(cert);
        }
        window.hideLoading();
      };

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
        engine,
        fingerprints: XrayOptions.fingerprintOptions,
        usageOptions: XrayStreamTlsCertificateObject.usageOptions,
        tlsVersions: XrayOptions.tlsVersionsOptions,
        alpnOptions: XrayOptions.alpnOptions,
        proxyType,
        certificate_manage,
        certificate_renew
      };
    }
  });
</script>
<style scoped></style>
