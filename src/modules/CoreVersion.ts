import { ref } from 'vue';
import vCompare from 'version-compare';
import vClean from 'version-clean';

const coreVersion = ref('0.0.0');

export function setCoreVersion(version?: string): void {
  if (!version) return;
  coreVersion.value = vClean(version) ?? coreVersion.value;
}

export function getCoreVersion(): string {
  return coreVersion.value;
}

export function coreAtLeast(target: string): boolean {
  return vCompare(coreVersion.value, target) >= 0;
}

export function coreBelow(target: string): boolean {
  return vCompare(coreVersion.value, target) < 0;
}

type CoreFeatureRule = { since?: string; until?: string };

const CORE_FEATURES = {
  allowInsecure: { until: '26.3.27' },
  pinnedPeerCertSha256: { since: '26.3.27' },
  verifyPeerCertByName: { since: '26.3.27' }
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
  const v = coreVersion.value;
  if (v !== '0.0.0' && coreBelow('26.1.31')) return 'legacy';
  if (coreAtLeast('26.6.1')) return 'finalmask-mkcp-legacy';
  return 'finalmask';
}

export function coreUsesMkcpLegacyMaskType(): boolean {
  return coreAtLeast('26.6.1');
}
