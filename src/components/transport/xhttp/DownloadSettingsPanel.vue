<template>
    <tbody v-if="proxyType === 'outbound'" class="unlocked">
        <tr>
            <th colspan="2" class="section-header" @click="toggleDownloadSettings">
                <span class="toggle-icon">{{ showDownloadSettings ? '▼' : '▶' }}</span>
                Download Settings (Uplink/Downlink Separation)
                <span class="hint-color" style="font-weight: normal; margin-left: 10px">client only, optional</span>
            </th>
        </tr>
    </tbody>

    <tbody v-if="proxyType === 'outbound' && showDownloadSettings" class="unlocked download-settings">
        <tr>
            <th>Enable Download Separation</th>
            <td>
                <input type="checkbox" v-model="enableDownloadSettings" />
                <span class="hint-color">Enable separate downlink path</span>
            </td>
        </tr>

        <template v-if="enableDownloadSettings">
            <tr>
                <th>Download Address</th>
                <td>
                    <input type="text" class="input_20_table" v-model="downloadSettings.address" placeholder="another domain/IP" />
                    <span class="hint-color">required if enabled</span>
                </td>
            </tr>

            <tr>
                <th>Download Port</th>
                <td>
                    <input type="number" min="1" max="65535" class="input_6_table" v-model.number="downloadSettings.port" />
                    <span class="hint-color">default: 443</span>
                </td>
            </tr>

            <tr>
                <th>Download Security</th>
                <td>
                    <select class="input_option" v-model="downloadSettings.security">
                        <option value="tls">tls</option>
                        <option value="reality">reality</option>
                    </select>
                    <span class="hint-color">default: tls</span>
                </td>
            </tr>

            <!-- TLS Settings for Download -->
            <download-tls-settings :tls-settings="downloadTlsSettings" :visible="downloadSettings.security === 'tls'" />

            <!-- Reality Settings for Download -->
            <download-reality-settings :reality-settings="downloadRealitySettings" :visible="downloadSettings.security === 'reality'" />

            <!-- Download XHTTP Settings -->
            <download-xhttp-settings :xhttp-settings="downloadXhttpSettings" :xhttp-extra="downloadXhttpExtra" />

            <!-- Download XMUX Settings via scoped slot -->
            <slot name="xmux" :download-xmux="downloadXmux"></slot>
        </template>
    </tbody>
</template>

<script lang="ts">
    import { defineComponent, PropType, toRef } from 'vue';
    import { XrayXhttpExtraObject } from '@/modules/TransportObjects';
    import { useXhttpDownload } from './useXhttp';
    import DownloadTlsSettings from './DownloadTlsSettings.vue';
    import DownloadRealitySettings from './DownloadRealitySettings.vue';
    import DownloadXhttpSettings from './DownloadXhttpSettings.vue';

    export default defineComponent({
        name: 'DownloadSettingsPanel',
        components: {
            DownloadTlsSettings,
            DownloadRealitySettings,
            DownloadXhttpSettings
        },
        props: {
            extra: {
                type: Object as PropType<XrayXhttpExtraObject>,
                required: true
            },
            proxyType: {
                type: String,
                default: ''
            }
        },
        setup(props) {
            const extraRef = toRef(props, 'extra');

            const {
                showDownloadSettings,
                enableDownloadSettings,
                toggleDownloadSettings,
                downloadSettings,
                downloadTlsSettings,
                downloadRealitySettings,
                downloadXhttpSettings,
                downloadXhttpExtra,
                downloadXmux
            } = useXhttpDownload(extraRef);

            return {
                showDownloadSettings,
                enableDownloadSettings,
                toggleDownloadSettings,
                downloadSettings,
                downloadTlsSettings,
                downloadRealitySettings,
                downloadXhttpSettings,
                downloadXhttpExtra,
                downloadXmux
            };
        }
    });
</script>

<style scoped>
    .section-header {
        cursor: pointer;
        background-color: #3a4245;
        user-select: none;
    }

    .section-header:hover {
        background-color: #4a5255;
    }

    .toggle-icon {
        display: inline-block;
        width: 16px;
        margin-right: 5px;
        font-size: 10px;
    }

    .download-settings tr th {
        padding-left: 20px;
    }
</style>
