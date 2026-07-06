<template>
  <modal ref="importModal" :title="$t('com.ImportConfigModal.modal_title')" width="700">
    <div class="formfontdesc">
      <p v-html="$t('com.ImportConfigModal.modal_desc')"></p>

      <table class="FormTable modal-form-table">
        <tbody>
          <tr>
            <th>{{ $t('com.ImportConfigModal.label_import_type') }}</th>
            <td>
              <select v-model="state.importType" class="input_option">
                <option value="qr">{{ $t('com.ImportConfigModal.opt_qr') }}</option>
                <option value="url">{{ $t('com.ImportConfigModal.opt_url') }}</option>
                <option value="json">{{ $t('com.ImportConfigModal.opt_json') }}</option>
                <option value="file">{{ $t('com.ImportConfigModal.opt_file') }}</option>
              </select>
            </td>
          </tr>

          <tr v-if="isQr">
            <th>
              {{ $t('com.ImportConfigModal.label_qr_code') }}
              <hint v-html="$t('com.ImportConfigModal.hint_qr_code')"></hint>
            </th>
            <td>
              <input type="file" accept="image/*" @change="onQrFile" />
            </td>
          </tr>

          <tr v-if="isUrl">
            <th>
              {{ $t('com.ImportConfigModal.label_proxy_uri') }}
              <hint v-html="$t('com.ImportConfigModal.hint_proxy_uri')"></hint>
            </th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="state.protocol.url" rows="25"></textarea>
              </div>
            </td>
          </tr>

          <tr v-if="isJson">
            <th>
              {{ $t('com.ImportConfigModal.label_proxy_json') }}
              <hint v-html="$t('com.ImportConfigModal.hint_proxy_json')"></hint>
            </th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="state.protocol.json" rows="25"></textarea>
              </div>
            </td>
          </tr>
          <tr v-if="isFile">
            <th>
              {{ $t('com.ImportConfigModal.label_proxy_file') }}
              <hint v-html="$t('com.ImportConfigModal.hint_proxy_file')"></hint>
            </th>
            <td>
              <input type="file" accept="application/json" @change="onJsonFile" />
            </td>
          </tr>
          <tr v-if="!isFile">
            <th>
              {{ $t('com.ImportConfigModal.label_import_mode') }}
              <hint v-html="$t('com.ImportConfigModal.hint_import_mode')"></hint>
            </th>
            <td>
              <select v-model="state.importMode" class="input_option">
                <option value="add">{{ $t('com.ImportConfigModal.opt_mode_add') }}</option>
                <option value="replace" v-if="replaceableOutbounds.length">{{ $t('com.ImportConfigModal.opt_mode_replace') }}</option>
                <option value="complete">{{ $t('com.ImportConfigModal.opt_mode_complete') }}</option>
              </select>
            </td>
          </tr>
          <tr v-if="isReplace && !isFile">
            <th>
              {{ $t('com.ImportConfigModal.label_replace_target') }}
              <hint v-html="$t('com.ImportConfigModal.hint_replace_target')"></hint>
            </th>
            <td>
              <select v-model="state.replaceTag" class="input_option">
                <option v-for="outbound in replaceableOutbounds" :key="outbound.tag" :value="outbound.tag">{{ outbound.tag }} ({{ outbound.protocol }})</option>
              </select>
            </td>
          </tr>
        </tbody>

        <tbody v-show="isComplete && !isFile">
          <tr>
            <th>
              {{ $t('com.ImportConfigModal.label_routing_mode') }}
              <hint v-html="$t('com.ImportConfigModal.hint_routing_mode')"></hint>
            </th>
            <td>
              <div class="radio-group">
                <div>
                  <input type="radio" v-model="state.routingMode" value="basic" id="routing-basic" />
                  <label for="routing-basic">{{ $t('com.ImportConfigModal.opt_routing_basic') }}</label>
                </div>
                <div>
                  <input type="radio" v-model="state.routingMode" value="none" id="routing-none" />
                  <label for="routing-none">{{ $t('com.ImportConfigModal.opt_routing_none') }}</label>
                </div>
                <div>
                  <input type="radio" v-model="state.routingMode" value="keep" id="routing-keep" />
                  <label for="routing-keep">{{ $t('com.ImportConfigModal.opt_routing_keep') }}</label>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.import')" @click.prevent="onImport" v-show="state.importType" />
    </template>
  </modal>
