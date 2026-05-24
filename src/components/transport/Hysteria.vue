<template>
  <tbody v-if="transport.hysteriaSettings">
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_auth') }}
        <hint v-html="$t('com.NetworkHysteria.hint_auth')"></hint>
      </th>
      <td>
        <input type="text" class="input_25_table" v-model="transport.hysteriaSettings.auth" autocomplete="off" autocorrect="off" autocapitalize="off" />
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_congestion') }}
        <hint v-html="$t('com.NetworkHysteria.hint_congestion')"></hint>
      </th>
      <td>
        <select class="input_option" v-model="congestion">
          <option v-for="(opt, index) in congestionOptions" :key="index" :value="opt">{{ opt === '' ? 'auto' : opt }}</option>
        </select>
        <span class="hint-color">auto: brutal (with up) or bbr (without up)</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_up') }}
        <hint v-html="$t('com.NetworkHysteria.hint_up')"></hint>
      </th>
      <td>
        <input type="text" class="input_15_table" v-model="brutalUp" autocomplete="off" autocorrect="off" autocapitalize="off" />
        <span class="hint-color">e.g., 100 mbps</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_down') }}
        <hint v-html="$t('com.NetworkHysteria.hint_down')"></hint>
      </th>
      <td>
        <input type="text" class="input_15_table" v-model="brutalDown" autocomplete="off" autocorrect="off" autocapitalize="off" />
        <span class="hint-color">e.g., 100 mbps</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_udphop_enabled') }}
        <hint v-html="$t('com.NetworkHysteria.hint_udphop_enabled')"></hint>
      </th>
      <td>
        <input type="checkbox" v-model="udphopEnabled" />
      </td>
    </tr>
    <tr v-if="udphopEnabled">
      <th>
        {{ $t('com.NetworkHysteria.label_udphop_port') }}
        <hint v-html="$t('com.NetworkHysteria.hint_udphop_port')"></hint>
      </th>
      <td>
        <input type="text" class="input_15_table" v-model="transport.hysteriaSettings.udphop!.port" autocomplete="off" autocorrect="off" autocapitalize="off" />
        <span class="hint-color">e.g., 20000-50000</span>
      </td>
    </tr>
    <tr v-if="udphopEnabled">
      <th>
        {{ $t('com.NetworkHysteria.label_udphop_interval') }}
        <hint v-html="$t('com.NetworkHysteria.hint_udphop_interval')"></hint>
      </th>
      <td>
        <input type="number" class="input_6_table" v-model.number="transport.hysteriaSettings.udphop!.interval" autocomplete="off" autocorrect="off" autocapitalize="off" />
        <span class="hint-color">default: 30 (seconds)</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_udp_idle_timeout') }}
        <hint v-html="$t('com.NetworkHysteria.hint_udp_idle_timeout')"></hint>
      </th>
      <td>
        <input type="number" class="input_6_table" v-model.number="transport.hysteriaSettings.udpIdleTimeout" autocomplete="off" autocorrect="off" autocapitalize="off" />
        <span class="hint-color">default: 60 (seconds)</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_finalmask_enabled') }}
        <hint v-html="$t('com.NetworkHysteria.hint_finalmask_enabled')"></hint>
      </th>
      <td>
        <input type="checkbox" v-model="finalmaskEnabled" />
      </td>
    </tr>
    <template v-if="finalmaskEnabled && transport.finalmask?.udp && transport.finalmask?.udp.length > 0">
      <tr>
        <th>
          {{ $t('com.NetworkHysteria.label_finalmask_type') }}
          <hint v-html="$t('com.NetworkHysteria.hint_finalmask_type')"></hint>
        </th>
        <td>
          <select class="input_option" v-model="transport.finalmask!.udp![0].type" @change="onMaskTypeChange">
            <option v-for="mt in maskTypes" :key="mt" :value="mt">{{ mt }}</option>
          </select>
        </td>
      </tr>
      <tr v-if="hasPassword">
        <th>
          {{ $t('com.NetworkHysteria.label_finalmask_password') }}
          <hint v-html="$t('com.NetworkHysteria.hint_finalmask_password')"></hint>
        </th>
        <td>
          <input type="text" class="input_25_table" v-model="finalmaskPassword" autocomplete="off" autocorrect="off" autocapitalize="off" />
        </td>
      </tr>
      <tr v-if="hasDomain">
        <th>
          {{ $t('com.NetworkHysteria.label_finalmask_domain') }}
        </th>
        <td>
          <input type="text" class="input_25_table" v-model="finalmaskDomain" autocomplete="off" autocorrect="off" autocapitalize="off" />
          <span class="hint-color">e.g., t.example.com</span>
        </td>
      </tr>
      <template v-if="transport.finalmask?.udp[0].type === 'sudoku'">
        <tr>
          <th>
            {{ $t('com.NetworkHysteria.label_sudoku_ascii') }}
            <hint v-html="$t('com.NetworkHysteria.hint_sudoku_ascii')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="sudokuSettings.ascii">
              <option v-for="opt in sudokuAsciiOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.NetworkHysteria.label_sudoku_padding_min') }}
            <hint v-html="$t('com.NetworkHysteria.hint_sudoku_padding')"></hint>
          </th>
          <td>
            <input type="number" class="input_6_table" v-model.number="sudokuSettings.paddingMin" min="0" max="100" />
            <span class="hint-color">0-100 (%)</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.NetworkHysteria.label_sudoku_padding_max') }}
            <hint v-html="$t('com.NetworkHysteria.hint_sudoku_padding')"></hint>
          </th>
          <td>
            <input type="number" class="input_6_table" v-model.number="sudokuSettings.paddingMax" min="0" max="100" />
            <span class="hint-color">0-100 (%)</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.NetworkHysteria.label_sudoku_custom_tables') }}
            <hint v-html="$t('com.NetworkHysteria.hint_sudoku_custom_tables')"></hint>
          </th>
          <td>
            <input type="text" class="input_25_table" v-model="sudokuCustomTablesStr" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">comma-separated 8-char patterns (2x, 2p, 4v)</span>
          </td>
        </tr>
      </template>
    </template>
    <tr>
      <th>
        {{ $t('com.NetworkHysteria.label_masquerade_enabled') }}
        <hint v-html="$t('com.NetworkHysteria.hint_masquerade_enabled')"></hint>
      </th>
      <td>
        <input type="checkbox" v-model="masqueradeEnabled" />
      </td>
    </tr>
    <template v-if="masqueradeEnabled && transport.hysteriaSettings.masquerade">
      <tr>
        <th>
          {{ $t('com.NetworkHysteria.label_masquerade_type') }}
          <hint v-html="$t('com.NetworkHysteria.hint_masquerade_type')"></hint>
        </th>
        <td>
          <select class="input_option" v-model="transport.hysteriaSettings.masquerade.type">
            <option v-for="(opt, index) in masqueradeTypes" :key="index" :value="opt">{{ opt === '' ? 'default (404)' : opt }}</option>
          </select>
        </td>
      </tr>
      <tr v-if="transport.hysteriaSettings.masquerade.type === 'file'">
        <th>
          {{ $t('com.NetworkHysteria.label_masquerade_dir') }}
          <hint v-html="$t('com.NetworkHysteria.hint_masquerade_dir')"></hint>
        </th>
        <td>
          <input type="text" class="input_25_table" v-model="transport.hysteriaSettings.masquerade.dir" autocomplete="off" autocorrect="off" autocapitalize="off" />
        </td>
      </tr>
      <tr v-if="transport.hysteriaSettings.masquerade.type === 'proxy'">
        <th>
          {{ $t('com.NetworkHysteria.label_masquerade_url') }}
          <hint v-html="$t('com.NetworkHysteria.hint_masquerade_url')"></hint>
        </th>
        <td>
          <input type="text" class="input_25_table" v-model="transport.hysteriaSettings.masquerade.url" autocomplete="off" autocorrect="off" autocapitalize="off" />
        </td>
      </tr>
      <tr v-if="transport.hysteriaSettings.masquerade.type === 'proxy'">
        <th>
          {{ $t('com.NetworkHysteria.label_masquerade_rewrite_host') }}
          <hint v-html="$t('com.NetworkHysteria.hint_masquerade_rewrite_host')"></hint>
        </th>
        <td>
          <input type="checkbox" v-model="transport.hysteriaSettings.masquerade.rewriteHost" />
        </td>
      </tr>
      <tr v-if="transport.hysteriaSettings.masquerade.type === 'proxy'">
        <th>
          {{ $t('com.NetworkHysteria.label_masquerade_insecure') }}
          <hint v-html="$t('com.NetworkHysteria.hint_masquerade_insecure')"></hint>
        </th>
        <td>
          <input type="checkbox" v-model="transport.hysteriaSettings.masquerade.insecure" />
        </td>
      </tr>
      <tr v-if="transport.hysteriaSettings.masquerade.type === 'string'">
        <th>
          {{ $t('com.NetworkHysteria.label_masquerade_content') }}
          <hint v-html="$t('com.NetworkHysteria.hint_masquerade_content')"></hint>
        </th>
        <td>
          <input type="text" class="input_25_table" v-model="transport.hysteriaSettings.masquerade.content" autocomplete="off" autocorrect="off" autocapitalize="off" />
        </td>
      </tr>
      <tr v-if="transport.hysteriaSettings.masquerade.type === 'string'">
        <th>
          {{ $t('com.NetworkHysteria.label_masquerade_status_code') }}
          <hint v-html="$t('com.NetworkHysteria.hint_masquerade_status_code')"></hint>
        </th>
        <td>
          <input type="number" class="input_6_table" v-model.number="transport.hysteriaSettings.masquerade.statusCode" autocomplete="off" autocorrect="off" autocapitalize="off" />
        </td>
      </tr>
    </template>
  </tbody>
