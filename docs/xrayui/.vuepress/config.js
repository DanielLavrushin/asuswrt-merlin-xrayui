import { defaultTheme } from '@vuepress/theme-default';
import { defineUserConfig } from 'vuepress';
import { viteBundler } from '@vuepress/bundler-vite';
import { markdownHintPlugin } from '@vuepress/plugin-markdown-hint';
import { removeHtmlExtensionPlugin } from 'vuepress-plugin-remove-html-extension';

const links_en = [
  { text: 'How to install', link: '/en/install.md' },
  { text: 'Interface Overview', link: '/en/interface.md' },
  { text: 'Routing Rules Guide', link: '/en/routing.md' },
  { text: 'General Options', link: '/en/general-options.md' },
  { text: 'Importing the Configuration', link: '/en/import-config.md' },
  { text: 'Bypass/Redirect Policy', link: '/en/br-policy.md' },
  { text: 'Subscription Management', link: '/en/subscriptions.md' },
  { text: 'DNS Leak', link: '/en/dns-leak.md' },
  { text: 'Securely Share Config', link: '/en/share-config.md' },
  { text: 'Transparent Proxy (TPROXY)', link: '/en/tproxy.md' },
  { text: 'Reality TLS Scanner', link: '/en/rtls-scanner.md' },
  { text: 'Custom Geosite Files', link: '/en/custom-geodata.md' },
  { text: 'Inspect Geosite and GeoIP Databases', link: '/en/v2dat.md' },
  { text: 'B4SNI Inspection', link: '/en/b4sni.md' }
];
const links_ru = [
  { text: 'Как установить', link: '/ru/install.md' },
  { text: 'Обзор интерфейса', link: '/ru/interface.md' },
  { text: 'Руководство по правилам маршрутизации', link: '/ru/routing.md' },
  { text: 'Общие параметры', link: '/ru/general-options.md' },
  { text: 'Импорт конфигурации', link: '/ru/import-config.md' },
  { text: 'Политика обхода/перенаправления', link: '/ru/br-policy.md' },
  { text: 'Управление подписками', link: '/ru/subscriptions.md' },
  { text: 'Утечки DNS и как их избежать', link: '/ru/dns-leak.md' },
  { text: 'Безопасный обмен конфигом', link: '/ru/share-config.md' },
  { text: 'Прозрачный прокси (TPROXY)', link: '/ru/tproxy.md' },
  { text: 'Сканер Reality TLS', link: '/ru/rtls-scanner.md' },
  { text: 'Пользовательские файлы геоданных', link: '/ru/custom-geodata.md' },
  { text: 'Инспекция баз данных Geosite и GeoIP', link: '/ru/v2dat.md' },
  { text: 'Логирование в XRAY', link: '/ru/logs.md' },
  { text: 'B4SNI: Инспекция SNI', link: '/ru/b4sni.md' }
];
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
              children: links_en
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
            children: links_en
          },
          { text: 'CLI', link: '/en/cli' },
          { text: 'Changelog', link: '/en/changelog' }
        ]
      },
      '/ru/': {
        selectLanguageName: 'Russian',
        sidebar: {
          '/ru': [
            {
              text: 'Руководства',
              children: links_ru
            },
            {
              text: 'Команды (CLI)',
              link: '/ru/cli'
            },
            {
              text: 'Changelog',
              link: '/ru/changelog'
            }
          ]
        },
        navbar: [
          {
            text: 'Руководства',
            link: '/',
            children: links_ru
          },
          { text: 'Команды (CLI)', link: '/ru/cli' },
          { text: 'Список изменений', link: '/ru/changelog' }
        ]
      }
    }
  }),
  bundler: viteBundler(),
  plugins: [markdownHintPlugin({ hint: true, alert: true }), removeHtmlExtensionPlugin()]
});
