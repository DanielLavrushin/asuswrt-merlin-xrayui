jest.mock('axios', () => ({ get: jest.fn() }));

import axios from 'axios';
import engine from '@modules/Engine';

const get = axios.get as jest.Mock;
const failWith = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status, response: { status } });

describe('Engine.getWebData', () => {
  beforeEach(() => get.mockReset());

  it('reads the login-protected raw copy without a query string', async () => {
    get.mockResolvedValueOnce({ data: { log: {} } });

    const response = await engine.getWebData('xray-config');

    expect(response.data).toEqual({ log: {} });
    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][0]).toBe('/ext/xrayui/xray-config.cab');
    expect(get.mock.calls[0][1].headers).toMatchObject({ 'Cache-Control': 'no-cache', Pragma: 'no-cache', Expires: '0' });
  });

  it('falls back to the .json name when the raw copy does not exist yet', async () => {
    get.mockRejectedValueOnce(failWith(404)).mockResolvedValueOnce({ data: { vless: [] } });

    const response = await engine.getWebData('subscriptions');

    expect(response.data).toEqual({ vless: [] });
    expect(get.mock.calls.map((call) => call[0])).toEqual(['/ext/xrayui/subscriptions.cab', expect.stringMatching(/^\/ext\/xrayui\/subscriptions\.json\?_=\d+$/)]);
  });

  it('keeps the not found error when neither name exists', async () => {
    get.mockRejectedValueOnce(failWith(404)).mockRejectedValueOnce(failWith(404));

    await expect(engine.getWebData('xray-config')).rejects.toMatchObject({ status: 404, response: { status: 404 } });
  });

  it('does not retry other errors', async () => {
    get.mockRejectedValueOnce(failWith(500));

    await expect(engine.getWebData('xray-ui-response')).rejects.toMatchObject({ status: 500 });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('passes the request options through', async () => {
    get.mockResolvedValueOnce({ data: '12:00:00.000,UDP,a:1,b:2,example.com' });

    await engine.getWebData('b4sni', { responseType: 'text', headers: { 'X-Test': '1' } });

    expect(get.mock.calls[0][1]).toMatchObject({ responseType: 'text', headers: { 'Cache-Control': 'no-cache', 'X-Test': '1' } });
  });
});

describe('Engine.openText', () => {
  const tab = { location: { href: '' }, close: jest.fn() };
  let blobs: Blob[];

  beforeEach(() => {
    jest.useFakeTimers();
    blobs = [];
    tab.location.href = '';
    tab.close.mockReset();
    jest.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    URL.createObjectURL = jest.fn((blob: Blob) => {
      blobs.push(blob);
      return 'blob:xrayui/1';
    });
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('opens the text in a new tab as plain text', async () => {
    engine.openText('<% x %> <script>alert(1)</script>');
    await Promise.resolve();
    await Promise.resolve();

    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(tab.location.href).toBe('blob:xrayui/1');
    expect(blobs[0].type).toBe('text/plain;charset=utf-8');
    jest.advanceTimersByTime(600000);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    jest.useRealTimers();
    const content = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(blobs[0]);
    });
    expect(content).toBe('<% x %> <script>alert(1)</script>');
  });

  it('opens the tab first and fills it once the text has loaded', async () => {
    let finish: (value: string) => void = () => undefined;
    engine.openText(new Promise<string>((resolve) => (finish = resolve)), 'application/json;charset=utf-8');

    expect(window.open).toHaveBeenCalledTimes(1);
    expect(tab.location.href).toBe('');
    finish('{"log":{}}');
    await Promise.resolve();
    await Promise.resolve();

    expect(tab.location.href).toBe('blob:xrayui/1');
    expect(blobs[0].type).toBe('application/json;charset=utf-8');
  });

  it('closes the tab when the text cannot be loaded', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    engine.openText(Promise.reject(new Error('offline')));
    await Promise.resolve();
    await Promise.resolve();

    expect(tab.close).toHaveBeenCalled();
    expect(tab.location.href).toBe('');
  });
});
