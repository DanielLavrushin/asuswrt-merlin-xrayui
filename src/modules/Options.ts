class XrayOptions {
  static transportOptions: string[] = ["tcp", "kcp", "ws", "http", "grpc", "httpupgrade", "splithttp"];
  static securityOptions: string[] = ["none", "tls", "reality"];
  static logOptions: string[] = ["debug", "info", "warning", "error", "none"];
  static networkOptions: string[] = ["tcp", "udp", "tcp,udp"];
  static protocolOptions: string[] = ["http", "tls", "bittorrent"];
  static domainStrategyOptions: string[] = ["AsIs", "IPIfNonMatch", "IPOnDemand"];
  static domainMatcherOptions: string[] = ["hybrid", "linear"];
  static usageOptions: string[] = ["encipherment", "verify", "issue"];
  static alpnOptions: string[] = ["h2", "http/1.1"];
  static fingerprintOptions: string[] = ["randomized", "random", "chrome", "firefox", "ios", "android", "safari", "edge", "360", "qq"];
  static tlsVersionsOptions: string[] = ["1.0", "1.1", "1.2", "1.3"];
  static headerTypes: string[] = ["none", "http", "srtp", "utp", "wechat-video", "dtls", "wireguard"];
  static httpMethods: string[] = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "TRACE", "CONNECT", "PATCH"];
  static clientFlowOptions: string[] = ["none", "xtls-rprx-vision"];
  static encryptionOptions: string[] = ["none", "plain", "aes-128-gcm", "aes-256-gcm", "2022-blake3-aes-128-gcm", "2022-blake3-aes-256-gcm", "2022-blake3-chacha20-poly1305"];
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
