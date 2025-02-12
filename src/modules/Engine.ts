/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

import axios, { AxiosError } from "axios";
import { xrayConfig, XrayObject } from "./XrayConfig";
import { XrayBlackholeOutboundObject, XrayLoopbackOutboundObject, XrayDnsOutboundObject, XrayFreedomOutboundObject, XrayTrojanOutboundObject, XrayOutboundObject, XraySocksOutboundObject, XrayVmessOutboundObject, XrayVlessOutboundObject, XrayHttpOutboundObject, XrayShadowsocksOutboundObject } from "./OutboundObjects";
import { XrayProtocol, XrayDnsObject, XrayStreamSettingsObject, XrayRoutingObject, XrayRoutingRuleObject, XraySniffingObject, XrayPortsPolicy, XrayAllocateObject, XrayStreamRealitySettingsObject, XrayStreamTlsSettingsObject, XraySockoptObject, XrayLogObject, XrayStreamTlsCertificateObject } from "./CommonObjects";
import { plainToInstance } from "class-transformer";
import { XrayDokodemoDoorInboundObject, XrayHttpInboundObject, XrayInboundObject, XrayShadowsocksInboundObject, XraySocksInboundObject, XrayTrojanInboundObject, XrayVlessInboundObject, XrayVmessInboundObject, XrayWireguardInboundObject } from "./InboundObjects";
import { XrayStreamHttpSettingsObject, XrayStreamGrpcSettingsObject, XrayStreamHttpUpgradeSettingsObject, XrayStreamKcpSettingsObject, XrayStreamTcpSettingsObject, XrayStreamWsSettingsObject } from "./TransportObjects";

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
  public message = "";

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
  public xray?: { test: string; uptime: number; ui_version: string; core_version: string };
  public geodata?: EngineGeodatConfig = new EngineGeodatConfig();
  public loading?: EngineLoadingProgress;
  public connection_check?: EngineClientConnectionStatus;
}
class EngineGeodatConfig {
  public community?: Record<string, string>;
  public geoip_url?: string;
  public geosite_url?: string;
  public tags?: string[] = [];
}

class GeodatTagRequest {
  public tag?: string;
  public isNew!: boolean;
  public content?: string;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
enum SubmtActions {
  configurationSetMode = "xrayui_configuration_mode",
  configurationApply = "xrayui_configuration_apply",
  clientsOnline = "xrayui_connectedclients",
  refreshConfig = "xrayui_refreshconfig",
  serverStart = "xrayui_serverstatus_start",
  serverRestart = "xrayui_serverstatus_restart",
  serverStop = "xrayui_serverstatus_stop",
  serverTestConfig = "xrayui_testconfig",
  regenerateRealityKeys = "xrayui_regenerate_realitykeys",
  regenerateWireguardyKeys = "xrayui_regenerate_wgkeys",
  regenerateSslCertificates = "xrayui_regenerate_sslcertificates",
  enableLogs = "xrayui_configuration_logs",
  performUpdate = "xrayui_update",
  toggleStartupOption = "xrayui_configuration_togglestartup",
  configurationGenerateDefaultConfig = "xrayui_configuration_generatedefaultconfig",
  geodataCommunityUpdate = "xrayui_geodata_communityupdate",
  geoDataCustomGetTags = "xrayui_geodata_customtagfiles",
  geoDataRecompile = "xrayui_geodata_customrecompile",
  geoDataRecompileAll = "xrayui_geodata_customrecompileall",
  geoDataCustomDeleteTag = "xrayui_geodata_customdeletetag",
  fetchXrayLogs = "xrayui_configuration_logs_fetch",
  updateLogsLevel = "xrayui_configuration_logs_changeloglevel",
  checkConnection = "xrayui_configuration_checkconnection",
  initResponse = "xrayui_configuration_initresponse",
  generalOptionsApply = "xrayui_configuration_applygeneraloptions"
}

class Engine {
  public xrayConfig: XrayObject = xrayConfig;
  public mode = "server";
  private zero_uuid = "10000000-1000-4000-8000-100000000000";

  private splitPayload(payload: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let index = 0;
    while (index < payload.length) {
      chunks.push(payload.slice(index, index + chunkSize));
      index += chunkSize;
    }
    return chunks;
  }

