import { plainToInstance } from 'class-transformer';
import { XrayStreamSettingsObject, XrayXmuxObject } from './CommonObjects';
import { XrayStreamHttpSettingsObject, migrateSplitHttpToXhttp, type SplitHttpMigratableStream } from './TransportObjects';

// Xray-core 24.10.31 renamed SplitHTTP to XHTTP. They are one transport with two spellings
// (infra/conf/transport_internet.go:20, :55-56), so migrating is a pure rename on the wire.
describe('migrateSplitHttpToXhttp', () => {
  const legacy = (extra: Record<string, unknown> = {}) => ({
    network: 'splithttp',
    splithttpSettings: { path: '/legacy', host: 'old.example.com', ...extra }
  });

  it('renames the network and moves the plain fields across', () => {
    const s = legacy({ headers: { 'X-Real-IP': '1.2.3.4' } }) as SplitHttpMigratableStream;
    migrateSplitHttpToXhttp(s);

    expect(s.network).toBe('xhttp');
    expect(s.splithttpSettings).toBeUndefined();
    expect(s.xhttpSettings!.path).toBe('/legacy');
    expect(s.xhttpSettings!.host).toBe('old.example.com');
    expect(s.xhttpSettings!.headers).toEqual({ 'X-Real-IP': '1.2.3.4' });
  });

  it('moves the tuning fields into extra, where XHTTP expects them', () => {
    const s = legacy({
      scMaxEachPostBytes: 2000000,
      scMinPostsIntervalMs: 55,
      noSSEHeader: true,
      xmux: { maxConcurrency: '8-16', maxConnections: 4 }
    }) as SplitHttpMigratableStream;
    migrateSplitHttpToXhttp(s);

    const extra = s.xhttpSettings!.extra!;
    expect(extra.scMaxEachPostBytes).toBe(2000000);
    expect(extra.scMinPostsIntervalMs).toBe(55);
    expect(extra.noSSEHeader).toBe(true);
    expect(extra.xmux).toBeInstanceOf(XrayXmuxObject);
    expect(extra.xmux!.maxConcurrency).toBe('8-16');
    expect(extra.xmux!.maxConnections).toBe(4);
  });

  it('drops scMaxConcurrentPosts, which core removed, without remapping it', () => {
    const s = legacy({ scMaxConcurrentPosts: 7 }) as SplitHttpMigratableStream;
    migrateSplitHttpToXhttp(s);

    // xmux.maxConcurrency is a different concept (mux streams per connection); silently
    // reusing it would change the user's config meaning rather than retire a dead field.
    expect(s.xhttpSettings!.extra!.xmux?.maxConcurrency ?? '16-32').toBe('16-32');
    expect(JSON.stringify(s)).not.toContain('scMaxConcurrentPosts');
  });

  it('lets xhttpSettings win when both are present, matching core', () => {
    // core: `if c.XHTTPSettings != nil { c.SplitHTTPSettings = c.XHTTPSettings }`
    const s = {
      network: 'splithttp',
      splithttpSettings: { path: '/legacy', host: 'old.example.com' },
      xhttpSettings: Object.assign(new XrayStreamHttpSettingsObject(), { path: '/modern' })
    } as SplitHttpMigratableStream;
    migrateSplitHttpToXhttp(s);

    expect(s.network).toBe('xhttp');
    expect(s.splithttpSettings).toBeUndefined();
    expect(s.xhttpSettings!.path).toBe('/modern');
  });

  it('renames a bare splithttp network that carries no settings', () => {
    const s = { network: 'splithttp' } as SplitHttpMigratableStream;
    migrateSplitHttpToXhttp(s);

    expect(s.network).toBe('xhttp');
    expect(s.xhttpSettings).toBeUndefined();
  });

  it('leaves every other transport alone', () => {
    const s = { network: 'ws' } as SplitHttpMigratableStream;
    migrateSplitHttpToXhttp(s);

    expect(s.network).toBe('ws');
    expect(s.xhttpSettings).toBeUndefined();
  });

  // The regression this migration exists to prevent: without it, normalize() prunes any
  // *Settings key that NET_KEEP does not list for the current network -- and NET_KEEP no
  // longer knows 'splithttp'. A legacy config would save as {"network":"splithttp"} with
  // its path, host and headers silently gone.
  it('survives a full hydrate -> normalize round trip with settings intact', () => {
    const raw: Record<string, unknown> = {
      network: 'splithttp',
      splithttpSettings: { path: '/legacy', host: 'old.example.com', noSSEHeader: true }
    };

    const stream = plainToInstance(XrayStreamSettingsObject, raw);
    migrateSplitHttpToXhttp(stream as SplitHttpMigratableStream);
    const out = JSON.parse(JSON.stringify(stream.normalize()));

    expect(out.network).toBe('xhttp');
    expect(out.splithttpSettings).toBeUndefined();
    expect(out.xhttpSettings.path).toBe('/legacy');
    expect(out.xhttpSettings.host).toBe('old.example.com');
    expect(out.xhttpSettings.extra.noSSEHeader).toBe(true);
  });
});
