<template>
  <div class="formfontdesc" v-if="logs">
    <table width="100%" class="FormTable">
      <thead>
        <tr>
          <td colspan="2">{{ $t('com.Logs.title') }}</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>{{ $t('com.Logs.type') }}</th>
          <td>
            <select class="input_option" v-model="file">
              <option :value="FILE_ACCESS" v-if="logs.access !== 'none'">Access Logs</option>
              <option :value="FILE_ERROR" v-if="logs.error !== 'none'">Error Logs</option>
            </select>
            <input class="button_gen button_gen_small" type="button" :value="$t('com.Logs.display')" @click.prevent="display()" />
            <modal ref="logsModal" width="85%" :title="$t('com.Logs.title')">
              <div class="modal-content">
                <div class="logs-area-row">
                  <pre class="logs-area-content" v-if="file === FILE_ERROR">{{ logsContent }}</pre>
                  <div v-if="file === FILE_ACCESS" class="scrollable-table">
                    <table class="FormTable logsTable">
                      <thead>
                        <tr>
                          <td>Time</td>
                          <td>Source</td>
                          <td>Target</td>
                          <td>Inbound</td>
                          <td>Outbound</td>
                        </tr>
                      </thead>
                      <tbody class="logs-area-content">
                        <tr v-for="log in filteredLogs" :key="log.line" :class="[{ parsed: log.parsed, unparsed: !log.parsed }, log.kind]">
                          <td v-if="!log.parsed" colspan="5">{{ log.line }}</td>
                          <template v-else-if="log.kind === 'access'">
                            <td>{{ log.time }}</td>
                            <td>
                              <span v-if="!log.source_device">{{ log.source }}</span>
                              <a v-else class="device" :title="log.source">{{ log.source_device }}</a>
                            </td>
                            <td>
                              <span :class="['log-label', log.type]">{{ log.type }}</span>
                              {{ log.target }}:{{ log.target_port }}
                            </td>
                            <td>{{ log.inbound }}</td>
                            <td>
                              <span v-if="log.routing" :class="['log-label', log.routing]">
                                {{ log.routing[0] }}
                              </span>
                              {{ log.outbound }}
                            </td>
                          </template>

                          <template v-else>
                            <td>{{ log.time }}</td>
                            <td colspan="2">
                              <span class="log-label dns">DNS</span>
                              {{ log.host }}
                            </td>
                            <td class="dns-answers ellipsis" :title="log.answers.join(', ')" colspan="2">
                              <span v-for="(ip, idx) in log.answers" :key="ip"> {{ ip }}<span v-if="idx < log.answers.length - 1">, </span> </span>
                              – {{ log.latency }} ms
                            </td>
                          </template>
                        </tr>
                      </tbody>
                      <tbody v-if="parsedLogs.length === 0">
                        <tr>
                          <td colspan="5">No logs available</td>
                        </tr>
                      </tbody>
                      <tbody>
                        <tr class="filter-row">
                          <td></td>
                          <td>
                            <input v-model.trim="filters.source" placeholder="🔎 source" class="input_20_table" />
                          </td>
                          <td>
                            <input v-model.trim="filters.target" placeholder="🔎 target" class="input_20_table" />
                          </td>
                          <td>
                            <input v-model.trim="filters.inbound" placeholder="🔎 inbound" class="input_20_table" />
                          </td>
                          <td>
                            <input v-model.trim="filters.outbound" placeholder="🔎 outbound" class="input_20_table" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </modal>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, reactive } from 'vue';
  import axios from 'axios';
  import engine, { SubmitActions } from '@/modules/Engine';
  import { XrayLogObject } from '@/modules/CommonObjects';
  import Modal from '@main/Modal.vue';
  class DnsLogEntry {
    public kind = 'dns' as const;
    public parsed = false;
    public time?: string;
    public host?: string;
    public answers: string[] = [];
    public latency?: number;
    public line?: string;

    constructor(match?: RegExpMatchArray, line?: string) {
      this.line = line;
      if (!match) return;

      try {
        const [, utcDateTimeStr, host, ips, latency] = match;

        // normalise timestamp to local time (same util code as AccessLogEntry)
        const iso = utcDateTimeStr.replace(/\//g, '-').replace(' ', 'T') + 'Z';
        this.time = new Date(iso).toLocaleTimeString([], {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        this.host = host;
        this.answers = ips.split(/\s*,\s*/);
        this.latency = Number(latency);
        this.parsed = true;
      } catch (err) {
        console.error('Error parsing DNS entry:', err);
      }
    }
  }
  class AccessLogEntry {
    public kind = 'access' as const;
    public time?: string;
    public source?: string;
    public source_port?: string;
    public source_device?: string;
    public type?: string;
    public target?: string;
    public target_port?: string;
    public inbound?: string;
    public routing?: string;
    public outbound?: string;
    public line?: string;
    public parsed: boolean = false;

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

      if (this.source) {
        const dev = devices[this.source.trim()];
        const name = dev?.nickName?.trim() ? dev.nickName : dev?.name;
        this.source_device = name;
      }

      this.parsed = true;
    }
  }
  type LogEntry = AccessLogEntry | DnsLogEntry;
  export default defineComponent({
    name: 'Logs',
    components: {
      Modal
    },
    props: {
      logs: {
        type: Object as () => XrayLogObject,
        required: true
      }
    },
    setup(props) {
      const follow = ref<boolean>(false);
      const logsModal = ref();
      let refreshInterval: number;

      const FILE_ACCESS = '/ext/xrayui/xray_access_partial.asp';
      const FILE_ERROR = '/ext/xrayui/xray_error_partial.asp';
      const file = ref<string>(FILE_ACCESS);
      const logsContent = ref<string>('');
      // Access log
      const ACCESS_RE =
        /^(?<time>.+)\.\d+\s+from\s+(?:tcp:|udp:)*(?:\[*)(?<source>.+?)(?:%.+)*(?:\]*\:)(?<source_port>\d+)\s+accepted\s+(?<type>tcp|udp)*(?:\:*)(?:\[*)(?<target>.+?)(?:\]*\:)(?<target_port>\d+)\s+\[(?<inbound>.+)\s+(?<routing>(?:>>|->))\s+(?<outbound>.+)?\]$/;

      // DNS “got answer” line
      const DNS_RE = /^(.+)\.\d+\s+from\s+(DNS)\s+accepted\s+(?:udp:)(.+?)\s+\[(.+?)\s+(->|>>)\s+(.+)\]$/;

      const filters = reactive({
        source: '',
        target: '',
        inbound: '',
        outbound: ''
      });

      const filteredLogs = computed<LogEntry[]>(() => {
        return parsedLogs.value.filter((l) => {
          if (!l.parsed || !(l instanceof AccessLogEntry)) return true;

          const src = filters.source.trim().toLowerCase();
          const tgt = filters.target.trim().toLowerCase();
          const inbound = filters.inbound.trim().toLowerCase();
          const outbound = filters.outbound.trim().toLowerCase();

          return (
            (!src || [l.source, l.source_device].filter(Boolean).some((v) => v!.toLowerCase().includes(src))) &&
            (!tgt || `${l.target}:${l.target_port}`.toLowerCase().includes(tgt)) &&
            (!inbound || l.inbound?.toLowerCase().includes(inbound)) &&
            (!outbound || l.outbound?.toLowerCase().includes(outbound))
          );
        });
      });

      const devices = computed(() => {
        const pairs = Object.values(window.xray.router.devices_online).flatMap((device) => [
          ...(device.ip ? [[device.ip, device]] : []),
          ...(device.ip6 ? [[device.ip6, device]] : []),
          ...(device.ip6_prefix ? [[device.ip6_prefix, device]] : [])
        ]);
        return Object.fromEntries(pairs);
      });

      const parsedLogs = computed<LogEntry[]>(() => {
        if (!logsContent.value) return [];
        return logsContent.value
          .split('\n')
          .map((line) => {
            let m;
            m = line.match(ACCESS_RE);
            if (m) return new AccessLogEntry(m, devices.value);
            m = line.match(DNS_RE);
            if (m) return new DnsLogEntry(m, line);
            return new AccessLogEntry(undefined, undefined, line);
          })
          .filter((entry): entry is AccessLogEntry => entry !== null);
      });

      const fetchLogs = async () => {
        if (!follow.value) return;
        try {
          await engine.submit(SubmitActions.fetchXrayLogs);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const response = await axios.get(file.value);
          if (response.data) {
            logsContent.value = response.data;
          }
        } catch (error) {
          console.error('Error fetching logs:', error);
        }
      };

      const display = async () => {
        follow.value = true;
        refreshInterval = window.setInterval(fetchLogs, 2000);
        logsModal.value.show(() => {
          follow.value = false;
          logsContent.value = '';
          clearInterval(refreshInterval);
        });
        if (follow.value) {
          await fetchLogs();
        }
      };

      return {
        follow,
        logsModal,
        file,
        logs: props.logs,
        logsContent,
        parsedLogs,
        FILE_ACCESS,
        FILE_ERROR,
        filters,
        display,
        filteredLogs
      };
    }
  });
</script>

<style lang="scss" scoped>
  .log-label {
    font-weight: bold;
    &.tcp {
      color: #4cc2ff;
    }
    &.udp {
      color: #ffd166;
    }
    &.direct {
      color: #00ff7f;
    }
    &.rule {
      color: #ff6bd6;
    }
  }

  .scrollable-table {
    max-height: 600px;
    overflow-y: auto;
    display: block;
    scrollbar-width: thin;
    scrollbar-color: $scrollbar-thumb $scrollbar-track;

    table {
      width: 100%;
      border-collapse: collapse;

      th,
      td {
        border-color: #888;
        .device {
          font-weight: bold;
          color: #00ff7f;
        }
      }
    }
  }

  .logs-area-row {
    padding: 0;
    margin: 0;
    overflow: hidden;
  }

  .logs-area-content {
    line-height: normal;
    max-height: 200px;
    width: 100%;
    max-width: 738px;
    overflow-x: scroll;
    overflow-y: scroll;
    margin: 0;
    color: #ffffff;
    background-color: #576d73;
    font-family: Courier New, Courier, monospace;
    font-size: 11px;
    scrollbar-width: thin;
    scrollbar-color: $scrollbar-thumb $scrollbar-track;

    td {
      overflow: hidden;
      text-wrap: none;
      white-space: nowrap;

      &.ellipsis {
        max-width: 350px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
    tr.unparsed td {
      color: #888;
    }

    .filter-row {
      background: #2b3538;
    }
  }
</style>
