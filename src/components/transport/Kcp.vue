<template>
  <tbody v-if="transport.kcpSettings">
    <tr>
      <th>
        {{ $t("components.Kcp.label_mtu") }}
        <hint v-html="$t('components.Kcp.hint_mtu')"></hint>
      </th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.kcpSettings.mtu" />
        <span class="hint-color">default: 1350</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t("components.Kcp.label_tti") }}
        <hint v-html="$t('components.Kcp.hint_tti')"></hint>
      </th>
      <td>
        <input type="number" maxlength="3" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.kcpSettings.tti" />
        <span class="hint-color">default: 50</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t("components.Kcp.label_uplink_capacity") }}
        <hint v-html="$t('components.Kcp.hint_uplink_capacity')"></hint>
      </th>
      <td>
        <input type="number" maxlength="3" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.kcpSettings.uplinkCapacity" />
        <span class="hint-color">default: 5</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t("components.Kcp.label_downlink_capacity") }}
        <hint v-html="$t('components.Kcp.hint_downlink_capacity')"></hint>
      </th>
      <td>
        <input type="number" maxlength="3" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.kcpSettings.downlinkCapacity" />
        <span class="hint-color">default: 20</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t("components.Kcp.label_congestion") }}
        <hint v-html="$t('components.Kcp.hint_congestion')"></hint>
      </th>
      <td>
        <input type="checkbox" class="input" v-model="transport.kcpSettings.congestion" />
        <span class="hint-color">default: false</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t("components.Kcp.label_read_buffer") }}
        <hint v-html="$t('components.Kcp.hint_read_buffer')"></hint>
      </th>
      <td>
        <input type="number" maxlength="3" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.kcpSettings.readBufferSize" />
        <span class="hint-color">default: 2</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t("components.Kcp.label_write_buffer") }}
        <hint v-html="$t('components.Kcp.hint_write_buffer')"></hint>
      </th>
      <td>
        <input type="number" maxlength="3" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.kcpSettings.writeBufferSize" />
        <span class="hint-color">default: 2</span>
      </td>
    </tr>
    <tr>
      <th>
        {{ $t("components.Kcp.label_seed") }}
        <hint v-html="$t('components.Kcp.hint_seed')"></hint>
      </th>
      <td>
        <input type="text" class="input_25_table" v-model="transport.kcpSettings.seed" />
        <span class="hint-color"></span>
        <span class="row-buttons">
          <a class="button_gen button_gen_small" href="#" @click="regenerate_seed()">{{ $t("labels.regenerate") }}</a>
        </span>
      </td>
    </tr>
    <tr v-if="transport.kcpSettings.header">
      <th>
        {{ $t("components.Kcp.label_header") }}
        <hint v-html="$t('components.Kcp.hint_header')"></hint>
      </th>
      <td>
        <select class="input_option" v-model="transport.kcpSettings.header.type">
          <option v-for="(opt, index) in headerTypes" :key="index" :value="opt">{{ opt }}</option>
        </select>
        <span class="hint-color">default: none</span>
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts">
  import { defineComponent, ref } from "vue";
  import { XrayStreamSettingsObject } from "../../modules/CommonObjects";
  import Hint from "../Hint.vue";
  import { XrayStreamKcpSettingsObject } from "@/modules/TransportObjects";

  export default defineComponent({
    name: "Kcp",
    components: {
      Hint
    },
    props: {
      transport: XrayStreamSettingsObject
    },
    setup(props) {
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());

      const regenerate_seed = () => {
        if (!transport.value.kcpSettings) return;
        const randomBytes = crypto.getRandomValues(new Uint8Array(16));
        transport.value.kcpSettings.seed = Array.from(randomBytes)
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");
      };

      return {
        transport,
        regenerate_seed,
        headerTypes: XrayStreamKcpSettingsObject.headerTypes
      };
    }
  });
</script>
