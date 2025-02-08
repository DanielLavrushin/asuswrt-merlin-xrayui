<template>
    <div class="formfontdesc">
        <p>{{ $t('components.DocodemoDoorInbound.modal_desc') }}</p>
        <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
            <thead>
                <tr>
                    <td colspan="2">{{ $t('components.DocodemoDoorInbound.modal_title') }}</td>
                </tr>
            </thead>
            <tbody>
                <inbound-common :inbound="inbound"></inbound-common>
                <tr>
                    <th>
                        {{ $t('components.DocodemoDoorInbound.label_follow_redirect') }}
                        <hint v-html="$t('components.DocodemoDoorInbound.hint_follow_redirect')"></hint>
                    </th>
                    <td>
                        <input type="checkbox" v-model="inbound.settings.followRedirect" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
                <tr>
                    <th>
                        {{ $t('components.DocodemoDoorInbound.label_address') }}
                        <hint v-html="$t('components.DocodemoDoorInbound.hint_address')"></hint>
                    </th>
                    <td>
                        <input type="text" class="input_20_table" v-model="inbound.settings.address" autocomplete="off"
                            autocorrect="off" autocapitalize="off" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
                <tr>
                    <th>
                        {{ $t('components.DocodemoDoorInbound.label_port') }}
                        <hint v-html="$t('components.DocodemoDoorInbound.hint_port')"></hint>
                    </th>
                    <td>
                        <input type="number" maxlength="5" class="input_6_table" v-model="inbound.settings.port"
                            autocorrect="off" autocapitalize="off"
                            onkeypress="return validator.isNumber(this,event);" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
                <tr>
                    <th>
                        {{ $t('components.DocodemoDoorInbound.label_network') }}
                        <hint v-html="$t('components.DocodemoDoorInbound.hint_network')"></hint>
                    </th>
                    <td>
                        <select class="input_option" v-model="inbound.settings.network">
                            <option v-for="opt in networks" :key="opt" :value="opt">
                                {{ opt }}
                            </option>
                        </select>
                        <span class="hint-color">default: tcp</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import InboundCommon from "./InboundCommon.vue";
import { XrayProtocol } from "./../../modules/CommonObjects";
import { XrayDokodemoDoorInboundObject, XrayInboundObject } from "./../../modules/InboundObjects";
import { XrayOptions } from "../../modules/Options";
import Hint from "./../Hint.vue";

export default defineComponent({
    name: "DocodemoDoorInbound",
    components: {
        InboundCommon,
        Hint
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
