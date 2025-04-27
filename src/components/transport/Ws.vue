<template>
  <tbody v-if="transport.wsSettings">
    <tr v-if="isInbound">
      <th>
        Accept the PROXY protocol
        <hint>
          Indicates whether to accept the `PROXY` protocol.
          <br />
          The `PROXY` protocol is used to transmit the real source IP and port of connections. If you are not familiar with this, leave it alone.
          <br />
          Commonplace reverse proxy software solutions (like `HAProxy` and `NGINX`) can be configured to have source IPs and ports sent with `PROXY` protocol. Same goes to `VLESS` fallbacks xver.
          <br />
          When true, after the underlying `TCP` connection is established, the downstream must first send the source IPs and ports in `PROXY` protocol v1 or v2, or the connection will be terminated.
        </hint>
      </th>
      <td>
        <input type="checkbox" name="xray_network_tcp_accept_proxy" class="input" v-model="transport.wsSettings.acceptProxyProtocol" />
        <span class="hint-color">default: false</span>
      </td>
    </tr>
    <tr>
      <th>
        The HTTP path
        <hint>
          The HTTP path used by the WebSocket connection. Defaults to "/".
          <br />
          If path contains the ed query parameter, early data will be activated for latency reduction, and its value will be the length threshold of the first packet. If the length of the first packet exceeds this value, early data won't be activated. The recommended value is `2560`, with a maximum of `8192`. Compatibility problems can occur when the value is set too high. Try lowering the threshold when encountering such problems.
        </hint>
      </th>
      <td>
        <input type="text" maxlength="256" class="input_20_table" v-model="transport.wsSettings.path" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <tr>
      <th>
        The Host header
        <hint>
          The `Host` header sent in HTTP requests. Defaults to an empty string. Servers will not validate the `Host` header sent by clients when left blank.
          <br />
          If the `Host` header has been defined on the server in any way, the server will validate if the `Host` header matches.
          <br />
          The current priority of the `Host` header sent by clients: `host` > `headers` > `address`
        </hint>
      </th>
      <td>
        <input type="text" maxlength="256" class="input_20_table" v-model="transport.wsSettings.host" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <headers-mapping :headersMap="transport.wsSettings.headers" @on:header:update="onheaderapupdate" />
  </tbody>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { XrayStreamSettingsObject } from '@/modules/CommonObjects';
  import Hint from '@main/Hint.vue';

  import HeadersMapping from './HeadersMapping.vue';
  export default defineComponent({
    name: 'Ws',
    components: {
      HeadersMapping,
      Hint
    },
    methods: {
      onheaderapupdate(headers: any) {
        if (this.transport.wsSettings) this.transport.wsSettings.headers = headers;
      }
    },
    props: {
      transport: XrayStreamSettingsObject,
      proxyType: String
    },
    setup(props) {
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());

      return {
        transport,
        isInbound: props.proxyType == 'inbound'
      };
    }
  });
</script>
