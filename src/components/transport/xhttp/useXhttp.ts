import { ref, watch, Ref } from 'vue';
import { XrayStreamSettingsObject, XrayXmuxObject, XrayStreamTlsSettingsObject, XrayStreamRealitySettingsObject } from '@/modules/CommonObjects';
import {
  XrayXhttpExtraObject,
  XrayXhttpDownloadSettingsObject,
  XrayXhttpDownloadXhttpSettingsObject,
  XrayXhttpDownloadExtraObject,
  XrayStreamHttpSettingsObject
} from '@/modules/TransportObjects';

interface XhttpSettingsResult {
  xhttpSettings: XrayStreamHttpSettingsObject;
  extra: XrayXhttpExtraObject;
  xmux: XrayXmuxObject;
}

interface DownloadSettingsResult {
  settings: XrayXhttpDownloadSettingsObject;
  tls: XrayStreamTlsSettingsObject;
  reality: XrayStreamRealitySettingsObject;
  dxhttp: XrayXhttpDownloadXhttpSettingsObject;
  dxExtra: XrayXhttpDownloadExtraObject;
  dxMux: XrayXmuxObject;
}

const ensureXhttpSettings = (transportValue: XrayStreamSettingsObject): XhttpSettingsResult => {
  if (!transportValue.xhttpSettings) {
    transportValue.xhttpSettings = new XrayStreamHttpSettingsObject();
  }
  const xhttpSettings = transportValue.xhttpSettings;

  if (!xhttpSettings.extra) {
    xhttpSettings.extra = new XrayXhttpExtraObject();
  }
  const extra = xhttpSettings.extra;

  if (!extra.xmux) {
    extra.xmux = new XrayXmuxObject();
  }
  const xmux = extra.xmux;

  return { xhttpSettings, extra, xmux };
};

const ensureDownloadSettings = (extraValue: XrayXhttpExtraObject): DownloadSettingsResult => {
  if (!extraValue.downloadSettings) {
    extraValue.downloadSettings = new XrayXhttpDownloadSettingsObject();
  }
  const settings = extraValue.downloadSettings;

  if (!settings.tlsSettings) {
    settings.tlsSettings = new XrayStreamTlsSettingsObject();
  }
  const tls = settings.tlsSettings;

  if (!settings.realitySettings) {
    settings.realitySettings = new XrayStreamRealitySettingsObject();
  }
  const reality = settings.realitySettings;

  if (!settings.xhttpSettings) {
    settings.xhttpSettings = new XrayXhttpDownloadXhttpSettingsObject();
  }
  const dxhttp = settings.xhttpSettings;

  if (!dxhttp.extra) {
    dxhttp.extra = new XrayXhttpDownloadExtraObject();
  }
  const dxExtra = dxhttp.extra;

  if (!dxExtra.xmux) {
    dxExtra.xmux = new XrayXmuxObject();
  }
  const dxMux = dxExtra.xmux;

  return { settings, tls, reality, dxhttp, dxExtra, dxMux };
};

export function useXhttp(transport: Ref<XrayStreamSettingsObject>) {
  const { extra: ensuredExtra, xmux: ensuredXmux } = ensureXhttpSettings(transport.value);

  const extra = ref<XrayXhttpExtraObject>(ensuredExtra);
  const xmux = ref<XrayXmuxObject>(ensuredXmux);

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
