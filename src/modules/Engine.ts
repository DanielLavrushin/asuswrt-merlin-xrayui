/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-misused-promises */
import axios, { AxiosError } from 'axios';
import { gzip } from 'pako';
import { xrayConfig, XrayObject } from './XrayConfig';
import {
  XrayBlackholeOutboundObject,
  XrayLoopbackOutboundObject,
  XrayDnsOutboundObject,
  XrayFreedomOutboundObject,
  XrayTrojanOutboundObject,
  XrayOutboundObject,
  XraySocksOutboundObject,
  XrayVmessOutboundObject,
  XrayVlessOutboundObject,
  XrayHttpOutboundObject,
  XrayShadowsocksOutboundObject,
  XrayHysteriaOutboundObject,
  XrayWireguardOutboundObject
} from './OutboundObjects';
import {
  XrayDnsObject,
  XrayStreamSettingsObject,
  XrayRoutingObject,
  XrayRoutingRuleObject,
  XraySniffingObject,
  XrayRoutingPolicy,
  XrayAllocateObject,
  XrayStreamRealitySettingsObject,
  XrayStreamTlsSettingsObject,
  XraySockoptObject,
  XrayLogObject,
  XrayStreamTlsCertificateObject,
  XrayReverseObject,
  XrayReverseItem,
  XrayDnsServerObject,
  XrayFakeDnsObject,
  XrayBalancerObject,
  XrayBalancerStrategyObject
} from './CommonObjects';
import { plainToInstance } from 'class-transformer';
import {
  XrayDokodemoDoorInboundObject,
  XrayHttpInboundObject,
  XrayInboundObject,
  XrayShadowsocksInboundObject,
  XraySocksInboundObject,
  XrayTrojanInboundObject,
  XrayTunInboundObject,
  XrayVlessInboundObject,
  XrayVmessInboundObject,
  XrayWireguardInboundObject,
  XrayHysteriaInboundObject
} from './InboundObjects';
import {
  XrayStreamHttpSettingsObject,
  XrayStreamGrpcSettingsObject,
  XrayStreamHttpUpgradeSettingsObject,
  XrayStreamHysteriaSettingsObject,
  XrayStreamKcpSettingsObject,
  XrayStreamTcpSettingsObject,
  XrayStreamWsSettingsObject,
  XrayFinalMaskObject,
  XrayFinalMaskSettingsObject,
  XrayStreamSplitHttpSettingsObject
} from './TransportObjects';
import { XrayProtocol } from './Options';

// Protocol → settings class mappings for deserialization
const inboundSettingsMap: Record<string, new () => any> = {
  [XrayProtocol.DOKODEMODOOR]: XrayDokodemoDoorInboundObject,
  [XrayProtocol.SOCKS]: XraySocksInboundObject,
  [XrayProtocol.WIREGUARD]: XrayWireguardInboundObject,
  [XrayProtocol.VLESS]: XrayVlessInboundObject,
  [XrayProtocol.VMESS]: XrayVmessInboundObject,
  [XrayProtocol.SHADOWSOCKS]: XrayShadowsocksInboundObject,
  [XrayProtocol.HTTP]: XrayHttpInboundObject,
  [XrayProtocol.TROJAN]: XrayTrojanInboundObject,
  [XrayProtocol.TUN]: XrayTunInboundObject,
  [XrayProtocol.HYSTERIA]: XrayHysteriaInboundObject
};

const outboundSettingsMap: Record<string, new () => any> = {
  [XrayProtocol.FREEDOM]: XrayFreedomOutboundObject,
  [XrayProtocol.BLACKHOLE]: XrayBlackholeOutboundObject,
  [XrayProtocol.SOCKS]: XraySocksOutboundObject,
  [XrayProtocol.TROJAN]: XrayTrojanOutboundObject,
  [XrayProtocol.VMESS]: XrayVmessOutboundObject,
  [XrayProtocol.VLESS]: XrayVlessOutboundObject,
  [XrayProtocol.WIREGUARD]: XrayWireguardOutboundObject,
  [XrayProtocol.LOOPBACK]: XrayLoopbackOutboundObject,
  [XrayProtocol.DNS]: XrayDnsOutboundObject,
  [XrayProtocol.HTTP]: XrayHttpOutboundObject,
  [XrayProtocol.SHADOWSOCKS]: XrayShadowsocksOutboundObject,
  [XrayProtocol.HYSTERIA]: XrayHysteriaOutboundObject
};

