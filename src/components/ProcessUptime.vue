<template>
  <tr v-if="isRunning">
    <th>{{ $t("components.ProcessUptime.label") }}</th>
    <td>{{ format_time(seconds) }}</td>
  </tr>
</template>

<script lang="ts">
  import { EngineResponseConfig } from "@/modules/Engine";
  import { defineComponent, ref, watch, inject, Ref, onMounted } from "vue";
  import { useI18n } from "vue-i18n";
  export default defineComponent({
    name: "ProcessUptime",
    setup() {
      const { t } = useI18n();
      const seconds = ref(0);
      const uiResponse = inject<Ref<EngineResponseConfig>>("uiResponse");
      const isRunning = ref<boolean>(window.xray.server.isRunning);

      onMounted(async () => {
        watch(
          () => uiResponse?.value,
          (newVal) => {
            if (newVal) {
              if (newVal?.xray?.uptime) {
                seconds.value = newVal.xray.uptime;
              }
            }
          },
          { immediate: true }
        );
        let uptimeInterval = setInterval(() => {
          seconds.value += 1;
        }, 1000);
      });

      const format_time = (seconds: number) => {
        const days = Math.floor(seconds / (3600 * 24));
        seconds -= days * 3600 * 24;
        const hours = Math.floor(seconds / 3600);
        seconds -= hours * 3600;
        const minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;
        return t("components.ProcessUptime.formatted_time", [days, hours, minutes, seconds]);
      };

      return {
        seconds,
        isRunning,
        format_time
      };
    }
  });
</script>
<style scoped>
  td {
    text-align: right;
    padding-right: 5px;
  }
</style>
