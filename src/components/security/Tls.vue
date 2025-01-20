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
        <tr v-if="engine.mode === 'client'">
          <th>Server Name
            <hint>
              Specifies the domain of the server-side certificate, useful when connecting only via IP addresses.
              <br />
              When the target is specified by domains, like when the domain is received by `SOCKS` inbounds or detected
              via sniffing, the extracted domain will automatically be used as `serverName`, without any need for manual
              configuration.
            </hint>
          </th>
          <td>
            <input v-model="transport.tlsSettings.serverName" type="text" class="input_20_table" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr v-if="engine.mode === 'client'">
          <th>Whether to allow insecure connections
            <hint>
              Whether to allow insecure connections (client-only). Defaults to `false`.
              <br />
              When `true`, Xray will not verify the validity of the TLS certificate provided by the outbound.
              <blockquote>
                **Danger**:
                This should not be set to `true` in deployments for security reaons, or it can be susceptible to
                man-in-the-middle attacks.
              </blockquote>
            </hint>
          </th>
          <td>
            <input v-model="transport.tlsSettings.allowInsecure" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr v-if="engine.mode === 'server'">
          <th>Reject unkown SNI
            <hint>
              When `true`, the server rejects `TLS` handshakes if the SNI received does not match domains specified in
              the
              certificate. The default value is `false`.
            </hint>
          </th>
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
        <tr v-if="engine.mode === 'client'">
          <th>Session Resumption</th>
          <td>
            <input v-model="transport.tlsSettings.enableSessionResumption" type="checkbox" class="input" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr>
          <th>ALPN
            <hint>
              An array of strings specifying the ALPN values used in TLS handshakes. Defaults to ["h2", "http/1.1"].
              <br />
              Application-Layer Protocol Negotiation (ALPN) is a TLS extension that allows the application to negotiate
              which protocol should be performed over a secure connection in a manner that is more efficient than
              sending multiple requests over the same connection.
            </hint>
          </th>
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
          <th>TLS Version
            <hint>
              Specifies the `minimum` and `maximum` version of the TLS protocol.
            </hint>
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
        <tr v-if="engine.mode === 'client'">
          <th>Fingerprint
            <hint>
              Specifies the fingerprint of the TLS Client Hello message. When empty, fingerprint simulation will not be
              enabled.
              When enabled, Xray will simulate the TLS fingerprint through the uTLS library or have it generated
              randomly.
              <ul>
                <li>`random`: randomly select one of the up-to-date browsers</li>
                <li>`randomized`: generate a completely random and unique fingerprint (100% compatible with TLS 1.3
                  using
                  `X25519`)
                </li>
              </ul>
            </hint>
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
        <tr v-if="engine.mode === 'server'">
          <th>TLS Certificate
            <hint>
              A list of certificates, each representing a single certificate (fullchain recommended).
            </hint>
          </th>
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
import Hint from "@/components/Hint.vue";

export default defineComponent({
  name: "Tls",
  components: {
    CertificatesModal,
    Hint,
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
      window.showLoading(delay);
      await engine.submit(SubmtActions.regenerateSslCertificates, null, delay);
      const result = await engine.getSslCertificates();
      if (result && this.transport.tlsSettings) {
        this.transport.tlsSettings.certificates = [];
        let cert = new XrayStreamTlsCertificateObject();
        cert.certificateFile = result.certificateFile;
        cert.keyFile = result.keyFile;
        this.transport.tlsSettings.certificates.push(cert);
      }
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
      engine,
      fingerprints: XrayOptions.fingerprintOptions,
      usageOptions: XrayStreamTlsCertificateObject.usageOptions,
      tlsVersions: XrayOptions.tlsVersionsOptions,
      alpnOptions: XrayOptions.alpnOptions,
    };
  },
});
</script>
<style scoped></style>
