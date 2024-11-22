<template>
    <div class="formfontdesc">
        <p>VLESS is a stateless lightweight transport protocol, which is divided into inbound and outbound parts, and
            can be used as a bridge between Xray clients and servers.
            Unlike VMess, VLESS does not rely on system time, and the authentication method is also UUID.
        </p>
        <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
            <thead>
                <tr>
                    <td colspan="2">VLESS</td>
                </tr>
            </thead>
            <tbody>
                <outbound-common :proxy="proxy"></outbound-common>
                <tr>
                    <th>Server address</th>
                    <td>
                        <input type="text" maxlength="15" class="input_20_table"
                            v-model="proxy.settings.vnext[0].address"
                            onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off"
                            autocapitalize="off" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
                <tr>
                    <th>Server port</th>
                    <td>
                        <input type="text" maxlength="5" class="input_6_table" v-model="proxy.settings.vnext[0].port"
                            autocorrect="off" autocapitalize="off"
                            onkeypress="return validator.isNumber(this,event);" />
                    </td>
                </tr>
            </tbody>
        </table>
        <clients :clients="proxy.settings.users" mode="outbound"></clients>
    </div>
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";
import { XrayOutboundObject, XraySocksOutboundObject } from "../../modules/OutboundObjects";
import { XrayProtocol } from "../../modules/CommonObjects";
import OutboundCommon from "./OutboundCommon.vue";
import Clients from "./../clients/SocksClients.vue"

export default defineComponent({
    name: "VlessOutbound",
    components: {
        OutboundCommon,
        Clients,
    },
    props: {
        proxy: XrayOutboundObject<XraySocksOutboundObject>,
    },
    setup(props) {
        const proxy = ref<XrayOutboundObject<XraySocksOutboundObject>>(props.proxy ?? new XrayOutboundObject<XraySocksOutboundObject>(XrayProtocol.SOCKS, new XraySocksOutboundObject()));

        return {
            proxy
        };
    },
});
</script>
