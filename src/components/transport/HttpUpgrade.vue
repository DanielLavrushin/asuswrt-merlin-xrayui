<template>
  <tbody v-if="transport.httpupgradeSettings">
    <tr v-if="isInbound">
      <th>
        Accept the PROXY protocol
        <hint>
          Indicates whether to accept the `PROXY` protocol.
          <br />
          The `PROXY` protocol is used to transmit the real source IP and port of connections. If you are not familiar
          with this, leave it alone.
          <br />
          Commonplace reverse proxy software solutions (like `HAProxy` and `NGINX`) can be configured to have source IPs
          and
          ports sent with `PROXY` protocol. Same goes to `VLESS` fallbacks xver.
          <br />
          When true, after the underlying `TCP` connection is established, the downstream must first send the source IPs
          and ports in `PROXY` protocol v1 or v2, or the connection will be terminated.
        </hint>
      </th>
      <td>
        <input type="checkbox" name="xray_network_tcp_accept_proxy" class="input"
          v-model="transport.httpupgradeSettings.acceptProxyProtocol" />
        <span class="hint-color">default: false</span>
      </td>
    </tr>
    <tr>
      <th>The HTTP path
        <hint>
          HTTP path used by the HTTPUpgrade connection. Defaults to "/".
          <br />
          If the path property include an ed query field (e.g. `/mypath?ed=2560`), "early data" will be used to decrease
          latency, with the value defining the threshold of the first packet's size. If the size of the first packet
          exceeds the defined value, "early data" will not be applied. The recommended value is `2560`.
        </hint>
      </th>
      <td>
        <input type="text" maxlength="15" class="input_20_table" v-model="transport.httpupgradeSettings.path" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <tr>
      <th>The Host header</th>
      <td>
        <input type="text" maxlength="15" class="input_20_table" v-model="transport.httpupgradeSettings.host" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <headers-mapping :headersMap="transport.httpupgradeSettings.headers" @on:header:update="onheaderapupdate" />
  </tbody>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { XrayStreamSettingsObject } from "../../modules/CommonObjects";
import HeadersMapping from "./HeadersMapping.vue";
import Hint from "../Hint.vue";

export default defineComponent({
  name: "HttpUpgrade",
  components: {
    HeadersMapping,
    Hint,
  },
  methods: {
    onheaderapupdate(headers: any) {
      if (this.transport.httpupgradeSettings)
        this.transport.httpupgradeSettings.headers = headers;
    },
  },
  props: {
    transport: XrayStreamSettingsObject,
    proxyType: String,
  },
  setup(props) {

    const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());

    return {
      transport,
      isInbound: props.proxyType == "inbound"

    };
  },
});
</script>
