import axios from "axios";
import xrayConfig, { XrayObject, XrayInboundObject, XrayStreamTlsSettingsObject } from "./XrayConfig";

class SubmtActions {
  public static ConfigurationServerSave: string = "xrayui_configuration_server";
  public static CertificateRenew: string = "xrayui_certificate_renew";
  public static clientsOnline: string = "xrayui_connectedclients";
  public static refreshConfig: string = "xrayui_refreshconfig";
  public static serverStart: string = "xrayui_serverstatus_start";
  public static serverRestart: string = "xrayui_serverstatus_restart";
  public static serverStop: string = "xrayui_serverstatus_stop";
  public static clientDelete: string = "xrayui_client_delete";
  public static clientAdd: string = "xrayui_client_add";
  public static regenerateRealityKeys: string = "xrayui_regenerate_realitykeys";
}

class Engine {
  public xrayConfig: XrayObject = xrayConfig;

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
        window.xray.custom_settings.xray_payload = JSON.stringify(payload);
        const customSettings = JSON.stringify(window.xray.custom_settings);

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

  async getRealityKeys(): Promise<any> {
    const response = await axios.get<XrayObject>("/ext/xray-ui/reality.json");

    let realityKeys = response.data;
    return realityKeys;
  }
  async loadXrayConfig(): Promise<XrayObject> {
    const response = await axios.get<XrayObject>("/ext/xray-ui/xray-config.json");
    Object.assign(this.xrayConfig, response.data);
    return this.xrayConfig;
  }

  validateInbound = (inbound: XrayInboundObject): void => {
    if (inbound.streamSettings?.tlsSettings) {
      let tls = inbound.streamSettings.tlsSettings;
      if (!tls.minVersion) {
        tls.minVersion = 1.3;
      }
      if (!tls.maxVersion) {
        tls.maxVersion = tls.minVersion;
      }

      if (!tls.alpn || tls.alpn?.length === 0) {
        tls.alpn = XrayStreamTlsSettingsObject.alpnOptions;
      }
    }
  };

  public constructConfig(model: XrayObject): any {
    if (model.inbounds) {
      model.inbounds.forEach((inbound: XrayInboundObject) => {
        if (inbound.streamSettings?.tlsSettings) {
          inbound.streamSettings.tlsSettings.minVersion = `${inbound.streamSettings.tlsSettings.minVersion}`;
          inbound.streamSettings.tlsSettings.maxVersion = `${inbound.streamSettings.tlsSettings.maxVersion}`;
        }
      });
    }
    return model;
  }
}

let engine = new Engine();
export default engine;

export { SubmtActions, Engine, engine };
