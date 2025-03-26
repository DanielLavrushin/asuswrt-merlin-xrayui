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
        <tr v-show="!proxy.isSystem()" class="proxy-row">
          <th>{{ proxy.tag == '' ? 'no tag' : proxy.tag! }}</th>
          <td>
            <a class="hint" href="#" @click.prevent="edit_proxy(proxy)">
              <span v-show="proxy.streamSettings?.network" :class="['proxy-label', 'tag']">
                {{ proxy.protocol }}
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
              <a class="button_gen button_gen_small" href="#" @click.prevent="reorder_proxy(proxy)" v-if="index > 0" :title="$t('labels.redorder')">&#8593;</a>
              <a class="button_gen button_gen_small" href="#" @click.prevent="edit_proxy(proxy)" :title="$t('labels.edit')">&#8494;</a>
              <a class="button_gen button_gen_small" href="#" @click.prevent="remove_proxy(proxy)" :title="$t('labels.delete')">&#10005;</a>
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
  import { defineComponent, ref, computed, nextTick, watch } from 'vue';
  import engine from '../modules/Engine';
  import Modal from './Modal.vue';
  import { xrayProtocols } from '../modules/XrayConfig';

  import { IProtocolType } from '../modules/Interfaces';
  import { XrayProtocol } from '../modules/CommonObjects';
  import { XrayOutboundObject } from '../modules/OutboundObjects';
  import { XrayProtocolOption } from '../modules/CommonObjects';
  import { XrayProtocolMode } from '../modules/Options';

  import FreedomOutbound from '@obd/FreedomOutbound.vue';
  import BlackholeOutbound from '@obd/BlackholeOutbound.vue';
  import DnsOutbound from '@obd/DnsOutbound.vue';
  import HttpOutbound from '@obd/HttpOutbound.vue';
  import LoopbackOutbound from '@obd/LoopbackOutbound.vue';
  import VlessOutbound from '@obd/VlessOutbound.vue';
  import VmessOutbound from '@obd/VmessOutbound.vue';
  import SocksOutbound from '@obd/SocksOutbound.vue';
  import ShadowsocksOutbound from '@obd/ShadowsocksOutbound.vue';
  import TrojanOutbound from '@obd/TrojanOutbound.vue';
  import WireguardOutbound from '@obd/WireguardOutbound.vue';

  import { useI18n } from 'vue-i18n';

  export default defineComponent({
    name: 'Outbounds',
    emits: ['show-transport', 'show-sniffing'],
    components: {
      Modal
    },
    methods: {},

    setup(props, { emit }) {
      const { t } = useI18n();
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

      const show_transport = async (proxy: XrayOutboundObject<IProtocolType>) => {
        emit('show-transport', proxy, 'outbound');
      };

      const reorder_proxy = (proxy: XrayOutboundObject<IProtocolType>) => {
        const index = config.value.outbounds.indexOf(proxy);
        config.value.outbounds.splice(index, 1);
        config.value.outbounds.splice(index - 1, 0, proxy);
      };

      const edit_proxy = async (proxy: XrayOutboundObject<IProtocolType> | undefined = undefined) => {
        if (proxy) {
          selectedProxy.value = proxy;
          selectedProxyType.value = proxy.protocol;

          watch(
            () => proxy.tag,
            (newVal, oldVal) => {
              if (oldVal && newVal && oldVal !== newVal) {
                config.value.routing?.rules?.map((r) => {
                  r.outboundTag = r.outboundTag === oldVal ? newVal : r.outboundTag;
                });
              }
            },
            { immediate: true }
          );
        }

        await nextTick();
        proxyModal.value.show(() => {
          selectedProxy.value = undefined;
          selectedProxyType.value = undefined;
        });
      };

      const remove_proxy = async (proxy: XrayOutboundObject<IProtocolType>) => {
        if (!window.confirm(t('components.Outbounds.alert_delete_confirm'))) return;
        let index = config.value.outbounds.indexOf(proxy);
        config.value.outbounds.splice(index, 1);
      };

      const save_proxy = async () => {
        let proxy = proxyRef.value.proxy;
        if (config.value.outbounds.filter((i) => i != proxy && i.tag == proxy.tag).length > 0) {
          alert(t('components.Outbounds.alert_tag_exists'));
          return;
        }

        let index = config.value.outbounds.indexOf(proxy);
        if (index >= 0) {
          config.value.outbounds[index] = proxy;
        } else {
          config.value.outbounds.push(proxy);
        }

        proxyModal.value.close();
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
        parserModal,
        showImportModal,
        show_transport,
        reorder_proxy,
        edit_proxy,
        remove_proxy,
        save_proxy
      };
    }
  });
</script>

<style scoped></style>
