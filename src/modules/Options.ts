/* eslint-disable no-unused-vars */

class XrayOptions {
  static transportOptions = ["tcp", "kcp", "ws", "http", "grpc", "httpupgrade", "splithttp"];
  static securityOptions = ["none", "tls", "reality"];
  static logOptions = ["debug", "info", "warning", "error", "none"];
  static networkOptions = ["tcp", "udp", "tcp,udp"];
  static protocolOptions = ["http", "tls", "bittorrent"];
  static domainStrategyOptions = ["AsIs", "IPIfNonMatch", "IPOnDemand"];
  static domainMatcherOptions = ["hybrid", "linear"];
  static usageOptions = ["encipherment", "verify", "issue"];
  static alpnOptions = ["h2", "http/1.1"];
  static fingerprintOptions = ["randomized", "random", "chrome", "firefox", "ios", "android", "safari", "edge", "360", "qq"];
  static tlsVersionsOptions = ["1.0", "1.1", "1.2", "1.3"];
  static headerTypes = ["none", "http", "srtp", "utp", "wechat-video", "dtls", "wireguard"];
  static httpMethods = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "TRACE", "CONNECT", "PATCH"];
  static clientFlowOptions = ["none", "xtls-rprx-vision"];
  static encryptionOptions = ["none", "plain", "aes-128-gcm", "aes-256-gcm", "2022-blake3-aes-128-gcm", "2022-blake3-aes-256-gcm", "2022-blake3-chacha20-poly1305"];
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
