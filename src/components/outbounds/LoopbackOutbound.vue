<template>
    <div class="formfontdesc">
        <p>The transmission mode based on HTTP/2 fully implements the HTTP/2 standard and can be relayed by other HTTP
            servers (such as Nginx).
            Based on the recommendations of HTTP/2, both the client and server must enable TLS to use this transmission
            mode normally.
            HTTP/2 has built-in multiplexing, so it is not recommended to enable mux.cool when using HTTP/2.
        </p>
        <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
            <thead>
                <tr>
                    <td colspan="2">HTTP/2</td>
                </tr>
            </thead>
            <tbody>
                <outbound-common :proxy="proxy"></outbound-common>
                <tr v-if="inbounds.length">
                    <th>Inbound Rule</th>
                    <td>
                        <select class="input_option" v-model="proxy.settings.inboundTag">
                            <option></option>
                            <option v-for="opt in inbounds" :key="opt" :value="opt">
                                {{ opt }}
                            </option>
                        </select>
                        <span class="hint-color"></span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import xrayConfig from "../../modules/XrayConfig";
import { XrayProtocol } from "../../modules/CommonObjects";
import { LoopbackOutboundObject, XrayOutboundObject } from "../../modules/OutboundObjects";
import OutboundCommon from "./OutboundCommon.vue";

export default defineComponent({
    name: "LoopbackOutbound",
    components: {
        OutboundCommon,
    },
    props: {
        proxy: XrayOutboundObject<LoopbackOutboundObject>,
    },
    setup(props) {
        const proxy = ref<XrayOutboundObject<LoopbackOutboundObject>>(props.proxy ?? new XrayOutboundObject<LoopbackOutboundObject>(XrayProtocol.LOOPBACK, new LoopbackOutboundObject()));
        const inbounds = ref(
            Array.from(
                new Set(
                    xrayConfig.routing?.rules
                        .flatMap(rule => rule.inboundTag || [])
                        .filter(tag => tag && tag.trim() !== "")
                )
            )
        );
        return {
            proxy,
            inbounds
        };
    },
});
</script>
