import { GetXrayConfig } from '@/../tests/FakesLoader';

const mainConfig = GetXrayConfig('main.json');
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: mainConfig }))
}));

import engine, { SubmitActions } from '@modules/Engine';
import { XrayProtocol } from './Options';
import { XrayDokodemoDoorInboundObject, XrayInboundObject } from './InboundObjects';
import { XrayUiCustomSettings, XrayUiGlobal } from '@/global';
describe('XrayConfig', () => {
  let xrayConfig: Awaited<ReturnType<typeof engine.loadXrayConfig>>;
  beforeAll(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {
      /* no-op */
    });

    jest.useFakeTimers();

    xrayConfig = await engine.loadXrayConfig();

    window.xray = {
      custom_settings: {} as XrayUiCustomSettings
    } as XrayUiGlobal;
  });
  describe('loadXrayConfig', () => {
    it('should load the Xray configuration', async () => {
      expect(xrayConfig).toBeDefined();
      expect(xrayConfig?.inbounds).toBeDefined();
      expect(xrayConfig?.outbounds).toBeDefined();
      expect(xrayConfig?.routing).toBeDefined();

      expect(xrayConfig?.inbounds.length).toBe(3);

      const firstInbound = xrayConfig?.inbounds[0]!;
      expect(firstInbound.port).toBe(5599);
      expect(firstInbound.protocol).toBe(XrayProtocol.DOKODEMODOOR);
      expect(firstInbound).toBeInstanceOf(XrayInboundObject<XrayDokodemoDoorInboundObject>);
      expect(firstInbound.settings).toBeInstanceOf(XrayDokodemoDoorInboundObject);
    });
  });

  describe('submit()', () => {
    it('should submit the Xray configuration', async () => {
      const submitSpy = jest.spyOn(HTMLFormElement.prototype, 'submit');
      const appendSpy = jest.spyOn(document.body, 'appendChild');
      const removeSpy = jest.spyOn(document.body, 'removeChild');

      const cfg = engine.prepareServerConfig(xrayConfig!);
      const promise = engine.submit(SubmitActions.configurationApply, cfg);
      const iframe = document.querySelector('iframe[name^="hidden_frame_"]')!;

      expect(iframe).toBeTruthy();
      iframe.dispatchEvent(new Event('load'));

      jest.runAllTimers();

      await expect(promise).resolves.toBeUndefined();

      expect(submitSpy).toHaveBeenCalledTimes(1);

      const [firstAppend, secondAppend] = appendSpy.mock.calls.map((args) => args[0]);
      expect((firstAppend as Element).tagName).toBe('IFRAME');
      expect((secondAppend as Element).tagName).toBe('FORM');

      const form = secondAppend as HTMLFormElement;
      expect(form.method).toBe('post');
      expect(form.action).toMatch(/\/start_apply\.htm$/);
      expect(form.target).toMatch(/^hidden_frame_/);

      const hiddenInputs = Array.from(form.querySelectorAll('input[type="hidden"]'));
      expect(hiddenInputs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'action_mode', value: 'apply' }),
          expect.objectContaining({ name: 'action_script', value: SubmitActions.configurationApply }),
          expect.objectContaining({ name: 'modified', value: '0' }),
          expect.objectContaining({ name: 'action_wait', value: '' })
        ])
      );

      expect(removeSpy).toHaveBeenCalledTimes(2);
      expect(removeSpy.mock.calls.map((args) => (args[0] as HTMLElement).tagName)).toEqual(['FORM', 'IFRAME']);
    });
  });
});
