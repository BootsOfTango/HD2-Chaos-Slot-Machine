'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ids=require('../assets/galaxy-identities'),map=require('../assets/galaxy-map-model');
const atlas=require('../assets/galaxy-atlas-bundled.json'),war=require('../assets/war-snapshot');
const selection=require('../assets/planet-selection'),preferences=require('../assets/war-planet-pool');
const context=require('../assets/mission-context'),missions=require('../assets/mission-selection');
const now=Date.parse(atlas.observedAt)+1000;
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const bundled=[...html.matchAll(/\{ name: ("[^"]+"), faction: ("[^"]+"), sector: ("[^"]+"), biome:/g)]
  .map(m=>({name:JSON.parse(m[1]),faction:JSON.parse(m[2]),sector:JSON.parse(m[3])}));
function options(rows=bundled){return {atlas,now,online:false,snapshot:war.bundledSnapshot(bundled,'fixture'),editable:rows};}
test('reviewed crosswalk covers 231 retained identities once, with Mars unresolved',()=>{
  assert.equal(bundled.length,232);assert.equal(ids.records.length,231);
  assert.equal(new Set(ids.records.map(r=>r[0])).size,231);
  assert.ok(Object.isFrozen(ids.records[0]));
  for(const p of bundled){const a=ids.resolve(p,atlas);if(p.name==='Mars')assert.equal(a,null);else assert.ok(a,p.name);}
  for(const [id,name,legacy,sector,apiSector] of ids.records){
    const a=atlas.planets.find(p=>p.id===id);assert.equal(a.name,name);assert.equal(a.sector,apiSector);
    assert.ok(bundled.some(p=>p.name===legacy&&p.sector===sector));
  }
});
test('offline view deduplicates metadata, keeps 273 positions, 56 sectors and all 336 real edges',()=>{
  const opts=options(),before=JSON.stringify(opts),out=map.build(opts);
  assert.equal(out.planets.length,274);assert.equal(out.sectors.length,56);
  assert.deepEqual(out.unplacedKeys,['name:mars']);assert.equal(out.connections.length,336);
  assert.equal(new Set(out.planets.filter(p=>p.id!=null).map(p=>p.id)).size,273);
  assert.equal(out.warStatus.confirmedCurrentlyPlayable,false);
  assert.equal(JSON.stringify(opts),before);
  assert.deepEqual([...out.selectableKeys].sort(),selection.eligiblePlanets(preferences.pool(opts.snapshot,opts.editable)).map(selection.planetKey).sort());
});
test('map selection returns unchanged legacy identity, preserving mission context and imported history',()=>{
  const opts=options(),restored=JSON.parse(JSON.stringify(opts));
  const engine=missions.createEngine(require('../assets/mission-catalog.json'));
  for(const p of map.build(opts).planets.filter(p=>p.selectable)){
    const chosen=map.selectPlanet(p.key,opts),direct=selection.selectPlanet(preferences.pool(opts.snapshot,opts.editable),p.key);
    assert.deepEqual(chosen,direct);assert.equal(chosen.id,undefined);
    assert.deepEqual(map.selectPlanet(p.key,restored),chosen);
    for(const difficulty of [1,5,10]){
      const a=context.forPlanet(opts.snapshot,{selectedPlanet:chosen,difficulty,now,online:false});
      const b=context.forPlanet(opts.snapshot,{selectedPlanet:direct,difficulty,now,online:false});
      assert.deepEqual(a,b);assert.deepEqual(engine.getPool(a.context),engine.getPool(b.context));
    }
  }
  assert.deepEqual(map.build(restored),map.build(opts));
});
test('disabled and conflicting legacy duplicates remain excluded after display matching',()=>{
  const p=bundled.find(p=>p.name==='Charbal-VII');
  for(const rows of [[{...p,enabled:false}],[p,{...p,enabled:false}],[p,{...p,faction:'Terminids'}]]){
    const out=map.build(options(rows));assert.equal(out.selectableKeys.length,0);
    assert.ok(out.planets.find(r=>r.key===selection.planetKey(p)).screen);
    assert.equal(map.selectPlanet(selection.planetKey(p),options(rows)),null);
  }
});
test('unreviewed names, wrong sectors, renamed/missing/ambiguous atlas IDs stay unresolved',()=>{
  const p=bundled.find(p=>p.name==='Charbal-VII'),a=ids.resolve(p,atlas);
  assert.equal(ids.resolve({...p,name:'Charbal VII'},atlas),null);
  assert.equal(ids.resolve({...p,sector:'Wrong'},atlas),null);
  assert.equal(ids.resolve({...p,id:999},atlas),null);
  assert.equal(ids.resolve(p,{planets:[]}),null);
  assert.equal(ids.resolve(p,{planets:[{...a,name:'Renamed'}]}),null);
  assert.equal(ids.resolve(p,{planets:[a,a]}),null);
  const out=map.build(options([{...p,sector:'Wrong'}]));
  assert.ok(out.unplacedKeys.includes(selection.planetKey(p)));
});
test('explicit aliases and sector changes affect display only, not historical data',()=>{
  for(const name of ['Widow’s Harbor','Martyr’s Bay','Angel’s Venture','Meridia','Alderidge Cove','Enuliale']){
    const p=bundled.find(p=>p.name===name),before=JSON.stringify(p),a=ids.resolve(p,atlas);
    const row=map.build(options([p])).planets.find(r=>r.key===selection.planetKey(p));
    assert.equal(row.id,a.id);assert.equal(row.sector,a.sector);assert.deepEqual(row.position,a.position);
    assert.equal(JSON.stringify(p),before);
  }
});
test('legacy cache stays dated, and current ID campaigns never acquire legacy eligibility',()=>{
  const p=bundled.find(p=>p.name==='Charbal-VII');
  const snapshot=war.readCache({updatedAt:new Date(now).toISOString(),planets:[p]},{now}).snapshot;
  const opts={...options([p]),snapshot};const out=map.build(opts);
  assert.equal(out.warStatus.state,'cached');assert.ok(out.planets.find(r=>r.key===selection.planetKey(p)).screen);
  const a=ids.resolve(p,atlas),live=war.normalizeCampaigns([{id:777,faction:'Automatons',planet:{index:a.id,name:a.name,sector:a.sector,currentOwner:'Automatons',position:a.position}}],{now});
  const liveOpts={...opts,snapshot:live,editable:[{name:a.name,enabled:false}]};
  assert.deepEqual(map.build(liveOpts).selectableKeys,[]);
  assert.equal(map.selectPlanet(selection.planetKey(p),liveOpts),null);
});
test('ambiguous alias keys and existing ID records are never silently merged',()=>{
  const p={...bundled.find(p=>p.name==='Angel’s Venture'),faction:'Terminids'},a=ids.resolve(p,atlas);
  for(const second of [{...p,name:a.name},{...p,id:a.id}]){
    const out=map.build(options([p,second]));
    assert.ok(out.planets.find(r=>r.key===selection.planetKey(p)));
    assert.ok(out.planets.find(r=>r.key===selection.planetKey(second)));
    assert.equal(out.selectableKeys.length,2);
  }
});