</template>
<script lang="ts">
  import { defineComponent, ref, reactive, computed, watch } from 'vue';
  import engine from '@/modules/Engine';
  import Modal from '@main/Modal.vue';
  import jsQR from 'jsqr';
  import { XrayObject } from '@/modules/XrayConfig';
  import ProxyParser from '@/modules/parsers/ProxyParser';
  import parseJsonOutbound from '@/modules/parsers/JsonOutboundParser';
  import Hint from '@main/Hint.vue';
  import { plainToInstance } from 'class-transformer';
  import { XrayDnsObject, XrayLogObject, XrayRoutingObject, XraySniffingObject, XraySockoptObject } from '@/modules/CommonObjects';
  import { XrayDokodemoDoorInboundObject, XrayInboundObject } from '@/modules/InboundObjects';
  import { XrayBlackholeOutboundObject, XrayFreedomOutboundObject, XrayOutboundObject } from '@/modules/OutboundObjects';
  import { XrayProtocol } from '@/modules/Options';
  import { IProtocolType } from '@/modules/Interfaces';
  import { useI18n } from 'vue-i18n';

  type ImportType = 'qr' | 'url' | 'json' | 'file';
  type ImportMode = 'add' | 'replace' | 'complete';

  export default defineComponent({
    name: 'ImportConfigModal',
    components: { Modal, Hint },
    props: {
      config: {
        type: Object as () => XrayObject,
        required: true
      }
    },
    emits: ['update:config'],
    setup(props, { emit }) {
      const { t } = useI18n();
      const importModal = ref();
      const state = reactive({
        importType: '' as ImportType | '',
        protocol: {
          url: '' as string,
          json: '' as string,
          file: '' as string
        },
        importMode: 'add' as ImportMode,
        replaceTag: '' as string,
        routingMode: 'basic' as 'basic' | 'none' | 'keep'
      });

      const isQr = computed(() => state.importType === 'qr');
      const isUrl = computed(() => state.importType === 'url');
      const isJson = computed(() => state.importType === 'json');
      const isFile = computed(() => state.importType === 'file');
      const isReplace = computed(() => state.importMode === 'replace');
      const isComplete = computed(() => state.importMode === 'complete');

      const replaceableOutbounds = computed(() =>
        props.config.outbounds.filter((o) => o.tag && ![XrayProtocol.FREEDOM, XrayProtocol.BLACKHOLE].includes(o.protocol))
      );

      watch(
        () => state.importMode,
        (mode) => {
          if (mode === 'replace' && !state.replaceTag) {
            state.replaceTag = replaceableOutbounds.value[0]?.tag ?? '';
          }
        }
      );

      const show = () => importModal.value.show();

      const onJsonFile = async (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target) state.protocol.file = ev.target.result as string;
        };
        reader.readAsText(file);
      };

      const onQrFile = async (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const data = await decodeQRCode(file);
        if (data) state.protocol.url = data;
      };

      const decodeQRCode = async (imageFile: File) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const image = new Image();
        image.src = URL.createObjectURL(imageFile);
        await new Promise((resolve) => (image.onload = resolve as any));
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
        if (!code) {
          alert(t('com.ImportConfigModal.alert_qr_decode_error'));

          return;
        }
        return code.data;
      };

      const rebuildConfig = (primaryOutbound: XrayOutboundObject<IProtocolType>) => {
        const cfg = props.config;
        cfg.inbounds = [];
        cfg.outbounds = [];
        cfg.log = new XrayLogObject().normalize();
        cfg.dns = new XrayDnsObject().default().normalize();

        const in_doko = new XrayInboundObject<XrayDokodemoDoorInboundObject>();
        in_doko.tag = 'all-in';
        in_doko.settings = new XrayDokodemoDoorInboundObject();
        in_doko.protocol = XrayProtocol.DOKODEMODOOR;
        in_doko.port = 5599;
        in_doko.listen = '127.0.0.1';
        in_doko.settings.network = 'tcp,udp';
        if (in_doko.streamSettings) {
          in_doko.streamSettings.sockopt = new XraySockoptObject();
          in_doko.streamSettings.sockopt.tproxy = 'tproxy';
        }
        in_doko.settings.followRedirect = true;
        in_doko.sniffing = new XraySniffingObject();
        in_doko.sniffing.enabled = true;
        in_doko.sniffing.destOverride = ['http', 'tls', 'quic'];
        cfg.inbounds.push(in_doko);

        cfg.outbounds.push(primaryOutbound);

        const freedomExists = cfg.outbounds.some((o) => o.protocol === XrayProtocol.FREEDOM);
        if (!freedomExists) {
          const out_free = new XrayOutboundObject<XrayFreedomOutboundObject>();
          out_free.tag = 'direct';
          out_free.settings = new XrayFreedomOutboundObject();
          out_free.protocol = XrayProtocol.FREEDOM;
          cfg.outbounds.splice(0, 0, out_free);
        }

        const blackholeExists = cfg.outbounds.some((o) => o.protocol === XrayProtocol.BLACKHOLE);
        if (!blackholeExists) {
          const out_block = new XrayOutboundObject<XrayBlackholeOutboundObject>();
          out_block.tag = 'block';
          out_block.settings = new XrayBlackholeOutboundObject();
          out_block.protocol = XrayProtocol.BLACKHOLE;
          cfg.outbounds.push(out_block);
        }

        const proxyTag = cfg.outbounds.find((o) => o.tag && o.protocol != XrayProtocol.FREEDOM && o.protocol != XrayProtocol.BLACKHOLE)?.tag ?? 'proxy';

        if (state.routingMode === 'basic') {
          cfg.routing = new XrayRoutingObject().basicBypass(proxyTag).normalize();
        } else if (state.routingMode === 'none') {
          cfg.routing = new XrayRoutingObject().normalize();
        }
      };

      const replaceOutbound = (primaryOutbound: XrayOutboundObject<IProtocolType>): boolean => {
        const index = props.config.outbounds.findIndex((o) => o.tag === state.replaceTag);
        if (index < 0) {
          alert(t('com.ImportConfigModal.alert_replace_target_missing'));
          return false;
        }
        primaryOutbound.tag = state.replaceTag;
        props.config.outbounds.splice(index, 1, primaryOutbound);
        return true;
      };

      const addOutbound = (primaryOutbound: XrayOutboundObject<IProtocolType>) => {
        const baseTag = primaryOutbound.tag ?? `out-${primaryOutbound.protocol.toLowerCase()}`;
        let tag = baseTag;
        let suffix = 1;
        while (props.config.outbounds.some((o) => o.tag === tag)) {
          tag = `${baseTag}-${suffix++}`;
        }
        primaryOutbound.tag = tag;
        props.config.outbounds.push(primaryOutbound);
      };

      const onImport = async () => {
        if (!props.config) {
          alert(t('com.ImportConfigModal.alert_not_supported_protocol'));
          return;
        }

        if (isComplete.value && !isFile.value) {
          const proceed = confirm(t('com.ImportConfigModal.alert_complete_setup'));
          if (!proceed) return;
        }

        if (isFile.value) {
          let jsonConfig: XrayObject | undefined;
          try {
            jsonConfig = plainToInstance(XrayObject, JSON.parse(state.protocol.file));
          } catch (e) {
            alert(t('com.ImportConfigModal.alert_invalid_json'));
            console.error('Failed to parse JSON:', e);
            return;
          }
          await engine.loadXrayConfig(jsonConfig);
          importModal.value.close();
          alert(t('com.ImportConfigModal.alert_import_success'));
          return;
        }

        let primaryOutbound: XrayOutboundObject<IProtocolType> | null = null;

        if (isUrl.value || isQr.value) {
          try {
            const parser = new ProxyParser(state.protocol.url);
            primaryOutbound = parser.getOutbound();
          } catch (e) {
            alert(t('com.ImportConfigModal.alert_not_supported_protocol'));
            console.error(e);
            return;
          }
        } else if (isJson.value) {
          let jsonConfig: XrayObject | undefined;
          try {
            jsonConfig = plainToInstance(XrayObject, JSON.parse(state.protocol.json));
          } catch (e) {
            alert(t('com.ImportConfigModal.alert_invalid_json'));
            console.error('Failed to parse JSON:', e);
            return;
          }
          if (!jsonConfig?.outbounds || jsonConfig.outbounds.length === 0) {
            alert(t('com.ImportConfigModal.alert_invalid_json'));
            return;
          }
          const first = jsonConfig.outbounds.find((o) => ![XrayProtocol.FREEDOM, XrayProtocol.BLACKHOLE].includes(o.protocol));
          if (!first) {
            alert(t('com.ImportConfigModal.alert_not_supported_protocol'));
            return;
          }
          primaryOutbound = parseJsonOutbound(first);
        }

        if (!primaryOutbound) {
          alert(t('com.ImportConfigModal.alert_not_supported_protocol'));
          return;
        }

        if (isComplete.value) {
          rebuildConfig(primaryOutbound);
        } else if (isReplace.value) {
          if (!replaceOutbound(primaryOutbound)) return;
        } else {
          addOutbound(primaryOutbound);
        }

        emit('update:config', props.config);
        importModal.value.close();
        alert(t('com.ImportConfigModal.alert_import_success'));
      };

      return {
        importModal,
        state,
        isQr,
        isUrl,
        isJson,
        isFile,
        isReplace,
        isComplete,
        replaceableOutbounds,
        show,
        onImport,
        onQrFile,
        onJsonFile
      };
    }
  });
</script>
