import { computed, ref, watch, Ref } from 'vue';
import { XrayStreamSettingsObject, XrayXmuxObject, XrayStreamTlsSettingsObject, XrayStreamRealitySettingsObject } from '@/modules/CommonObjects';
import {
    XrayXhttpExtraObject,
    XrayXhttpDownloadSettingsObject,
    XrayXhttpDownloadXhttpSettingsObject,
    XrayXhttpDownloadExtraObject
} from '@/modules/TransportObjects';

export function useXhttp(transport: Ref<XrayStreamSettingsObject>) {
    // Core XHTTP settings
    const extra = computed(() => {
        if (!transport.value.xhttpSettings!.extra) {
            transport.value.xhttpSettings!.extra = new XrayXhttpExtraObject();
        }
        return transport.value.xhttpSettings!.extra;
    });

    const xmux = computed(() => {
        if (!extra.value.xmux) {
            extra.value.xmux = new XrayXmuxObject();
        }
        return extra.value.xmux;
    });

    const onHeaderUpdate = (headers: Record<string, unknown>) => {
        if (transport.value.xhttpSettings) {
            transport.value.xhttpSettings.headers = headers;
        }
    };

    return {
        extra,
        xmux,
        onHeaderUpdate
    };
}

export function useXhttpDownload(extra: Ref<XrayXhttpExtraObject>) {
    // Download Settings UI state
    const showDownloadSettings = ref(false);
    const enableDownloadSettings = ref(!!extra.value.downloadSettings?.address);

    const toggleDownloadSettings = () => {
        showDownloadSettings.value = !showDownloadSettings.value;
    };

    // Download Settings computed properties
    const downloadSettings = computed(() => {
        if (!extra.value.downloadSettings) {
            extra.value.downloadSettings = new XrayXhttpDownloadSettingsObject();
        }
        return extra.value.downloadSettings;
    });

    const downloadTlsSettings = computed(() => {
        if (!downloadSettings.value.tlsSettings) {
            downloadSettings.value.tlsSettings = new XrayStreamTlsSettingsObject();
        }
        return downloadSettings.value.tlsSettings;
    });

    const downloadRealitySettings = computed(() => {
        if (!downloadSettings.value.realitySettings) {
            downloadSettings.value.realitySettings = new XrayStreamRealitySettingsObject();
        }
        return downloadSettings.value.realitySettings;
    });

    const downloadXhttpSettings = computed(() => {
        if (!downloadSettings.value.xhttpSettings) {
            downloadSettings.value.xhttpSettings = new XrayXhttpDownloadXhttpSettingsObject();
        }
        return downloadSettings.value.xhttpSettings;
    });

    const downloadXhttpExtra = computed(() => {
        if (!downloadXhttpSettings.value.extra) {
            downloadXhttpSettings.value.extra = new XrayXhttpDownloadExtraObject();
        }
        return downloadXhttpSettings.value.extra;
    });

    const downloadXmux = computed(() => {
        if (!downloadXhttpExtra.value.xmux) {
            downloadXhttpExtra.value.xmux = new XrayXmuxObject();
        }
        return downloadXhttpExtra.value.xmux;
    });

    // Watch for enableDownloadSettings toggle
    watch(
        () => enableDownloadSettings.value,
        (enabled) => {
            if (!enabled) {
                extra.value.downloadSettings = undefined;
            } else if (!extra.value.downloadSettings) {
                extra.value.downloadSettings = new XrayXhttpDownloadSettingsObject();
            }
        }
    );

    // Auto-expand download settings if already configured
    watch(
        () => extra.value.downloadSettings?.address,
        (address) => {
            if (address) {
                showDownloadSettings.value = true;
                enableDownloadSettings.value = true;
            }
        },
        { immediate: true }
    );

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
