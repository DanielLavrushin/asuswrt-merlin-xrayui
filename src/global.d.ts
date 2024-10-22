import XrayObject from "./modules/XrayConfig";
export {};

interface XrayUiCustomSettings {
  xray_ui_page: string;
  xray_enable: boolean;
}

interface XrayUiServer {
  isRunning: boolean;
}

interface XrayUiGlobal {
  server: XrayUiServer;
  commands: any;
  custom_settings: XrayUiCustomSettings;
}

declare global {
  interface Window {
    xray: XrayUiGlobal;
    show_menu: () => void;
    showLoading: () => void;
    hideLoading: () => void;
  }
}
