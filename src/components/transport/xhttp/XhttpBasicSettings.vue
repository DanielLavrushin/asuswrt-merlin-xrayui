<template>
    <tbody v-if="xhttpSettings">
        <tr>
            <th>CDN Host / Virtual Host</th>
            <td>
                <input type="text" class="input_20_table" v-model="xhttpSettings.host" />
            </td>
        </tr>
        <tr>
            <th>Transfer Mode</th>
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
            <th>Request Path</th>
            <td>
                <input type="text" class="input_20_table" v-model="xhttpSettings.path" />
            </td>
        </tr>
        <tr>
            <th>Header-padding bytes (range)</th>
            <td>
                <input type="text" placeholder="100-1000" class="input_20_table" v-model="extra.xPaddingBytes" />
            </td>
        </tr>
        <headers-mapping
            :headersMap="xhttpSettings.headers"
            @on:header:update="onHeaderUpdate"
        />
        <tr class="unlocked">
            <th>Disable gRPC disguise</th>
            <td><input type="checkbox" v-model="extra.noGRPCHeader" /></td>
        </tr>

        <tr>
            <th>Disable SSE disguise</th>
            <td><input type="checkbox" v-model="extra.noSSEHeader" /></td>
        </tr>

        <tr>
            <th>Max POST size (bytes)</th>
            <td>
                <input type="number" min="1" class="input_20_table" v-model.number="extra.scMaxEachPostBytes" />
            </td>
        </tr>

        <tr class="unlocked">
            <th>Min interval between POSTs (ms)</th>
            <td>
                <input type="number" min="0" class="input_20_table" v-model.number="extra.scMinPostsIntervalMs" />
            </td>
        </tr>

        <tr>
            <th>Max buffered POSTs (server)</th>
            <td>
                <input type="number" min="1" class="input_20_table" v-model.number="extra.scMaxBufferedPosts" />
            </td>
        </tr>

        <tr>
            <th>Keep-alive interval for stream-up (s)</th>
            <td>
                <input type="text" placeholder="20-80" class="input_20_table" v-model="extra.scStreamUpServerSecs" />
            </td>
        </tr>
    </tbody>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { XrayStreamHttpSettingsObject, XrayXhttpExtraObject } from '@/modules/TransportObjects';
import HeadersMapping from '../HeadersMapping.vue';

export default defineComponent({
    name: 'XhttpBasicSettings',
    components: {
        HeadersMapping
    },
    props: {
        xhttpSettings: {
            type: Object as PropType<XrayStreamHttpSettingsObject>,
            required: true
        },
        extra: {
            type: Object as PropType<XrayXhttpExtraObject>,
            required: true
        }
    },
    emits: ['header-update'],
    setup(props, { emit }) {
        const onHeaderUpdate = (headers: Record<string, unknown>) => {
            emit('header-update', headers);
        };

        return {
            modes: XrayStreamHttpSettingsObject.modes,
            onHeaderUpdate
        };
    }
});
</script>
