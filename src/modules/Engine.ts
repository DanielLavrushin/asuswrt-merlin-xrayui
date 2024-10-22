import axios from "axios";
import { reactive } from "vue";
import XrayObject from "./XrayConfig";

class Engine {
  private form: HTMLFormElement | null = null;
  public serverConfig = reactive(new XrayObject());

  public init(form: HTMLFormElement): void {
    this.form = form;
  }

  public submit(action: string, payload: any | null = null): void {
    if (this.form) {
      window.showLoading();

      (this.form.querySelector("input[name='action_script']") as HTMLInputElement).value = action;
      const customSettings = JSON.stringify(payload);
      (this.form.querySelector("input[name='amng_custom']") as HTMLInputElement).value = customSettings;

      this.form.submit();
    } else {
      console.error("Form reference is not set.");
    }
  }

  async loadXrayConfig(): Promise<XrayObject> {
    window.showLoading();
    const response = await axios.get("/ext/xray-ui/xray-config.json");

    Object.assign(this.serverConfig, response.data);

    window.hideLoading();
    return this.serverConfig;
  }
}

let engine = new Engine();
export default engine;
