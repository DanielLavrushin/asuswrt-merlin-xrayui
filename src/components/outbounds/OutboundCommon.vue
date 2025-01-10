<template>
    <tr>
        <th>Tag</th>
        <td>
            <input type="text" class="input_20_table" v-model="proxy.tag" />
            <span class="hint-color"></span>
        </td>
    </tr>
    <tr>
        <th>The IP address used to send data</th>
        <td>
            <input type="text" maxlength="15" class="input_20_table" v-model="proxy.sendThrough"
                onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off"
                autocapitalize="off" />
            <span class="hint-color">default: 0.0.0.0</span>
        </td>
    </tr>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { XrayOutboundObject } from "../../modules/OutboundObjects";
import { IProtocolType } from "../../modules/Interfaces";
import AllocateModal from "../modals/AllocateModal.vue";

export default defineComponent({
    name: "OutboundCommon",
    components: {
        AllocateModal,
    },
    props: {
        proxy: XrayOutboundObject<IProtocolType>,
    },
    methods: {

    },
    setup(props) {

        const proxy = ref<XrayOutboundObject<IProtocolType>>(props.proxy ?? new XrayOutboundObject<IProtocolType>());

        return {
            proxy
        };
    },
});
</script>
