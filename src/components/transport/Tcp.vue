<template>
  <tr class="xray_network_opt_row xray_network_opt_row_tcp">
    <th>
      <a class="hintstyle" onmouseover="hint(this,'Only used for inbound, indicating whether to accept the PROXY protocol.');">Accept the PROXY protocol</a>
    </th>
    <td>
      <input type="checkbox" name="xray_network_tcp_accept_proxy" class="input" v-model="config.acceptProxy" />
      <span class="hint-color">default: false</span>
    </td>
  </tr>
</template>

<script lang="ts">
  import { defineComponent, PropType } from "vue";

  export default defineComponent({
    name: "Tcp",
    props: {
      config: {
        type: Object as PropType<{ acceptProxy: boolean }>,
        required: true,
      },
    },
  });
</script>
