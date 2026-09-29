'use strict';
// Bounded local-candidate inspection. Never runs the installer or touches a save.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const asar = require('@electron/asar');
const { getCurrentFuseWire } = require('@electron/fuses');
const { writeJson, writeDurable } = require('../electron/durable-file');
const { installerMembers, resolveCandidate } = require('./audit-distribution');
const root = path.resolve(__dirname, '..');
const label = process.argv[2] || 'combined-preview';
assert(['combined-preview', 'installer-shell', 'installer-notices', 'live-war', 'armory-browser', 'mission-planner', 'mission-visual', 'mission-basics', 'planet-art', 'mission-symbols', 'mission-lines', 'solo-score', 'card-entry', 'tidy-card', 'firepower', 'mission-factions', 'mission-sabotage', 'mission-illuminate', 'mission-regional', 'mission-city', 'mission-clean', 'galaxy-map', 'galaxy-conditions', 'themed-names', 'eligible-map', 'card-planets', 'activity-map', 'ironclad-gear', 'fan-notice', 'ironclad-art', 'weapon-thumbs', 'runtime-patch'].concat('card-sector', 'mission-game-art', 'mission-art-2', 'mission-art-3', 'mission-art-4', 'mission-art-final', 'yellow-missions', 'card-rules').includes(label), 'Use an explicitly reviewed candidate label');
const replacedShell = label !== 'combined-preview';
const auditedNotices = ['installer-notices', 'live-war', 'armory-browser', 'mission-planner', 'mission-visual', 'mission-basics', 'planet-art', 'mission-symbols', 'mission-lines', 'solo-score', 'card-entry', 'tidy-card', 'firepower', 'mission-factions', 'mission-sabotage', 'mission-illuminate', 'mission-regional', 'mission-city', 'mission-clean', 'galaxy-map', 'galaxy-conditions', 'themed-names', 'eligible-map', 'card-planets', 'activity-map', 'ironclad-gear', 'fan-notice', 'ironclad-art', 'weapon-thumbs', 'runtime-patch'].concat('card-sector', 'mission-game-art', 'mission-art-2', 'mission-art-3', 'mission-art-4', 'mission-art-final', 'yellow-missions', 'card-rules').includes(label);
const build = resolveCandidate(root, 'dist/' + label);
const runtime = path.join(build, 'win-unpacked');
const identity = require('../release-identity.json');
const exeName = identity.productName + '.exe';
const installer = path.join(build, `HD2-Chaos-Slot-Machine-Setup-local-${label}-win-x64.exe`);
const evidence = path.join(root, `.test-data/${label}-artifact-inspection`);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const equalFiles = (a, b) => assert(fs.readFileSync(a).equals(fs.readFileSync(b)), `Byte parity: ${a}`);
const sevenZip = path.join(root, 'node_modules/electron-winstaller/vendor/7z.exe');
function seven(args) {
  const result = spawnSync(sevenZip, args, { windowsHide: true, maxBuffer: 400 * 1024 * 1024, timeout: 120000 });
  if (result.error || result.status !== 0) throw Error('Archive inspection failed: ' + (result.error?.message || result.stderr.toString()));
  return result.stdout;
}
function files(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    assert(!entry.isSymbolicLink(), 'Unexpected linked file');
    return entry.isDirectory() ? files(path.join(dir, entry.name), prefix + entry.name + '/') : [prefix + entry.name];
  });
}
(async () => {
  fs.mkdirSync(evidence, { recursive: true });
  const archive = path.join(runtime, 'resources/app.asar');
  const entries = [];
  for (const name of asar.listPackage(archive)) {
    const relative = name.replace(/^[/\\]+/, '');
    const stat = asar.statFile(archive, relative);
    if (stat.files) continue;
    assert(!stat.link && !stat.unpacked, relative);
    const source = path.resolve(root, relative);
    assert(source.startsWith(root + path.sep), 'Source escaped checkout');
    const actual = asar.extractFile(archive, relative), expected = fs.readFileSync(source);
    if (relative === 'package.json') {
      const a = JSON.parse(actual), b = JSON.parse(expected);
      for (const key of ['name', 'version', 'main', 'description', 'author', 'license']) assert.deepEqual(a[key], b[key]);
    } else assert(actual.equals(expected), `Source parity: ${relative}`);
    entries.push({ file: relative.replaceAll('\\', '/'), sha256: hash(actual) });
  }
  const legal = files(path.join(root, 'licenses/installer')).map(file => 'licenses/installer/' + file);
  const helperFiles = replacedShell ? ['licenses/hd2-shell/integration.nsh', 'licenses/hd2-shell/shell-properties.nsh'] : [];
  const builderFiles = auditedNotices ? ['licenses/builder/LICENSE.txt', 'licenses/builder/README.md'] : [];
  const external = ['README-FIRST.txt', 'LICENSE.txt', 'NOTICE.txt', 'THIRD_PARTY_NOTICES.md', 'SECURITY.md', 'resources/build/icon.ico', 'resources/build/icon.png', ...legal, ...helperFiles, ...builderFiles];
  for (const file of external) equalFiles(path.join(runtime, file), path.join(root, file.replace(/^resources\//, '').replace(/^licenses\/hd2-shell\//, 'installer/')));
  equalFiles(archive, path.join(build, 'verify-win-zip/resources/app.asar'));
  const fuses = await getCurrentFuseWire(path.join(runtime, exeName));
  for (const [index, state] of Object.entries({ 0: 48, 2: 48, 3: 48, 4: 49, 5: 49, 7: 49 })) assert.equal(fuses[index], state, `Fuse ${index}`);
  const members = installerMembers(seven(['l', '-slt', installer]).toString());
  const manifest = require('../licenses/installer/manifest.json');
  const pluginMatches = manifest.pluginMatches.filter(row => !replacedShell || !row.member.endsWith('/WinShell.dll')).map(row => {
    const basename = row.member.split('/').pop();
    const member = members.filter(file => file.endsWith('/' + basename));
    assert.equal(member.length, 1);
    const sha256 = hash(seven(['e', '-so', installer, member[0].replaceAll('/', path.sep)]));
    assert.equal(sha256, row.sha256, 'Installer plugin changed: ' + basename);
    return { file: member[0], sha256, upstreamArchive: row.archive };
  });
  let uninstallerReport = null;
  let componentReview = null;
  if (replacedShell) {
    require('./prepare-installer-shell').assertPrepared(root);
    assert(!members.some(name => /winshell/i.test(name)), 'Installer contains WinShell');
    const outerPlugins = members.filter(name => name.endsWith('.dll')).map(name => path.win32.basename(name)).sort();
    assert.deepEqual(outerPlugins, ['System.dll', 'UAC.dll', 'StdUtils.dll', 'nsDialogs.dll', 'nsExec.dll', 'nsis7z.dll'].sort());
    const uninstallerMembers = members.filter(name => name.endsWith('/Uninstall ' + exeName));
    assert.equal(uninstallerMembers.length, 1, 'Signed-uninstaller generation path must embed its output');
    const uninstallerBytes = seven(['e', '-so', installer, uninstallerMembers[0].replaceAll('/', path.sep)]);
    assert.equal(uninstallerBytes.subarray(0, 2).toString(), 'MZ');
    const uninstaller = path.join(evidence, 'embedded-uninstaller.exe');
    writeDurable(uninstaller, uninstallerBytes);
    const listing = seven(['l', '-slt', uninstaller]).toString();
    writeDurable(path.join(evidence, 'uninstaller-list.txt'), listing);
    const unMembers = installerMembers(listing);
    assert(unMembers.includes('$PLUGINSDIR/System.dll'));
    assert(!unMembers.some(name => /winshell/i.test(name)), 'Embedded uninstaller contains WinShell');
    writeDurable(path.join(evidence, 'uninstaller-integrity.log'), seven(['t', uninstaller]));
    uninstallerReport = { sha256: hash(uninstallerBytes), files: unMembers, winShellAbsent: true, executed: false };
    if (auditedNotices) {
      const policy = require('./installer-component-policy');
      policy.verifySourceMaterials(root);
      const inspect = (archiveFile, paths, kind) => policy.reviewComponents(paths.filter(name => /\.(dll|bmp)$/i.test(name)).map(name => ({
        file: path.win32.basename(name), sha256: hash(seven(['e', '-so', archiveFile, name.replaceAll('/', path.sep)])),
      })), kind);
      componentReview = { installer: inspect(installer, members, 'installer'), uninstaller: inspect(uninstaller, unMembers, 'uninstaller'), builderNotice: policy.verifyBuilderNotice(root) };
    }
  }
  const payload = members.filter(name => name.endsWith('/app-64.7z'));
  assert.equal(payload.length, 1);
  writeDurable(path.join(evidence, 'outer-integrity.log'), seven(['t', installer]));
  const inner = path.join(evidence, 'app-64.7z');
  writeDurable(inner, seven(['e', '-so', installer, payload[0].replaceAll('/', path.sep)]));
  writeDurable(path.join(evidence, 'inner-integrity.log'), seven(['t', inner]));
  // Only extract explicitly selected known files to memory, never archive paths to disk.
  const embedded = [exeName, 'resources/app.asar', ...external, 'LICENSE.electron.txt', 'LICENSES.chromium.html'];
  const comparisons = embedded.map(file => {
    const actual = seven(['e', '-so', inner, file.replaceAll('/', path.sep)]);
    assert(actual.equals(fs.readFileSync(path.join(runtime, file))), `Installer payload differs: ${file}`);
    return { file, sha256: hash(actual) };
  });
  const report = { passed: true, at: new Date().toISOString(), sourceFiles: entries.length, legalFiles: legal.length,
    installer, installerSha256: hash(fs.readFileSync(installer)), asarSha256: hash(fs.readFileSync(archive)),
    exeSha256: hash(fs.readFileSync(path.join(runtime, exeName))), fuses, zipAsarCompared: true,
    installerExecuted: false, winShellAbsent: replacedShell, uninstaller: uninstallerReport, componentReview, pluginMatches, embeddedComparisons: comparisons, externalFiles: external, sourceComparisons: entries };
  writeJson(path.join(evidence, 'report.json'), report);
  console.log(JSON.stringify({ ...report, sourceComparisons: undefined, embeddedComparisons: comparisons.length }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
