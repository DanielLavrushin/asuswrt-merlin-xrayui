<template>
    <div class="formfontdesc">
        <p>
            The more meaningful use of http inbound is to listen in a local network or on the local machine to provide
            local services for other programs.
            The HTTP proxy can only proxy the TCP protocol and cannot handle protocols based on UDP.
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
                    <th>Allow transparent
                        <hint>
                            When set to `true`, it will forward all `HTTP` requests instead of just proxy requests.
                            <blockquote>
                                Enabling this option without proper configuration may cause an infinite loop.
                            </blockquote>
                        </hint>
                    </th>
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
import Clients from "../clients/HttpClients.vue";
import InboundCommon from "./InboundCommon.vue";
import { XrayProtocol } from "../../modules/CommonObjects";
import { XrayHttpInboundObject, XrayInboundObject } from "../../modules/InboundObjects";
import Hint from "../Hint.vue";

export default defineComponent({
    name: "HttpInbound",
    components: {
        Clients,
        InboundCommon,
        Hint,
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
