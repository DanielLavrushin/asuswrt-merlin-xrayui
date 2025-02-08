<template>
  <table width="100%" bordercolor="#6b8fa3" class="FormTable">
    <thead>
      <tr>
        <td colspan="2">{{ $t('components.Outbounds.title') }}</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>{{ $t('components.Outbounds.label_create_new') }}</th>
        <td>
          <select class="input_option" v-model="selectedProxyType" @change="edit_proxy()">
            <option></option>
            <option v-for="(opt, index) in availableProxies" :key="index" :value="opt.protocol">
              {{ opt.protocol }}
            </option>
          </select>
        </td>
      </tr>
      <slot v-for="(proxy, index) in config.outbounds" :key="index">
        <tr v-show="!proxy.isSystem()">
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
              <a class="button_gen button_gen_small" href="#" @click.prevent="show_transport(proxy)">
                {{ $t('labels.transport') }}
              </a>
              <a class="button_gen button_gen_small" href="#" @click.prevent="reorder_proxy(proxy)" v-if="index > 0"
                :title="$t('labels.redorder')">&#8593;</a>
              <a class="button_gen button_gen_small" href="#" @click.prevent="edit_proxy(proxy)"
                :title="$t('labels.edit')">&#8494;</a>
              <a class="button_gen button_gen_small" href="#" @click.prevent="remove_proxy(proxy)"
                :title="$t('labels.delete')">&#10005;</a>
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
import { defineComponent, ref, computed, nextTick, watch } from "vue";
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

import { I18n } from 'vue-i18n';

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
    reorder_proxy(proxy: XrayOutboundObject<IProtocolType>) {
      const index = this.config.outbounds.indexOf(proxy);
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

        watch(() => proxy.tag, (newVal, oldVal) => {
          if (oldVal && newVal && oldVal !== newVal) {
            this.config.routing?.rules?.map(r => {
              r.outboundTag = r.outboundTag === oldVal ? newVal : r.outboundTag;
            }
            );
          }
        }, { immediate: true });
      }

      await nextTick();

      this.proxyModal.show(() => {
        this.selectedProxy = undefined;
        this.selectedProxyType = undefined;
      });
    },

    async remove_proxy(proxy: XrayOutboundObject<IProtocolType>) {
      if (!window.confirm(this.$t('components.Outbounds.alert_delete_confirm'))) return;
      let index = this.config.outbounds.indexOf(proxy);
      this.config.outbounds.splice(index, 1);
    },

    async save_proxy() {
      let proxy = this.proxyRef.proxy;
      if (this.config.outbounds.filter((i) => i != proxy && i.tag == proxy.tag).length > 0) {
        alert(this.$t('components.Outbounds.alert_tag_exists'));
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
    const parserModal = ref();

    const showImportModal = () => {
      parserModal.value.show();
    };

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
      selectedProxyType,
      showImportModal,
      parserModal
    };
  }
});
</script>

<style scoped></style>
