'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../assets/mission-selection');
const state = require('../assets/mission-state');
const catalog = require('../assets/mission-catalog.json');
const previousCatalog = require('./fixtures/mission-catalog-2026-09-19-a.json');
const engine = api.createEngine(catalog);
const context = (faction, difficulty, campaign = 'liberation') => ({
  planetKey:'id:7', faction, difficulty, campaign, active:true, enabled:true
});
for (const [id,front,min] of [
  ['nuke-nursery','Terminids',4], ['sabotage-air-base','Automatons',3],
  ['neutralize-orbital-defenses','Automatons',4]
]) test(id + ': every faction, difficulty and campaign has matching roll/manual rules', () => {
  for (const faction of api.FACTIONS) for(let difficulty=1;difficulty<=10;difficulty++)
    for(const campaign of ['liberation','defense','event','unknown']) {
      const c=context(faction,difficulty,campaign), pool=engine.getPool(c);
      const row=engine.select(c,'mission:'+id), eligible=faction===front && difficulty>=min;
      assert.equal(!!row,eligible,[faction,difficulty,campaign].join(':'));
      const index=pool.missions.findIndex(m=>m.id==='mission:'+id);
      assert.equal(index>=0,eligible);
      if (row) {
        assert.equal(row.minutes,40); assert.equal(row.scoringFamily,'Normal (40)');
        assert.deepEqual(engine.roll(c,{random:()=>(index+.5)/pool.missions.length}),row);
      }
      assert.equal(pool.exactLiveAvailability,false);
    }
});
test('Supply Bases never enters suggestions; observed confirmation is scoped and does not change the catalog',()=>{
  for(const faction of api.FACTIONS) for(let d=1;d<=10;d++) for(const campaign of ['liberation','defense','event','unknown']) {
    const c=context(faction,d,campaign), id='mission:sabotage-supply-bases';
    assert.equal(engine.select(c,id),null);
    assert.ok(!engine.getPool(c).missions.some(m=>m.id===id));
    if(faction!=='Automatons') continue;
    const confirmation=engine.confirm(c,[{kind:'catalog',id}]);
    const entry=engine.select(c,id,{confirmation});
    assert.equal(entry.provenance,'player-confirmed');
    assert.deepEqual(entry.ruleConflicts,['confirmation-required']);
    assert.deepEqual(engine.roll(c,{confirmation,random:()=>0}),entry);
    assert.equal(engine.getPool({...c,planetKey:'id:8'},confirmation).status,'needs-confirmation');
    assert.equal(engine.select(c,id),null);
  }
});
test('all32 previous identities and their source records remain exact, without variant duplicates',()=>{
  assert.deepEqual(catalog.missions.slice(0,32),previousCatalog.missions);
  for(const s of previousCatalog.sources) assert.deepEqual(catalog.sources.find(v=>v.id===s.id),s);
  const batch=catalog.missions.slice(0,36);
  assert.equal(batch.length,36);
  assert.equal(new Set(batch.map(r=>r.id)).size,36);
  assert.equal(batch.filter(r=>r.suggestionEnabled).length,29);
  assert.equal(batch.filter(r=>!r.suggestionEnabled).length,7);
  assert.ok(!catalog.missions.some(r=>/mission:(destroy-dropships|air-base-control-tower|destroy-fuel-reserves|destroy-stockpiled-ammunition)$/.test(r.id)));
});
test('previous operation requires review while historical results remain valid and untouched',()=>{
  const c=context('Automatons',7), previous=api.createEngine(previousCatalog);
  const confirmation=previous.confirm(c,[{kind:'catalog',id:'mission:launch-icbm'}]);
  const selection=state.capture(previous.select(c,'mission:launch-icbm'),c,previousCatalog.revision);
  const before=JSON.stringify({confirmation,selection});
  assert.equal(engine.getPool(c,confirmation).status,'needs-confirmation');
  assert.equal(engine.roll(c,{confirmation}),null);
  state.validateSelection(selection);
  assert.equal(JSON.stringify({confirmation,selection}),before);
  assert.equal(engine.getPool(c,engine.confirm(c,confirmation.missions)).status,'confirmed');
});
