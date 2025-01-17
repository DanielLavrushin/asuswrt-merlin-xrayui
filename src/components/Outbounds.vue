<template>
  <table width="100%" bordercolor="#6b8fa3" class="FormTable">
    <thead>
      <tr>
        <td colspan="2">Outbounds</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>Create new</th>
        <td>
          <select class="input_option" v-model="selectedProxyType" @change="edit_proxy()">
            <option></option>
            <option v-for="(opt, index) in availableProxies" :key="index" :value="opt.protocol">
              {{ opt.protocol }}
            </option>
          </select>
          <span class="hint-color"> </span>
        </td>
      </tr>
      <slot v-for="(proxy, index) in config.outbounds">
        <tr>
          <th>{{ proxy.protocol.toUpperCase() }}</th>
          <td>
            <a class="hint" href="#" @click.prevent="edit_proxy(proxy)"><i><strong>
                  {{ proxy.tag == "" ? "no tag" : proxy.tag }}
                </strong></i>
            </a>
            <span class="row-buttons">
              <a class="button_gen button_gen_small" href="#" @click="show_transport(proxy)">transport</a>
              <a class="button_gen button_gen_small" href="#" @click="remove_proxy(proxy)">&#10005;</a>
              <a class="button_gen button_gen_small" href="#" @click="reorder_proxy(proxy, index)"
                v-if="index > 0">&#8593;</a>
            </span>
          </td>
        </tr>
      </slot>
    </tbody>
  </table>

  <modal ref="proxyModal" title="Outbound Settings">
    <component ref="proxyRef" :is="proxyComponent" :proxy="selectedProxy" />
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" value="Save" @click.prevent="save_proxy" />
    </template>
  </modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick } from "vue";
import engine from "../modules/Engine";
import Modal from "./Modal.vue";
import { xrayProtocols } from "../modules/XrayConfig";

import { IProtocolType } from "../modules/Interfaces";
import { XrayProtocol } from "../modules/CommonObjects";
import { XrayOutboundObject } from "../modules/OutboundObjects";
import { XrayProtocolOption } from "../modules/CommonObjects";
import { XrayProtocolMode } from "../modules/Options";

import FreedomOutbound from "./outbounds/FreedomOutbound.vue";
import BlackholeOutbound from "./outbounds/BlackholeOutbound.vue";
import DnsOutbound from "./outbounds/DnsOutbound.vue";
import HttpOutbound from "./outbounds/HttpOutbound.vue";
import LoopbackOutbound from "./outbounds/LoopbackOutbound.vue";
import VlessOutbound from "./outbounds/VlessOutbound.vue";
import VmessOutbound from "./outbounds/VmessOutbound.vue";
import SocksOutbound from "./outbounds/SocksOutbound.vue";
import ShadowsocksOutbound from "./outbounds/ShadowsocksOutbound.vue";
import TrojanOutbound from "./outbounds/TrojanOutbound.vue";
import WireguardOutbound from "./outbounds/WireguardOutbound.vue";

export default defineComponent({
  name: "Outbounds",
  emits: ["show-transport", "show-sniffing"],
  components: {
    Modal
  },
  methods: {
    async show_transport(proxy: XrayOutboundObject<IProtocolType>) {
      this.$emit("show-transport", proxy, "outbound");
    },
    reorder_proxy(proxy: XrayOutboundObject<IProtocolType>, index: number) {
      this.config.outbounds.splice(index, 1);
      this.config.outbounds.splice(index - 1, 0, proxy);
    },

    save_protocol() {
      this.proxyModal.close();
    },

    async edit_proxy(proxy: XrayOutboundObject<IProtocolType> | undefined = undefined) {
      if (proxy) {
        this.selectedProxy = proxy;
        this.selectedProxyType = proxy.protocol;
      }

      await nextTick();

      this.proxyModal.show(() => {
        this.selectedProxy = undefined;
        this.selectedProxyType = undefined;
      });
    },

    async remove_proxy(proxy: XrayOutboundObject<IProtocolType>) {
      if (!confirm("Are you sure you want to delete this outbound?")) return;
      let index = this.config.outbounds.indexOf(proxy);
      this.config.outbounds.splice(index, 1);
    },

    async save_proxy() {
      let proxy = this.proxyRef.proxy;
      if (this.config.outbounds.filter((i) => i != proxy && i.tag == proxy.tag).length > 0) {
        alert("Tag  already exists, please choose another one");
        return;
      }

      let index = this.config.outbounds.indexOf(proxy);
      if (index >= 0) {
        this.config.outbounds[index] = proxy;
      } else {
        this.config.outbounds.push(proxy);
      }

      this.proxyModal.close();
    }
  },

  setup() {
    const config = ref(engine.xrayConfig);
    const availableProxies = ref<XrayProtocolOption[]>(xrayProtocols.filter((p) => p.modes & XrayProtocolMode.Outbound));
    const selectedProxyType = ref<string>();
    const selectedProxy = ref<any>();
    const proxyModal = ref();
    const proxyRef = ref();

    const proxyComponent = computed(() => {
      switch (selectedProxyType.value) {
        case XrayProtocol.FREEDOM:
          return FreedomOutbound;
        case XrayProtocol.BLACKHOLE:
          return BlackholeOutbound;
        case XrayProtocol.DNS:
          return DnsOutbound;
        case XrayProtocol.HTTP:
          return HttpOutbound;
        case XrayProtocol.LOOPBACK:
          return LoopbackOutbound;
        case XrayProtocol.VLESS:
          return VlessOutbound;
        case XrayProtocol.VMESS:
          return VmessOutbound;
        case XrayProtocol.SOCKS:
          return SocksOutbound;
        case XrayProtocol.SHADOWSOCKS:
          return ShadowsocksOutbound;
        case XrayProtocol.TROJAN:
          return TrojanOutbound;
        case XrayProtocol.WIREGUARD:
          return WireguardOutbound;
        default:
          return null;
      }
    });

    return {
      config,
      proxyComponent,
      proxyRef,
      proxyModal,
      selectedProxy,
      availableProxies,
      selectedProxyType
    };
  }
});
</script>

<style scoped></style>
