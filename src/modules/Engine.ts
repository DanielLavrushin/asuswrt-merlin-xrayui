import axios from "axios";
import { xrayConfig, XrayObject } from "./XrayConfig";
import { NormalizeOutbound, XrayBlackholeOutboundObject, XrayLoopbackOutboundObject, XrayDnsOutboundObject, XrayFreedomOutboundObject, XrayTrojanOutboundObject, XrayOutboundObject, XraySocksOutboundObject, XrayVmessOutboundObject, XrayVlessOutboundObject, XrayHttpOutboundObject, XrayShadowsocksOutboundObject } from "./OutboundObjects";
import { XrayProtocol, XrayDnsObject, XrayStreamSettingsObject, XrayRoutingObject, XrayRoutingRuleObject, XraySniffingObject, XrayPortsPolicy } from "./CommonObjects";
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
  public files?: Record<string, string>;
}

class SubmtActions {
  public static ConfigurationSetMode: string = "xrayui_configuration_mode";
  public static ConfigurationApply: string = "xrayui_configuration_apply";
  public static clientsOnline: string = "xrayui_connectedclients";
  public static refreshConfig: string = "xrayui_refreshconfig";
  public static serverStart: string = "xrayui_serverstatus_start";
  public static serverRestart: string = "xrayui_serverstatus_restart";
  public static serverStop: string = "xrayui_serverstatus_stop";
  public static regenerateRealityKeys: string = "xrayui_regenerate_realitykeys";
  public static regenerateWireguardyKeys: string = "xrayui_regenerate_wgkeys";
  public static regenerateSslCertificates: string = "xrayui_regenerate_sslcertificates";
  public static enableLogs: string = "xrayui_configuration_logs";
  public static performUpdate: string = "xrayui_update";
  public static performUpdateGeodat: string = "xrayui_updategeodat";
  public static ToggleStartupOption: string = "xrayui_configuration_togglestartup";
  public static ConfigurationGenerateDefaultConfig: string = "xrayui_configuration_generatedefaultconfig";
  public static loadGeodatDates: string = "xrayui_getgeodatdates";
}

class Engine {
  public xrayConfig: XrayObject = xrayConfig;
  public mode: string = "server";
  private zero_uuid: string = "10000000-1000-4000-8000-100000000000";

  private splitPayload(payload: any, chunkSize: number): any[] {
    let chunks = [];
    let index = 0;
    while (index < payload.length) {
      chunks.push(payload.substr(index, chunkSize));
      index += chunkSize;
    }
    return chunks;
  }

