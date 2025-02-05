<template>
  <modal ref="importModal" title="Import configuration" width="700px">
    <div class="formfontdesc">
      <p>
        Here you can import a configuration from a QR code or a protocol URL.
      </p>
      <table class="FormTable modal-form-table">
        <tbody>
          <tr>
            <th>QR Code
              <hint>
                Try to print screen your QR code and xrayui will try to read it.
              </hint>
            </th>
            <td>
              <input type="file" accept="image/*" v-on:change="selectFile" />
            </td>
          </tr>
          <tr>
            <th>Outbound Proxy Uri
              <hint>
                You can paste here the URL of the protocol here. Usually they start with `vless://` or `vmess://`.
              </hint>
            </th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="protocolUrl" rows="25"></textarea>
              </div>
            </td>
          </tr>
          <tr>
            <th>I'd like to have a complete setup!

              <hint>
                If you select this option, xrayui will overwrite your current configuration with the most suitable
                default configuration for the imported protocol.
                <hr />
                A default Routing rule will be created to test the proxy outbound connection.
                After importing and applying the configuration, you can
                try to open the `https://www.myip.com/`. You should see the IP of the server you are connected to.
                <hr />
                After that, it is recommended to set up your your own traffic routing rules.
              </hint>
            </th>
            <td>
              <input type="checkbox" v-model="completeSetup" />
            </td>
          </tr>
        </tbody>
        <tbody v-show="completeSetup">
          <tr>
            <th>Unblock
              <hint>
                Select the services you want to unblock. This will automatically create a `routing rule` that channels
                their traffic through the proxy.
                <hr />
                It's recommended to only choose services that are blocked in your
                region. You'll be able to add, update, or delete these rules later in the `Routing` section.
              </hint>
            </th>
            <td class="flex-checkbox">
              <div v-for="(opt, index) in unblockItemsList" :key="index">
                <input type="checkbox" v-model="unblockItems" class="input" :value="opt" :id="'destopt-' + index" />
                <label :for="'destopt-' + index" class="settingvalue">{{ opt }}</label>
              </div>
            </td>
          </tr>
          <tr>
            <th>Don't break my network devices
              <hint>
                Check this box if you have IoT devices on your router network, like `Smart TVs`, `Xbox`, `PlayStation`,
                or
                other devices you prefer not to affect with X-RAY.
                <hr />
                This option limits the rerouted traffic to X-RAY via your router, reducing the risk of disconnecting
                these devices. Later You can adjust this option in the Routing section (`Ports Bypass/Redirect Policy`).
                <hr />
                If you don't have any IoT devices, it's best to leave this option unchecked.
              </hint>
            </th>
            <td>
              <input type="checkbox" v-model="bypassMode" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" value="parse" @click.prevent="parse" />
    </template>
  </modal>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import engine, { SubmtActions } from "@/modules/Engine";
import Modal from "../Modal.vue";
import jsQR from "jsqr";
import { XrayObject } from "@/modules/XrayConfig";
import ProxyParser from "@/modules/parsers/ProxyParser";
import Hint from "../Hint.vue";
import { XrayDnsObject, XrayLogObject, XrayPortsPolicy, XrayProtocol, XrayRoutingObject, XraySniffingObject } from "@/modules/CommonObjects";
import { XrayDokodemoDoorInboundObject, XrayInboundObject } from "@/modules/InboundObjects";
import { XrayBlackholeOutboundObject, XrayFreedomOutboundObject, XrayOutboundObject } from "@/modules/OutboundObjects";

