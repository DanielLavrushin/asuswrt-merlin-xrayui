import 'reflect-metadata';
import ProxyParser from './ProxyParser';
import parseJsonOutbound from './JsonOutboundParser';
import { IProtocolType } from '../Interfaces';
import { XrayOutboundObject } from '../OutboundObjects';
import { XrayStreamSettingsObject } from '../CommonObjects';

const save = (outbound: XrayOutboundObject<IProtocolType> | null) => {
  expect(outbound).not.toBeNull();
  return JSON.parse(JSON.stringify(outbound!.normalize()));
};

const vmessLink = (json: Record<string, unknown>) => 'vmess://' + btoa(JSON.stringify(json));

const rawHttpHeader = {
  type: 'http',
  request: { path: ['/SECRET_PATH'], headers: { Host: ['proxy.example.com'] } }
};

describe('ProxyParser transport fidelity', () => {
  describe('tcp + http header obfuscation (#417)', () => {
    const link =
      'vless://00000000-0000-0000-0000-000000000000@203.0.113.10:443?security=tls&sni=proxy.example.com&fp=chrome&alpn=http/1.1' +
      '&type=tcp&headerType=http&path=%2FSECRET_PATH&host=proxy.example.com&flow=xtls-rprx-vision&encryption=none#rawhttp-example';

    it('keeps tcpSettings.header through import and save', () => {
      const saved = save(new ProxyParser(link).getOutbound());
      expect(saved.streamSettings.network).toBeUndefined();
      expect(saved.streamSettings.security).toBe('tls');
      expect(saved.streamSettings.tcpSettings).toEqual({ header: rawHttpHeader });
    });

    it('treats type=raw as tcp', () => {
      const saved = save(new ProxyParser(link.replace('type=tcp', 'type=raw')).getOutbound());
      expect(saved.streamSettings.network).toBeUndefined();
      expect(saved.streamSettings.tcpSettings).toEqual({ header: rawHttpHeader });
    });

    it('splits comma separated hosts and defaults path to /', () => {
      const saved = save(new ProxyParser('trojan://pwd@1.2.3.4:443?security=tls&type=tcp&headerType=http&host=a.com,b.com#t').getOutbound());
      expect(saved.streamSettings.tcpSettings.header.request).toEqual({ path: ['/'], headers: { Host: ['a.com', 'b.com'] } });
    });

    it('parses the header from vmess links', () => {
      const url = vmessLink({ v: '2', ps: 'vm', add: '1.2.3.4', port: '443', id: 'uuid', net: 'tcp', type: 'http', host: 'proxy.example.com', path: '/SECRET_PATH', tls: 'tls' });
      expect(save(new ProxyParser(url).getOutbound()).streamSettings.tcpSettings).toEqual({ header: rawHttpHeader });
    });

    it('drops tcpSettings for plain tcp links', () => {
      const saved = save(new ProxyParser('vless://uuid@1.2.3.4:443?type=tcp&headerType=none&security=none#plain').getOutbound());
      expect(saved.streamSettings).toBeUndefined();
    });

    it('keeps the header on JSON import, including network raw / rawSettings', () => {
      const plain = {
        protocol: 'vless',
        tag: 'rawhttp-example',
        settings: { vnext: [{ address: '203.0.113.10', port: 443, users: [{ id: 'uuid', encryption: 'none' }] }] },
        streamSettings: { network: 'raw', security: 'none', rawSettings: { header: rawHttpHeader } }
      } as unknown as XrayOutboundObject<IProtocolType>;
      const saved = save(parseJsonOutbound(plain));
      expect(saved.streamSettings).toEqual({ tcpSettings: { header: rawHttpHeader } });
    });

    it('keeps tcpSettings when normalize runs twice', () => {
      const stream = new XrayStreamSettingsObject();
      stream.tcpSettings = new ProxyParser(link).getOutbound()!.streamSettings!.tcpSettings;
      stream.normalize();
      expect(stream.normalize()?.tcpSettings?.header).toEqual(rawHttpHeader);
    });
  });

  describe('grpc (#423)', () => {
    const link =
      'vless://xxx@example.com:12345?encryption=none&type=grpc&security=reality&serviceName=api&sni=xxx.com&fp=chrome&pbk=yyyyyyyyyy&sid=zzzzzz#test-host';

    it('keeps serviceName through import and save', () => {
      const saved = save(new ProxyParser(link).getOutbound());
      expect(saved.streamSettings.network).toBe('grpc');
      expect(saved.streamSettings.grpcSettings.serviceName).toBe('api');
      expect(saved.streamSettings.grpcSettings.multiMode).toBe(false);
      expect(saved.streamSettings.grpcSettings.authority).toBeUndefined();
    });

    it('reads authority and mode=multi', () => {
      const saved = save(new ProxyParser(link.replace('#', '&authority=grpc.example.com&mode=multi#')).getOutbound());
      expect(saved.streamSettings.grpcSettings).toMatchObject({ serviceName: 'api', authority: 'grpc.example.com', multiMode: true });
    });

    it('maps vmess path/type/host onto serviceName/mode/authority', () => {
      const url = vmessLink({ ps: 'vm', add: '1.2.3.4', port: 443, id: 'uuid', net: 'grpc', path: 'api', type: 'multi', host: 'grpc.example.com' });
      const saved = save(new ProxyParser(url).getOutbound());
      expect(saved.streamSettings.grpcSettings).toMatchObject({ serviceName: 'api', authority: 'grpc.example.com', multiMode: true });
    });
  });

  describe('httpupgrade', () => {
    it('keeps path and host', () => {
      const saved = save(new ProxyParser('vless://uuid@1.2.3.4:443?type=httpupgrade&path=%2Fup&host=h.example.com&security=tls#hu').getOutbound());
      expect(saved.streamSettings.httpupgradeSettings).toMatchObject({ path: '/up', host: 'h.example.com' });
    });
  });
});
