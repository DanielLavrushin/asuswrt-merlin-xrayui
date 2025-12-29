<template>
    <template v-if="visible">
        <tr>
            <th>Download Reality · Server Name</th>
            <td>
                <input type="text" class="input_20_table" v-model="realitySettings.serverName" placeholder="domain.com" />
                <span class="hint-color">required</span>
            </td>
        </tr>
        <tr>
            <th>Download Reality · Public Key</th>
            <td>
                <input type="text" class="input_30_table" v-model="realitySettings.publicKey" />
                <span class="hint-color">required</span>
            </td>
        </tr>
        <tr>
            <th>Download Reality · Short ID</th>
            <td>
                <input type="text" class="input_20_table" v-model="realitySettings.shortId" />
            </td>
        </tr>
        <tr>
            <th>Download Reality · Fingerprint</th>
            <td>
                <select class="input_option" v-model="realitySettings.fingerprint">
                    <option v-for="(opt, index) in fingerprints" :key="index" :value="opt">
                        {{ opt || '(none)' }}
                    </option>
                </select>
            </td>
        </tr>
        <tr>
            <th>Download Reality · SpiderX</th>
            <td>
                <input type="text" class="input_20_table" v-model="realitySettings.spiderX" />
            </td>
        </tr>
    </template>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { XrayStreamRealitySettingsObject } from '@/modules/CommonObjects';
import { XrayOptions } from '@/modules/Options';

export default defineComponent({
    name: 'DownloadRealitySettings',
    props: {
        realitySettings: {
            type: Object as PropType<XrayStreamRealitySettingsObject>,
            required: true
        },
        visible: {
            type: Boolean,
            default: true
        }
    },
    setup() {
        return {
            fingerprints: XrayOptions.fingerprintOptions
        };
    }
});
</script>
