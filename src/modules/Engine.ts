import axios from "axios";
import xrayConfig, { XrayObject } from "./XrayConfig";

class SubmtActions {
  public static refreshConfig: string = "xrayui_refreshconfig";
  public static serverStart: string = "xrayui_serverstatus_start";
  public static serverRestart: string = "xrayui_serverstatus_restart";
  public static serverStop: string = "xrayui_serverstatus_stop";
  public static clientDelete: string = "xrayui_client_delete";
  public static clientAdd: string = "xrayui_client_add";
}

class Engine {
  public xrayConfig: XrayObject = xrayConfig;

  private form: HTMLFormElement | null = null;
  private customOnSubmit: (() => Promise<void>) | null = null;

  public init(form: HTMLFormElement): void {
    this.form = form;
  }

  public submit(action: string, payload: any | null = null, onSubmit: () => Promise<void> = this.defaultSubmission): void {
    this.customOnSubmit = onSubmit;
    if (this.form) {
      window.showLoading();

      (this.form.querySelector("input[name='action_script']") as HTMLInputElement).value = action;

      window.xray.custom_settings.xray_payload = JSON.stringify(payload);

      const customSettings = JSON.stringify(window.xray.custom_settings);
      (this.form.querySelector("input[name='amng_custom']") as HTMLInputElement).value = customSettings;

      this.form.submit();
    } else {
      console.error("Form reference is not set.");
    }
  }

  async loadXrayConfig(): Promise<XrayObject> {
    const response = await axios.get<XrayObject>("/ext/xray-ui/xray-config.json");
    Object.assign(this.xrayConfig, response.data);
    return this.xrayConfig;
  }

  public handleSubmitCompletion = async (): Promise<void> => {
    if (this.customOnSubmit) {
      await this.customOnSubmit();
    } else {
      await this.defaultSubmission();
    }
  };

  defaultSubmission = async () => {
    window.hideLoading();
  };
}

let engine = new Engine();
export default engine;

export { SubmtActions, engine };
