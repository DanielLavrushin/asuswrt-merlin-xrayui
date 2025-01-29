/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/prefer-literal-enum-member */
namespace XrayOptions {
  export const transportOptions = ["tcp", "kcp", "ws", "xhttp", "grpc", "httpupgrade", "splithttp"];
  export const securityOptions = ["none", "tls", "reality"];
  export const logOptions = ["debug", "info", "warning", "error", "none"];
  export const networkOptions = ["tcp", "udp", "tcp,udp"];
  export const protocolOptions = ["http", "tls", "bittorrent"];
  export const domainStrategyOptions = ["AsIs", "IPIfNonMatch", "IPOnDemand"];
  export const domainMatcherOptions = ["hybrid", "linear"];
  export const usageOptions = ["encipherment", "verify", "issue"];
  export const alpnOptions = ["h2", "http/1.1"];
  export const fingerprintOptions = ["randomized", "random", "chrome", "firefox", "ios", "android", "safari", "edge", "360", "qq"];
  export const tlsVersionsOptions = ["1.0", "1.1", "1.2", "1.3"];
  export const headerTypes = ["none", "http", "srtp", "utp", "wechat-video", "dtls", "wireguard"];
  export const httpMethods = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "TRACE", "CONNECT", "PATCH"];
  export const clientFlowOptions = ["none", "xtls-rprx-vision"];
  export const encryptionOptions = ["none", "plain", "aes-128-gcm", "aes-256-gcm", "2022-blake3-aes-128-gcm", "2022-blake3-aes-256-gcm", "2022-blake3-chacha20-poly1305"];
}

enum XrayProtocol {
  VLESS = "vless",
  VMESS = "vmess",
  SHADOWSOCKS = "shadowsocks",
  TROJAN = "trojan",
  WIREGUARD = "wireguard",
  SOCKS = "socks",
  HTTP = "http",
  DNS = "dns",
  DOKODEMODOOR = "dokodemo-door",
  FREEDOM = "freedom",
  BLACKHOLE = "blackhole",
  LOOPBACK = "loopback"
}
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
