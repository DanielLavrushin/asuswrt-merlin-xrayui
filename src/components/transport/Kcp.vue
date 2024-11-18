<template>
  <tbody v-if="transport.kcpSettings">
    <tr>
      <th>
        Maximum transmission unit
      </th>
      <td>
        <input type="text" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);"
          v-model="transport.kcpSettings.mtu" />
        <span class="hint-color">Recommended value is between 576 and 1460, default is 1350</span>
      </td>
    </tr>
    <tr>
      <th>
        Transmission time interval
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
      </th>
      <td>
        <input type="checkbox" class="input" v-model="transport.kcpSettings.congestion" />
        <span class="hint-color">default: false</span>
      </td>
    </tr>
    <tr>
      <th>
        The read buffer size
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
import { XrayStreamSettingsObject } from "../../modules/XrayConfig"

export default defineComponent({
  name: "Kcp",
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
