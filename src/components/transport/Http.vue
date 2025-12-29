<template>
    <xhttp-basic-settings v-if="transport.xhttpSettings" :xhttp-settings="transport.xhttpSettings" :extra="extra" @header-update="onHeaderUpdate" />

    <xmux-settings :xmux="xmux" />

    <download-settings-panel :extra="extra" :proxy-type="proxyType">
        <template #xmux="{ downloadXmux }">
            <xmux-settings :xmux="downloadXmux" prefix="Download " />
        </template>
    </download-settings-panel>
</template>

<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { XrayStreamSettingsObject } from '@/modules/CommonObjects';
    import { useXhttp, XhttpBasicSettings, XmuxSettings, DownloadSettingsPanel } from './xhttp';

    export default defineComponent({
        name: 'Http',
        components: {
            XhttpBasicSettings,
            XmuxSettings,
            DownloadSettingsPanel
        },
        props: {
            transport: {
                type: Object as () => XrayStreamSettingsObject,
                required: true
            },
            proxyType: {
                type: String,
                default: ''
            }
        },
        setup(props) {
            const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());

            // Use XHTTP composable for core settings
            const { extra, xmux, onHeaderUpdate } = useXhttp(transport);

            return {
                transport,
                extra,
                xmux,
                onHeaderUpdate
            };
        }
    });
</script>
