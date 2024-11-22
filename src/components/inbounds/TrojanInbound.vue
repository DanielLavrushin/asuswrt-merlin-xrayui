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
            </tbody>
        </table>
        <clients :clients="inbound.settings.clients"></clients>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import Clients from "../clients/TrojanClients.vue";
import InboundCommon from "./InboundCommon.vue";
import { XrayProtocol } from "../../modules/CommonObjects";
import { XrayInboundObject } from "../../modules/InboundObjects";
import { XrayTrojanInboundObject } from "../../modules/InboundObjects";

export default defineComponent({
    name: "TrojanInbound",
    components: {
        Clients,
        InboundCommon,
    },
    props: {
        inbound: XrayInboundObject<XrayTrojanInboundObject>,
    },
    setup(props) {

        const inbound = ref<XrayInboundObject<XrayTrojanInboundObject>>(props.inbound ?? new XrayInboundObject<XrayTrojanInboundObject>(XrayProtocol.TROJAN, new XrayTrojanInboundObject()));
        return {
            inbound,
            authentications: ["noauth", "password"]
        };
    },
});
</script>
