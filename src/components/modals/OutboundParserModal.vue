<template>
  <modal ref="importModal" title="Import configuration" width="700px">
    <div class="formfontdesc">
      <p>
        Here you can import a configuration from a QR code or a protocol URL.
      </p>
      <table class="FormTable modal-form-table">
        <tbody>
          <tr>
            <td>QR Code</td>
            <td>
              <input type="file" accept="image/*" v-on:change="selectFile" />
            </td>
          </tr>
          <tr>
            <td>Porotocol Url</td>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="protocolUrl" rows="25"></textarea>
              </div>
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
import engine, { SubmtActions } from "../../modules/Engine";
import Modal from "../Modal.vue";
import jsQR from "jsqr";
import { XrayProtocol } from "@/modules/Options";
import { XrayOutboundObject, XrayVlessOutboundObject } from "@/modules/OutboundObjects";
import { IProtocolType } from "@/modules/Interfaces";
import { XrayVlessClientObject } from "@/modules/ClientsObjects";
import { XrayStreamRealitySettingsObject, XrayStreamSettingsObject, XrayParsedUrlObject } from "@/modules/CommonObjects";
import ProxyParser from "@/modules/parsers/ProxyParser";

export default defineComponent({
  name: "OutboundParserModal",
  components: {
    Modal,
  },
  data() {
    return {
    };
  },
  props: {
    outbounds: Array as () => XrayOutboundObject<IProtocolType>[],
  },

  setup(props, { emit }) {
    const importModal = ref();
    const protocolUrl = ref<string>();
    const protocolQr = ref<string>();
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
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          return code.data;
        }
      }
    }
    const show = () => {
      importModal.value.show();
    };

    const parse = () => {
      if (protocolUrl.value) {

        const parser = new ProxyParser(protocolUrl.value);
        const proxy = parser.getOutbound();
        protocolUrl.value = "";
        protocolQr.value = "";

        if (proxy) {

          props.outbounds?.push(proxy);
          console.log(proxy);
          emit("update:outbounds", props.outbounds);
          importModal.value.close();
          alert(`Configuration ${proxy.protocol}:${proxy.tag} imported successfully`);
        } else {
          alert(`Parse of this protocol is not supported yet`);
        }
      }
    }

    const parseSecurity = (proxy: XrayOutboundObject<IProtocolType>, parsedParams: Record<string, string>) => {
      if (proxy.streamSettings) {
        if (parsedParams.security === "reality") {
          const reality = new XrayStreamRealitySettingsObject();
          reality.fingerprint = parsedParams.fp;
          reality.publicKey = parsedParams.pbk;
          reality.shortId = parsedParams.sid;
          reality.serverName = parsedParams.sni;
          proxy.streamSettings.realitySettings = reality;
        }
      }
    }

    return {
      importModal,
      protocolUrl,
      protocolQr,
      selectFile,
      showModal,
      parse,
      show
    }
  }
});
</script>
