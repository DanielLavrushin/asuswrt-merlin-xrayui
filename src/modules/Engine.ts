/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import axios from "axios";
import { xrayConfig, XrayObject } from "./XrayConfig";
import { XrayBlackholeOutboundObject, XrayLoopbackOutboundObject, XrayDnsOutboundObject, XrayFreedomOutboundObject, XrayTrojanOutboundObject, XrayOutboundObject, XraySocksOutboundObject, XrayVmessOutboundObject, XrayVlessOutboundObject, XrayHttpOutboundObject, XrayShadowsocksOutboundObject } from "./OutboundObjects";
import { XrayProtocol, XrayDnsObject, XrayStreamSettingsObject, XrayRoutingObject, XrayRoutingRuleObject, XraySniffingObject, XrayPortsPolicy, XrayAllocateObject } from "./CommonObjects";
import { plainToInstance } from "class-transformer";
import { XrayDokodemoDoorInboundObject, XrayHttpInboundObject, XrayInboundObject, XrayShadowsocksInboundObject, XraySocksInboundObject, XrayTrojanInboundObject, XrayVlessInboundObject, XrayVmessInboundObject, XrayWireguardInboundObject } from "./InboundObjects";

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

class EngineResponseConfig {
  public wireguard?: EngineWireguard;
  public reality?: EngineReality;
  public certificates?: EngineSsl;
  public xray?: { test: string };
  public geodata?: EngineGeodatConfig = new EngineGeodatConfig();
}
class EngineGeodatConfig {
  public community?: Record<string, string>;
  public tags?: string[] = [];
}

class GeodatTagRequest {
  public tag?: string;
  public isNew!: boolean;
  public content?: string;
}

class SubmtActions {
  public static ConfigurationSetMode = "xrayui_configuration_mode";
  public static ConfigurationApply = "xrayui_configuration_apply";
  public static clientsOnline = "xrayui_connectedclients";
  public static refreshConfig = "xrayui_refreshconfig";
  public static serverStart = "xrayui_serverstatus_start";
  public static serverRestart = "xrayui_serverstatus_restart";
  public static serverStop = "xrayui_serverstatus_stop";
  public static regenerateRealityKeys = "xrayui_regenerate_realitykeys";
  public static regenerateWireguardyKeys = "xrayui_regenerate_wgkeys";
  public static regenerateSslCertificates = "xrayui_regenerate_sslcertificates";
  public static enableLogs = "xrayui_configuration_logs";
  public static performUpdate = "xrayui_update";
  public static ToggleStartupOption = "xrayui_configuration_togglestartup";
  public static ConfigurationGenerateDefaultConfig = "xrayui_configuration_generatedefaultconfig";
  public static geodataCommunityUpdate = "xrayui_geodata_communityupdate";
  public static geodataCommunityDates = "xrayui_geodata_communitydatecheck";
  public static geoDataCustomGetTags = "xrayui_geodata_customtagfiles";
  public static geoDataRecompile = "xrayui_geodata_customrecompile";
  public static geoDataRecompileAll = "xrayui_geodata_customrecompileall";
  public static geoDataCustomDeleteTag = "xrayui_geodata_customdeletetag";
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

  public submit(action: string, payload: any | undefined = undefined, delay: number = 0): Promise<void> {
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
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    const base64String = btoa(String.fromCharCode(...randomBytes));
    return base64String;
  };

