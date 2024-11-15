export {};

interface XrayUiCustomSettings {
  xray_ui_page: string;
  xray_payload: string | undefined;
  xray_mode: string;
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
