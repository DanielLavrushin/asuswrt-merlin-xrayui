import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HARNESS = path.join(process.cwd(), 'tests', 'backend', 'web', 'harness.sh');

const which = (bin: string): string | undefined => {
  const out = spawnSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf8' });
  return out.status === 0 ? out.stdout.trim() : undefined;
};
const BUSYBOX = process.platform === 'linux' ? which('busybox') : undefined;
const SHELLS: [string, string[]][] = [...(BUSYBOX ? [['busybox sh', [BUSYBOX, 'sh']] as [string, string[]]] : []), ['sh', ['sh']]];
const itIf = (condition: boolean) => (condition ? it : it.skip);
const HAS_JQ = which('jq') !== undefined;

const DATA = ['xray-config', 'xray-ui-response', 'clients-online', 'connection-status', 'subscriptions', 'geotags', 'rtls-results', 'b4sni'];

type Seed = { files?: Record<string, string>; links?: Record<string, string> };

const states: string[] = [];
afterAll(() => states.forEach((state) => fs.rmSync(state, { recursive: true, force: true })));

const run = (shell: string[], steps: string[], seed: Seed = {}) => {
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'xrayui-web-'));
  states.push(state);
  for (const [rel, content] of Object.entries(seed.files ?? {})) {
    fs.mkdirSync(path.dirname(path.join(state, rel)), { recursive: true });
    fs.writeFileSync(path.join(state, rel), content);
  }
  for (const [rel, target] of Object.entries(seed.links ?? {})) {
    fs.mkdirSync(path.dirname(path.join(state, rel)), { recursive: true });
    fs.symlinkSync(target, path.join(state, rel));
  }
  const out = spawnSync(shell[0], [...shell.slice(1), HARNESS, state, ...steps], { encoding: 'utf8' });
  const web = path.join(state, 'www', 'user', 'xrayui');
  const list = (rel: string) => (fs.existsSync(path.join(web, rel)) ? fs.readdirSync(path.join(web, rel)).sort() : []);
  const link = (rel: string) => {
    const p = path.join(web, rel);
    return fs.lstatSync(p, { throwIfNoEntry: false })?.isSymbolicLink() ? fs.readlinkSync(p) : undefined;
  };
  const read = (rel: string) => (fs.existsSync(path.join(web, rel)) ? fs.readFileSync(path.join(web, rel), 'utf8') : undefined);
  const events = fs.existsSync(path.join(state, 'events.log')) ? fs.readFileSync(path.join(state, 'events.log'), 'utf8').split('\n').filter(Boolean) : [];
  return { status: out.status, stderr: out.stderr, events, list, link, read };
};

describe.each(SHELLS)('web files (%s)', (_name, shell) => {
  it('adds a login-protected raw copy next to every data file the page reads', () => {
    const r = run(shell, ['mount_web_aliases']);

    expect(r.events).toEqual(['mount_web_aliases rc=0']);
    for (const name of DATA) expect(r.link(`${name}.cab`)).toBe(`${name}.json`);
  });

  it('keeps existing copies and repairs a name that is not a link', () => {
    const r = run(shell, ['mount_web_aliases', 'mount_web_aliases'], { files: { 'www/user/xrayui/geotags.cab': 'stale' } });

    expect(r.events).toEqual(['mount_web_aliases rc=0', 'mount_web_aliases rc=0']);
    expect(r.link('geotags.cab')).toBe('geotags.json');
    expect(r.list('').filter((f) => f.endsWith('.cab'))).toHaveLength(DATA.length);
  });

  it('publishes backups only under login-protected names', () => {
    const r = run(shell, ['(backup_remount_to_web)'], {
      files: { 'opt/share/xrayui/backup/xrayui-20260926-101500.tar.gz': 'a', 'opt/share/xrayui/backup/xrayui-20260926-111500-before.tar.gz': 'b' },
      links: { 'www/user/xrayui/backup/xrayui-20260101-000000.tar.gz': '/nowhere' }
    });

    expect(r.events).toEqual(['(backup_remount_to_web) rc=0']);
    expect(r.list('backup')).toEqual(['xrayui-20260926-101500.tar.gz.cab', 'xrayui-20260926-111500-before.tar.gz.cab']);
  });

  it('creates the backup folder when there are no backups yet', () => {
    const r = run(shell, ['(backup_remount_to_web)']);

    expect(r.events).toEqual(['(backup_remount_to_web) rc=0']);
    expect(r.stderr).toBe('');
    expect(r.list('backup')).toEqual([]);
  });

  itIf(HAS_JQ)('writes the log excerpts under login-protected raw names', () => {
    const r = run(shell, ['logs_fetch'], {
      files: {
        'opt/etc/xray/config.json': '{"log":{}}',
        'opt/share/xrayui/logs/xray_error.log': '2026/09/26 10:00:00 [Info] app/dispatcher: sniffed domain: x<%y%>.example\n',
        'opt/share/xrayui/logs/xray_access.log': '2026/09/26 10:00:00.1 from 192.168.1.10:5000 accepted tcp:example.com:443 [in >> direct]\n'
      }
    });

    expect(r.events).toEqual(['logs_fetch rc=0']);
    expect(r.list('')).toEqual(['xray_access_partial.cab', 'xray_error_partial.cab']);
    expect(r.read('xray_error_partial.cab')).toBe('2026/09/26 10:00:00 [Info] app/dispatcher: sniffed domain: x<%y%>.example\n');
  });
});
