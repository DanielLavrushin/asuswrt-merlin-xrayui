import { ref, watch, Ref } from 'vue';
import { XrayStreamSettingsObject, XrayXmuxObject, XrayStreamTlsSettingsObject, XrayStreamRealitySettingsObject } from '@/modules/CommonObjects';
import {
  XrayXhttpExtraObject,
  XrayXhttpDownloadSettingsObject,
  XrayXhttpDownloadXhttpSettingsObject,
  XrayXhttpDownloadExtraObject,
  XrayStreamHttpSettingsObject
} from '@/modules/TransportObjects';

export function useXhttp(transport: Ref<XrayStreamSettingsObject>) {
  // Initialize xhttpSettings and defaults eagerly
  if (!transport.value.xhttpSettings) {
    transport.value.xhttpSettings = new XrayStreamHttpSettingsObject();
  }
  if (!transport.value.xhttpSettings.extra) {
    transport.value.xhttpSettings.extra = new XrayXhttpExtraObject();
  }
  const extra = ref<XrayXhttpExtraObject>(transport.value.xhttpSettings.extra);
  if (!extra.value.xmux) {
    extra.value.xmux = new XrayXmuxObject();
  }
  const xmux = ref<XrayXmuxObject>(extra.value.xmux);

  const onHeaderUpdate = (headers: Record<string, unknown>): void => {
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
  // Prepare downloadSettings object without mutating inside computed
  const initialDownload = extra.value.downloadSettings;
  const downloadSettings = ref<XrayXhttpDownloadSettingsObject>(initialDownload ?? new XrayXhttpDownloadSettingsObject());

  // Keep extra.downloadSettings in sync when enabled
  const showDownloadSettings = ref(false);
  const enableDownloadSettings = ref(!!initialDownload?.address);

  if (enableDownloadSettings.value) {
    extra.value.downloadSettings = downloadSettings.value;
  }

  const toggleDownloadSettings = (): void => {
    showDownloadSettings.value = !showDownloadSettings.value;
  };

  // Nested settings, initialized eagerly
  if (!downloadSettings.value.tlsSettings) {
    downloadSettings.value.tlsSettings = new XrayStreamTlsSettingsObject();
  }
  const downloadTlsSettings = ref<XrayStreamTlsSettingsObject>(downloadSettings.value.tlsSettings);

  if (!downloadSettings.value.realitySettings) {
    downloadSettings.value.realitySettings = new XrayStreamRealitySettingsObject();
  }
  const downloadRealitySettings = ref<XrayStreamRealitySettingsObject>(downloadSettings.value.realitySettings);

  if (!downloadSettings.value.xhttpSettings) {
    downloadSettings.value.xhttpSettings = new XrayXhttpDownloadXhttpSettingsObject();
  }
  const downloadXhttpSettings = ref<XrayXhttpDownloadXhttpSettingsObject>(downloadSettings.value.xhttpSettings);

  if (!downloadXhttpSettings.value.extra) {
    downloadXhttpSettings.value.extra = new XrayXhttpDownloadExtraObject();
  }
  const downloadXhttpExtra = ref<XrayXhttpDownloadExtraObject>(downloadXhttpSettings.value.extra);

  if (!downloadXhttpExtra.value.xmux) {
    downloadXhttpExtra.value.xmux = new XrayXmuxObject();
  }
  const downloadXmux = ref<XrayXmuxObject>(downloadXhttpExtra.value.xmux);

  // Watch for enableDownloadSettings toggle
  watch(
    () => enableDownloadSettings.value,
    (enabled) => {
      if (!enabled) {
        extra.value.downloadSettings = undefined;
      } else {
        extra.value.downloadSettings = downloadSettings.value;
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
