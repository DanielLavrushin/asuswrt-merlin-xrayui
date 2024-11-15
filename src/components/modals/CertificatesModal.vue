<template>
  <modal width="755" ref="certModal" title="Manage TLS Certificate">
    <table class="FormTable modal-form-table">
      <tbody>
        <tr>
          <th>OCSP stapling</th>
          <td>
            <input v-model="certificate.ocspStapling" type="text" maxlength="4" class="input_6_table"
              onkeypress="return validator.isNumber(this,event);" />
            <span class="hint-color">default: 3600</span>
          </td>
        </tr>
        <tr>
          <th>Load only once</th>
          <td>
            <input v-model="certificate.oneTimeLoading" type="checkbox" class="input" />
          </td>
        </tr>
        <tr>
          <th>Usage</th>
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
          <th>Build chain</th>
          <td>
            <input v-model="certificate.buildChain" type="checkbox" class="input" />
          </td>
        </tr>
        <tr>
          <th>Path to .crt file</th>
          <td>
            <input v-model="certificate.certificateFile" type="text" class="input_25_table"
              :disabled="(certificate.certificate?.length ?? 0) > 0" />
          </td>
        </tr>
        <tr>
          <th>Certificate content</th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="certificate.certificate" rows="25"
                :disabled="(certificate.certificateFile?.length ?? 0) > 0"></textarea>
            </div>
          </td>
        </tr>
        <tr>
          <th>Path to .key file</th>
          <td>
            <input v-model="certificate.keyFile" type="text" class="input_25_table"
              :disabled="(certificate.key?.length ?? 0) > 0" />
          </td>
        </tr>
        <tr>
          <th>Key content</th>
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
import { XrayStreamTlsCertificateObject } from "@/modules/XrayConfig";
import Modal from "../Modal.vue";

export default defineComponent({
  name: "CertificatesModal",
  props: {
    certificates: Array as () => XrayStreamTlsCertificateObject[],
  },

  components: {
    Modal,
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
