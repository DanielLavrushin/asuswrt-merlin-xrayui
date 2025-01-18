<template>
  <tbody v-if="transport.kcpSettings">
    <tr>
      <th>
        MTU
        <hint>
          Maximum transmission unit. It indicates the maxium bytes that an UDP packet can carry. Recommended value is
          between `576` and `1460`.

          The default value is `1350`
        </hint>
      </th>
      <td>
        <input type="text" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);"
          v-model="transport.kcpSettings.mtu" />
        <span class="hint-color">Recommended value is between 576 and 1460, default is 1350</span>
      </td>
    </tr>
    <tr>
      <th>
        TTI
        <hint>
          Transmission time interval, measured in milliseconds (ms), determines how often `mKCP` sends data. Please
          choose a value between `10` and `100`.

          The default value is `50`
        </hint>
      </th>
      <td>
        <input type="text" maxlength="3" class="input_6_table" onkeypress="return validator.isNumber(this,event);"
          v-model="transport.kcpSettings.tti" />
        <span class="hint-color">Please choose a value between 10 and 100, default is 50</span>
      </td>
    </tr>
    <tr>
      <th>
        Uplink capacity
        <hint>
          Uplink capacity refers to the maximum bandwidth used by the host to send data, measured in MB/s (note: `Byte`,
          not `bit`). It can be set to `0`, indicating a very small bandwidth.

          The default value is `5`
        </hint>
      </th>
      <td>
        <input type="text" maxlength="3" class="input_6_table" onkeypress="return validator.isNumber(this,event);"
          v-model="transport.kcpSettings.uplinkCapacity" />
        <span class="hint-color">default: 5</span>
      </td>
    </tr>
    <tr>
      <th>
        Downlink capacity
        <hint>
          Downlink capacity refers to the `maximum` bandwidth used by the host to receive data, measured in MB/s (note:
          `Byte`, not `bit`). It can be set to `0`, indicating a very small bandwidth.

          The default value is `20`
        </hint>
      </th>
      <td>
        <input type="text" maxlength="3" class="input_6_table" onkeypress="return validator.isNumber(this,event);"
          v-model="transport.kcpSettings.downlinkCapacity" />
        <span class="hint-color">default: 20</span>
      </td>
    </tr>
    <tr>
      <th>
        Congestion control
        <hint>
          Whether or not to enable congestion control. When congestion control is enabled, Xray will detect network
          quality. It will send less packets when packet loss is severe, or more packets when network is not fully
          filled.

          The default value is `false`
        </hint>
      </th>
      <td>
        <input type="checkbox" class="input" v-model="transport.kcpSettings.congestion" />
        <span class="hint-color">default: false</span>
      </td>
    </tr>
    <tr>
      <th>
        The read buffer size
        <hint>
          The read buffer size for a single connection, measured in MB.

          The default value is `2`
        </hint>
      </th>
      <td>
        <input type="text" maxlength="3" class="input_6_table" onkeypress="return validator.isNumber(this,event);"
          v-model="transport.kcpSettings.readBufferSize" />
        <span class="hint-color">default: 2</span>
      </td>
    </tr>
    <tr>
      <th>
        The write buffer size
        <hint>
          The write buffer size for a single connection, measured in MB.

          The default value is `2`
        </hint>
      </th>
      <td>
        <input type="text" maxlength="3" class="input_6_table" onkeypress="return validator.isNumber(this,event);"
          v-model="transport.kcpSettings.writeBufferSize" />
        <span class="hint-color">default: 2</span>
      </td>
    </tr>
    <tr>
      <th>
        Seed
        <hint>
          An optional obfuscation seed is used to obfuscate traffic data using the `AES-128-GCM` algorithm. The client
          and
          server need to use the same seed.

          This obfuscation mechanism cannot ensure the security of the content, but it may be able to resist some
          blocking.
        </hint>
      </th>
      <td>
        <input type="text" class="input_25_table" v-model="transport.kcpSettings.seed" />
        <span class="hint-color"></span>
        <span class="row-buttons">
          <a class="button_gen button_gen_small" href="#" @click="regenerate_seed()">regenerate</a>
        </span>
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { XrayStreamSettingsObject } from "../../modules/CommonObjects";
import Hint from "../Hint.vue";

export default defineComponent({
  name: "Kcp",
  components: {
    Hint,
  },
  props: {
    transport: XrayStreamSettingsObject
  },
  methods: {
    regenerate_seed() {
      if (!this.transport.kcpSettings) return;
      const randomBytes = crypto.getRandomValues(new Uint8Array(16));
      this.transport.kcpSettings.seed = Array.from(randomBytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    },

  },
  setup(props) {

    const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
    return { transport };
  },
});
</script>
