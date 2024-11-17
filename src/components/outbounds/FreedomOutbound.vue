<template>
    <div class="formfontdesc">
        <p>Freedom is an outbound protocol that can be used to send (normal) TCP or UDP data to any network.
        </p>
        <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
            <thead>
                <tr>
                    <td colspan="2">Freedom</td>
                </tr>
            </thead>
            <tbody>
                <outbound-common :proxy="proxy"></outbound-common>
            </tbody>
        </table>
    </div>
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";
import { XrayFreedomOutboundObject, XrayProtocol, XrayOutboundObject } from "../../modules/XrayConfig"
import OutboundCommon from "./OutboundCommon.vue";

export default defineComponent({
    name: "FreedomOutbound",
    components: {
        OutboundCommon,
    },
    props: {
        proxy: XrayOutboundObject<XrayFreedomOutboundObject>,
    },
    setup(props) {
        const proxy = ref<XrayOutboundObject<XrayFreedomOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayFreedomOutboundObject>(XrayProtocol.FREEDOM, new XrayFreedomOutboundObject()));
        return {
            proxy,
        };
    },
});
</script>
