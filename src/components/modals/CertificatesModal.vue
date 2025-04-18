<template>
  <modal width="755" ref="certModal" :title="$t('com.CertificatesModal.modal_title')">
    <table class="FormTable modal-form-table">
      <tbody>
        <tr>
          <th>
            {{ $t('com.CertificatesModal.label_ocsp_stapling') }}
            <hint v-html="$t('com.CertificatesModal.hint_ocsp_stapling')"></hint>
          </th>
          <td>
            <input v-model="certificate.ocspStapling" type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" />
            <span class="hint-color">default: 3600</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.CertificatesModal.label_one_time_loading') }}
            <hint v-html="$t('com.CertificatesModal.hint_one_time_loading')"></hint>
          </th>
          <td>
            <input v-model="certificate.oneTimeLoading" type="checkbox" class="input" />
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.CertificatesModal.label_usage') }}
            <hint v-html="$t('com.CertificatesModal.hint_usage')"></hint>
          </th>
          <td>
            <template v-for="(opt, index) in usageOptions" :key="index">
              <input v-model="certificate.usage" type="radio" class="input" :value="opt" :id="'destopt-' + index" @click="validate_usage(opt)" />
              <label :for="'destopt-' + index" class="settingvalue">{{ opt.toUpperCase() }}</label>
            </template>
            <span class="hint-color">default: encipherment</span>
          </td>
        </tr>
        <tr v-if="certificate.usage == 'issue'">
          <th>
            {{ $t('com.CertificatesModal.label_build_chain') }}
            <hint v-html="$t('com.CertificatesModal.hint_build_chain')"></hint>
          </th>
          <td>
            <input v-model="certificate.buildChain" type="checkbox" class="input" />
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.CertificatesModal.label_certificate_file') }}
            <hint v-html="$t('com.CertificatesModal.hint_certificate_file')"></hint>
          </th>
          <td>
            <input v-model="certificate.certificateFile" type="text" class="input_25_table" :disabled="(certificate.certificate?.length ?? 0) > 0" />
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.CertificatesModal.label_certificate_content') }}
            <hint v-html="$t('com.CertificatesModal.hint_certificate_content')"></hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="certificate.certificate" rows="25" :disabled="(certificate.certificateFile?.length ?? 0) > 0"></textarea>
            </div>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.CertificatesModal.label_key_file') }}
            <hint v-html="$t('com.CertificatesModal.hint_key_file')"></hint>
          </th>
          <td>
            <input v-model="certificate.keyFile" type="text" class="input_25_table" :disabled="(certificate.key?.length ?? 0) > 0" />
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.CertificatesModal.label_key_content') }}
            <hint v-html="$t('com.CertificatesModal.hint_key_content')"></hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="certificate.key" rows="25" :disabled="(certificate.keyFile?.length ?? 0) > 0"></textarea>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { XrayStreamTlsCertificateObject } from '@/modules/CommonObjects';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'CertificatesModal',
    props: {
      certificates: Array as () => XrayStreamTlsCertificateObject[]
    },

    components: {
      Modal,
      Hint
    },
    methods: {},
    setup(props) {
      const certificate = ref(props.certificates?.[0] ?? new XrayStreamTlsCertificateObject());
      const certModal = ref();

      const show = () => {
        certModal.value.show();
        certificate.value = props.certificates?.[0] ?? new XrayStreamTlsCertificateObject();
      };
      const validate_usage = (usage: string) => {
        if (usage == 'issue') {
          certificate.value.buildChain = certificate.value.buildChain;
          return;
        }
        certificate.value.buildChain = false;
      };
      return {
        certificate,
        usageOptions: XrayStreamTlsCertificateObject.usageOptions,
        certModal,
        show,
        validate_usage
      };
    }
  });
</script>
