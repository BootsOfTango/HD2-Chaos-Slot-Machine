'use strict';
// Reproducible, deliberately narrow adapter for the locked builder templates.
// Never replace installer.nsi: doing so skips electron-builder's uninstaller signing.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const version = '26.15.3';
const specs = [
  { file: 'include/installer.nsh', count: 7, original: '0e319437dd01dcbf911f3f48f664fde0cefbaef704f1cdb1739f63d563f5d4a0', patched: 'fd4f78d69425cc37e1b0c2078c3b5cdf3175fcfa29d4d9e33620b2aacc428349' },
  { file: 'uninstaller.nsh', count: 3, original: '9ee2dac4593478083e8aa6f8487287ce9401006ccd50ecc538871d133ea4a42c', patched: '1ce9b9c029d564fec77eaf3116cb8fb529d5aa8cf6f56390da4fd8477e84278c' },
];
const substitutions = [
  ['WinShell::SetLnkAUMI', '!insertmacro HD2_BuilderSetAppId'],
  ['WinShell::UninstShortcut', '!insertmacro HD2_BuilderUnpin'],
  ['WinShell::UninstAppUserModelId', '!insertmacro HD2_BuilderClearDestinations'],
];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function inspect(root, io = fs) {
  const library = path.join(root, 'node_modules/app-builder-lib');
  if (JSON.parse(io.readFileSync(path.join(library, 'package.json'), 'utf8')).version !== version) throw Error('Installer adapter: unreviewed app-builder-lib version');
  return specs.map(spec => {
    const file = path.join(library, 'templates/nsis', spec.file);
    const bytes = io.readFileSync(file), digest = hash(bytes);
    if (digest !== spec.original && digest !== spec.patched) throw Error('Installer adapter: unreviewed template bytes: ' + spec.file);
    if (digest === spec.patched) return { ...spec, file, bytes, ready: true };
    let text = bytes.toString('utf8');
    if ((text.match(/WinShell::/g) || []).length !== spec.count) throw Error('Unexpected call count');
    for (const [from, to] of substitutions) text = text.replaceAll(from, to);
    const replacement = Buffer.from(text);
    if (text.includes('WinShell::') || hash(replacement) !== spec.patched) throw Error('Installer adapter output mismatch');
    return { ...spec, file, bytes, replacement, ready: false };
  });
}
function assertPrepared(root) {
  if (fs.existsSync(path.join(root, 'build/installer.nsi'))) throw Error('Custom installer.nsi would bypass the stock uninstaller signing lifecycle');
  if (inspect(root).some(row => !row.ready)) throw Error('Installer shell adapter not prepared. Run npm run prepare:installer-shell after npm ci.');
}
function prepare(root, io = fs) {
  // Validate the entire input set before touching either file. Recognize only
  // pinned original/patched bytes, so npm ci and interrupted builds are safe.
  const rows = inspect(root, io).filter(row => !row.ready);
  const staged = [], changed = [];
  try {
    for (const row of rows) {
      const temp = row.file + '.hd2-' + crypto.randomUUID() + '.tmp';
      staged.push({ ...row, temp });
      io.writeFileSync(temp, row.replacement, { flag: 'wx' });
    }
    for (const row of staged) {
      if (hash(io.readFileSync(row.file)) !== row.original) throw Error('Template changed during adapter preparation');
      io.renameSync(row.temp, row.file);
      changed.push(row);
    }
  } catch (error) {
    for (const row of changed.reverse()) {
      // Do not overwrite an unrelated concurrent change during rollback.
      if (hash(io.readFileSync(row.file)) !== row.patched) throw Error('Adapter rollback blocked by concurrent edit: ' + row.file, { cause: error });
      io.writeFileSync(row.file, row.bytes);
    }
    throw error;
  } finally {
    for (const row of staged) if (io.existsSync(row.temp)) io.unlinkSync(row.temp);
  }
  return { version, changed: rows.length, callSites: 10 };
}
module.exports = { inspect, assertPrepared, prepare, specs, substitutions };
if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  try {
    if (process.argv.includes('--check')) { assertPrepared(root); console.log('Installer shell adapter verified: ten call sites; stock signing lifecycle retained.'); }
    else console.log(JSON.stringify(prepare(root)));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
