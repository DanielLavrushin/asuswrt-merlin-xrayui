<template>
  <tbody v-if="transport.tcpSettings">
    <tr v-if="isInbound">
      <th>
        {{ $t('com.Tcp.label_accept_proxy_protocol') }}
        <hint v-html="$t('com.Tcp.hint_accept_proxy_protocol')"></hint>
      </th>
      <td>
        <input type="checkbox" name="xray_network_tcp_accept_proxy" class="input" v-model="transport.tcpSettings.acceptProxyProtocol" />
        <span class="hint-color">default: false</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t('com.Tcp.label_header_type') }}
        <hint v-html="$t('com.Tcp.hint_header_type')"></hint>
      </th>
      <td>
        <select class="input_option" v-model="headerType">
          <option v-for="opt in headerTypes" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <span class="hint-color">default: none</span>
      </td>
    </tr>
    <template v-if="headerType === 'http'">
      <tr>
        <th>
          {{ $t('com.Tcp.label_request_path') }}
          <hint v-html="$t('com.Tcp.hint_request_path')"></hint>
        </th>
        <td>
          <input type="text" class="input_20_table" v-model.lazy="requestPath" placeholder="/" />
          <span class="hint-color">default: /</span>
        </td>
      </tr>
      <tr>
        <th>
          {{ $t('com.Tcp.label_request_host') }}
          <hint v-html="$t('com.Tcp.hint_request_host')"></hint>
        </th>
        <td>
          <input type="text" class="input_20_table" v-model.lazy="requestHost" />
        </td>
      </tr>
    </template>
  </tbody>
</template>

<script lang="ts">
  import { computed, defineComponent, ref } from 'vue';
  import { XrayStreamSettingsObject } from '@/modules/CommonObjects';
  import { XrayStreamTcpSettingsObject, XrayTcpHttpRequest } from '@/modules/TransportObjects';
  import Hint from '@main/Hint.vue';

  const toList = (value: string) =>
    value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v !== '');
  const fromList = (value: unknown) => (Array.isArray(value) ? value.join(',') : String(value ?? ''));

  export default defineComponent({
    name: 'Tcp',
    components: {
      Hint
    },
    props: {
      transport: XrayStreamSettingsObject,
      proxyType: String
    },
    setup(props) {
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());

      // Keeps unknown header/request fields (method, version, response, extra headers) from JSON imports intact.
      const request = (): XrayTcpHttpRequest => {
        const tcp = transport.value.tcpSettings!;
        tcp.header = tcp.header ?? { type: 'http' };
        return (tcp.header.request = tcp.header.request ?? {});
      };

      const headerType = computed({
        get: () => transport.value.tcpSettings?.header?.type ?? 'none',
        set: (type: string) => {
          const tcp = transport.value.tcpSettings!;
          tcp.header = { ...(tcp.header ?? {}), type };
          if (type === 'http') tcp.header.request = tcp.header.request ?? { path: ['/'], headers: {} };
        }
      });

      const requestPath = computed({
        get: () => fromList(transport.value.tcpSettings?.header?.request?.path),
        set: (value: string) => {
          request().path = toList(value);
        }
      });

      const requestHost = computed({
        get: () => fromList(transport.value.tcpSettings?.header?.request?.headers?.Host),
        set: (value: string) => {
          const req = request();
          req.headers = { ...(req.headers ?? {}), Host: toList(value) };
        }
      });

      return {
        transport,
        headerType,
        requestPath,
        requestHost,
        headerTypes: XrayStreamTcpSettingsObject.headerTypes,
        isInbound: props.proxyType == 'inbound'
      };
    }
  });
</script>