export default defineComponent({
  name: "ImportConfigModal",
  components: {
    Modal,
    Hint
  },
  data() {
    return {
    };
  },
  props: {
    config: XrayObject
  },

  setup(props, { emit }) {
    const importModal = ref();
    const protocolUrl = ref<string>();
    const protocolQr = ref<string>();
    const completeSetup = ref<boolean>(true);
    const bypassMode = ref<boolean>(true);
    const unblockItems = ref<string[]>(["Youtube"]);

    const showModal = () => {
      importModal.value.show();
    };

    const selectFile = async (event: any) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          const file = event.target.files[0];
          if (file) decodeQRCode(file).then((data) => protocolUrl.value = data);
        }
      };
      reader.readAsDataURL(file);
    };

    async function decodeQRCode(imageFile: MediaSource) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx) {

        const image = new Image();
        image.src = URL.createObjectURL(imageFile);

        await new Promise((resolve) => {
          image.onload = resolve;
        });

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });

        if (code) {
          return code.data;
        }
        alert("Failed to decode QR code");
      }
    }

    const show = () => {
      importModal.value.show();
    };

    const parse = async () => {

      if (completeSetup.value && !confirm("You selected a complete setup. This will overwrite your current configuration. Are you sure?")) {
        return;
      }

      if (protocolUrl.value) {
        const parser = new ProxyParser(protocolUrl.value);
        const proxy = parser.getOutbound();
        protocolUrl.value = "";
        protocolQr.value = "";
        if (props.config) {

          if (proxy) {
            if (completeSetup.value) {
              props.config.outbounds = [];
              props.config.inbounds = [];

              const in_doko = new XrayInboundObject<XrayDokodemoDoorInboundObject>();
              in_doko.tag = "all-in";
              in_doko.settings = new XrayDokodemoDoorInboundObject();
              in_doko.protocol = XrayProtocol.DOKODEMODOOR;
              in_doko.port = 5599;
              in_doko.settings.network = "tcp,udp";
              in_doko.settings.followRedirect = true;
              in_doko.sniffing = new XraySniffingObject();
              in_doko.sniffing.enabled = true;
              in_doko.sniffing.destOverride = ["http", "tls", "quic"];

              props.config.inbounds.push(in_doko);

              const out_free = new XrayOutboundObject<XrayFreedomOutboundObject>();
              out_free.tag = "direct";
              out_free.settings = new XrayFreedomOutboundObject();
              out_free.protocol = XrayProtocol.FREEDOM;
              out_free.settings.domainStrategy = "UseIP";
              props.config.outbounds.push(out_free);
            }

            props.config.outbounds.push(proxy);

            if (completeSetup.value) {
              const out_block = new XrayOutboundObject<XrayBlackholeOutboundObject>();
              out_block.tag = "block";
              out_block.settings = new XrayBlackholeOutboundObject();
              out_block.protocol = XrayProtocol.BLACKHOLE;
              props.config.outbounds.push(out_block);

              props.config.log = new XrayLogObject().normalize();
              props.config.dns = new XrayDnsObject().default().normalize();

              props.config.routing = new XrayRoutingObject().default(unblockItems.value).normalize();

              if (bypassMode.value) {
                props.config.routing.portsPolicy = new XrayPortsPolicy().default().normalize();

              }

              if (unblockItems.value?.length > 0) {
                await engine.executeWithLoadingProgress(async () => {
                  await engine.submit(SubmtActions.geodataCommunityUpdate);
                }, false);
              }
            }

            emit("update:config", props.config);
            importModal.value.close();
            alert(`Configuration ${proxy.protocol}:${proxy.tag} imported successfully`);

          } else {
            alert(`Parse of this protocol is not supported yet`);
          }
        }
      }
    }

    return {
      importModal,
      protocolUrl,
      protocolQr,
      bypassMode,
      completeSetup,
      unblockItemsList: ["Youtube", "Telegram", "TikTok", "Reddit", "LinkedIn", "DeviantArt", "Flibusta", "Wikipedia", "Twitch", "Disney", "Netflix", "Discord", "Instagram", "Twitter", "Patreon", "Metacritic", "Envato", "SoundCloud", "Kinopub", "Facebook"].sort(),
      unblockItems,
      selectFile,
      showModal,
      parse,
      show
    }
  }
});
</script>
<style scoped></style>
