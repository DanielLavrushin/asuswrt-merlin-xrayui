<template>
    <template v-if="visible">
        <tr>
            <th>Download TLS · Server Name (SNI)</th>
            <td>
                <input type="text" class="input_20_table" v-model="tlsSettings.serverName" placeholder="domain.com" />
            </td>
        </tr>
        <tr>
            <th>Download TLS · Allow Insecure</th>
            <td>
                <input type="checkbox" v-model="tlsSettings.allowInsecure" />
                <span class="hint-color">default: false</span>
            </td>
        </tr>
        <tr>
            <th>Download TLS · ALPN</th>
            <td>
                <template v-for="(opt, index) in alpnOptions" :key="index">
                    <input type="checkbox" v-model="tlsSettings.alpn" class="input" :value="opt" :id="'dl-alpn-' + index" />
                    <label :for="'dl-alpn-' + index" class="settingvalue">{{ opt.toUpperCase() }}</label>
                </template>
            </td>
        </tr>
        <tr>
            <th>Download TLS · Fingerprint</th>
            <td>
                <select class="input_option" v-model="tlsSettings.fingerprint">
                    <option v-for="(opt, index) in fingerprints" :key="index" :value="opt">
                        {{ opt || '(none)' }}
                    </option>
                </select>
            </td>
        </tr>
    </template>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { XrayStreamTlsSettingsObject } from '@/modules/CommonObjects';
import { XrayOptions } from '@/modules/Options';

export default defineComponent({
    name: 'DownloadTlsSettings',
    props: {
        tlsSettings: {
            type: Object as PropType<XrayStreamTlsSettingsObject>,
            required: true
        },
        visible: {
            type: Boolean,
            default: true
        }
    },
    setup() {
        return {
            alpnOptions: XrayOptions.alpnOptions,
            fingerprints: XrayOptions.fingerprintOptions
        };
    }
});
</script>

<style scoped>
.settingvalue {
    margin-right: 10px;
}
</style>
