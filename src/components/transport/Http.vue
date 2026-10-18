<template>
  <tbody v-if="transport.xhttpSettings">
    <tr>
      <th>CDN Host / Virtual Host</th>
      <td>
        <input type="text" class="input_20_table" v-model="transport.xhttpSettings.host" />
      </td>
    </tr>
    <tr>
      <th>Transfer Mode</th>
      <td>
        <select class="input_option" v-model="transport.xhttpSettings.mode">
          <option v-for="opt in modes" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
        <span class="hint-color">default: auto</span>
      </td>
    </tr>
    <tr>
      <th>Request Path</th>
      <td>
        <input type="text" class="input_20_table" v-model="transport.xhttpSettings.path" />
      </td>
    </tr>
    <tr>
      <th>Header-padding bytes (range)</th>
      <td>
        <input type="text" placeholder="100-1000" class="input_20_table" v-model="extra.xPaddingBytes" />
      </td>
    </tr>
    <headers-mapping v-if="transport.xhttpSettings" :headersMap="extra.headers" @on:header:update="onheaderapupdate" />
    <tr class="unlocked">
      <th>Disable gRPC disguise</th>
      <td><input type="checkbox" v-model="extra.noGRPCHeader" /></td>
    </tr>

    <tr>
      <th>Disable SSE disguise</th>
      <td><input type="checkbox" v-model="extra.noSSEHeader" /></td>
    </tr>
  </tbody>
  <tbody class="unlocked" v-if="transport.xhttpSettings">
    <tr>
      <th>
        {{ $t('com.Xhttp.modal_anti_detection') }}
        <hint v-html="$t('com.Xhttp.hint_anti_detection')"></hint>
      </th>
      <td>
        <span class="row-buttons">
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click="antiDetectionModal.show()" />
        </span>
        <modal ref="antiDetectionModal" :title="$t('com.Xhttp.modal_anti_detection')" width="800">
          <table width="100%" class="FormTable modal-form-table">
            <xhttp-padding :settings="extra" />
            <tbody>
              <tr>
                <th>
                  {{ $t('com.Xhttp.label_uplinkHTTPMethod') }}
                  <hint v-html="$t('com.Xhttp.hint_uplinkHTTPMethod')"></hint>
                </th>
                <td>
                  <select class="input_option" v-model="extra.uplinkHTTPMethod">
                    <option v-for="opt in uplinkMethods" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <span class="hint-color">default: POST</span>
                </td>
              </tr>
            </tbody>
            <tbody>
              <tr>
                <th>
                  {{ $t('com.Xhttp.label_sessionPlacement') }}
                  <hint v-html="$t('com.Xhttp.hint_sessionPlacement')"></hint>
                </th>
                <td>
                  <select class="input_option" v-model="extra.sessionIDPlacement">
                    <option v-for="opt in sessionPlacements" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <span class="hint-color">default: path</span>
                </td>
              </tr>
              <tr v-if="extra.sessionIDPlacement && extra.sessionIDPlacement !== 'path'">
                <th>
                  {{ $t('com.Xhttp.label_sessionKey') }}
                  <hint v-html="$t('com.Xhttp.hint_sessionKey')"></hint>
                </th>
                <td>
                  <input type="text" class="input_20_table" v-model="extra.sessionIDKey" placeholder="auto" />
                </td>
              </tr>
              <tr>
                <th>
                  {{ $t('com.Xhttp.label_seqPlacement') }}
                  <hint v-html="$t('com.Xhttp.hint_seqPlacement')"></hint>
                </th>
                <td>
                  <select class="input_option" v-model="extra.seqPlacement">
                    <option v-for="opt in sessionPlacements" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <span class="hint-color">default: path</span>
                </td>
              </tr>
              <tr v-if="extra.seqPlacement && extra.seqPlacement !== 'path'">
                <th>
                  {{ $t('com.Xhttp.label_seqKey') }}
                  <hint v-html="$t('com.Xhttp.hint_seqKey')"></hint>
                </th>
                <td>
                  <input type="text" class="input_20_table" v-model="extra.seqKey" placeholder="auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </modal>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.Xhttp.modal_performance') }}
        <hint v-html="$t('com.Xhttp.hint_performance')"></hint>
      </th>
      <td>
        <span class="row-buttons">
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click="performanceModal.show()" />
        </span>
        <modal ref="performanceModal" :title="$t('com.Xhttp.modal_performance')" width="800">
          <table width="100%" class="FormTable modal-form-table">
            <tbody>
              <tr>
                <th>Max POST size (bytes)</th>
                <td>
                  <input type="text" class="input_20_table" v-model="extra.scMaxEachPostBytes" />
                </td>
              </tr>
              <tr>
                <th>Min interval between POSTs (ms)</th>
                <td>
                  <input type="text" class="input_20_table" v-model="extra.scMinPostsIntervalMs" />
                </td>
              </tr>
              <tr>
                <th>Max buffered POSTs (server)</th>
                <td>
                  <input type="number" min="1" class="input_20_table" v-model.number="extra.scMaxBufferedPosts" />
                </td>
              </tr>
              <tr>
                <th>Keep-alive interval for stream-up (s)</th>
                <td>
                  <input type="text" placeholder="20-80" class="input_20_table" v-model="extra.scStreamUpServerSecs" />
                </td>
              </tr>
            </tbody>
            <tbody>
              <tr>
                <th>
                  {{ $t('com.Xhttp.label_uplinkDataPlacement') }}
                  <hint v-html="$t('com.Xhttp.hint_uplinkDataPlacement')"></hint>
                </th>
                <td>
                  <select class="input_option" v-model="extra.uplinkDataPlacement">
                    <option v-for="opt in uplinkDataPlacements" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <span class="hint-color">default: auto</span>
                </td>
              </tr>
              <tr v-if="extra.uplinkDataPlacement && extra.uplinkDataPlacement !== 'body'">
                <th>
                  {{ $t('com.Xhttp.label_uplinkDataKey') }}
                  <hint v-html="$t('com.Xhttp.hint_uplinkDataKey')"></hint>
                </th>
                <td>
                  <input type="text" class="input_20_table" v-model="extra.uplinkDataKey" placeholder="auto" />
                </td>
              </tr>
              <tr v-if="extra.uplinkDataPlacement && extra.uplinkDataPlacement !== 'body'">
                <th>
                  {{ $t('com.Xhttp.label_uplinkChunkSize') }}
                  <hint v-html="$t('com.Xhttp.hint_uplinkChunkSize')"></hint>
                </th>
                <td>
                  <input type="text" class="input_20_table" v-model="extra.uplinkChunkSize" placeholder="auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </modal>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.Xhttp.modal_xmux') }}
        <hint v-html="$t('com.Xhttp.hint_xmux')"></hint>
      </th>
      <td>
        <span class="row-buttons">
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click="xmuxModal.show()" />
        </span>
        <modal ref="xmuxModal" :title="$t('com.Xhttp.modal_xmux')" width="800">
          <table width="100%" class="FormTable modal-form-table">
            <tbody>
              <tr>
                <th>Max concurrent streams</th>
                <td>
                  <input type="text" placeholder="16-32" class="input_20_table" v-model="xmux.maxConcurrency" />
                </td>
              </tr>
              <tr>
                <th>Max base connections</th>
                <td>
                  <input type="number" min="0" class="input_20_table" v-model.number="xmux.maxConnections" />
                </td>
              </tr>
              <tr>
                <th>Max reuses per connection</th>
                <td>
                  <input type="number" min="0" class="input_20_table" v-model.number="xmux.cMaxReuseTimes" />
                </td>
              </tr>
              <tr>
                <th>Max HTTP requests per connection</th>
                <td>
                  <input type="text" placeholder="600-900" class="input_20_table" v-model="xmux.hMaxRequestTimes" />
                </td>
              </tr>
              <tr>
                <th>Max connection age (s)</th>
                <td>
                  <input type="text" placeholder="1800-3000" class="input_20_table" v-model="xmux.hMaxReusableSecs" />
                </td>
              </tr>
              <tr>
                <th>Keep-alive period (s)</th>
                <td>
                  <input type="number" min="-1" class="input_20_table" v-model.number="xmux.hKeepAlivePeriod" />
                </td>
              </tr>
            </tbody>
          </table>
        </modal>
      </td>
    </tr>
  </tbody>
  <tbody class="unlocked" v-if="proxyType === 'outbound'">
    <tr>
      <th>
        {{ $t('com.DownloadSettings.label_uplink_downlink') }}
        <hint v-html="$t('com.DownloadSettings.hint_uplink_downlink')"></hint>
      </th>
      <td>
        <span class="row-buttons">
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click="manage_download_settings" />
        </span>
        <modal ref="downloadSettingsModal" :title="$t('com.DownloadSettings.modal_title')" width="800">
          <download-settings v-if="extra.downloadSettings" :downloadSettings="extra.downloadSettings" />
        </modal>
      </td>
    </tr>
  </tbody>
