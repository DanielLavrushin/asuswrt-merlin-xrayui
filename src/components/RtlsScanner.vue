<template>
  <tr>
    <th>
      {{ $t('com.Rtls.manager') }}
      <hint v-html="$t('com.Rtls.hint')"></hint>
    </th>
    <td>
      <span class="row-buttons">
        <input class="button_gen button_gen_small" type="button" :value="$t('com.Rtls.scan')" @click.prevent="show_rtls_modal()" />
      </span>
      <modal ref="modal" :title="$t('com.Rtls.manager')" width="900">
        <table class="FormTable modal-form-table">
          <tbody>
            <tr>
              <th>
                {{ $t('com.Rtls.ip_label') }}
                <hint v-html="$t('com.Rtls.ip_hint')"></hint>
              </th>
              <td>
                <input
                  type="text"
                  maxlength="15"
                  class="input_20_table"
                  v-model="rtls.ip"
                  onkeypress="return validator.isIPAddr(this, event);"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                />
                <select class="input_option" v-model="rtls.cidr">
                  <option v-for="cidr in cidrs" :key="cidr" :value="cidr">{{ cidr }}</option>
                </select>
                <span class="hint-color"></span>
              </td>
            </tr>
            <tr>
              <th>
                {{ $t('com.Rtls.timeout_label') }}
                <hint v-html="$t('com.Rtls.timeout_hint')"></hint>
              </th>
              <td>
                <input
                  type="number"
                  maxlength="5"
                  class="input_6_table"
                  v-model="rtls.timeout"
                  autocorrect="off"
                  autocapitalize="off"
                  onkeypress="return validator.isNumber(this,event);"
                />
                <span class="hint-color">default: 5</span>
              </td>
            </tr>
            <tr>
              <th>
                {{ $t('com.Rtls.threads_label') }}
                <hint v-html="$t('com.Rtls.threads_hint')"></hint>
              </th>
              <td>
                <input
                  type="number"
                  maxlength="5"
                  class="input_6_table"
                  v-model="rtls.threads"
                  autocorrect="off"
                  autocapitalize="off"
                  onkeypress="return validator.isNumber(this,event);"
                />
                <span class="hint-color">default: 5000</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="rtls-grid">
          <div class="rtls-radar-pane">
            <rtls-radar :width="300" :height="300" :points="radarPoints" :highlightIp="closest?.ip || ''" />
          </div>

          <div class="rtls-side-pane">
            <div class="summary">
              <div class="card">
                <div class="label">{{ $t('com.Rtls.found') || 'Found' }}</div>
                <div class="value">{{ totalFound }}</div>
              </div>
              <div class="card">
                <div class="label">{{ $t('com.Rtls.issuers') || 'Issuers' }}</div>
                <div class="value">{{ uniqueIssuersCount }}</div>
              </div>
              <div class="card">
                <div class="label">{{ $t('com.Rtls.countries') || 'Countries' }}</div>
                <div class="value">{{ uniqueCountriesCount }}</div>
              </div>
              <div class="card card-closest">
                <div class="label">{{ $t('com.Rtls.closest') || 'Closest' }}</div>
                <div class="value">{{ closest ? closest.domain || closest.ip : '-' }}</div>
              </div>
            </div>

            <div class="controls">
              <input class="input_20_table input_small" type="text" v-model="filterText" :placeholder="$t('com.Rtls.search') || 'Search...'" />
              <select class="input_option input_small" v-model="issuerFilter">
                <option value="All">{{ $t('com.Rtls.issuer_filter') || 'Issuer: All' }}</option>
                <option v-for="i in issuers" :key="i" :value="i">{{ i }}</option>
              </select>
              <select class="input_option input_small" v-model="countryFilter">
                <option value="All">{{ $t('com.Rtls.country_filter') || 'Country: All' }}</option>
                <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
              </select>
              <select class="input_option input_small" v-model="sortKey">
                <option value="proximity">{{ $t('com.Rtls.sort_by_proximity') || 'Sort: Proximity' }}</option>
                <option value="ip">{{ $t('com.Rtls.sort_by_ip') || 'Sort: IP' }}</option>
                <option value="domain">{{ $t('com.Rtls.sort_by_domain') || 'Sort: Domain' }}</option>
              </select>

              <label class="checkbox_label" style="width: 100%"> <input type="checkbox" v-model="sortAsc" /> {{ $t('com.Rtls.sort_asc') || 'Asc' }} </label>
            </div>
          </div>

          <div class="rtls-table">
            <table class="FormTable modal-form-table">
              <thead>
                <tr class="row_title">
                  <td>{{ $t('com.Rtls.result_ip') }}</td>
                  <td>{{ $t('com.Rtls.result_domain') }}</td>
                  <td>{{ $t('com.Rtls.result_issuer') }}</td>
                  <td>{{ $t('com.Rtls.result_country') }}</td>
                  <td>{{ $t('com.Rtls.result_proximity') }}</td>
                </tr>
              </thead>
              <tbody>
                <tr v-for="result in filteredSortedResults" :key="result.ip">
                  <td>{{ result.ip }}</td>
                  <td>{{ result.domain }}</td>
                  <td>{{ result.issuer }}</td>
                  <td>{{ result.country }}</td>
                  <td class="proximity-cell">
                    <div class="bar-container">
                      <div class="bar" :style="{ width: Math.round(result.proximity * 100) + '%' }"></div>
                    </div>
                    <span class="bar-label">{{ Math.round(result.proximity * 100) }}%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <template v-slot:footer>
          <label class="scan-progress" v-if="scanIsRunning">{{ $t('com.Rtls.scan_progress') }}</label>
          <input v-if="!scanIsRunning" class="button_gen button_gen_small" type="button" :value="$t('com.Rtls.scan_start')" @click.prevent="scan_start()" />
          <input v-if="scanIsRunning" class="button_gen button_gen_small" type="button" :value="$t('com.Rtls.scan_stop')" @click.prevent="scan_stop()" />
        </template>
      </modal>
    </td>
  </tr>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, onUnmounted } from 'vue';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import RtlsRadar from '@main/RtlsRadar.vue';
  import engine, { SubmitActions } from '@/modules/Engine';
  import { useI18n } from 'vue-i18n';

  class RtlsScanner {
    public ip: string = '';
    public cidr: string = '/16';
    public timeout: number = 5;
    public threads: number = 1000;
  }

  class RtlsResult {
    public ip: string = '';
    public origin: string = '';
    public domain: string = '';
    public issuer: string = '';
    public country: string = '';
    public ipInt: number = 0;
    public distance: number = 0;
    public positionRatio: number = 0;
    public proximity: number = 0;
  }

  export default defineComponent({
    name: 'RtlsScanner',
    components: { Modal, Hint, RtlsRadar },
    setup() {
      const { t } = useI18n();
      const modal = ref();
      const rtls = ref(new RtlsScanner());
      const scanIsRunning = ref(false);
      const scanResults = ref<RtlsResult[]>([]);
      let refreshInterval: number | undefined;

      const show_rtls_modal = () => {
        modal.value?.show();
      };

      const cidrs: string[] = [];
      for (let i = 8; i <= 30; i += 4) cidrs.push('/' + i);

      const scan_start = async () => {
        scanIsRunning.value = true;
        scanResults.value = [];
        await engine.executeWithLoadingProgress(async () => {
          engine.submit(SubmitActions.rtlsScanStart, rtls.value, 0);
        }, false);
        refreshInterval = window.setInterval(scan_check_results, 1000);
      };

      const scan_stop = async () => {
        scanIsRunning.value = false;
        await engine.executeWithLoadingProgress(async () => {
          engine.submit(SubmitActions.rtlsScanStop);
        }, false);
        if (refreshInterval) {
          window.clearInterval(refreshInterval);
          refreshInterval = undefined;
        }
      };

      const scan_check_results = async () => {
        const results = await engine.loadsRtlsResults();
        scanResults.value = scan_result_parse(results);
        if (results) {
          if (results.indexOf('Scanning completed') !== -1) {
            if (refreshInterval) {
              window.clearInterval(refreshInterval);
              refreshInterval = undefined;
            }
            scanIsRunning.value = false;
          }
        }
      };

      const scan_result_parse = (data: string | undefined): RtlsResult[] => {
        const results: RtlsResult[] = [];
        if (!data) return results;
        const lines = data.split('\n');
        for (const line of lines.slice(1)) {
          if (!line.trim() || line.indexOf('Scanning completed') !== -1) continue;
          const parts = line.split(',');
          if (parts.length === 5) {
            const result = new RtlsResult();
            result.ip = parts[0];
            result.origin = parts[1];
            result.domain = parts[2];
            result.issuer = parts[3];
            result.country = parts[4];
            results.push(result);
          }
        }
        return results;
      };

      const ipv4ToInt = (ip: string): number => {
        const a = ip.split('.').map((x) => parseInt(x, 10));
        if (a.length !== 4 || a.some((n) => isNaN(n))) return 0;
        return (((a[0] << 24) >>> 0) + ((a[1] << 16) >>> 0) + ((a[2] << 8) >>> 0) + (a[3] >>> 0)) >>> 0;
      };

      const maskFromLength = (len: number): number => {
        if (len <= 0) return 0;
        if (len >= 32) return 0xffffffff >>> 0;
        return ((0xffffffff << (32 - len)) >>> 0) >>> 0;
      };

      const cidrLen = computed(() => parseInt(rtls.value.cidr.replace('/', ''), 10));
      const rtlsIpInt = computed(() => ipv4ToInt(rtls.value.ip));
      const netMask = computed(() => maskFromLength(cidrLen.value));
      const networkStart = computed(() => (rtlsIpInt.value & netMask.value) >>> 0);
      const networkSize = computed(() => Math.pow(2, 32 - cidrLen.value));
      const networkEnd = computed(() => (networkStart.value + networkSize.value - 1) >>> 0);
      const maxDistance = computed(() => Math.max(rtlsIpInt.value - networkStart.value, networkEnd.value - rtlsIpInt.value));

      const enhancedResults = computed(() =>
        scanResults.value.map((r) => {
          const ipInt = ipv4ToInt(r.ip);
          const distance = Math.abs(ipInt - rtlsIpInt.value);
          const span = networkEnd.value - networkStart.value || 1;
          const positionRatio = Math.min(Math.max((ipInt - networkStart.value) / span, 0), 1);
          const proximity = maxDistance.value === 0 ? 1 : Math.max(0, Math.min(1, 1 - distance / maxDistance.value));
          return Object.assign(new RtlsResult(), r, { ipInt, distance, positionRatio, proximity });
        })
      );

      const issuers = computed(() => Array.from(new Set(enhancedResults.value.map((r) => r.issuer).filter(Boolean))).sort());
      const countries = computed(() => Array.from(new Set(enhancedResults.value.map((r) => r.country).filter(Boolean))).sort());

      const filterText = ref('');
      const issuerFilter = ref('All');
      const countryFilter = ref('All');
      const sortKey = ref<'proximity' | 'ip' | 'domain'>('proximity');
      const sortAsc = ref(false);

      const filteredSortedResults = computed(() => {
        let list = enhancedResults.value;
        const q = filterText.value.trim().toLowerCase();
        if (q) list = list.filter((r) => (r.domain || '').toLowerCase().includes(q) || r.ip.includes(q) || (r.issuer || '').toLowerCase().includes(q));
        if (issuerFilter.value !== 'All') list = list.filter((r) => r.issuer === issuerFilter.value);
        if (countryFilter.value !== 'All') list = list.filter((r) => r.country === countryFilter.value);
        const sorted = [...list].sort((a, b) => {
          if (sortKey.value === 'domain') {
            const va = a.domain || '';
            const vb = b.domain || '';
            return sortAsc.value ? va.localeCompare(vb) : vb.localeCompare(va);
          }
          if (sortKey.value === 'ip') {
            return sortAsc.value ? a.ipInt - b.ipInt : b.ipInt - a.ipInt;
          }
          return sortAsc.value ? a.proximity - b.proximity : b.proximity - a.proximity;
        });
        return sorted;
      });

      const closest = computed(() => {
        if (!enhancedResults.value.length) return undefined;
        return [...enhancedResults.value].sort((a, b) => a.distance - b.distance)[0];
      });

      const radarPoints = computed(() =>
        enhancedResults.value.map((r) => ({
          angle: 2 * Math.PI * r.positionRatio,
          radius: 1 - r.proximity,
          ip: r.ip,
          domain: r.domain,
          proximity: r.proximity
        }))
      );

      const totalFound = computed(() => enhancedResults.value.length);
      const uniqueIssuersCount = computed(() => issuers.value.length);
      const uniqueCountriesCount = computed(() => countries.value.length);

      onUnmounted(() => {
        if (refreshInterval) window.clearInterval(refreshInterval);
      });

      return {
        t,
        modal,
        rtls,
        cidrs,
        scanIsRunning,
        scanResults,
        show_rtls_modal,
        scan_start,
        scan_stop,
        filterText,
        issuerFilter,
        countryFilter,
        sortKey,
        sortAsc,
        filteredSortedResults,
        issuers,
        countries,
        radarPoints,
        closest,
        totalFound,
        uniqueIssuersCount,
        uniqueCountriesCount
      };
    }
  });
