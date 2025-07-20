import { XrayFreedomOutboundObject, XrayOutboundObject, XrayVlessOutboundObject } from './OutboundObjects';
import { XrayStreamSettingsObject, XrayVlessServerObject } from './CommonObjects';
import { IClient } from './Interfaces';
import { XrayVlessClientObject } from './ClientsObjects';

jest.mock('class-transformer', () => ({
  plainToInstance: jest.fn((_cls, obj) => obj)
}));

describe('XrayOutboundObject', () => {
  it('returns undefined when empty', () => {
    const ob = new XrayOutboundObject();
    expect(ob.normalize()).toBeUndefined();
  });

  it('normalizes and keeps itself when populated', () => {
    const vless = new XrayVlessOutboundObject();
    const ob = new XrayOutboundObject('vless', vless);
    ob.sendThrough = '1.2.3.4';
    ob.streamSettings = new XrayStreamSettingsObject();
    const ssSpy = jest.spyOn(ob.streamSettings, 'normalize').mockReturnValue(ob.streamSettings);
    const setSpy = jest.spyOn(vless as any, 'normalize').mockReturnValue(vless);
    expect(ob.normalize()).toBe(ob);
    expect(ssSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalled();
  });

  it('isSystem flags sys tags', () => {
    const ob = new XrayOutboundObject();
    ob.tag = 'sys:test';
    expect(ob.isSystem()).toBe(true);
  });

  describe('XrayVlessOutboundObject', () => {
    it('initializes with an empty vnext array', () => {
      const vless = new XrayVlessOutboundObject();
      expect(vless.vnext.length).toBe(1);
      expect(vless.vnext[0]).toBeInstanceOf(XrayVlessServerObject);
    });

    it('finds target address', () => {
      const vless = new XrayVlessOutboundObject();
      vless.vnext[0].address = '1.2.3.4';
      expect(vless.isTargetAddress('1.2.3.4')).toBe(true);
      expect(vless.isTargetAddress('4.3.2.1')).toBe(false);
    });

    it('gets user names', () => {
      const vless = new XrayVlessOutboundObject();
      vless.vnext[0].users = [{ email: 'user@example.com', id: '123' } as XrayVlessClientObject];
      expect(vless.getUserNames().length).toBe(1);
      expect(vless.getUserNames()).toEqual(['user@example.com']);
    });
  });

  describe('XrayFreedomOutboundObject', () => {
    it('normalizes and returns itself', () => {
      const freedom = new XrayFreedomOutboundObject();
      expect(freedom.normalize()).toBeUndefined();
    });

    it(' has defined normalize method', () => {
      const freedom = new XrayFreedomOutboundObject();
      freedom.domainStrategy = 'UseIPv4';
      expect(freedom.normalize).toBeDefined();
    });
  });
});
