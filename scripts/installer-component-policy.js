'use strict';
// Exact reviewed binary inputs; matching is technical evidence, not legal clearance.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { verifyMaterials } = require('./prepare-installer-licenses');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const builderHash = 'bed8d0ab3e6031817f775a641ff37313b0f5591bc8ba0ed79b978dafbd4231ce';
const components = {
  'System.dll': { sha256: '3eb38ae99653a7dbc724132ee240f6e5c4af4bfe7c01d31d23faf373f9f2eaca', source: 'nsis-3.0.4.1/Plugins/x86-unicode/System.dll', notice: 'licenses/installer/NSIS-COPYING.txt' },
  'nsDialogs.dll': { sha256: '1e40211af65923c2f4fd02ce021458a7745d28e2f383835e3015e96575632172', source: 'nsis-3.0.4.1/Plugins/x86-unicode/nsDialogs.dll', notice: 'licenses/installer/NSIS-COPYING.txt' },
  'nsExec.dll': { sha256: '5d9ceb1ce5f35aea5f9e5a0c0edeeec04dfefe0c77890c80c70e98209b58b962', source: 'nsis-3.0.4.1/Plugins/x86-unicode/nsExec.dll', notice: 'licenses/installer/NSIS-COPYING.txt' },
  'StdUtils.dll': { sha256: 'b72e9013a6204e9f01076dc38dabbf30870d44dfc66962adbf73619d4331601e', source: 'StdUtils.2018-10-27.zip/Plugins/Unicode/StdUtils.dll', notice: 'licenses/installer/LGPL-2.1.txt', clarification: 'licenses/installer/StdUtils-LGPL-CLARIFICATION.txt', sourcePackage: 'licenses/installer/sources/StdUtils.2018-10-27.sources.tbz2' },
  'UAC.dll': { sha256: '2f7f8fc05dc4fd0d5cda501b47e4433357e887bbfed7292c028d99c73b52dc08', source: 'UAC.zip/Plugins/x86-unicode/UAC.dll', notice: 'licenses/installer/UAC-License.txt', sourcePackage: 'licenses/installer/sources/UAC.zip' },
  'nsis7z.dll': { sha256: 'b393f05e8ff919ef071181050e1873c9a776e1a0ae8329aefff7007d0cadf592', source: 'Nsis7z_19.00.7z/Plugins/x86-unicode/nsis7z.dll', notice: 'licenses/installer/Nsis7z-License.txt', clarification: 'licenses/installer/Nsis7z-ReadMe.txt', sourcePackage: 'licenses/installer/sources/Nsis7z_19.00.7z', prerequisite: 'licenses/installer/sources/lzma1900.7z' },
  'modern-wizard.bmp': { sha256: '2079f7a3eba60e0d9ee827a7208aa052a71b384873b641de5e299aeb8e733109', source: 'nsis-3.0.4.1/Contrib/Graphics/Wizard/nsis3-metro.bmp', notice: 'licenses/installer/NSIS-COPYING.txt' },
};
function reviewComponents(rows, kind) {
  if (!['installer', 'uninstaller'].includes(kind)) throw Error('Unknown archive scope');
  const expected = Object.keys(components).filter(name => kind === 'installer' || name !== 'nsis7z.dll').sort();
  const actual = rows.map(row => row.file).sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw Error('Unexpected, missing or duplicate installer component');
  return rows.map(row => {
    const policy = components[row.file];
    if (row.sha256 !== policy.sha256) throw Error('Unreviewed component bytes: ' + row.file);
    return { ...row, ...policy, scope: kind, review: 'exact input matched; original notices/source retained; not legal clearance' };
  });
}
function verifyBuilderNotice(root = path.resolve(__dirname, '..')) {
  const file = path.join(root, 'licenses/builder/LICENSE.txt');
  if (hash(fs.readFileSync(file)) !== builderHash) throw Error('Builder notice changed');
  if (!fs.statSync(path.join(root, 'licenses/builder/README.md')).isFile()) throw Error('Missing builder attribution');
  for (const name of ['electron-builder', 'app-builder-lib']) {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json')));
    if (pkg.version !== '26.15.3' || pkg.license !== 'MIT') throw Error('Unreviewed builder version/license');
  }
  if (hash(fs.readFileSync(path.join(root, 'node_modules/electron-builder/LICENSE'))) !== builderHash) throw Error('Locked builder notice differs');
  return { file: 'licenses/builder/LICENSE.txt', sha256: builderHash, version: '26.15.3' };
}
function verifySourceMaterials(root = path.resolve(__dirname, '..')) {
  const manifest = verifyMaterials(root);
  const builder = verifyBuilderNotice(root);
  for (const policy of Object.values(components)) for (const field of ['notice', 'clarification', 'sourcePackage', 'prerequisite']) {
    if (policy[field] && !manifest.files.some(row => 'licenses/installer/' + row.file === policy[field])) throw Error('Missing component material: ' + policy[field]);
  }
  return { builder, components: Object.keys(components).length };
}
module.exports = { components, builderHash, reviewComponents, verifyBuilderNotice, verifySourceMaterials };
if (require.main === module) {
  try { console.log(JSON.stringify(verifySourceMaterials())); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
