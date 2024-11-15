<template>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable">
        <thead>
            <tr>
                <td colspan="2">Configuration</td>
            </tr>
        </thead>
        <tbody>
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
            <tr>
                <th>Address</th>
                <td>
                    <input type="text" maxlength="15" class="input_20_table" v-model="outbound.address"
                        onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off"
                        autocapitalize="off" />
                    <span class="hint-color"></span>
                </td>
            </tr>
            <tr>
                <th> Port</th>
                <td>
                    <input type="text" maxlength="5" class="input_6_table" v-model="outbound.port" autocorrect="off"
                        autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
                </td>
            </tr>
            <tr>
                <th> UUID</th>
                <td>
                    <input type="text" maxlength="34" class="input_25_table"
                        v-model="outbound.settings.vnext[0].users[0].id" autocorrect="off" autocapitalize="off"
                        onkeypress="return validator.isNumber(this,event);" />
                </td>
            </tr>
        </tbody>
    </table>
    <div id="divApply" class="apply_gen">
        <input class="button_gen" @click.prevent="applyClientSettings()" type="button" value="Apply" />
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import xrayConfig, { XrayInboundObject, XrayStreamSettingsObject } from "../modules/XrayConfig";

import ClientStatus from "./ClientStatus.vue";

export default defineComponent({
    name: "ModeClient",
    components: {
        ClientStatus,
    },
    methods: {
        applyClientSettings() {
            console.log(this.config);
        },
    },
    setup() {
        const config = ref<any>({});

        config.value.outbounds = [];
        config.value.outbounds.push({
            protocol: "vless",
            settings: {
                vnext: [
                    {
                        address: "",
                        users: [{
                            encription: "",
                            id: "",
                            flow: "",
                        }],
                    }]
            },
            streamSettings: {
                network: "raw",
                security: "reality",
                tlsSettings: {
                    serverName: "",
                    allowInsecure: false,
                },
            },
        });
        const outbound = ref(config.value.outbounds[0]);
        return {
            config,
            outbound,
            protocols: XrayInboundObject.protocols,
        };
    },
});
</script>

<style scoped></style>