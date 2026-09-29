'use strict';
// Characterization of existing boundaries, NOT a deletion/migration engine.
// All samples are synthetic, in memory. Never load a player's profile here.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const fixture=require('./fixtures/card-compatibility.json');
const score=require('../assets/solo-score'),transfer=require('../assets/transfer-validation');
const storage=require('../electron/storage');
const clone=value=>structuredClone(value);
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
function sourceFunction(name,next){
  const start=html.indexOf('        function '+name+'('),end=html.indexOf(next,start);
  assert.ok(start>=0&&end>start,'exact audit source boundaries');
  return vm.runInNewContext('('+html.slice(start,end).trim()+')');
}
const normalizeStats=sourceFunction('normalizeMissionStats','        function stableStatsSignature(');
const migrateShots=sourceFunction('migrateLegacyCardShots','        /***********************');
const oldData=()=>({cards:[clone(fixture.legacy)],items:{},settings:{rememberedPlayerName:'Synthetic audit'}});
const envelope=data=>storage.wrapData(data,'1.1.0',new Date('2026-01-03T12:00:00Z'));

test('audit: raw legacy and desktop v1 envelopes retain records without scoring or normalization',()=>{
  const data=oldData(),original=JSON.stringify(data);
  for(const raw of [original,JSON.stringify(envelope(data))]){
    const parsed=transfer.parse(raw);
    assert.deepEqual(parsed,data);
    assert.equal(parsed.cards[0].soloScore,undefined);
    assert.equal(parsed.cards[0].stats.bulletCount,undefined);
    assert.equal(parsed.cards[0].planet,'Synthetic old planet text');
    assert.equal(parsed.cards[0].historicalExtension.keep,'unknown ordinary metadata');
  }
  assert.deepEqual(storage.parseSave(JSON.stringify(envelope(data))),data);
  assert.equal(JSON.stringify(data),original);
});

test('audit: pinned Solo v1 example can be evaluated under v2 without mutating the original',()=>{
  const card=freeze(clone(fixture.soloV1)),bytes=JSON.stringify(card);
  score.validateCard(card);
  const before=score.evaluate(card),after=score.evaluate(card,card.soloScore.inputs,card.lockedStatsSnapshot,2);
  assert.deepEqual(before,fixture.soloV1.soloScore.result);
  assert.deepEqual(after.axes,fixture.expectedV2.axes);assert.equal(after.rating,fixture.expectedV2.rating);
  assert.equal(JSON.stringify(card),bytes);
  assert.equal(transfer.parse(transfer.serialize({cards:[card]})).cards[0].soloScore.version,1);
});

test('audit: current one-off upgrade changes only a copy and cannot compound the score',()=>{
  const original=clone(fixture.soloV1),card=clone(original);
  assert.equal(score.upgrade(card),true);score.validateCard(card);
  assert.deepEqual(card.soloScore.originalResult,original.soloScore.result);
  assert.equal(card.soloScore.result.rating,71.67);
  for(const key of ['stats','lockedStatsSnapshot','originalNote','commentNotes'])assert.deepEqual(card[key],original[key]);
  const bytes=JSON.stringify(card);
  assert.equal(score.upgrade(card),false);assert.equal(JSON.stringify(card),bytes);
  assert.deepEqual(transfer.parse(transfer.serialize({cards:[card]})).cards[0],card);
  assert.equal(original.soloScore.version,1);
});

test('audit: legacy main-order/extraction outcomes do not establish Solo main-mission success',()=>{
  const card=clone(fixture.legacy);card.majorOrderDone=true;
  const result=score.evaluate(card,{},card.lockedStatsSnapshot,2);
  assert.equal(result.eligible,false);
  assert.deepEqual(result.missing,['Mission time','Available side objectives','Main mission outcome']);
  assert.equal(result.rating,null);
  assert.equal(card.soloScore,undefined);
});

test('audit: genuinely missing Solo inputs remain distinguishable from measured zero/false',()=>{
  for(const key of ['minutes','sideAvailable','missionSuccess']){
    const card=clone(fixture.soloV1);card.soloScore.inputs[key]=null;
    card.soloScore.result=score.evaluate(card);score.validateCard(card);
    assert.equal(card.soloScore.result.eligible,false);
    assert.equal(card.soloScore.result.rating,null);
    assert.deepEqual(transfer.parse(transfer.serialize({cards:[card]})).cards[0],card);
  }
  const card=clone(fixture.soloV1);
  Object.assign(card.lockedStatsSnapshot,{kills:0,accuracy:0,deaths:0,blueSideObjCount:0});
  Object.assign(card.soloScore.inputs,{sideAvailable:0,missionSuccess:false});
  const result=score.evaluate(card);
  assert.equal(result.eligible,true);assert.equal(result.axes[4],null);assert.equal(result.rating,20);
});

