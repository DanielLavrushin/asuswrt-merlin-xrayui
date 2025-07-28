import { defaultTheme } from '@vuepress/theme-default';
import { defineUserConfig } from 'vuepress';
import { viteBundler } from '@vuepress/bundler-vite';
import { markdownHintPlugin } from '@vuepress/plugin-markdown-hint';
import { removeHtmlExtensionPlugin } from 'vuepress-plugin-remove-html-extension';

export default defineUserConfig({
  lang: 'en-US',
  title: 'XRAYUI Documentation',
  description: '',
  cleanUrls: true,
  locales: {
    '/': { lang: 'en-US', title: 'XrayUI', description: 'Manage Xray-core from your Asus router' },
    '/ru/': { lang: 'ru-RU', title: 'XrayUI', description: '' }
  },
  theme: defaultTheme({
    logo: '/images/logo.png',
    navbar: ['/'],
    locales: {
      '/': {
        selectLanguageName: 'English',
        navbar: [
          { text: 'Home', link: '/' },
          { text: 'CLI', link: '/en/cli' },
          { text: 'Changelog', link: '/changelog' }
        ]
      },
      '/ru/': {
        selectLanguageName: 'Russian',
        navbar: [
          { text: 'Домой', link: '/ru/index' },
          { text: 'CLI', link: '/ru/cli' },
          { text: 'Changelog', link: '/changelog' }
        ]
      }
    }
  }),

  bundler: viteBundler(),
  plugins: [markdownHintPlugin({ hint: true, alert: true }), removeHtmlExtensionPlugin()]
});
