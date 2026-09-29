'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const { noticeIndex, assetGroup, installerMembers, buildInventory, resolveCandidate } = require('../scripts/audit-distribution');
const snapshot = require('../docs/distribution-inventory.json');

test('card-rules history resolves only its archive, not the release candidate or installed app', () => {
  const root=path.resolve(__dirname,'..'),current=path.join(root,'dist/card-rules');
  const archived=path.join(root,'.test-data/accepted-builds/card-rules');
  assert.equal(resolveCandidate(root,'dist/card-rules',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/card-rules',()=>true),current);
  assert.equal(resolveCandidate(root,'dist/card-rules',()=>false),current);
  assert.equal(resolveCandidate(root,'dist/release-candidate',p=>p===archived),path.join(root,'dist/release-candidate'));
});

test('owner Desktop review launcher uses installed runtime without changing its save profile', () => {
  const launcher=require('node:fs').readFileSync(path.join(__dirname,'../scripts/start-card-rules-review.cmd'),'utf8');
  assert.ok(launcher.includes('set "HD2CSM_USER_DATA_DIR=%~dp0..\\.test-data\\mission-owner-review"'));
  assert.ok(launcher.includes('set "HD2CSM_REVIEW_EXE=%LOCALAPPDATA%\\Programs\\HD2 Chaos Slot Machine\\HD2 Chaos Slot Machine.exe"'));
  for (const name of ['HD2CSM_AUTOMATION','HD2_ELECTRON_TEST_HARNESS','ELECTRON_RUN_AS_NODE']) assert.ok(launcher.includes(`set "${name}="`));
  assert.ok(launcher.includes('if not exist "%HD2CSM_REVIEW_EXE%"'));
  assert.ok(launcher.includes('start "" "%HD2CSM_REVIEW_EXE%"'));
  assert.ok(!launcher.includes('dist\\') && !launcher.includes('accepted-builds\\'));
});

test('runtime patch history resolves its exact archive, never the card-sector candidate', () => {
  const root=path.resolve(__dirname,'..'),archived=path.join(root,'.test-data/accepted-builds/runtime-patch');
  assert.equal(resolveCandidate(root,'dist/runtime-patch',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/card-sector',p=>p===archived),path.join(root,'dist/card-sector'));
  assert.equal(resolveCandidate(root,'dist/runtime-patch',()=>true),path.join(root,'dist/runtime-patch'));
});

test('thumbnail history resolves only its archive, not the patched runtime', () => {
  const root=path.resolve(__dirname,'..'),archived=path.join(root,'.test-data/accepted-builds/weapon-thumbs');
  assert.equal(resolveCandidate(root,'dist/weapon-thumbs',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/runtime-patch',p=>p===archived),path.join(root,'dist/runtime-patch'));
  assert.equal(resolveCandidate(root,'dist/weapon-thumbs',()=>true),path.join(root,'dist/weapon-thumbs'));
});

test('artwork history resolves only its archive, never the clean-thumbnail candidate', () => {
  const root=path.resolve(__dirname,'..'),archived=path.join(root,'.test-data/accepted-builds/ironclad-art');
  assert.equal(resolveCandidate(root,'dist/ironclad-art',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/weapon-thumbs',p=>p===archived),path.join(root,'dist/weapon-thumbs'));
  assert.equal(resolveCandidate(root,'dist/ironclad-art',()=>true),path.join(root,'dist/ironclad-art'));
});

test('fan-notice history resolves its exact archive, never the new artwork candidate', () => {
  const root=path.resolve(__dirname,'..'),archived=path.join(root,'.test-data/accepted-builds/fan-notice');
  assert.equal(resolveCandidate(root,'dist/fan-notice',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/ironclad-art',p=>p===archived),path.join(root,'dist/ironclad-art'));
  assert.equal(resolveCandidate(root,'dist/fan-notice',()=>true),path.join(root,'dist/fan-notice'));
});

test('Ironclad history resolves only its own archive, not the new fan notice', () => {
  const root=path.resolve(__dirname,'..'),archived=path.join(root,'.test-data/accepted-builds/ironclad-gear');
  assert.equal(resolveCandidate(root,'dist/ironclad-gear',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/fan-notice',p=>p===archived),path.join(root,'dist/fan-notice'));
  assert.equal(resolveCandidate(root,'dist/ironclad-gear',()=>true),path.join(root,'dist/ironclad-gear'));
});

test('activity history resolves only its archive, not the Ironclad preview', () => {
  const root=path.resolve(__dirname,'..'),archived=path.join(root,'.test-data/accepted-builds/activity-map');
  assert.equal(resolveCandidate(root,'dist/activity-map',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/ironclad-gear',p=>p===archived),path.join(root,'dist/ironclad-gear'));
  assert.equal(resolveCandidate(root,'dist/activity-map',()=>true),path.join(root,'dist/activity-map'));
});

test('saved planets history resolves only its archive, not the activity preview', () => {
  const root=path.resolve(__dirname,'..'),archived=path.join(root,'.test-data/accepted-builds/card-planets');
  assert.equal(resolveCandidate(root,'dist/card-planets',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/activity-map',p=>p===archived),path.join(root,'dist/activity-map'));
  assert.equal(resolveCandidate(root,'dist/card-planets',()=>true),path.join(root,'dist/card-planets'));
});

test('eligible map history resolves only its archive, not the saved planet preview', () => {
  const root=path.resolve(__dirname,'..'),archived=path.join(root,'.test-data/accepted-builds/eligible-map');
  assert.equal(resolveCandidate(root,'dist/eligible-map',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/card-planets',p=>p===archived),path.join(root,'dist/card-planets'));
  assert.equal(resolveCandidate(root,'dist/eligible-map',()=>true),path.join(root,'dist/eligible-map'));
});

test('themed names history resolves only its archive, not the eligible-map preview', () => {
  const root=path.resolve(__dirname,'..'),archived=path.join(root,'.test-data/accepted-builds/themed-names');
  assert.equal(resolveCandidate(root,'dist/themed-names',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/eligible-map',p=>p===archived),path.join(root,'dist/eligible-map'));
  assert.equal(resolveCandidate(root,'dist/themed-names',()=>true),path.join(root,'dist/themed-names'));
});

test('planet conditions history resolves only its archive, not the themed names preview', () => {
  const root=path.resolve(__dirname,'..'),archived=path.join(root,'.test-data/accepted-builds/galaxy-conditions');
  assert.equal(resolveCandidate(root,'dist/galaxy-conditions',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/themed-names',p=>p===archived),path.join(root,'dist/themed-names'));
  assert.equal(resolveCandidate(root,'dist/galaxy-conditions',()=>true),path.join(root,'dist/galaxy-conditions'));
});

test('old galaxy history resolves only its archive, not the conditions preview', () => {
  const root=path.resolve(__dirname,'..'),archived=path.join(root,'.test-data/accepted-builds/galaxy-map');
  assert.equal(resolveCandidate(root,'dist/galaxy-map',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/galaxy-conditions',p=>p===archived),path.join(root,'dist/galaxy-conditions'));
  assert.equal(resolveCandidate(root,'dist/galaxy-map',()=>true),path.join(root,'dist/galaxy-map'));
  assert.equal(resolveCandidate(root,'dist/galaxy-map',()=>false),path.join(root,'dist/galaxy-map'));
});

test('clean mission history resolves only its archive, not the galaxy preview', () => {
  const root=path.resolve(__dirname,'..'),archived=path.join(root,'.test-data/accepted-builds/mission-clean');
  assert.equal(resolveCandidate(root,'dist/mission-clean',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/galaxy-map',p=>p===archived),path.join(root,'dist/galaxy-map'));
  assert.equal(resolveCandidate(root,'dist/mission-clean',()=>true),path.join(root,'dist/mission-clean'));
});

test('city mission history resolves only its documented archive, not the clean panel build', () => {
  const root = path.resolve(__dirname, '..'), archived = path.join(root, '.test-data/accepted-builds/mission-city');
  assert.equal(resolveCandidate(root, 'dist/mission-city', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/mission-clean', p => p === archived), path.join(root, 'dist/mission-clean'));
  assert.equal(resolveCandidate(root, 'dist/mission-city', () => true), path.join(root, 'dist/mission-city'));
  assert.equal(resolveCandidate(root, 'dist/mission-city', () => false), path.join(root, 'dist/mission-city'));
});

test('regional mission history resolves only its documented archive', () => {
  const root = path.resolve(__dirname, '..'), archived = path.join(root, '.test-data/accepted-builds/mission-regional');
  assert.equal(resolveCandidate(root, 'dist/mission-regional', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/mission-city', p => p === archived), path.join(root, 'dist/mission-city'));
  assert.equal(resolveCandidate(root, 'dist/mission-regional', () => true), path.join(root, 'dist/mission-regional'));
});

test('Illuminate mission history resolves only its documented archive', () => {
  const root = path.resolve(__dirname, '..'), archived = path.join(root, '.test-data/accepted-builds/mission-illuminate');
  assert.equal(resolveCandidate(root, 'dist/mission-illuminate', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/mission-regional', p => p === archived), path.join(root, 'dist/mission-regional'));
  assert.equal(resolveCandidate(root, 'dist/mission-illuminate', () => true), path.join(root, 'dist/mission-illuminate'));
});

test('sabotage mission history resolves only its documented archive', () => {
  const root = path.resolve(__dirname, '..'), archived = path.join(root, '.test-data/accepted-builds/mission-sabotage');
  assert.equal(resolveCandidate(root, 'dist/mission-sabotage', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/mission-illuminate', p => p === archived), path.join(root, 'dist/mission-illuminate'));
  assert.equal(resolveCandidate(root, 'dist/mission-sabotage', () => true), path.join(root, 'dist/mission-sabotage'));
});

test('faction mission history resolves only its documented archive', () => {
  const root = path.resolve(__dirname, '..'), archived = path.join(root, '.test-data/accepted-builds/mission-factions');
  assert.equal(resolveCandidate(root, 'dist/mission-factions', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/mission-sabotage', p => p === archived), path.join(root, 'dist/mission-sabotage'));
  assert.equal(resolveCandidate(root, 'dist/mission-factions', () => true), path.join(root, 'dist/mission-factions'));
});

test('Firepower history resolves only its exact archive after safe promotion', () => {
  const root = path.resolve(__dirname, '..');
  const archived = path.join(root, '.test-data/accepted-builds/firepower');
  assert.equal(resolveCandidate(root, 'dist/firepower', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/mission-factions', p => p === archived), path.join(root, 'dist/mission-factions'));
  assert.equal(resolveCandidate(root, 'dist/firepower', () => true), path.join(root, 'dist/firepower'));
});

test('notice index preserves license text identity and decodes upstream entities', () => {
  const text='Terms & conditions <retained>.';
  const rows=noticeIndex('<div class="product"><span class="title">A &amp; B</span><span class="homepage"><a href="https://example.org/?a=1&amp;b=2">home</a></span><pre>Terms &amp; conditions &lt;retained&gt;.</pre>');
  assert.equal(rows[0].component,'A & B');
  assert.equal(rows[0].homepage,'https://example.org/?a=1&b=2');
  assert.equal(rows[0].licenseTextSha256,crypto.createHash('sha256').update(text).digest('hex'));
});
test('missing or malformed runtime notices fail closed', () => {
  for(const html of ['', '<div class="product"><pre>terms</pre>', '<div class="product"><span class="title">A</span><pre> </pre>']) assert.throws(()=>noticeIndex(html));
});
test('installer parser rejects changed, duplicate and unsafe member paths', () => {
  const listing=names=>'header\r\n----------\r\n'+names.map(name=>'Path = '+name+'\r\nSize = 123\r\n').join('\r\n');
  assert.deepEqual(installerMembers(listing(['$PLUGINSDIR\\StdUtils.dll','$R0\\Uninstall App.exe'])),['$PLUGINSDIR/StdUtils.dll','$R0/Uninstall App.exe']);
  for(const names of [[],['../file'],['$PLUGINSDIR/../file'],['C:/file'],['$PLUGINSDIR/a.dll','$PLUGINSDIR/a.dll']]) assert.throws(()=>installerMembers(listing(names)));
  assert.throws(()=>installerMembers('Path = $PLUGINSDIR/a.dll'));
});
test('unclassified artwork is never auto-cleared by grouping', () => {
  assert.equal(assetGroup('future/new.png'),'legacy-logo-rank-or-unclassified-artwork');
  assert.match(assetGroup('assets/placeholders/example.svg'),/origin-review/);
  assert.match(assetGroup('build/icon.ico'),/origin-review/);
  assert.ok(snapshot.artwork.every(row=>row.permissionStatus==='not-established-by-this-inventory'));
});
test('candidate paths outside project dist are rejected before reads', () => {
  for(const candidate of ['dist','../outside','assets']) assert.throws(()=>buildInventory({candidate}),/child of project dist/);
});
test('combined historical candidate resolves only its documented archive', () => {
  const root = path.resolve(__dirname, '..');
  const archived = path.join(root, '.test-data/accepted-builds/combined-preview');
  assert.equal(resolveCandidate(root, 'dist/combined-preview', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/installer-notices', p => p === archived), path.join(root, 'dist/installer-notices'));
});

test('historical inventory resolves only its exact archive without replacing current candidates', () => {
  const root = path.resolve(__dirname,'..');
  const current = path.join(root,'dist/protected-startup-review');
  const archive = path.join(root,'.test-data/desktop-cleanup-2026-09-16/superseded-protected-startup-candidate/protected-startup-review');
  assert.equal(resolveCandidate(root,'dist/protected-startup-review',()=>true),current);
  assert.equal(resolveCandidate(root,'dist/protected-startup-review',p=>p===archive),archive);
  assert.equal(resolveCandidate(root,'dist/protected-startup-review',()=>false),current);
  assert.equal(resolveCandidate(root,'dist/combined-preview',p=>p===archive),path.join(root,'dist/combined-preview'));
  assert.throws(()=>resolveCandidate(root,'../outside',()=>true),/child of project dist/);
});
test('archived Armory preview resolves only its original runtime, never the new mission candidate', () => {
  const root = path.resolve(__dirname, '..');
  const current = path.join(root, 'dist/armory-browser'), archived = path.join(root, '.test-data/accepted-builds/armory-browser');
  assert.equal(resolveCandidate(root, 'dist/armory-browser', () => true), current);
  assert.equal(resolveCandidate(root, 'dist/armory-browser', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/mission-planner', p => p === archived), path.join(root, 'dist/mission-planner'));
});

test('saved inventory accounts for every media file and keeps build graph separate', () => {
  assert.equal(snapshot.counts.runtimeFiles,snapshot.runtimeFiles.length);
  assert.equal(snapshot.counts.asarFiles,snapshot.appFiles.length);
  assert.equal(snapshot.counts.bundledMedia,snapshot.artwork.length);
  assert.equal(snapshot.counts.upstreamNoticeSections,snapshot.upstreamNoticeIndex.length);
  assert.equal(snapshot.counts.npmLockEntries,snapshot.buildTimeNpmGraph.packages.length);
  assert.equal(Object.values(snapshot.artworkGroups).reduce((a,b)=>a+b,0),snapshot.artwork.length);
  assert.ok(snapshot.artwork.every(asset=>snapshot.appFiles.some(row=>row.file===asset.file && row.sha256===asset.sha256)));
  assert.equal(snapshot.installer.pluginCount,7);
  assert.ok(snapshot.installer.unresolved.length>0);
});

test('mission preview recovery resolves its exact archive, not the new visual picker', () => {
  const root = path.resolve(__dirname, '..');
  const current = path.join(root, 'dist/mission-planner'), archived = path.join(root, '.test-data/accepted-builds/mission-planner');
  assert.equal(resolveCandidate(root, 'dist/mission-planner', () => true), current);
  assert.equal(resolveCandidate(root, 'dist/mission-planner', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/mission-visual', p => p === archived), path.join(root, 'dist/mission-visual'));
  assert.match(assetGroup('assets/missions/rocket.svg'), /mission-symbols-origin-review/);
});

test('visual mission preview recovery cannot substitute the expanded catalog build', () => {
  const root = path.resolve(__dirname, '..');
  const current = path.join(root, 'dist/mission-visual'), archived = path.join(root, '.test-data/accepted-builds/mission-visual');
  assert.equal(resolveCandidate(root, 'dist/mission-visual', () => true), current);
  assert.equal(resolveCandidate(root, 'dist/mission-visual', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/mission-basics', p => p === archived), path.join(root, 'dist/mission-basics'));
});

test('solo score recovery cannot substitute the guided entry build', () => {
  const root=path.resolve(__dirname,'..');
  const current=path.join(root,'dist/solo-score'), archived=path.join(root,'.test-data/accepted-builds/solo-score');
  assert.equal(resolveCandidate(root,'dist/solo-score',()=>true),current);
  assert.equal(resolveCandidate(root,'dist/solo-score',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/card-entry',p=>p===archived),path.join(root,'dist/card-entry'));
});

test('line-icon recovery cannot substitute the solo scoring build', () => {
  const root = path.resolve(__dirname, '..');
  const current = path.join(root, 'dist/mission-lines'), archived = path.join(root, '.test-data/accepted-builds/mission-lines');
  assert.equal(resolveCandidate(root, 'dist/mission-lines', () => true), current);
  assert.equal(resolveCandidate(root, 'dist/mission-lines', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/solo-score', p => p === archived), path.join(root, 'dist/solo-score'));
});

test('solid mission symbol recovery cannot substitute the refined line icons build', () => {
  const root = path.resolve(__dirname, '..');
  const current = path.join(root, 'dist/mission-symbols'), archived = path.join(root, '.test-data/accepted-builds/mission-symbols');
  assert.equal(resolveCandidate(root, 'dist/mission-symbols', () => true), current);
  assert.equal(resolveCandidate(root, 'dist/mission-symbols', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/mission-lines', p => p === archived), path.join(root, 'dist/mission-lines'));
});

test('planet artwork recovery cannot substitute the redesigned mission symbols build', () => {
  const root = path.resolve(__dirname, '..');
  const current = path.join(root, 'dist/planet-art'), archived = path.join(root, '.test-data/accepted-builds/planet-art');
  assert.equal(resolveCandidate(root, 'dist/planet-art', () => true), current);
  assert.equal(resolveCandidate(root, 'dist/planet-art', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/mission-symbols', p => p === archived), path.join(root, 'dist/mission-symbols'));
});

test('basic mission preview recovery cannot substitute the planet artwork build', () => {
  const root = path.resolve(__dirname, '..');
  const current = path.join(root, 'dist/mission-basics'), archived = path.join(root, '.test-data/accepted-builds/mission-basics');
  assert.equal(resolveCandidate(root, 'dist/mission-basics', () => true), current);
  assert.equal(resolveCandidate(root, 'dist/mission-basics', p => p === archived), archived);
  assert.equal(resolveCandidate(root, 'dist/planet-art', p => p === archived), path.join(root, 'dist/planet-art'));
});
