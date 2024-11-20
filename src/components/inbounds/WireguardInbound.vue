<template>
    <div class="formfontdesc">
        <p>
            The Trojan protocol.
            Trojan is designed to work with correctly configured encrypted TLS tunnels.
        </p>
        <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
            <thead>
                <tr>
                    <td colspan="2">Trojan</td>
                </tr>
            </thead>
            <tbody>
                <inbound-common :inbound="inbound"></inbound-common>
                <tr>
                    <th>Private Key</th>
                    <td>
                        <input type="text" class="input_25_table" v-model="inbound.settings.secretKey" />
                        <span class="hint-color"></span>
                        <span class="row-buttons">
                            <input class="button_gen button_gen_small" type="button" value="regenerate"
                                @click.prevent="regen()" />
                        </span>
                    </td>
                </tr>
                <tr>
                    <th>KERNEL Mode</th>
                    <td>
                        <input type="checkbox" v-model="inbound.settings.kernelMode" />
                        <span class="hint-color">default: true</span>
                    </td>
                </tr>
                <tr>
                    <th>MTU</th>
                    <td>
                        <input v-model="inbound.settings.mtu" type="number" maxlength="4" class="input_6_table"
                            onkeypress="return validator.isNumber(this,event);" />
                        <span class="hint-color">default: 1420</span>
                    </td>
                </tr>
            </tbody>
        </table>
        <clients :clients="inbound.settings.peers" :privateKey="privatekey"></clients>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import engine, { SubmtActions } from "../../modules/Engine";
import { XrayWireguardInboundObject, XrayInboundObject, XrayProtocol, XrayOptions } from "../../modules/XrayConfig"
import Clients from "../clients/WireguardClients.vue";
import InboundCommon from "./InboundCommon.vue";

export default defineComponent({
    name: "WireguardInbound",

    components: {
        Clients,
        InboundCommon,
    },

    props: {
        inbound: XrayInboundObject<XrayWireguardInboundObject>,
    },

    methods: {
        async regen(privatekey: string | undefined = undefined) {
            window.showLoading();
            await engine.submit(SubmtActions.regenerateWireguardyKeys, privatekey, 1000);
            let result = await engine.getEngineConfig();
            if (this.inbound.settings) {
                this.privatekey = result.wireguard?.privatekey!;
                this.inbound.settings.secretKey = result.wireguard?.privatekey!;
            }
            window.hideLoading();
        },
    },

    setup(props) {

        const inbound = ref<XrayInboundObject<XrayWireguardInboundObject>>(props.inbound ?? new XrayInboundObject<XrayWireguardInboundObject>(XrayProtocol.WIREGUARD, new XrayWireguardInboundObject()));
        const privatekey = ref<string>(inbound.value.settings.secretKey);
        return {
            inbound,
            privatekey,
            authentications: ["noauth", "password"]
        };
    },
});
</script>
