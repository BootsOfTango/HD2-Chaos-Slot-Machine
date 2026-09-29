'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const api=require('../assets/mission-selection'), state=require('../assets/mission-state');
const catalog=require('../assets/mission-catalog.json');
const previousCatalog=require('./fixtures/mission-catalog-2026-09-19-b.json');
const engine=api.createEngine(catalog);
const context=(faction,difficulty,campaign='liberation')=>({planetKey:'id:7',faction,difficulty,campaign,active:true,enabled:true});
const additions=[["retrieve-recon-craft-intel",1,40,true],["extract-anomalous-material",3,40,false],["free-colony",1,40,false],["democratize-the-void",1,40,false],["take-down-overship",1,40,false],["infiltrate-illuminate-lair",1,40,false],["repel-invasion-fleet",3,20,false],["destroy-exospire",3,40,false],["destroy-gazer-spire",5,40,false],["blitz-toxic-pollination",3,12,false]];
for(const [id,min,minutes,suggested] of additions) test(id+': suggestion and observed-operation boundaries',()=>{
  for(const faction of api.FACTIONS) for(let difficulty=1;difficulty<=10;difficulty++)
    for(const campaign of ['liberation','defense','event','unknown']) {
      const c=context(faction,difficulty,campaign), pool=engine.getPool(c), key='mission:'+id;
      const selected=engine.select(c,key), eligible=suggested && faction==='Illuminate' && difficulty>=min;
      assert.equal(!!selected,eligible,[faction,difficulty,campaign].join(':'));
      assert.equal(pool.missions.some(m=>m.id===key),eligible);
      assert.equal(pool.exactLiveAvailability,false);
      if(selected) {
        const i=pool.missions.findIndex(m=>m.id===key);
        assert.deepEqual(engine.roll(c,{random:()=>(i+.5)/pool.missions.length}),selected);
      }
      if(faction!=='Illuminate') continue;
      const confirmation=engine.confirm(c,[{kind:'catalog',id:key}]);
      const observed=engine.select(c,key,{confirmation});
      assert.equal(observed.minutes,minutes);
      assert.equal(observed.scoringFamily,minutes===12?'Blitz (12)':minutes===20?'Defense (20min)':'Normal (40)');
      assert.equal(observed.provenance,'player-confirmed');
      assert.equal(observed.ruleConflicts.includes('confirmation-required'),!suggested);
      assert.equal(observed.ruleConflicts.includes('difficulty'),difficulty<min);
      assert.deepEqual(engine.roll(c,{confirmation,random:()=>0}),observed);
      assert.equal(engine.getPool({...c,planetKey:'id:8'},confirmation).status,'needs-confirmation');
    }
});
test('defense alone never enables city fleet mission; changing difficulty or event invalidates confirmation',()=>{
  const c=context('Illuminate',5,'defense'), id='mission:repel-invasion-fleet';
  assert.equal(engine.select(c,id),null);
  const confirmation=engine.confirm(c,[{kind:'catalog',id}]);
  for(const changed of [{difficulty:6},{eventKeys:['new-event']},{campaign:'liberation'}])
    assert.equal(engine.getPool({...c,...changed},confirmation).status,'needs-confirmation');
});
test('previous36 records remain exact; names and subobjectives are not double weighted',()=>{
  assert.deepEqual(catalog.missions.slice(0,36),previousCatalog.missions);
  for(const s of previousCatalog.sources) assert.deepEqual(catalog.sources.find(v=>v.id===s.id),s);
  assert.equal(catalog.missions.slice(0,46).length,46);
  assert.equal(new Set(catalog.missions.slice(0,46).map(m=>m.id)).size,46);
  assert.equal(catalog.missions.slice(0,46).filter(m=>m.suggestionEnabled).length,30);
  assert.equal(catalog.missions.slice(0,46).filter(m=>!m.suggestionEnabled).length,16);
  assert.ok(!catalog.missions.some(m=>/mission:(free-the-city|blitz-toxic-pollution|cleanse-foul-shrine|eradicate-illuminate)$/.test(m.id)));
});
test('catalog change requires explicit operation review without changing old Result snapshots',()=>{
  const c=context('Illuminate',5), previous=api.createEngine(previousCatalog);
  const confirmation=previous.confirm(c,[{kind:'catalog',id:'mission:launch-icbm'}]);
  const selection=state.capture(previous.select(c,'mission:launch-icbm'),c,previousCatalog.revision);
  const before=JSON.stringify({confirmation,selection});
  assert.equal(engine.getPool(c,confirmation).status,'needs-confirmation');
  assert.equal(engine.roll(c,{confirmation}),null);
  state.validateSelection(selection);
  assert.equal(JSON.stringify({confirmation,selection}),before);
});
