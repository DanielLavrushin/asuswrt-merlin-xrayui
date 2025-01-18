<template>
    <tr>
        <th>Tag
            <hint>
                The identifier of this outbound connection, used to locate this connection in other configurations.
                <blockquote>
                    **Danger**:
                    When it is not empty, its value must be unique among all tags.
                </blockquote>
            </hint>
        </th>
        <td>
            <input type="text" class="input_20_table" v-model="proxy.tag" />
            <span class="hint-color"></span>
        </td>
    </tr>
    <tr>
        <th>The IP address used to send data
            <hint>
                The IP address used to send data. It is effective when the host has multiple IP addresses, and the
                default value is "0.0.0.0".
                <p>
                    It is allowed to fill in the IPv6 CIDR block (such as `114:514:1919:810::/64`), and Xray will use
                    the
                    random IP address in the address block to initiate external connections. Network access, routing
                    tables,
                    and kernel parameters need to be configured correctly to allow Xray to bind to any IP within the
                    address
                    block.
                </p>
                For networks that use ndp to access, it is not recommended to set a subnet smaller than `/120`,
                otherwise
                it may cause NDP flood and a series of problems such as the router neighbor cache being filled up.
            </hint>
        </th>
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
import Hint from "./../Hint.vue";

export default defineComponent({
    name: "OutboundCommon",
    components: {
        AllocateModal,
        Hint
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
