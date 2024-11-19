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
        <clients :clients="inbound.settings.peers"></clients>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
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
    setup(props) {

        const inbound = ref<XrayInboundObject<XrayWireguardInboundObject>>(props.inbound ?? new XrayInboundObject<XrayWireguardInboundObject>(XrayProtocol.WIREGUARD, new XrayWireguardInboundObject()));
        return {
            inbound,
            authentications: ["noauth", "password"]
        };
    },
});
</script>
