const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { localArtifactNames } = require('../scripts/local-build-label');
const root = path.resolve(__dirname, '..');
const verify = args => spawnSync('python', ['scripts/verify_win_zip.py', ...args], { cwd: root, encoding: 'utf8', windowsHide: true });

test('descriptive local artifact names omit release numbering without changing public defaults', () => {
  assert.equal(localArtifactNames(undefined), null);
  assert.deepEqual(localArtifactNames('defensive'), { archive: 'HD2-Chaos-Slot-Machine-local-defensive-win-${arch}.${ext}', installer: 'HD2-Chaos-Slot-Machine-Setup-local-defensive-win-${arch}.${ext}' });
  const env = { ...process.env, WINDOWS_SIGNING_REQUIRED: 'false', WINDOWS_SIGNING_ENABLED: 'false' };
  delete env.HD2CSM_LOCAL_BUILD_LABEL;
  const config = label => spawnSync(process.execPath, ['-e', "const c=require('./electron-builder.config');console.log(JSON.stringify([c.artifactName,c.nsis.artifactName]));"], { cwd: root, env: label === undefined ? env : { ...env, HD2CSM_LOCAL_BUILD_LABEL: label }, encoding: 'utf8', windowsHide: true });
  const release = config(); assert.equal(release.status, 0);
  assert.deepEqual(JSON.parse(release.stdout), ['HD2-Chaos-Slot-Machine-v1.0.0-win-${arch}.${ext}', 'HD2-Chaos-Slot-Machine-Setup-v1.0.0-win-${arch}.${ext}']);
  const local = config('defensive'); assert.equal(local.status, 0);
  assert.deepEqual(JSON.parse(local.stdout), Object.values(localArtifactNames('defensive')));
});

test('builder and artifact verifier reject unsafe, empty and oversized local labels before any writes', () => {
  for (const label of ['', '../escape', 'UPPER', 'two words', 'x--y', '-start', 'end-', 'a'.repeat(49), 'x/y', 'x\\y', '${version}', 'defensive\n', 'defensive\r\n']) {
    assert.throws(() => localArtifactNames(label), /Local build label/);
    const result = verify([`--local-label=${label}`]);
    assert.equal(result.status, 1); assert.match(result.stderr, /Invalid local build label/);
  }
  assert(localArtifactNames('a'.repeat(48)));
});

test('artifact verifier selects only the exact explicitly labeled installer and ZIP names', () => {
  const names = localArtifactNames('unit-name-check');
  const installer = names.installer.replace('${arch}', 'x64').replace('${ext}', 'exe');
  const zip = names.archive.replace('${arch}', 'x64').replace('${ext}', 'zip');
  const result = verify(['--local-label', 'unit-name-check', '--installer', path.join(root, installer)]);
  assert.equal(result.status, 1); assert(result.stderr.includes('Missing Windows artifact:') && result.stderr.includes(zip));
  const wrong = verify(['--local-label', 'unit-name-check', '--installer', path.join(root, 'HD2-Chaos-Slot-Machine-Setup-local-other-win-x64.exe')]);
  assert.equal(wrong.status, 1); assert.match(wrong.stderr, /explicitly selected local label/);
});
