/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-misused-promises */
import axios, { AxiosError } from 'axios';
import { xrayConfig, XrayObject } from './XrayConfig';
import { XrayBlackholeOutboundObject, XrayLoopbackOutboundObject, XrayDnsOutboundObject, XrayFreedomOutboundObject, XrayTrojanOutboundObject, XrayOutboundObject, XraySocksOutboundObject, XrayVmessOutboundObject, XrayVlessOutboundObject, XrayHttpOutboundObject, XrayShadowsocksOutboundObject } from './OutboundObjects';
import { XrayDnsObject, XrayStreamSettingsObject, XrayRoutingObject, XrayRoutingRuleObject, XraySniffingObject, XrayRoutingPolicy, XrayAllocateObject, XrayStreamRealitySettingsObject, XrayStreamTlsSettingsObject, XraySockoptObject, XrayLogObject, XrayStreamTlsCertificateObject, XrayReverseObject, XrayReverseItem, XrayDnsServerObject } from './CommonObjects';
import { plainToInstance } from 'class-transformer';
import { XrayDokodemoDoorInboundObject, XrayHttpInboundObject, XrayInboundObject, XrayShadowsocksInboundObject, XraySocksInboundObject, XrayTrojanInboundObject, XrayVlessInboundObject, XrayVmessInboundObject, XrayWireguardInboundObject } from './InboundObjects';
import { XrayStreamHttpSettingsObject, XrayStreamGrpcSettingsObject, XrayStreamHttpUpgradeSettingsObject, XrayStreamKcpSettingsObject, XrayStreamTcpSettingsObject, XrayStreamWsSettingsObject } from './TransportObjects';
import { XrayProtocol } from './Options';

class EngineWireguard {
  public privateKey!: string;
  public publicKey!: string;
}

class EngineReality {
  public privateKey!: string;
  public publicKey!: string;
}

class EngineSsl {
  public certificateFile!: string;
  public keyFile!: string;
}
class EngineClientConnectionStatus {
  public ipAddress?: string;
  public countryName?: string;
  public countryCode?: string;
  public connected?: boolean;
}

class EngineLoadingProgress {
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

class EngineResponseConfig {
  public wireguard?: EngineWireguard;
  public reality?: EngineReality;
  public certificates?: EngineSsl;
  public xray?: { test: string; uptime: number; ui_version: string; core_version: string; profile: string; profiles: string[]; backups: string[]; github_proxy: string; dnsmasq: boolean; logs_max_size: number; logs_dor: boolean; skip_test: boolean };
  public geodata?: EngineGeodatConfig = new EngineGeodatConfig();
  public loading?: EngineLoadingProgress;
  public connection_check?: EngineClientConnectionStatus;
}
class EngineGeodatConfig {
  public community?: Record<string, string>;
  public geoip_url?: string;
  public geosite_url?: string;
  public auto_update?: boolean;
  public tags?: string[] = [];
}

class GeodatTagRequest {
  public tag?: string;
  public isNew!: boolean;
  public content?: string;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
enum SubmtActions {
  configurationSetMode = 'xrayui_configuration_mode',
  configurationApply = 'xrayui_configuration_apply',
  clientsOnline = 'xrayui_connectedclients',
  refreshConfig = 'xrayui_refreshconfig',
  serverStart = 'xrayui_serverstatus_start',
  serverRestart = 'xrayui_serverstatus_restart',
  serverStop = 'xrayui_serverstatus_stop',
  serverTestConfig = 'xrayui_testconfig',
  regenerateRealityKeys = 'xrayui_regenerate_realitykeys',
  regenerateWireguardyKeys = 'xrayui_regenerate_wgkeys',
  regenerateSslCertificates = 'xrayui_regenerate_sslcertificates',
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
  initResponse = 'xrayui_configuration_initresponse',
  generalOptionsApply = 'xrayui_configuration_applygeneraloptions',
  xrayVersionSwitch = 'xrayui_configuration_xrayversionswitch',
  changeProfile = 'xrayui_configuration_changeprofile',
  deleteProfile = 'xrayui_configuration_deleteprofile',
  createBackup = 'xrayui_configuration_backup',
  clearBackup = 'xrayui_configuration_backupclearall',
  restoreBackup = 'xrayui_configuration_backuprestore'
}

class Engine {
  public xrayConfig: XrayObject = xrayConfig;
  public mode = 'server';
  private zero_uuid = '10000000-1000-4000-8000-100000000000';

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

