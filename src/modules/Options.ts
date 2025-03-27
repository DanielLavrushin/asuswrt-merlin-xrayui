/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/prefer-literal-enum-member */
const XrayOptions = {
  transportOptions: ['tcp', 'kcp', 'ws', 'xhttp', 'grpc', 'httpupgrade', 'splithttp'],
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
  headerTypes: ['none', 'http', 'srtp', 'utp', 'wechat-video', 'dtls', 'wireguard'],
  httpMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT', 'PATCH'],
  clientFlowOptions: ['none', 'xtls-rprx-vision'],
  encryptionOptions: ['none', 'plain', 'aes-128-gcm', 'aes-256-gcm', 'chacha20-ietf-poly1305', '2022-blake3-aes-128-gcm', '2022-blake3-aes-256-gcm', '2022-blake3-chacha20-poly1305']
};

const XrayProtocol = {
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
  LOOPBACK: 'loopback'
};
enum XrayProtocolMode {
  Inbound = 1 << 0,
  Outbound = 1 << 1,
  ServerMode = 1 << 2,
  ClientMode = 1 << 3,
  TwoWays = Inbound | Outbound,
  BothModes = ServerMode | ClientMode,
  All = TwoWays | BothModes
}

export default XrayOptions;
export { XrayOptions, XrayProtocol, XrayProtocolMode };