test('audit: missing/malformed stats cannot be treated as removal consent',()=>{
  for(const key of ['kills','accuracy','deaths','blueSideObjCount']){
    const card=clone(fixture.soloV1);delete card.lockedStatsSnapshot[key];
    assert.equal(score.evaluate(card).eligible,false);
    assert.throws(()=>score.validateCard(card));
    // Current validated import rejects the record, it does not remove it.
    const raw=JSON.stringify({cards:[card]});assert.throws(()=>transfer.parse(raw));
    assert.equal(JSON.parse(raw).cards.length,1);
  }
});

test('audit: unfinished cards stay unfinished and outside scored ranking',()=>{
  const card=clone(fixture.soloV1);card.statsLocked=false;delete card.lockedStatsSnapshot;
  card.soloScore.result=null;card.soloScore.inputs.minutes=null;
  const restored=transfer.parse(transfer.serialize({cards:[card]})).cards[0];
  assert.equal(restored.statsLocked,false);assert.equal(restored.soloScore.result,null);
  assert.deepEqual(score.groups([restored]),[]);
});

test('audit: future save/scoring/mission versions stop parsing rather than filtering cards',()=>{
  const future=envelope(oldData());future.saveFormatVersion=999;
  assert.throws(()=>transfer.parse(JSON.stringify(future)),{code:'UNSUPPORTED_SAVE_VERSION'});
  assert.throws(()=>storage.parseSave(JSON.stringify(future)),{code:'UNSUPPORTED_SAVE_VERSION'});
  for(const change of [c=>c.soloScore.version=999,c=>c.missionSelection={version:999}]){
    const card=clone(fixture.soloV1);change(card);const before=JSON.stringify(card);
    assert.throws(()=>transfer.parse(JSON.stringify({cards:[card]})),{code:'UNSUPPORTED_SAVE_VERSION'});
    assert.equal(JSON.stringify(card),before);
  }
});

test('audit: damaged JSON, duplicate IDs and tampered ratings fail before transfer replacement',()=>{
  assert.throws(()=>transfer.parse('{"cards":['),/valid JSON/);
  const card=clone(fixture.soloV1);
  assert.throws(()=>transfer.parse(JSON.stringify({cards:[card,clone(card)]})),/duplicate ID/);
  card.soloScore.result.rating=99;
  assert.throws(()=>transfer.parse(JSON.stringify({cards:[card]})),/snapshot/);
});

test('audit finding: stats normalization supplies zeros and clamps values without input provenance',()=>{
  const original={accuracy:120,distanceKm:25,bulletCount:18000},before=JSON.stringify(original);
  const normalized=normalizeStats(original);
  assert.equal(normalized.kills,0);assert.equal(normalized.deaths,0);
  assert.equal(normalized.accuracy,100);assert.equal(normalized.distanceKm,20);assert.equal(normalized.bulletCount,15000);
  assert.equal(JSON.stringify(original),before);
  assert.equal(normalized.inputProvenance,undefined);
});

test('audit finding: shots fallback can write 500 directly but normalizing first supplies zero',()=>{
  const direct=clone(fixture.legacy);migrateShots([direct]);
  assert.equal(direct.stats.bulletCount,500);assert.equal(direct.lockedStatsSnapshot.bulletCount,500);
  const ordered=clone(fixture.legacy);
  ordered.stats=normalizeStats(ordered.stats);ordered.lockedStatsSnapshot=normalizeStats(ordered.lockedStatsSnapshot);
  assert.equal(migrateShots([ordered]),false);assert.equal(ordered.stats.bulletCount,0);
  // Neither number proves what a player actually fired. Do not delete cards
  // just for having 0 or 500: both can also be real entered values.
  assert.equal(fixture.legacy.stats.bulletCount,undefined);
});

test('audit finding: absent old context has legacy defaults, not proof of a D10 Terminid dive',()=>{
  const difficulty=html.slice(html.indexOf('        function getCardDifficulty('),html.indexOf('        function getDifficultyTier('));
  const normalize=html.slice(html.indexOf('        function normalizeCardRecord('),html.indexOf('        function getNormalizedCardView('));
  assert.match(difficulty,/return 10;/);
  assert.ok(normalize.includes('card.faction || loadout?.faction || "Terminids"'));
});

test('audit finding: backup rotation and export bounds need separate upgrade-backup design',()=>{
  assert.equal(storage.MAX_BACKUPS,20);
  assert.equal(transfer.MAX_CARDS,10000);assert.equal(transfer.MAX_BYTES,32*1024*1024);
  // Dedicated transactions now keep verified copies outside autosave rotation.
  assert.equal(typeof require('../electron/card-recalibration').create,'function');
});