  public submit(action: string, payload: object | string | number | null | undefined = undefined, delay = 1000): Promise<void> {
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

      const amngCustomInput = document.createElement('input');
      if (payload) {
        const chunkSize = 2048;
        const payloadString = JSON.stringify(payload);
        const chunks = this.splitPayload(payloadString, chunkSize);
        chunks.forEach((chunk: string, idx) => {
          window.xray.custom_settings[`xray_payload${idx}`] = chunk;
        });

        const customSettings = JSON.stringify(window.xray.custom_settings);
        if (customSettings.length > 8 * 1024) {
          alert('Configuration is too large to submit via custom settings.');
          throw new Error('Configuration is too large to submit via custom settings.');
        }

        amngCustomInput.type = 'hidden';
        amngCustomInput.name = 'amng_custom';
        amngCustomInput.value = customSettings;
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
      if (form.contains(amngCustomInput)) {
        form.removeChild(amngCustomInput);
      }
    });
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

  async getClientConnectionStatus(): Promise<EngineClientConnectionStatus | undefined> {
    const response = await this.getXrayResponse();
    return response.connection_check;
  }
  async getXrayResponse(): Promise<EngineResponseConfig> {
    const response = await axios.get<EngineResponseConfig>('/ext/xrayui/xray-ui-response.json');
    let responseConfig = response.data;
    return responseConfig;
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
          const response = await this.getXrayResponse();
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
        const response = await axios.get<XrayObject>('/ext/xrayui/xray-config.json');
        config = plainToInstance(XrayObject, response.data);
      }
      this.xrayConfig = config;
      if (this.xrayConfig.log) {
        this.xrayConfig.log = plainToInstance(XrayLogObject, config.log);
      }

      this.xrayConfig.reverse = plainToInstance(XrayReverseObject, config.reverse);
      if (this.xrayConfig.reverse?.bridges) {
        this.xrayConfig.reverse.bridges.forEach((item, index) => {
          if (this.xrayConfig.reverse?.bridges) {
            this.xrayConfig.reverse.bridges[index] = plainToInstance(XrayReverseItem, item);
          }
        });
      }

      if (this.xrayConfig.reverse?.portals) {
        this.xrayConfig.reverse.portals.forEach((item, index) => {
          if (this.xrayConfig.reverse?.portals) {
            this.xrayConfig.reverse.portals[index] = plainToInstance(XrayReverseItem, item);
          }
        });
      }

