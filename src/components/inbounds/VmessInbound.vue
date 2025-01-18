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
        <clients :clients="inbound.settings.clients" :proxy="inbound"></clients>
    </div>
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";
import Clients from "../clients/VmessClients.vue";
import InboundCommon from "./InboundCommon.vue";
import { XrayProtocol } from "../../modules/CommonObjects";
import { XrayInboundObject } from "../../modules/InboundObjects";
import { XrayVmessInboundObject } from "../../modules/InboundObjects";

export default defineComponent({
    name: "VmessInbound",
    components: {
        Clients,
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
<style scoped></style>