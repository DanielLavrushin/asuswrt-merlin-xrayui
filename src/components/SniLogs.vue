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
          </div>

          <div class="table-wrapper">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>
                    <input v-model.trim="filters.protocol" placeholder="🔎 protocol" />
                  </th>
                  <th>
                    <input v-model.trim="filters.source" placeholder="🔎 source" />
                  </th>
                  <th>
                    <input v-model.trim="filters.destination" placeholder="🔎 destination" />
                  </th>
                  <th>
                    <input v-model.trim="filters.sni" placeholder="🔎 SNI" />
                  </th>
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
                </tr>

                <tr v-if="parsedLogs.length === 0">
                  <td colspan="5" class="empty-message">
                    {{ $t('com.SniLogs.no_logs') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <template v-slot:footer>
          <div class="modal-footer">
            <div class="footer-left">
              <span class="log-count">{{ filteredLogs.length }} / {{ parsedLogs.length }} logs</span>
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
  import { ref, computed, reactive, onUnmounted } from 'vue';
  import axios from 'axios';
  import Modal from '@main/Modal.vue';
  import engine, { SubmitActions } from '@modules/Engine';

  const SNI_LOG_ENDPOINT = '/ext/xrayui/b4sni.json';
  const sniModal = ref();
  const modal_width = ref('65%');
  const logsContent = ref('');
  const refreshInterval = ref<number>();
  const isb4sniRunning = computed(() => {
    return window.xray?.server?.b4sni_isRunning;
  });

  interface SniLogEntry {
    time: string;
    protocol: string;
    sourceIp: string;
    sourcePort: string;
    source: string; // Full source address
    sourceDevice?: string;
    destinationIp: string;
    destinationPort: string;
    sni: string;
    raw?: string;
  }

  const filters = reactive({
    protocol: '',
    source: '',
    destination: '',
    sni: ''
  });

  // Get device mapping from window.xray if available
  const devices = computed(() => {
    if (!window.xray?.router?.devices_online) return {};
    const pairs = Object.values(window.xray.router.devices_online).flatMap((device: any) => [
      ...(device.ip ? [[device.ip, device]] : []),
      ...(device.ip6 ? [[device.ip6, device]] : []),
      ...(device.ip6_prefix ? [[device.ip6_prefix, device]] : [])
    ]);
    return Object.fromEntries(pairs);
  });

  // Validate if line matches expected SNI log format
  const isValidSniLogLine = (line: string): boolean => {
    const parts = line.split(',');
    if (parts.length < 5) return false;

    const [timestamp, protocol, source, destination] = parts;

    // Check timestamp format (HH:MM:SS.mmm or similar)
    if (!timestamp || !timestamp.match(/^\d{1,2}:\d{2}:\d{2}\.\d{3}$/)) {
      return false;
    }

    // Check protocol
    if (!protocol || !['TCP', 'UDP'].includes(protocol.toUpperCase())) {
      return false;
    }

    // Check source format (IP:port)
    if (!source || !source.includes(':')) {
      return false;
    }

    // Check destination format (IP:port)
    if (!destination || !destination.includes(':')) {
      return false;
    }

    return true;
  };

  const parsedLogs = computed<SniLogEntry[]>(() => {
    if (!logsContent.value) return [];

    const logs = logsContent.value
      .split('\n')
      .filter((line) => line.trim())
      .filter(isValidSniLogLine) // Filter out non-SNI log lines
      .map((line) => {
        const parts = line.split(',');
        const [timestamp, protocol, source, destination, ...sniParts] = parts;
        const sni = sniParts.join(','); // In case SNI contains commas

        // Parse source
        const lastColonIndex = source.lastIndexOf(':');
        const sourceIp = source.substring(0, lastColonIndex);
        const sourcePort = source.substring(lastColonIndex + 1);

        // Parse destination
        const destColonIndex = destination.lastIndexOf(':');
        const destinationIp = destination.substring(0, destColonIndex);
        const destinationPort = destination.substring(destColonIndex + 1);

        // Format time (remove milliseconds)
        const formattedTime = timestamp.split('.')[0];

        // Look up device name
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
      .reverse(); // Reverse to show most recent first

    return logs;
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

  const stats = computed(() => {
    if (!parsedLogs.value.length) return null;

    const tcpCount = parsedLogs.value.filter((l) => l.protocol === 'TCP').length;
    const udpCount = parsedLogs.value.filter((l) => l.protocol === 'UDP').length;
    const uniqueSni = new Set(parsedLogs.value.map((l) => l.sni).filter(Boolean)).size;

    return {
      total: parsedLogs.value.length,
      tcp: tcpCount,
      udp: udpCount,
      uniqueSni
    };
  });

  const fetchLogs = async () => {
    try {
      const response = await axios.get(SNI_LOG_ENDPOINT, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
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
      // Cleanup on close
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
      }
      logsContent.value = '';
    });

    refreshInterval.value = window.setInterval(fetchLogs, 3000);
  };

  const exportCsv = () => {
    const headers = ['Time', 'Protocol', 'Source IP', 'Source Port', 'Device', 'Dest IP', 'Dest Port', 'SNI'];
    const rows = filteredLogs.value.map((log) => [log.time, log.protocol, log.sourceIp, log.sourcePort, log.sourceDevice || '', log.destinationIp, log.destinationPort, log.sni]);

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sni-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  onUnmounted(() => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
    }
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

  .refresh-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #fff;
    cursor: pointer;

    input[type='checkbox'] {
      cursor: pointer;
    }
  }

  .stats-bar {
    display: flex;
    gap: 2rem;
    padding: 0.75rem 1rem;
    background: #3a484c;
    border-bottom: 1px solid #2a3438;

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

    .sni-domain {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
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

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;

    .footer-left {
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

  // Scrollbar styling
  .table-wrapper::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }

  .table-wrapper::-webkit-scrollbar-thumb {
    background: #21333e;
    border-radius: 4px;
  }

  .table-wrapper::-webkit-scrollbar-track {
    background: #475a5f;
  }
</style>
