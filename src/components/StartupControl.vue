<template>
    <tr>
        <th>Start XRAY on reboot</th>
        <td>
            <input type="checkbox" v-model="startup" @click="updatestartup" />
            <span class="hint-color"></span>
        </td>
    </tr>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import engine, { SubmtActions } from "../modules/Engine";

export default defineComponent({
    name: "ServerStatus",
    data() {
        return {
            startup: window.xray.custom_settings.xray_startup === 'y'
        };
    },

    methods: {
        async updatestartup() {
            console.log('updatestartup');
            await engine.submit(SubmtActions.ToggleStartupOption);
        }
    }
});
</script>