      this.xrayConfig.inbounds.forEach((proxy, index) => {
        switch (proxy.protocol) {
          case XrayProtocol.DOKODEMODOOR:
            proxy = plainToInstance(XrayInboundObject<XrayDokodemoDoorInboundObject>, proxy);
            proxy.settings = plainToInstance(XrayDokodemoDoorInboundObject, proxy.settings) ?? new XrayDokodemoDoorInboundObject();
            break;
          case XrayProtocol.SOCKS:
            proxy = plainToInstance(XrayInboundObject<XraySocksInboundObject>, proxy);
            proxy.settings = plainToInstance(XraySocksInboundObject, proxy.settings) ?? new XraySocksInboundObject();
            break;
          case XrayProtocol.WIREGUARD:
            proxy = plainToInstance(XrayInboundObject<XrayWireguardInboundObject>, proxy);
            proxy.settings = plainToInstance(XrayWireguardInboundObject, proxy.settings) ?? new XrayWireguardInboundObject();
            break;
          case XrayProtocol.VLESS:
            proxy = plainToInstance(XrayInboundObject<XrayVlessInboundObject>, proxy);
            proxy.settings = plainToInstance(XrayVlessInboundObject, proxy.settings) ?? new XrayVlessInboundObject();
            break;
          case XrayProtocol.VMESS:
            proxy = plainToInstance(XrayInboundObject<XrayVmessInboundObject>, proxy);
            proxy.settings = plainToInstance(XrayVmessInboundObject, proxy.settings) ?? new XrayVmessInboundObject();
            break;
          case XrayProtocol.SHADOWSOCKS:
            proxy = plainToInstance(XrayInboundObject<XrayShadowsocksInboundObject>, proxy);
            proxy.settings = plainToInstance(XrayShadowsocksInboundObject, proxy.settings) ?? new XrayShadowsocksInboundObject();
            break;
          case XrayProtocol.HTTP:
            proxy = plainToInstance(XrayInboundObject<XrayHttpInboundObject>, proxy);
            proxy.settings = plainToInstance(XrayHttpInboundObject, proxy.settings) ?? new XrayHttpInboundObject();
            break;
          case XrayProtocol.TROJAN:
            proxy = plainToInstance(XrayInboundObject<XrayTrojanInboundObject>, proxy);
            proxy.settings = plainToInstance(XrayTrojanInboundObject, proxy.settings) ?? new XrayTrojanInboundObject();
            break;
        }

        proxy.streamSettings = transformStreamSettings(proxy.streamSettings);
        if (proxy.allocate) {
          proxy.allocate = plainToInstance(XrayAllocateObject, proxy.allocate);
        }

        if (proxy.sniffing) {
          proxy.sniffing = plainToInstance(XraySniffingObject, proxy.sniffing);
        }
        this.xrayConfig.inbounds[index] = proxy;
      });

      this.xrayConfig.outbounds.forEach((proxy, index) => {
        switch (proxy.protocol) {
          case XrayProtocol.FREEDOM:
            proxy = plainToInstance(XrayOutboundObject<XrayFreedomOutboundObject>, proxy);
            proxy.settings = plainToInstance(XrayFreedomOutboundObject, proxy.settings) ?? new XrayFreedomOutboundObject();
            break;
          case XrayProtocol.BLACKHOLE:
            proxy = plainToInstance(XrayOutboundObject<XrayBlackholeOutboundObject>, proxy);
            proxy.settings = plainToInstance(XrayBlackholeOutboundObject, proxy.settings) ?? new XrayBlackholeOutboundObject();
            break;
          case XrayProtocol.SOCKS:
            proxy = plainToInstance(XrayOutboundObject<XraySocksOutboundObject>, proxy);
            proxy.settings = plainToInstance(XraySocksOutboundObject, proxy.settings) ?? new XraySocksOutboundObject();
            break;
          case XrayProtocol.TROJAN:
            proxy = plainToInstance(XrayOutboundObject<XrayTrojanOutboundObject>, proxy);
            proxy.settings = plainToInstance(XrayTrojanOutboundObject, proxy.settings) ?? new XrayTrojanOutboundObject();
            break;
          case XrayProtocol.VMESS:
            proxy = plainToInstance(XrayOutboundObject<XrayVmessOutboundObject>, proxy);
            proxy.settings = plainToInstance(XrayVmessOutboundObject, proxy.settings) ?? new XrayVmessOutboundObject();
            break;
          case XrayProtocol.VLESS:
            proxy = plainToInstance(XrayOutboundObject<XrayVlessOutboundObject>, proxy);
            proxy.settings = plainToInstance(XrayVlessOutboundObject, proxy.settings) ?? new XrayVlessOutboundObject();
            break;
          case XrayProtocol.WIREGUARD:
            proxy = plainToInstance(XrayOutboundObject<XrayWireguardInboundObject>, proxy);
            proxy.settings = plainToInstance(XrayWireguardInboundObject, proxy.settings) ?? new XrayWireguardInboundObject();
            break;
          case XrayProtocol.LOOPBACK:
            proxy = plainToInstance(XrayOutboundObject<XrayLoopbackOutboundObject>, proxy);
            proxy.settings = plainToInstance(XrayLoopbackOutboundObject, proxy.settings) ?? new XrayLoopbackOutboundObject();
            break;
          case XrayProtocol.DNS:
            proxy = plainToInstance(XrayOutboundObject<XrayDnsOutboundObject>, proxy);
            proxy.settings = plainToInstance(XrayDnsOutboundObject, proxy.settings) ?? new XrayDnsOutboundObject();
            break;
          case XrayProtocol.HTTP:
            proxy = plainToInstance(XrayOutboundObject<XrayHttpOutboundObject>, proxy);
            proxy.settings = plainToInstance(XrayHttpOutboundObject, proxy.settings) ?? new XrayHttpOutboundObject();
            break;
          case XrayProtocol.SHADOWSOCKS:
            proxy = plainToInstance(XrayOutboundObject<XrayShadowsocksOutboundObject>, proxy);
            proxy.settings = plainToInstance(XrayShadowsocksOutboundObject, proxy.settings) ?? new XrayShadowsocksOutboundObject();
            break;
        }

        proxy.streamSettings = transformStreamSettings(proxy.streamSettings);
        this.xrayConfig.outbounds[index] = proxy;
      });

