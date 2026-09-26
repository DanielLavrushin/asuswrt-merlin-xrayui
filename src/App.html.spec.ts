import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { TextDecoder, TextEncoder } from 'node:util';

interface JsdomWindow {
  document: Document;
  xray: {
    router: Record<string, any>;
    server: Record<string, any>;
    custom_settings: Record<string, any>;
  };
  pwned?: number;
}
interface JsdomVirtualConsole {
  on(event: 'jsdomError', listener: (error: Error) => void): void;
}
interface JsdomModule {
  JSDOM: new (html: string, options: { runScripts: 'dangerously'; virtualConsole: JsdomVirtualConsole }) => { window: JsdomWindow };
  VirtualConsole: new () => JsdomVirtualConsole;
}

Object.assign(globalThis, { TextEncoder, TextDecoder });
const { JSDOM, VirtualConsole } = createRequire(require.resolve('jest-environment-jsdom'))('jsdom') as JsdomModule;

const TEMPLATE = fs.readFileSync(path.join(__dirname, 'App.html'), 'utf8');
const MAC = '00:62:6E:A7:F8:8A';

const jsonc = (value: unknown) => JSON.stringify(value).replaceAll('/', String.raw`\/`);

const device = (fields: Record<string, string> = {}) => ({ mac: MAC, name: 'FI9961EP', vendor: '', vendorclass: '', nickName: '', ...fields });
const clientList = (fields: Record<string, string> = {}) => jsonc({ [MAC]: device(fields), maclist: [MAC], ClientAPILevel: '7' });

type Handlers = Record<string, string>;

const DEFAULTS: Handlers = {
  get_custom_settings: jsonc({ xray_version: '0.70.0', xray_startup: 'y', MerlinAU_version_local: '1.5.9' }),
  cpu_core_num: '4',
  get_clientlist: clientList(),
  get_clientlist_from_json_database: clientList(),
  'nvram_get("productid")': 'GT-BE98',
  'nvram_get("firmver")': '3006.102',
  'nvram_get("preferred_lang")': 'EN',
  'nvram_get("lan_ipaddr")': '192.168.1.1',
  'nvram_get("territory_code")': 'EU/01',
  'nvram_get("wan_ipaddr")': '203.0.113.7',
  'nvram_get("link_internet")': '2',
  'nvram_get("rc_support")': 'mssid 2.4G 5G',
  'nvram_get("extendno")': '0',
  'sysinfo("pid.xray")': '1234',
  'sysinfo("pid.b4sni")': '-1'
};

const render = (overrides: Handlers = {}) => {
  const handlers = { ...DEFAULTS, ...overrides };
  const html = TEMPLATE.replace(/<%\s*(.*?);?\s*%>/g, (_tag, call: string) => {
    const key = call.replace(/\(\)$/, '');
    if (!(key in handlers)) throw new Error(`no simulated output for <% ${call} %>`);
    return handlers[key];
  });
  const errors: Error[] = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => errors.push(error));
  const { window } = new JSDOM(html, { runScripts: 'dangerously', virtualConsole });
  return { window, errors };
};

