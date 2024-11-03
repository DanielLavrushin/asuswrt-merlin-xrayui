<template>
  <tr>
    <th>
      <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'The listening address, either an IP address or a Unix domain socket. The default value is <b>0.0.0.0</b>, which means accepting connections on all network interfaces.');">The listening address</a>
    </th>
    <td>
      <input type="text" maxlength="15" class="input_20_table" v-model="xrayConfig.inbounds[0].listen" onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off" autocapitalize="off" />
      <span class="hint-color">default: 0.0.0.0</span>
    </td>
  </tr>
  <tr>
    <th>Inbound Port</th>
    <td>
      <input type="text" maxlength="5" class="input_6_table" v-model="port1" autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
      -
      <input type="text" maxlength="5" class="input_6_table" v-model="port2" autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
    </td>
  </tr>
  <tr>
    <th>The port allocation strategy</th>
    <td>
      <select v-model="allocate.strategy" class="input_option">
        <option value="always">always</option>
        <option value="random">random</option>
      </select>
    </td>
  </tr>
  <tr v-if="allocate.strategy == 'random'">
    <th>
      <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'The interval for refreshing randomly allocated ports in minutes.');">Refresh</a>
    </th>
    <td>
      <input type="text" maxlength="2" class="input_6_table" v-model="allocate.refresh" onkeypress="return validator.isNumber(this,event);" />
      <span class="hint-color">The minimum is 2, and recommended is 5</span>
    </td>
  </tr>
  <tr v-if="allocate.strategy == 'random'">
    <th>
      <a class="hintstyle" href="javascript:void(0);" onmouseover="hint(this,'The number of randomly allocated ports.');">Concurrency</a>
    </th>
    <td>
      <input type="text" maxlength="2" class="input_6_table" v-model="allocate.concurrency" onkeypress="return validator.isNumber(this,event);" />
      <span class="hint-color">The minimum is 1, and recommended is 3</span>
    </td>
  </tr>
</template>
<script lang="ts">
  import { defineComponent, ref, watch, reactive } from "vue";
  import xrayConfig, { XrayAllocateObject, XrayInboundObject } from "../modules/XrayConfig";

  export default defineComponent({
    name: "Ports",
    setup() {
      // Helper function to get port values
      const getPorts = (ports: string | number): number[] => {
        if (typeof ports === "string") {
          const [port1, port2] = ports.split("-").map((port) => parseInt(port, 10));
          return [port1, port2 || port1];
        } else {
          return [ports, ports];
        }
      };

      const port1 = ref<number>(0);
      const port2 = ref<number>(0);
      const allocate = reactive<XrayAllocateObject>(xrayConfig.inbounds[0].allocate ?? new XrayAllocateObject());

      if (xrayConfig?.inbounds[0]?.port) {
        const ports = getPorts(xrayConfig?.inbounds[0].port);
        port1.value = ports[0];
        port2.value = ports[1];
      }

      watch(
        () => xrayConfig?.inbounds[0].listen,
        (newIp) => {
          if (newIp === undefined || newIp === null || newIp === "") {
            xrayConfig.inbounds[0].listen = XrayInboundObject.defaultListen;
          }
        },
        { immediate: true }
      );

      watch(
        () => xrayConfig?.inbounds[0].port,
        (newPort) => {
          const ports = getPorts(newPort);
          port1.value = ports[0];
          port2.value = ports[1];
        },
        { immediate: true }
      );

      watch([port1, port2], ([newPort1, newPort2]) => {
        if (newPort1 !== newPort2) {
          xrayConfig.inbounds[0].port = `${newPort1}-${newPort2}`;
        } else {
          xrayConfig.inbounds[0].port = newPort1;
        }
      });

      watch(
        allocate,
        (newAllocate) => {
          let inbound = xrayConfig.inbounds[0];
          inbound.allocate = newAllocate;
          if (newAllocate.strategy === "always") {
            delete inbound.allocate.concurrency;
            delete inbound.allocate.refresh;
          } else {
            inbound.allocate.refresh = inbound.allocate.refresh ?? XrayAllocateObject.defaultRefresh;
            inbound.allocate.concurrency = inbound.allocate.concurrency ?? XrayAllocateObject.defaultConcurrency;
          }
        },
        { immediate: true }
      );

      return {
        allocate,
        port1,
        port2,
        xrayConfig,
      };
    },
  });
</script>

<style scoped></style>
