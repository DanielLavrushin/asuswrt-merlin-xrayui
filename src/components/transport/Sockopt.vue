<template>
    <div class="formfontdesc">
        <p>Configures transparent proxies.</p>
        <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
            <thead>
                <tr>
                    <td colspan="2">Settings</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th>
                        Specifies whether to enable transparent proxy
                    </th>
                    <td>
                        <select class="input_option" v-model="sockopt.tproxy">
                            <option v-for="(opt, index) in tproxyOptions" :key="index" :value="opt">{{ opt }}</option>
                        </select>
                        <span class="hint-color">default: off</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { XraySockoptObject, XrayStreamSettingsObject } from "../../modules/CommonObjects";

export default defineComponent({
    name: "Sockopt",
    props: {
        transport: XrayStreamSettingsObject
    },
    setup(props) {

        const sockopt = ref<XraySockoptObject>(props.transport?.sockopt ?? new XraySockoptObject());


        watch(() => props.transport, (newVal) => {
            if (props.transport && !props.transport?.sockopt) {
                props.transport.sockopt = sockopt.value;
            }
            sockopt.value = props.transport?.sockopt ?? new XraySockoptObject();
        },
            { immediate: true }
        );

        return {
            sockopt,
            tproxyOptions: XraySockoptObject.tproxyOptions
        };
    },
});
</script>