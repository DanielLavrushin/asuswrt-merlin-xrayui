<template>
  <table width="100%" class="FormTable">
    <thead>
      <tr>
        <td colspan="2">{{ $t('com.Outbounds.title') }}</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>{{ $t('com.Outbounds.label_create_new') }}</th>
        <td>
          <select class="input_option" v-model="selectedProxyType" @change="edit_proxy()">
            <option></option>
            <option v-for="(opt, index) in availableProxies" :key="index" :value="opt.protocol">
              {{ opt.protocol }}
            </option>
          </select>
        </td>
      </tr>
      <rtls-scanner />

      <draggable
        v-if="config.outbounds.length"
        tag="slot"
        :list="config.outbounds"
        handle=".drag-handle"
        :item-key="(o: XrayOutboundObject<IProtocolType>) => o.tag"
        :filter="'input,select,textarea,label,.row-buttons'"
        :delay="100"
        :delayOnTouchOnly="true"
        :preventOnFilter="false"
      >
        <template #item="{ element: proxy, index }">
          <tr v-show="!proxy.isSystem()" :class="['proxy-row', rowClass(proxy.tag)]">
            <th class="drag-handle" aria-label="Drag to reorder">
              <span class="grip drag-handle" aria-hidden="true"></span>
              {{ proxy.surl ? '🔗' : '' }}<span v-if="proxy.subPool?.enabled && !proxy.surl" :class="{ 'pool-inactive': !fallbackActive }" :title="fallbackActive ? '' : $t('com.Outbounds.hint_pool_inactive')">🔄</span>
              <span class="proxy-tag">{{ proxy.tag == '' ? 'no tag' : proxy.tag! }}</span>
              <span
                v-for="item in balancerMarks[proxy.tag]?.items ?? []"
                :key="item.balancer"
                :class="['balancer-badge', badgeClass(proxy.tag, item)]"
                :title="markTitle(proxy.tag, item)"
                >&#9878; {{ item.balancer }}<template v-if="badgeLabel(item)"> · {{ badgeLabel(item) }}</template></span
              >
              <span v-if="isRunning && check_connection && connectionStatus[proxy.tag]" class="connection-status" :title="statusTitle(proxy.tag)">
                {{ connectionStatus[proxy.tag]?.alive ? '🟢' : connectionStatus[proxy.tag]?.alive === false ? '🔴' : '🟡' }}
              </span>
            </th>
            <td>
              <a class="hint" href="#" @click.prevent="edit_proxy(proxy)">
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
                <a class="button_gen button_gen_small" href="#" @click.prevent="edit_proxy(proxy)" :title="$t('labels.edit')">&#8494;</a>
                <a class="button_gen button_gen_small" href="#" @click.prevent="remove_proxy(proxy)" :title="$t('labels.delete')">&#10005;</a>
              </span>
            </td>
          </tr>
        </template>
      </draggable>
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
  import { defineComponent, ref, computed, nextTick, watch, onMounted, onUnmounted, inject, Ref } from 'vue';
  import engine, { EngineResponseConfig } from '@/modules/Engine';
  import Modal from '@main/Modal.vue';
  import { xrayProtocols } from '@/modules/XrayConfig';

  import { IProtocolType } from '@/modules/Interfaces';
  import { XrayProtocol, XrayProtocolOption } from '@/modules/CommonObjects';
  import { XrayOutboundObject } from '@/modules/OutboundObjects';
  import { XrayProtocolMode } from '@/modules/Options';
  import { createPoller } from '@/modules/Polling';
  import { liveStatus, refreshLiveStatus, clearLiveStatus, observationAge } from '@/modules/LiveStatus';
  import { computeOutboundMarks, OutboundMark, OutboundMarkItem } from '@/modules/BalancerStatus';

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
  import HysteriaOutbound from '@obd/HysteriaOutbound.vue';
  import draggable from 'vuedraggable';
  import { useI18n } from 'vue-i18n';
  import RtlsScanner from './RtlsScanner.vue';

  type OutboundStatus = { alive?: boolean; delay?: number; reason?: string };

  export default defineComponent({
    name: 'Outbounds',
    emits: ['show-transport', 'show-sniffing'],
    components: {
      Modal,
      RtlsScanner,
      draggable
    },
    methods: {},

    setup(props, { emit }) {
      const { t } = useI18n();
      const config = ref(engine.xrayConfig);
      const availableProxies = ref<XrayProtocolOption[]>(xrayProtocols.filter((p) => p.modes & XrayProtocolMode.Outbound));
      const selectedProxyType = ref<string>();
      const selectedProxy = ref<any>();
      const connectionStatus = ref<Record<string, OutboundStatus>>({});
      const uiResponse = inject<Ref<EngineResponseConfig>>('uiResponse')!;
      const check_connection = ref(false);
      const proxyModal = ref();
      const proxyRef = ref();
      const parserModal = ref();

      watch(
        () => config.value.outbounds.length,
        (newVal) => {
          if (newVal > 0) {
            connectionStatus.value = config.value.outbounds
              .filter((p) => p.protocol != XrayProtocol.BLACKHOLE)
              .reduce((acc, proxy) => {
                acc[proxy.tag!] = { alive: undefined };
                return acc;
              }, {} as Record<string, OutboundStatus>);
          }
        },
        { immediate: true }
      );

      watch(
        () => uiResponse.value.xray?.check_connection,
        (chkcon) => {
          check_connection.value = chkcon!;
        },
        { immediate: true }
      );
      const fetchStatus = async () => {
        if (!check_connection.value) {
          connectionStatus.value = {};
          clearLiveStatus();
          return;
        }
        if (!(await refreshLiveStatus())) return;
        const map: Record<string, OutboundStatus> = {};
        Object.values(liveStatus.observatory).forEach((entry) => {
          if (!entry?.outbound_tag) return;
          map[entry.outbound_tag] = { alive: entry.alive === true, delay: entry.delay, reason: entry.last_error_reason };
        });
        connectionStatus.value = map;
      };

      const balancerMarks = computed<Record<string, OutboundMark>>(() => {
        if (!check_connection.value || !liveStatus.fresh || !liveStatus.running) return {};
        return computeOutboundMarks(liveStatus.running, liveStatus.observatory);
      });

      const rowClass = (tag?: string) => {
        const mark = tag ? balancerMarks.value[tag] : undefined;
        return mark ? `bal-${mark.level}` : '';
      };

      const badgeClass = (tag: string, item: OutboundMarkItem) => (item.view.dead.includes(tag) ? 'dead' : item.view.kind);

      const badgeLabel = (item: OutboundMarkItem) => {
        switch (item.view.kind) {
          case 'tied':
            return t('com.Outbounds.badge_tied');
          case 'rotating':
            return t('com.Outbounds.badge_rotating');
          case 'fallback':
            return t('com.Outbounds.badge_fallback');
          case 'default':
            return t('com.Outbounds.badge_default');
          default:
            return '';
        }
      };

      const markTitle = (tag: string, item: OutboundMarkItem) => {
        const { view, balancer } = item;
        const dead = view.dead.includes(tag);
        const lines: string[] = [];
        switch (view.kind) {
          case 'next': {
            let line = t('com.Outbounds.balancer_next', [balancer, view.delay]);
            if (view.runnerUp) line += ' ' + t('com.Outbounds.balancer_runner_up', [view.runnerUp.tag, view.runnerUp.delay]);
            lines.push(line);
            break;
          }
          case 'tied':
            lines.push(t('com.Outbounds.balancer_tied', [balancer, view.delay, view.tags.filter((x) => x !== tag).join(', ')]));
            break;
          case 'rotating':
            lines.push(dead ? t('com.Outbounds.balancer_dead_share', [balancer]) : t('com.Outbounds.balancer_rotating', [balancer, view.tags.length]));
            break;
          case 'fallback':
          case 'default':
            lines.push(t(`com.Outbounds.balancer_${view.kind}`, [balancer]) + (dead ? ' ' + t('com.Outbounds.balancer_target_dead') : ''));
            break;
        }
        lines.push(t('com.Outbounds.balancer_rules', [item.rules.join(', ')]));
        lines.push(t('com.Outbounds.balancer_open_connections'));
        const age = view.kind === 'next' || view.kind === 'tied' ? observationAge(tag) : undefined;
        if (age !== undefined) lines.push(t('com.Outbounds.balancer_checked', [age]));
        return lines.join('\n');
      };

      const fallbackActive = computed(() => !!uiResponse.value.xray?.subscription_auto_fallback && !!uiResponse.value.xray?.check_connection);

      const statusTitle = (tag: string) => {
        const status = connectionStatus.value[tag];
        if (!status || status.alive === undefined) return '';
        if (status.alive) return status.delay !== undefined ? `${status.delay} ms` : '';
        return status.reason || t('com.Outbounds.status_unreachable');
      };

      const showImportModal = () => {
        parserModal.value.show();
      };

      const show_transport = async (proxy: XrayOutboundObject<IProtocolType>) => {
        emit('show-transport', proxy, 'outbound');
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
        if (!window.confirm(t('com.Outbounds.alert_delete_confirm'))) return;

        if (proxy.tag) {
          const allRules = [...(config.value.routing?.rules || []), ...(config.value.routing?.disabled_rules || [])].filter((rule) => rule.outboundTag);
          const rulesWithTag = allRules.filter((rule) => rule.outboundTag && proxy.tag && rule.outboundTag === proxy.tag);
          if (rulesWithTag && rulesWithTag.length > 0) {
            alert(t('com.Outbounds.alert_delete_tag_in_rules_use', [rulesWithTag.map((rule) => rule.name).join(', '), proxy.tag]));
            return;
          }

          const balancersWithTag = (config.value.routing?.balancers || []).filter((balancer) => balancer.fallbackTag === proxy.tag);
          if (balancersWithTag.length > 0) {
            alert(t('com.Outbounds.alert_delete_tag_in_balancer_use', [balancersWithTag.map((balancer) => balancer.tag).join(', '), proxy.tag]));
            return;
          }
        }

        let index = config.value.outbounds.indexOf(proxy);
        config.value.outbounds.splice(index, 1);
      };

      const save_proxy = async () => {
        let proxy = proxyRef.value.proxy;
        if (config.value.outbounds.filter((i) => i != proxy && i.tag == proxy.tag).length > 0) {
          alert(t('com.Outbounds.alert_tag_exists'));
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
          case XrayProtocol.HYSTERIA:
            return HysteriaOutbound;
          default:
            return null;
        }
      });

      const statusPoller = createPoller(fetchStatus, 5000);
      onMounted(() => {
        statusPoller.start();
      });
      onUnmounted(() => {
        statusPoller.stop();
        clearLiveStatus();
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
        connectionStatus,
        check_connection,
        fallbackActive,
        statusTitle,
        balancerMarks,
        rowClass,
        badgeClass,
        badgeLabel,
        markTitle,
        showImportModal,
        show_transport,
        edit_proxy,
        remove_proxy,
        save_proxy,
        isRunning: window.xray.server.isRunning
      };
    }
  });
</script>

<style scoped lang="scss">
  .connection-status {
    float: right;
    margin: 0 4px 0 10px;
  }
  .pool-inactive {
    opacity: 0.35;
    cursor: help;
  }
  .proxy-row {
    &.bal-next th {
      box-shadow: inset 3px 0 0 $c_purple;
      .proxy-tag {
        color: $c_purple;
      }
    }
    &.bal-tied th {
      box-shadow: inset 3px 0 0 rgba(176, 108, 255, 0.6);
    }
    &.bal-rotating th {
      box-shadow: inset 3px 0 0 rgba(176, 108, 255, 0.35);
    }
  }
  .balancer-badge {
    display: inline-block;
    margin-left: 6px;
    padding: 0 5px;
    border-radius: 3px;
    border: 1px solid rgba(176, 108, 255, 0.55);
    font-size: 11px;
    font-weight: normal;
    line-height: 15px;
    white-space: nowrap;
    color: #fff;
    background-color: rgba(176, 108, 255, 0.3);
    cursor: help;
    &.next,
    &.fallback,
    &.default {
      border-color: $c_purple;
      background-color: $c_purple;
    }
    &.dead {
      border-color: $c_yellow;
      background-color: transparent;
      color: $c_yellow;
    }
  }
</style>
