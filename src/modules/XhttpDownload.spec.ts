import { plainToInstance } from 'class-transformer';
import engine from './Engine';
import { XrayObject } from './XrayConfig';
import {
  XrayStreamHttpSettingsObject,
  createXhttpDownloadSettings
} from './TransportObjects';

const padding = {
  xPaddingObfsMode: true,
  xPaddingPlacement: 'cookie',
  xPaddingKey: 'pad',
  xPaddingHeader: 'X-Custom-Padding',
  xPaddingMethod: 'tokenish'
};

// Xray-core v26.6.22 SplitHTTPConfig.Build replaces the outer config with extra,
// retaining only host/path/mode. Assert against what core actually consumes.
const effective = (settings: Record<string, any>) => settings.extra ?? settings;
const serialize = (http: XrayStreamHttpSettingsObject) => JSON.parse(JSON.stringify(http.normalize()));
const hydrate = (xhttpSettings: Record<string, unknown>) => engine.hydrateConfig(plainToInstance(XrayObject, {
  outbounds: [{ protocol: 'vless', tag: 'split', settings: { vnext: [] }, streamSettings: { network: 'xhttp', xhttpSettings } }]
}));

describe('split XHTTP padding', () => {
  it('sends the configured padding on both legs, including non-default byte ranges', () => {
    const http = XrayStreamHttpSettingsObject.fromPlain({
      path: '/split/', mode: 'stream-up', ...padding, extra: { xPaddingBytes: '200-400' }
    });
    const download = createXhttpDownloadSettings(http);
    download.address = 'down.example.com';
    download.security = 'tls';
    http.extra!.downloadSettings = download;

    const saved = serialize(http);
    expect(effective(saved)).toMatchObject({ ...padding, xPaddingBytes: '200-400' });
    const down = saved.extra.downloadSettings;
    expect(down).toMatchObject({ address: 'down.example.com', port: 443, network: 'xhttp', security: 'tls' });
    expect(down.xhttpSettings.path).toBe('/split/');
    expect(effective(down.xhttpSettings)).toMatchObject({ ...padding, xPaddingBytes: '200-400' });
  });

  it('keeps obfuscation enabled with every padding sub-field at its default', () => {
    const http = new XrayStreamHttpSettingsObject();
    http.extra!.xPaddingObfsMode = true;
    http.extra!.downloadSettings = createXhttpDownloadSettings(http);
    http.extra!.downloadSettings.address = 'down.example.com';

    const saved = serialize(http);
    expect(effective(saved).xPaddingObfsMode).toBe(true);
    expect(effective(saved.extra.downloadSettings.xhttpSettings).xPaddingObfsMode).toBe(true);
    expect(saved.extra.downloadSettings.xhttpSettings.extra).toEqual({ xPaddingObfsMode: true });
  });

  it('uses an independent copy that remains editable after upload settings change', () => {
    const http = XrayStreamHttpSettingsObject.fromPlain({ path: '/up/', ...padding });
    const download = createXhttpDownloadSettings(http);
    http.path = '/changed/';
    http.extra!.xPaddingKey = 'new-upload-key';
    download.address = 'down.example.com';
    download.port = 8443;
    download.xhttpSettings!.path = '/cdn-rewrite/';
    download.xhttpSettings!.extra!.xPaddingKey = 'download-key';
    http.extra!.downloadSettings = download;

    const saved = serialize(http).extra.downloadSettings;
    expect(saved.port).toBe(8443);
    expect(saved.xhttpSettings).toMatchObject({ path: '/cdn-rewrite/', extra: { xPaddingKey: 'download-key' } });
    expect(http.extra!.xPaddingKey).toBe('new-upload-key');
  });

  it('hydrates extra-only subscription padding for upload and download and preserves it on save', () => {
    const config = hydrate({
      path: '/up/', extra: { ...padding, xPaddingBytes: '200-400', downloadSettings: {
        address: 'down.example.com', port: 8443, network: 'xhttp', security: 'tls',
        xhttpSettings: { path: '/down/', extra: { ...padding, xPaddingKey: 'download', xPaddingBytes: '300-500' } }
      } }
    });
    const http = config.outbounds![0].streamSettings!.xhttpSettings!;
    expect(http.extra).toMatchObject(padding);
    expect(http.extra!.downloadSettings!.xhttpSettings!.extra).toMatchObject({ ...padding, xPaddingKey: 'download' });

    const saved = serialize(http);
    expect(effective(saved)).toMatchObject(padding);
    expect(effective(saved.extra.downloadSettings.xhttpSettings)).toMatchObject({ ...padding, xPaddingKey: 'download' });
    expect(saved.extra.downloadSettings.xhttpSettings.path).toBe('/down/');
    const reloaded = hydrate(saved).outbounds![0].streamSettings!.xhttpSettings!;
    expect(serialize(reloaded)).toEqual(saved);
  });

  it('does not resurrect obfuscation when it is disabled after a save', () => {
    const http = XrayStreamHttpSettingsObject.fromPlain({ ...padding, extra: { scMaxBufferedPosts: 99 } });
    serialize(http);
    http.extra!.xPaddingObfsMode = false;
    const saved = serialize(http);
    expect(effective(saved).xPaddingObfsMode).toBeUndefined();
    expect(effective(saved).xPaddingKey).toBeUndefined();
    expect(serialize(http)).toEqual(saved);
  });

  it('honors an explicit false inside imported extra over an outer true', () => {
    const http = hydrate({ xPaddingObfsMode: true, extra: { xPaddingObfsMode: false, scMaxBufferedPosts: 99 } })
      .outbounds![0].streamSettings!.xhttpSettings!;
    expect(http.extra!.xPaddingObfsMode).toBe(false);
    expect(effective(serialize(http)).xPaddingObfsMode).toBeUndefined();
  });

  it('does not create extra or a download for a default transport', () => {
    const http = new XrayStreamHttpSettingsObject();
    expect(http.normalize()).toBeUndefined();
  });
});
