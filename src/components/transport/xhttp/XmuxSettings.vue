<template>
    <tbody class="unlocked">
        <tr>
            <th>{{ prefix }}XMUX · Max concurrent streams</th>
            <td>
                <input type="text" :placeholder="placeholders.maxConcurrency" class="input_20_table" v-model="xmux.maxConcurrency" />
            </td>
        </tr>

        <tr>
            <th>{{ prefix }}XMUX · Max base connections</th>
            <td>
                <input type="number" min="0" class="input_20_table" v-model.number="xmux.maxConnections" />
            </td>
        </tr>

        <tr>
            <th>{{ prefix }}XMUX · Max reuses per connection</th>
            <td>
                <input type="number" min="0" class="input_20_table" v-model.number="xmux.cMaxReuseTimes" />
            </td>
        </tr>

        <tr>
            <th>{{ prefix }}XMUX · Max HTTP requests{{ prefix ? '' : ' per connection' }}</th>
            <td>
                <input type="text" :placeholder="placeholders.hMaxRequestTimes" class="input_20_table" v-model="xmux.hMaxRequestTimes" />
            </td>
        </tr>

        <tr>
            <th>{{ prefix }}XMUX · Max connection age (s)</th>
            <td>
                <input type="text" :placeholder="placeholders.hMaxReusableSecs" class="input_20_table" v-model="xmux.hMaxReusableSecs" />
            </td>
        </tr>

        <tr>
            <th>{{ prefix }}XMUX · Keep-alive period (s)</th>
            <td>
                <input type="number" min="-1" class="input_20_table" v-model.number="xmux.hKeepAlivePeriod" />
            </td>
        </tr>
    </tbody>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { XrayXmuxObject } from '@/modules/CommonObjects';

export default defineComponent({
    name: 'XmuxSettings',
    props: {
        xmux: {
            type: Object as PropType<XrayXmuxObject>,
            required: true
        },
        prefix: {
            type: String,
            default: ''
        }
    },
    setup(props) {
        const placeholders = computed(() => ({
            maxConcurrency: '16-32',
            hMaxRequestTimes: '600-900',
            hMaxReusableSecs: '1800-3000'
        }));

        return {
            placeholders
        };
    }
});
</script>