  prepareServerConfig(): XrayObject {
    let config = new XrayObject();
    Object.assign(config, this.xrayConfig);

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

  async getXrayResponse(): Promise<EngineResponseConfig> {
    const response = await axios.get<EngineResponseConfig>("/ext/xrayui/xray-ui-response.json");
    let responseConfig = response.data;
    return responseConfig;
  }

  async loadXrayConfig(): Promise<XrayObject> {
    try {
      const response = await axios.get<XrayObject>("/ext/xrayui/xray-config.json");
      this.xrayConfig = plainToInstance(XrayObject, response.data) as XrayObject;

      this.xrayConfig.inbounds.forEach((proxy, index) => {
        proxy.streamSettings = plainToInstance(XrayStreamSettingsObject, proxy.streamSettings) as XrayStreamSettingsObject;
        if (proxy.allocate) {
          proxy.allocate = plainToInstance(XrayAllocateObject, proxy.allocate) as XrayAllocateObject;
        }

        if (proxy.sniffing) {
          proxy.sniffing = plainToInstance(XraySniffingObject, proxy.sniffing) as XraySniffingObject;
        }

        switch (proxy.protocol) {
          case XrayProtocol.DOKODEMODOOR:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayDokodemoDoorInboundObject>, proxy) as XrayInboundObject<XrayDokodemoDoorInboundObject>;
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayDokodemoDoorInboundObject, proxy.settings) as XrayDokodemoDoorInboundObject;
            break;
          case XrayProtocol.SOCKS:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XraySocksInboundObject>, proxy) as XrayInboundObject<XraySocksInboundObject>;
            this.xrayConfig.inbounds[index].settings = plainToInstance(XraySocksInboundObject, proxy.settings) as XraySocksInboundObject;
            break;
          case XrayProtocol.WIREGUARD:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayWireguardInboundObject>, proxy) as XrayInboundObject<XrayWireguardInboundObject>;
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayWireguardInboundObject, proxy.settings) as XrayWireguardInboundObject;
            break;
          case XrayProtocol.VLESS:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayVlessInboundObject>, proxy) as XrayInboundObject<XrayVlessInboundObject>;
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayVlessInboundObject, proxy.settings ?? new XrayVlessInboundObject()) as XrayVlessInboundObject;
            break;
          case XrayProtocol.VMESS:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayVmessInboundObject>, proxy) as XrayInboundObject<XrayVmessInboundObject>;
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayVmessInboundObject, proxy.settings) as XrayVmessInboundObject;
            break;
          case XrayProtocol.SHADOWSOCKS:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayShadowsocksInboundObject>, proxy) as XrayInboundObject<XrayShadowsocksInboundObject>;
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayShadowsocksInboundObject, proxy.settings) as XrayShadowsocksInboundObject;
            break;
          case XrayProtocol.HTTP:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayHttpInboundObject>, proxy) as XrayInboundObject<XrayHttpInboundObject>;
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayHttpInboundObject, proxy.settings) as XrayHttpInboundObject;
            break;
          case XrayProtocol.TROJAN:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayTrojanInboundObject>, proxy) as XrayInboundObject<XrayTrojanInboundObject>;
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayTrojanInboundObject, proxy.settings) as XrayTrojanInboundObject;
            break;
        }
      });

      this.xrayConfig.outbounds.forEach((proxy, index) => {
        proxy.streamSettings = plainToInstance(XrayStreamSettingsObject, proxy.streamSettings);
        switch (proxy.protocol) {
          case XrayProtocol.FREEDOM:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayFreedomOutboundObject>, proxy) as XrayOutboundObject<XrayFreedomOutboundObject>;
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayFreedomOutboundObject, proxy.settings) as XrayFreedomOutboundObject;
            break;
          case XrayProtocol.BLACKHOLE:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayBlackholeOutboundObject>, proxy) as XrayOutboundObject<XrayBlackholeOutboundObject>;
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayBlackholeOutboundObject, proxy.settings) as XrayBlackholeOutboundObject;
            break;
          case XrayProtocol.SOCKS:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XraySocksOutboundObject>, proxy) as XrayOutboundObject<XraySocksOutboundObject>;
            this.xrayConfig.outbounds[index].settings = plainToInstance(XraySocksOutboundObject, proxy.settings) as XraySocksOutboundObject;
            break;
          case XrayProtocol.TROJAN:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayTrojanOutboundObject>, proxy) as XrayOutboundObject<XrayTrojanOutboundObject>;
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayTrojanOutboundObject, proxy.settings) as XrayTrojanOutboundObject;
            break;
          case XrayProtocol.VMESS:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayVmessOutboundObject>, proxy) as XrayOutboundObject<XrayVmessOutboundObject>;
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayVmessOutboundObject, proxy.settings) as XrayVmessOutboundObject;
            break;
          case XrayProtocol.VLESS:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayVlessOutboundObject>, proxy) as XrayOutboundObject<XrayVlessOutboundObject>;
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayVlessOutboundObject, proxy.settings) as XrayVlessOutboundObject;
            break;
          case XrayProtocol.WIREGUARD:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayWireguardInboundObject>, proxy) as XrayOutboundObject<XrayWireguardInboundObject>;
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayWireguardInboundObject, proxy.settings) as XrayWireguardInboundObject;
            break;
          case XrayProtocol.LOOPBACK:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayLoopbackOutboundObject>, proxy) as XrayOutboundObject<XrayLoopbackOutboundObject>;
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayLoopbackOutboundObject, proxy.settings) as XrayLoopbackOutboundObject;
            break;
          case XrayProtocol.DNS:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayDnsOutboundObject>, proxy) as XrayOutboundObject<XrayDnsOutboundObject>;
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayDnsOutboundObject, proxy.settings) as XrayDnsOutboundObject;
            break;
          case XrayProtocol.HTTP:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayHttpOutboundObject>, proxy) as XrayOutboundObject<XrayHttpOutboundObject>;
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayHttpOutboundObject, proxy.settings) as XrayHttpOutboundObject;
            break;
          case XrayProtocol.SHADOWSOCKS:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayShadowsocksOutboundObject>, proxy) as XrayOutboundObject<XrayShadowsocksOutboundObject>;
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayShadowsocksOutboundObject, proxy.settings) as XrayShadowsocksOutboundObject;
            break;
        }
      });

      if (response.data.dns) {
        this.xrayConfig.dns = plainToInstance(XrayDnsObject, response.data.dns) as XrayDnsObject;
      }

      if (response.data.routing) {
        this.xrayConfig.routing = plainToInstance(XrayRoutingObject, response.data.routing) as XrayRoutingObject;
        if (this.xrayConfig.routing && this.xrayConfig?.routing?.rules) {
          this.xrayConfig.routing.portsPolicy = plainToInstance(XrayPortsPolicy, response.data.routing.portsPolicy ?? new XrayPortsPolicy()) as XrayPortsPolicy;
          this.xrayConfig.routing.rules.forEach((rule, index) => {
            if (this.xrayConfig.routing?.rules) {
              this.xrayConfig.routing.rules[index] = plainToInstance(XrayRoutingRuleObject, rule) as XrayRoutingRuleObject;
            }
          });
        }
      }

      Object.assign(xrayConfig, this.xrayConfig);
      return this.xrayConfig;
    } catch (e: any) {
      if (e.response.status === 404) {
        if (confirm("XRAY Configuration file not found in the /opt/etc/xray directory. Please check your configuration file. If you want to generate an empty configuration file, press OK.")) {
          this.submit(SubmtActions.ConfigurationGenerateDefaultConfig);
        }
      }
    } finally {
      return this.xrayConfig;
    }
  }
}

let engine = new Engine();
export default engine;

export { EngineGeodatConfig, GeodatTagRequest, SubmtActions, Engine, engine };
