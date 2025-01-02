<template>
    <div class="version">XRAYUI v{{ version }}</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "Version",

    setup() {
        return {
            version: window.xray.custom_settings.xray_version,
        };
    },
});
</script>
<style scoped>
.version {
    font-size: 10px;
    color: #FFCC00;
    font-weight: bold;
    position: absolute;
    bottom: 0;
    right: 5px;
}
</style>