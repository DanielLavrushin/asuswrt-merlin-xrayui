export {};

interface XrayUiCustomSettings {
  xray_ui_page: string;
  xray_enable: boolean;
  xray_payload: string | undefined;
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
    hint: (message: string) => void;
    show_menu: () => void;
    showLoading: (delay?: number | null) => void;
    hideLoading: () => void;
  }
}
