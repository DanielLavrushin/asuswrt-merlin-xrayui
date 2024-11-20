import axios from "axios";
import xrayConfig, { XrayStreamSettingsObject, xrayClientConfig, XrayClientObject, XrayObject } from "./XrayConfig";

class EngineWireguard {
  public privatekey!: string;
  public publickey!: string;
}
class EngineResponseConfig {
  public wireguard?: EngineWireguard;
}
class SubmtActions {
  public static ConfigurationSetMode: string = "xrayui_configuration_mode";
  public static ConfigurationServerSave: string = "xrayui_configuration_server";
  public static ConfigurationClientSave: string = "xrayui_configuration_client";
  public static CertificateRenew: string = "xrayui_certificate_renew";
  public static clientsOnline: string = "xrayui_connectedclients";
  public static refreshConfig: string = "xrayui_refreshconfig";
  public static serverStart: string = "xrayui_serverstatus_start";
  public static serverRestart: string = "xrayui_serverstatus_restart";
  public static serverStop: string = "xrayui_serverstatus_stop";
  public static clientDelete: string = "xrayui_client_delete";
  public static clientAdd: string = "xrayui_client_add";
  public static regenerateRealityKeys: string = "xrayui_regenerate_realitykeys";
  public static regenerateWireguardyKeys: string = "xrayui_regenerate_wgkeys";
}

class Engine {
  public xrayConfig: XrayObject = xrayConfig;
  public xrayClientConfig: XrayClientObject = xrayClientConfig;
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

        const amngCustomInput = document.createElement("input");
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

    config.inbounds.forEach((inbound) => {
      let streamSettings = new XrayStreamSettingsObject();
      Object.assign(streamSettings, inbound.streamSettings);
      streamSettings?.normalizeProtocol();
      streamSettings?.normalizeSecurity();
      inbound.streamSettings = streamSettings;
    });

    return config;
  }

  async getRealityKeys(): Promise<any> {
    const response = await axios.get<XrayObject>("/ext/xray-ui/reality.json");
    let realityKeys = response.data;
    return realityKeys;
  }

  async getEngineConfig(): Promise<EngineResponseConfig> {
    const response = await axios.get<EngineResponseConfig>("/ext/xray-ui/xray-ui-response.json");
    let responseConfig = response.data;
    return responseConfig;
  }

  async loadXrayConfig(): Promise<XrayObject> {
    const response = await axios.get<XrayObject>(this.mode === "server" ? "/ext/xray-ui/xray-config.json" : "/ext/xray-ui/xray-config-client.json");
    if (this.mode === "server") {
      Object.assign(this.xrayConfig, response.data);
    } else {
      Object.assign(this.xrayClientConfig, response.data);
    }

    return this.xrayConfig;
  }
}

let engine = new Engine();
export default engine;

export { SubmtActions, Engine, engine };
