<template>
  <div class="formfontdesc">
    <p>{{ $t('com.DownloadSettings.modal_desc') }}</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t('com.DownloadSettings.modal_title') }}</td>
        </tr>
      </thead>
      <tbody v-if="downloadSettings">
        <tr>
          <th>
            {{ $t('com.DownloadSettings.label_address') }}
            <hint v-html="$t('com.DownloadSettings.hint_address')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="downloadSettings.address" placeholder="example.com or IP" />
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.DownloadSettings.label_port') }}
            <hint v-html="$t('com.DownloadSettings.hint_port')"></hint>
          </th>
          <td>
            <input type="number" min="1" max="65535" class="input_20_table" v-model.number="downloadSettings.port" placeholder="443" />
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.DownloadSettings.label_security') }}
            <hint v-html="$t('com.DownloadSettings.hint_security')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="downloadSettings.security">
              <option value="tls">TLS</option>
              <option value="reality">Reality</option>
            </select>
            <span class="row-buttons">
              <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click="manage_security" />
            </span>
            <modal ref="securityModal" :title="$t('com.DownloadSettings.security_title')">
              <component :is="securityComponent" :transport="downloadTransport" proxyType="outbound" />
            </modal>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.DownloadSettings.label_xhttp') }}
            <hint v-html="$t('com.DownloadSettings.hint_xhttp')"></hint>
          </th>
          <td>
            <span class="row-buttons">
              <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click="manage_xhttp" />
            </span>
            <modal ref="xhttpModal" :title="$t('com.DownloadSettings.xhttp_title')">
              <table width="100%" class="FormTable modal-form-table">
                <tbody v-if="downloadSettings.xhttpSettings">
                  <tr>
                    <th>{{ $t('com.DownloadSettings.label_path') }}</th>
                    <td>
                      <input type="text" class="input_20_table" v-model="downloadSettings.xhttpSettings.path" />
                      <span class="hint-color">{{ $t('com.DownloadSettings.hint_path') }}</span>
                    </td>
                  </tr>
                  <tr>
                    <th>{{ $t('com.DownloadSettings.label_host') }}</th>
                    <td>
                      <input type="text" class="input_20_table" v-model="downloadSettings.xhttpSettings.host" />
                    </td>
                  </tr>
                  <tr>
                    <th>{{ $t('com.DownloadSettings.label_mode') }}</th>
                    <td>
                      <select class="input_option" v-model="downloadSettings.xhttpSettings.mode">
                        <option v-for="opt in modes" :key="opt" :value="opt">{{ opt }}</option>
                      </select>
                      <span class="hint-color">default: auto</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </modal>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.DownloadSettings.label_sockopt') }}
            <hint v-html="$t('com.DownloadSettings.hint_sockopt')"></hint>
          </th>
          <td>
            <span class="row-buttons">
              <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click="manage_sockopt" />
            </span>
            <modal ref="sockoptModal" :title="$t('com.DownloadSettings.sockopt_title')">
              <sockopt :transport="downloadTransport"></sockopt>
            </modal>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, watch } from 'vue';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import Sockopt from './Sockopt.vue';
  import SecurityTls from '../security/Tls.vue';
  import SecurityReality from '../security/Reality.vue';
  import { XrayDownloadSettingsObject, XrayStreamHttpSettingsObject } from '@/modules/TransportObjects';
  import { XrayStreamSettingsObject, XrayStreamTlsSettingsObject, XrayStreamRealitySettingsObject } from '@/modules/CommonObjects';

  export default defineComponent({
    name: 'DownloadSettings',
    components: {
      Modal,
      Hint,
      Sockopt
    },
    props: {
      downloadSettings: {
        type: Object as () => XrayDownloadSettingsObject,
        required: true
      }
    },
    setup(props) {
      const securityModal = ref();
      const xhttpModal = ref();
      const sockoptModal = ref();

      if (!props.downloadSettings.xhttpSettings) {
        props.downloadSettings.xhttpSettings = new XrayStreamHttpSettingsObject();
      }

      props.downloadSettings.network = 'xhttp';

      if (!props.downloadSettings.security) {
        props.downloadSettings.security = 'tls';
      }

      const downloadTransport = ref(new XrayStreamSettingsObject());
      downloadTransport.value.security = props.downloadSettings.security;
      downloadTransport.value.tlsSettings = props.downloadSettings.tlsSettings;
      downloadTransport.value.realitySettings = props.downloadSettings.realitySettings;
      downloadTransport.value.sockopt = props.downloadSettings.sockopt;

      watch(
        () => downloadTransport.value.security,
        (newSecurity) => {
          props.downloadSettings.security = newSecurity;
        }
      );

      watch(
        () => downloadTransport.value.tlsSettings,
        (newTlsSettings) => {
          props.downloadSettings.tlsSettings = newTlsSettings;
        },
        { deep: true }
      );

      watch(
        () => downloadTransport.value.realitySettings,
        (newRealitySettings) => {
          props.downloadSettings.realitySettings = newRealitySettings;
        },
        { deep: true }
      );

      watch(
        () => downloadTransport.value.sockopt,
        (newSockopt) => {
          props.downloadSettings.sockopt = newSockopt;
        },
        { deep: true }
      );

      const securityComponent = computed(() => {
        switch (props.downloadSettings.security) {
          case 'tls':
            if (!props.downloadSettings.tlsSettings) {
              props.downloadSettings.tlsSettings = new XrayStreamTlsSettingsObject();
            }
            return SecurityTls;
          case 'reality':
            if (!props.downloadSettings.realitySettings) {
              props.downloadSettings.realitySettings = new XrayStreamRealitySettingsObject();
            }
            return SecurityReality;
          default:
            return null;
        }
      });

      const manage_security = () => {
        securityModal.value.show();
      };

      const manage_xhttp = () => {
        xhttpModal.value.show();
      };

      const manage_sockopt = () => {
        sockoptModal.value.show();
      };

      return {
        securityModal,
        xhttpModal,
        sockoptModal,
        downloadTransport,
        securityComponent,
        modes: XrayStreamHttpSettingsObject.modes,
        manage_security,
        manage_xhttp,
        manage_sockopt
      };
    }
  });
</script>

<style scoped>
  .textarea-wrapper {
    width: 100%;
  }
  .textarea-wrapper textarea {
    width: 100%;
    min-height: 100px;
  }
</style>
