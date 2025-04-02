<template>
  <tr v-if="isRunning">
    <th>{{ $t('com.ProcessUptime.label') }}</th>
    <td>{{ formattedTime }}</td>
  </tr>
</template>

<script lang="ts">
  import { defineComponent, ref, watch, inject, computed, onMounted, onBeforeUnmount, Ref } from 'vue';
  import { EngineResponseConfig } from '@/modules/Engine';
  import { useI18n } from 'vue-i18n';

  export default defineComponent({
    name: 'ProcessUptime',
    setup() {
      const { t } = useI18n();
      const seconds = ref(0);

      const uiResponse = inject<Ref<EngineResponseConfig>>('uiResponse');
      const isRunning = ref<boolean>(window.xray.server.isRunning);

      let uptimeInterval: number | undefined;

      watch(
        () => uiResponse?.value.xray?.uptime,
        (newUptime) => {
          if (newUptime) {
            seconds.value = newUptime;
          }
        },
        { immediate: true }
      );

      onMounted(() => {
        uptimeInterval = window.setInterval(() => {
          seconds.value += 1;
        }, 1000);
      });

      onBeforeUnmount(() => {
        if (uptimeInterval !== undefined) {
          clearInterval(uptimeInterval);
        }
      });

      const formattedTime = computed(() => {
        let totalSeconds = seconds.value;
        const days = Math.floor(totalSeconds / (3600 * 24));
        totalSeconds -= days * 3600 * 24;
        const hours = Math.floor(totalSeconds / 3600);
        totalSeconds -= hours * 3600;
        const minutes = Math.floor(totalSeconds / 60);
        totalSeconds -= minutes * 60;
        return t('com.ProcessUptime.formatted_time', [days, hours, minutes, totalSeconds]);
      });

      return {
        seconds,
        isRunning,
        formattedTime
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