      if (config.routing) {
        this.xrayConfig.routing = plainToInstance(XrayRoutingObject, config.routing);

        if (this.xrayConfig.routing.policies) {
          this.xrayConfig.routing.policies.forEach((policy, index) => {
            if (this.xrayConfig.routing?.policies) {
              this.xrayConfig.routing.policies[index] = plainToInstance(XrayRoutingPolicy, policy);
            }
          });
        }

        if (this.xrayConfig.routing.rules) {
          this.xrayConfig.routing.rules.forEach((rule, index) => {
            if (this.xrayConfig.routing?.rules) {
              this.xrayConfig.routing.rules[index] = plainToInstance(XrayRoutingRuleObject, rule);
            }
          });
        }
        if (this.xrayConfig.routing.disabled_rules) {
          this.xrayConfig.routing.disabled_rules.forEach((rule, index) => {
            if (this.xrayConfig.routing?.disabled_rules) {
              this.xrayConfig.routing.disabled_rules[index] = plainToInstance(XrayRoutingRuleObject, rule);
            }
          });
        }
      }

      if (config.dns) {
        this.xrayConfig.dns = plainToInstance(XrayDnsObject, config.dns);
        if (this.xrayConfig.dns?.servers) {
          const rulesMap = new Map<number, XrayRoutingRuleObject>();
          [...(this.xrayConfig.routing?.rules ?? []), ...(this.xrayConfig.routing?.disabled_rules ?? [])].forEach((rule) => {
            rulesMap.set(rule.idx, rule);
          });
          this.xrayConfig.dns.servers.forEach((server, index) => {
            if (this.xrayConfig.dns?.servers) {
              this.xrayConfig.dns.servers[index] = typeof server === 'string' ? server : plainToInstance(XrayDnsServerObject, server);
              server = this.xrayConfig.dns.servers[index];
              if (server instanceof XrayDnsServerObject) {
                const serverObj = server;
                if (serverObj.rules && serverObj.rules.length > 0) {
                  serverObj.domains = [];
                  const serverRules = Array<XrayRoutingRuleObject>();
                  serverObj.rules.forEach((rule, index) => {
                    if (serverObj.rules && typeof rule === 'number') {
                      const serverRule = rulesMap.get(rule);
                      if (serverRule) {
                        serverRules.push(serverRule);
                      }
                    }
                  });
                  server.rules = serverRules;
                }
              }
            }
          });
        }
      }

