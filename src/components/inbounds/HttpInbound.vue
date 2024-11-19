<template>
    <div class="formfontdesc">
        <p>
            The more meaningful use of http inbound is to listen in a local network or on the local machine to provide
            local services for other programs.
        </p>
        <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
            <thead>
                <tr>
                    <td colspan="2">HTTP protocol</td>
                </tr>
            </thead>
            <tbody>
                <inbound-common :inbound="inbound"></inbound-common>
                <tr>
                    <th>Allow transparent</th>
                    <td>
                        <input type="checkbox" v-model="inbound.settings.allowTransparent" />
                        <span class="hint-color">default:false</span>
                    </td>
                </tr>
            </tbody>
        </table>
        <clients :clients="inbound.settings.clients"></clients>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { XrayHttpInboundObject, XrayInboundObject, XrayProtocol } from "../../modules/XrayConfig"
import Clients from "../clients/HttpClients.vue";
import InboundCommon from "./InboundCommon.vue";

export default defineComponent({
    name: "HttpInbound",
    components: {
        Clients,
        InboundCommon,
    },
    props: {
        inbound: XrayInboundObject<XrayHttpInboundObject>,
    },
    setup(props) {

        const inbound = ref<XrayInboundObject<XrayHttpInboundObject>>(props.inbound ?? new XrayInboundObject<XrayHttpInboundObject>(XrayProtocol.HTTP, new XrayHttpInboundObject()));
        return {
            inbound,
        };
    },
});
</script>
