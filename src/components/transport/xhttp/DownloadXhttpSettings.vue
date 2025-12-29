<template>
    <template v-if="visible">
        <tr>
            <th>Download XHTTP · Path</th>
            <td>
                <input type="text" class="input_20_table" v-model="xhttpSettings.path" placeholder="must match uplink path" />
                <span class="hint-color">must be same as uplink</span>
            </td>
        </tr>

        <tr>
            <th>Download XHTTP · Host</th>
            <td>
                <input type="text" class="input_20_table" v-model="xhttpSettings.host" />
            </td>
        </tr>

        <tr>
            <th>Download XHTTP · Mode</th>
            <td>
                <select class="input_option" v-model="xhttpSettings.mode">
                    <option v-for="opt in modes" :key="opt" :value="opt">
                        {{ opt }}
                    </option>
                </select>
                <span class="hint-color">default: auto</span>
            </td>
        </tr>

        <tr>
            <th>Download · Header-padding bytes</th>
            <td>
                <input type="text" placeholder="100-1000" class="input_20_table" v-model="xhttpExtra.xPaddingBytes" />
            </td>
        </tr>

        <tr>
            <th>Download · Disable SSE disguise</th>
            <td>
                <input type="checkbox" v-model="xhttpExtra.noSSEHeader" />
            </td>
        </tr>
    </template>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { XrayXhttpDownloadXhttpSettingsObject, XrayXhttpDownloadExtraObject, XrayStreamHttpSettingsObject } from '@/modules/TransportObjects';

export default defineComponent({
    name: 'DownloadXhttpSettings',
    props: {
        xhttpSettings: {
            type: Object as PropType<XrayXhttpDownloadXhttpSettingsObject>,
            required: true
        },
        xhttpExtra: {
            type: Object as PropType<XrayXhttpDownloadExtraObject>,
            required: true
        },
        visible: {
            type: Boolean,
            default: true
        }
    },
    setup() {
        return {
            modes: XrayStreamHttpSettingsObject.modes
        };
    }
});
</script>
