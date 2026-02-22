/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/prefer-literal-enum-member */
export const XrayOptions = {
  transportOptions: ['tcp', 'kcp', 'ws', 'xhttp', 'grpc', 'httpupgrade', 'splithttp', 'hysteria'],
  securityOptions: ['none', 'tls', 'reality'],
  logOptions: ['debug', 'info', 'warning', 'error', 'none'],
  networkOptions: ['tcp', 'udp', 'tcp,udp'],
  protocolOptions: ['http', 'tls', 'bittorrent'],
  domainStrategyOptions: ['AsIs', 'IPIfNonMatch', 'IPOnDemand'],
  domainMatcherOptions: ['hybrid', 'linear'],
  usageOptions: ['encipherment', 'verify', 'issue'],
  alpnOptions: ['h3', 'h2', 'http/1.1'],
  fingerprintOptions: ['randomized', 'random', 'chrome', 'firefox', 'ios', 'android', 'safari', 'edge', '360', 'qq'],
  tlsVersionsOptions: ['1.0', '1.1', '1.2', '1.3'],
  echForceQueryOptions: ['none', 'half', 'full'],
  headerTypes: ['none', 'http', 'srtp', 'utp', 'wechat-video', 'dtls', 'wireguard'],
  httpMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT', 'PATCH'],
  xhttpPaddingPlacements: ['queryInHeader', 'cookie', 'header', 'query'],
  xhttpPaddingMethods: ['repeat-x', 'tokenish'],
  xhttpSessionPlacements: ['path', 'cookie', 'header', 'query'],
  xhttpUplinkDataPlacements: ['body', 'cookie', 'header'],
  clientFlowOptions: ['none', 'xtls-rprx-vision'],
  encryptionOptions: [
    // Recommended encryption methods
    '2022-blake3-aes-128-gcm',
    '2022-blake3-aes-256-gcm',
    '2022-blake3-chacha20-poly1305',
    // Other encryption methods
    'aes-256-gcm',
    'aes-128-gcm',
    'chacha20-poly1305',
    'chacha20-ietf-poly1305',
    'xchacha20-poly1305',
    'xchacha20-ietf-poly1305',
    'none',
    'plain'
  ]
};

export const XrayProtocol = {
  VLESS: 'vless',
  VMESS: 'vmess',
  SHADOWSOCKS: 'shadowsocks',
  TROJAN: 'trojan',
  WIREGUARD: 'wireguard',
  SOCKS: 'socks',
  HTTP: 'http',
  DNS: 'dns',
  DOKODEMODOOR: 'dokodemo-door',
  FREEDOM: 'freedom',
  BLACKHOLE: 'blackhole',
  LOOPBACK: 'loopback',
  TUN: 'tun',
  HYSTERIA: 'hysteria'
};
export enum XrayProtocolMode {
  Inbound = 1 << 0,
  Outbound = 1 << 1,
  ServerMode = 1 << 2,
  ClientMode = 1 << 3,
  TwoWays = Inbound | Outbound,
  BothModes = ServerMode | ClientMode,
  All = TwoWays | BothModes
}

export default XrayOptions;
