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
                <tr>
                    <th>
                        HTTP request method
                    </th>
                    <td>
                        <select class="input_option" v-model="proxy.settings.method">
                            <option v-for="opt in methods" :key="opt" :value="opt">
                                {{ opt }}
                            </option>
                        </select>
                        <span class="hint-color">default: PUT</span>
                    </td>
                </tr>
                <tr>
                    <th>
                        Domain Names
                    </th>
                    <td>
                        <div class="textarea-wrapper">
                            <textarea v-model="hosts" rows="25"></textarea>
                        </div>
                    </td>
                </tr>
                <tr>
                    <th>The HTTP path</th>
                    <td>
                        <input type="text" maxlength="15" class="input_20_table" v-model="proxy.settings.path" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
                <tr>
                    <th>The connection health check</th>
                    <td>
                        <input type="number" maxlength="4" class="input_6_table"
                            v-model="proxy.settings.read_idle_timeout"
                            onkeypress="return validator.isNumber(this,event);" />
                        <span class="hint-color">default: unset</span>
                    </td>
                </tr>
                <tr>
                    <th>The timeout for the health check</th>
                    <td>
                        <input type="number" maxlength="4" class="input_6_table"
                            v-model="proxy.settings.health_check_timeout"
                            onkeypress="return validator.isNumber(this,event);" />
                        <span class="hint-color">default: 15</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import OutboundCommon from "./OutboundCommon.vue";
import { XrayOutboundObject } from "../../modules/OutboundObjects";
import { XrayHttpOutboundObject } from "../../modules/OutboundObjects";
import { XrayProtocol, XrayOptions } from "../../modules/Options";

export default defineComponent({
    name: "HttpOutbound",
    components: {
        OutboundCommon,
    },
    props: {
        proxy: XrayOutboundObject<XrayHttpOutboundObject>,
    },
    setup(props) {
        const proxy = ref<XrayOutboundObject<XrayHttpOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayHttpOutboundObject>(XrayProtocol.HTTP, new XrayHttpOutboundObject()));
        const hosts = ref<string>(proxy.value.settings.host.join('\n') ?? '');

        watch(
            () => hosts.value,
            (newObj) => {
                if (newObj && proxy.value.settings) {
                    proxy.value.settings.host = newObj.split("\n").filter((x) => x);
                }
            },
            { immediate: true }
        );

        return {
            proxy,
            hosts,
            methods: XrayOptions.httpMethods
        };
    },
});
</script>