function deserializeProxy<T>(proxy: any, settingsMap: Record<string, new () => any>, ProxyClass: new () => T): T {
  const SettingsClass = settingsMap[proxy.protocol];
  if (SettingsClass) {
    proxy = plainToInstance(ProxyClass, proxy);
    proxy.settings = plainToInstance(SettingsClass, proxy.settings) ?? new SettingsClass();
  }
  return proxy;
}

function deserializeArray<T>(items: any[] | undefined, ItemClass: new () => T): void {
  items?.forEach((item, index) => {
    items[index] = plainToInstance(ItemClass, item);
  });
}

function deserializeTlsCertificates(proxies: any[]): void {
  proxies.forEach((proxy) => {
    if (proxy.streamSettings?.tlsSettings?.certificates) {
      deserializeArray(proxy.streamSettings.tlsSettings.certificates, XrayStreamTlsCertificateObject);
    }
  });
}

export class EngineWireguard {
  public privateKey!: string;
  public publicKey!: string;
}

export class EngineReality {
  public privateKey!: string;
  public publicKey!: string;
}

export class EngineSsl {
  public certificateFile!: string;
  public keyFile!: string;
}

export class EngineEch {
  public configList!: string;
  public serverKeys!: string;
}
export class EngineClientConnectionStatus {
  public ipAddress?: string;
  public countryName?: string;
  public countryCode?: string;
  public connected?: boolean;
}

export class EngineConnectionStatus {
  [outboundTag: string]: ConnectionStatusEntry;
}

export interface ConnectionStatusEntry {
  alive: boolean;
  delay: number;
  outbound_tag: string;
  last_seen_time: number;
  last_try_time: number;
}

export class EngineLoadingProgress {
  public progress = 0;
  public message = '';

  constructor(progress?: number, message?: string) {
    if (progress) {
      this.progress = progress;
    }
    if (message) {
      this.message = message;
    }
  }
}
export class EngineHooks {
  public before_firewall_start?: string;
  public after_firewall_start?: string;
  public after_firewall_cleanup?: string;
}
export class EngineSubscriptions {
  public links?: string[] = [];
  public protocols?: Record<string, string[]> = {};
  public filters?: string[] = [];
}

export class EngineGeoTags {
  public geosite?: string[] = [];
  public geoip?: string[] = [];
  public xrayui?: string[] = [];
}

export class EngineResponseConfig {
  public wireguard?: EngineWireguard;
  public reality?: EngineReality;
  public certificates?: EngineSsl;
  public ech?: EngineEch;
  public integration?: {
    scribe?: {
      enabled: boolean;
    };
  };
  public xray?: {
    ipsec: string;
    debug: boolean;
    clients_check: boolean;
    test: string;
    uptime: number;
    ui_version: string;
    core_version: string;
    profile: string;
    profiles: string[];
    backups: string[];
    github_proxy: string;
    dnsmasq: boolean;
    logs_max_size: number;
    logs_dor: boolean;
    skip_test: boolean;
    check_connection: boolean;
    startup_delay: number;
    sleep_time: number;
    hooks?: EngineHooks;
    subscriptions?: EngineSubscriptions;
    dns_only?: boolean;
    block_quic?: boolean;
    logs_scribe?: boolean;
    subscription_auto_refresh?: string;
    subscription_auto_fallback?: boolean;
    subscription_fallback_interval?: number;
  };
  public geodata?: EngineGeodatConfig = new EngineGeodatConfig();
  public loading?: EngineLoadingProgress;
  public connection_check?: EngineClientConnectionStatus;
}
export class EngineGeodatConfig {
  public community?: Record<string, string>;
  public geoip_url?: string;
  public geosite_url?: string;
  public auto_update?: boolean;
  public tags?: string[] = [];
  public exported_tags?: EngineGeoTags;
}

