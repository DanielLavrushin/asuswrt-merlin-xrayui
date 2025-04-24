<template>
  <div class="formfontdesc">
    <p>DNS is an outbound protocol used for intercepting and forwarding DNS queries. This outbound protocol can only handle DNS traffic, including queries based on UDP and TCP protocols. Other types of traffic will result in an error.</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">DNS</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>
            Network
            <hint> Modifies the transport layer protocol for DNS traffic. The possible values are `tcp` and `udp`. When not specified, the original transport method will be retained. </hint>
          </th>
          <td>
            <select class="input_option" v-model="proxy.settings.network">
              <option></option>
              <option value="tcp">tcp</option>
              <option value="udp">udp</option>
            </select>
          </td>
        </tr>
        <tr>
          <th>
            DNS server address
            <hint> Modifies the DNS server address. When not specified, the original address specified in the source will be retained. </hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.address" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            DNS server port
            <hint> Modifies the DNS server port. When not specified, the original port specified in the source will be retained. </hint>
          </th>
          <td>
            <input type="number" maxlength="5" class="input_6_table" v-model="proxy.settings.port" onkeypress="return validator.isNumber(this, event);" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            Control non IP queries
            <hint> Control non IP queries (neither `A` or `AAAA`), `drop` this request or `skip` processing in DNS module, the request will be forwarded to target. By default is `drop`. </hint>
          </th>
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
  import { defineComponent, ref } from 'vue';
  import OutboundCommon from './OutboundCommon.vue';
  import { XrayProtocol } from '@/modules/CommonObjects';
  import { XrayOutboundObject, XrayDnsOutboundObject } from '@/modules/OutboundObjects';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'DnsOutbound',
    components: {
      OutboundCommon,
      Hint
    },
    props: {
      proxy: XrayOutboundObject<XrayDnsOutboundObject>
    },
    setup(props) {
      const proxy = ref<XrayOutboundObject<XrayDnsOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayDnsOutboundObject>(XrayProtocol.DNS, new XrayDnsOutboundObject()));
      return {
        proxy
      };
    }
  });
</script>
