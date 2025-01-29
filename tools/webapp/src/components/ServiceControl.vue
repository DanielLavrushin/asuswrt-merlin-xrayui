<template>
    <section class="status">
        <div v-if="isLoading" class="overlay">
            <div class="spinner-large"></div>
        </div>
        <h2>XRAY Status</h2>
        <div>
            <div class="status"
                :class="{ 'checking': status.data === undefined, 'connected': status.data === true, 'disconnected': status.data === false }">
                {{ status.message }}</div>
        </div>
        <div class="controls">
            <button @click="startService" :disabled="status.data === true" class="button">Start</button>
            <button @click="stopService" :disabled="status.data === false" class="button">Stop</button>
            <button @click="restartService" class="button">Restart</button>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import axios from "axios";
import WebAppResponse, { WebAppResponseData } from "../modules/WebAppResponse";

export default defineComponent({
    name: "ServiceControl",
    setup() {
        const status = ref<WebAppResponseData<boolean>>(new WebAppResponseData<boolean>("success", "Checking status..."));
        const isLoading = ref(false);

        const stopService = async () => {
            await sendAction("stop");
        };
        const restartService = async () => {
            await sendAction("restart");
        };
        const startService = async () => {
            await sendAction("start");
        };

        const sendAction = async (action: string) => {
            isLoading.value = true;
            try {
                await axios.post<WebAppResponse>("/cgi-bin/servicecontrol", {
                    action: action
                });
            }
            finally {
                isLoading.value = false;
            }
        };

        const checkStatus = async () => {
            const response = await axios.post<WebAppResponseData<boolean>>("/cgi-bin/servicecontrol", { action: "status" });
            status.value = response.data;
        };
        setInterval(() => {
            checkStatus();
        }, 2000);

        return {
            status,
            isLoading,
            startService,
            stopService,
            restartService,
        }
    }
});

</script>
<style scoped>
.status {
    text-align: center;
    width: 100%;
    color: white;
    padding: 5px;
    border-radius: 5px;
    margin: 4px 0 0 0;
    font-weight: bold;

}

.status .connected {
    background-color: green;
}

.status .disconnected {
    background-color: red;
}

.status .checking {
    background-color: #ffcc00;
}
</style>