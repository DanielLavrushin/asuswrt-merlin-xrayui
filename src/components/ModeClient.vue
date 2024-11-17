<template>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable">
        <thead>
            <tr>
                <td colspan="2">Configuration</td>
            </tr>
        </thead>
        <tbody v-if="outbound.settings">
            <client-status></client-status>
            <tr>
                <th>Protocol</th>
                <td>
                    <select v-model="outbound.protocol" class="input_option">
                        <option v-for="protocol in protocols" :key="protocol" :value="protocol">
                            {{ protocol }}
                        </option>
                    </select>
                    <span class="hint-color">default: vless</span>
                </td>
            </tr>
            <tr v-if="outbound.settings">
                <th>Address</th>
                <td>
                    <input type="text" maxlength="15" class="input_20_table"
                        v-model="outbound.settings.vnext[0].address"
                        onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off"
                        autocapitalize="off" />
                    <span class="hint-color"></span>
                </td>
            </tr>
            <tr>
                <th> Port</th>
                <td>
                    <input type="number" maxlength="5" class="input_6_table" v-if="outbound.settings"
                        v-model="outbound.settings.vnext[0].port" autocorrect="off" autocapitalize="off"
                        onkeypress="return validator.isNumber(this,event);" />
                </td>
            </tr>
            <tr>
                <th> UUID</th>
                <td>
                    <input type="text" maxlength="34" class="input_25_table" v-if="outbound.settings"
                        v-model="outbound.settings.vnext[0].users[0].id" autocorrect="off" autocapitalize="off" />
                </td>
            </tr>
            <tr>
                <th> Encryption</th>
                <td>
                    <input type="text" class="input_25_table" v-if="outbound.settings"
                        v-model="outbound.settings.vnext[0].users[0].encryption" autocorrect="off"
                        autocapitalize="off" />
                </td>
            </tr>
            <tr>
                <th> flow</th>
                <td>
                    <input type="text" class="input_25_table" v-if="outbound.settings"
                        v-model="outbound.settings.vnext[0].users[0].flow" autocorrect="off" autocapitalize="off" />
                </td>
            </tr>
        </tbody>
    </table>
    <div id="divApply" class="apply_gen">
        <input class="button_gen" @click.prevent="applyClientSettings()" type="button" value="Apply" />
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import engine from "../modules/Engine";
import { XrayInboundObject, XrayClientObject, XrayClientOutboundObject } from "../modules/XrayConfig";
import { SubmtActions } from "../modules/Engine";
import ClientStatus from "./ClientStatus.vue";

export default defineComponent({
    name: "ModeClient",
    components: {
        ClientStatus,
    },
    methods: {
        async applyClientSettings() {
            let delay = 5000;

            window.showLoading(delay / 1000);
            await engine.submit(SubmtActions.ConfigurationClientSave, engine.xrayClientConfig, delay);
            await engine.loadXrayConfig();
            window.hideLoading();
        },
    },
    setup() {
        const config = ref<XrayClientObject>(engine.xrayClientConfig ?? new XrayClientObject());
        const outbound = ref<XrayClientOutboundObject>(config.value.outbounds[0] ?? new XrayClientOutboundObject());

        watch(() => engine.xrayClientConfig,
            (newVal) => {
                config.value = newVal;
                outbound.value = config.value.outbounds[0] ?? new XrayClientOutboundObject();
            },
            { immediate: true, deep: true },
        );

        return {
            config,
            outbound,
            protocols: [],
        };
    },
});
</script>

<style scoped></style>