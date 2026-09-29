const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const asar = require('@electron/asar');
const { getCurrentFuseWire } = require('@electron/fuses');
const { writeJson } = require('../electron/durable-file');
const root = path.resolve(__dirname, '..');
const build = path.join(root, 'dist/protected-startup-review');
const archive = path.join(build, 'win-unpacked/resources/app.asar');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
(async () => {
  const entries = [];
  for (const name of asar.listPackage(archive)) {
    const relative = name.replace(/^[/\\]+/, '');
    const stat = asar.statFile(archive, relative);
    if (stat.files) continue;
    assert(!stat.link && !stat.unpacked, relative);
    const actual = asar.extractFile(archive, relative), expected = fs.readFileSync(path.join(root, relative));
    if (relative === 'package.json') {
      const a = JSON.parse(actual), b = JSON.parse(expected);
      for (const key of ['name','version','main','description','author','license']) assert.deepEqual(a[key], b[key]);
    } else assert(actual.equals(expected), `Source parity: ${relative}`);
    entries.push({ file: relative.replaceAll('\\','/'), sha256: hash(actual) });
  }
  for (const relative of ['README-FIRST.txt','LICENSE.txt','NOTICE.txt','THIRD_PARTY_NOTICES.md','SECURITY.md','resources/build/icon.ico','resources/build/icon.png']) {
    assert(fs.readFileSync(path.join(build, 'win-unpacked', relative)).equals(fs.readFileSync(path.join(root, relative.replace(/^resources\//,'')))), relative);
  }
  assert(fs.readFileSync(archive).equals(fs.readFileSync(path.join(build, 'verify-win-zip/resources/app.asar'))), 'ZIP ASAR matches runtime');
  const fuses = await getCurrentFuseWire(path.join(build, 'win-unpacked/Helldivers 2 Chaos Slot Machine.exe'));
  for (const [index, state] of Object.entries({ 0: 48, 2: 48, 3: 48, 4: 49, 5: 49, 7: 49 })) assert.equal(fuses[index], state, `Fuse ${index}`);
  const report = { passed: true, at: new Date().toISOString(), sourceFiles: entries.length, asarSha256: hash(fs.readFileSync(archive)), fuses, zipAsarCompared: true, externalGuideAndIcons: true, files: entries };
  writeJson(path.join(root, '.test-data/protected-startup-source-parity.json'), report);
  console.log(JSON.stringify({ ...report, files: undefined }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