describe('App.html bootstrap data', () => {
  it('reads every value from the router', () => {
    const { window, errors } = render();

    expect(errors).toEqual([]);
    expect(window.xray.router.name).toBe('GT-BE98');
    expect(window.xray.router.cpu).toBe(4);
    expect(window.xray.router.devices[MAC].name).toBe('FI9961EP');
    expect(window.xray.router.devices_online[MAC].mac).toBe(MAC);
    expect(window.xray.custom_settings).toEqual({ xray_version: '0.70.0', xray_startup: 'y', MerlinAU_version_local: '1.5.9' });
    expect(window.xray.server.isRunning).toBe(true);
    expect(window.xray.server.b4sni_isRunning).toBe(false);
    expect(window.document.getElementById('xrayui-app')).not.toBeNull();
  });

  it.each([
    ['a vendor class of space, quote, quote (Foscam camera)', 'vendorclass', ' ""'],
    ['a nickname with quotes', 'nickName', 'TV "living room"'],
    ['a nickname with a backslash escape', 'nickName', String.raw`C:\new\tfolder`],
    ['a backtick', 'vendor', 'cam`era'],
    ['a template expression', 'vendorclass', '${globalThis.pwned=1}'],
    ['an apostrophe', 'nickName', "Tom's PC"],
    ['an escape character and a newline', 'vendor', '\u001b[31mred\nline'],
    ['an html comment that opens a script', 'vendorclass', '<!--<script>'],
    ['a closing tag', 'nickName', '</xmp></script><img src=x onerror=globalThis.pwned=1>'],
    ['non-latin text', 'nickName', 'Телевизор 客厅']
  ])('keeps the page working and the value intact with %s in a device field', (_label, field, value) => {
    const { window, errors } = render({
      get_clientlist: clientList({ [field]: value }),
      get_clientlist_from_json_database: clientList({ [field]: value })
    });

    expect(errors).toEqual([]);
    expect(window.pwned).toBeUndefined();
    expect(window.document.querySelectorAll('img')).toHaveLength(0);
    expect(window.document.getElementById('xrayui-app')).not.toBeNull();
    expect(window.xray.router.devices[MAC][field]).toBe(value);
    expect(window.xray.router.devices_online[MAC][field]).toBe(value);
    expect(window.xray.custom_settings.xray_version).toBe('0.70.0');
    expect(window.xray.router.cpu).toBe(4);
  });

  it.each([
    ['networkmap is not running', '{"maclist": [], "ClientAPILevel":"7"}', { maclist: [], ClientAPILevel: '7' }],
    ['the networkmap cache could not be read', 'null', {}],
    ['the output is empty', '', {}],
    ['the output is cut off', '{"00:11:22:33:44:55":{"name":"a', {}]
  ])('falls back when %s', (_label, output, expected) => {
    const { window, errors } = render({ get_clientlist: output, get_clientlist_from_json_database: output });

    expect(errors).toEqual([]);
    expect(window.xray.router.devices_online).toEqual(expected);
    expect(window.xray.router.devices).toEqual(expected);
    expect(window.xray.custom_settings.xray_version).toBe('0.70.0');
  });

  it("keeps other add-ons' settings exactly as stored", () => {
    const foreign = { other_quote: 'a"b', other_apostrophe: "it's", other_backslash: String.raw`C:\temp\new`, other_slash: 'https://example.com/x' };
    const { window, errors } = render({ get_custom_settings: jsonc({ xray_version: '0.70.0', ...foreign }) });

    expect(errors).toEqual([]);
    expect(window.xray.custom_settings).toEqual({ xray_version: '0.70.0', ...foreign });
  });

  it('keeps working while an unfinished request is still stored', () => {
    const payload = JSON.stringify({ profile: 'config.json', tags: ['a', 'b'] });
    const { window, errors } = render({ get_custom_settings: jsonc({ xray_version: '0.70.0', xray_payload0: payload }) });

    expect(errors).toEqual([]);
    expect(window.xray.custom_settings.xray_payload0).toBe(payload);
  });

  it('removes terminal colour codes from stored values', () => {
    const { window, errors } = render({ get_custom_settings: jsonc({ xray_version: '0.70.0', xray_page: '\u001b[32muser2.asp\u001b[0m' }) });

    expect(errors).toEqual([]);
    expect(window.xray.custom_settings.xray_page).toBe('user2.asp');
  });

  it('uses empty settings when the settings file does not exist', () => {
    const { window, errors } = render({ get_custom_settings: ' new Object()' });

    expect(errors).toEqual([]);
    expect(window.xray.custom_settings).toEqual({});
    expect(window.xray.router.devices[MAC].name).toBe('FI9961EP');
  });

  it('leaves the core count unset when the router does not report it', () => {
    const { window, errors } = render({ cpu_core_num: '' });

    expect(errors).toEqual([]);
    expect(window.xray.router.cpu).toBeUndefined();
  });
});
