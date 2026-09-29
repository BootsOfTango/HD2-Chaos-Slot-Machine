'use strict';
// Inventory actual shipped bytes. Enumeration and attribution are not legal clearance.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const asar = require('@electron/asar');
const ROOT = path.resolve(__dirname, '..');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const media = /\.(png|jpe?g|svg|ico|webp|gif|woff2?|ttf|otf|mp3|wav|ogg)$/i;
const normalize = value => value.replaceAll('\\', '/').replace(/^\//, '');
function decode(value) {
  return value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_m, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1),16) : Number(n)))
    .replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
}
function noticeIndex(html) {
  const blocks = html.split('<div class="product">').slice(1);
  if (!blocks.length) throw Error('Unrecognized runtime notices format');
  return blocks.map((block,index) => {
    const title = /<span class="title">([\s\S]*?)<\/span>/.exec(block);
    const license = /<pre>([\s\S]*?)<\/pre>/.exec(block);
    if (!title || !license || !license[1].trim()) throw Error('Incomplete runtime notice section');
    const homepage = /<span class="homepage"><a href="([^"]+)"/.exec(block);
    return { section:index+1, component:decode(title[1]), homepage:homepage ? decode(homepage[1]) : null,
      licenseTextSha256:hash(Buffer.from(decode(license[1]))), licenseTextLocation:'LICENSES.chromium.html',
      scope:'upstream notice entry; not proof every listed component is used at runtime' };
  });
}
function walk(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes:true }).sort((a,b)=>a.name.localeCompare(b.name,'en')).flatMap(entry => {
    const relative = prefix + entry.name, target = path.join(directory,entry.name);
    if (entry.isSymbolicLink()) throw Error('Linked inventory input: '+relative);
    return entry.isDirectory() ? walk(target,relative+'/') : [{ file:relative, bytes:fs.statSync(target).size, sha256:hash(fs.readFileSync(target)) }];
  });
}
function assetGroup(file) {
  if (file.startsWith('assets/catalog-additions/ironclad/')) return file.endsWith('.svg') ? 'project-ironclad-symbols-origin-review' : file.endsWith('/cover.jpg') ? 'publisher-promotional-warbond-covers' : 'ironclad-game-artwork';
  if (/^(build\/icon\.(ico|png)|assets\/branding\/hd2csm-emblem.png)$/.test(file)) return 'project-branding-origin-review';
  if (file.startsWith('assets/placeholders/')) return 'project-placeholders-origin-review';
  if (file.startsWith('assets/missions/game-icons/')) return 'mission-game-screenshot-crops';
  if (file.startsWith('assets/missions/')) return 'project-mission-symbols-origin-review';
  if (file.startsWith('assets/planets/')) return 'project-planet-illustrations-origin-review';
  if (file.startsWith('assets/new-gear/')) return 'warhammer-and-campaign-artwork';
  if (file.startsWith('assets/catalog-additions/')) return 'hyena-and-killzone-artwork';
  if (file.startsWith('assets/warbonds/official/')) return 'publisher-promotional-warbond-covers';
  if (file.startsWith('assets/warbonds/')) return 'other-warbond-artwork';
  if (file.startsWith('assets/weapons/')) return 'weapon-artwork-and-legacy-alternatives';
  if (file.startsWith('assets/stratagems/')) return 'legacy-stratagem-artwork';
  if (file.startsWith('assets/boosters/')) return 'booster-tracings-and-legacy-alternatives';
  if (file.startsWith('assets/factions/')) return 'faction-symbols';
  if (/youtube/i.test(file)) return 'channel-or-platform-branding';
  return 'legacy-logo-rank-or-unclassified-artwork';
}
function installerMembers(listing) {
  const body = listing.split(/\r?\n----------\r?\n/);
  if (body.length !== 2) throw Error('Unrecognized installer listing');
  const names = [...body[1].matchAll(/^Path = (.+)\r?$/gm)].map(match=>normalize(match[1].trim()));
  if (!names.length || new Set(names).size !== names.length || names.some(name=>!/^\$(PLUGINSDIR|R0)\/[\w .-]+$/.test(name))) {
    throw Error('Unsafe, duplicate or empty installer entries');
  }
  return names;
}
function installerInventory(root, candidateRoot, archives, profile='legacy-winshell') {
  const installers=archives.filter(row=>row.file.endsWith('.exe'));
  if (installers.length!==1) throw Error('Expected exactly one reviewed installer');
  const exe=path.join(candidateRoot,installers[0].file);
  // This extracts bytes to memory only. It never executes the installer or its plugins.
  const sevenZip=path.join(root,'node_modules/electron-winstaller/vendor/7z.exe');
  const run=args=>{
    const result=spawnSync(sevenZip,args,{windowsHide:true,maxBuffer:8*1024*1024,timeout:30000});
    if(result.error || result.status!==0) throw Error('Installer inspection failed: '+(result.error?.message || result.stderr.toString()));
    return result.stdout;
  };
  const members=installerMembers(run(['l','-slt',exe]).toString());
  const expected=['System.dll','UAC.dll','StdUtils.dll','nsDialogs.dll','nsExec.dll','nsis7z.dll',...(profile==='legacy-winshell'?['WinShell.dll']:[])].sort();
  const plugins=members.filter(name=>name.endsWith('.dll')).map(name=>name.split('/').pop()).sort();
  if(JSON.stringify(plugins)!==JSON.stringify(expected)) throw Error('Installer plugin set changed; review required');
  const components=members.filter(name=>!name.endsWith('/app-64.7z')).map(file=>{
    const bytes=run(['e','-so',exe,file.replaceAll('/',path.sep)]);
    if(!bytes.length) throw Error('Empty installer member: '+file);
    return {file,bytes:bytes.length,sha256:hash(bytes),licenseReview:'pending exact-version notices and source obligations'};
  });
  if(profile==='project-shell') {
    const policy=require('./installer-component-policy');
    const matches=policy.reviewComponents(components.filter(c=>/\.(dll|bmp)$/i.test(c.file)).map(c=>({...c,file:c.file.split('/').pop()})),'installer');
    return {tool:'electron-winstaller/vendor/7z.exe',toolSha256:hash(fs.readFileSync(sevenZip)),
      scope:'Current outer installer only, not embedded uninstaller acceptance. No installer code executed.',
      members,components,pluginCount:plugins.length,componentMatches:matches,sourceMaterials:policy.verifySourceMaterials(root),
      unresolved:['Final embedded-uninstaller and published-artifact revalidation are separate gates; matching component hashes is not legal clearance.']};
  }
  return {tool:'electron-winstaller/vendor/7z.exe',toolSha256:hash(fs.readFileSync(sevenZip)),
    scope:'Outer installer members only; application payload inventoried separately. No installer code executed.',
    members,components,pluginCount:plugins.length,
    unresolved:['Exact shipped StdUtils and nsis7z source/version mapping and LGPL compliance materials.',
      'NSIS/core, UAC and WinShell exact-version notices; Freeware label is not a complete license analysis.',
      'Embedded uninstaller and installer artwork attribution review.']};
}
function provenanceRecords(files, read) {
  const records = new Map();
  const add = (file, record) => { if (!records.has(file)) records.set(file,[]); records.get(file).push(record); };
  const mappings = JSON.parse(read('assets/item-images.json'));
  for (const row of Object.values(mappings).filter(Array.isArray).flat()) if (row.assetPath) {
    const source = Object.fromEntries(Object.entries(row).filter(([key]) => /source|wiki|author|contributor|license|condition|artwork|imageUrl/i.test(key)));
    add(row.assetPath,{ record:'assets/item-images.json', id:row.id, name:row.name, metadata:source });
  }
  for (const file of files.filter(name => name.endsWith('/provenance.json'))) {
    const data = JSON.parse(read(file));
    if (file === 'assets/missions/game-icons/provenance.json') {
      for (const row of data.entries || []) add('assets/missions/game-icons/' + row.file, {
        record:file, id:row.id, sourcePage:row.sourcePage, imageUrl:row.sourceUrl,
        contributor:row.uploader, sourceKind:data.kind, recordedSha256:row.outputSha256,
        sourceSha256:row.sourceSha256, crop:row.crop, limitation:data.rightsStatus
      });
    }
    for (const row of data.assets || []) if (row.assetPath) add(row.assetPath,{ record:file,
      name:row.name, sourcePage:row.sourcePage, filePage:row.filePage, imageUrl:row.imageUrl,
      contributor:row.contributor, sourceKind:row.sourceKind, recordedSha256:row.sha256,
      useCondition:row.useCondition, limitation:row.limitation });
  }
  return records;
}
function resolveCandidate(root, candidate, exists = fs.existsSync) {
  const logicalRoot = path.resolve(root,candidate);
  const relative = path.relative(path.join(root,'dist'),logicalRoot);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw Error('Inventory candidate must be a child of project dist');
  if (logicalRoot === path.join(root,'dist/card-rules') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/card-rules');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/yellow-missions') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/yellow-missions');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-art-final') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-art-final');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-art-4') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-art-4');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-art-3') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-art-3');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-art-2') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-art-2');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-game-art') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-game-art');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/card-sector') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/card-sector');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/runtime-patch') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/runtime-patch');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/weapon-thumbs') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/weapon-thumbs');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/ironclad-art') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/ironclad-art');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/fan-notice') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/fan-notice');
    if (exists(archived)) return archived;
  }
  // Keep the original evidence's logical path/content unchanged after the
  // hash-verified cleanup. Never substitute a newer build for this old report.
  if (logicalRoot === path.join(root,'dist/protected-startup-review') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/desktop-cleanup-2026-09-16/superseded-protected-startup-candidate/protected-startup-review');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/combined-preview') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/combined-preview');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/installer-notices') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/installer-notices');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/live-war') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/live-war');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/armory-browser') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/armory-browser');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-planner') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-planner');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-visual') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-visual');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-basics') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-basics');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/planet-art') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/planet-art');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-symbols') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-symbols');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/tidy-card') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/tidy-card');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/firepower') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/firepower');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-factions') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-factions');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-sabotage') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-sabotage');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-illuminate') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-illuminate');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-clean') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-clean');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/galaxy-map') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/galaxy-map');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/galaxy-conditions') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/galaxy-conditions');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/card-planets') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/card-planets');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/activity-map') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/activity-map');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/ironclad-gear') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/ironclad-gear');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/eligible-map') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/eligible-map');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/themed-names') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/themed-names');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-city') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-city');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-regional') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-regional');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/card-entry') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/card-entry');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/solo-score') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/solo-score');
    if (exists(archived)) return archived;
  }
  if (logicalRoot === path.join(root,'dist/mission-lines') && !exists(logicalRoot)) {
    const archived = path.join(root,'.test-data/accepted-builds/mission-lines');
    if (exists(archived)) return archived;
  }
  return logicalRoot;
}
function buildInventory({ root=ROOT, candidate='dist/protected-startup-review', reviewedAt='2026-09-16', installerProfile='legacy-winshell' } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt) || new Date(reviewedAt).toISOString().slice(0,10)!==reviewedAt) throw Error('Explicit valid inventory review date required');
  if (!['legacy-winshell','project-shell'].includes(installerProfile)) throw Error('Unknown installer review profile');
  const candidateRoot = resolveCandidate(root,candidate);
  const runtime = path.join(candidateRoot,'win-unpacked'), archive = path.join(runtime,'resources/app.asar');
  const runtimeFiles = walk(runtime);
  const native = file => file.split('/').join(path.sep);
  const appFiles = asar.listPackage(archive).map(normalize).filter(file=>!asar.statFile(archive,native(file)).files).sort();
  const read = file => asar.extractFile(archive,native(file));
  const appInventory = appFiles.map(file => { const stat=asar.statFile(archive,native(file)); if (stat.link || stat.unpacked) throw Error('Unsupported ASAR entry'); const bytes=read(file); return {file,bytes:bytes.length,sha256:hash(bytes)}; });
  const appPackage = JSON.parse(read('package.json'));
  const lock = JSON.parse(fs.readFileSync(path.join(root,'package-lock.json')));
  const buildPackages = Object.entries(lock.packages).filter(([name])=>name).map(([name,entry])=>({ path:name, version:entry.version,
    reportedLicense:entry.license || null, dev:entry.dev===true, optional:entry.optional===true, integrity:entry.integrity || null }));
  const notices = noticeIndex(fs.readFileSync(path.join(runtime,'LICENSES.chromium.html'),'utf8'));
  const references = provenanceRecords(appFiles,read);
  const art = appInventory.filter(row=>media.test(row.file)).map(row=>({ ...row, group:assetGroup(row.file),
    permissionStatus:'not-established-by-this-inventory', sourceRecords:references.get(row.file)||[],
    limitation:'A source URL, matching hash, local generation or an embedded credit is not automatically a redistribution grant.' }));
  const noticePaths = ['LICENSE.electron.txt','LICENSES.chromium.html','LICENSE.txt','NOTICE.txt','THIRD_PARTY_NOTICES.md','SECURITY.md'];
  const noticeChecks = noticePaths.map(file=>{ const row=runtimeFiles.find(r=>r.file===file); if(!row) throw Error('Missing shipped notice: '+file); return row; });
  const upstream = ['LICENSE.electron.txt','LICENSES.chromium.html'].map(file=>({ file,
    matchesLockedElectron:hash(fs.readFileSync(path.join(root,'node_modules/electron/dist',file==='LICENSE.electron.txt'?'LICENSE':file)))===runtimeFiles.find(r=>r.file===file).sha256 }));
  if(upstream.some(row=>!row.matchesLockedElectron)) throw Error('Electron notices differ from the installed locked runtime');
  const archives = fs.readdirSync(candidateRoot).filter(name=>/\.(exe|zip)$/.test(name)).sort().map(file=>({file,bytes:fs.statSync(path.join(candidateRoot,file)).size,sha256:hash(fs.readFileSync(path.join(candidateRoot,file)))}));
  const installer = installerInventory(root,candidateRoot,archives,installerProfile);
  const grouped = art.reduce((acc,row)=>{ acc[row.group]=(acc[row.group]||0)+1;return acc; },{});
  return { schemaVersion:1, reviewedAt, scope:'Observed existing local candidate; not final official release clearance or complete SPDX SBOM', candidate:normalize(path.relative(root,path.resolve(root,candidate))),
    package:{name:appPackage.name,version:appPackage.version}, artifacts:archives, installer,
    electron:{lockedVersion:lock.packages['node_modules/electron']?.version,upstreamNoticeParity:upstream},
    counts:{runtimeFiles:runtimeFiles.length,asarFiles:appInventory.length,bundledMedia:art.length,upstreamNoticeSections:notices.length,
      npmLockEntries:buildPackages.length,asarNodeModules:appFiles.filter(f=>f.startsWith('node_modules/')).length,assetsWithoutIndividualSourceRecord:art.filter(r=>!r.sourceRecords.length).length},
    artworkGroups:grouped, shippedNotices:noticeChecks, runtimeFiles, appFiles:appInventory, upstreamNoticeIndex:notices,
    buildTimeNpmGraph:{scope:'Lockfile metadata, not the shipped runtime dependency list. Electron is declared dev-only but its binary is distributed.',packages:buildPackages},
    artwork:art, limits:['Notice entries can include upstream build/test/optional components; no inferred runtime usage.',
      'Installer plugins require separate license review; they are not npm runtime dependencies.',
      'Asset rights are unresolved; source attribution and local hashes do not grant permission.',
      'No attribution, ownership, patent or license-compliance legal opinion is made.'] };
}
if (require.main===module) {
  try {
    const inventory=buildInventory();
    const output=path.join(ROOT,'docs/distribution-inventory.json');
    if(process.argv.includes('--check')) {
      if(fs.readFileSync(output,'utf8')!==JSON.stringify(inventory,null,2)+'\n') throw Error('Distribution inventory is stale; regenerate against the reviewed candidate');
    } else if(process.argv.includes('--write')) require('../electron/durable-file').writeJson(output,inventory);
    else throw Error('Use --write to generate or --check to validate the reviewed candidate inventory');
    console.log(JSON.stringify({counts:inventory.counts,artworkGroups:inventory.artworkGroups,
      selectedNoticeEntries:inventory.upstreamNoticeIndex.filter(row=>/node\.js|^chromium$|^v8$|ffmpeg|angle|icu|swiftshader|vulkan|directx|d3d|dxil/i.test(row.component)).map(row=>row.component)},null,2));
  } catch(error) { console.error(error.message);process.exitCode=1; }
}
module.exports={noticeIndex,assetGroup,installerMembers,buildInventory,resolveCandidate};
