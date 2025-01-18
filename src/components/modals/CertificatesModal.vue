<template>
  <modal width="755" ref="certModal" title="Manage TLS Certificate">
    <table class="FormTable modal-form-table">
      <tbody>
        <tr>
          <th>OCSP stapling
            <hint>
              OCSP stapling update interval in seconds for certificate hot reload. Default value is `3600`, i.e. one
              hour.
            </hint>
          </th>
          <td>
            <input v-model="certificate.ocspStapling" type="number" maxlength="4" class="input_6_table"
              onkeypress="return validator.isNumber(this,event);" />
            <span class="hint-color">default: 3600</span>
          </td>
        </tr>
        <tr>
          <th>Load only once
            <hint>
              Load only once. When set to `true`, it will disable certificate hot reload and OCSP stapling feature.
              <blockquote>
                **Warning**:
                When set to `true`, `OCSP` stapling will be `disabled`.
              </blockquote>
            </hint>
          </th>
          <td>
            <input v-model="certificate.oneTimeLoading" type="checkbox" class="input" />
          </td>
        </tr>
        <tr>
          <th>Usage
            <hint>
              Certificate usage, default value is `encipherment`.
              <ul>
                <li>`encipherment`: The certificate is used for TLS authentication and encryption.</li>
                <li>`verify`: The certificate is used to verify the remote TLS certificate. When using this option, the
                  current certificate must be a CA certificate.</li>
                <li>`issue`: The certificate is used to issue other certificates. When using this option, the current
                  certificate must be a CA certificate.</li>
              </ul>

            </hint>
          </th>
          <td>
            <template v-for="(opt, index) in usageOptions" :key="index">
              <input v-model="certificate.usage" type="radio" class="input" :value="opt" :id="'destopt-' + index"
                @click="validateUsage(opt)" />
              <label :for="'destopt-' + index" class="settingvalue">{{ opt.toUpperCase() }}</label>
            </template>
            <span class="hint-color">default: encipherment</span>
          </td>
        </tr>
        <tr v-if="certificate.usage == 'issue'">
          <th>Build chain
            <hint>
              Only valid when usage is issue. When set to `true`, the CA certificate will be appended to leaf
              certificate
              as chain
              during issuing certificates.
              <blockquote>
                Root certificates should not be embedded in the certificate chain. This option is only applicable when
                the
                signing CA certificate is an intermediate certificate.
              </blockquote>
            </hint>
          </th>
          <td>
            <input v-model="certificate.buildChain" type="checkbox" class="input" />
          </td>
        </tr>
        <tr>
          <th>Path to .crt file
            <hint>
              Path to the certificate file. When the certificate content is empty, the content will be read from the
              file.
            </hint>
          </th>
          <td>
            <input v-model="certificate.certificateFile" type="text" class="input_25_table"
              :disabled="(certificate.certificate?.length ?? 0) > 0" />
          </td>
        </tr>
        <tr>
          <th>Certificate content
            <hint>
              Certificate content. When the certificate file path is empty, the content will be read from the field.
            </hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="certificate.certificate" rows="25"
                :disabled="(certificate.certificateFile?.length ?? 0) > 0"></textarea>
            </div>
          </td>
        </tr>
        <tr>
          <th>Path to .key file
            <hint>
              Path to the key file. When the key content is empty, the content will be read from the file.
            </hint>
          </th>
          <td>
            <input v-model="certificate.keyFile" type="text" class="input_25_table"
              :disabled="(certificate.key?.length ?? 0) > 0" />
          </td>
        </tr>
        <tr>
          <th>Key content
            <hint>
              Key content. When the key file path is empty, the content will be read from the field.
            </hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="certificate.key" rows="25"
                :disabled="(certificate.keyFile?.length ?? 0) > 0"></textarea>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </modal>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { XrayStreamTlsCertificateObject } from "../../modules/CommonObjects";
import Modal from "../Modal.vue";
import Hint from "../Hint.vue";

export default defineComponent({
  name: "CertificatesModal",
  props: {
    certificates: Array as () => XrayStreamTlsCertificateObject[],
  },

  components: {
    Modal,
    Hint
  },
  methods: {
    show() {
      this.certModal.show();
      this.certificate = this.$props.certificates?.[0] ?? new XrayStreamTlsCertificateObject();
    },
    validateUsage(usage: string) {
      if (usage == "issue") {
        this.certificate.buildChain = this.certificate.buildChain;
        return;
      }
      this.certificate.buildChain = false;
    },
  },
  setup(props) {
    const certificate = ref(props.certificates?.[0] ?? new XrayStreamTlsCertificateObject());
    const certModal = ref();
    return { certificate, usageOptions: XrayStreamTlsCertificateObject.usageOptions, certModal };
  },
});
</script>
