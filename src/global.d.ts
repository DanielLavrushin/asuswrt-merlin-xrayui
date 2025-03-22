/* eslint-disable no-unused-vars */
import { SubmtActions, EngineLoadingProgress } from "./modules/Engine";
import { XrayRouterDeviceOnline } from "./modules/Interfaces";

export {};

interface XrayUiCustomSettings {
  [key: string]: string;
  xray_page: string;
  xray_version: string;
  xray_startup: string;
}

interface XrayUiServer {
  isRunning: boolean;
  xray_version_latest: string;
}

interface XrayRouter {
  cpu: number;
  name: string;
  ip: string;
  language: string;
  firmware: string;
  features: unknown;
  wan_ip: string;
  devices: [[string, string]];
  devices_online: Record<string, XrayRouterDeviceOnline>;
}

interface XrayUiGlobal {
  server: XrayUiServer;
  router: XrayRouter;
  commands: SubmtActions;
  custom_settings: XrayUiCustomSettings;
}

declare global {
  interface Window {
    xray: XrayUiGlobal;
    confirm: (message?: string) => boolean;
    hint: (message: string) => void;
    overlib: (message: string) => void;
    show_menu: () => void;
    showLoading: (delay?: number | null, flag?: string | EngineLoadingProgress) => void;
    updateLoadingProgress: (progress?: EngineLoadingProgress) => void;
    hideLoading: () => void;
    LoadingTime: (seconds: number, flag?: string) => void;
    showtext: (element: HTMLElement | null, text: string) => void;
    y: number;
    progress: number;
  }
}