</script>

<style scoped lang="scss">
  .scan-progress {
    float: left;
    color: #fc0;
  }
  .rtls-grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    grid-template-areas:
      'radar side'
      'table table';
    gap: 14px 18px;
    align-items: start;
  }

  .rtls-radar-pane {
    grid-area: radar;
  }

  .rtls-side-pane {
    grid-area: side;
    display: grid;
    grid-template-rows: auto auto;
    gap: 12px;
  }

  .rtls-table {
    grid-area: table;
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .summary .card {
    background: #353d40;
    border: 1px solid #222728;
    border-radius: 6px;
    padding: 8px 10px;
    min-height: 56px;
    text-align: center;
    color: #fff;
    box-shadow: 0 0 2px #000;
  }

  .summary .label {
    font-size: 12px;
    opacity: 0.8;
  }
  .summary .value {
    font-weight: 700;
    font-size: 18px;
    margin-top: 2px;
    color: #fff;
  }

  .summary .card-closest {
    grid-column: 1 / -1;
  }

  @media (max-width: 920px) {
    .summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .summary .card-closest {
      grid-column: 1 / -1;
    }
  }

  .controls {
    background: #353d40;
    border: 1px solid #222728;
    border-radius: 6px;
    padding: 8px 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .input_small {
    width: 180px;
  }

  .bar-container {
    width: 120px;
    height: 8px;
    background: #576d73;
    border: 1px solid #929ea1;
    border-radius: 4px;
    overflow: hidden;
    display: inline-block;
    vertical-align: middle;
    margin-right: 8px;
  }

  .bar {
    height: 100%;
    background: $c_yellow;
  }

  .proximity-cell {
    white-space: nowrap;
  }

  .checkbox_label {
    font-size: 12px;
    opacity: 0.9;
  }

  @media (max-width: 920px) {
    .rtls-grid {
      grid-template-columns: 1fr;
      grid-template-areas:
        'radar'
        'side'
        'table';
    }
    .summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
