import { reactive, toRaw, Ref } from 'vue';
import engine, { EngineHooks, EngineSubscriptions, SubmitActions } from '@/modules/Engine';
import { XrayObject } from '@/modules/XrayConfig';
import { EngineResponseConfig } from '@/modules/Engine';

export default function useGeneralOptions(cfg: XrayObject, ui: Ref<EngineResponseConfig | undefined>) {
  const makeBase = () => ({
    ...(ui.value?.xray ?? {}),
    startup: window.xray.custom_settings.xray_startup === 'y',
    logs_dnsmasq: ui.value?.xray?.dnsmasq ?? false,
    logs_access: cfg.log?.access !== 'none',
    logs_error: cfg.log?.error !== 'none',
    logs_dns: cfg.log?.dnsLog ?? false,
    logs_level: cfg.log?.loglevel ?? 'warning',
    geo_ip_url: ui.value?.geodata?.geoip_url ?? '',
    geo_site_url: ui.value?.geodata?.geosite_url ?? '',
    geo_auto_update: ui.value?.geodata?.auto_update ?? false,
    hooks: ui.value?.xray?.hooks ?? new EngineHooks(),
    subscriptions: ui.value?.xray?.subscriptions ?? new EngineSubscriptions(),
    subscription_auto_refresh: ui.value?.xray?.subscription_auto_refresh ?? 'disabled',
    subscription_auto_fallback: ui.value?.xray?.subscription_auto_fallback ?? false,
    subscription_fallback_interval: ui.value?.xray?.subscription_fallback_interval ?? 5,
    logs_scribe: ui.value?.integration?.scribe?.enabled ?? false,
    normalise: function () {
      this.subscriptions.protocols = undefined;
      return this;
    }
  });

  let options = reactive({ ...makeBase() });

  const hydrate = () => Object.assign(options, makeBase());

  const persist = async () => {
    await engine.executeWithLoadingProgress(async () => {
      options = options.normalise();
      await engine.submit(SubmitActions.generalOptionsApply, toRaw(options));
    });
  };

  return {
    options,
    log_levels: ['none', 'debug', 'info', 'warning', 'error'],
    ipset_options: ['off', 'bypass', 'redirect'],
    hydrate,
    persist
  };
}
