<template>
    <div class="formfontdesc">
        <p>VMess is an encrypted transport protocol that is commonly used as a bridge between Xray clients and servers.
        </p>
        <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
            <thead>
                <tr>
                    <td colspan="2">VMess</td>
                </tr>
            </thead>
            <tbody>
                <inbound-common :inbound="inbound"></inbound-common>
            </tbody>
        </table>
        <vmess-clients :clients="inbound.settings.clients"></vmess-clients>
    </div>
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";
import { XrayVmessInboundObject, XrayInboundObject, XrayProtocol } from "../../modules/XrayConfig"
import VmessClients from "../VmessClients.vue";
import InboundCommon from "./InboundCommon.vue";
export default defineComponent({
    name: "VmessInbound",
    components: {
        VmessClients,
        InboundCommon,
    },
    props: {
        inbound: XrayInboundObject<XrayVmessInboundObject>,
    },
    setup(props) {
        const inbound = ref<XrayInboundObject<XrayVmessInboundObject>>(props.inbound ?? new XrayInboundObject<XrayVmessInboundObject>(XrayProtocol.VMESS, new XrayVmessInboundObject()));
        return {
            inbound,
        };
    },
});
</script>
