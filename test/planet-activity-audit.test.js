'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const audit=require('../scripts/planet-activity-audit');
const at='2026-09-24T04:00:00.000Z',now=Date.parse(at);
const raw=()=>({warId:801,time:12345,planetStatus:[{index:1},{index:2}],planetActiveEffects:[{index:1,galacticEffectId:1202},{index:1,galacticEffectId:1203},{index:2,galacticEffectId:1308}]});
const options={expectedWarId:801,fetchedAt:at};
test('activity maps exact planet IDs and collapses paired codes without modifying input',()=>{
  const r=raw(),before=JSON.stringify(r),s=audit.normalize(r,options),one=audit.forPlanet(s,1,{now});
  assert.equal(JSON.stringify(r),before);assert.equal(one.state,'recent-report');assert.equal(one.badges.length,1);
  assert.equal(one.badges[0].key,'jet-brigade');assert.deepEqual(one.badges[0].effectIds,[1202,1203]);
  assert.equal(audit.forPlanet(s,2,{now}).badges[0].key,'hive-lords');assert.equal(one.gameStateConfirmed,false);
  assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.effects)&&Object.isFrozen(s.effects[0]));
});
test('missing/null/non-array effects mean unavailable data, never a confirmed empty world',()=>{
  for(const v of [undefined,null,{},'none']){const r=raw();r.planetActiveEffects=v;assert.throws(()=>audit.normalize(r,options),/active effects/);}
  const r=raw();r.planetActiveEffects=[];const v=audit.forPlanet(audit.normalize(r,options),1,{now});
  assert.deepEqual(v.badges,[]);assert.equal(v.absenceConfirmed,false);
});
test('unknown effect codes stay explicitly unreviewed without guessing from text',()=>{
  const r=raw();r.planetActiveEffects=[{index:1,galacticEffectId:999999}];r.message='Hive Lords, Jet Brigade and SEAF';
  const s=audit.normalize(r,options),v=audit.forPlanet(s,1,{now});assert.deepEqual(s.unreviewedIds,[999999]);assert.deepEqual(v.badges,[]);assert.equal(v.absenceConfirmed,false);
});
test('factories, gloom, hive biome and training facilities cannot imply enemy deployment or SEAF support',()=>{
  const r=raw();r.planetActiveEffects=[1239,1188,1311,1282].map(galacticEffectId=>({index:1,galacticEffectId}));
  const v=audit.forPlanet(audit.normalize(r,options),1,{now});assert.equal(v.badges.length,0);assert.equal(v.unreviewedIds.length,4);
});
test('only explicit SEAF codes produce support badge; predator text does not',()=>{
  const r=raw();r.planetActiveEffects=[{index:1,galacticEffectId:1243},{index:2,galacticEffectId:1400},{index:2,galacticEffectId:1401}];
  const s=audit.normalize(r,options);assert.equal(audit.forPlanet(s,1,{now}).badges[0].key,'predator');
  assert.equal(audit.forPlanet(s,2,{now}).badges.length,1);assert.equal(audit.forPlanet(s,2,{now}).badges[0].key,'seaf');
});
test('bad identities, duplicate planet keys and orphan effects fail closed',()=>{
  const variants=[r=>r.warId=802,r=>r.planetStatus.push({index:1}),r=>r.planetStatus=[],r=>r.planetActiveEffects.push({index:3,galacticEffectId:1202}),r=>r.planetActiveEffects[0].index='1',r=>r.planetActiveEffects[0].galacticEffectId=-1,r=>r.planetActiveEffects[0]=null];
  for(const modify of variants){const r=raw();modify(r);assert.throws(()=>audit.normalize(r,options));}
});
test('regional or newly scoped rows require review instead of falsely becoming planet-wide',()=>{
  for(const key of ['regionIndex','place_id','expiresAt']){const r=raw();r.planetActiveEffects[0][key]=1;assert.throws(()=>audit.normalize(r,options),/scoped/);}
});
test('duplicate planet/effect pairs are counted and safely deduplicated',()=>{
  const r=raw();r.planetActiveEffects.push({...r.planetActiveEffects[0]});const s=audit.normalize(r,options);
  assert.equal(s.duplicates,1);assert.equal(s.effects.length,3);assert.equal(audit.forPlanet(s,1,{now}).badges.length,1);
});
test('internal ticks never become an invented Unix or startDate-derived source timestamp',()=>{
  const r=raw();r.startDate=1706040313;const s=audit.normalize(r,options);assert.equal(s.sourceUpdatedAt,null);assert.equal(s.warTick,12345);assert.equal(s.fetchedAt,at);
  for(const time of [NaN,Infinity,-1,'12345',1.5]){r.time=time;assert.throws(()=>audit.normalize(r,options));}
});
test('offline, failed, aged or future observations cannot be labeled recent',()=>{
  const s=audit.normalize(raw(),options);
  for(const o of [{now,online:false},{now,failed:true},{now:now+300000},{now:now-1}])assert.equal(audit.forPlanet(s,1,o).state,'cached-report');
  assert.equal(audit.forPlanet(s,1,{now:now+299999}).state,'recent-report');
  assert.throws(()=>audit.forPlanet(s,1,{now:NaN}));
});
test('tick progression distinguishes unchanged, regression and war changes',()=>{
  const s=audit.normalize(raw(),options);assert.equal(audit.compareTicks(null,s),'new-war-or-first-observation');
  assert.equal(audit.compareTicks(s,{...s,warId:802}),'new-war-or-first-observation');
  assert.equal(audit.compareTicks(s,{...s,warTick:s.warTick+1}),'advanced');
  assert.equal(audit.compareTicks(s,s),'unchanged');assert.equal(audit.compareTicks(s,{...s,warTick:s.warTick-1}),'regressed');
});
test('unknown/string planet identifiers cannot receive another planets badges',()=>{
  const s=audit.normalize(raw(),options);for(const id of ['1',0,999,null,{},NaN])assert.equal(audit.forPlanet(s,id,{now}).state,'unavailable');
});
test('response bounds, dates and expected war identity are explicit',()=>{
  assert.throws(()=>audit.normalize(raw(),{}));assert.throws(()=>audit.normalize(raw(),{...options,fetchedAt:'bad'}));
  const a=raw();a.planetStatus=Array.from({length:1025},(_,index)=>({index}));assert.throws(()=>audit.normalize(a,options));
  const b=raw();b.planetActiveEffects=Array(20001).fill({index:1,galacticEffectId:1202});assert.throws(()=>audit.normalize(b,options));
});
test('reviewed definitions have unique IDs and groups and a pinned source',()=>{
  const ids=audit.definitions.flatMap(d=>d.ids);assert.equal(new Set(ids).size,ids.length);assert.equal(ids.length,23);assert.equal(audit.definitions.length,15);
  assert.match(audit.CATALOG_URL,/\/[a-f0-9]{40}\/effects\/planetEffects.json$/);
});
test('research stays outside production renderer and network integration',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');assert.doesNotMatch(html,/planet-activity-audit|probe-planet-activity/);
});
