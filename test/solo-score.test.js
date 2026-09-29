const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../assets/solo-score');
const transfer=require('../assets/transfer-validation');
const clone=x=>JSON.parse(JSON.stringify(x));
function card(patch={}) {
  return {id:'run', difficulty:7, faction:'Automatons', mode:'Normal (40)',
    missionSelection:{id:'launch-icbm',name:'Launch ICBM',minutes:40},
    stats:{kills:400,accuracy:80,deaths:2,blueSideObjCount:3,extractedSafely:true},
    soloScore:{...S.create(),inputs:{minutes:20,sideAvailable:4,missionSuccess:true}},...patch};
}
function lock(c){c.statsLocked=true;c.lockedStatsSnapshot=clone(c.stats);c.soloScore.result=S.evaluate(c);return c;}
test('fixed benchmarks produce independently inspectable six-axis ratings',()=>{
  const r=S.evaluate(card());assert.deepEqual(r.axes,[100,80,75,50,75,100]);assert.equal(r.rating,80);assert(r.eligible);
});
test('utility extends only its axis; equal-weight average is not polygon area',()=>{
  const c=card(),r=S.evaluate(c);c.stats.blueSideObjCount=4;const next=S.evaluate(c);
  assert.equal(next.axes[4],100);assert.deepEqual(next.axes.filter((_,i)=>i!==4),r.axes.filter((_,i)=>i!==4));assert.equal(next.rating,84.17);
});
test('zero available is N/A and averages five applicable axes',()=>{
  const c=card();c.stats.blueSideObjCount=0;c.soloScore.inputs.sideAvailable=0;
  const r=S.evaluate(c);assert.equal(r.axes[4],null);assert.equal(r.rating,81);assert(r.eligible);
});
test('unknown time/outcome/objective total leaves a saved card unranked',()=>{
  for(const key of ['minutes','sideAvailable','missionSuccess']){const c=card();c.soloScore.inputs[key]=null;const r=S.evaluate(c);assert(!r.eligible);assert.equal(r.rating,null);assert(r.missing.length);}
});
test('invalid time/counts/accuracy/deaths/kills are rejected rather than clamped silently',()=>{
  for(const patch of [{minutes:0},{minutes:-1},{minutes:NaN},{minutes:241},{sideAvailable:2},{sideAvailable:1.5},{sideAvailable:-1},{missionSuccess:'yes'}]){
    const c=card();Object.assign(c.soloScore.inputs,patch);assert(S.evaluate(c).errors.length);assert.throws(()=>S.validateCard(c));
  }
  for(const patch of [{accuracy:101},{accuracy:-1},{kills:-1},{kills:1.5},{deaths:-1},{blueSideObjCount:4.5}]){const c=card();Object.assign(c.stats,patch);assert(S.evaluate(c).errors.length);}
});
test('fast failure cannot outrank a successful mission in its comparison group',()=>{
  const success=card({id:'success'});success.stats.kills=0;success.stats.accuracy=0;success.stats.deaths=12;success.soloScore.inputs.minutes=40;lock(success);
  const failure=card({id:'failure'});failure.soloScore.inputs.missionSuccess=false;failure.stats.deaths=0;lock(failure);
  assert(S.result(failure).rating>S.result(success).rating);assert.equal(S.groups([failure,success])[0].cards[0].id,'success');assert.equal(S.result(failure).axes[3],0);
});
test('zero deaths has no division error; time beyond limit gives zero speed',()=>{
  const c=card();c.stats.deaths=0;c.soloScore.inputs.minutes=45;const r=S.evaluate(c);assert.equal(r.axes[2],100);assert.equal(r.axes[3],0);assert(Number.isFinite(r.rating));
});
test('Major Orders, extraction, stims, shots, distance and stratagem counts do not alter the rating',()=>{
  const c=card(),original=S.evaluate(c);Object.assign(c,{majorOrderDone:false});Object.assign(c.stats,{stims:200,bulletCount:15000,distanceKm:20,stratUses:500,extractedSafely:false});assert.deepEqual(S.evaluate(c),original);
});
test('rank groups isolate exact difficulty, faction, mission and objective opportunity',()=>{
  const a=lock(card());
  for(const update of [c=>c.difficulty=8,c=>c.faction='Terminids',c=>c.missionSelection.id='other',c=>c.soloScore.inputs.sideAvailable=5,c=>c.missionSelection.minutes=12]){
    const b=clone(a);b.id='b';update(b);b.soloScore.result=S.evaluate(b);assert.equal(S.groups([a,b]).length,2);
  }
  const legacy={...clone(a),soloScore:undefined};assert.equal(S.groups([legacy,a,card()])[0].cards.length,1);
});
test('future versions and tampered finalized ratings fail closed',()=>{
  const c=lock(card());S.validateCard(c);const bad=clone(c);bad.soloScore.result.rating=100;assert.throws(()=>S.validateCard(bad),/snapshot/);
  const newer=card();newer.soloScore.version=3;assert.throws(()=>S.validateCard(newer),/Unsupported/);
});
test('saved scores are immutable when other cards are added/removed',()=>{
  const a=lock(card()),before=JSON.stringify(a);const b=lock(card({id:'other'}));b.soloScore.inputs.minutes=1;b.soloScore.result=S.evaluate(b);S.groups([a,b]);S.groups([a]);assert.equal(JSON.stringify(a),before);
});
test('legacy score capture and restoration preserve exact known values',()=>{
  const c={id:'legacy',statsLocked:true,scoreRaw:521.123,grade:87,scoreRawBonusPercent:33};S.preserveLegacy(c);c.scoreRaw=9;c.grade=2;S.restoreLegacy(c);assert.equal(c.scoreRaw,521.123);assert.equal(c.grade,87);assert.equal(c.scoreRawBonusPercent,33);
  const before=JSON.stringify(c);S.preserveLegacy(c);assert.equal(JSON.stringify(c),before);
});
test('solo scores never acquire legacy snapshots',()=>{const c=lock(card());c.scoreRaw=80;c.grade=80;S.preserveLegacy(c);assert(!c.legacyScoreSnapshot);});
test('generic and missing mission durations do not invent scoring baselines',()=>{
  const c=card();delete c.missionSelection;c.mode='Normal (40)';assert.equal(S.duration(c),40);c.mode='Unknown';assert.equal(S.evaluate(c).rating,null);
});
test('hostile mission names cannot resolve inherited duration properties',()=>{
  for(const mode of ['constructor','__proto__','toString','hasOwnProperty']) {
    const c=card({mode});delete c.missionSelection;
    assert.equal(S.duration(c),null);assert.equal(S.evaluate(c).rating,null);
  }
});
test('oversized count inputs cannot finalize nonfinite rate snapshots',()=>{
  for(const key of ['kills','deaths']) {const c=card();c.stats[key]=Number.MAX_VALUE;assert.throws(()=>S.validateCard(c),/safe whole/);}
});
test('transfer rejects future solo versions before replacing data',()=>{
  const c=card();delete c.missionSelection;c.soloScore.version=3;assert.throws(()=>transfer.validateData({cards:[c]}),/Unsupported/);
});
test('export and reimport retain locked results and original notes/comments',()=>{
  const c=card();delete c.missionSelection;c.originalNote='Original';c.commentNotes=[{id:'one',text:'Later'}];lock(c);
  const serialized=transfer.serialize({cards:[c]});const restored=transfer.parse(serialized);assert.deepEqual(restored.cards[0],c);assert.equal(S.result(restored.cards[0]).rating,80);
});

