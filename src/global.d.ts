export {};

interface XrayUiCustomSettings {
  xray_page: string;
  xray_version: string;
  xray_payload: string | undefined;
  xray_mode: string;
}

interface XrayUiServer {
  isRunning: boolean;
  xray_version_latest: string;
}

interface XrayRouter {
  cpu: number;
}

interface XrayUiGlobal {
  server: XrayUiServer;
  router: XrayRouter;
  commands: any;
  custom_settings: XrayUiCustomSettings;
}

declare global {
  interface Window {
    xray: XrayUiGlobal;
    hint: (message: string) => void;
    overlib: (message: string) => void;
    show_menu: () => void;
    showLoading: (delay?: number | null, flag?: string | undefined) => void;
    hideLoading: () => void;
    LoadingTime: (seconds: number, flag: any) => void;
    showtext: (element: HTMLElement | null, text: string) => void;
    translate: (key: string) => string;
    y: number;
    progress: number;
  }
}
