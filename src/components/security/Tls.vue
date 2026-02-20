<template>
  <div class="formfontdesc">
    <p>{{ $t('com.Tls.modal_desc') }}</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t('com.Tls.modal_title') }}</td>
        </tr>
      </thead>
      <tbody v-if="transport.tlsSettings">
        <tr v-if="proxyType === 'outbound'">
          <th>
            {{ $t('com.Tls.label_server_name') }}
            <hint v-html="$t('com.Tls.hint_server_name')"></hint>
          </th>
          <td>
            <input v-model="transport.tlsSettings.serverName" type="text" class="input_20_table" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr v-if="proxyType === 'outbound'">
          <th>
            {{ $t('com.Tls.label_allow_insecure') }}
            <hint v-html="$t('com.Tls.hint_allow_insecure')"></hint>
          </th>
          <td>
            <input v-model="transport.tlsSettings.allowInsecure" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr v-if="proxyType === 'inbound'">
          <th>
            {{ $t('com.Tls.label_reject_unknown_sni') }}
            <hint v-html="$t('com.Tls.hint_reject_unknown_sni')"></hint>
          </th>
          <td>
            <input v-model="transport.tlsSettings.rejectUnknownSni" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.Tls.label_dont_use_ca') }}
            <hint v-html="$t('com.Tls.hint_dont_use_ca')"></hint>
          </th>
          <td>
            <input v-model="transport.tlsSettings.disableSystemRoot" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr v-if="proxyType === 'outbound'">
          <th>
            {{ $t('com.Tls.label_session_resumption') }}
            <hint v-html="$t('com.Tls.hint_session_resumption')"></hint>
          </th>
          <td>
            <input v-model="transport.tlsSettings.enableSessionResumption" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.Tls.label_alpn') }}
            <hint v-html="$t('com.Tls.hint_alpn')"></hint>
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
            {{ $t('com.Tls.label_tls_version') }}
            <hint v-html="$t('com.Tls.hint_tls_version')"></hint>
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
            {{ $t('com.Tls.label_fingerprint') }}
            <hint v-html="$t('com.Tls.hint_fingerprint')"></hint>
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
        <tr v-if="proxyType === 'outbound'">
          <th>
            {{ $t('com.Tls.label_pinned_peer_certificate') }}
            <hint v-html="$t('com.Tls.hint_pinned_peer_certificate')"></hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea rows="25" v-model.trim="pinnedCertificatesText" placeholder="AE243D668EC9C7F74A0DCD1AD21C6676B4EFE30C39728934B362093AF886BF77"></textarea>
            </div>
            <span class="hint-color">SHA256 fingerprints, one per line (optional)</span>
          </td>
        </tr>
        <tr v-if="proxyType === 'outbound'">
          <th>
            {{ $t('com.Tls.label_ech_config_list') }}
            <hint v-html="$t('com.Tls.hint_ech_config_list')"></hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea rows="3" v-model.trim="transport.tlsSettings.echConfigList" placeholder="udp://1.1.1.1 or base64 ECHConfig"></textarea>
            </div>
            <span class="hint-color">optional</span>
          </td>
        </tr>
        <tr v-if="proxyType === 'outbound' && isDnsEchConfig">
          <th>
            {{ $t('com.Tls.label_ech_force_query') }}
            <hint v-html="$t('com.Tls.hint_ech_force_query')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="transport.tlsSettings.echForceQuery">
              <option v-for="(opt, index) in echForceQueryOptions" :key="index" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color">default: none</span>
          </td>
        </tr>
        <tr v-if="proxyType === 'inbound'">
          <th>
            {{ $t('com.Tls.label_ech_server_name') }}
            <hint v-html="$t('com.Tls.hint_ech_server_name')"></hint>
          </th>
          <td>
            <input v-model.trim="echServerName" type="text" class="input_20_table" placeholder="example.com" />
            <span v-if="echServerName" class="row-buttons">
              <input class="button_gen button_gen_small" type="button" :value="$t('labels.regenerate')" @click.prevent="generate_ech_keys()" />
            </span>
          </td>
        </tr>
        <tr v-if="proxyType === 'inbound'">
          <th>
            {{ $t('com.Tls.label_ech_server_keys') }}
            <hint v-html="$t('com.Tls.hint_ech_server_keys')"></hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea rows="3" v-model.trim="transport.tlsSettings.echServerKeys"></textarea>
            </div>
            <span v-if="generatedEchConfigList" class="hint-color" style="word-break: break-all;">
              {{ $t('com.Tls.label_ech_config_list') }}: {{ generatedEchConfigList }}
            </span>
          </td>
        </tr>
        <tr v-if="proxyType === 'inbound'">
          <th>
            {{ $t('com.Tls.label_certificate') }}
            <hint v-html="$t('com.Tls.hint_certificate')"></hint>
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
  import { defineComponent, ref, watch, computed } from 'vue';
  import engine, { SubmitActions } from '@/modules/Engine';
  import CertificatesModal from '@modal/CertificatesModal.vue';
  import { XrayStreamSettingsObject, XrayStreamTlsSettingsObject, XrayStreamTlsCertificateObject } from '@/modules/CommonObjects';
  import { XrayOptions } from '@/modules/Options';
  import Hint from '@/components/Hint.vue';

  export default defineComponent({
    name: 'Tls',
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

      const echServerName = ref('');
      const generatedEchConfigList = ref('');

      const generate_ech_keys = async () => {
        if (!echServerName.value) {
          alert('Server name is required for ECH key generation.');
          return;
        }
        window.showLoading();
        await engine.submit(SubmitActions.generateEchKeys, { serverName: echServerName.value }, 1000);
        const result = await engine.getEchKeys();
        if (result && transport.value.tlsSettings) {
          transport.value.tlsSettings.echServerKeys = result.serverKeys;
          generatedEchConfigList.value = result.configList;
        }
        window.hideLoading();
      };

      const certificate_manage = () => {
        certificatesModal.value.show();
      };
      const certificate_renew = async () => {
        const delay = 5000;
        window.showLoading(delay);
        await engine.submit(SubmitActions.regenerateSslCertificates, null, delay);
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

      const isDnsEchConfig = computed(() => {
        const val = transport.value.tlsSettings?.echConfigList;
        return val ? val.includes('://') : false;
      });

      const pinnedCertificatesText = computed({
        get: () => {
          return transport.value.tlsSettings?.pinnedPeerCertificateSha256?.join('\n') || '';
        },
        set: (value: string) => {
          if (transport.value.tlsSettings) {
            const lines = value
              .split('\n')
              .map((line) => line.trim().toUpperCase())
              .filter((line) => line.length > 0);
            transport.value.tlsSettings.pinnedPeerCertificateSha256 = lines.length > 0 ? lines : undefined;
          }
        }
      });

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
        certificate_renew,
        pinnedCertificatesText,
        isDnsEchConfig,
        echForceQueryOptions: XrayOptions.echForceQueryOptions,
        echServerName,
        generatedEchConfigList,
        generate_ech_keys
      };
    }
  });
</script>
<style scoped></style>
