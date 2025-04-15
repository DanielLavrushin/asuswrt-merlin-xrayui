<template>
  <modal ref="importModal" :title="$t('com.ImportConfigModal.modal_title')" width="700">
    <div class="formfontdesc">
      <p v-html="$t('com.ImportConfigModal.modal_desc')"></p>
      <table class="FormTable modal-form-table">
        <tbody>
          <tr>
            <th>
              {{ $t('com.ImportConfigModal.label_import_type') }}
            </th>
            <td>
              <select v-model="import_type" class="input_option">
                <option value="qr">{{ $t('com.ImportConfigModal.opt_qr') }}</option>
                <option value="url">{{ $t('com.ImportConfigModal.opt_url') }}</option>
                <option value="json">{{ $t('com.ImportConfigModal.opt_json') }}</option>
                <option value="file">{{ $t('com.ImportConfigModal.opt_file') }}</option>
              </select>
            </td>
          </tr>
          <tr v-if="import_type === 'qr'">
            <th>
              {{ $t('com.ImportConfigModal.label_qr_code') }}
              <hint v-html="$t('com.ImportConfigModal.hint_qr_code')"></hint>
            </th>
            <td>
              <input type="file" accept="image/*" v-on:change="select_qr" />
            </td>
          </tr>
          <tr v-if="import_type === 'url'">
            <th>
              {{ $t('com.ImportConfigModal.label_proxy_uri') }}
              <hint v-html="$t('com.ImportConfigModal.hint_proxy_uri')"></hint>
            </th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="protocolUrl" rows="25"></textarea>
              </div>
            </td>
          </tr>
          <tr v-if="import_type === 'json'">
            <th>
              {{ $t('com.ImportConfigModal.label_proxy_json') }}
              <hint v-html="$t('com.ImportConfigModal.hint_proxy_json')"></hint>
            </th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="protocolJson" rows="25"></textarea>
              </div>
            </td>
          </tr>
          <tr v-if="import_type === 'file'">
            <th>
              {{ $t('com.ImportConfigModal.label_proxy_file') }}
              <hint v-html="$t('com.ImportConfigModal.hint_proxy_file')"></hint>
            </th>
            <td>
              <input type="file" accept="application/json" v-on:change="select_json_file" />
            </td>
          </tr>
          <tr v-show="import_type != 'file'">
            <th>
              {{ $t('com.ImportConfigModal.label_complete_setup') }}
              <hint v-html="$t('com.ImportConfigModal.hint_complete_setup')"></hint>
            </th>
            <td>
              <input type="checkbox" v-model="completeSetup" />
            </td>
          </tr>
        </tbody>
        <tbody v-show="completeSetup && import_type != 'file'">
          <tr>
            <th>
              {{ $t('com.ImportConfigModal.label_unblock') }}
              <hint v-html="$t('com.ImportConfigModal.hint_unblock')"></hint>
            </th>
            <td class="flex-checkbox">
              <div v-for="(opt, index) in unblockItemsList" :key="index">
                <input type="checkbox" v-model="unblockItems" class="input" :value="opt" :id="'destopt-' + index" />
                <label :for="'destopt-' + index" class="settingvalue">{{ opt }}</label>
              </div>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('com.ImportConfigModal.label_dont_break') }}
              <hint v-html="$t('com.ImportConfigModal.hint_dont_break')"></hint>
            </th>
            <td>
              <input type="checkbox" v-model="bypassMode" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.import')" @click.prevent="parse" v-show="import_type" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import engine, { SubmtActions } from '@/modules/Engine';
  import Modal from '@main/Modal.vue';
  import jsQR from 'jsqr';
  import { XrayObject } from '@/modules/XrayConfig';
  import ProxyParser from '@/modules/parsers/ProxyParser';
  import Hint from '@main/Hint.vue';
  import { XrayDnsObject, XrayLogObject, XrayRoutingPolicy, XrayRoutingObject, XraySniffingObject } from '@/modules/CommonObjects';
  import { XrayDokodemoDoorInboundObject, XrayInboundObject } from '@/modules/InboundObjects';
  import { XrayBlackholeOutboundObject, XrayFreedomOutboundObject, XrayHttpOutboundObject, XrayLoopbackOutboundObject, XrayOutboundObject, XrayShadowsocksOutboundObject, XraySocksOutboundObject, XrayTrojanOutboundObject, XrayVlessOutboundObject, XrayVmessOutboundObject, XrayWireguardOutboundObject } from '@/modules/OutboundObjects';
  import { XrayProtocol } from '@/modules/Options';
  import { IProtocolType } from '@/modules/Interfaces';
  import { plainToInstance } from 'class-transformer';

  export default defineComponent({
    name: 'ImportConfigModal',
    components: {
      Modal,
      Hint
    },
    props: {
      config: XrayObject
    },

    setup(props, { emit }) {
      const importModal = ref();
      const import_type = ref<string>();
      const protocolUrl = ref<string>();
      const protocolJson = ref<string>();
      const protocolQr = ref<string>();
      const protocolFile = ref<string>();
      const completeSetup = ref<boolean>(true);
      const bypassMode = ref<boolean>(true);
      const unblockItems = ref<string[]>(['Youtube']);

      const showModal = () => {
        importModal.value.show();
      };

      const select_json_file = async (event: any) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            protocolFile.value = e.target.result as string;
          }
        };
        reader.readAsText(file);
      };

      const select_qr = async (event: any) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            const file = event.target.files[0];
            if (file) decodeQRCode(file).then((data) => (protocolUrl.value = data));
          }
        };
        reader.readAsDataURL(file);
      };

      async function decodeQRCode(imageFile: MediaSource) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const image = new Image();
          image.src = URL.createObjectURL(imageFile);

          await new Promise((resolve) => {
            image.onload = resolve;
          });

          canvas.width = image.width;
          canvas.height = image.height;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });

          if (code) {
            return code.data;
          }
          alert('Failed to decode QR code');
        }
      }

      const show = () => {
        importModal.value.show();
      };

      const set_default_config = (outboundTag: string) => {
        if (props.config) {
          props.config.outbounds = [];
          props.config.inbounds = [];

          props.config.log = new XrayLogObject().normalize();
          props.config.dns = new XrayDnsObject().default().normalize();

          const in_doko = new XrayInboundObject<XrayDokodemoDoorInboundObject>();
          in_doko.tag = 'all-in';
          in_doko.settings = new XrayDokodemoDoorInboundObject();
          in_doko.protocol = XrayProtocol.DOKODEMODOOR;
          in_doko.port = 5599;
          in_doko.settings.network = 'tcp,udp';
          in_doko.settings.followRedirect = true;
          in_doko.sniffing = new XraySniffingObject();
          in_doko.sniffing.enabled = true;
          in_doko.sniffing.destOverride = ['http', 'tls', 'quic'];

          props.config.inbounds.push(in_doko);

          const out_free = new XrayOutboundObject<XrayFreedomOutboundObject>();
          out_free.tag = 'direct';
          out_free.settings = new XrayFreedomOutboundObject();
          out_free.protocol = XrayProtocol.FREEDOM;
          out_free.settings.domainStrategy = 'UseIP';
          props.config.outbounds.push(out_free);

          const out_block = new XrayOutboundObject<XrayBlackholeOutboundObject>();
          out_block.tag = 'block';
          out_block.settings = new XrayBlackholeOutboundObject();
          out_block.protocol = XrayProtocol.BLACKHOLE;
          props.config.outbounds.push(out_block);

          props.config.routing = new XrayRoutingObject().default(outboundTag, unblockItems.value).normalize();
          if (bypassMode.value) {
            props.config.routing.policies = [new XrayRoutingPolicy().default().normalize()!];
          }

          // if (unblockItems.value?.length > 0) {
          //   await engine.executeWithLoadingProgress(async () => {
          //     await engine.submit(SubmtActions.geodataCommunityUpdate);
          //   }, false);
          // }
        }
      };

      const parse = async () => {
        if (completeSetup.value && !confirm('You selected a complete setup. This will overwrite your current configuration. Are you sure?')) {
          return;
        }

        if (props.config) {
          let proxy: XrayOutboundObject<IProtocolType> | null = null;

          if (protocolUrl.value) {
            let parser: ProxyParser;
            try {
              parser = new ProxyParser(protocolUrl.value);
            } catch (e) {
              alert('Failed to parse the proxy URI. Possible reasons: invalid format or unsupported protocol.');
              console.error(e);
              return;
            }
            proxy = parser.getOutbound();
          } else if (protocolJson.value) {
            let jsonConfig;
            try {
              jsonConfig = plainToInstance(XrayObject, JSON.parse(protocolJson.value));
            } catch (e) {
              alert('Invalid JSON format. Please check the structure.');
              console.error('Failed to parse JSON:', e);
              return;
            }

            if (jsonConfig?.outbounds) {
              for (const outbound of jsonConfig.outbounds) {
                switch (outbound.protocol) {
                  case XrayProtocol.VMESS:
                    proxy = plainToInstance(XrayOutboundObject<XrayVmessOutboundObject>, outbound);
                    break;
                  case XrayProtocol.VLESS:
                    proxy = plainToInstance(XrayOutboundObject<XrayVlessOutboundObject>, outbound);
                    break;
                  case XrayProtocol.SHADOWSOCKS:
                    proxy = plainToInstance(XrayOutboundObject<XrayShadowsocksOutboundObject>, outbound);
                    break;
                  case XrayProtocol.TROJAN:
                    proxy = plainToInstance(XrayOutboundObject<XrayTrojanOutboundObject>, outbound);
                    break;
                  case XrayProtocol.WIREGUARD:
                    proxy = plainToInstance(XrayOutboundObject<XrayWireguardOutboundObject>, outbound);
                    break;
                  case XrayProtocol.LOOPBACK:
                    proxy = plainToInstance(XrayOutboundObject<XrayLoopbackOutboundObject>, outbound);
                    break;
                  case XrayProtocol.HTTP:
                    proxy = plainToInstance(XrayOutboundObject<XrayHttpOutboundObject>, outbound);
                    break;
                  case XrayProtocol.DNS:
                    proxy = plainToInstance(XrayOutboundObject<XrayFreedomOutboundObject>, outbound);
                    break;
                  case XrayProtocol.SOCKS:
                    proxy = plainToInstance(XrayOutboundObject<XraySocksOutboundObject>, outbound);
                    break;
                  default:
                    alert(`Unsupported protocol: ${outbound.protocol}`);
                    return;
                }
              }
            } else {
              alert('Invalid JSON format. Please check the structure.');
              return;
            }
          } else if (protocolFile.value) {
            let jsonConfig;
            try {
              jsonConfig = plainToInstance(XrayObject, JSON.parse(protocolFile.value));
            } catch (e) {
              alert('Invalid JSON format. Please check the structure.');
              console.error('Failed to parse JSON:', e);
              return;
            }

            await engine.loadXrayConfig(jsonConfig);
            importModal.value.close();
            alert(`Configuration imported successfully`);
            return;
          }

          if (proxy) {
            proxy.tag = proxy.tag || 'proxy';

            if (completeSetup.value) {
              set_default_config(proxy.tag!);
            }

            props.config.outbounds.push(proxy);

            emit('update:config', props.config);
            importModal.value.close();
            alert(`Configuration ${proxy.protocol}:${proxy.tag} imported successfully`);
          } else {
            alert(`Parse of this protocol is not supported yet`);
          }
        }
      };

      return {
        importModal,
        import_type,
        protocolUrl,
        protocolJson,
        protocolFile,
        protocolQr,
        bypassMode,
        completeSetup,
        unblockItemsList: ['Github', 'Google', 'Youtube', 'Telegram', 'TikTok', 'Reddit', 'LinkedIn', 'DeviantArt', 'Flibusta', 'Wikipedia', 'Twitch', 'Disney', 'Netflix', 'Discord', 'Instagram', 'Twitter', 'Patreon', 'Metacritic', 'Envato', 'SoundCloud', 'Kinopub', 'Facebook'].sort(),
        unblockItems,
        select_json_file,
        select_qr,
        showModal,
        parse,
        show
      };
    }
  });
</script>
<style scoped></style>
