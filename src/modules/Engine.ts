import axios from "axios";
import XrayObject from "./XrayConfig";

class Engine {
  private form: HTMLFormElement | null = null;

  public init(form: HTMLFormElement): void {
    this.form = form;
    console.log("Form initialized: ", this.form);
  }

  public submit(action: string, payload: any | null = null): void {
    if (this.form) {
      window.showLoading();

      console.log("Submitting form with action: ", action);

      (this.form.querySelector("input[name='action_script']") as HTMLInputElement).value = action;
      const customSettings = JSON.stringify(payload);
      (this.form.querySelector("input[name='amng_custom']") as HTMLInputElement).value = customSettings;

      this.form.submit();
    } else {
      console.error("Form reference is not set.");
    }
  }

  loadXrayConfig() {
    window.showLoading();

    axios
      .get("/ext/xray-ui/xray-config.json")
      .then((response) => {
        console.log("Config loaded:", response.data);
        let xrayConfig = response.data as XrayObject;
        console.log("Xray config object:", xrayConfig);
        window.hideLoading();
      })
      .catch((error) => {
        console.error("Error loading xray-config.json", error);
        window.hideLoading();
      });
  }
}

let engine = new Engine();
export default engine;