export class GeodatTagRequest {
  public tag?: string;
  public isNew!: boolean;
  public content?: string;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export enum SubmitActions {
  configurationSetMode = 'xrayui_configuration_mode',
  configurationApply = 'xrayui_configuration_apply',
  configurationStageChunk = 'xrayui_configuration_stagechunk',
  clientsOnline = 'xrayui_connectedclients',
  refreshConfig = 'xrayui_refreshconfig',
  serverStart = 'xrayui_serverstatus_start',
  serverRestart = 'xrayui_serverstatus_restart',
  serverStop = 'xrayui_serverstatus_stop',
  serverTestConfig = 'xrayui_testconfig',
  regenerateRealityKeys = 'xrayui_regenerate_realitykeys',
  regenerateWireguardKeys = 'xrayui_regenerate_wgkeys',
  regenerateSslCertificates = 'xrayui_regenerate_sslcertificates',
  generateEchKeys = 'xrayui_regenerate_echkeys',
  enableLogs = 'xrayui_configuration_logs',
  performUpdate = 'xrayui_update',
  toggleStartupOption = 'xrayui_configuration_togglestartup',
  configurationGenerateDefaultConfig = 'xrayui_configuration_generatedefaultconfig',
  geodataCommunityUpdate = 'xrayui_geodata_communityupdate',
  geoDataCustomGetTags = 'xrayui_geodata_customtagfiles',
  geoDataRecompile = 'xrayui_geodata_customrecompile',
  geoDataRecompileAll = 'xrayui_geodata_customrecompileall',
  geoDataCustomDeleteTag = 'xrayui_geodata_customdeletetag',
  fetchXrayLogs = 'xrayui_configuration_logs_fetch',
  updateLogsLevel = 'xrayui_configuration_logs_changeloglevel',
  checkConnection = 'xrayui_configuration_checkconnection',
  checkConnectionStatus = 'xrayui_connectionstatus',
  initResponse = 'xrayui_configuration_initresponse',
  generalOptionsApply = 'xrayui_configuration_applygeneraloptions',
  xrayVersionSwitch = 'xrayui_configuration_xrayversionswitch',
  changeProfile = 'xrayui_configuration_changeprofile',
  deleteProfile = 'xrayui_configuration_deleteprofile',
  createBackup = 'xrayui_configuration_backup',
  clearBackup = 'xrayui_configuration_backupclear',
  restoreBackup = 'xrayui_configuration_backuprestore',
  subscribeFetchProtocols = 'xrayui_configuration_sbscrpts_fetchprotocols',
  rtlsScanStart = 'xrayui_rtlsscan_start',
  rtlsScanStop = 'xrayui_rtlsscan_stop',
  b4sniClearLogs = 'xrayui_b4sni_clearlogs',
  b4sniStart = 'xrayui_b4sni_start',
  b4sniStop = 'xrayui_b4sni_stop'
}

export class Engine {
  public xrayConfig: XrayObject = xrayConfig;
  public mode = 'server';
  private readonly zero_uuid = '10000000-1000-4000-8000-100000000000';
  private subscriptionsNotFound = false;

  private splitPayload(payload: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let index = 0;
    while (index < payload.length) {
      chunks.push(payload.slice(index, index + chunkSize));
      index += chunkSize;
    }
    return chunks;
  }
  public delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  public setCookie = (name: string, val: string): void => {
    const date = new Date();
    const value = val;
    date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + value + '; expires=' + date.toUTCString() + '; path=/';
  };

  public getCookie = (name: string): string | undefined => {
    const value = '; ' + document.cookie;
    const parts = value.split('; ' + name + '=');

    if (parts.length === 2) {
      return parts.pop()?.split(';').shift();
    }
  };

  public deleteCookie = (name: string): void => {
    const date = new Date();
    date.setTime(date.getTime() + -1 * 24 * 60 * 60 * 1000);
    document.cookie = name + '=; expires=' + date.toUTCString() + '; path=/';
  };

  public githubProxyUrl = (url: string, proxy: string | undefined | null): string => {
    if (!url || !proxy || proxy === 'null') return url;
    if (!url.includes('github.com')) return url;
    return proxy + url;
  };

  public async fetchGithubJson<T = any>(url: string, proxy: string | undefined | null, config?: any): Promise<T> {
    const proxied = this.githubProxyUrl(url, proxy);
    if (proxied !== url) {
      try {
        const r = await axios.get<T>(proxied, config);
        return r.data;
      } catch (e) {
        console.warn('[xrayui] github proxy failed, falling back to direct:', proxied, e);
      }
    }
    const r = await axios.get<T>(url, config);
    return r.data;
  }

