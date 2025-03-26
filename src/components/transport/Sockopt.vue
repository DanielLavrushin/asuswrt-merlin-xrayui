<template>
  <div class="formfontdesc">
    <p>Configures transparent proxies.</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Settings</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>
            Specifies whether to enable transparent proxy
            <hint>
              Specifies whether to enable transparent proxy (only applicable to Linux).
              <ul>
                <li>off: Turn off transparent proxy.</li>
                <li>redirect: Use the transparent proxy in Redirect mode. It supports all TCP connections based on `IPv4/6`.</li>
                <li>tproxy: Use the transparent proxy in TProxy mode. It supports all TCP and UDP connections based on `IPv4/6`.</li>
              </ul>
              Transparent proxy requires Root or `CAP\_NET\_ADMIN` permission.
            </hint>
          </th>
          <td>
            <select class="input_option" v-model="sockopt.tproxy">
              <option v-for="(opt, index) in tproxyOptions" :key="index" :value="opt">{{ opt }}</option>
            </select>
            <span class="hint-color">default: off</span>
          </td>
        </tr>
        <tr>
          <th>
            Outbound network interface
            <hint> Specifies the name of the bound outbound network interface. supported by Linux MacOS iOS. MacOS iOS Requires Xray-core v1.8.6 or higher. </hint>
          </th>
          <td>
            <input type="number" maxlength="15" class="input_20_table" v-model="sockopt.interface" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            Domain strategy
            <hint>
              When the target address is a domain name, the corresponding value is configured, and the behavior of SystemDialer is as follows:
              <ul>
                <li>`AsIs`: Resolve the IP address using the system DNS server and connect to the domain name.</li>
                <li>"UseIP", "UseIPv4", and "UseIPv6": Resolve the IP address using the built-in DNS server and connect to the IP address directly.</li>
              </ul>
            </hint>
          </th>
          <td>
            <select class="input_option" v-model="sockopt.domainStrategy">
              <option v-for="(opt, index) in domainStrategyOptions" :key="index" :value="opt">{{ opt }}</option>
            </select>
            <span class="hint-color">default: AsIs</span>
          </td>
        </tr>
        <tr>
          <th>
            Mark
            <hint>
              The mark value of the transparent proxy. The mark value is used to mark the packets that need to be processed by the transparent proxy. An `integer` value. When its value is non-zero, `SO_MARK` is marked with this value on the outbound connection.
              <ul>
                <li>Only applicable to `Linux` systems..</li>
                <li>Requires `CAP_NET_ADMIN` permission.</li>
              </ul>
            </hint>
          </th>
          <td>
            <input type="number" maxlength="15" class="input_20_table" v-model="sockopt.mark" />
            <span class="hint-color"></span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, watch } from 'vue';
  import { XraySockoptObject, XrayStreamSettingsObject } from '@/modules/CommonObjects';
  import Hint from '@main/Hint.vue';
  export default defineComponent({
    name: 'Sockopt',
    components: {
      Hint
    },
    props: {
      transport: XrayStreamSettingsObject
    },
    setup(props) {
      const sockopt = ref<XraySockoptObject>(props.transport?.sockopt ?? new XraySockoptObject());

      watch(
        () => props.transport,
        () => {
          if (props.transport && !props.transport?.sockopt) {
            props.transport.sockopt = sockopt.value;
          }
          sockopt.value = props.transport?.sockopt ?? new XraySockoptObject();
        },
        { immediate: true }
      );

      return {
        sockopt,
        domainStrategyOptions: XraySockoptObject.domainStrategyOptions,
        tproxyOptions: XraySockoptObject.tproxyOptions
      };
    }
  });
</script>
