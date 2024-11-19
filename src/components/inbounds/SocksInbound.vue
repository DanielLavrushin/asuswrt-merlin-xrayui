<template>
    <div class="formfontdesc">
        <p>
            The standard SOCKS protocol implementation is compatible with SOCKS 4, SOCKS 4a, and SOCKS 5.
        </p>
        <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
            <thead>
                <tr>
                    <td colspan="2">SOCKS</td>
                </tr>
            </thead>
            <tbody>
                <inbound-common :inbound="inbound"></inbound-common>

                <tr>
                    <th>The authentication method</th>
                    <td>
                        <select v-model="inbound.settings.auth" class="input_option">
                            <option v-for="flow in authentications" :value="flow" :key="flow">{{ flow }}</option>
                        </select>
                        <span class="hint-color">default: none</span>
                    </td>
                </tr>
                <tr>
                    <th>UDP</th>
                    <td>
                        <input type="checkbox" v-model="inbound.settings.udp" />
                        <span class="hint-color">default: false</span>
                    </td>
                </tr>
                <tr v-if="inbound.settings.udp">
                    <th>Local IP address</th>
                    <td>
                        <input type="text" maxlength="15" class="input_20_table" v-model="inbound.settings.ip"
                            onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off"
                            autocapitalize="off" />
                        <span class="hint-color">default: 127.0.0.1</span>
                    </td>
                </tr>
            </tbody>
        </table>
        <clients :clients="inbound.settings.accounts"></clients>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { XraySocksInboundObject, XrayInboundObject, XrayProtocol, XrayOptions } from "../../modules/XrayConfig"
import Clients from "../clients/SocksClients.vue";
import InboundCommon from "./InboundCommon.vue";

export default defineComponent({
    name: "SocksInbound",
    components: {
        Clients,
        InboundCommon,
    },
    props: {
        inbound: XrayInboundObject<XraySocksInboundObject>,
    },
    setup(props) {

        const inbound = ref<XrayInboundObject<XraySocksInboundObject>>(props.inbound ?? new XrayInboundObject<XraySocksInboundObject>(XrayProtocol.SOCKS, new XraySocksInboundObject()));
        return {
            inbound,
            authentications: ["noauth", "password"]
        };
    },
});
</script>
