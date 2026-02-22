<template>
  <div class="formfontdesc" v-if="logs">
    <div class="log-card">
      <header class="log-card-bar">
        <h3>{{ $t('com.Logs.title') }}</h3>
        <div class="actions">
          <select class="input_option" v-model="file">
            <option :value="FILE_ACCESS" v-if="logs.access !== 'none'">Access Logs</option>
            <option :value="FILE_ERROR" v-if="logs.error !== 'none'">Error Logs</option>
          </select>
          <input class="button_gen button_gen_small" type="button" :value="$t('com.Logs.display')" @click.prevent="display()" />
        </div>
      </header>

      <modal ref="logsModal" :width="modal_width" :title="$t('com.Logs.title')">
        <div class="logs-shell">
          <pre v-if="file === FILE_ERROR" class="plain-log">{{ logsContent }}</pre>

          <div v-else class="table-wrapper">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>
                    <input v-model.trim="filters.source" placeholder="🔎 source" />
                  </th>
                  <th>
                    <input v-model.trim="filters.target" placeholder="🔎 target" />
                  </th>
                  <th>
                    <input v-model.trim="filters.inbound" placeholder="🔎 inbound" />
                  </th>
                  <th>
                    <input v-model.trim="filters.outbound" placeholder="🔎 outbound" />
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(log, idx) in filteredLogs" :key="idx" :class="[{ parsed: log.parsed, unparsed: !log.parsed }, log.kind]">
                  <td v-if="!log.parsed" colspan="5">{{ log.line }}</td>

                  <template v-else-if="log.kind === 'access'">
                    <td>{{ log.time }}</td>
                    <td>
                      <span v-if="log.user" class="badge user">{{ log.user }}</span>
                      <span v-if="!log.source_device && log.source_ip" class="resolved"
                        :title="showIp.has('s:' + idx) ? log.source : log.source_ip"
                        @click="toggleIp('s:' + idx)">{{ showIp.has('s:' + idx) ? log.source_ip : log.source }}</span>
                      <span v-else-if="!log.source_device">{{ log.source }}</span>
                      <a v-else class="device" :title="log.source_ip || log.source">{{ log.source_device }}</a>
                    </td>
                    <td>
                      <span :class="['badge', log.type]"> <b :class="log.type === 'tcp' ? 'i-tcp' : 'i-udp'"></b>{{ log.type }} </span>
                      <span v-if="log.target_ip" class="resolved"
                        :title="showIp.has('t:' + idx) ? log.target : log.target_ip"
                        @click="toggleIp('t:' + idx)">{{ showIp.has('t:' + idx) ? log.target_ip : log.target }}:{{ log.target_port }}</span>
                      <span v-else>{{ log.target }}:{{ log.target_port }}</span>
                    </td>
                    <td>{{ log.inbound }}</td>
                    <td>
                      <span v-if="log.routing" :class="['badge', log.routing]">
                        <b :class="log.routing === 'direct' ? 'i-direct' : 'i-rule'"></b>
                        {{ log.routing }}
                      </span>
                      {{ log.outbound }}
                    </td>
                  </template>

                  <template v-else>
                    <td>{{ log.time }}</td>
                    <td>
                      <span class="badge dns"><b class="i-dns"></b>DNS</span>
                    </td>
                    <td :title="log.answers">{{ log.host }}</td>
                    <td></td>
                    <td>
                      <span class="badge cache" v-if="log.type === 'cache'">CACHE</span>
                      <span v-else-if="log.type === 'answer'">{{ log.latency }}ms</span>
                    </td>
                  </template>
                </tr>

                <tr v-if="parsedLogs.length === 0">
                  <td colspan="5">No logs available</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <template v-slot:footer>
          <a class="button_gen button_gen_small" :href="file" target="_blank">raw</a>
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.close')" @click.prevent="logsModal.close" />
        </template>
      </modal>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, reactive } from 'vue';
  import axios from 'axios';
  import engine, { SubmitActions } from '@/modules/Engine';
  import { XrayLogObject } from '@/modules/CommonObjects';
  import Modal from '@main/Modal.vue';

  const props = defineProps<{ logs: XrayLogObject }>();

  const follow = ref(false);
  const logsModal = ref();
  let refreshInterval: number;

  const FILE_ACCESS = '/ext/xrayui/xray_access_partial.asp';
  const FILE_ERROR = '/ext/xrayui/xray_error_partial.asp';
  const file = ref(FILE_ACCESS);
  const logsContent = ref('');
  const modal_width = ref('85%');

  const ACCESS_RE =
    /^(?<time>.+)\.\d+\s+from\s+(?:tcp:|udp:)*(?:\[*)(?<source>.+?)(?:%.+)*(?:\]*\:)*(?<source_port>\d+)*\s+accepted\s+(?<type>tcp|udp)*(?:\:*)(?:\[*)(?<target>.+?)(?:\]*\:)(?<target_port>\d+)\s+\[(?<inbound>.+)\s+(?<routing>(?:>>|->))\s+(?<outbound>.+)?\](?:\semail:\s(?<user>.+))*$/;

  const DNS_RE =
    /^(?<time>.+)\.\d+\s+(?:UDP|DOH|DOHL|localhost)(?:\:)*(?<dns>.+)\s.*(?<type>answer|cache).*:\s(?<host>.+)\s->\s\[(?<answers>.*)\](?:\s(?<latency>[\d\.]+)ms)*(?:\s\<)*(?<code>.*?)>*$/;

  const RESOLVED_RE = /^(.+?)\{\{(.+)\}\}$/;

  function stripResolved(value: string): { display: string; ip: string } | null {
    const m = value.match(RESOLVED_RE);
    return m ? { display: m[1], ip: m[2] } : null;
  }

  class DnsLogEntry {
    kind = 'dns' as const;
    parsed = false;
    time?: string;
    host?: string;
    answers?: string;
    latency?: number;
    line?: string;
    code?: string;
    type?: 'answer' | 'cache';

    constructor(match?: RegExpMatchArray, line?: string) {
      this.line = line;
      if (!match) return;
      const groups = match.groups ?? {};
      Object.assign(this, groups);

      if (groups.time) {
        const iso = groups.time.replace(/\//g, '-').replace(' ', 'T') + 'Z';
        this.time = new Date(iso).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      this.latency = Number(groups.latency);
      this.parsed = true;
    }
  }

  class AccessLogEntry {
    kind = 'access' as const;
    time?: string;
    source?: string;
    source_ip?: string;
    source_port?: string;
    source_device?: string;
    type?: string;
    target?: string;
    target_ip?: string;
    target_port?: string;
    inbound?: string;
    routing?: string;
    outbound?: string;
    user?: string;
    line?: string;
    parsed = false;

    constructor(match?: RegExpMatchArray, devices: Record<string, any> = {}, line?: string) {
      this.line = line;
      if (!match) return;
      const groups = match.groups ?? {};
      Object.assign(this, groups);
      if (groups.time) {
        const iso = groups.time.replace(/\//g, '-').replace(' ', 'T') + 'Z';
        this.time = new Date(iso).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      if (groups.routing) this.routing = groups.routing === '>>' ? 'direct' : 'rule';

      const srcResolved = this.source ? stripResolved(this.source) : null;
      if (srcResolved) {
        this.source = srcResolved.display;
        this.source_ip = srcResolved.ip;
      }
      const tgtResolved = this.target ? stripResolved(this.target) : null;
      if (tgtResolved) {
        this.target = tgtResolved.display;
        this.target_ip = tgtResolved.ip;
      }

      if (this.source) {
        const lookupKey = this.source_ip || this.source;
        const dev = devices[lookupKey.trim()];
        const name = dev?.nickName?.trim() ? dev.nickName : dev?.name;
        this.source_device = name;
      }
      this.parsed = true;
    }
  }

  type LogEntry = AccessLogEntry | DnsLogEntry;

  const filters = reactive({ source: '', target: '', inbound: '', outbound: '' });
  const showIp = reactive(new Set<string>());

  function toggleIp(key: string) {
    showIp.has(key) ? showIp.delete(key) : showIp.add(key);
  }

  const devices = computed(() => {
    const pairs = Object.values((window as any).xray.router.devices_online).flatMap((device: any) => [
      ...(device.ip ? [[device.ip, device]] : []),
      ...(device.ip6 ? [[device.ip6, device]] : []),
      ...(device.ip6_prefix ? [[device.ip6_prefix, device]] : [])
    ]);
    return Object.fromEntries(pairs);
  });

  const parsedLogs = computed<LogEntry[]>(() => {
    if (!logsContent.value) return [];
    return logsContent.value.split('\n').map((line) => {
      let m: RegExpMatchArray | null;
      m = line.match(ACCESS_RE);
      if (m) return new AccessLogEntry(m, devices.value);
      m = line.match(DNS_RE);
      if (m) return new DnsLogEntry(m, line);
      return new AccessLogEntry(undefined, undefined, line);
    });
  });

  const filteredLogs = computed<LogEntry[]>(() => {
    return parsedLogs.value.filter((l) => {
      if (!l.parsed || !(l instanceof AccessLogEntry)) return true;
      const src = filters.source.trim().toLowerCase();
      const tgt = filters.target.trim().toLowerCase();
      const inbound = filters.inbound.trim().toLowerCase();
      const outbound = filters.outbound.trim().toLowerCase();
      return (
        (!src || [l.source, l.source_ip, l.source_device].filter(Boolean).some((v) => v!.toLowerCase().includes(src))) &&
        (!tgt || [l.target, l.target_ip].filter(Boolean).some((v) => `${v}:${l.target_port}`.toLowerCase().includes(tgt))) &&
        (!inbound || l.inbound?.toLowerCase().includes(inbound)) &&
        (!outbound || l.outbound?.toLowerCase().includes(outbound))
      );
    });
  });

  const fetchLogs = async () => {
    if (!follow.value) return;
    await engine.submit(SubmitActions.fetchXrayLogs);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const response = await axios.get(file.value);
    if (response.data) logsContent.value = response.data;
  };

  const display = async () => {
    follow.value = true;
    refreshInterval = window.setInterval(fetchLogs, 2000);
    logsModal.value.show(() => {
      follow.value = false;
      logsContent.value = '';
      clearInterval(refreshInterval);
    });
    if (follow.value) await fetchLogs();
  };
</script>

<style scoped lang="scss">
  .log-card {
    background: #475a5f;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.45);
    overflow: hidden;
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
      gap: 0.5rem;
    }
  }

  .table-wrapper {
    max-height: 70vh;
    overflow: auto;
  }

  .modern-table {
    overflow: auto;
    width: 100%;
    border-collapse: collapse;
    font-family: 'JetBrains Mono', monospace;
    color: #fafafa;
    min-width: 650px;
    thead {
      position: sticky;
      background-color: #475a5f;
      top: 0;
      tr {
        th {
          text-align: center;
          input {
            width: 100%;
            padding: 0.5rem 0.5rem;
            border: 1px solid #475a5f;
            border-radius: 4px;
            background: #21333e;
            color: #eee;
            box-sizing: border-box;
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
        &.unparsed {
          color: #888;
        }
        td {
          padding: 0.5rem;
          white-space: nowrap;
          &.ellipsis {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .device {
            color: #00ff7f;
          }
          .resolved {
            border-bottom: 1px dotted rgba(255, 255, 255, 0.4);
            cursor: pointer;
          }
        }
      }
    }
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    border-radius: 4px;
    padding: 0 0.4rem;
    font-size: 0.75rem;
    line-height: 1rem;
    &.tcp {
      background: rgba(76, 194, 255, 0.15);
      color: #4cc2ff;
    }
    &.udp {
      background: rgba(255, 209, 102, 0.15);
      color: #ffd166;
    }
    &.direct {
      background: rgba(0, 255, 127, 0.15);
      color: #00ff7f;
    }
    &.rule {
      background: rgba(255, 107, 214, 0.15);
      color: #ff6bd6;
    }
    &.user {
      background: rgba(255, 230, 0, 0.15);
      color: #ffe600;
      font-style: italic;
      font-weight: 600;
    }
    &.dns {
      background: rgba(167, 81, 238, 0.15);
      color: #4a006d;
      font-weight: 600;
    }
    &.cache {
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
  .i-direct::before {
    content: '✓';
  }
  .i-rule::before {
    content: '❯';
  }
  .i-dns::before {
    content: '🌐';
  }

  .plain-log {
    max-height: 70vh;
    overflow: auto;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    background: #475a5f;
    padding: 1rem;
    color: white;
    overflow: auto;
    text-align: left;
  }

  pre::-webkit-scrollbar,
  .table-wrapper::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }
  pre::-webkit-scrollbar-thumb,
  .table-wrapper::-webkit-scrollbar-thumb {
    background: #21333e;
    border-radius: 4px;
  }
</style>
