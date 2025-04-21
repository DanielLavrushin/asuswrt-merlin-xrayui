/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import 'reflect-metadata';

import App from './App.vue';
import { EngineLoadingProgress } from './modules/Engine';

import en from './translations/en.json';
import de from './translations/de.json';
import ru from './translations/ru.json';
import uk from './translations/uk.json';

window.hint = (message: string) => {
  window.overlib(message);
};
let loadingProgressStarted = false;
window.LoadingTime = (seconds: number, flag: string | EngineLoadingProgress | undefined) => {
  if (flag instanceof EngineLoadingProgress) {
    window.updateLoadingProgress(flag);
    return;
  }

  if (loadingProgressStarted) {
    return;
  }
  loadingProgressStarted = true;
  const proceedingMainText = document.getElementById('proceeding_main_txt');
  const proceedingText = document.getElementById('proceeding_txt');
  const loading = document.getElementById('Loading');

  if (!proceedingMainText || !proceedingText || !loading) {
    console.error('Required DOM elements not found.');
    return;
  }

  const text = 'Please wait...';
  window.showtext(proceedingMainText, text);
  loading.style.visibility = 'visible';

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
      window.showtext(proceedingText, '');

      if (flag !== 'waiting') {
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
  const proceedingMainText = document.getElementById('proceeding_main_txt');
  const proceedingText = document.getElementById('proceeding_txt');
  const loading = document.getElementById('Loading');

  if (!proceedingMainText || !proceedingText || !loading) {
    console.error('Required DOM elements not found.');
    return;
  }

  loading.style.visibility = 'visible';

  if (progress?.message) {
    // eslint-disable-next-line xss/no-mixed-html
    window.showtext(proceedingMainText, progress.message + '<br />');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const currentLanguage = (window.xray.router.language || 'en').toLowerCase();

  const i18n = createI18n({
    locale: currentLanguage,
    globalInjection: true,
    fallbackLocale: 'en',
    legacy: false,
    warnHtmlMessage: false,
    messages: {
      en,
      de,
      ru,
      uk
    }
  });

  createApp(App).use(i18n).mount('#xrayui-app');
});
