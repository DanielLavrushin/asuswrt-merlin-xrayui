<template>
    <div class="formfontdesc">
        <table width="100%" bordercolor="#6b8fa3" class="FormTable">
            <thead>
                <tr>
                    <td colspan="2">Logs</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th>Auto refresh</th>
                    <td>
                        <input type="checkbox" class="input_option" v-model="follow" />
                    </td>
                </tr>
                <tr>
                    <th>
                        Logs Type to load
                    </th>
                    <td>
                        <select class="input_option" v-model="file">
                            <option value="/ext/xrayui/xray_access_partial.asp">Access Logs</option>
                            <option value="/ext/xrayui/xray_error_partial.asp">Error Logs</option>
                        </select>
                    </td>
                </tr>
                <tr v-show="file == '/ext/xrayui/xray_error_partial.asp'">
                    <th>
                        Errors Level
                    </th>
                    <td>
                        <select class="input_option" v-model="loglevel" @change="updateLogsLevel">
                            <option v-for="level in levels" :value="level">{{ level }}</option>
                        </select>
                        <span class="hint-color">`none` also turn-off access logs</span>
                    </td>
                </tr>
                <tr>
                    <td class="logs-area-row" colspan="2">
                        <pre class="logs-area-content">{{ logs }}</pre>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch, onUnmounted, computed } from "vue";
import axios from "axios";
import engine, { SubmtActions } from "../modules/Engine";
import xrayConfig from "@/modules/XrayConfig";

interface Client {
    ip: string;
    email: string[];
}

export default defineComponent({
    name: "Logs",

    setup() {

        const logs = ref<string>("");
        const follow = ref<boolean>(false);
        const file = ref<string>("/ext/xrayui/xray_access_partial.asp");
        const loglevel = ref<string>(xrayConfig.log?.loglevel ?? "warning");
        const fetchLogs = async () => {
            if (!follow.value) {
                return;
            }

            await engine.submit(SubmtActions.fetchXrayLogs);
            await setTimeout(async () => {
                const response = await axios.get(file.value);
                logs.value = response.data;
            }, 1000);
        };

        const fetchLogsInterval = setInterval(async () => {
            await fetchLogs();
        }, 2000);

        const updateLogsLevel = async () => {
            let delay = 5000;
            window.showLoading(delay, 'waiting');
            await engine.submit(SubmtActions.updateLogsLevel, { log_level: loglevel.value }, delay);
            window.hideLoading();
        };

        watch(
            () => xrayConfig.log?.loglevel,
            async (newVal) => {
                if (newVal) {
                    loglevel.value = newVal;
                }
            },
            { immediate: true }
        );


        return {
            follow,
            file,
            logs,
            loglevel,
            updateLogsLevel,
            levels: ["none", "debug", "info", "warning", "error"],
        };


    },
});
</script>
<style scoped>
.logs-area-row {
    padding: 0;
    margin: 0;
    overflow: hidden;
}

.logs-area-content {
    line-height: normal;
    width: 100%;
    height: 200px;
    max-width: 738px;
    overflow-x: scroll;
    overflow-y: scroll;
    margin: 0;
    color: #FFFFFF;
    background-color: #576D73;
    font-family: Courier New, Courier, monospace;
    font-size: 11px;
    scrollbar-width: thin;
    scrollbar-color: #FFFFFF #576D73;

}
</style>