      this.xrayConfig.inbounds.forEach((proxy) => {
        if (proxy.streamSettings?.tlsSettings?.certificates) {
          proxy.streamSettings.tlsSettings.certificates = plainToInstance(XrayStreamTlsSettingsObject, proxy.streamSettings.tlsSettings.certificates);
          proxy.streamSettings.tlsSettings.certificates.forEach((certificate, index) => {
            if (proxy.streamSettings?.tlsSettings?.certificates) {
              proxy.streamSettings.tlsSettings.certificates[index] = plainToInstance(XrayStreamTlsCertificateObject, certificate);
            }
          });
        }
      });
      this.xrayConfig.outbounds.forEach((proxy) => {
        if (proxy.streamSettings?.tlsSettings?.certificates) {
          proxy.streamSettings.tlsSettings.certificates = plainToInstance(XrayStreamTlsSettingsObject, proxy.streamSettings.tlsSettings.certificates);
          proxy.streamSettings.tlsSettings.certificates.forEach((certificate, index) => {
            if (proxy.streamSettings?.tlsSettings?.certificates) {
              proxy.streamSettings.tlsSettings.certificates[index] = plainToInstance(XrayStreamTlsCertificateObject, certificate);
            }
          });
        }
      });
      Object.assign(xrayConfig, this.xrayConfig);
      return this.xrayConfig;
    } catch (e) {
      var axiosError = e as AxiosError;
      if (axiosError.status === 404) {
        if (confirm('XRAY Configuration file not found in the /opt/etc/xray directory. Please check your configuration file. If you want to generate an empty configuration file, press OK.')) {
          await this.submit(SubmtActions.configurationGenerateDefaultConfig);
        }
      }
    }
    return null;
  }
}

function transformStreamSettings(streamSettings: XrayStreamSettingsObject | undefined): XrayStreamSettingsObject {
  if (!streamSettings) return new XrayStreamSettingsObject();
  const settings = plainToInstance(XrayStreamSettingsObject, streamSettings);
  if (streamSettings.sockopt) {
    settings.sockopt = plainToInstance(XraySockoptObject, streamSettings.sockopt);
  }
  if (streamSettings.realitySettings) {
    settings.realitySettings = plainToInstance(XrayStreamRealitySettingsObject, streamSettings.realitySettings);
  }
  if (streamSettings.tlsSettings) {
    settings.tlsSettings = plainToInstance(XrayStreamTlsSettingsObject, streamSettings.tlsSettings);
  }
  if (streamSettings.tcpSettings) {
    settings.tcpSettings = plainToInstance(XrayStreamTcpSettingsObject, streamSettings.tcpSettings);
  }
  if (streamSettings.kcpSettings) {
    settings.kcpSettings = plainToInstance(XrayStreamKcpSettingsObject, streamSettings.kcpSettings);
  }
  if (streamSettings.wsSettings) {
    settings.wsSettings = plainToInstance(XrayStreamWsSettingsObject, streamSettings.wsSettings);
  }
  if (streamSettings.httpupgradeSettings) {
    settings.httpupgradeSettings = plainToInstance(XrayStreamHttpUpgradeSettingsObject, streamSettings.httpupgradeSettings);
  }
  if (streamSettings.grpcSettings) {
    settings.grpcSettings = plainToInstance(XrayStreamGrpcSettingsObject, streamSettings.grpcSettings);
  }
  if (streamSettings.xhttpSettings) {
    settings.xhttpSettings = plainToInstance(XrayStreamHttpSettingsObject, streamSettings.xhttpSettings);
  }
  return settings;
}

let engine = new Engine();
export default engine;

export { EngineResponseConfig, EngineClientConnectionStatus, EngineLoadingProgress, EngineGeodatConfig, GeodatTagRequest, SubmtActions, Engine, engine };
