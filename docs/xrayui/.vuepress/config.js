import { defaultTheme } from '@vuepress/theme-default';
import { defineUserConfig } from 'vuepress';
import { viteBundler } from '@vuepress/bundler-vite';
import { markdownHintPlugin } from '@vuepress/plugin-markdown-hint';
import { removeHtmlExtensionPlugin } from 'vuepress-plugin-remove-html-extension';

export default defineUserConfig({
  base: '/asuswrt-merlin-xrayui/',
  lang: 'en-US',
  title: 'XRAYUI Documentation',
  description: '',
  cleanUrls: true,
  locales: {
    '/': { lang: 'en-US', title: 'XrayUI', description: 'Manage Xray-core from your Asus router' },
    '/ru/': { lang: 'ru-RU', title: 'XrayUI', description: '' }
  },
  theme: defaultTheme({
    sidebarDepth: 6,
    logo: '/images/logo.png',
    locales: {
      '/': {
        selectLanguageName: 'English',
        sidebar: {
          '/en': [
            {
              text: 'Guides',
              children: [
                { text: 'How to install', link: '/en/install.md' },
                { text: 'Interface Overview', link: '/en/interface.md' },
                { text: 'Importing the Configuration', link: '/en/import-config.md' },
                { text: 'Bypass/Redirect Policy', link: '/en/br-policy.md' }
              ]
            },
            {
              text: 'CLI',
              link: '/en/cli'
            },
            {
              text: 'Changelog',
              link: '/en/changelog'
            }
          ]
        },
        navbar: [
          {
            text: 'Home',
            link: '/',
            children: [
              { text: 'How to install', link: '/en/install.md' },
              { text: 'Interface Overview', link: '/en/interface.md' },
              { text: 'Importing the Configuration', link: '/en/import-config.md' },
              { text: 'Bypass/Redirect Policy', link: '/en/br-policy.md' }
            ]
          },
          { text: 'CLI', link: '/en/cli' },
          { text: 'Changelog', link: '/en/changelog' }
        ]
      },
      '/ru/': {
        selectLanguageName: 'Russian',
        navbar: [
          { text: 'Домой', link: '/ru/index' },
          { text: 'CLI', link: '/ru/cli' },
          { text: 'Changelog', link: '/ru/changelog' }
        ]
      }
    }
  }),
  bundler: viteBundler(),
  plugins: [markdownHintPlugin({ hint: true, alert: true }), removeHtmlExtensionPlugin()]
});
