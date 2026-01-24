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
              {{ $t('com.ImportConfigModal.label_complete_setup') }}
              <hint v-html="$t('com.ImportConfigModal.hint_complete_setup')"></hint>
            </th>
            <td>
              <input type="checkbox" v-model="state.completeSetup" />
            </td>
          </tr>
        </tbody>

        <tbody v-show="state.completeSetup && !isFile">
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
  import { defineComponent, ref, reactive, computed } from 'vue';
  import engine from '@/modules/Engine';
  import Modal from '@main/Modal.vue';
  import jsQR from 'jsqr';
  import { XrayObject } from '@/modules/XrayConfig';
  import ProxyParser from '@/modules/parsers/ProxyParser';
  import Hint from '@main/Hint.vue';
  import { plainToInstance } from 'class-transformer';
  import { XrayDnsObject, XrayLogObject, XrayRoutingObject, XraySniffingObject, XraySockoptObject } from '@/modules/CommonObjects';
  import { XrayDokodemoDoorInboundObject, XrayInboundObject } from '@/modules/InboundObjects';
  import {
    XrayBlackholeOutboundObject,
    XrayFreedomOutboundObject,
    XrayHttpOutboundObject,
    XrayLoopbackOutboundObject,
    XrayOutboundObject,
    XrayShadowsocksOutboundObject,
    XraySocksOutboundObject,
    XrayTrojanOutboundObject,
    XrayVlessOutboundObject,
    XrayVmessOutboundObject,
    XrayWireguardOutboundObject
  } from '@/modules/OutboundObjects';
  import { XrayProtocol } from '@/modules/Options';
  import { IProtocolType } from '@/modules/Interfaces';
  import { useI18n } from 'vue-i18n';

  type ImportType = 'qr' | 'url' | 'json' | 'file';

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
        completeSetup: true,
        routingMode: 'basic' as 'basic' | 'none' | 'keep'
      });

      const isQr = computed(() => state.importType === 'qr');
      const isUrl = computed(() => state.importType === 'url');
      const isJson = computed(() => state.importType === 'json');
      const isFile = computed(() => state.importType === 'file');

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
        // 'keep' mode: don't modify routing at all
      };

      const onImport = async () => {
        if (!props.config) {
          alert(t('com.ImportConfigModal.alert_not_supported_protocol'));
          return;
        }

        if (state.completeSetup && !isFile.value) {
          const proceed = confirm('You selected a complete setup. This will overwrite your current configuration. Are you sure?');
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
          switch (first.protocol) {
            case XrayProtocol.VMESS:
              primaryOutbound = plainToInstance(XrayOutboundObject<XrayVmessOutboundObject>, first);
              break;
            case XrayProtocol.VLESS:
              primaryOutbound = plainToInstance(XrayOutboundObject<XrayVlessOutboundObject>, first, { enableImplicitConversion: true });
              break;
            case XrayProtocol.SHADOWSOCKS:
              primaryOutbound = plainToInstance(XrayOutboundObject<XrayShadowsocksOutboundObject>, first);
              break;
            case XrayProtocol.TROJAN:
              primaryOutbound = plainToInstance(XrayOutboundObject<XrayTrojanOutboundObject>, first);
              break;
            case XrayProtocol.WIREGUARD:
              primaryOutbound = plainToInstance(XrayOutboundObject<XrayWireguardOutboundObject>, first);
              break;
            case XrayProtocol.LOOPBACK:
              primaryOutbound = plainToInstance(XrayOutboundObject<XrayLoopbackOutboundObject>, first);
              break;
            case XrayProtocol.HTTP:
              primaryOutbound = plainToInstance(XrayOutboundObject<XrayHttpOutboundObject>, first, { enableImplicitConversion: true });
              break;
            case XrayProtocol.DNS:
              primaryOutbound = plainToInstance(XrayOutboundObject<XrayFreedomOutboundObject>, first);
              break;
            case XrayProtocol.SOCKS:
              primaryOutbound = plainToInstance(XrayOutboundObject<XraySocksOutboundObject>, first);
              break;
            default:
              break;
          }
          if (primaryOutbound) primaryOutbound.tag = first.tag ?? `out-${first.protocol.toLowerCase()}`;
        }

        if (!primaryOutbound) {
          alert('Failed to build outbound from the provided data');
          return;
        }

        if (state.completeSetup) {
          rebuildConfig(primaryOutbound);
        } else {
          props.config.outbounds.push(primaryOutbound);
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
        show,
        onImport,
        onQrFile,
        onJsonFile
      };
    }
  });
</script>
