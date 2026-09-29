'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {PNG}=require('pngjs');
const root=path.resolve(__dirname,'..'), manifest=require('../assets/missions/game-icons/provenance.json');
const sandbox={};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/mission-ui.js'),'utf8'),sandbox);
const catalog=require('../assets/mission-catalog.json');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('60 exact mission identities have credited, hash-verified local game crops',()=>{
  assert.equal(manifest.entries.length,60); assert.equal(new Set(manifest.entries.map(e=>e.id)).size,60);
  assert.match(manifest.rightsStatus,/unestablished/);
  for(const e of manifest.entries){
    assert.ok(catalog.missions.some(m=>m.id===e.id));
    assert.equal(e.file,e.id.slice(8)+'.png');
    const sources={
      'mission:eradicate-automatons':['www.inkl.com','cdn.mos.cms.futurecdn.net'],
      'mission:eradicate-terminids':['steamcommunity.com','images.steamusercontent.com'],
      'mission:evacuate-high-value-assets':['www.gameleap.com','cdn.gameleap.com'],
      'mission:nuke-nursery':['n4g.com','n4g.com'],
      'mission:chart-terminid-tunnels':['n4g.com','n4g.com']
    };
    const hosts=e.capture ? ['www.youtube.com','www.youtube.com'] : sources[e.id]||['helldivers.wiki.gg','helldivers.wiki.gg'];
    assert.deepEqual([new URL(e.sourcePage).hostname,new URL(e.sourceUrl).hostname],hosts);
    assert.ok(e.uploader); assert.match(e.sourceSha256,/^[a-f0-9]{64}$/);
    const bytes=fs.readFileSync(path.join(root,'assets/missions/game-icons',e.file)),png=PNG.sync.read(bytes);
    assert.equal(hash(bytes),e.outputSha256);assert.equal(png.width,e.crop[2]);assert.equal(png.height,e.crop[3]);
    const visual=sandbox.HD2MissionUI.visualFor({id:e.id});
    assert.equal(visual.src,'assets/missions/game-icons/'+e.file);assert.match(visual.title,/In-game.*screenshot crop/);
    assert.equal(require('../electron/local-protocol').resolveRequest('hd2-slot://app/'+visual.src).status,200);
    assert.equal(require('../scripts/audit-distribution').assetGroup(visual.src),'mission-game-screenshot-crops');
  }
});
test('all catalog missions have exact crops and unknown missions retain an original fallback',()=>{
  const ids=new Set(manifest.entries.map(e=>e.id)),remaining=catalog.missions.filter(m=>!ids.has(m.id));
  assert.equal(remaining.length,0);
  for(const row of remaining){const v=sandbox.HD2MissionUI.visualFor(row);assert.match(v.src,/\.svg$/);assert.match(v.title,/placeholder/);}
  for(const id of ['custom:launch-icbm','mission:launch-icbm/../../a','__proto__']) assert.equal(sandbox.HD2MissionUI.visualFor({id,name:'Launch ICBM'}).src,'assets/missions/custom.svg');
});
test('card sector history resolves only its archive, not the mission artwork build',()=>{
  const {resolveCandidate}=require('../scripts/audit-distribution');
  const archived=path.join(root,'.test-data/accepted-builds/card-sector');
  assert.equal(resolveCandidate(root,'dist/card-sector',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/card-sector',()=>true),path.join(root,'dist/card-sector'));
  assert.equal(resolveCandidate(root,'dist/mission-game-art',p=>p===archived),path.join(root,'dist/mission-game-art'));
});
test('first mission art preview recovery does not substitute the second batch',()=>{
  const {resolveCandidate}=require('../scripts/audit-distribution');
  const archived=path.join(root,'.test-data/accepted-builds/mission-game-art');
  assert.equal(resolveCandidate(root,'dist/mission-game-art',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/mission-game-art',()=>true),path.join(root,'dist/mission-game-art'));
  assert.equal(resolveCandidate(root,'dist/mission-art-2',p=>p===archived),path.join(root,'dist/mission-art-2'));
});
test('E-711, Commando and Illuminate additions retain distinct exact mission mappings',()=>{
  for(const id of ['mobile-e711-extraction','extract-e711','restart-pumps','commando-acquire-evidence','commando-extract-intel','commando-secure-black-box','extract-anomalous-material','destroy-gazer-spire']){
    const entry=manifest.entries.find(e=>e.id==='mission:'+id);assert.ok(entry);assert.equal(entry.retrievedAt,'2026-09-28');
    assert.equal(sandbox.HD2MissionUI.visualFor({id:entry.id}).src,'assets/missions/game-icons/'+id+'.png');
  }
});
test('retained screenshot sources reproduce every crop pixel exactly',{skip:!fs.existsSync(path.join(root,'.test-data/mission-game-icon-sources/originals'))},()=>{
  for(const e of manifest.entries){
    if(e.downloadFile){
      assert.equal(path.basename(e.downloadFile),e.downloadFile);assert.match(e.decode,/RGBA decode only/);
      assert.equal(hash(fs.readFileSync(path.join(root,'.test-data/mission-game-icon-sources/originals',e.downloadFile))),e.downloadSha256);
    }
    const bytes=fs.readFileSync(path.join(root,'.test-data/mission-game-icon-sources/originals',e.sourceFile));assert.equal(hash(bytes),e.sourceSha256);
    const source=PNG.sync.read(bytes),crop=PNG.sync.read(fs.readFileSync(path.join(root,'assets/missions/game-icons',e.file)));
    const expected=new PNG({width:crop.width,height:crop.height});PNG.bitblt(source,expected,...e.crop,0,0);assert.deepEqual(crop.data,expected.data,e.id);
  }
});
test('Eradicate factions keep different verified badges; Illuminate defense has its own evidence',()=>{
  const ids=['eradicate-automatons','eradicate-terminids','evacuate-high-value-assets'];
  const entries=ids.map(id=>manifest.entries.find(e=>e.id==='mission:'+id));
  assert.ok(entries.every(Boolean));assert.equal(new Set(entries.map(e=>e.outputSha256)).size,3);
  assert.match(sandbox.HD2MissionUI.visualFor({id:'mission:defend-evacuation-site'}).title,/screenshot crop/);
});

test('final seven retain video capture timestamps, source identity and honest pixel provenance',()=>{
  const entries=manifest.entries.filter(e=>e.capture);
  assert.equal(entries.length,7);
  for(const e of entries){
    assert.match(e.capture.method,/rendered video, not original encoded game pixels/);
    assert.ok(Number.isInteger(e.capture.timestampSeconds));
    assert.equal(new URL(e.sourceUrl).searchParams.get('t'),e.capture.timestampSeconds+'s');
    assert.ok(e.capture.evidence.length>20);
    assert.match(e.resolutionNote,/compression and scaling/);
  }
});
test('batch two archive recovery never substitutes batch three',()=>{
  const {resolveCandidate}=require('../scripts/audit-distribution');
  const archived=path.join(root,'.test-data/accepted-builds/mission-art-2');
  assert.equal(resolveCandidate(root,'dist/mission-art-2',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/mission-art-2',()=>true),path.join(root,'dist/mission-art-2'));
  assert.equal(resolveCandidate(root,'dist/mission-art-3',p=>p===archived),path.join(root,'dist/mission-art-3'));
});
test('Harvester, Nursery and Tunnel badges retain their own screenshot identity',()=>{
  for(const id of ['destroy-harvesters','nuke-nursery','chart-terminid-tunnels']){
    const row=manifest.entries.find(e=>e.id==='mission:'+id);assert.ok(row);
    assert.equal(sandbox.HD2MissionUI.visualFor({id:row.id}).src,'assets/missions/game-icons/'+id+'.png');
  }
  assert.match(manifest.entries.find(e=>e.id==='mission:nuke-nursery').resolutionNote,/Small source badge/);
});
test('batch three archive recovery never substitutes batch four',()=>{
  const {resolveCandidate}=require('../scripts/audit-distribution');
  const archived=path.join(root,'.test-data/accepted-builds/mission-art-3');
  assert.equal(resolveCandidate(root,'dist/mission-art-3',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/mission-art-3',()=>true),path.join(root,'dist/mission-art-3'));
  assert.equal(resolveCandidate(root,'dist/mission-art-4',p=>p===archived),path.join(root,'dist/mission-art-4'));
});

test('batch four recovery never substitutes the final artwork preview',()=>{
  const {resolveCandidate}=require('../scripts/audit-distribution');
  const archived=path.join(root,'.test-data/accepted-builds/mission-art-4');
  assert.equal(resolveCandidate(root,'dist/mission-art-4',p=>p===archived),archived);
  assert.equal(resolveCandidate(root,'dist/mission-art-4',()=>true),path.join(root,'dist/mission-art-4'));
  assert.equal(resolveCandidate(root,'dist/mission-art-final',p=>p===archived),path.join(root,'dist/mission-art-final'));
});
