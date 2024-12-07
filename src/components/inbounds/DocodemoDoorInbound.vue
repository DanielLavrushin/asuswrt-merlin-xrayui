<template>
    <div class="formfontdesc">
        <p>Dokodemo door (Anywhere Door) can listen to a local port and forward all incoming data on this port to a
            specified server's port, achieving the effect of port mapping.</p>
        <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
            <thead>
                <tr>
                    <td colspan="2">Dokodemo-Door</td>
                </tr>
            </thead>
            <tbody>
                <inbound-common :inbound="inbound"></inbound-common>
                <tr>
                    <th>The address to forward</th>
                    <td>
                        <input type="text" class="input_20_table" v-model="inbound.settings.address" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
                <tr>
                    <th>Destination Port</th>
                    <td>
                        <input type="number" maxlength="5" class="input_6_table" v-model="inbound.settings.port"
                            autocorrect="off" autocapitalize="off"
                            onkeypress="return validator.isNumber(this,event);" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
                <tr>
                    <th>Network</th>
                    <td>
                        <select class="input_option" v-model="inbound.settings.network">
                            <option v-for="opt in networks" :key="opt" :value="opt">
                                {{ opt }}
                            </option>
                        </select>
                        <span class="hint-color">default: tcp</span>
                    </td>
                </tr>
                <tr>
                    <th>Follow Redirect</th>
                    <td>
                        <input type="checkbox" v-model="inbound.settings.followRedirect" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import InboundCommon from "./InboundCommon.vue";
import { XrayProtocol } from "./../../modules/CommonObjects";
import { XrayDokodemoDoorInboundObject, XrayInboundObject } from "./../../modules/InboundObjects";
import { XrayOptions } from "../../modules/Options";

export default defineComponent({
    name: "DocodemoDoorInbound",
    components: {
        InboundCommon,
    },
    props: {
        inbound: XrayInboundObject<XrayDokodemoDoorInboundObject>,
    },
    methods: {

    },
    setup(props) {
        const inbound = ref<XrayInboundObject<XrayDokodemoDoorInboundObject>>(props.inbound ?? new XrayInboundObject<XrayDokodemoDoorInboundObject>(XrayProtocol.DOKODEMODOOR, new XrayDokodemoDoorInboundObject()));
        return {
            inbound,
            networks: XrayOptions.networkOptions,
        };
    },
});
</script>
