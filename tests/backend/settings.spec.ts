import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HARNESS = path.join(process.cwd(), 'tests', 'backend', 'settings', 'harness.sh');

const which = (bin: string): string | undefined => {
  const out = spawnSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf8' });
  return out.status === 0 ? out.stdout.trim() : undefined;
};
const BUSYBOX = process.platform === 'linux' ? which('busybox') : undefined;
const SHELLS: [string, string[]][] = [...(BUSYBOX ? [['busybox sh', [BUSYBOX, 'sh']] as [string, string[]]] : []), ['sh', ['sh']]];

const STORED = 'MerlinAU_version_local 1.4.2\nxray_payload0 gz:AAAA/BB+\nxray_startup y\nxray_payload1 CCC=\nxray_stage_data abc\nxray_staged_session s1\nxray_version 0.70.0\n';
const KEPT = 'MerlinAU_version_local 1.4.2\nxray_startup y\nxray_version 0.70.0\n';

const run = (shell: string[], steps: string[], env: Record<string, string> = {}) => {
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'xrayui-settings-'));
  try {
    fs.mkdirSync(path.join(state, 'jffs', 'addons'), { recursive: true });
    fs.writeFileSync(path.join(state, 'jffs', 'addons', 'custom_settings.txt'), STORED);
    const out = spawnSync(shell[0], [...shell.slice(1), HARNESS, state, ...steps], { encoding: 'utf8', env: { ...process.env, ...env } });
    const read = (rel: string) => (fs.existsSync(path.join(state, rel)) ? fs.readFileSync(path.join(state, rel), 'utf8') : undefined);
    return {
      status: out.status,
      stderr: out.stderr,
      events: (read('events.log') ?? '').split('\n').filter(Boolean),
      settings: read('jffs/addons/custom_settings.txt'),
      addons: fs.readdirSync(path.join(state, 'jffs', 'addons')),
      tmp: fs.readdirSync(path.join(state, 'tmp'))
    };
  } finally {
    fs.rmSync(state, { recursive: true, force: true });
  }
};

describe.each(SHELLS)('custom settings cleanup (%s)', (_name, shell) => {
  it('removes stored requests and keeps every other setting', () => {
    const r = run(shell, ['cleanup_payload', 'cleanup_staged_marker']);

    expect(r.stderr).toBe('');
    expect(r.events).toEqual(expect.arrayContaining(['cleanup_payload rc=0', 'cleanup_staged_marker rc=0']));
    expect(r.settings).toBe(KEPT);
    expect(r.addons).toEqual(['custom_settings.txt']);
    expect(r.tmp).toEqual([]);
  });

  it('replaces the settings file with a rename inside its own folder', () => {
    const r = run(shell, ['cleanup_payload', 'cleanup_staged_marker', 'am_settings_del xray_startup']);

    expect(r.events.filter((e) => e.startsWith('mv '))).toEqual(['mv jffs/addons -> jffs/addons', 'mv jffs/addons -> jffs/addons', 'mv jffs/addons -> jffs/addons']);
    expect(r.settings).toBe('MerlinAU_version_local 1.4.2\nxray_version 0.70.0\n');
  });

  it('leaves the settings file untouched when the new copy cannot be written', () => {
    const r = run(shell, ['cleanup_payload', 'cleanup_staged_marker'], { ST_FAIL_WRITE: '1' });

    expect(r.events).toEqual(expect.arrayContaining(['cleanup_payload rc=1', 'cleanup_staged_marker rc=1']));
    expect(r.settings).toBe(STORED);
    expect(r.addons).toEqual(['custom_settings.txt']);
    expect(r.tmp).toEqual([]);
  });
});
