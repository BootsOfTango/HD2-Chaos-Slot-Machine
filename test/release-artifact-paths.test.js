const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const installer = `Helldivers-2-Chaos-Slot-Machine-Setup-v${require('../package.json').version}-win-x64.exe`;
const run = args => spawnSync('python', ['scripts/verify_win_zip.py', ...args], { cwd: root, encoding: 'utf8', windowsHide: true });

test('artifact verifier documents explicit installer location without changing default build output', () => {
  const result = run(['--help']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /--installer/);
  assert.match(result.stdout, /--dist/);
});

test('artifact verifier rejects installers outside this checkout before inspecting or writing artifacts', () => {
  const result = run(['--installer', path.resolve(root, '..', installer)]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Explicit installer must be inside this checkout/);
});

test('artifact verifier rejects an app EXE or wrong-version installer supplied as the Setup artifact', () => {
  for (const filename of ['Helldivers 2 Chaos Slot Machine.exe', 'Helldivers-2-Chaos-Slot-Machine-Setup-v0.0.0-win-x64.exe']) {
    const result = run(['--installer', path.join(root, filename)]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /match the current versioned Setup filename/);
  }
});
