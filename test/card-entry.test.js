const {test}=require('node:test');
const assert=require('node:assert/strict');
const entry=require('../assets/card-entry');
test('solo entry includes every stored number, separate outcomes and final note',()=>{
  const steps=entry.steps(true);assert.equal(steps.length,13);
  assert.deepEqual(steps.map(s=>s.key),['kills','accuracy','deaths','stims','bulletCount','blueSideObjCount','stratUses','distanceKm','minutes','sideAvailable','missionSuccess','extractedSafely','originalNote']);
  assert(!steps.some(s=>s.key==='majorOrderDone'));
});
test('legacy entry preserves Major Order instead of silently changing scoring',()=>{
  assert(entry.steps(false).some(s=>s.key==='majorOrderDone'));assert(!entry.steps(false).some(s=>s.key==='minutes'));
});
test('numbers reject blanks, negatives, infinity, overflow and fractional counts',()=>{
  const step=entry.steps(true)[0];for(const value of ['',null,-1,Infinity,Number.MAX_SAFE_INTEGER+1,1.5])assert(entry.validate(step,value));
  assert.equal(entry.validate(step,0),'');assert.equal(entry.validate(step,'123'),'');
});
test('accuracy and time enforce meaningful ranges while allowing decimal input',()=>{
  const find=key=>entry.steps(true).find(s=>s.key===key);
  assert(entry.validate(find('accuracy'),101));assert.equal(entry.validate(find('accuracy'),99.5),'');
  assert(entry.validate(find('minutes'),0));assert.equal(entry.validate(find('minutes'),12.5),'');
});
test('boolean choices require an explicit outcome and notes remain optional and bounded',()=>{
  const s=entry.steps(true).find(s=>s.key==='missionSuccess');for(const value of [null,'',0,'false'])assert(entry.validate(s,value));
  assert.equal(entry.validate(s,false),'');assert.equal(entry.validate(entry.steps(true).at(-1),''),'');assert(entry.validate(entry.steps(true).at(-1),'x'.repeat(10001)));
});
test('review checks objective relationship without mutating draft',()=>{
  const draft={stats:{kills:1,accuracy:50,deaths:0,stims:0,bulletCount:1,blueSideObjCount:3,stratUses:0,distanceKm:1},soloInputs:{minutes:20,sideAvailable:2,missionSuccess:true},extractedSafely:false,originalNote:''};
  const original=JSON.stringify(draft);assert(entry.validateAll(draft,true).some(v=>v.key==='sideAvailable'));assert.equal(JSON.stringify(draft),original);
  draft.soloInputs.sideAvailable=3;assert.deepEqual(entry.validateAll(draft,true),[]);
  draft.stats.blueSideObjCount=0;draft.soloInputs.sideAvailable=0;assert.deepEqual(entry.validateAll(draft,true),[]);
});
