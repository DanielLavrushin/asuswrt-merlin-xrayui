<template>
  <div class="radar">
    <svg :width="width" :height="height">
      <g :transform="'translate(' + center + ',' + center + ')'">
        <circle v-for="i in 4" :key="i" :cx="0" :cy="0" :r="(radius / 4) * i" class="grid"></circle>
        <line v-for="i in 8" :key="'a' + i" :x1="0" :y1="0" :x2="polarToX((2 * Math.PI * i) / 8, radius)" :y2="polarToY((2 * Math.PI * i) / 8, radius)" class="grid"></line>
        <g v-for="p in points" :key="p.ip" class="point" :transform="'translate(' + polarToX(p.angle, radius * p.radius) + ',' + polarToY(p.angle, radius * p.radius) + ')'">
          <circle :r="p.ip === highlightIp ? 5 : 3" :class="{ highlight: p.ip === highlightIp }">
            <title>{{ p.domain ? p.domain + ' (' + p.ip + ')' : p.ip }}</title>
          </circle>
        </g>
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
  import { defineComponent, computed } from 'vue';
  export default defineComponent({
    name: 'RtlsRadar',
    props: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      points: { type: Array as () => Array<{ angle: number; radius: number; ip: string; domain: string; proximity: number }>, required: true },
      highlightIp: { type: String, default: '' }
    },
    setup(props) {
      const center = computed(() => Math.min(props.width, props.height) / 2);
      const radius = computed(() => Math.min(props.width, props.height) / 2 - 10);
      const polarToX = (a: number, r: number) => Math.cos(a) * r;
      const polarToY = (a: number, r: number) => Math.sin(a) * r;
      return { center, radius, polarToX, polarToY };
    }
  });
</script>

<style scoped>
  .radar {
    display: inline-block;
  }
  .grid {
    stroke: var(--border-color, #ccc);
    fill: none;
    opacity: 0.6;
  }
  .point circle {
    fill: var(--accent-color, #5b9bd5);
  }
  .point circle.highlight {
    fill: var(--accent-strong, #d9534f);
  }
</style>