test('gentle Firepower matches approved examples and changes no other axis',()=>{
  for(const [oldValue,newValue] of [[0,0],[19.7,44.38],[40,63.25],[80,89.44],[100,100],[200,100]]){
    const c=card();c.soloScore.inputs.minutes=100;c.stats.kills=oldValue*20;
    const old=S.evaluate(c,c.soloScore.inputs,c.stats,1), next=S.evaluate(c);
    assert.equal(next.axes[0],newValue);assert.deepEqual(next.axes.slice(1),old.axes.slice(1));assert(next.rating>=old.rating);
  }
});
test('v1 upgrade retains original rating and every entered stat/note/comment',()=>{
  const c=card();c.soloScore.version=1;c.stats.kills=394;c.soloScore.inputs.minutes=100;c.originalNote='Keep';c.commentNotes=[{text:'Keep too'}];lock(c);
  const before=clone(c);assert(S.upgrade(c));S.validateCard(c);
  assert.equal(c.soloScore.version,2);assert.equal(c.soloScore.result.axes[0],44.38);
  assert.deepEqual(c.soloScore.originalResult,before.soloScore.result);
  for(const k of ['stats','lockedStatsSnapshot','originalNote','commentNotes'])assert.deepEqual(c[k],before[k]);
  assert.deepEqual(c.soloScore.inputs,before.soloScore.inputs);
  const once=JSON.stringify(c);assert(!S.upgrade(c));assert.equal(JSON.stringify(c),once);
});
test('damaged original rating cannot migrate or overwrite data',()=>{
  const c=card();c.soloScore.version=1;lock(c);c.soloScore.result.rating=1;const before=JSON.stringify(c);
  assert.throws(()=>S.upgrade(c),/snapshot/);assert.equal(JSON.stringify(c),before);
});
test('original recovery rating must remain consistent after upgrade',()=>{
  const c=card();c.soloScore.version=1;lock(c);S.upgrade(c);c.soloScore.originalResult.axes[0]=1;assert.throws(()=>S.validateCard(c),/Original/);
});
test('pending and unknown-input cards migrate without inventing scores',()=>{
  const c=card();c.soloScore.version=1;S.upgrade(c);assert.equal(c.soloScore.result,null);assert(!c.soloScore.originalResult);
  const missing=card();missing.soloScore.version=1;missing.soloScore.inputs.minutes=null;lock(missing);S.upgrade(missing);S.validateCard(missing);assert.equal(missing.soloScore.result.rating,null);assert.equal(missing.soloScore.originalResult.rating,null);
});
test('non-Solo legacy cards are not recalculated by upgrade',()=>{
  const c={id:'legacy',grade:73,scoreRaw:456,statsLocked:true};const before=JSON.stringify(c);assert(!S.upgrade(c));assert.equal(JSON.stringify(c),before);
});
test('export retains both adjusted and original results',()=>{
  const c=card();delete c.missionSelection;c.soloScore.version=1;lock(c);S.upgrade(c);
  assert.deepEqual(transfer.parse(transfer.serialize({cards:[c]})).cards[0],c);
});
