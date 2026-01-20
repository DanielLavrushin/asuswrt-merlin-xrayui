import {
  XrayAllocateObject,
  XrayDnsObject,
  XrayDnsServerObject,
  XrayLogObject,
  XrayParsedUrlObject,
  XrayReverseItem,
  XrayReverseObject,
  XrayRoutingObject,
  XrayRoutingPolicy,
  XrayRoutingRuleObject,
  XraySniffingObject,
  XraySockoptObject,
  XrayStreamRealitySettingsObject,
  XrayStreamSettingsObject,
  XrayStreamTlsCertificateObject,
  XrayStreamTlsSettingsObject,
  XrayXmuxObject
} from './CommonObjects';
import { XrayStreamWsSettingsObject, XrayStreamTcpSettingsObject } from './TransportObjects';

describe('CommonObjects', () => {
  describe('XraySniffingObject', () => {
    it('normalizes defaults away', () => {
      const sniffing = new XraySniffingObject();
      const res = sniffing.normalize();
      expect(res).toBeUndefined();
    });

    it('retains custom props', () => {
      const sniffing = new XraySniffingObject();
      sniffing.enabled = true;
      sniffing.metadataOnly = true;
      sniffing.routeOnly = true;
      sniffing.destOverride = ['http'];
      const res = sniffing.normalize();
      expect(res?.enabled).toBe(true);
      expect(res?.destOverride).toEqual(['http']);
    });
  });

  describe('XrayXmuxObject', () => {
    it('normalizes defaults away', () => {
      const xmux = new XrayXmuxObject();
      const res = xmux.normalize();
      expect(res).toBeUndefined();
    });

    it('retains custom props', () => {
      const xmux = new XrayXmuxObject();
      xmux.maxConcurrency = '10-40';
      xmux.maxConnections = 10;
      const res = xmux.normalize();

      expect(res).toBeDefined();
      expect(res?.maxConcurrency).toBe('10-40');
      expect(res?.maxConnections).toBe(10);
    });
  });

  describe('XrayAllocateObject', () => {
    it('normalizes defaults away', () => {
      const allocate = new XrayAllocateObject();
      const res = allocate.normalize();
      expect(res).toBeUndefined();
    });

    it('retains custom props', () => {
      const allocate = new XrayAllocateObject();
      allocate.strategy = 'random';
      allocate.concurrency = 5;
      allocate.refresh = 10;
      const res = allocate.normalize();
      expect(res?.concurrency).toBe(5);
      expect(res?.refresh).toBe(10);
    });
  });

  describe('XrayStreamTlsCertificateObject', () => {
    it('normalizes defaults away', () => {
      const cert = new XrayStreamTlsCertificateObject();
      const res = cert.normalize();
      expect(res).toBeUndefined();
    });

    it('retains custom props', () => {
      const cert = new XrayStreamTlsCertificateObject();
      cert.keyFile = 'key.pem';
      cert.certificateFile = 'cert.pem';
      cert.certificate = 'cert content';
      const res = cert.normalize();

      expect(res).toBeDefined();
      expect(res?.keyFile).toBe('key.pem');
      expect(res?.certificateFile).toBe('cert.pem');
      expect(res?.certificate).toBe('cert content');
    });
  });

  describe('XrayStreamTlsSettingsObject', () => {
    it('retains custom props', () => {
      const tls = new XrayStreamTlsSettingsObject();
      tls.serverName = 'example.com';
      tls.allowInsecure = true;

      tls.certificates = [new XrayStreamTlsCertificateObject(), new XrayStreamTlsCertificateObject()];
      tls.certificates[0].keyFile = 'key1.pem';

      const res = tls.normalize();

      expect(res).toBeDefined();
      expect(res?.serverName).toBe('example.com');
      expect(res?.allowInsecure).toBe(true);
      expect(res?.certificates).toHaveLength(1);
    });
  });

  describe('XrayRoutingObject', () => {
    let routing: XrayRoutingObject;

    beforeEach(() => {
      routing = new XrayRoutingObject();
    });

    it('normalizes default fields away', () => {
      routing.normalize();
      expect(routing.domainStrategy).toBeUndefined();
      expect(routing.domainMatcher).toBeUndefined();
      expect(routing.rules).toBeUndefined();
    });

    it('create_rule populates expected properties', () => {
      const rule = routing.create_rule('rule‑one', 'proxy', 'tcp', ['domain:test.com'], ['1.1.1.1'], '80');
      expect(rule.name).toBe('rule‑one');
      expect(rule.outboundTag).toBe('proxy');
      expect(rule.network).toBe('tcp');
      expect(rule.domain).toEqual(['domain:test.com']);
      expect(rule.ip).toEqual(['1.1.1.1']);
      expect(rule.port).toBe('80');
    });

    it('default() without unblock items adds myip rule', () => {
      routing.default('proxy');
      expect(routing.rules?.[0].domain).toEqual(['domain:myip.com']);
    });

    it('default() with "discord" adds extra rules', () => {
      routing.default('proxy', ['discord']);
      const names = routing.rules?.map((r) => r.name);
      expect(names).toContain('discord to proxy');
      expect(routing.rules?.some((r) => r.port === '50000-50100,6463-6472')).toBe(true);
    });

    it('normalize filters empty system rules and sorts by idx', () => {
      const sysRule = routing.create_rule('sys:metrics', 'proxy');
      sysRule.domain = [];
      sysRule.idx = 5;
      const userRule = routing.create_rule('user', 'proxy');
      userRule.idx = 2;
      routing.rules = [sysRule, userRule];
      routing.normalize();
      expect(routing.rules).toEqual([userRule]);
    });

    it('normalize sorts disabled_rules by idx', () => {
      const dr1 = routing.create_rule('d1', 'proxy');
      dr1.idx = 3;
      const dr2 = routing.create_rule('d2', 'proxy');
      dr2.idx = 1;
      routing.disabled_rules = [dr1, dr2];
      routing.normalize();
      expect(routing.disabled_rules?.map((r) => r.idx)).toEqual([1, 3]);
    });

    it('normalize calls policy.normalize for each policy', () => {
      const policy = new XrayRoutingPolicy();
      const spy = jest.spyOn(policy, 'normalize');
      routing.policies = [policy];
      routing.normalize();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('XrayParsedUrlObject', () => {
    it('parses a vless URL', () => {
      const url = 'vless://11111111-1111-1111-1111-111111111111@host.example.com:443?type=ws&path=%2Fchat&host=host.example.com&security=tls#mytag';
      const p = new XrayParsedUrlObject(url);
      expect(p.protocol).toBe('vless');
      expect(p.server).toBe('host.example.com');
      expect(p.port).toBe(443);
      expect(p.uuid).toBe('11111111-1111-1111-1111-111111111111');
      expect(p.tag).toBe('mytag');
      expect(p.network).toBe('ws');
      expect(p.security).toBe('tls');
      expect(p.parsedParams.type).toBe('ws');
      expect(p.parsedParams.security).toBe('tls');
    });

    it('parses a vmess base64 URL', () => {
      const vmessJson = {
        add: 'example.com',
        port: '8443',
        id: '22222222-2222-2222-2222-222222222222',
        ps: 'cool-proxy',
        net: 'grpc',
        tls: 'tls'
      };
      const vmessUrl = 'vmess://' + Buffer.from(JSON.stringify(vmessJson)).toString('base64');
      const p = new XrayParsedUrlObject(vmessUrl);
      expect(p.protocol).toBe('vmess');
      expect(p.server).toBe('example.com');
      expect(p.port).toBe(8443);
      expect(p.uuid).toBe(vmessJson.id);
      expect(p.tag).toBe('cool-proxy');
      expect(p.network).toBe('grpc');
      expect(p.security).toBe('tls');
      expect(p.parsedParams).toEqual(expect.objectContaining(vmessJson));
    });

    it('parses an ss URL with embedded creds', () => {
      const method = 'aes-128-gcm';
      const pass = 'hunter2';
      const creds = Buffer.from(`${method}:${pass}`).toString('base64');
      const url = `ss://${creds}@shadow.example:8388?type=quic&security=none#mytag`;
      const p = new XrayParsedUrlObject(url);
      expect(p.protocol).toBe('ss');
      expect(p.server).toBe('shadow.example');
      expect(p.port).toBe(8388);
      expect(p.uuid).toBe(creds);
      expect(p.tag).toBe('mytag');
      expect(p.network).toBe('quic');
      expect(p.security).toBe('none');
      expect(p.parsedParams.method).toBe(method);
      expect(p.parsedParams.pass).toBe(pass);
    });

    it('parses a Shadowsocks 2022 URL with plain-text format', () => {
      const method = '2022-blake3-aes-256-gcm';
      const serverPsk = 'abc123serverkey==';
      const userPsk = 'xyz789userkey==';
      const combinedPass = `${serverPsk}:${userPsk}`;
      const encodedMethod = encodeURIComponent(method);
      const encodedPass = encodeURIComponent(combinedPass);
      const url = `ss://${encodedMethod}:${encodedPass}@shadow.example:8388#SS2022`;
      const p = new XrayParsedUrlObject(url);
      expect(p.protocol).toBe('ss');
      expect(p.server).toBe('shadow.example');
      expect(p.port).toBe(8388);
      expect(p.tag).toBe('SS2022');
      expect(p.parsedParams.method).toBe(method);
      expect(p.parsedParams.pass).toBe(combinedPass);
    });

    it('parses a Shadowsocks 2022 URL with single PSK', () => {
      const method = '2022-blake3-aes-128-gcm';
      const pass = 'singlePskKey123==';
      const url = `ss://${encodeURIComponent(method)}:${encodeURIComponent(pass)}@example.com:443#SinglePSK`;
      const p = new XrayParsedUrlObject(url);
      expect(p.protocol).toBe('ss');
      expect(p.server).toBe('example.com');
      expect(p.port).toBe(443);
      expect(p.parsedParams.method).toBe(method);
      expect(p.parsedParams.pass).toBe(pass);
    });
  });

  describe('XrayStreamSettingsObject', () => {
    it('returns undefined when only defaults present', () => {
      const s = new XrayStreamSettingsObject();
      expect(s.normalize()).toBeUndefined();
    });

    it('retains only ws‑related settings when network is ws', () => {
      const s = new XrayStreamSettingsObject();
      s.network = 'ws';
      s.wsSettings = new XrayStreamWsSettingsObject();
      s.wsSettings.path = '/chat';
      s.tcpSettings = new XrayStreamTcpSettingsObject();
      expect(s.normalize()).toBe(s);
      expect(s.network).toBe('ws');
      expect(s.wsSettings?.path).toBe('/chat');
      expect(s.tcpSettings).toBeUndefined();
    });

    it('retains only tls‑related settings when security is tls', () => {
      const s = new XrayStreamSettingsObject();
      s.security = 'tls';
      s.tlsSettings = new XrayStreamTlsSettingsObject();
      s.tlsSettings.serverName = 'example.com';
      s.wsSettings = new XrayStreamWsSettingsObject();
      expect(s.normalize()).toBe(s);
      expect(s.security).toBe('tls');
      expect(s.tlsSettings?.serverName).toBe('example.com');
      expect(s.wsSettings).toBeUndefined();
      expect(s.network).toBeUndefined();
    });

    it('drops sockopt when it normalizes to undefined', () => {
      const s = new XrayStreamSettingsObject();
      s.sockopt = new XraySockoptObject();
      s.sockopt.tproxy = 'off';
      expect(s.normalize()).toBeUndefined();
    });
  });

  describe('XraySockoptObject', () => {
    it('returnerer undefined when tproxy is "off"', () => {
      const so = new XraySockoptObject();
      so.tproxy = 'off';
      expect(so.normalize()).toBeUndefined();
    });

    it('strips standard (standard) and zero values', () => {
      const so = new XraySockoptObject();
      so.tproxy = 'redirect';
      so.domainStrategy = 'AsIs';
      so.mark = 0;
      so.interface = '';
      so.tcpMptcp = false;
      so.tcpNoDelay = false;
      so.normalize();
      expect(so.tproxy).toBe('redirect');
      expect(so.domainStrategy).toBeUndefined();
      expect(so.mark).toBeUndefined();
      expect(so.interface).toBeUndefined();
      expect(so.tcpMptcp).toBeUndefined();
      expect(so.tcpNoDelay).toBeUndefined();
    });

    it('beholder non‑default values efter normalize', () => {
      const so = new XraySockoptObject();
      so.tproxy = 'tproxy';
      so.domainStrategy = 'UseIPv6';
      so.mark = 100;
      so.tcpMptcp = true;
      const res = so.normalize();
      expect(res).toBe(so);
      expect(so.tproxy).toBe('tproxy');
      expect(so.domainStrategy).toBe('UseIPv6');
      expect(so.mark).toBe(100);
      expect(so.tcpMptcp).toBe(true);
    });
  });

  describe('XrayRoutingPolicy', () => {
    it('normalize returns undefined when redirect without ports', () => {
      const p = new XrayRoutingPolicy();
      p.mode = 'redirect';
      p.tcp = '';
      p.udp = '';
      expect(p.normalize()).toBeUndefined();
    });

    it('normalizePorts cleans messy (rodet) strings', () => {
      const p = new XrayRoutingPolicy();
      const dirty = ' 80 \n443-444 , abc ,22 ';
      expect(p.normalizePorts(dirty)).toBe('80,443:444,22');
    });

    it('normalize keeps non‑default fields', () => {
      const p = new XrayRoutingPolicy();
      p.mode = 'bypass';
      p.tcp = '8080';
      p.udp = '53';
      const res = p.normalize();
      expect(res).toBe(p);
      expect(p.mode).toBe('bypass');
      expect(p.tcp).toBe('8080');
      expect(p.udp).toBe('53');
    });

    it('default sets sensible (fornuftige) values', () => {
      const p = new XrayRoutingPolicy();
      p.default();
      expect(p.mode).toBe('bypass');
      expect(p.name).toMatch(/bypass/i);
      expect(p.tcp).toBe('443,80,22');
      expect(p.udp).toBe('443,22');
    });
  });

  describe('XrayReverseObject', () => {
    it('returns undefined when both lists empty', () => {
      const rev = new XrayReverseObject();
      expect(rev.normalize()).toBeUndefined();
    });

    it('filters invalid entries and keeps good ones', () => {
      const rev = new XrayReverseObject();
      rev.bridges = [
        { tag: 'b1', domain: 'd1' },
        { tag: '', domain: 'd2' }
      ] as XrayReverseItem[];
      rev.portals = [{ tag: 'p1', domain: 'd3' }, { tag: 'p2' }] as XrayReverseItem[];
      const res = rev.normalize();
      expect(res).toBe(rev);
      expect(rev.bridges?.length).toBe(1);
      expect(rev.portals?.length).toBe(1);
    });
  });

  describe('XrayDnsServerObject', () => {
    it('cleans empty arrays and swaps rules for idx list', () => {
      const rule = new XrayRoutingRuleObject();
      rule.idx = 7;
      const ds = new XrayDnsServerObject();
      ds.address = '1.1.1.1';
      ds.rules = [rule];
      ds.domains = [];
      ds.expectIPs = [];
      ds.clientIP = '';
      ds.normalize?.();
      expect(ds.rules).toEqual([7]);
      expect(ds.domains).toBeUndefined();
      expect(ds.expectIPs).toBeUndefined();
      expect(ds.clientIP).toBeUndefined();
    });
  });

  describe('XrayDnsObject', () => {
    it('default() forces queryStrategy UseIP', () => {
      const dns = new XrayDnsObject();
      dns.queryStrategy = 'UseIPv4';
      dns.default();
      expect(dns.queryStrategy).toBe('UseIP');
    });

    it('normalize drops empty hosts and servers, toggles flags', () => {
      const dns = new XrayDnsObject();
      dns.hosts = {};
      dns.disableCache = true;
      dns.disableFallbackIfMatch = false;
      dns.normalize();
      expect(dns.hosts).toBeUndefined();
      expect(dns.disableCache).toBe(true);
    });

    it('normalize keeps servers and runs inner normalize', () => {
      const spyServer = new XrayDnsServerObject();
      spyServer.address = '8.8.8.8';
      const spy = jest.spyOn(spyServer, 'normalize');
      const dns = new XrayDnsObject();
      dns.servers = ['1.1.1.1', spyServer];
      dns.normalize();
      expect(spy).toHaveBeenCalled();
      expect(dns.servers?.length).toBe(2);
    });
  });

  describe('XrayStreamRealitySettingsObject', () => {
    it('normalize is pass‑through with defaults', () => {
      const r = new XrayStreamRealitySettingsObject();
      expect(r.normalize()).toBe(r);
      expect(r.show).toBeUndefined();
    });

    it('constructor maps parsed params correctly', () => {
      const url = 'vless://00000000-0000-0000-0000-000000000000@xray.test:443?' + 'sid=abc123&fp=fprint&pbk=pubKey&spx=spider&sni=my.domain.com#tag';
      const parsed = new XrayParsedUrlObject(url);
      const r = new XrayStreamRealitySettingsObject(parsed);
      expect(r.shortId).toBe('abc123');
      expect(r.fingerprint).toBe('fprint');
      expect(r.publicKey).toBe('pubKey');
      expect(r.spiderX).toBe('spider');
      expect(r.serverName).toBe('my.domain.com');
      expect(r.normalize()).toBe(r);
    });
  });

  describe('XrayLogObject', () => {
    it('normalize strips default and empty values', () => {
      const log = new XrayLogObject();
      log.access = '';
      log.error = '';
      log.loglevel = 'none';
      log.dnsLog = false;
      log.maskAddress = '';
      log.normalize();
      expect(log.access).toBeUndefined();
      expect(log.error).toBeUndefined();
      expect(log.loglevel).toBeUndefined();
      expect(log.dnsLog).toBeUndefined();
      expect(log.maskAddress).toBeUndefined();
    });

    it('normalize preserves non‑default values', () => {
      const log = new XrayLogObject();
      log.access = '/var/log/access.log';
      log.error = '/var/log/error.log';
      log.loglevel = 'info';
      log.dnsLog = true;
      log.maskAddress = 'ipv4';
      const res = log.normalize();
      expect(res).toBe(log);
      expect(log.access).toBe('/var/log/access.log');
      expect(log.error).toBe('/var/log/error.log');
      expect(log.loglevel).toBe('info');
      expect(log.dnsLog).toBe(true);
      expect(log.maskAddress).toBe('ipv4');
    });
  });
});