  public submit(action: string, payload: any | undefined = undefined, delay: number = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      const iframeName = "hidden_frame_" + Math.random().toString(36).substring(2, 9);
      const iframe = document.createElement("iframe");
      iframe.name = iframeName;
      iframe.style.display = "none";

      document.body.appendChild(iframe);

      const form = document.createElement("form");
      form.method = "post";
      form.action = "/start_apply.htm";
      form.target = iframeName;

      form.innerHTML = `
        <input type="hidden" name="action_mode" value="apply" />
        <input type="hidden" name="action_script" value="${action}" />
        <input type="hidden" name="modified" value="0" />
        <input type="hidden" name="action_wait" value="" />
      `;

      const amngCustomInput = document.createElement("input");
      if (payload) {
        const chunkSize = 2048;
        const payloadString = JSON.stringify(payload);
        const chunks = this.splitPayload(payloadString, chunkSize);

        chunks.forEach((chunk: any, idx) => {
          (window.xray.custom_settings as any)[`xray_payload${idx}`] = chunk;
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

  uuid = () => {
    return this.zero_uuid.replace(/[018]/g, (c) => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16));
  };

  generateRandomBase64 = (length: number | undefined = 32): string => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    const base64String = btoa(String.fromCharCode(...randomBytes));
    return base64String;
  };

  async prepareServerConfig(): Promise<any> {
    let config = new XrayObject();
    Object.assign(config, this.xrayConfig);

    config.inbounds.forEach((proxy) => {
      if (proxy.streamSettings) {
        proxy.streamSettings = plainToInstance(XrayStreamSettingsObject, proxy.streamSettings);
        proxy.streamSettings.normalize();
        const isEmpty = JSON.stringify(proxy.streamSettings) === "{}";
        if (isEmpty) {
          proxy.streamSettings = undefined;
          return;
        }
      }
      if (proxy.sniffing) {
        proxy.sniffing.normalize();
      }
    });

    config.outbounds.forEach((proxy) => {
      NormalizeOutbound(proxy);

      const isEmpty = JSON.stringify(proxy.streamSettings) === "{}";
      if (isEmpty) {
        proxy.streamSettings = undefined;
        return;
      }
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

  async getRealityKeys(): Promise<EngineReality | undefined> {
    const result = await this.getEngineConfig();
    return result?.reality;
  }

  async getEngineConfig(): Promise<EngineResponseConfig> {
    const response = await axios.get<EngineResponseConfig>("/ext/xrayui/xray-ui-response.json");
    let responseConfig = response.data;
    return responseConfig;
  }
  async getSslCertificates(): Promise<EngineSsl | undefined> {
    const response = await axios.get<EngineResponseConfig>("/ext/xrayui/xray-ui-response.json");
    let result = response.data;
    return result?.certificates;
  }

  async loadXrayConfig(): Promise<XrayObject> {
    try {
      const response = await axios.get<XrayObject>("/ext/xrayui/xray-config.json");
      this.xrayConfig = plainToInstance(XrayObject, response.data);

      this.xrayConfig.inbounds.forEach((proxy, index) => {
        proxy.streamSettings = plainToInstance(XrayStreamSettingsObject, proxy.streamSettings);
        if (proxy.sniffing) {
          proxy.sniffing = plainToInstance(XraySniffingObject, proxy.sniffing);
        }

        switch (proxy.protocol) {
          case XrayProtocol.DOKODEMODOOR:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayDokodemoDoorInboundObject>, proxy);
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayDokodemoDoorInboundObject, proxy.settings ?? new XrayDokodemoDoorInboundObject());
            break;
          case XrayProtocol.SOCKS:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XraySocksInboundObject>, proxy);
            this.xrayConfig.inbounds[index].settings = plainToInstance(XraySocksInboundObject, proxy.settings ?? new XraySocksInboundObject());
            break;
          case XrayProtocol.WIREGUARD:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayWireguardInboundObject>, proxy);
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayWireguardInboundObject, proxy.settings ?? new XrayWireguardInboundObject());
            break;
          case XrayProtocol.VLESS:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayVlessInboundObject>, proxy);
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayVlessInboundObject, proxy.settings ?? new XrayVlessInboundObject());
            break;
          case XrayProtocol.VMESS:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayVmessInboundObject>, proxy);
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayVmessInboundObject, proxy.settings ?? new XrayVmessInboundObject());
            break;
          case XrayProtocol.SHADOWSOCKS:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayShadowsocksInboundObject>, proxy);
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayShadowsocksInboundObject, proxy.settings ?? new XrayShadowsocksInboundObject());
            break;
          case XrayProtocol.HTTP:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayHttpInboundObject>, proxy);
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayHttpInboundObject, proxy.settings ?? new XrayHttpInboundObject());
            break;
          case XrayProtocol.TROJAN:
            this.xrayConfig.inbounds[index] = plainToInstance(XrayInboundObject<XrayTrojanInboundObject>, proxy);
            this.xrayConfig.inbounds[index].settings = plainToInstance(XrayTrojanInboundObject, proxy.settings ?? new XrayTrojanInboundObject());
            break;
        }
      });

      this.xrayConfig.outbounds.forEach((proxy, index) => {
        proxy.streamSettings = plainToInstance(XrayStreamSettingsObject, proxy.streamSettings);
        switch (proxy.protocol) {
          case XrayProtocol.FREEDOM:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayFreedomOutboundObject>, proxy);
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayFreedomOutboundObject, proxy.settings ?? new XrayFreedomOutboundObject());
            break;
          case XrayProtocol.BLACKHOLE:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayBlackholeOutboundObject>, proxy);
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayBlackholeOutboundObject, proxy.settings ?? new XrayBlackholeOutboundObject());
            break;
          case XrayProtocol.SOCKS:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XraySocksOutboundObject>, proxy);
            this.xrayConfig.outbounds[index].settings = plainToInstance(XraySocksOutboundObject, proxy.settings ?? new XraySocksOutboundObject());
            break;
          case XrayProtocol.TROJAN:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayTrojanOutboundObject>, proxy);
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayTrojanOutboundObject, proxy.settings ?? new XrayTrojanOutboundObject());
            break;
          case XrayProtocol.VMESS:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayVmessOutboundObject>, proxy);
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayVmessOutboundObject, proxy.settings ?? new XrayVmessOutboundObject());
            break;
          case XrayProtocol.VLESS:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayVlessOutboundObject>, proxy);
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayVlessOutboundObject, proxy.settings ?? new XrayVlessOutboundObject());
            break;
          case XrayProtocol.WIREGUARD:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayWireguardInboundObject>, proxy);
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayWireguardInboundObject, proxy.settings ?? new XrayWireguardInboundObject());
            break;
          case XrayProtocol.LOOPBACK:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayLoopbackOutboundObject>, proxy);
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayLoopbackOutboundObject, proxy.settings ?? new XrayLoopbackOutboundObject());
            break;
          case XrayProtocol.DNS:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayDnsOutboundObject>, proxy);
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayDnsOutboundObject, proxy.settings ?? new XrayDnsOutboundObject());
            break;
          case XrayProtocol.HTTP:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayHttpOutboundObject>, proxy);
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayHttpOutboundObject, proxy.settings ?? new XrayHttpOutboundObject());
            break;
          case XrayProtocol.SHADOWSOCKS:
            this.xrayConfig.outbounds[index] = plainToInstance(XrayOutboundObject<XrayShadowsocksOutboundObject>, proxy);
            this.xrayConfig.outbounds[index].settings = plainToInstance(XrayShadowsocksOutboundObject, proxy.settings ?? new XrayShadowsocksOutboundObject());
            break;
        }
      });

      if (response.data.dns) {
        this.xrayConfig.dns = plainToInstance(XrayDnsObject, response.data.dns);
      }

      if (response.data.routing) {
        this.xrayConfig.routing = plainToInstance(XrayRoutingObject, response.data.routing);
        if (this.xrayConfig.routing && this.xrayConfig?.routing?.rules) {
          this.xrayConfig.routing.portsPolicy = plainToInstance(XrayPortsPolicy, response.data.routing.portsPolicy ?? new XrayPortsPolicy());
          this.xrayConfig.routing.rules.forEach((rule, index) => {
            if (this.xrayConfig.routing?.rules) {
              this.xrayConfig.routing.rules[index] = plainToInstance(XrayRoutingRuleObject, rule);
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

export { SubmtActions, Engine, engine };