  private readonly amngCustomLimit = 8 * 1024;
  private readonly nvramChunkSize = 2048;
  private readonly stagingChunkSize = 2048;
  private readonly stagingInterChunkDelay = 1200;

  public async submit(action: string, payload: object | string | number | null | undefined = undefined, delay = 1000): Promise<void> {
    if (payload === undefined || payload === null) {
      return this.postForm(action, false, delay);
    }

    const payloadString = this.compressPayload(JSON.stringify(payload));
    const chunks = this.splitPayload(payloadString, this.nvramChunkSize);
    chunks.forEach((chunk: string, idx) => {
      window.xray.custom_settings[`xray_payload${idx}`] = chunk;
    });

    const serialized = JSON.stringify(window.xray.custom_settings);
    if (serialized.length <= this.amngCustomLimit) {
      return this.postForm(action, true, delay);
    }

    // payload too large for single POST; fall back to chunked staging
    chunks.forEach((_, idx) => {
      delete window.xray.custom_settings[`xray_payload${idx}`];
    });
    return this.submitStaged(action, payloadString, delay);
  }

  private compressPayload(raw: string): string {
    if (raw.length < 512) return raw;
    try {
      const compressed = gzip(raw);
      let binary = '';
      for (const b of compressed) binary += String.fromCodePoint(b);
      const encoded = 'gz:' + btoa(binary);
      return encoded.length < raw.length ? encoded : raw;
    } catch {
      return raw;
    }
  }

