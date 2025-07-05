import { GetXrayConfig } from '@/../tests/FakesLoader';

const mainConfig = GetXrayConfig('main.json');
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: mainConfig }))
}));

import engine from '@modules/Engine';
import { XrayProtocol } from './Options';
import { XrayDokodemoDoorInboundObject, XrayInboundObject } from './InboundObjects';
describe('XrayConfig', () => {
  let xrayConfig: Awaited<ReturnType<typeof engine.loadXrayConfig>>;
  beforeAll(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    xrayConfig = await engine.loadXrayConfig();
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
});
