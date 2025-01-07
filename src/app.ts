import { createApp } from "vue";
import App from "./App.vue";

window.hint = (message: string) => {
  window.overlib(message);
};
window.LoadingTime = (seconds: number, flag: string | null) => {
  const proceedingMainText = document.getElementById("proceeding_main_txt");
  const proceedingText = document.getElementById("proceeding_txt");
  const loading = document.getElementById("Loading") as HTMLElement;

  if (!proceedingMainText || !proceedingText || !loading) {
    console.error("Required DOM elements not found.");
    return;
  }

  window.showtext(proceedingMainText, "<#389#>...");
  loading.style.visibility = "visible";

  let progressPercentage = 0;
  const progressIncrement = 10; // Adjust as needed

  const updateLoading = () => {
    progressPercentage += progressIncrement;

    if (seconds > 0) {
      window.showtext(proceedingMainText, "<#392#>");
      window.showtext(proceedingText, `<span style="color:#FFFFCC;">${Math.round(progressPercentage)}% </span><#389#>`);

      seconds--;

      setTimeout(updateLoading, 1000);
    } else {
      window.showtext(proceedingMainText, window.translate("<#391#>"));
      window.showtext(proceedingText, "");

      progressPercentage = 0;

      if (flag !== "waiting") {
        setTimeout(() => window.hideLoading(), 1000);
      }
    }
  };

  updateLoading();
};

document.addEventListener("DOMContentLoaded", async () => {
  createApp(App).mount("#xrayui-app");
});
