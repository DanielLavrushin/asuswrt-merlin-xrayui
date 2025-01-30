<template>
  <table width="100%" bordercolor="#6b8fa3" class="FormTable">
    <thead>
      <tr>
        <td colspan="2">Inbounds</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>Create new</th>
        <td>
          <select class="input_option" v-model="selectedInboundType" @change="edit_proxy()">
            <option></option>
            <option v-for="(opt, index) in availableProxies" :key="index" :value="opt.protocol">
              {{ opt.protocol }}
            </option>
          </select>
        </td>
      </tr>
      <slot v-for="(proxy, index) in config.inbounds" :key="index">
        <tr>
          <th>{{ proxy.protocol.toUpperCase() }}</th>
          <td>
            <a class="hint" href="#" @click.prevent="edit_proxy(proxy)">
              <span v-show="proxy.streamSettings?.network" :class="['proxy-label', 'tag']">
                {{ proxy.tag == "" ? "no tag" : proxy.tag }}
              </span>
            </a>
            <span v-show="proxy.streamSettings?.network" :class="['proxy-label', proxy.streamSettings?.network]">
              {{ proxy.streamSettings?.network }}
            </span>
            <span v-show="proxy.streamSettings?.security" :class="['proxy-label', proxy.streamSettings?.security]">
              {{ proxy.streamSettings?.security }}
            </span>
            <span class="row-buttons">
              <a class="button_gen button_gen_small" href="#" @click.prevent="show_transport(proxy)">transport</a>
              <a class="button_gen button_gen_small" href="#" @click.prevent="show_sniffing(proxy)">sniffing</a>
              <a class="button_gen button_gen_small" href="#" @click.prevent="reorder_proxy(proxy, index)"
                v-if="index > 0">&#8593;</a>
              <a class="button_gen button_gen_small" href="#" @click.prevent="edit_proxy(proxy)"
                title="edit">&#8494;</a>
              <a class="button_gen button_gen_small" href="#" @click.prevent="remove_proxy(proxy)"
                title="delete">&#10005;</a>
            </span>
          </td>
        </tr>
      </slot>
    </tbody>
  </table>

  <modal ref="inboundModal" title="Inbound Settings">
    <component ref="inboundComponentRef" :is="inboundComponent" :inbound="selectedInbound" />
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" value="Save" @click.prevent="save_inbound" />
    </template>
  </modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick } from "vue";
import engine from "../modules/Engine";
import Modal from "./Modal.vue";

import { IProtocolType } from "../modules/Interfaces";
import { XrayProtocol } from "../modules/CommonObjects";
import { XrayInboundObject } from "../modules/InboundObjects";
import { XrayProtocolOption } from "../modules/CommonObjects";

import { xrayProtocols } from "../modules/XrayConfig";
import { XrayProtocolMode } from "../modules/Options";

import DocodemoDoorInbound from "./inbounds/DocodemoDoorInbound.vue";
import VmessInbound from "./inbounds/VmessInbound.vue";
import VlessInbound from "./inbounds/VlessInbound.vue";
import HttpInbound from "./inbounds/HttpInbound.vue";
import ShadowsocksInbound from "./inbounds/ShadowsocksInbound.vue";
import SocksInbound from "./inbounds/SocksInbound.vue";
import TrojanInbound from "./inbounds/TrojanInbound.vue";
import WireguardInbound from "./inbounds/WireguardInbound.vue";

export default defineComponent({
  name: "Inbounds",
  emits: ["show-transport", "show-sniffing"],
  components: {
    Modal
  },
  methods: {
    reorder_proxy(proxy: XrayInboundObject<IProtocolType>, index: number) {
      this.config.inbounds.splice(index, 1);
      this.config.inbounds.splice(index - 1, 0, proxy);
    },
    async show_transport(inbound: XrayInboundObject<IProtocolType>) {
      this.$emit("show-transport", inbound, "inbound");
    },
    async show_sniffing(inbound: XrayInboundObject<IProtocolType>) {
      this.$emit("show-sniffing", inbound);
    },
    save_protocol() {
      this.inboundModal.close();
    },

    async edit_proxy(inbound: XrayInboundObject<IProtocolType> | undefined = undefined) {
      if (inbound) {
        this.selectedInbound = inbound;
        this.selectedInboundType = inbound.protocol;
      }

      await nextTick();

      this.inboundModal.show(() => {
        this.selectedInbound = undefined;
        this.selectedInboundType = undefined;
      });
    },

    async remove_proxy(inbound: XrayInboundObject<IProtocolType>) {
      if (!window.confirm("Are you sure you want to delete this inbound?")) return;
      let index = this.config.inbounds.indexOf(inbound);
      this.config.inbounds.splice(index, 1);
    },

    async save_inbound() {
      let inbound = this.inboundComponentRef.inbound;
      if (this.config.inbounds.filter((i) => i != inbound && i.tag == inbound.tag).length > 0) {
        alert("Tag  already exists, please choose another one");
        return;
      }

      let index = this.config.inbounds.indexOf(inbound);
      if (index >= 0) {
        this.config.inbounds[index] = inbound;
      } else {
        this.config.inbounds.push(inbound);
      }

      this.inboundModal.close();
    }
  },

  setup() {
    const config = ref(engine.xrayConfig);
    const availableProxies = ref<XrayProtocolOption[]>(xrayProtocols.filter((p) => p.modes & XrayProtocolMode.Inbound));
    const selectedInboundType = ref<string>();
    const selectedInbound = ref<any>();
    const inboundModal = ref();
    const inboundComponentRef = ref();

    const inboundComponent = computed(() => {
      switch (selectedInboundType.value) {
        case XrayProtocol.DOKODEMODOOR:
          return DocodemoDoorInbound;
        case XrayProtocol.VMESS:
          return VmessInbound;
        case XrayProtocol.VLESS:
          return VlessInbound;
        case XrayProtocol.HTTP:
          return HttpInbound;
        case XrayProtocol.SHADOWSOCKS:
          return ShadowsocksInbound;
        case XrayProtocol.SOCKS:
          return SocksInbound;
        case XrayProtocol.TROJAN:
          return TrojanInbound;
        case XrayProtocol.WIREGUARD:
          return WireguardInbound;
        default:
          return null;
      }
    });

    return {
      config,
      inboundComponent,
      inboundComponentRef,
      inboundModal,
      selectedInbound,
      availableProxies,
      selectedInboundType
    };
  }
});
</script>

<style scoped></style>
