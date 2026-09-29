const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolvePackagedTestTarget } = require('../scripts/packaged-test-target');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hd2csm-target-unit-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('packaged tests require one explicit target and never infer the interrupted runtime', () => {
  for (const args of [[], ['--warbonds'], [''], ['one.exe', 'two.exe']]) {
    assert.throws(() => resolvePackagedTestTarget(args), /exactly one explicit.*No default app will be launched/);
  }
  const runner = fs.readFileSync(path.join(__dirname, '../scripts/run-packaged-smoke.js'), 'utf8');
  const preflight = runner.indexOf('const executable = resolvePackagedTestTarget(');
  assert(preflight >= 0 && preflight < runner.indexOf('fs.mkdirSync(runRoot'));
  assert(!runner.includes("path.join(root, 'dist', 'win-unpacked'"));
});

test('packaged target preflight rejects absent files, directories and non-EXE paths', t => {
  const directory = fixture(t);
  fs.mkdirSync(path.join(directory, 'directory.exe'));
  fs.writeFileSync(path.join(directory, 'text.txt'), 'MZ');
  for (const file of ['missing.exe', 'directory.exe', 'text.txt']) {
    assert.throws(() => resolvePackagedTestTarget([file], directory), /existing EXE file/);
  }
});

test('packaged target preflight refuses zero-filled, empty and partial executable headers', t => {
  const directory = fixture(t);
  for (const [name, bytes] of [['zero.exe', Buffer.alloc(32)], ['empty.exe', Buffer.alloc(0)], ['partial.exe', Buffer.from('M')]]) {
    fs.writeFileSync(path.join(directory, name), bytes);
    assert.throws(() => resolvePackagedTestTarget([name], directory), /damaged or missing MZ header; no app was launched/);
  }
});

test('explicit absolute and relative EXE paths pass basic header preflight without launching anything', t => {
  const directory = fixture(t);
  const executable = path.join(directory, 'Test App.EXE');
  fs.writeFileSync(executable, Buffer.from('MZ-unit-fixture-not-a-real-executable'));
  assert.equal(resolvePackagedTestTarget([executable, '--warbonds', '--warbond-batch=3']), executable);
  assert.equal(resolvePackagedTestTarget(['--gear', 'Test App.EXE'], directory), executable);
});
