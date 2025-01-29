import { createApp } from "vue";
import App from "./App.vue";
import { EngineLoadingProgress } from "./modules/Engine";

window.hint = (message: string) => {
  window.overlib(message);
};
let loadingProgressStarted = false;
window.LoadingTime = (seconds: number, flag: string | EngineLoadingProgress | undefined) => {
  if (flag instanceof EngineLoadingProgress) {
    window.updateLoadingProgress(flag as EngineLoadingProgress);
    return;
  }

  if (loadingProgressStarted) {
    return;
  }
  loadingProgressStarted = true;
  const proceedingMainText = document.getElementById("proceeding_main_txt");
  const proceedingText = document.getElementById("proceeding_txt");
  const loading = document.getElementById("Loading");

  if (!proceedingMainText || !proceedingText || !loading) {
    console.error("Required DOM elements not found.");
    return;
  }

  const text = "Please wait...";
  window.showtext(proceedingMainText, text);
  loading.style.visibility = "visible";

  let progressPercentage = 0;
  let currentStep = 0;
  const totalSteps = 100;
  const stepDuration = seconds / totalSteps;

  const updateLoading = () => {
    currentStep++;
    progressPercentage = currentStep;

    window.showtext(proceedingMainText, text);
    window.showtext(proceedingText, `<span style="color:#FFFFCC;">${progressPercentage}%</span>`);

    if (currentStep < totalSteps) {
      setTimeout(updateLoading, stepDuration);
    } else {
      // Once we reach 100%
      progressPercentage = 0;
      window.showtext(proceedingMainText, text);
      window.showtext(proceedingText, "");

      if (flag !== "waiting") {
        setTimeout(() => {
          loadingProgressStarted = false;
          window.hideLoading();
        }, 1000);
      } else {
        loadingProgressStarted = false;
      }
    }
  };
  updateLoading();
};

window.updateLoadingProgress = (progress?: EngineLoadingProgress) => {
  const proceedingMainText = document.getElementById("proceeding_main_txt");
  const proceedingText = document.getElementById("proceeding_txt");
  const loading = document.getElementById("Loading");

  if (!proceedingMainText || !proceedingText || !loading) {
    console.error("Required DOM elements not found.");
    return;
  }

  loading.style.visibility = "visible";

  if (progress?.message) {
    window.showtext(proceedingMainText, progress.message + "<br />");
  }
  if (progress?.progress) {
    window.showtext(proceedingText, `Progress: ${progress.progress}%`);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  createApp(App).mount("#xrayui-app");
});
