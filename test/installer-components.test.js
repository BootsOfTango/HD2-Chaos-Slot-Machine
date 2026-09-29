'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { components, reviewComponents, verifyBuilderNotice, verifySourceMaterials } = require('../scripts/installer-component-policy');
const root = path.resolve(__dirname, '..');
const rows = () => Object.entries(components).map(([file, p]) => ({ file, sha256: p.sha256 }));
function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hd2-builder-notice-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  fs.mkdirSync(path.join(temp, 'licenses'), { recursive: true });
  fs.cpSync(path.join(root, 'licenses/builder'), path.join(temp, 'licenses/builder'), { recursive: true });
  for (const name of ['electron-builder', 'app-builder-lib']) {
    const dir = path.join(temp, 'node_modules', name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '26.15.3', license: 'MIT' }));
  }
  fs.copyFileSync(path.join(root, 'node_modules/electron-builder/LICENSE'), path.join(temp, 'node_modules/electron-builder/LICENSE'));
  return temp;
}
test('complete notices/source map validates offline for locked builder', () => {
  assert.equal(verifySourceMaterials().components, 7);
  assert.equal(verifyBuilderNotice().version, '26.15.3');
});
test('both exact component sets map to notices and source packages', () => {
  const install = reviewComponents(rows(), 'installer');
  const uninstall = reviewComponents(rows().filter(row => row.file !== 'nsis7z.dll'), 'uninstaller');
  assert.equal(install.length, 7); assert.equal(uninstall.length, 6);
  assert(install.every(row => row.notice && row.source && /not legal clearance/.test(row.review)));
  assert(install.find(row => row.file === 'StdUtils.dll').sourcePackage);
});
test('missing, extra, duplicate and WinShell components fail closed', () => {
  for (const input of [rows().slice(1), [...rows(), rows()[0]], [...rows(), { file: 'WinShell.dll', sha256: '0'.repeat(64) }]]) {
    assert.throws(() => reviewComponents(input, 'installer'), /Unexpected/);
  }
  assert.throws(() => reviewComponents(rows(), 'uninstaller'), /Unexpected/);
  assert.throws(() => reviewComponents(rows(), 'unknown'), /Unknown archive/);
});
test('DLL and wizard image mutations are rejected independently', () => {
  for (const file of ['System.dll', 'modern-wizard.bmp']) {
    const input = rows().map(row => row.file === file ? { ...row, sha256: '0'.repeat(64) } : row);
    assert.throws(() => reviewComponents(input, 'installer'), /Unreviewed component bytes/);
  }
});
test('missing or changed builder notice cannot pass', t => {
  const temp = fixture(t), file = path.join(temp, 'licenses/builder/LICENSE.txt');
  verifyBuilderNotice(temp);
  fs.appendFileSync(file, 'edited');
  assert.throws(() => verifyBuilderNotice(temp), /notice changed/);
  fs.unlinkSync(file);
  assert.throws(() => verifyBuilderNotice(temp), /ENOENT/);
});
test('dependency version/license or original notice drift cannot pass', t => {
  const temp = fixture(t), file = path.join(temp, 'node_modules/app-builder-lib/package.json');
  for (const data of [{ version: '99.0.0', license: 'MIT' }, { version: '26.15.3', license: 'unknown' }]) {
    fs.writeFileSync(file, JSON.stringify(data));
    assert.throws(() => verifyBuilderNotice(temp), /Unreviewed builder/);
  }
  fs.writeFileSync(file, JSON.stringify({ version: '26.15.3', license: 'MIT' }));
  fs.appendFileSync(path.join(temp, 'node_modules/electron-builder/LICENSE'), 'edited');
  assert.throws(() => verifyBuilderNotice(temp), /Locked builder notice differs/);
});
test('build and ZIP policies require builder notice delivery', () => {
  const config = require('../electron-builder.config');
  assert(config.extraFiles.some(row => row.from === 'licenses/builder' && row.to === 'licenses/builder'));
  assert.match(config.beforePack.toString(), /verifySourceMaterials/);
  assert.match(fs.readFileSync(path.join(root, 'scripts/verify_win_zip.py'), 'utf8'), /Missing or changed builder template attribution/);
});
