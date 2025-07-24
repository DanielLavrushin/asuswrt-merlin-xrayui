<template>
  <table width="100%" class="FormTable">
    <thead>
      <tr>
        <td colspan="2">{{ $t('com.Inbounds.title') }}</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>{{ $t('com.Inbounds.label_create_new') }}</th>
        <td>
          <select class="input_option" v-model="selectedInboundType" @change="edit_proxy()">
            <option></option>
            <option v-for="(opt, index) in availableProxies" :key="index" :value="opt.protocol">
              {{ opt.protocol }}
            </option>
          </select>
        </td>
      </tr>
      <draggable
        v-if="config.inbounds.length"
        tag="slot"
        :list="config.inbounds"
        handle=".drag-handle"
        :item-key="(o: XrayInboundObject<IProtocolType>) => o.tag"
        :filter="'input,select,textarea,label,.row-buttons'"
        :delay="100"
        :delayOnTouchOnly="true"
        :preventOnFilter="false"
      >
        <template #item="{ element: proxy, index }">
          <tr v-show="!proxy.isSystem()" class="proxy-row">
            <th class="drag-handle" aria-label="Drag to reorder">
              <span class="grip drag-handle" aria-hidden="true"></span>
              {{ proxy.tag == '' ? 'no tag' : proxy.tag! }}
            </th>
            <td>
              <a class="hint tag" href="#" @click.prevent="edit_proxy(proxy)">
                <span v-show="proxy.streamSettings?.network" :class="['proxy-label', 'tag']">
                  {{ proxy.protocol }}
                </span>
              </a>
              <span v-show="proxy.streamSettings?.network && proxy.streamSettings?.network != 'tcp'" :class="['proxy-label', proxy.streamSettings?.network]">
                {{ proxy.streamSettings?.network }}
              </span>
              <span v-show="proxy.streamSettings?.security && proxy.streamSettings?.security != 'none'" :class="['proxy-label', proxy.streamSettings?.security]">
                {{ proxy.streamSettings?.security }}
              </span>
              <span v-show="proxy.streamSettings?.sockopt?.tproxy === 'tproxy'" :class="['proxy-label', proxy.streamSettings?.sockopt?.tproxy]">{{
                proxy.streamSettings?.sockopt?.tproxy
              }}</span>
              <span class="row-buttons">
                <a class="button_gen button_gen_small" href="#" @click.prevent="show_transport(proxy)">
                  {{ $t('labels.transport') }}
                </a>
                <a class="button_gen button_gen_small" href="#" @click.prevent="show_sniffing(proxy)">
                  {{ $t('labels.sniffing') }}
                </a>
                <a class="button_gen button_gen_small" href="#" @click.prevent="edit_proxy(proxy)" title="edit">&#8494;</a>
                <a class="button_gen button_gen_small" href="#" @click.prevent="remove_proxy(proxy)" title="delete">&#10005;</a>
              </span>
            </td>
          </tr>
        </template>
      </draggable>
    </tbody>
  </table>

  <modal ref="inboundModal" :title="$t('com.Inbounds.modal_title_inbound_settings')">
    <component ref="inboundComponentRef" :is="inboundComponent" :inbound="selectedInbound" />
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="save_inbound" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, nextTick, watch } from 'vue';
  import engine from '@/modules/Engine';
  import Modal from '@main/Modal.vue';

  import { IProtocolType } from '@/modules/Interfaces';
  import { XrayProtocol } from '@/modules/CommonObjects';
  import { XrayInboundObject } from '@/modules/InboundObjects';
  import { XrayProtocolOption } from '@/modules/CommonObjects';

  import { xrayProtocols } from '@/modules/XrayConfig';
  import { XrayProtocolMode } from '@/modules/Options';

  import DocodemoDoorInbound from '@ibd/DocodemoDoorInbound.vue';
  import VmessInbound from '@ibd/VmessInbound.vue';
  import VlessInbound from '@ibd/VlessInbound.vue';
  import HttpInbound from '@ibd/HttpInbound.vue';
  import ShadowsocksInbound from '@ibd/ShadowsocksInbound.vue';
  import SocksInbound from '@ibd/SocksInbound.vue';
  import TrojanInbound from '@ibd/TrojanInbound.vue';
  import WireguardInbound from '@ibd/WireguardInbound.vue';
  import draggable from 'vuedraggable';

  import { useI18n } from 'vue-i18n';

  export default defineComponent({
    name: 'Inbounds',
    emits: ['show-transport', 'show-sniffing'],
    components: {
      Modal,
      draggable
    },
    setup(props, { emit }) {
      const { t } = useI18n();
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

      const show_transport = async (inbound: XrayInboundObject<IProtocolType>) => {
        emit('show-transport', inbound, 'inbound');
      };
      const show_sniffing = async (inbound: XrayInboundObject<IProtocolType>) => {
        emit('show-sniffing', inbound);
      };

      const edit_proxy = async (proxy: XrayInboundObject<IProtocolType> | undefined = undefined) => {
        if (proxy) {
          selectedInbound.value = proxy;
          selectedInboundType.value = proxy.protocol;

          watch(
            () => proxy.tag,
            (newVal, oldVal) => {
              if (oldVal && newVal && oldVal !== newVal) {
                config.value.routing?.rules?.forEach((rule) => {
                  if (rule.inboundTag && rule.inboundTag.indexOf(oldVal) >= 0) {
                    rule.inboundTag = rule.inboundTag.map((tag) => (tag === oldVal ? newVal : tag));
                  }
                });
              }
            },
            { immediate: true }
          );
        }

        await nextTick();

        inboundModal.value.show(() => {
          selectedInbound.value = selectedInboundType.value = undefined;
        });
      };
      const remove_proxy = async (proxy: XrayInboundObject<IProtocolType>) => {
        if (!window.confirm(t('com.Inbounds.alert_delete_confirm'))) return;

        if (proxy.tag) {
          const allRules = [...(config.value.routing?.rules || []), ...(config.value.routing?.disabled_rules || [])].filter((rule) => rule.inboundTag);
          const rulesWithTag = allRules.filter((rule) => rule.inboundTag && proxy.tag && rule.inboundTag.includes(proxy.tag));
          if (rulesWithTag && rulesWithTag.length > 0) {
            alert(t('com.Inbounds.alert_delete_tag_in_rules_use', [rulesWithTag.map((rule) => rule.name).join(', '), proxy.tag]));
            return;
          }
        }

        let index = config.value.inbounds.indexOf(proxy);
        config.value.inbounds.splice(index, 1);
      };

      const save_inbound = async () => {
        let inbound = inboundComponentRef.value.inbound;
        if (config.value.inbounds.filter((i) => i != inbound && i.tag == inbound.tag).length > 0) {
          alert(t('com.Inbounds.alert_tag_exists'));
          return;
        }

        let index = config.value.inbounds.indexOf(inbound);
        if (index >= 0) {
          config.value.inbounds[index] = inbound;
        } else {
          config.value.inbounds.push(inbound);
        }

        inboundModal.value.close();
      };

      return {
        config,
        inboundComponent,
        inboundComponentRef,
        inboundModal,
        selectedInbound,
        availableProxies,
        selectedInboundType,
        edit_proxy,
        remove_proxy,
        save_inbound,
        show_transport,
        show_sniffing
      };
    }
  });
</script>
