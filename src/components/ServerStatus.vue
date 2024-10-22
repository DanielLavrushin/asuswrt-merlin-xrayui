<template>
  <tr>
    <th>Server Status</th>
    <td>
      <span :class="{ 'hint-color': isRunning, 'stopped-color': !isRunning }" v-text="statusLabel"></span>
      <span id="xray_server_status_links">
        <a class="button_gen button_gen_small" href="#" @click.prevent="handleStatus('restart')">Restart</a>
        <a class="button_gen button_gen_small" href="#" @click.prevent="handleStatus('stop')">Stop</a>
      </span>
    </td>
  </tr>
</template>

<script lang="ts">
  import { defineComponent } from "vue";
  import axios from "axios";

  export default defineComponent({
    name: "ServerStatus",
    data() {
      return {
        isRunning: window.xray.server.isRunning,
      };
    },
    computed: {
      statusLabel(): string {
        return this.isRunning ? "is up & running" : "stopped";
      },
    },
    methods: {
      handleStatus(action: string) {},
    },
    mounted() {},
  });
</script>

<style scoped>
  .hint-color {
  }
</style>
