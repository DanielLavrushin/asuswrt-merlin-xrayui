import { ref, watch, Ref } from 'vue';
import { XrayStreamSettingsObject, XrayXmuxObject, XrayStreamTlsSettingsObject, XrayStreamRealitySettingsObject } from '@/modules/CommonObjects';
import {
  XrayXhttpExtraObject,
  XrayXhttpDownloadSettingsObject,
  XrayXhttpDownloadXhttpSettingsObject,
  XrayXhttpDownloadExtraObject,
  XrayStreamHttpSettingsObject
} from '@/modules/TransportObjects';

const ensureXhttpSettings = (transportValue: XrayStreamSettingsObject): { xhttpSettings: XrayStreamHttpSettingsObject; extra: XrayXhttpExtraObject; xmux: XrayXmuxObject } => {
  const xhttpSettings = transportValue.xhttpSettings ?? (transportValue.xhttpSettings = new XrayStreamHttpSettingsObject());
  const extra = xhttpSettings.extra ?? (xhttpSettings.extra = new XrayXhttpExtraObject());
  const xmux = extra.xmux ?? (extra.xmux = new XrayXmuxObject());
  return { xhttpSettings, extra, xmux };
};

const ensureDownloadSettings = (
  extraValue: XrayXhttpExtraObject
): {
  settings: XrayXhttpDownloadSettingsObject;
  tls: XrayStreamTlsSettingsObject;
  reality: XrayStreamRealitySettingsObject;
  dxhttp: XrayXhttpDownloadXhttpSettingsObject;
  dxExtra: XrayXhttpDownloadExtraObject;
  dxMux: XrayXmuxObject;
} => {
  const settings = extraValue.downloadSettings ?? (extraValue.downloadSettings = new XrayXhttpDownloadSettingsObject());
  const tls = settings.tlsSettings ?? (settings.tlsSettings = new XrayStreamTlsSettingsObject());
  const reality = settings.realitySettings ?? (settings.realitySettings = new XrayStreamRealitySettingsObject());
  const dxhttp = settings.xhttpSettings ?? (settings.xhttpSettings = new XrayXhttpDownloadXhttpSettingsObject());
  const dxExtra = dxhttp.extra ?? (dxhttp.extra = new XrayXhttpDownloadExtraObject());
  const dxMux = dxExtra.xmux ?? (dxExtra.xmux = new XrayXmuxObject());
  return { settings, tls, reality, dxhttp, dxExtra, dxMux };
};

export function useXhttp(transport: Ref<XrayStreamSettingsObject>) {
  const { extra: ensuredExtra, xmux: ensuredXmux } = ensureXhttpSettings(transport.value);

  const extra = ref<XrayXhttpExtraObject>(ensuredExtra);
  const xmux = ref<XrayXmuxObject>(ensuredXmux);

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
  const { settings, tls, reality, dxhttp, dxExtra, dxMux } = ensureDownloadSettings(extra.value);

  const downloadSettings = ref<XrayXhttpDownloadSettingsObject>(settings);
  const downloadTlsSettings = ref<XrayStreamTlsSettingsObject>(tls);
  const downloadRealitySettings = ref<XrayStreamRealitySettingsObject>(reality);
  const downloadXhttpSettings = ref<XrayXhttpDownloadXhttpSettingsObject>(dxhttp);
  const downloadXhttpExtra = ref<XrayXhttpDownloadExtraObject>(dxExtra);
  const downloadXmux = ref<XrayXmuxObject>(dxMux);

  const showDownloadSettings = ref(false);
  const enableDownloadSettings = ref<boolean>(!!settings.address);

  if (enableDownloadSettings.value) {
    extra.value.downloadSettings = downloadSettings.value;
  }

  const toggleDownloadSettings = (): void => {
    showDownloadSettings.value = !showDownloadSettings.value;
  };

  watch(
    () => enableDownloadSettings.value,
    (enabled) => {
      extra.value.downloadSettings = enabled ? downloadSettings.value : undefined;
    }
  );

  watch(
    () => downloadSettings.value.address,
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
