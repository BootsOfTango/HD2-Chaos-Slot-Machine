const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const R=require('../assets/card-rules'),S=require('../assets/solo-score');
const T=require('../assets/transfer-validation'),storage=require('../electron/storage');
const transaction=require('../electron/card-recalibration');
const fixture=require('./fixtures/card-compatibility.json');
const clone=structuredClone;
const data=()=>({cards:[clone(fixture.soloV1),clone(fixture.legacy),{id:'unfinished',statsLocked:false}],settings:{rememberedPlayerName:'Synthetic'},items:{}});
function profile(t) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hd2-card-rules-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  storage.saveStateFile(dir,data());return dir;
}
test('registry is frozen, preview is pure and differentiates all supported outcomes',()=>{
  const source=data(),bytes=JSON.stringify(source),p=R.preview(source);
  assert(Object.isFrozen(R.RULES)&&Object.isFrozen(R.RULES[0].required));
  assert.deepEqual(p.counts,{update:1,incomplete:1,current:0,pending:1,blocked:0,unsupported:0});
  assert.equal(p.rows[0].before,67.5);assert.equal(p.rows[0].after,71.67);
  assert.equal(JSON.stringify(source),bytes);
});
test('confirmed candidate preserves original, inputs, notes, comments, unknown fields and pending cards',()=>{
  const source=data(),result=R.apply(source,'2026-09-28T12:00:00Z'),card=result.cards[0];
  assert.equal(result.cards.length,2);assert.equal(source.cards.length,3);
  assert.deepEqual(card.cardHistory.source,source.cards[0]);
  for(const k of ['stats','lockedStatsSnapshot','originalNote','commentNotes'])assert.deepEqual(card[k],source.cards[0][k]);
  assert.deepEqual(result.cards[1],source.cards[2]);
  assert.equal(card.soloScore.result.rating,71.67);
  assert.equal(card.cardHistory.revisions[0].ruleId,'solo-v2');
  assert.deepEqual(R.apply(result),result);
  assert(!R.preview(result).canApply);
});
test('real zero, false and zero available objectives are not missing',()=>{
  const c=clone(fixture.soloV1);
  Object.assign(c.stats,{kills:0,accuracy:0,deaths:0,blueSideObjCount:0});c.lockedStatsSnapshot=clone(c.stats);
  Object.assign(c.soloScore.inputs,{missionSuccess:false,sideAvailable:0});c.soloScore.result=S.evaluate(c);
  assert.equal(R.assess(c).status,'update');assert.equal(R.apply({cards:[c]}).cards[0].soloScore.result.axes[4],null);
});
test('known absent inputs may be removed; missing shots/stims/distance are irrelevant to v2',()=>{
  for(const field of ['minutes','missionSuccess','sideAvailable']) {
    const c=clone(fixture.soloV1);c.soloScore.inputs[field]=null;c.soloScore.result=S.evaluate(c);
    assert.equal(R.assess(c).status,'incomplete');
  }
  assert.equal(R.assess(fixture.soloV1).status,'update');
});
test('invalid stats, tampered ratings and unknown contexts block instead of becoming removals',()=>{
  for(const mutation of [c=>{c.stats.accuracy=120;c.lockedStatsSnapshot.accuracy=120;},c=>c.soloScore.result.rating=99,c=>delete c.lockedStatsSnapshot.kills,c=>{c.faction='Unknown';c.soloScore.result=S.evaluate(c);},c=>{c.mode='Defense (20min)';c.soloScore.result=S.evaluate(c);}]) {
    const c=clone(fixture.soloV1);mutation(c);assert.equal(R.assess(c).status,'blocked');assert.throws(()=>R.apply({cards:[c]}),/blocked/);
  }
});
test('future schemas/rules, duplicate IDs and malformed archives fail closed',()=>{
  const c=clone(fixture.soloV1);c.soloScore.version=999;assert.equal(R.assess(c).status,'unsupported');
  assert.throws(()=>R.preview({cards:[fixture.soloV1,fixture.soloV1]}),/Duplicate/);
  const a=R.capture(clone(fixture.soloV1));a.cardHistory.version=99;assert.equal(R.assess(a).status,'unsupported');
  assert.throws(()=>storage.parseSave(JSON.stringify({saveFormatVersion:99})),/newer/);
});
test('unsupported versions inside a preserved original block, even with a current outer history',()=>{
  const c=R.capture(clone(fixture.legacy));c.cardHistory.source.cardRecordVersion=99;
  assert.equal(R.assess(c).status,'unsupported');
  assert.throws(()=>storage.wrapData({cards:[c]}),e=>e.code==='UNSUPPORTED_SAVE_VERSION');
});
test('normalizer cannot turn ambiguous lock flags or absent legacy context into removal eligibility',()=>{
  const c=clone(fixture.legacy);c.statsLocked='true';
  assert.throws(()=>R.validateData({cards:[c]}),/Unknown finalized/);
  assert.equal(R.assess(c).status,'blocked');
  for(const key of ['mode','difficulty','faction','scoreRaw','grade']) {
    const old=clone(fixture.legacy);delete old[key];R.capture(old);
    Object.assign(old,{difficulty:10,faction:'Terminids',scoreRaw:0,grade:0,mode:'Normal (40)'});
    assert.equal(R.assess(old).status,'blocked');
  }
  const alias=clone(fixture.legacy);alias.mode='Defense (20min)';
  assert.equal(R.assess(alias).status,'incomplete');
  assert.deepEqual(R.assess(alias).reasons,['No recorded Solo mission time, outcome or available objective count']);
});
test('capture occurs once before defaults and keeps evidence of missing raw fields',()=>{
  const c=clone(fixture.legacy);delete c.stats.kills;delete c.lockedStatsSnapshot.kills;R.capture(c);
  c.stats.kills=c.lockedStatsSnapshot.kills=0;R.capture(c);
  assert.equal(c.cardHistory.source.stats.kills,undefined);
  assert.equal(R.assess(c).status,'incomplete');
});
test('history rejects changed input, revision and original score but permits new comments',()=>{
  const a=R.apply({cards:[clone(fixture.soloV1)]});a.cards[0].commentNotes.push({text:'New comment'});R.validateData(a);
  for(const mutate of [c=>c.cardHistory.revisions[0].result.rating=99,c=>c.cardHistory.revisions[0].inputKey='changed',c=>c.cardHistory.source.soloScore.result.rating=3,c=>c.lockedStatsSnapshot.kills++]) {
    const b=clone(a);mutate(b.cards[0]);assert.throws(()=>R.validateData(b));
  }
});
test('native/browser exports roundtrip all rating history and refuse downgrade readers through v2 envelope',()=>{
  const a=R.apply(data());
  const raw=T.serialize(a);assert.equal(JSON.parse(raw).saveFormatVersion,2);assert.deepEqual(T.parse(raw),a);
  const native=storage.wrapData(a);assert.equal(native.saveFormatVersion,2);assert.deepEqual(storage.parseSave(JSON.stringify(native)),a);
});
test('prepare does not write; commit preserves exact bytes outside rolling backups and applies once',t=>{
  const dir=profile(t),file=path.join(dir,'state.json'),before=fs.readFileSync(file);
  const tx=transaction.create(dir,'test'),preview=tx.prepare();assert.deepEqual(fs.readFileSync(file),before);
  const done=tx.commit(preview.token);assert(done.ok);assert.deepEqual(fs.readFileSync(done.backup),before);
  assert.deepEqual(storage.loadStateFile(dir).data,done.data);
  for(let i=0;i<25;i++)storage.saveStateFile(dir,done.data);
  assert.deepEqual(fs.readFileSync(done.backup),before);
  assert.throws(()=>tx.commit(preview.token),/Review/);assert(!tx.prepare().canApply);
});
test('new comment invalidates preview, rather than overwriting it',t=>{
  const dir=profile(t),tx=transaction.create(dir,'test'),p=tx.prepare();
  const changed=data();changed.cards[0].commentNotes.push({text:'arrived after review'});storage.saveStateFile(dir,changed);
  assert.throws(()=>tx.commit(p.token),/changed/);assert.deepEqual(storage.loadStateFile(dir).data,changed);
});
for(const stage of ['validated','backed-up','prepared'])test('injected disk/interruption failure at '+stage+' leaves complete old state',t=>{
  const dir=profile(t),file=path.join(dir,'state.json'),before=fs.readFileSync(file);
  const tx=transaction.create(dir,'test',s=>{if(s===stage)throw Error('injected write failure');});
  assert.throws(()=>tx.commit(tx.prepare().token),/injected/);assert.deepEqual(fs.readFileSync(file),before);
});
test('failed post-commit marker is not reported as failed update; hashes identify new state',t=>{
  const dir=profile(t),tx=transaction.create(dir,'test',s=>{if(s==='committed')throw Error('simulated interruption');});
  const result=tx.commit(tx.prepare().token);assert(result.ok);
  const manifest=JSON.parse(fs.readFileSync(path.join(path.dirname(result.backup),'manifest.json')));
  assert.equal(manifest.afterSha256,transaction.hash(fs.readFileSync(path.join(dir,'state.json'))));
  assert.deepEqual(storage.loadStateFile(dir).data,result.data);
});
test('backup obstruction fails before changing state',t=>{
  const dir=profile(t),file=path.join(dir,'state.json'),before=fs.readFileSync(file);
  fs.writeFileSync(path.join(dir,'card-upgrades'),'obstruction');
  const tx=transaction.create(dir,'test');assert.throws(()=>tx.commit(tx.prepare().token));assert.deepEqual(fs.readFileSync(file),before);
});
test('backup corruption and concurrent source change during staging prevent commit',t=>{
  for(const mode of ['corrupt','concurrent']) {
    const dir=profile(t),file=path.join(dir,'state.json'),before=fs.readFileSync(file);
    const tx=transaction.create(dir,'test',stage=>{
      if(stage!=='prepared')return;
      if(mode==='concurrent')fs.writeFileSync(file,JSON.stringify(storage.wrapData({cards:[],settings:{rememberedPlayerName:'Newer'}})));
      else {const set=fs.readdirSync(path.join(dir,'card-upgrades'))[0];fs.writeFileSync(path.join(dir,'card-upgrades',set,'before.json'),'damaged');}
    });
    if(mode==='concurrent'){assert.throws(()=>tx.commit(tx.prepare().token),/changed/);assert.equal(storage.loadStateFile(dir).data.settings.rememberedPlayerName,'Newer');}
    else {assert.throws(()=>tx.commit(tx.prepare().token),/backup changed/);assert.deepEqual(fs.readFileSync(file),before);}
  }
});
test('native safety backup is not subject to JSON export byte/card limits',t=>{
  const dir=profile(t),large=data();large.retainedMetadata='x'.repeat(T.MAX_BYTES+1);storage.saveStateFile(dir,large);
  const tx=transaction.create(dir,'test');const done=tx.commit(tx.prepare().token);
  assert.equal(storage.loadStateFile(dir).data.retainedMetadata.length,T.MAX_BYTES+1);assert(fs.statSync(done.backup).size>T.MAX_BYTES);
  assert.throws(()=>T.serialize(done.data),/large/);
});
