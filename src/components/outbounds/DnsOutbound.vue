<template>
  <div class="formfontdesc">
    <p>DNS is an outbound protocol used for intercepting and forwarding DNS queries. This outbound protocol can only handle DNS traffic, including queries based on UDP and TCP protocols. Other types of traffic will result in an error.</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">DNS</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>Network</th>
          <td>
            <select class="input_option" v-model="proxy.settings.network">
              <option value="tcp">tcp</option>
              <option value="udp">udp</option>
            </select>
          </td>
        </tr>
        <tr>
          <th>DNS server address</th>
          <td>
            <input type="text" maxlength="15" class="input_20_table" v-model="proxy.settings.address" onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>DNS server port</th>
          <td>
            <input type="number" maxlength="5" class="input_6_table" v-model="proxy.settings.port" onkeypress="return validator.isNumber(this, event);" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>Control non IP queries</th>
          <td>
            <select class="input_option" v-model="proxy.settings.nonIPQuery">
              <option value="drop">drop</option>
              <option value="skip">skip</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref } from "vue";
  import OutboundCommon from "./OutboundCommon.vue";
  import { XrayProtocol } from "../../modules/CommonObjects";
  import { XrayOutboundObject, XrayDnsOutboundObject } from "../../modules/OutboundObjects";

  export default defineComponent({
    name: "DnsOutbound",
    components: {
      OutboundCommon,
    },
    props: {
      proxy: XrayOutboundObject<XrayDnsOutboundObject>,
    },
    setup(props) {
      const proxy = ref<XrayOutboundObject<XrayDnsOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayDnsOutboundObject>(XrayProtocol.DNS, new XrayDnsOutboundObject()));
      return {
        proxy,
      };
    },
  });
</script>
