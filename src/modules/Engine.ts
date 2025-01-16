import axios from "axios";
import { xrayConfig, XrayObject } from "./XrayConfig";
import { NormalizeOutbound, XrayBlackholeOutboundObject, XrayLoopbackOutboundObject, XrayDnsOutboundObject, XrayFreedomOutboundObject, XrayTrojanOutboundObject, XrayOutboundObject, XraySocksOutboundObject, XrayVmessOutboundObject, XrayVlessOutboundObject, XrayHttpOutboundObject, XrayShadowsocksOutboundObject } from "./OutboundObjects";
import { XrayProtocol, XrayDnsObject, XrayStreamSettingsObject, XrayRoutingObject, XrayRoutingRuleObject } from "./CommonObjects";
import { plainToInstance } from "class-transformer";
import { XrayWireguardInboundObject } from "./InboundObjects";

class EngineWireguard {
  public privatekey!: string;
  public publickey!: string;
}
class EngineResponseConfig {
  public wireguard?: EngineWireguard;
  public xray?: { test: string };
}
class SubmtActions {
  public static ConfigurationSetMode: string = "xrayui_configuration_mode";
  public static ConfigurationApply: string = "xrayui_configuration_apply";
  public static CertificateRenew: string = "xrayui_certificate_renew";
  public static clientsOnline: string = "xrayui_connectedclients";
  public static refreshConfig: string = "xrayui_refreshconfig";
  public static serverStart: string = "xrayui_serverstatus_start";
  public static serverRestart: string = "xrayui_serverstatus_restart";
  public static serverStop: string = "xrayui_serverstatus_stop";
  public static regenerateRealityKeys: string = "xrayui_regenerate_realitykeys";
  public static regenerateWireguardyKeys: string = "xrayui_regenerate_wgkeys";
  public static enableLogs: string = "xrayui_configuration_logs";
  public static performUpdate: string = "xrayui_update";
  public static performUpdateGeodat: string = "xrayui_updategeodat";
  public static ToggleStartupOption: string = "xrayui_configuration_togglestartup";
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
      let streamSettings = new XrayStreamSettingsObject();
      Object.assign(streamSettings, proxy.streamSettings);
      streamSettings?.normalize();
      proxy.streamSettings = streamSettings;
    });

    config.outbounds.forEach((proxy) => {
      NormalizeOutbound(proxy);
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

  async getRealityKeys(): Promise<any> {
    const response = await axios.get<XrayObject>("/ext/xrayui/reality.json");
    let realityKeys = response.data;
    return realityKeys;
  }

  async getEngineConfig(): Promise<EngineResponseConfig> {
    const response = await axios.get<EngineResponseConfig>("/ext/xrayui/xray-ui-response.json");
    let responseConfig = response.data;
    return responseConfig;
  }

  async loadXrayConfig(): Promise<XrayObject> {
    const response = await axios.get<XrayObject>("/ext/xrayui/xray-config.json");
    this.xrayConfig = plainToInstance(XrayObject, response.data);

    this.xrayConfig.outbounds.forEach((proxy, index) => {
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

      this.xrayConfig.routing = plainToInstance(XrayRoutingObject, response.data.routing);
      if (this.xrayConfig.routing && this.xrayConfig?.routing?.rules) {
        this.xrayConfig.routing.rules.forEach((rule, index) => {
          if (this.xrayConfig.routing?.rules) {
            this.xrayConfig.routing.rules[index] = plainToInstance(XrayRoutingRuleObject, rule);
          }
        });
      }
    }
    Object.assign(xrayConfig, this.xrayConfig);
    return this.xrayConfig;
  }
}

let engine = new Engine();
export default engine;

export { SubmtActions, Engine, engine };
