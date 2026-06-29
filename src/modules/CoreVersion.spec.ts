import { setCoreVersion, getCoreVersion, coreAtLeast, coreBelow, coreSupports } from './CoreVersion';

describe('CoreVersion', () => {
  afterEach(() => {
    setCoreVersion('0.0.0');
  });

  it('defaults to 0.0.0', () => {
    expect(getCoreVersion()).toBe('0.0.0');
  });

  it('ignores empty/undefined updates', () => {
    setCoreVersion('26.3.27');
    setCoreVersion(undefined);
    setCoreVersion('');
    expect(getCoreVersion()).toBe('26.3.27');
  });

  it('cleans the incoming version string', () => {
    setCoreVersion('v26.3.27');
    expect(getCoreVersion()).toBe('26.3.27');
  });

  it('compares versions', () => {
    setCoreVersion('26.3.27');
    expect(coreAtLeast('26.3.27')).toBe(true);
    expect(coreAtLeast('26.3.28')).toBe(false);
    expect(coreBelow('26.3.28')).toBe(true);
  });

  describe('coreSupports', () => {
    it('keeps allowInsecure on cores below 26.3.27', () => {
      setCoreVersion('26.3.26');
      expect(coreSupports('allowInsecure')).toBe(true);
      expect(coreSupports('pinnedPeerCertSha256')).toBe(false);
    });

    it('drops allowInsecure on 26.3.27 and later', () => {
      setCoreVersion('26.3.27');
      expect(coreSupports('allowInsecure')).toBe(false);
      expect(coreSupports('pinnedPeerCertSha256')).toBe(true);
      expect(coreSupports('verifyPeerCertByName')).toBe(true);
    });

    it('treats the unknown default version as supporting allowInsecure', () => {
      expect(coreSupports('allowInsecure')).toBe(true);
    });
  });
});
