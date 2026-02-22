<template>
  <div class="formfontdesc">
    <div class="log-card">
      <header class="log-card-bar">
        <h3>{{ $t('com.SniLogs.title') }}</h3>
        <div class="actions">
          <input class="button_gen button_gen_small" type="button" v-if="!isb4sniRunning" :value="$t('labels.start')" @click.prevent="start()" />
          <input class="button_gen button_gen_small" type="button" v-if="isb4sniRunning" :value="$t('labels.stop')" @click.prevent="stop()" />
          <input class="button_gen button_gen_small" type="button" :value="$t('com.SniLogs.display')" @click.prevent="display()" />
        </div>
      </header>

      <modal ref="sniModal" :width="modal_width" :title="$t('com.SniLogs.title')">
        <div class="logs-shell">
          <!-- Tab navigation -->
          <div class="go-tabs-nav sni-tabs">
            <button v-for="(tab, idx) in tabs" :key="idx" :class="{ active: currentTab.n === tab.n }" @click="currentTab = tab">
              {{ tab.t }}
            </button>
          </div>

          <!-- Stats bar -->
          <div class="stats-bar" v-if="stats">
            <div class="stat-item">
              <span class="stat-label">{{ $t('com.SniLogs.total') }}:</span>
              <span class="stat-value">{{ stats.total }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">TCP:</span>
              <span class="stat-value">{{ stats.tcp }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">UDP:</span>
              <span class="stat-value">{{ stats.udp }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ $t('com.SniLogs.unique_sni') }}:</span>
              <span class="stat-value">{{ stats.uniqueSni }}</span>
            </div>
            <div class="stat-item" v-if="stats.topDomain">
              <span class="stat-label">{{ $t('com.SniLogs.top_domain') }}:</span>
              <span class="stat-value" :title="stats.topDomain">{{ stats.topDomain }} ({{ stats.topHits }})</span>
            </div>
            <div class="stat-item" v-if="stats.activeDevice">
              <span class="stat-label">{{ $t('com.SniLogs.most_active') }}:</span>
              <span class="stat-value">{{ stats.activeDevice }}</span>
            </div>
          </div>

          <!-- ======================== BY DEVICE VIEW ======================== -->
          <div v-show="currentTab.n === 'device'" class="view-device">
            <div class="bulk-bar" v-if="selectedDomains.length > 0">
              <span>{{ selectedDomains.length }} selected</span>
              <input class="button_gen button_gen_small" type="button" :value="$t('com.SniLogs.add_selected_to_rule')" @click.prevent="openPopoverBulk($event)" />
            </div>

            <div class="device-list">
              <div v-for="group in deviceGroups" :key="group.ip" class="device-card">
                <div class="device-header" @click="toggleDevice(group.ip)">
                  <span class="expand-icon">{{ expandedDevices.has(group.ip) ? '&#9660;' : '&#9654;' }}</span>
                  <span class="device-name">{{ group.name }}</span>
                  <span class="device-ip">{{ group.ip }}</span>
                  <span class="device-stats">
                    {{ group.domains.length }} {{ $t('com.SniLogs.domains_count') }} &middot; {{ group.totalHits }} {{ $t('com.SniLogs.hits') }}
                  </span>
                </div>

                <div v-show="expandedDevices.has(group.ip)" class="device-domains">
                  <table class="modern-table compact">
                    <thead>
                      <tr>
                        <th class="col-checkbox"><input type="checkbox" @change="toggleDeviceSelectAll(group, ($event.target as HTMLInputElement).checked)" /></th>
                        <th>{{ $t('com.SniLogs.domain') }}</th>
                        <th>{{ $t('com.SniLogs.hits') }}</th>
                        <th>{{ $t('com.SniLogs.protocols') }}</th>
                        <th>{{ $t('com.SniLogs.last_seen') }}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="d in group.domains" :key="d.domain">
                        <td class="col-checkbox"><input type="checkbox" v-model="d.selected" /></td>
                        <td class="sni-cell"><span class="sni-domain" :title="d.domain">{{ d.domain }}</span></td>
                        <td>{{ d.devices.get(group.ip)?.hits || d.hits }}</td>
                        <td>
                          <span v-for="p in d.protocols" :key="p" :class="['badge', p.toLowerCase()]">{{ p }}</span>
                        </td>
                        <td class="time-cell">{{ d.lastSeen }}</td>
                        <td>
                          <input class="button_gen button_gen_small btn-add-rule" type="button" :value="$t('com.SniLogs.add_to_rule')" @click.stop="openPopover(d.domain, $event)" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div v-if="deviceGroups.length === 0" class="empty-message">
              {{ $t('com.SniLogs.no_logs') }}
            </div>
          </div>

          <!-- ======================== BY DOMAIN VIEW ======================== -->
          <div v-show="currentTab.n === 'domain'" class="view-domain">
            <div class="bulk-bar" v-if="selectedDomains.length > 0">
              <span>{{ selectedDomains.length }} selected</span>
              <input class="button_gen button_gen_small" type="button" :value="$t('com.SniLogs.add_selected_to_rule')" @click.prevent="openPopoverBulk($event)" />
            </div>

            <div class="table-wrapper">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th class="col-checkbox"><input type="checkbox" @change="toggleSelectAll(($event.target as HTMLInputElement).checked)" /></th>
                    <th>
                      <input v-model.trim="filters.sni" :placeholder="'&#128270; ' + $t('com.SniLogs.domain')" />
                    </th>
                    <th>{{ $t('com.SniLogs.hits') }}</th>
                    <th>{{ $t('com.SniLogs.protocols') }}</th>
                    <th>{{ $t('com.SniLogs.devices') }}</th>
                    <th>{{ $t('com.SniLogs.last_seen') }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in filteredDomainList" :key="d.domain">
                    <td class="col-checkbox"><input type="checkbox" v-model="d.selected" /></td>
                    <td class="sni-cell"><span class="sni-domain" :title="d.domain">{{ d.domain }}</span></td>
                    <td>{{ d.hits }}</td>
                    <td>
                      <span v-for="p in d.protocols" :key="p" :class="['badge', p.toLowerCase()]">{{ p }}</span>
                    </td>
                    <td class="devices-cell">
                      <span v-for="[ip, dev] in d.devices" :key="ip" class="device-tag" :title="ip">
                        {{ dev.name }} ({{ dev.hits }})
                      </span>
                    </td>
                    <td class="time-cell">{{ d.lastSeen }}</td>
                    <td>
                      <input class="button_gen button_gen_small btn-add-rule" type="button" :value="$t('com.SniLogs.add_to_rule')" @click.stop="openPopover(d.domain, $event)" />
                    </td>
                  </tr>
                  <tr v-if="filteredDomainList.length === 0">
                    <td colspan="7" class="empty-message">
                      {{ $t('com.SniLogs.no_logs') }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ======================== LIVE STREAM VIEW ======================== -->
          <div v-show="currentTab.n === 'live'" class="view-live">
            <div class="table-wrapper">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>
                      <input v-model.trim="filters.protocol" placeholder="&#128270; protocol" />
                    </th>
                    <th>
                      <input v-model.trim="filters.source" placeholder="&#128270; source" />
                    </th>
                    <th>
                      <input v-model.trim="filters.destination" placeholder="&#128270; destination" />
                    </th>
                    <th>
                      <input v-model.trim="filters.sni" placeholder="&#128270; SNI" />
                    </th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(log, idx) in filteredLogs" :key="idx" :class="[log.protocol?.toLowerCase()]">
                    <td class="time-cell">{{ log.time }}</td>
                    <td class="protocol-cell">
                      <span :class="['badge', log.protocol?.toLowerCase()]">
                        <b :class="log.protocol === 'TCP' ? 'i-tcp' : 'i-udp'"></b>
                        {{ log.protocol }}
                      </span>
                    </td>
                    <td class="source-cell">
                      <div class="address-info">
                        <a v-if="log.sourceDevice" class="device" :title="log.source">
                          {{ log.sourceDevice }}
                        </a>
                        <span v-else>{{ log.sourceIp }}</span>
                        <span class="port">:{{ log.sourcePort }}</span>
                      </div>
                    </td>
                    <td class="destination-cell">
                      <div class="address-info">
                        <span>{{ log.destinationIp }}</span>
                        <span class="port">:{{ log.destinationPort }}</span>
                      </div>
                    </td>
                    <td class="sni-cell">
                      <div class="sni-wrapper" :title="log.sni">
                        <span class="sni-domain">{{ log.sni || '-' }}</span>
                      </div>
                    </td>
                    <td>
                      <input v-if="log.sni" class="button_gen button_gen_small btn-add-rule" type="button" :value="$t('com.SniLogs.add_to_rule')" @click.stop="openPopover(log.sni, $event)" />
                    </td>
                  </tr>

                  <tr v-if="parsedLogs.length === 0">
                    <td colspan="6" class="empty-message">
                      {{ $t('com.SniLogs.no_logs') }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Add-to-Rule Popover -->
        <Teleport to="body">
          <div v-if="popoverTarget" class="rule-popover" :style="popoverStyle" @click.stop>
            <div class="popover-header">
              <span class="popover-domain" :title="popoverTarget">{{ popoverTarget }}</span>
              <button class="close-btn-small" @click="closePopover">&times;</button>
            </div>

            <div v-if="ruleAddedMessage" class="popover-success">{{ ruleAddedMessage }}</div>

            <div v-else class="popover-body">
              <div v-if="availableRules.length" class="existing-rules">
                <label v-for="r in availableRules" :key="r.idx" class="rule-option" :class="{ selected: selectedRuleIdx === r.idx }" @click="selectedRuleIdx = r.idx">
                  <input type="radio" :value="r.idx" v-model="selectedRuleIdx" />
                  <span class="rule-name">{{ r.name }}</span>
                  <span class="rule-outbound">{{ r.outboundTag }}</span>
                </label>
              </div>
              <div v-else class="no-rules-hint">{{ $t('com.SniLogs.no_rules_available') }}</div>

              <div class="new-rule-section">
                <label class="rule-option" :class="{ selected: selectedRuleIdx === -1 }" @click="selectedRuleIdx = -1">
                  <input type="radio" :value="-1" v-model="selectedRuleIdx" />
                  {{ $t('com.SniLogs.create_new_rule') }}
                </label>
                <div v-if="selectedRuleIdx === -1" class="new-rule-fields">
                  <input type="text" v-model="newRuleName" :placeholder="$t('com.SniLogs.rule_name')" class="input-small" />
                  <select v-model="selectedOutbound" class="input_option input-small">
                    <option v-for="tag in outboundTags" :key="tag" :value="tag">{{ tag }}</option>
                  </select>
                </div>
              </div>

              <div class="popover-actions">
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.add')" @click.prevent="confirmAddToRule" :disabled="!canAdd" />
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.cancel')" @click.prevent="closePopover" />
              </div>
            </div>
          </div>
        </Teleport>

        <template v-slot:footer>
          <div class="modal-footer">
            <div class="footer-left">
              <span class="log-count" v-if="currentTab.n === 'live'">{{ filteredLogs.length }} / {{ parsedLogs.length }} logs</span>
              <span class="log-count" v-else-if="currentTab.n === 'domain'">{{ filteredDomainList.length }} {{ $t('com.SniLogs.domains_count') }}</span>
              <span class="log-count" v-else>{{ deviceGroups.length }} {{ $t('com.SniLogs.devices') }}</span>
              <input class="button_gen button_gen_small" type="button" :value="$t('com.SniLogs.clear_logs')" @click.prevent="clearLogs()" />
            </div>
            <div class="footer-right">
              <a class="button_gen button_gen_small" :href="SNI_LOG_ENDPOINT" target="_blank">{{ $t('com.SniLogs.raw') }}</a>
              <input class="button_gen button_gen_small" type="button" :value="$t('com.SniLogs.export_csv')" @click.prevent="exportCsv()" />
              <input class="button_gen button_gen_small" type="button" :value="$t('labels.close')" @click.prevent="sniModal.close" />
            </div>
          </div>
        </template>
      </modal>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, reactive, onUnmounted, nextTick } from 'vue';
  import axios from 'axios';
  import Modal from '@main/Modal.vue';
  import engine, { SubmitActions } from '@modules/Engine';
  import xrayConfig from '@/modules/XrayConfig';
  import { XrayRoutingRuleObject, XrayRoutingObject } from '@/modules/CommonObjects';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();

  // ─── Interfaces ───────────────────────────────────────────────
  interface SniLogEntry {
    time: string;
    protocol: string;
    sourceIp: string;
    sourcePort: string;
    source: string;
    sourceDevice?: string;
    destinationIp: string;
    destinationPort: string;
    sni: string;
    raw?: string;
  }

  interface AggregatedDomain {
    domain: string;
    hits: number;
    protocols: Set<string>;
    devices: Map<string, { name: string; ip: string; hits: number }>;
    firstSeen: string;
    lastSeen: string;
    selected: boolean;
  }

  interface DeviceGroup {
    ip: string;
    name: string;
    domains: AggregatedDomain[];
    totalHits: number;
  }

  // ─── Constants & State ────────────────────────────────────────
  const SNI_LOG_ENDPOINT = '/ext/xrayui/b4sni.json';
  const sniModal = ref();
  const modal_width = ref('70%');
  const logsContent = ref('');
  const refreshInterval = ref<number>();

  const tabs = [
    { n: 'device', t: t('com.SniLogs.tab_by_device') },
    { n: 'domain', t: t('com.SniLogs.tab_by_domain') },
    { n: 'live', t: t('com.SniLogs.tab_live') }
  ];
  const currentTab = ref(tabs[0]);

  const filters = reactive({
    protocol: '',
    source: '',
    destination: '',
    sni: ''
  });

  const expandedDevices = ref<Set<string>>(new Set());

  const isb4sniRunning = computed(() => {
    return window.xray?.server?.b4sni_isRunning;
  });

  // ─── Device Resolution ────────────────────────────────────────
  const devices = computed(() => {
    if (!window.xray?.router?.devices_online) return {};
    const pairs = Object.values(window.xray.router.devices_online).flatMap((device: any) => [
      ...(device.ip ? [[device.ip, device]] : []),
      ...(device.ip6 ? [[device.ip6, device]] : []),
      ...(device.ip6_prefix ? [[device.ip6_prefix, device]] : [])
    ]);
    return Object.fromEntries(pairs);
  });

  // ─── Log Parsing ──────────────────────────────────────────────
  const isValidSniLogLine = (line: string): boolean => {
    const parts = line.split(',');
    if (parts.length < 5) return false;
    const [timestamp, protocol, source, destination] = parts;
    if (!timestamp || !timestamp.match(/^\d{1,2}:\d{2}:\d{2}\.\d{3}$/)) return false;
    if (!protocol || !['TCP', 'UDP'].includes(protocol.toUpperCase())) return false;
    if (!source || !source.includes(':')) return false;
    if (!destination || !destination.includes(':')) return false;
    return true;
  };

  const parsedLogs = computed<SniLogEntry[]>(() => {
    if (!logsContent.value) return [];
    return logsContent.value
      .split('\n')
      .filter((line) => line.trim())
      .filter(isValidSniLogLine)
      .map((line) => {
        const parts = line.split(',');
        const [timestamp, protocol, source, destination, ...sniParts] = parts;
        const sni = sniParts.join(',');
        const lastColonIndex = source.lastIndexOf(':');
        const sourceIp = source.substring(0, lastColonIndex);
        const sourcePort = source.substring(lastColonIndex + 1);
        const destColonIndex = destination.lastIndexOf(':');
        const destinationIp = destination.substring(0, destColonIndex);
        const destinationPort = destination.substring(destColonIndex + 1);
        const formattedTime = timestamp.split('.')[0];
        const deviceInfo = devices.value[sourceIp];
        const deviceName = deviceInfo?.nickName?.trim() || deviceInfo?.name;
        return {
          raw: line,
          time: formattedTime,
          protocol: protocol?.toUpperCase(),
          sourceIp,
          sourcePort,
          source,
          sourceDevice: deviceName,
          destinationIp,
          destinationPort,
          sni: sni?.trim()
        };
      })
      .reverse();
  });

  const filteredLogs = computed<SniLogEntry[]>(() => {
    return parsedLogs.value.filter((log) => {
      const protocolMatch = !filters.protocol || log.protocol?.toLowerCase().includes(filters.protocol.toLowerCase());
      const sourceMatch =
        !filters.source ||
        log.sourceIp?.toLowerCase().includes(filters.source.toLowerCase()) ||
        log.sourceDevice?.toLowerCase().includes(filters.source.toLowerCase()) ||
        log.sourcePort?.includes(filters.source);
      const destMatch = !filters.destination || log.destinationIp?.toLowerCase().includes(filters.destination.toLowerCase()) || log.destinationPort?.includes(filters.destination);
      const sniMatch = !filters.sni || log.sni?.toLowerCase().includes(filters.sni.toLowerCase());
      return protocolMatch && sourceMatch && destMatch && sniMatch;
    });
  });

  // ─── Aggregation ──────────────────────────────────────────────
  const aggregatedDomains = computed<Map<string, AggregatedDomain>>(() => {
    const map = new Map<string, AggregatedDomain>();
    // parsedLogs is reversed (newest first), iterate in original order for firstSeen/lastSeen
    const logs = parsedLogs.value;
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      if (!log.sni) continue;
      let entry = map.get(log.sni);
      if (!entry) {
        entry = {
          domain: log.sni,
          hits: 0,
          protocols: new Set(),
          devices: new Map(),
          firstSeen: log.time,
          lastSeen: log.time,
          selected: false
        };
        map.set(log.sni, entry);
      }
      entry.hits++;
      entry.protocols.add(log.protocol);
      entry.lastSeen = log.time;
      const deviceKey = log.sourceIp;
      const existing = entry.devices.get(deviceKey);
      if (existing) {
        existing.hits++;
      } else {
        entry.devices.set(deviceKey, {
          name: log.sourceDevice || log.sourceIp,
          ip: log.sourceIp,
          hits: 1
        });
      }
    }
    return map;
  });

  const domainList = computed<AggregatedDomain[]>(() => {
    return [...aggregatedDomains.value.values()].sort((a, b) => b.hits - a.hits);
  });

  const filteredDomainList = computed<AggregatedDomain[]>(() => {
    if (!filters.sni) return domainList.value;
    const q = filters.sni.toLowerCase();
    return domainList.value.filter((d) => d.domain.toLowerCase().includes(q));
  });

  const deviceGroups = computed<DeviceGroup[]>(() => {
    const groups = new Map<string, DeviceGroup>();
    for (const log of parsedLogs.value) {
      if (!log.sni) continue;
      const key = log.sourceIp;
      let group = groups.get(key);
      if (!group) {
        group = {
          ip: log.sourceIp,
          name: log.sourceDevice || log.sourceIp,
          domains: [],
          totalHits: 0
        };
        groups.set(key, group);
      }
      group.totalHits++;
    }
    for (const group of groups.values()) {
      group.domains = [...aggregatedDomains.value.values()]
        .filter((d) => d.devices.has(group.ip))
        .sort((a, b) => {
          const aHits = a.devices.get(group.ip)?.hits || 0;
          const bHits = b.devices.get(group.ip)?.hits || 0;
          return bHits - aHits;
        });
    }
    return [...groups.values()].sort((a, b) => b.totalHits - a.totalHits);
  });

  // ─── Stats ────────────────────────────────────────────────────
  const stats = computed(() => {
    if (!parsedLogs.value.length) return null;
    const tcpCount = parsedLogs.value.filter((l) => l.protocol === 'TCP').length;
    const udpCount = parsedLogs.value.filter((l) => l.protocol === 'UDP').length;
    const uniqueSni = aggregatedDomains.value.size;
    let topDomain = '';
    let topHits = 0;
    for (const d of aggregatedDomains.value.values()) {
      if (d.hits > topHits) {
        topHits = d.hits;
        topDomain = d.domain;
      }
    }
    let activeDevice = '';
    let activeHits = 0;
    for (const g of deviceGroups.value) {
      if (g.totalHits > activeHits) {
        activeHits = g.totalHits;
        activeDevice = g.name;
      }
    }
    return {
      total: parsedLogs.value.length,
      tcp: tcpCount,
      udp: udpCount,
      uniqueSni,
      topDomain: topDomain.length > 30 ? topDomain.substring(0, 27) + '...' : topDomain,
      topHits,
      activeDevice,
      activeHits
    };
  });

  // ─── Selection ────────────────────────────────────────────────
  const selectedDomains = computed(() => {
    return [...aggregatedDomains.value.values()].filter((d) => d.selected);
  });

  const toggleSelectAll = (selected: boolean) => {
    for (const d of filteredDomainList.value) {
      d.selected = selected;
    }
  };

  const toggleDeviceSelectAll = (group: DeviceGroup, selected: boolean) => {
    for (const d of group.domains) {
      d.selected = selected;
    }
  };

  const toggleDevice = (ip: string) => {
    if (expandedDevices.value.has(ip)) {
      expandedDevices.value.delete(ip);
    } else {
      expandedDevices.value.add(ip);
    }
  };

  // ─── Add-to-Rule Popover ──────────────────────────────────────
  const popoverTarget = ref<string | null>(null);
  const popoverBulkMode = ref(false);
  const popoverPosition = reactive({ top: 0, left: 0 });
  const newRuleName = ref('');
  const selectedOutbound = ref('');
  const selectedRuleIdx = ref<number>(-1);
  const ruleAddedMessage = ref('');

  const popoverStyle = computed(() => ({
    top: popoverPosition.top + 'px',
    left: popoverPosition.left + 'px'
  }));

  const availableRules = computed(() => {
    const rules = xrayConfig.routing?.rules ?? [];
    return rules
      .filter((r) => !r.isSystem() && r.enabled !== false)
      .map((r) => ({
        idx: r.idx,
        name: r.name || `Rule #${r.idx + 1}`,
        outboundTag: r.outboundTag || '',
        rule: r
      }));
  });

  const outboundTags = computed(() => {
    return xrayConfig.outbounds
      .filter((o) => !o.isSystem())
      .map((o) => o.tag)
      .filter((tag): tag is string => !!tag);
  });

  const canAdd = computed(() => {
    if (selectedRuleIdx.value === -1) {
      return !!(newRuleName.value && selectedOutbound.value);
    }
    return selectedRuleIdx.value >= 0;
  });

  const handleClickOutside = (e: MouseEvent) => {
    if (popoverTarget.value && !(e.target as HTMLElement).closest('.rule-popover')) {
      closePopover();
    }
  };

  const openPopover = (domain: string, event: MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    popoverPosition.top = rect.bottom + 4;
    popoverPosition.left = Math.min(rect.left, window.innerWidth - 300);
    popoverTarget.value = domain;
    popoverBulkMode.value = false;
    selectedRuleIdx.value = availableRules.value.length > 0 ? availableRules.value[0].idx : -1;
    newRuleName.value = '';
    selectedOutbound.value = outboundTags.value[0] || '';
    ruleAddedMessage.value = '';
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    nextTick(() => {
      const popoverEl = document.querySelector('.rule-popover');
      if (popoverEl) {
        const popRect = popoverEl.getBoundingClientRect();
        if (popRect.bottom > window.innerHeight) {
          popoverPosition.top = rect.top - popRect.height - 4;
        }
      }
    });
  };

  const openPopoverBulk = (event: MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    popoverPosition.top = rect.bottom + 4;
    popoverPosition.left = Math.min(rect.left, window.innerWidth - 300);
    popoverTarget.value = `${selectedDomains.value.length} domains`;
    popoverBulkMode.value = true;
    selectedRuleIdx.value = availableRules.value.length > 0 ? availableRules.value[0].idx : -1;
    newRuleName.value = '';
    selectedOutbound.value = outboundTags.value[0] || '';
    ruleAddedMessage.value = '';
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
  };

  const closePopover = () => {
    popoverTarget.value = null;
    popoverBulkMode.value = false;
    ruleAddedMessage.value = '';
    document.removeEventListener('click', handleClickOutside);
  };

  const addDomainToRule = (domain: string): string | null => {
    const domainEntry = `domain:${domain}`;
    if (selectedRuleIdx.value >= 0) {
      const ruleInfo = availableRules.value.find((r) => r.idx === selectedRuleIdx.value);
      if (ruleInfo) {
        if (!ruleInfo.rule.domain) ruleInfo.rule.domain = [];
        if (!ruleInfo.rule.domain.includes(domainEntry)) {
          ruleInfo.rule.domain.push(domainEntry);
        }
        return ruleInfo.name;
      }
    } else if (selectedRuleIdx.value === -1 && newRuleName.value && selectedOutbound.value) {
      const newRule = new XrayRoutingRuleObject();
      newRule.name = newRuleName.value;
      newRule.outboundTag = selectedOutbound.value;
      newRule.domain = [domainEntry];
      newRule.network = 'tcp,udp';
      newRule.enabled = true;
      newRule.type = 'field';
      if (!xrayConfig.routing) {
        xrayConfig.routing = new XrayRoutingObject();
      }
      if (!xrayConfig.routing.rules) {
        xrayConfig.routing.rules = [];
      }
      newRule.idx = xrayConfig.routing.rules.length;
      xrayConfig.routing.rules.push(newRule);
      return newRuleName.value;
    }
    return null;
  };

  const confirmAddToRule = () => {
    if (popoverBulkMode.value) {
      let ruleName: string | null = null;
      const domainsToAdd = selectedDomains.value.map((d) => d.domain);
      for (const domain of domainsToAdd) {
        ruleName = addDomainToRule(domain);
      }
      if (ruleName) {
        ruleAddedMessage.value = t('com.SniLogs.added_to_rule', [ruleName]);
        for (const d of selectedDomains.value) {
          d.selected = false;
        }
      }
    } else if (popoverTarget.value) {
      const ruleName = addDomainToRule(popoverTarget.value);
      if (ruleName) {
        ruleAddedMessage.value = t('com.SniLogs.added_to_rule', [ruleName]);
      }
    }
    setTimeout(closePopover, 1200);
  };

  // ─── Service Controls ─────────────────────────────────────────
  const fetchLogs = async () => {
    try {
      const response = await axios.get(SNI_LOG_ENDPOINT, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      });
      logsContent.value = response.data;
    } catch (error) {
      console.error('Error fetching SNI logs:', error);
      logsContent.value = '';
    }
  };

  const start = async () => {
    await engine.executeWithLoadingProgress(async () => {
      await engine.submit(SubmitActions.b4sniStart, null, 1000);
    });
  };

  const stop = async () => {
    await engine.executeWithLoadingProgress(async () => {
      await engine.submit(SubmitActions.b4sniStop, null, 1000);
    });
  };

  const clearLogs = async () => {
    logsContent.value = '';
    await engine.submit(SubmitActions.b4sniClearLogs);
    await fetchLogs();
  };

  const display = async () => {
    await fetchLogs();
    sniModal.value.show(() => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
      }
      logsContent.value = '';
      closePopover();
    });
    refreshInterval.value = window.setInterval(fetchLogs, 3000);
  };

  // ─── CSV Export ───────────────────────────────────────────────
  const downloadCsv = (headers: string[], rows: (string | number)[][], prefix: string) => {
    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (currentTab.value.n === 'live') {
      const headers = ['Time', 'Protocol', 'Source IP', 'Source Port', 'Device', 'Dest IP', 'Dest Port', 'SNI'];
      const rows = filteredLogs.value.map((log) => [log.time, log.protocol, log.sourceIp, log.sourcePort, log.sourceDevice || '', log.destinationIp, log.destinationPort, log.sni]);
      downloadCsv(headers, rows, 'sni-logs-live');
    } else if (currentTab.value.n === 'domain') {
      const headers = ['Domain', 'Hits', 'Protocols', 'Devices', 'First Seen', 'Last Seen'];
      const rows = filteredDomainList.value.map((d) => [d.domain, d.hits, [...d.protocols].join('/'), [...d.devices.values()].map((dv) => dv.name).join('; '), d.firstSeen, d.lastSeen]);
      downloadCsv(headers, rows, 'sni-logs-domains');
    } else {
      const headers = ['Device', 'IP', 'Domain', 'Hits', 'Protocols'];
      const rows: (string | number)[][] = [];
      for (const g of deviceGroups.value) {
        for (const d of g.domains) {
          const deviceHits = d.devices.get(g.ip)?.hits || 0;
          rows.push([g.name, g.ip, d.domain, deviceHits, [...d.protocols].join('/')]);
        }
      }
      downloadCsv(headers, rows, 'sni-logs-devices');
    }
  };

  onUnmounted(() => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
    }
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<style scoped lang="scss">
  .log-card {
    background: #475a5f;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .log-card-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #475a5f;

    h3 {
      margin: 0;
      font-weight: 600;
      color: #fff;
    }

    .actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  }

  /* ── Tab Navigation ────────────────────────────────────────── */
  .sni-tabs {
    display: flex;
    background: #4d595d;
    padding: 0 4px;
    border-radius: 4px 4px 0 0;

    button {
      min-width: 90px;
      padding: 6px 14px;
      color: #e0e0e0;
      font-size: 13px;
      border: 1px solid #000;
      border-bottom: none;
      background: linear-gradient(#2b393f 0%, #1c242a 100%);
      border-radius: 4px 4px 0 0;
      margin-right: 2px;
      cursor: pointer;

      &.active {
        background: linear-gradient(#3477aa 0%, #215c9f 100%);
        color: #fff;
        border-color: #1e3d58 #1e3d58 #19232b;
        z-index: 2;
      }

      &:hover:not(.active) {
        filter: brightness(1.15);
      }
    }
  }

  /* ── Stats Bar ─────────────────────────────────────────────── */
  .stats-bar {
    display: flex;
    gap: 2rem;
    padding: 0.75rem 1rem;
    background: #3a484c;
    border-bottom: 1px solid #2a3438;
    flex-wrap: wrap;

    .stat-item {
      display: flex;
      gap: 0.5rem;
      align-items: center;

      .stat-label {
        color: #999;
        font-size: 0.875rem;
      }

      .stat-value {
        color: #fff;
        font-weight: 600;
      }
    }
  }

  /* ── Shared Table Styles ───────────────────────────────────── */
  .table-wrapper {
    max-height: 60vh;
    overflow: auto;
  }

  .modern-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'JetBrains Mono', monospace;
    color: #fafafa;
    min-width: 900px;

    &.compact {
      min-width: auto;

      th,
      td {
        padding: 0.4rem 0.5rem;
      }
    }

    thead {
      position: sticky;
      background-color: #475a5f;
      top: 0;
      z-index: 10;

      th {
        text-align: left;
        padding: 0.5rem;
        font-weight: 600;

        input {
          width: 100%;
          padding: 0.4rem;
          border: 1px solid #475a5f;
          border-radius: 4px;
          background: #21333e;
          color: #eee;
          font-size: 0.875rem;
          box-sizing: border-box;

          &::placeholder {
            color: #888;
          }
        }
      }
    }

    tbody {
      tr {
        transition: background 0.15s;

        &:nth-child(odd) {
          background: #596d74;
        }

        &:hover {
          background: #21333e;
        }

        &.tcp {
          border-left: 3px solid #4cc2ff;
        }

        &.udp {
          border-left: 3px solid #ffd166;
        }

        td {
          padding: 0.6rem 0.5rem;
          white-space: nowrap;
          vertical-align: middle;

          &.time-cell {
            font-size: 0.875rem;
            color: #ccc;
          }

          &.empty-message {
            text-align: center;
            padding: 2rem;
            color: #888;
          }
        }
      }
    }
  }

  .col-checkbox {
    width: 30px;
    text-align: center;
  }

  .address-info {
    display: flex;
    align-items: center;

    .device {
      color: #00ff7f;
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }

    .port {
      color: #999;
      font-size: 0.875rem;
    }
  }

  .sni-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sni-cell .sni-domain {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    border-radius: 4px;
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.25rem;
    margin-right: 0.25rem;

    &.tcp {
      background: rgba(76, 194, 255, 0.15);
      color: #4cc2ff;
    }

    &.udp {
      background: rgba(255, 209, 102, 0.15);
      color: #ffd166;
    }
  }

  .i-tcp::before {
    content: '↯';
  }

  .i-udp::before {
    content: '☄';
  }

  /* ── By Device View ────────────────────────────────────────── */
  .view-device {
    .device-list {
      max-height: 60vh;
      overflow-y: auto;
      padding: 0.5rem;
    }
  }

  .device-card {
    border: 1px solid #3a484c;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    overflow: hidden;
  }

  .device-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    background: #3a484c;
    cursor: pointer;

    &:hover {
      background: #445558;
    }

    .expand-icon {
      color: $c_yellow;
      width: 1rem;
      text-align: center;
      font-size: 0.75rem;
    }

    .device-name {
      color: #00ff7f;
      font-weight: 600;
    }

    .device-ip {
      color: #999;
      font-size: 0.875rem;
    }

    .device-stats {
      color: #ccc;
      font-size: 0.8rem;
      margin-left: auto;
    }
  }

  .device-domains {
    max-height: 300px;
    overflow-y: auto;
  }

  /* ── By Domain View ────────────────────────────────────────── */
  .devices-cell {
    max-width: 200px;
    white-space: normal !important;
  }

  .device-tag {
    display: inline-block;
    background: rgba(0, 255, 127, 0.1);
    color: #00ff7f;
    border-radius: 3px;
    padding: 0.1rem 0.4rem;
    font-size: 0.75rem;
    margin-right: 0.25rem;
    margin-bottom: 0.15rem;
  }

  /* ── Bulk Selection Bar ────────────────────────────────────── */
  .bulk-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 204, 0, 0.1);
    border-bottom: 1px solid $c_yellow;
    color: $c_yellow;
    font-size: 0.875rem;
  }

  /* ── + Rule Button ─────────────────────────────────────────── */
  .btn-add-rule {
    font-size: 0.7rem !important;
    padding: 0.15rem 0.4rem !important;
    white-space: nowrap;
  }

  /* ── Footer ────────────────────────────────────────────────── */
  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;

    .footer-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .log-count {
        color: #999;
        font-size: 0.875rem;
      }
    }

    .footer-right {
      display: flex;
      gap: 0.5rem;
    }
  }

  .logs-shell {
    background: #475a5f;
    border-radius: 6px;
    overflow: hidden;
  }

  .empty-message {
    text-align: center;
    padding: 2rem;
    color: #888;
  }

  /* ── Scrollbar Styling ─────────────────────────────────────── */
  .table-wrapper::-webkit-scrollbar,
  .device-list::-webkit-scrollbar,
  .device-domains::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }

  .table-wrapper::-webkit-scrollbar-thumb,
  .device-list::-webkit-scrollbar-thumb,
  .device-domains::-webkit-scrollbar-thumb {
    background: #21333e;
    border-radius: 4px;
  }

  .table-wrapper::-webkit-scrollbar-track,
  .device-list::-webkit-scrollbar-track,
  .device-domains::-webkit-scrollbar-track {
    background: #475a5f;
  }
