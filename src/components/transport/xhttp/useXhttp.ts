import { computed, ref, watch, Ref } from 'vue';
import { XrayStreamSettingsObject, XrayXmuxObject, XrayStreamTlsSettingsObject, XrayStreamRealitySettingsObject } from '@/modules/CommonObjects';
import {
  XrayXhttpExtraObject,
  XrayXhttpDownloadSettingsObject,
  XrayXhttpDownloadXhttpSettingsObject,
  XrayXhttpDownloadExtraObject,
  XrayStreamHttpSettingsObject
} from '@/modules/TransportObjects';

export function useXhttp(transport: Ref<XrayStreamSettingsObject>) {
  // Ensure xhttpSettings exists
  const ensureXhttpSettings = (): XrayStreamHttpSettingsObject => {
    if (!transport.value.xhttpSettings) {
      transport.value.xhttpSettings = new XrayStreamHttpSettingsObject();
    }
    return transport.value.xhttpSettings;
  };

  // Core XHTTP settings
  const extra = computed<XrayXhttpExtraObject>(() => {
    const xhttpSettings = ensureXhttpSettings();
    if (!xhttpSettings.extra) {
      xhttpSettings.extra = new XrayXhttpExtraObject();
    }
    return xhttpSettings.extra;
  });

  const xmux = computed<XrayXmuxObject>(() => {
    const extraValue = extra.value;
    if (!extraValue.xmux) {
      extraValue.xmux = new XrayXmuxObject();
    }
    return extraValue.xmux;
  });

  const onHeaderUpdate = (headers: Record<string, unknown>): void => {
    const xhttpSettings = transport.value.xhttpSettings;
    if (xhttpSettings) {
      xhttpSettings.headers = headers;
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
  const initialAddress = extra.value.downloadSettings?.address;
  const enableDownloadSettings = ref(!!initialAddress);

  const toggleDownloadSettings = (): void => {
    showDownloadSettings.value = !showDownloadSettings.value;
  };

  // Ensure downloadSettings exists
  const ensureDownloadSettings = (): XrayXhttpDownloadSettingsObject => {
    if (!extra.value.downloadSettings) {
      extra.value.downloadSettings = new XrayXhttpDownloadSettingsObject();
    }
    return extra.value.downloadSettings;
  };

  // Download Settings computed properties
  const downloadSettings = computed<XrayXhttpDownloadSettingsObject>(() => {
    return ensureDownloadSettings();
  });

  const downloadTlsSettings = computed<XrayStreamTlsSettingsObject>(() => {
    const settings = ensureDownloadSettings();
    if (!settings.tlsSettings) {
      settings.tlsSettings = new XrayStreamTlsSettingsObject();
    }
    return settings.tlsSettings;
  });

  const downloadRealitySettings = computed<XrayStreamRealitySettingsObject>(() => {
    const settings = ensureDownloadSettings();
    if (!settings.realitySettings) {
      settings.realitySettings = new XrayStreamRealitySettingsObject();
    }
    return settings.realitySettings;
  });

  const downloadXhttpSettings = computed<XrayXhttpDownloadXhttpSettingsObject>(() => {
    const settings = ensureDownloadSettings();
    if (!settings.xhttpSettings) {
      settings.xhttpSettings = new XrayXhttpDownloadXhttpSettingsObject();
    }
    return settings.xhttpSettings;
  });

  const downloadXhttpExtra = computed<XrayXhttpDownloadExtraObject>(() => {
    const xhttpSettings = downloadXhttpSettings.value;
    if (!xhttpSettings.extra) {
      xhttpSettings.extra = new XrayXhttpDownloadExtraObject();
    }
    return xhttpSettings.extra;
  });

  const downloadXmux = computed<XrayXmuxObject>(() => {
    const extraValue = downloadXhttpExtra.value;
    if (!extraValue.xmux) {
      extraValue.xmux = new XrayXmuxObject();
    }
    return extraValue.xmux;
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