</template>

<script lang="ts">
  import { defineComponent, ref, computed } from 'vue';
  import Hint from '@main/Hint.vue';
  import { XrayStreamSettingsObject } from '@/modules/CommonObjects';
  import { XrayHysteriaMasqueradeObject, XrayUdpHopObject, XrayFinalMaskObject, XrayFinalMaskSettingsObject, XrayQuicParamsObject, XraySalamanderObject, XraySudokuObject } from '@/modules/TransportObjects';

  const passwordTypes = new Set(['salamander', 'mkcp-aes128gcm', 'sudoku']);
  const domainTypes = new Set(['header-dns', 'xdns']);

  export default defineComponent({
    name: 'NetworkHysteria',
    components: {
      Hint
    },
    props: {
      transport: XrayStreamSettingsObject
    },
    setup(props) {
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
      const congestionOptions = ['', ...XrayQuicParamsObject.congestionOptions];

      const ensureQuicParams = (): XrayQuicParamsObject => {
        if (!transport.value.finalmask) transport.value.finalmask = new XrayFinalMaskSettingsObject();
        if (!transport.value.finalmask.quicParams) transport.value.finalmask.quicParams = new XrayQuicParamsObject();
        return transport.value.finalmask.quicParams;
      };

      const congestion = computed({
        get: () => transport.value.finalmask?.quicParams?.congestion ?? '',
        set: (val: string) => {
          if (!val) {
            if (transport.value.finalmask?.quicParams) transport.value.finalmask.quicParams.congestion = undefined;
          } else {
            ensureQuicParams().congestion = val;
          }
        }
      });

      const brutalUp = computed({
        get: () => (transport.value.finalmask?.quicParams?.brutalUp ?? '').toString(),
        set: (val: string) => {
          if (!val) {
            if (transport.value.finalmask?.quicParams) transport.value.finalmask.quicParams.brutalUp = undefined;
          } else {
            ensureQuicParams().brutalUp = val;
          }
        }
      });

      const brutalDown = computed({
        get: () => (transport.value.finalmask?.quicParams?.brutalDown ?? '').toString(),
        set: (val: string) => {
          if (!val) {
            if (transport.value.finalmask?.quicParams) transport.value.finalmask.quicParams.brutalDown = undefined;
          } else {
            ensureQuicParams().brutalDown = val;
          }
        }
      });

      const udphopEnabled = computed({
        get: () => !!transport.value.hysteriaSettings?.udphop,
        set: (val) => {
          if (!transport.value.hysteriaSettings) return;
          if (val) {
            transport.value.hysteriaSettings.udphop = new XrayUdpHopObject();
          } else {
            transport.value.hysteriaSettings.udphop = undefined;
          }
        }
      });

      const maskTypes = XrayFinalMaskObject.udpMaskTypes;
      const sudokuAsciiOptions = XraySudokuObject.asciiOptions;

      const finalmaskEnabled = computed({
        get: () => !!(transport.value.finalmask?.udp && transport.value.finalmask.udp.length > 0),
        set: (val) => {
          if (val) {
            const finalMask = new XrayFinalMaskObject();
            finalMask.settings = new XraySalamanderObject();
            if (!transport.value.finalmask) transport.value.finalmask = new XrayFinalMaskSettingsObject();
            transport.value.finalmask.udp = [finalMask];
          } else if (transport.value.finalmask) {
            transport.value.finalmask.udp = undefined;
          }
        }
      });

      const onMaskTypeChange = () => {
        const mask = transport.value.finalmask?.udp?.[0];
        if (!mask) return;
        mask.settings = XrayFinalMaskObject.createSettings(mask.type);
      };

      const hasPassword = computed(() => {
        const type = transport.value.finalmask?.udp?.[0]?.type;
        return type ? passwordTypes.has(type) : false;
      });

      const hasDomain = computed(() => {
        const type = transport.value.finalmask?.udp?.[0]?.type;
        return type ? domainTypes.has(type) : false;
      });

      const finalmaskPassword = computed({
        get: () => (transport.value.finalmask?.udp?.[0]?.settings as any)?.password ?? '',
        set: (val) => {
          const udp = transport.value.finalmask?.udp;
          if (udp && udp.length > 0) {
            if (!udp[0].settings) {
              udp[0].settings = XrayFinalMaskObject.createSettings(udp[0].type);
            }
            (udp[0].settings as any).password = val;
          }
        }
      });

      const finalmaskDomain = computed({
        get: () => (transport.value.finalmask?.udp?.[0]?.settings as any)?.domain ?? '',
        set: (val: string) => {
          const udp = transport.value.finalmask?.udp;
          if (udp && udp.length > 0 && udp[0].settings) {
            (udp[0].settings as any).domain = val;
          }
        }
      });

      const sudokuSettings = computed(() => {
        const mask = transport.value.finalmask?.udp?.[0];
        if (mask?.type === 'sudoku' && mask.settings) return mask.settings as XraySudokuObject;
        return new XraySudokuObject();
      });

      const sudokuCustomTablesStr = computed({
        get: () => (sudokuSettings.value.customTables ?? []).join(', '),
        set: (val) => {
          const s = sudokuSettings.value;
          s.customTables = val
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t !== '');
        }
      });

      const masqueradeTypes = XrayHysteriaMasqueradeObject.typeOptions;

      const masqueradeEnabled = computed({
        get: () => !!transport.value.hysteriaSettings?.masquerade,
        set: (val) => {
          if (!transport.value.hysteriaSettings) return;
          if (val) {
            transport.value.hysteriaSettings.masquerade = new XrayHysteriaMasqueradeObject();
          } else {
            transport.value.hysteriaSettings.masquerade = undefined;
          }
        }
      });

      return {
        transport,
        congestion,
        brutalUp,
        brutalDown,
        congestionOptions,
        udphopEnabled,
        finalmaskEnabled,
        finalmaskPassword,
        finalmaskDomain,
        hasPassword,
        hasDomain,
        maskTypes,
        onMaskTypeChange,
        sudokuAsciiOptions,
        sudokuSettings,
        sudokuCustomTablesStr,
        masqueradeEnabled,
        masqueradeTypes
      };
    }
  });
</script>
