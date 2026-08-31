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
            <input v-model="transport.tlsSettings.allowInsecure" type="checkbox" class="input" :disabled="!allowInsecureSupported" />
            <span class="hint-color" v-if="allowInsecureSupported">default: false</span>
            <span class="hint-color" v-else v-html="$t('com.Tls.hint_allow_insecure_removed')"></span>
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
            <span class="row-buttons" v-if="tlsPingSupported">
              <label class="tlsping-note" v-if="!tlsPingTarget">{{ $t('com.Tls.hint_fetch_no_target') }}</label>
              <input
                class="button_gen button_gen_small"
                type="button"
                :value="$t('com.Tls.label_fetch_fingerprints')"
                :disabled="!tlsPingTarget"
                @click.prevent="fetch_fingerprints()"
              />
            </span>
            <span class="hint-color">SHA256 fingerprints, one per line (optional)</span>
            <modal ref="tlsPingModal" :title="$t('com.Tls.modal_fetch_title')">
              <div class="formfontdesc tlsping-modal">
                <p v-html="$t('com.Tls.modal_fetch_desc')"></p>
                <p class="tlsping-warning" v-if="tlsPingResult?.error">{{ tlsPingResult.error }}</p>
                <p class="tlsping-warning" v-else-if="!tlsPingCertificates.length">{{ $t('com.Tls.error_fetch_failed') }}</p>
                <p class="tlsping-warning" v-else-if="tlsPingResult?.mode === 'nosni'">
                  <span v-if="hasServerName" v-html="$t('com.Tls.hint_fetch_sni_failed')"></span>
                  <span v-else v-html="$t('com.Tls.hint_fetch_nosni')"></span>
                  <span class="tlsping-reason" v-if="tlsPingResult.sniError">{{ tlsPingResult.sniError }}</span>
                </p>
                <p class="tlsping-warning" v-if="hasCaCertificates && !caPinAllowed" v-html="$t('com.Tls.hint_fetch_ca_needs_sni')"></p>
                <table width="100%" class="FormTable modal-form-table tlsping-table" v-if="tlsPingResult">
                  <thead>
                    <tr>
                      <td colspan="2">{{ $t('com.Tls.label_fetch_chain') }}</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>{{ $t('com.Tls.label_fetch_target') }}</th>
                      <td>
                        <span class="tlsping-hash">{{ tlsPingResult.target }}</span>
                        <span class="tlsping-muted" v-if="probedIp">&nbsp;({{ probedIp }})</span>
                      </td>
                    </tr>
                    <tr
                      v-for="(cert, index) in tlsPingCertificates"
                      :key="cert.sha256"
                      :class="{ 'tlsping-disabled': cert.type === 'ca' && !caPinAllowed }"
                    >
                      <th>
                        {{ cert.type === 'leaf' ? $t('com.Tls.label_fetch_leaf') : $t('com.Tls.label_fetch_ca') }}
                        <span class="tlsping-muted" v-if="cert.name">&nbsp;&mdash;&nbsp;{{ cert.name }}</span>
                      </th>
                      <td>
                        <input
                          type="checkbox"
                          class="input"
                          :id="'tlsping-' + index"
                          :value="cert.sha256"
                          :disabled="cert.type === 'ca' && !caPinAllowed"
                          v-model="tlsPingSelection"
                        />
                        <label :for="'tlsping-' + index" class="tlsping-hash">{{ cert.sha256 }}</label>
                        <span class="tlsping-pinned" v-if="isPinned(cert.sha256)">{{ $t('com.Tls.label_fetch_already_pinned') }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <template #footer>
                <input
                  class="button_gen button_gen_small"
                  type="button"
                  :value="$t('com.Tls.label_fetch_apply')"
                  :disabled="!tlsPingSelection.length"
                  @click.prevent="apply_fingerprints()"
                />
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.close')" @click.prevent="tlsPingModal.close()" />
              </template>
            </modal>
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
  import engine, { SubmitActions, EngineTlsPing } from '@/modules/Engine';
  import CertificatesModal from '@modal/CertificatesModal.vue';
  import Modal from '@main/Modal.vue';
  import { XrayStreamSettingsObject, XrayStreamTlsSettingsObject, XrayStreamTlsCertificateObject } from '@/modules/CommonObjects';
  import { coreSupports } from '@/modules/CoreVersion';
  import { XrayOptions } from '@/modules/Options';
  import Hint from '@/components/Hint.vue';

  export default defineComponent({
    name: 'Tls',
    components: {
      CertificatesModal,
      Modal,
      Hint
    },
    props: {
      proxyType: {
        type: String,
        required: true
      },
      transport: XrayStreamSettingsObject,
      serverAddress: {
        type: String,
        default: ''
      },
      serverPort: {
        type: Number,
        default: 0
      }
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

      const allowInsecureSupported = computed(() => coreSupports('allowInsecure'));

      const pinnedCertificatesText = computed({
        get: () => {
          return transport.value.tlsSettings?.pinnedCertificateList().join('\n') || '';
        },
        set: (value: string) => {
          if (transport.value.tlsSettings) {
            const lines = value
              .split('\n')
              .map((line) => line.trim().toUpperCase())
              .filter((line) => line.length > 0);
            transport.value.tlsSettings.pinnedPeerCertificateSha256 = lines.length > 0 ? lines : undefined;
            transport.value.tlsSettings.pinnedPeerCertSha256 = undefined;
          }
        }
      });

      const tlsPingModal = ref();
      const tlsPingResult = ref<EngineTlsPing | undefined>();
      const tlsPingSelection = ref<string[]>([]);

      const tlsPingSupported = computed(() => coreSupports('tlsPingCertHash'));

      const tlsPingCertificates = computed(() => tlsPingResult.value?.certificates ?? []);

      const tlsPingTarget = computed(() => (transport.value.tlsSettings?.serverName ?? '').trim() || (props.serverAddress ?? '').trim());

      const probedIp = computed(() => {
        const ip = tlsPingResult.value?.ip ?? '';
        return ip && ip !== tlsPingResult.value?.target ? ip : '';
      });

      const isPinned = (hash: string) => transport.value.tlsSettings?.pinnedCertificateList().includes(hash) ?? false;

      const hasServerName = computed(() => (transport.value.tlsSettings?.serverName ?? '').trim().length > 0);

      const caPinAllowed = hasServerName;

      const hasCaCertificates = computed(() => tlsPingCertificates.value.some((c) => c.type === 'ca'));

      const readTlsPing = async (): Promise<EngineTlsPing | undefined> => {
        try {
          return await engine.getTlsPing();
        } catch {
          return undefined;
        }
      };

      const fetch_fingerprints = async () => {
        if (!tlsPingTarget.value) return;

        tlsPingResult.value = undefined;
        tlsPingSelection.value = [];

        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmitActions.tlsPingFetch, {
            serverName: (transport.value.tlsSettings?.serverName ?? '').trim(),
            address: (props.serverAddress ?? '').trim(),
            port: props.serverPort || 443
          });
        }, false);

        window.showLoading();
        try {
          for (let attempt = 0; attempt < 20; attempt++) {
            if (attempt > 0) await engine.delay(500);
            tlsPingResult.value = await readTlsPing();
            if (tlsPingResult.value) break;
          }
        } finally {
          window.hideLoading();
        }

        tlsPingSelection.value = tlsPingCertificates.value
          .filter((c) => (c.type === 'leaf' || isPinned(c.sha256)) && (c.type !== 'ca' || caPinAllowed.value))
          .map((c) => c.sha256);
        tlsPingModal.value?.show();
      };

      const apply_fingerprints = () => {
        const existing = pinnedCertificatesText.value
          .split('\n')
          .map((line) => line.trim().toUpperCase())
          .filter((line) => line.length > 0);
        const merged = existing.concat(tlsPingSelection.value.filter((hash) => !existing.includes(hash)));
        pinnedCertificatesText.value = merged.join('\n');
        tlsPingModal.value?.close();
      };

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
        allowInsecureSupported,
        echForceQueryOptions: XrayOptions.echForceQueryOptions,
        echServerName,
        generatedEchConfigList,
        generate_ech_keys,
        tlsPingModal,
        tlsPingResult,
        tlsPingSelection,
        tlsPingCertificates,
        tlsPingSupported,
        tlsPingTarget,
        probedIp,
        isPinned,
        caPinAllowed,
        hasServerName,
        hasCaCertificates,
        fetch_fingerprints,
        apply_fingerprints
      };
    }
  });
</script>

<style scoped lang="scss">
  .tlsping-note {
    color: #fc0;
    vertical-align: middle;
  }

  .tlsping-modal {
    text-align: left;

    p {
      text-align: left;
    }

    .tlsping-warning {
      color: #fc0;
      border-left: 3px solid #fc0;
      padding-left: 8px;
      margin: 0 0 10px 0;
    }

    .tlsping-muted {
      color: #a9b1b3;
      font-weight: normal;
    }

    .tlsping-reason {
      display: block;
      color: #a9b1b3;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      margin-top: 3px;
    }

    .tlsping-table {
      th {
        width: 200px;
      }

      td {
        vertical-align: middle;
      }
    }

    .tlsping-hash {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      letter-spacing: 0.3px;
      word-break: break-all;
      vertical-align: middle;
    }

    label.tlsping-hash {
      cursor: pointer;
      margin-left: 4px;
    }

    .tlsping-disabled {
      opacity: 0.45;

      label {
        cursor: default;
      }
    }

    .tlsping-pinned {
      color: #7fbf7f;
      margin-left: 8px;
      white-space: nowrap;
    }
  }
</style>
