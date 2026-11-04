import { ref } from 'vue';
import vCompare from 'version-compare';
import vClean from 'version-clean';

const UNKNOWN_CORE = '0.0.0';
const coreVersion = ref(UNKNOWN_CORE);
// XRAYUI_TESTED_CORE from the backend: the core this release was tested with and fresh installs get
const testedCore = ref('');

export function setCoreVersion(version?: string): void {
  if (!version) return;
  coreVersion.value = vClean(version) ?? coreVersion.value;
}

export function getCoreVersion(): string {
  return coreVersion.value;
}

export function setTestedCore(version?: string): void {
  if (!version) return;
  testedCore.value = vClean(version) ?? testedCore.value;
}

export function getTestedCore(): string {
  return testedCore.value;
}

function coreKnown(): boolean {
  return coreVersion.value !== UNKNOWN_CORE;
}

export function coreNewerThanTested(): boolean {
  return coreKnown() && testedCore.value !== '' && vCompare(coreVersion.value, testedCore.value) > 0;
}

export function coreAtLeast(target: string): boolean {
  return !coreKnown() || vCompare(coreVersion.value, target) >= 0;
}

export function coreBelow(target: string): boolean {
  return coreKnown() && vCompare(coreVersion.value, target) < 0;
}

type CoreFeatureRule = { since?: string; until?: string };

const CORE_FEATURES = {
  allowInsecure: { until: '26.3.27' },
  pinnedPeerCertSha256: { since: '26.3.27' },
  verifyPeerCertByName: { since: '26.3.27' },
  tlsPingCertHash: { since: '26.2.4' },
  tunInbound: { since: '26.1.13' },
  tunGateway: { since: '26.4.13' },
  tunAutoRoute: { since: '26.6.27' },
  tunDesc: { since: '26.7.28' },
  kcpLegacyTuning: { until: '26.4.13' },
  kcpCwnd: { since: '26.4.13' },
  xhttpSessionID: { since: '26.6.22' },
  // Port hopping: hysteriaSettings.udphop before 26.3.23, finalmask.quicParams.udpHop until 26.9.9, then the `udphop` mask.
  quicParamsUdpHop: { since: '26.3.23', until: '26.9.9' },
  udphopMask: { since: '26.9.9' },
  // xicmp settings were {listenIp, id} before 26.6.1.
  xicmpIps: { since: '26.6.1' },
  // xdns `domain` is a startup error ("feature removed") from 26.4.13 on.
  xdnsLegacy: { until: '26.4.13' },
  // XTLS/Xray-core#6303 removed the unencrypted ciphers: Shadowsocks none/plain fail to start, VMess none/zero turn into auto.
  ssPlainCipher: { until: '26.7.11' },
  vmessPlainSecurity: { until: '26.7.11' }
} as const satisfies Record<string, CoreFeatureRule>;

export type CoreFeature = keyof typeof CORE_FEATURES;

export function coreSupports(feature: CoreFeature): boolean {
  const rule: CoreFeatureRule = CORE_FEATURES[feature];
  if (rule.since && coreBelow(rule.since)) return false;
  if (rule.until && coreAtLeast(rule.until)) return false;
  return true;
}

export type MkcpMaskingMode = 'legacy' | 'finalmask' | 'finalmask-mkcp-legacy';

export function mkcpMaskingMode(): MkcpMaskingMode {
  if (coreBelow('26.1.31')) return 'legacy';
  if (coreAtLeast('26.6.1')) return 'finalmask-mkcp-legacy';
  return 'finalmask';
}

export function coreUsesMkcpLegacyMaskType(): boolean {
  return coreAtLeast('26.6.1');
}

export function coreAppliesLastMaskOutermost(): boolean {
  return coreAtLeast('26.6.22');
}

export function coreExpectsOutermostMaskLast(): boolean {
  return coreAtLeast('26.9.9');
}

export function tunUsesUppercaseMtu(): boolean {
  return coreBelow('26.4.13');
}

export function coreAppliesTunRoutes(): boolean {
  return coreAtLeast('26.6.27');
}

export function coreAppliesTunGateway(): boolean {
  return coreAtLeast('26.7.11');
}

// A VLESS or Trojan outbound without TLS/REALITY to a public address stops Xray from starting (XTLS/Xray-core#6303).
// 26.7.11 checks only the short form (`address` right in `settings`); the vnext/servers form XRAYUI writes is checked since 26.9.9.
export function coreChecksOutboundTransportSecurity(shortForm: boolean): boolean {
  return coreAtLeast(shortForm ? '26.7.11' : '26.9.9');
}

// Since 26.10.31 (XTLS/Xray-core#7249) only RFC 1918, fc00::/7, loopback and link-local IPs count as private for that check.
export function coreUsesNarrowPrivateIps(): boolean {
  return coreAtLeast('26.10.31');
}
