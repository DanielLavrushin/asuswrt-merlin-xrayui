<template>
  <tr>
    <th>
      <a class="hintstyle" href="javascript:void(0);"
        onmouseover="hint(this,'Maximum transmission unit. It indicates the maxium bytes that an UDP packet can carry');">MTU</a>
    </th>
    <td>
      <input type="text" maxlength="4" class="input_6_table" name="xray_network_kcp_mtu"
        onkeypress="return validator.isNumber(this,event);" value="1350" />
      <span class="hint-color">Recommended value is between 576 and 1460, default is 1350</span>
    </td>
  </tr>
  <tr>
    <th>
      <a class="hintstyle" href="javascript:void(0);"
        onmouseover="hint(this,'Transmission time interval, measured in milliseconds (ms), determines how often mKCP sends data');">TTI</a>
    </th>
    <td>
      <input type="text" maxlength="3" class="input_6_table" name="xray_network_kcp_tti"
        onkeypress="return validator.isNumber(this,event);" value="50" />
      <span class="hint-color">Please choose a value between 10 and 100, default is 50</span>
    </td>
  </tr>
  <tr>
    <th>
      <a class="hintstyle" href="javascript:void(0);"
        onmouseover="hint(this,'Uplink capacity refers to the maximum bandwidth used by the host to send data, measured in MB/s (note: Byte, not bit). It can be set to 0, indicating a very small');">Uplink
        Capacity</a>
    </th>
    <td>
      <input type="text" maxlength="3" class="input_6_table" name="xray_network_kcp_uplinkCapacity"
        onkeypress="return validator.isNumber(this,event);" value="5" />
      <span class="hint-color">default: 5</span>
    </td>
  </tr>
  <tr>
    <th>
      <a class="hintstyle" href="javascript:void(0);"
        onmouseover="hint(this,'Downlink capacity refers to the maximum bandwidth used by the host to receive data, measured in MB/s (note: Byte, not bit). It can be set to 0, indicating a very small bandwidth.');">Downlink
        Capacity</a>
    </th>
    <td>
      <input type="text" maxlength="3" class="input_6_table" name="xray_network_kcp_downlinkCapacity"
        onkeypress="return validator.isNumber(this,event);" value="20" />
      <span class="hint-color">default: 20</span>
    </td>
  </tr>
  <tr>
    <th>
      <a class="hintstyle" href="javascript:void(0);"
        onmouseover="hint(this,'Whether or not to enable congestion control. When congestion control is enabled, Xray will detect network quality. It will send less packets when packet loss is severe, or more packets when network is not fully filled.');">Congestion</a>
    </th>
    <td>
      <input type="checkbox" name="xray_network_kcp_congestion" class="input" value="true" />
      <span class="hint-color">default: false</span>
    </td>
  </tr>
  <tr>
    <th>
      <a class="hintstyle" href="javascript:void(0);"
        onmouseover="hint(this,'The read buffer size for a single connection, measured in MB');">Read buffer size</a>
    </th>
    <td>
      <input type="text" maxlength="3" class="input_6_table" name="xray_network_kcp_readbufsize"
        onkeypress="return validator.isNumber(this,event);" value="2" />
      <span class="hint-color">default: 2</span>
    </td>
  </tr>
  <tr>
    <th>
      <a class="hintstyle" href="javascript:void(0);"
        onmouseover="hint(this,'The write buffer size for a single connection, measured in MB');">Write buffer size</a>
    </th>
    <td>
      <input type="text" maxlength="3" class="input_6_table" name="xray_network_kcp_writebufsize"
        onkeypress="return validator.isNumber(this,event);" value="2" />
      <span class="hint-color">default: 2</span>
    </td>
  </tr>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType } from "vue";

export default defineComponent({
  name: "Kcp",
  props: {
    config: {
      type: Object as PropType<{ mtu: number }>,
      required: true,
    },
    setup() {

    },
  },
});
</script>