  private postForm(action: string, includeCustomSettings: boolean, delay: number): Promise<void> {
    return new Promise((resolve) => {
      const iframeName = 'hidden_frame_' + Math.random().toString(36).substring(2, 9);
      const iframe = document.createElement('iframe');
      iframe.name = iframeName;
      iframe.style.display = 'none';

      document.body.appendChild(iframe);

      const form = document.createElement('form');
      form.method = 'post';
      form.action = '/start_apply.htm';
      form.target = iframeName;

      this.create_form_element(form, 'hidden', 'action_mode', 'apply');
      this.create_form_element(form, 'hidden', 'action_script', action);
      this.create_form_element(form, 'hidden', 'modified', '0');
      this.create_form_element(form, 'hidden', 'action_wait', '');

      let amngCustomInput: HTMLInputElement | null = null;
      if (includeCustomSettings) {
        amngCustomInput = document.createElement('input');
        amngCustomInput.type = 'hidden';
        amngCustomInput.name = 'amng_custom';
        amngCustomInput.value = JSON.stringify(window.xray.custom_settings);
        form.appendChild(amngCustomInput);
      }

      document.body.appendChild(form);

      iframe.onload = () => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);

        setTimeout(() => {
          resolve();
        }, delay);
      };
      form.submit();
      if (amngCustomInput && form.contains(amngCustomInput)) {
        form.removeChild(amngCustomInput);
      }
    });
  }

  private async submitStaged(action: string, payloadString: string, delay: number): Promise<void> {
    const stageKeys = ['xray_stage_session', 'xray_stage_index', 'xray_stage_total', 'xray_stage_data', 'xray_staged_session'];
    const stripStaleKeys = () => {
      Object.keys(window.xray.custom_settings).forEach((k) => {
        if (k.startsWith('xray_payload') || stageKeys.includes(k)) {
          delete (window.xray.custom_settings as Record<string, unknown>)[k];
        }
      });
    };

    stripStaleKeys();

    const chunks = this.splitPayload(payloadString, this.stagingChunkSize);
    const session = this.generateSessionId();

    try {
      for (let idx = 0; idx < chunks.length; idx++) {
        window.xray.custom_settings.xray_stage_session = session;
        window.xray.custom_settings.xray_stage_index = String(idx);
        window.xray.custom_settings.xray_stage_total = String(chunks.length);
        window.xray.custom_settings.xray_stage_data = chunks[idx];

        const serialized = JSON.stringify(window.xray.custom_settings);
        if (serialized.length > this.amngCustomLimit) {
          throw new Error(
            `Staged chunk ${idx + 1}/${chunks.length} (${serialized.length} bytes) exceeds the ${this.amngCustomLimit}-byte ` +
              `amng_custom limit. Other custom settings are leaving too little headroom for the upload.`
          );
        }

        await this.postForm(SubmitActions.configurationStageChunk, true, this.stagingInterChunkDelay);
      }

      delete window.xray.custom_settings.xray_stage_session;
      delete window.xray.custom_settings.xray_stage_index;
      delete window.xray.custom_settings.xray_stage_total;
      delete window.xray.custom_settings.xray_stage_data;
      window.xray.custom_settings.xray_staged_session = session;

      await this.postForm(action, true, delay);
    } finally {
      stripStaleKeys();
    }
  }

  private generateSessionId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 10);
    return `s${ts}${rand}`;
  }

  create_form_element = (form: HTMLFormElement, type: string, name: string, value: string): HTMLInputElement => {
    const input = document.createElement('input');
    input.type = type;
    input.name = name;
    input.value = value;
    form.appendChild(input);
    return input;
  };

  uuid = () => {
    return this.zero_uuid.replace(/[018]/g, (c) => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16));
  };

  generateRandomBase64 = (length: number | undefined = 32): string => {
    if (!length || length < 1) return '';
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    const base64String = btoa(String.fromCharCode(...randomBytes));
    return base64String;
  };

  prepareServerConfig(config: XrayObject): XrayObject {
    config.inbounds.forEach((proxy) => {
      proxy.normalize();
    });

    config.outbounds.forEach((proxy) => {
      proxy.normalize();
    });

    if (config.dns) {
      config.dns.normalize();
    }

    if (config.routing) {
      config.routing.normalize();
    }

    if (config.log) {
      config.log.normalize();
    }

    if (config.reverse) {
      config.reverse = config.reverse.normalize();
    }

    if (config.fakedns) {
      config.fakedns = config.fakedns.map((fake: XrayFakeDnsObject) => {
        if (!(fake instanceof XrayFakeDnsObject)) {
          const instance = plainToInstance(XrayFakeDnsObject, fake);
          fake = Array.isArray(instance) ? instance[0] : instance;
        }
        fake.normalize();
        return fake;
      });

      if (config.fakedns.length === 0) {
        config.fakedns = undefined;
      }
    }

    return config;
  }

  async getGeodata(): Promise<EngineGeodatConfig | undefined> {
    const result = await this.getXrayResponse();
    return result.geodata;
  }

  async getRealityKeys(): Promise<EngineReality | undefined> {
    const result = await this.getXrayResponse();
    return result.reality;
  }

  async getSslCertificates(): Promise<EngineSsl | undefined> {
    const response = await this.getXrayResponse();
    return response.certificates;
  }

  async getEchKeys(): Promise<EngineEch | undefined> {
    const response = await this.getXrayResponse();
    return response.ech;
  }

  async getClientConnectionStatus(): Promise<EngineClientConnectionStatus | undefined> {
    const response = await this.getXrayResponse();
    return response.connection_check;
  }

  async getConnectionStatus(): Promise<EngineConnectionStatus | undefined> {
    const response = await axios.get<EngineConnectionStatus>(`/ext/xrayui/connection-status.json?_=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0'
      }
    });
    let responseConfig = response.data;
    return responseConfig;
  }

  async getXrayResponse({ light = false }: { light?: boolean } = {}): Promise<EngineResponseConfig> {
    const response = await axios.get<EngineResponseConfig>(`/ext/xrayui/xray-ui-response.json?_=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0'
      }
    });
    let responseConfig = response.data;
    if (!light) {
      await this.loadSubscriptions(responseConfig);
      this.loadGeoTags();
    }
    return responseConfig;
  }

  async loadSubscriptions(resp: EngineResponseConfig): Promise<EngineSubscriptions | undefined> {
    if (this.subscriptionsNotFound) {
      return new EngineSubscriptions();
    }
    try {
      const response = await axios.get<Record<string, string[]>>(`/ext/xrayui/subscriptions.json?_=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0'
        }
      });
      this.subscriptionsNotFound = false;
      if (resp.xray) {
        resp.xray.subscriptions ??= new EngineSubscriptions();
        resp.xray.subscriptions.protocols = response.data;
        return resp.xray.subscriptions;
      }
    } catch (e: any) {
      if (e?.response?.status === 404) {
        this.subscriptionsNotFound = true;
      }
    }
    return new EngineSubscriptions();
  }

  resetSubscriptionsCache(): void {
    this.subscriptionsNotFound = false;
  }

  async loadGeoTags(): Promise<EngineGeoTags | undefined> {
    try {
      const response = await axios.get<EngineGeoTags>(`/ext/xrayui/geotags.json?_=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0'
        }
      });
      window.xray.geotags = response.data;
      return plainToInstance(EngineGeoTags, response.data);
    } catch (e) {
      console.error('Error loading geo tags:', e);
      return new EngineGeoTags();
    }
  }

  async loadsRtlsResults(): Promise<string | undefined> {
    try {
      const response = await axios.get<string>(`/ext/xrayui/rtls-results.json?_=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0'
        }
      });
      return response.data;
    } catch (e) {
      console.error('Error loading rtls results:', e);
      return undefined;
    }
  }

  async executeWithLoadingProgress(action: () => Promise<void>, windowReload = true): Promise<void> {
    let loadingProgress = new EngineLoadingProgress(0, 'Please, wait');
    window.showLoading(null, loadingProgress);

    await action();
    await this.checkLoadingProgress(loadingProgress, windowReload);
  }

  async checkLoadingProgress(loadingProgress: EngineLoadingProgress, windowReload = true): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkProgressInterval = setInterval(async () => {
        try {
          const response = await this.getXrayResponse({ light: true });
          if (response.loading) {
            loadingProgress = response.loading;
            window.updateLoadingProgress(loadingProgress);
          } else {
            clearInterval(checkProgressInterval);
            window.hideLoading();
            resolve();
            if (windowReload) {
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          }
        } catch (error) {
          clearInterval(checkProgressInterval);
          window.hideLoading();
          reject(new Error('Error while checking loading progress'));
        }
      }, 1000);
    });
  }

  async loadXrayConfig(config?: XrayObject): Promise<XrayObject | null> {
    try {
      if (!config) {
        const response = await axios.get<XrayObject>(`/ext/xrayui/xray-config.json?_=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0'
          }
        });
        config = plainToInstance(XrayObject, response.data);
      }
      this.xrayConfig = config;
      if (this.xrayConfig.log) {
        this.xrayConfig.log = plainToInstance(XrayLogObject, config.log);
      }

      this.xrayConfig.reverse = plainToInstance(XrayReverseObject, config.reverse);
      deserializeArray(this.xrayConfig.reverse?.bridges, XrayReverseItem);
      deserializeArray(this.xrayConfig.reverse?.portals, XrayReverseItem);

      this.xrayConfig.inbounds.forEach((proxy, index) => {
        proxy = deserializeProxy(proxy, inboundSettingsMap, XrayInboundObject);
        proxy.streamSettings = transformStreamSettings(proxy.streamSettings);
        if (proxy.allocate) proxy.allocate = plainToInstance(XrayAllocateObject, proxy.allocate);
        if (proxy.sniffing) proxy.sniffing = plainToInstance(XraySniffingObject, proxy.sniffing);
        this.xrayConfig.inbounds[index] = proxy;
      });

      this.xrayConfig.outbounds.forEach((proxy, index) => {
        proxy = deserializeProxy(proxy, outboundSettingsMap, XrayOutboundObject);
        proxy.streamSettings = transformStreamSettings(proxy.streamSettings);
        this.xrayConfig.outbounds[index] = proxy;
      });

      if (config.routing) {
        this.xrayConfig.routing = plainToInstance(XrayRoutingObject, config.routing);
        deserializeArray(this.xrayConfig.routing.policies, XrayRoutingPolicy);
        deserializeArray(this.xrayConfig.routing.rules, XrayRoutingRuleObject);
        deserializeArray(this.xrayConfig.routing.disabled_rules, XrayRoutingRuleObject);
        deserializeArray(this.xrayConfig.routing.balancers, XrayBalancerObject);
        this.xrayConfig.routing.balancers?.forEach((b) => {
          if (b.strategy) b.strategy = plainToInstance(XrayBalancerStrategyObject, b.strategy);
        });
      }

      if (config.dns) {
        this.xrayConfig.dns = plainToInstance(XrayDnsObject, config.dns);
        const dnsServers = this.xrayConfig.dns?.servers;
        if (dnsServers) {
          const rulesMap = new Map<number, XrayRoutingRuleObject>();
          [...(this.xrayConfig.routing?.rules ?? []), ...(this.xrayConfig.routing?.disabled_rules ?? [])].forEach((rule) => {
            rulesMap.set(rule.idx, rule);
          });
          dnsServers.forEach((server, index) => {
            dnsServers[index] = typeof server === 'string' ? server : plainToInstance(XrayDnsServerObject, server);
            server = dnsServers[index];
            if (server instanceof XrayDnsServerObject && server.rules?.length) {
              server.domains = [];
              server.rules = (server.rules as unknown as number[]).map((ruleIdx) => rulesMap.get(ruleIdx)).filter((r): r is XrayRoutingRuleObject => r !== undefined);
            }
          });
        }
      }

      if (Array.isArray(config.fakedns)) {
        this.xrayConfig.fakedns = (config.fakedns as unknown[]).map((entry) => plainToInstance(XrayFakeDnsObject, entry as object));
      }

      deserializeTlsCertificates(this.xrayConfig.inbounds);
      deserializeTlsCertificates(this.xrayConfig.outbounds);
      Object.assign(xrayConfig, this.xrayConfig);
      return this.xrayConfig;
    } catch (e) {
      var axiosError = e as AxiosError;
      if (axiosError.status === 404) {
        if (
          confirm(
            'XRAY Configuration file not found in the /opt/etc/xray directory. Please check your configuration file. If you want to generate an empty configuration file, press OK.'
          )
        ) {
          await this.submit(SubmitActions.configurationGenerateDefaultConfig);
        }
      }
    }
    return null;
  }
}