  public submit(action: string, payload: object | string | number | null | undefined = undefined, delay = 0): Promise<void> {
    return new Promise((resolve) => {
      const iframeName = "hidden_frame_" + Math.random().toString(36).substring(2, 9);
      const iframe = document.createElement("iframe");
      iframe.name = iframeName;
      iframe.style.display = "none";

      document.body.appendChild(iframe);

      const form = document.createElement("form");
      form.method = "post";
      form.action = "/start_apply.htm";
      form.target = iframeName;

      this.create_form_element(form, "hidden", "action_mode", "apply");
      this.create_form_element(form, "hidden", "action_script", action);
      this.create_form_element(form, "hidden", "modified", "0");
      this.create_form_element(form, "hidden", "action_wait", "");

      const amngCustomInput = document.createElement("input");
      if (payload) {
        const chunkSize = 2048;
        const payloadString = JSON.stringify(payload);
        const chunks = this.splitPayload(payloadString, chunkSize);
        chunks.forEach((chunk: string, idx) => {
          window.xray.custom_settings[`xray_payload${idx}`] = chunk;
        });

        const customSettings = JSON.stringify(window.xray.custom_settings);
        if (customSettings.length > 8 * 1024) {
          alert("Configuration is too large to submit via custom settings.");
          return;
        }

        amngCustomInput.type = "hidden";
        amngCustomInput.name = "amng_custom";
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
    const input = document.createElement("input");
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
    if (!length || length < 1) return "";
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
      if (config.routing.rules) {
        config.routing.rules.forEach((rule) => {
          rule.normalize();
        });
      }
      if (config.routing.disabled_rules) {
        config.routing.disabled_rules.forEach((rule) => {
          rule.normalize();
        });
      }
    }

    if (config.log) {
      config.log.normalize();
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
    const response = await axios.get<EngineResponseConfig>("/ext/xrayui/xray-ui-response.json");
    let responseConfig = response.data;
    return responseConfig;
  }

  async executeWithLoadingProgress(action: () => Promise<void>, windowReload = true): Promise<void> {
    let loadingProgress = new EngineLoadingProgress(0, "Please, wait");
    window.showLoading(null, loadingProgress);

    const progressPromise = this.checkLoadingProgress(loadingProgress, windowReload);

    const actionPromise = action();
    await Promise.all([actionPromise, progressPromise]);
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
              window.location.reload();
            }
          }
        } catch (error) {
          clearInterval(checkProgressInterval);
          window.hideLoading();
          reject(new Error("Error while checking loading progress"));
        }
      }, 1000);
    });
  }

  async loadXrayConfig(): Promise<XrayObject | null> {
    try {
      const response = await axios.get<XrayObject>("/ext/xrayui/xray-config.json");
      this.xrayConfig = plainToInstance(XrayObject, response.data) as XrayObject;
      if (this.xrayConfig.log) {
        this.xrayConfig.log = plainToInstance(XrayLogObject, response.data.log);
      }
      this.xrayConfig.inbounds.forEach((proxy, index) => {
        switch (proxy.protocol) {
          case XrayProtocol.DOKODEMODOOR:
            proxy = plainToInstance(XrayInboundObject<XrayDokodemoDoorInboundObject>, proxy) as XrayInboundObject<XrayDokodemoDoorInboundObject>;
            proxy.settings = plainToInstance(XrayDokodemoDoorInboundObject, proxy.settings) as XrayDokodemoDoorInboundObject;
            break;
          case XrayProtocol.SOCKS:
            proxy = plainToInstance(XrayInboundObject<XraySocksInboundObject>, proxy) as XrayInboundObject<XraySocksInboundObject>;
            proxy.settings = plainToInstance(XraySocksInboundObject, proxy.settings) as XraySocksInboundObject;
            break;
          case XrayProtocol.WIREGUARD:
            proxy = plainToInstance(XrayInboundObject<XrayWireguardInboundObject>, proxy) as XrayInboundObject<XrayWireguardInboundObject>;
            proxy.settings = plainToInstance(XrayWireguardInboundObject, proxy.settings) as XrayWireguardInboundObject;
            break;
          case XrayProtocol.VLESS:
            proxy = plainToInstance(XrayInboundObject<XrayVlessInboundObject>, proxy) as XrayInboundObject<XrayVlessInboundObject>;
            proxy.settings = plainToInstance(XrayVlessInboundObject, proxy.settings) as XrayVlessInboundObject;
            break;
          case XrayProtocol.VMESS:
            proxy = plainToInstance(XrayInboundObject<XrayVmessInboundObject>, proxy) as XrayInboundObject<XrayVmessInboundObject>;
            proxy.settings = plainToInstance(XrayVmessInboundObject, proxy.settings) as XrayVmessInboundObject;
            break;
          case XrayProtocol.SHADOWSOCKS:
            proxy = plainToInstance(XrayInboundObject<XrayShadowsocksInboundObject>, proxy) as XrayInboundObject<XrayShadowsocksInboundObject>;
            proxy.settings = plainToInstance(XrayShadowsocksInboundObject, proxy.settings) as XrayShadowsocksInboundObject;
            break;
          case XrayProtocol.HTTP:
            proxy = plainToInstance(XrayInboundObject<XrayHttpInboundObject>, proxy) as XrayInboundObject<XrayHttpInboundObject>;
            proxy.settings = plainToInstance(XrayHttpInboundObject, proxy.settings) as XrayHttpInboundObject;
            break;
          case XrayProtocol.TROJAN:
            proxy = plainToInstance(XrayInboundObject<XrayTrojanInboundObject>, proxy) as XrayInboundObject<XrayTrojanInboundObject>;
            proxy.settings = plainToInstance(XrayTrojanInboundObject, proxy.settings) as XrayTrojanInboundObject;
            break;
        }

        proxy.streamSettings = plainToInstance(XrayStreamSettingsObject, proxy.streamSettings) ?? new XrayStreamSettingsObject();
        if (proxy.allocate) {
          proxy.allocate = plainToInstance(XrayAllocateObject, proxy.allocate) as XrayAllocateObject;
        }

        if (proxy.sniffing) {
          proxy.sniffing = plainToInstance(XraySniffingObject, proxy.sniffing) as XraySniffingObject;
        }
        if (proxy.streamSettings.sockopt) {
          proxy.streamSettings.sockopt = plainToInstance(XraySockoptObject, proxy.streamSettings.sockopt) as XraySockoptObject;
        }

        if (proxy.streamSettings.realitySettings) {
          proxy.streamSettings.realitySettings = plainToInstance(XrayStreamRealitySettingsObject, proxy.streamSettings.realitySettings) as XrayStreamRealitySettingsObject;
        }
        if (proxy.streamSettings.tlsSettings) {
          proxy.streamSettings.tlsSettings = plainToInstance(XrayStreamTlsSettingsObject, proxy.streamSettings.tlsSettings) as XrayStreamTlsSettingsObject;
        }
        if (proxy.streamSettings.tcpSettings) {
          proxy.streamSettings.tcpSettings = plainToInstance(XrayStreamTcpSettingsObject, proxy.streamSettings.tcpSettings) as XrayStreamTcpSettingsObject;
        }
        if (proxy.streamSettings.kcpSettings) {
          proxy.streamSettings.kcpSettings = plainToInstance(XrayStreamKcpSettingsObject, proxy.streamSettings.kcpSettings) as XrayStreamKcpSettingsObject;
        }
        if (proxy.streamSettings.wsSettings) {
          proxy.streamSettings.wsSettings = plainToInstance(XrayStreamWsSettingsObject, proxy.streamSettings.wsSettings) as XrayStreamWsSettingsObject;
        }
        if (proxy.streamSettings.httpupgradeSettings) {
          proxy.streamSettings.httpupgradeSettings = plainToInstance(XrayStreamHttpUpgradeSettingsObject, proxy.streamSettings.httpupgradeSettings) as XrayStreamHttpUpgradeSettingsObject;
        }
        if (proxy.streamSettings.grpcSettings) {
          proxy.streamSettings.grpcSettings = plainToInstance(XrayStreamGrpcSettingsObject, proxy.streamSettings.grpcSettings) as XrayStreamGrpcSettingsObject;
        }
        if (proxy.streamSettings.xhttpSettings) {
          proxy.streamSettings.xhttpSettings = plainToInstance(XrayStreamHttpSettingsObject, proxy.streamSettings.xhttpSettings) as XrayStreamHttpSettingsObject;
        }
        this.xrayConfig.inbounds[index] = proxy;
      });

      this.xrayConfig.outbounds.forEach((proxy, index) => {
        switch (proxy.protocol) {
          case XrayProtocol.FREEDOM:
            proxy = plainToInstance(XrayOutboundObject<XrayFreedomOutboundObject>, proxy) as XrayOutboundObject<XrayFreedomOutboundObject>;
            proxy.settings = plainToInstance(XrayFreedomOutboundObject, proxy.settings) as XrayFreedomOutboundObject;
            break;
          case XrayProtocol.BLACKHOLE:
            proxy = plainToInstance(XrayOutboundObject<XrayBlackholeOutboundObject>, proxy) as XrayOutboundObject<XrayBlackholeOutboundObject>;
            proxy.settings = plainToInstance(XrayBlackholeOutboundObject, proxy.settings) as XrayBlackholeOutboundObject;
            break;
          case XrayProtocol.SOCKS:
            proxy = plainToInstance(XrayOutboundObject<XraySocksOutboundObject>, proxy) as XrayOutboundObject<XraySocksOutboundObject>;
            proxy.settings = plainToInstance(XraySocksOutboundObject, proxy.settings) as XraySocksOutboundObject;
            break;
          case XrayProtocol.TROJAN:
            proxy = plainToInstance(XrayOutboundObject<XrayTrojanOutboundObject>, proxy) as XrayOutboundObject<XrayTrojanOutboundObject>;
            proxy.settings = plainToInstance(XrayTrojanOutboundObject, proxy.settings) as XrayTrojanOutboundObject;
            break;
          case XrayProtocol.VMESS:
            proxy = plainToInstance(XrayOutboundObject<XrayVmessOutboundObject>, proxy) as XrayOutboundObject<XrayVmessOutboundObject>;
            proxy.settings = plainToInstance(XrayVmessOutboundObject, proxy.settings) as XrayVmessOutboundObject;
            break;
          case XrayProtocol.VLESS:
            proxy = plainToInstance(XrayOutboundObject<XrayVlessOutboundObject>, proxy) as XrayOutboundObject<XrayVlessOutboundObject>;
            proxy.settings = plainToInstance(XrayVlessOutboundObject, proxy.settings) as XrayVlessOutboundObject;
            break;
          case XrayProtocol.WIREGUARD:
            proxy = plainToInstance(XrayOutboundObject<XrayWireguardInboundObject>, proxy) as XrayOutboundObject<XrayWireguardInboundObject>;
            proxy.settings = plainToInstance(XrayWireguardInboundObject, proxy.settings) as XrayWireguardInboundObject;
            break;
          case XrayProtocol.LOOPBACK:
            proxy = plainToInstance(XrayOutboundObject<XrayLoopbackOutboundObject>, proxy) as XrayOutboundObject<XrayLoopbackOutboundObject>;
            proxy.settings = plainToInstance(XrayLoopbackOutboundObject, proxy.settings) as XrayLoopbackOutboundObject;
            break;
          case XrayProtocol.DNS:
            proxy = plainToInstance(XrayOutboundObject<XrayDnsOutboundObject>, proxy) as XrayOutboundObject<XrayDnsOutboundObject>;
            proxy.settings = plainToInstance(XrayDnsOutboundObject, proxy.settings) as XrayDnsOutboundObject;
            break;
          case XrayProtocol.HTTP:
            proxy = plainToInstance(XrayOutboundObject<XrayHttpOutboundObject>, proxy) as XrayOutboundObject<XrayHttpOutboundObject>;
            proxy.settings = plainToInstance(XrayHttpOutboundObject, proxy.settings) as XrayHttpOutboundObject;
            break;
          case XrayProtocol.SHADOWSOCKS:
            proxy = plainToInstance(XrayOutboundObject<XrayShadowsocksOutboundObject>, proxy) as XrayOutboundObject<XrayShadowsocksOutboundObject>;
            proxy.settings = plainToInstance(XrayShadowsocksOutboundObject, proxy.settings) as XrayShadowsocksOutboundObject;
            break;
        }

        proxy.streamSettings = plainToInstance(XrayStreamSettingsObject, proxy.streamSettings) ?? new XrayStreamSettingsObject();
        if (proxy.streamSettings.sockopt) {
          proxy.streamSettings.sockopt = plainToInstance(XraySockoptObject, proxy.streamSettings.sockopt) as XraySockoptObject;
        }
        if (proxy.streamSettings.realitySettings) {
          proxy.streamSettings.realitySettings = plainToInstance(XrayStreamRealitySettingsObject, proxy.streamSettings.realitySettings) as XrayStreamRealitySettingsObject;
        }
        if (proxy.streamSettings.tlsSettings) {
          proxy.streamSettings.tlsSettings = plainToInstance(XrayStreamTlsSettingsObject, proxy.streamSettings.tlsSettings) as XrayStreamTlsSettingsObject;
        }
        if (proxy.streamSettings.tcpSettings) {
          proxy.streamSettings.tcpSettings = plainToInstance(XrayStreamTcpSettingsObject, proxy.streamSettings.tcpSettings) as XrayStreamTcpSettingsObject;
        }
        if (proxy.streamSettings.kcpSettings) {
          proxy.streamSettings.kcpSettings = plainToInstance(XrayStreamKcpSettingsObject, proxy.streamSettings.kcpSettings) as XrayStreamKcpSettingsObject;
        }
        if (proxy.streamSettings.wsSettings) {
          proxy.streamSettings.wsSettings = plainToInstance(XrayStreamWsSettingsObject, proxy.streamSettings.wsSettings) as XrayStreamWsSettingsObject;
        }
        if (proxy.streamSettings.httpupgradeSettings) {
          proxy.streamSettings.httpupgradeSettings = plainToInstance(XrayStreamHttpUpgradeSettingsObject, proxy.streamSettings.httpupgradeSettings) as XrayStreamHttpUpgradeSettingsObject;
        }
        if (proxy.streamSettings.grpcSettings) {
          proxy.streamSettings.grpcSettings = plainToInstance(XrayStreamGrpcSettingsObject, proxy.streamSettings.grpcSettings) as XrayStreamGrpcSettingsObject;
        }
        if (proxy.streamSettings.xhttpSettings) {
          proxy.streamSettings.xhttpSettings = plainToInstance(XrayStreamHttpSettingsObject, proxy.streamSettings.xhttpSettings) as XrayStreamHttpSettingsObject;
        }
        this.xrayConfig.outbounds[index] = proxy;
      });

      if (response.data.dns) {
        this.xrayConfig.dns = plainToInstance(XrayDnsObject, response.data.dns) as XrayDnsObject;
      }

      if (response.data.routing) {
        this.xrayConfig.routing = plainToInstance(XrayRoutingObject, response.data.routing) as XrayRoutingObject;
        this.xrayConfig.routing.portsPolicy = plainToInstance(XrayPortsPolicy, response.data.routing.portsPolicy ?? new XrayPortsPolicy()) as XrayPortsPolicy;
        if (this.xrayConfig.routing.rules) {
          this.xrayConfig.routing.rules.forEach((rule, index) => {
            if (this.xrayConfig.routing?.rules) {
              this.xrayConfig.routing.rules[index] = plainToInstance(XrayRoutingRuleObject, rule) as XrayRoutingRuleObject;
            }
          });
        }
        if (this.xrayConfig.routing.disabled_rules) {
          this.xrayConfig.routing.disabled_rules.forEach((rule, index) => {
            if (this.xrayConfig.routing?.disabled_rules) {
              this.xrayConfig.routing.disabled_rules[index] = plainToInstance(XrayRoutingRuleObject, rule) as XrayRoutingRuleObject;
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
        if (confirm("XRAY Configuration file not found in the /opt/etc/xray directory. Please check your configuration file. If you want to generate an empty configuration file, press OK.")) {
          await this.submit(SubmtActions.configurationGenerateDefaultConfig);
        }
      }
    }
    return null;
  }
}

let engine = new Engine();
export default engine;

export { EngineResponseConfig, EngineClientConnectionStatus, EngineLoadingProgress, EngineGeodatConfig, GeodatTagRequest, SubmtActions, Engine, engine };