</template>
<script lang="ts">
  import { computed, defineComponent, ref } from 'vue';
  import { XrayStreamSettingsObject, XrayXmuxObject } from '@/modules/CommonObjects';
  import { XrayOptions } from '@/modules/Options';
  import HeadersMapping from './HeadersMapping.vue';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import DownloadSettings from './DownloadSettings.vue';
  import XhttpPadding from './XhttpPadding.vue';
  import { XrayStreamHttpSettingsObject, XrayXhttpExtraObject, createXhttpDownloadSettings } from '@/modules/TransportObjects';

  export default defineComponent({
    name: 'Http',
    components: {
      HeadersMapping,
      Modal,
      Hint,
      DownloadSettings,
      XhttpPadding
    },
    props: {
      transport: XrayStreamSettingsObject,
      proxyType: String
    },
    setup(props) {
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
      const antiDetectionModal = ref();
      const performanceModal = ref();
      const xmuxModal = ref();
      const downloadSettingsModal = ref();
      const extra = computed(() => transport.value.xhttpSettings!.extra ?? (transport.value.xhttpSettings!.extra = new XrayXhttpExtraObject()));
      const xmux = computed(() => extra.value.xmux ?? (extra.value.xmux = new XrayXmuxObject()));

      const onheaderapupdate = (headers: any) => {
        extra.value.headers = headers;
      };

      const manage_download_settings = () => {
        // Initialize downloadSettings if it doesn't exist
        if (!extra.value.downloadSettings) {
          extra.value.downloadSettings = createXhttpDownloadSettings(transport.value.xhttpSettings!);
        }
        downloadSettingsModal.value.show();
      };

      return {
        transport,
        modes: XrayStreamHttpSettingsObject.modes,
        methods: XrayOptions.httpMethods,
        sessionPlacements: XrayOptions.xhttpSessionPlacements,
        uplinkDataPlacements: XrayOptions.xhttpUplinkDataPlacements,
        uplinkMethods: ['POST', 'PUT', 'PATCH', 'GET', 'HEAD'],
        extra,
        xmux,
        antiDetectionModal,
        performanceModal,
        xmuxModal,
        downloadSettingsModal,
        onheaderapupdate,
        manage_download_settings
      };
    }
  });
</script>