function transformMaskArray(masks: any[] | undefined): XrayFinalMaskObject[] | undefined {
  if (!masks || masks.length === 0) return undefined;
  return masks.map((mask: any) => {
    const finalMask = plainToInstance(XrayFinalMaskObject, mask);
    if (mask.settings) {
      finalMask.settings = XrayFinalMaskObject.deserializeSettings(mask.type, mask.settings);
    } else if (mask.password && !XrayFinalMaskObject.noSettingsTypes.has(mask.type)) {
      // Legacy: password at top level (old salamander format)
      const settings = XrayFinalMaskObject.createSettings(mask.type ?? 'salamander');
      if (settings && 'password' in settings) (settings as any).password = mask.password;
      finalMask.settings = settings;
    }
    return finalMask;
  });
}

const streamSettingsFieldMap: [keyof XrayStreamSettingsObject, new () => any][] = [
  ['sockopt', XraySockoptObject],
  ['realitySettings', XrayStreamRealitySettingsObject],
  ['tlsSettings', XrayStreamTlsSettingsObject],
  ['tcpSettings', XrayStreamTcpSettingsObject],
  ['kcpSettings', XrayStreamKcpSettingsObject],
  ['wsSettings', XrayStreamWsSettingsObject],
  ['httpupgradeSettings', XrayStreamHttpUpgradeSettingsObject],
  ['grpcSettings', XrayStreamGrpcSettingsObject],
  ['xhttpSettings', XrayStreamHttpSettingsObject],
  ['splithttpSettings', XrayStreamSplitHttpSettingsObject],
  ['hysteriaSettings', XrayStreamHysteriaSettingsObject]
];

function transformStreamSettings(streamSettings: XrayStreamSettingsObject | undefined): XrayStreamSettingsObject {
  if (!streamSettings) return new XrayStreamSettingsObject();
  const settings = plainToInstance(XrayStreamSettingsObject, streamSettings);

  for (const [field, SettingsClass] of streamSettingsFieldMap) {
    if (streamSettings[field]) {
      (settings as any)[field] = plainToInstance(SettingsClass, streamSettings[field]);
    }
  }

  if (streamSettings.finalmask) {
    settings.finalmask = plainToInstance(XrayFinalMaskSettingsObject, streamSettings.finalmask);
    settings.finalmask.udp = transformMaskArray(streamSettings.finalmask.udp);
    settings.finalmask.tcp = transformMaskArray(streamSettings.finalmask.tcp);
  } else if ((streamSettings as any).udpmasks?.length > 0) {
    // Legacy: migrate old udpmasks to new finalmask.udp
    settings.finalmask = new XrayFinalMaskSettingsObject();
    settings.finalmask.udp = transformMaskArray((streamSettings as any).udpmasks);
  }

  return settings;
}

const engine = new Engine();
export default engine;