</style>

<!-- Popover styles need to be unscoped since they are teleported to body -->
<style lang="scss">
  .rule-popover {
    position: fixed;
    z-index: 500;
    background: #2f3a3e;
    border: 1px solid #929ea1;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    width: 280px;
    color: #fff;
    font-size: 0.85rem;

    .popover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.6rem;
      border-bottom: 1px solid #475a5f;

      .popover-domain {
        font-weight: 600;
        color: #fc0;
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .close-btn-small {
        background: none;
        border: none;
        color: #999;
        font-size: 1.1rem;
        cursor: pointer;
        padding: 0 0.25rem;

        &:hover {
          color: #fff;
        }
      }
    }

    .popover-success {
      padding: 0.75rem;
      color: #00ff7f;
      text-align: center;
      font-weight: 600;
    }

    .popover-body {
      padding: 0.5rem;
      max-height: 250px;
      overflow-y: auto;
    }

    .existing-rules {
      margin-bottom: 0.5rem;
      border-bottom: 1px solid #475a5f;
      padding-bottom: 0.5rem;
    }

    .no-rules-hint {
      color: #999;
      font-size: 0.8rem;
      padding: 0.3rem 0.4rem;
      margin-bottom: 0.5rem;
    }

    .rule-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.4rem;
      cursor: pointer;
      border-radius: 3px;

      &:hover,
      &.selected {
        background: #21333e;
      }

      .rule-name {
        color: #fc0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 130px;
      }

      .rule-outbound {
        color: #999;
        font-size: 0.75rem;
        margin-left: auto;
      }

      input[type='radio'] {
        margin: 0;
        flex-shrink: 0;
      }
    }

    .new-rule-section {
      padding-top: 0.25rem;
    }

    .new-rule-fields {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      padding: 0.3rem 0.4rem 0.3rem 1.5rem;

      .input-small {
        padding: 0.3rem;
        background: #21333e;
        border: 1px solid #475a5f;
        border-radius: 3px;
        color: #eee;
        font-size: 0.8rem;
        width: 100%;
        box-sizing: border-box;
      }
    }

    .popover-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.4rem;
      padding: 0.5rem;
      border-top: 1px solid #475a5f;
      margin-top: 0.25rem;
    }
  }
</style>
