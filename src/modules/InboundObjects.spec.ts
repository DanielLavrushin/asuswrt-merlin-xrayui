import {
  XrayInboundObject,
  XrayDokodemoDoorInboundObject,
  XrayVlessInboundObject,
  XrayHttpInboundObject,
  XrayShadowsocksInboundObject,
  XraySocksInboundObject,
  XrayWireguardInboundObject,
  XrayTrojanInboundObject,
  XrayVmessInboundObject
} from './InboundObjects';
import { XrayStreamSettingsObject } from './CommonObjects';
import { XrayVlessClientObject, XrayVmessClientObject, XrayHttpClientObject, XrayShadowsocksClientObject, XrayTrojanClientObject, XraySocksClientObject } from './ClientsObjects';

jest.mock('class-transformer', () => ({
  plainToInstance: jest.fn((_cls, obj) => obj)
}));

describe('InboundObjects', () => {
  describe('XrayInboundObject', () => {
    it('returns undefined when empty', () => {
      const inbound = new XrayInboundObject();
      (inbound.streamSettings as XrayStreamSettingsObject).normalize = jest.fn(() => undefined);
      expect(inbound.normalize()).toBeUndefined();
    });

    it('keeps itself when protocol, port set', () => {
      const inbound = new XrayInboundObject('vless', new XrayVlessInboundObject());
      inbound.port = 8080;
      (inbound.streamSettings as XrayStreamSettingsObject).normalize = jest.fn(() => undefined);
      expect(inbound.normalize()).toBe(inbound);
      expect(inbound.tag).toBe('ibd-vless');
    });

    it('detects system tag', () => {
      const inbound = new XrayInboundObject();
      inbound.tag = 'sys:health';
      expect(inbound.isSystem()).toBe(true);
    });
  });

  describe('XrayDokodemoDoorInboundObject', () => {
    it('normalizes defaults away', () => {
      const doko = new XrayDokodemoDoorInboundObject();
      const res = doko.normalize();
      expect(res).toBeUndefined();
    });

    it('retains custom props', () => {
      const doko = new XrayDokodemoDoorInboundObject();
      doko.network = 'udp';
      doko.port = 123;
      doko.userLevel = 1;
      const res = doko.normalize();
      expect(res?.network).toBe('udp');
      expect(res?.port).toBe(123);
      expect(res?.userLevel).toBe(1);
    });
  });

  describe('XrayHttpInboundObject', () => {
    it('undefined when transparent false', () => {
      const http = new XrayHttpInboundObject();
      expect(http.normalize()).toBeUndefined();
    });

    it('kept when transparent true', () => {
      const http = new XrayHttpInboundObject();
      http.allowTransparent = true;
      expect(http.normalize()).toBe(http);
    });
  });

  describe('XrayShadowsocksInboundObject', () => {
    it('strips defaults', () => {
      const ss = new XrayShadowsocksInboundObject();
      expect(ss.normalize()).toBeUndefined();
    });

    it('keeps non‑default network/password', () => {
      const ss = new XrayShadowsocksInboundObject();
      ss.network = 'udp';
      ss.password = 'secret';
      expect(ss.normalize()).toBe(ss);
    });
  });

  describe('XraySocksInboundObject', () => {
    it('returns undefined with defaults', () => {
      const socks = new XraySocksInboundObject();
      expect(socks.normalize()).toBeUndefined();
    });

    it('kept when ip, udp, accounts set', () => {
      const socks = new XraySocksInboundObject();
      socks.ip = '10.0.0.1';
      socks.udp = true;
      socks.auth = 'password';
      socks.accounts = [{ user: 'bob' } as any];
      expect(socks.normalize()).toBe(socks);
    });
  });

  describe('XrayTrojanInboundObject', () => {
    it('normalize is pass‑through', () => {
      const trojan = new XrayTrojanInboundObject();
      expect(trojan.normalize()).toBe(trojan);
    });
  });

  describe('XrayWireguardInboundObject', () => {
    it('normalize is pass‑through', () => {
      const wireguard = new XrayWireguardInboundObject();
      expect(wireguard.normalize()).toBe(wireguard);
    });
  });

  describe('getUserNames suites', () => {
    it('VLESS returns client emails', () => {
      const ib = new XrayVlessInboundObject();
      ib.clients = [{ email: 'alice@ex.com' } as XrayVlessClientObject, { email: 'bob@ex.com' } as XrayVlessClientObject];
      expect(ib.getUserNames()).toEqual(['alice@ex.com', 'bob@ex.com']);
    });

    it('VMess returns client emails', () => {
      const ib = new XrayVmessInboundObject();
      ib.clients = [{ email: 'carol@ex.com' } as XrayVmessClientObject];
      expect(ib.getUserNames()).toEqual(['carol@ex.com']);
    });

    it('HTTP returns client users', () => {
      const ib = new XrayHttpInboundObject();
      ib.clients = [{ user: 'dan' } as XrayHttpClientObject, { user: 'eve' } as XrayHttpClientObject];
      expect(ib.getUserNames()).toEqual(['dan', 'eve']);
    });

    it('Shadowsocks returns client emails', () => {
      const ib = new XrayShadowsocksInboundObject();
      ib.clients = [{ email: 'frank@ex.com' } as XrayShadowsocksClientObject];
      expect(ib.getUserNames()).toEqual(['frank@ex.com']);
    });

    it('Trojan returns client emails', () => {
      const ib = new XrayTrojanInboundObject();
      ib.clients = [{ email: 'grace@ex.com' } as XrayTrojanClientObject];
      expect(ib.getUserNames()).toEqual(['grace@ex.com']);
    });

    it('SOCKS handles empty and populated accounts', () => {
      const ib = new XraySocksInboundObject();
      expect(ib.getUserNames()).toEqual([]);
      ib.accounts = [{ user: 'heidi' } as XraySocksClientObject];
      expect(ib.getUserNames()).toEqual(['heidi']);
    });
  });
});
