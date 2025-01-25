import { createApp } from "vue";
import App from "./App.vue";

window.hint = (message: string) => {
  window.overlib(message);
};
window.LoadingTime = (seconds: number, flag: string | null) => {
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

  let time = seconds / 1000;
  let progressPercentage = 0;
  const progressIncrement = 100 / time;

  const updateLoading = () => {
    progressPercentage += progressIncrement;

    if (time > 0) {
      window.showtext(proceedingMainText, text);
      window.showtext(proceedingText, `<span style="color:#FFFFCC;">${Math.round(progressPercentage)}% </span>`);

      time--;

      setTimeout(updateLoading, 1000);
    } else {
      window.showtext(proceedingMainText, text);
      window.showtext(proceedingText, "");

      progressPercentage = 0;

      if (flag !== "waiting") {
        setTimeout(() => {
          window.hideLoading();
        }, 1000);
      }
    }
  };

  updateLoading();
};

document.addEventListener("DOMContentLoaded", () => {
  createApp(App).mount("#xrayui-app");
});
