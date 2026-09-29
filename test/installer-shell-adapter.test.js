'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const adapter = require('../scripts/prepare-installer-shell');
const root = path.resolve(__dirname, '..');
function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hd2-shell-adapter-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const library = path.join(temp, 'node_modules/app-builder-lib');
  fs.mkdirSync(path.join(library, 'templates/nsis/include'), { recursive: true });
  fs.writeFileSync(path.join(library, 'package.json'), JSON.stringify({ version: '26.15.3' }));
  for (const spec of adapter.specs) {
    let text = fs.readFileSync(path.join(root, 'node_modules/app-builder-lib/templates/nsis', spec.file), 'utf8');
    for (const [from, to] of adapter.substitutions) text = text.replaceAll(to, from);
    fs.writeFileSync(path.join(library, 'templates/nsis', spec.file), text);
  }
  return { temp, library, files: adapter.specs.map(s => path.join(library, 'templates/nsis', s.file)) };
}
test('adapter replaces precisely ten calls and is idempotent', t => {
  const f = fixture(t);
  assert.throws(() => adapter.assertPrepared(f.temp), /not prepared/);
  assert.deepEqual(adapter.prepare(f.temp), { version: '26.15.3', changed: 2, callSites: 10 });
  adapter.assertPrepared(f.temp);
  assert.equal(adapter.prepare(f.temp).changed, 0);
  for (const file of f.files) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /WinShell::/);
});
test('unreviewed version is refused before any writes', t => {
  const f = fixture(t), before = f.files.map(p => fs.readFileSync(p));
  fs.writeFileSync(path.join(f.library, 'package.json'), '{"version":"99.0.0"}');
  assert.throws(() => adapter.prepare(f.temp), /unreviewed.*version/);
  f.files.forEach((p, i) => assert.deepEqual(fs.readFileSync(p), before[i]));
});
test('unexpected second template leaves first completely untouched', t => {
  const f = fixture(t), before = fs.readFileSync(f.files[0]);
  fs.appendFileSync(f.files[1], '\n; unexpected edit');
  assert.throws(() => adapter.prepare(f.temp), /unreviewed template/);
  assert.deepEqual(fs.readFileSync(f.files[0]), before);
});
test('missing second template leaves first untouched', t => {
  const f = fixture(t), before = fs.readFileSync(f.files[0]);
  fs.unlinkSync(f.files[1]);
  assert.throws(() => adapter.prepare(f.temp), /ENOENT/);
  assert.deepEqual(fs.readFileSync(f.files[0]), before);
});
test('second rename failure rolls back first and removes temporary files', t => {
  const f = fixture(t), before = f.files.map(p => fs.readFileSync(p));
  let calls = 0;
  const io = { ...fs, renameSync(a, b) { if (++calls === 2) throw Error('simulated write failure'); fs.renameSync(a, b); } };
  assert.throws(() => adapter.prepare(f.temp, io), /simulated write failure/);
  f.files.forEach((p, i) => assert.deepEqual(fs.readFileSync(p), before[i]));
  for (const dir of [path.dirname(f.files[0]), path.dirname(f.files[1])]) assert(!fs.readdirSync(dir).some(n => n.endsWith('.tmp')));
});
test('known mixed original/patched state resumes safely', t => {
  const f = fixture(t), original = fs.readFileSync(f.files[1]);
  adapter.prepare(f.temp);
  fs.writeFileSync(f.files[1], original);
  assert.equal(adapter.prepare(f.temp).changed, 1);
  adapter.assertPrepared(f.temp);
});
test('partial staging failure leaves inputs untouched and removes staged files', t => {
  const f = fixture(t), before = f.files.map(p => fs.readFileSync(p));
  const io = { ...fs, writeFileSync(file, data, opts) {
    fs.writeFileSync(file, data.subarray(0, 12), opts);
    throw Error('simulated disk error');
  } };
  assert.throws(() => adapter.prepare(f.temp, io), /simulated disk error/);
  f.files.forEach((p, i) => assert.deepEqual(fs.readFileSync(p), before[i]));
  for (const dir of [path.dirname(f.files[0]), path.dirname(f.files[1])]) assert(!fs.readdirSync(dir).some(n => n.endsWith('.tmp')));
});
test('implicit custom installer resource is refused even with prepared templates', t => {
  const f = fixture(t);
  adapter.prepare(f.temp);
  fs.mkdirSync(path.join(f.temp, 'build'));
  fs.writeFileSync(path.join(f.temp, 'build/installer.nsi'), '; custom');
  assert.throws(() => adapter.assertPrepared(f.temp), /bypass/);
});
test('builder config refuses direct unprepared builds and bundles original helper sources', () => {
  const config = require('../electron-builder.config');
  assert.match(config.beforePack.toString(), /assertPrepared/);
  assert.equal(config.nsis.script, undefined);
  assert(config.extraFiles.some(row => row.from === 'installer' && row.to === 'licenses/hd2-shell'));
  const wrapper = fs.readFileSync(path.join(root, 'installer/integration.nsh'), 'utf8');
  assert.match(wrapper, /installer-shell-warnings\.log/);
  assert.match(wrapper, /\/SD IDOK/);
  assert.doesNotMatch(wrapper, /WinShell::|SetErrorLevel 0|^\s*Abort/m);
});
