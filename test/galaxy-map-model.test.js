'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const map = require('../assets/galaxy-map-model'), war = require('../assets/war-snapshot');
const selection = require('../assets/planet-selection'), prefs = require('../assets/war-planet-pool');
const missionContext = require('../assets/mission-context'), missions = require('../assets/mission-selection');
const anchors = require('./fixtures/galaxy-coordinate-anchors.json');
const NOW = Date.parse('2026-09-21T06:00:00Z');
const planet = (index = 1, extra = {}) => ({ index, name: 'Planet ' + index, sector: 'Test',
  currentOwner: 'Terminids', position: { x: .4, y: .3 }, disabled: false, ...extra });
const atlas = rows => map.normalizeAtlas(rows || [planet(), planet(2)], { now: NOW });
const snapshot = rows => war.normalizeCampaigns(rows || [{ id: 101, faction: 'Terminids', planet: planet() }], { now: NOW });
const opts = extra => ({ snapshot: snapshot(), atlas: atlas(), now: NOW, ...extra });

test('projection preserves axes, origin and equal scale without rotation', () => {
  assert.deepEqual(map.project({x:0,y:0}),{x:500,y:500});
  assert.deepEqual(map.project({x:1,y:1}),{x:960,y:40});
  assert.deepEqual(map.project({x:-1,y:-1}),{x:40,y:960});
  assert.deepEqual(map.project({x:.5,y:.5},{size:600,padding:20}),{x:440,y:160});
});
test('observed coordinate anchors retain their unrotated screen quadrants', () => {
  const points = Object.fromEntries(anchors.planets.map(p => [p.name,map.project(p.position)]));
  assert.deepEqual(points['SUPER EARTH'],{x:500,y:500});
  for (const name of ['HELLMIRE','MERIDIA']) assert.ok(points[name].x>500 && points[name].y<500);
  for (const name of ['CALYPSO','MALEVELON CREEK']) assert.ok(points[name].x<500 && points[name].y>500);
  assert.ok(points.CYBERSTAN.x<500 && points.CYBERSTAN.y<500);
});
test('missing, nonfinite and unsupported positions remain unplaced rather than guessed', () => {
  for (const position of [null,{}, {x:'0',y:0},{x:NaN,y:0},{x:Infinity,y:0},{x:1.01,y:0}]) {
    assert.equal(map.project(position),null);
    const out = map.build(opts({atlas:atlas([planet(2,{position})])}));
    assert.ok(out.unplacedKeys.includes('id:2'));
  }
  for (const v of [{size:0},{padding:-1},{padding:500},{size:Infinity},{size:100001}]) assert.throws(()=>map.project({x:0,y:0},v));
});
test('atlas normalizes only display metadata, never eligibility or executable content', () => {
  const value = atlas([planet(0,{name:{'en-US':'Super Earth'},currentOwner:'Humans',enabled:true,active:true,event:{arbitrary:true},html:'bad'})]);
  assert.equal(value.planets[0].owner,'Super Earth');
  assert.equal(value.planets[0].name,'Super Earth');
  assert.equal(Object.hasOwn(value.planets[0],'active'),false);
  assert.equal(Object.hasOwn(value.planets[0],'html'),false);
  assert.ok(Object.isFrozen(value.planets[0]));
});
test('atlas rejects ambiguous IDs, bad envelopes, future dates and oversized input', () => {
  for (const rows of [[],null,Array(5001).fill(planet()),[planet(),planet()]]) assert.throws(()=>map.normalizeAtlas(rows,{now:NOW}));
  assert.throws(()=>map.normalizeAtlas([planet()],{now:NOW,observedAt:'2100-01-01T00:00:00Z'}));
  const damaged = {...atlas(),version:99};
  const out = map.build(opts({atlas:damaged}));
  assert.ok(out.issues.includes('invalid-atlas'));
  assert.deepEqual(out.selectableKeys,['id:1']);
});
test('malformed rows are skipped while coordinate-less valid rows remain in the list', () => {
  const value = atlas([{index:'1',name:'bad'},planet(2,{position:null})]);
  assert.equal(value.planets.length,1);
  assert.ok(value.issues.includes('malformed-atlas-row'));
  assert.ok(value.issues.includes('missing-or-unsupported-position'));
});
test('metadata-only planets cannot join rolls even with active/owner flags', () => {
  const options=opts(), out=map.build(options);
  assert.equal(out.planets.find(p=>p.key==='id:2').selectable,false);
  assert.equal(map.selectPlanet('id:2',options),null);
  assert.deepEqual(map.selectPlanet('id:1',options),selection.selectPlanet(prefs.pool(options.snapshot),'id:1'));
  assert.equal(out.exactTerritoryGeometry,false);
  assert.equal(out.sectorBoundaries,null);
  assert.equal(out.exactMissionAvailability,false);
});
test('no war data or invalid/future snapshot leaves atlas visible but never selectable', () => {
  for (const value of [null,{}, {...snapshot(),schemaVersion:999},{...snapshot(),source:'live',origin:'legacy-cache'}]) {
    const options=opts({snapshot:value}), out=map.build(options);
    assert.equal(out.planets.length,2);
    assert.deepEqual(out.selectableKeys,[]);
    assert.equal(map.selectPlanet('id:1',options),null);
    assert.equal(out.warStatus.confirmedCurrentlyPlayable,false);
  }
});
test('defense displays human owner separately from the event attacker', () => {
  const p=planet(1,{currentOwner:'Humans',event:{id:7,campaignId:101,faction:'Automaton',startTime:'2026-09-21T05:00:00Z',endTime:'2026-09-21T07:00:00Z'}});
  const value=war.normalizeCampaigns([{id:101,faction:'Humans',planet:p}],{now:NOW});
  const out=map.build(opts({snapshot:value})).planets.find(p=>p.key==='id:1');
  assert.equal(out.owner,'Super Earth'); assert.equal(out.enemyFaction,'Automatons'); assert.equal(out.campaignContext,'defense');
});
test('disabled preferences, duplicate opt-outs and conflict records cannot be restored by atlas', () => {
  for (const editable of [[{id:1,name:'Planet 1',enabled:false}],[{id:1,name:'Planet 1',enabled:true},{id:1,name:'Planet 1',enabled:false}]]) {
    const options=opts({editable}); assert.deepEqual(map.build(options).selectableKeys,[]); assert.equal(map.selectPlanet('id:1',options),null);
  }
  const value=snapshot([{id:101,faction:'Terminids',planet:planet()}, {id:102,faction:'Automatons',planet:planet()}, {id:103,faction:'Terminids',planet:planet(3)}]);
  assert.equal(map.selectPlanet('id:1',opts({snapshot:value})),null);
});
test('campaign coordinates take priority; absent coordinates may use the same atlas ID only', () => {
  let out=map.build(opts({atlas:atlas([planet(1,{position:{x:-.7,y:-.7}})])}));
  assert.equal(out.planets[0].positionSource,'war-snapshot'); assert.equal(out.planets[0].position.x,.4);
  const value=snapshot([{id:101,faction:'Terminids',planet:planet(1,{position:null})}]);
  out=map.build(opts({snapshot:value})); assert.equal(out.planets[0].positionSource,'atlas');
  out=map.build(opts({snapshot:value,atlas:atlas([planet(2,{name:'Planet 1'})])}));
  assert.ok(out.unplacedKeys.includes('id:1'));
  assert.equal(out.planets.find(p=>p.key==='id:1').selectable,true);
});
test('bundled name-only planets keep offline selection and never borrow a same-name ID position', () => {
  const bundled=war.bundledSnapshot([{name:'Planet 1',faction:'Terminids'}],'fixture');
  const options=opts({snapshot:bundled}), out=map.build(options);
  assert.deepEqual(out.selectableKeys,['name:planet 1']); assert.ok(out.unplacedKeys.includes('name:planet 1'));
  assert.equal(out.planets.find(p=>p.key==='name:planet 1').availability,'offline-choice');
  assert.equal(out.warStatus.confirmedCurrentlyPlayable,false); assert.ok(map.selectPlanet('name:planet 1',options));
});
test('cache and observation ages remain separate; atlas never makes cached war live', () => {
  const cached=war.readCache(snapshot(),{now:NOW}).snapshot;
  let out=map.build(opts({snapshot:cached}));
  assert.equal(out.warStatus.state,'cached'); assert.equal(out.atlasStatus.state,'recent-observation');
  out=map.build(opts({online:false})); assert.equal(out.atlasStatus.state,'cached-observation'); assert.equal(out.warStatus.confirmedCurrentlyPlayable,false);
  out=map.build(opts({now:NOW+war.FRESH_MS})); assert.equal(out.warStatus.confirmedCurrentlyPlayable,false); assert.equal(out.atlasStatus.state,'cached-observation');
});
test('click resolution uses the latest snapshot rather than the old displayed marker', () => {
  const old=map.build(opts()); assert.ok(old.selectableKeys.includes('id:1'));
  const next=snapshot([{id:102,faction:'Illuminate',planet:planet(2)}]);
  assert.equal(map.selectPlanet('id:1',opts({snapshot:next})),null);
});
test('map selections feed the existing mission adapter with identical pools for all fronts', () => {
  const engine=missions.createEngine(require('../assets/mission-catalog.json'));
  for (const faction of missions.FACTIONS) {
    const value=snapshot([{id:101,faction,planet:planet(1,{currentOwner:faction})}]), options=opts({snapshot:value});
    const chosen=map.selectPlanet('id:1',options);
    const direct=selection.selectPlanet(prefs.pool(value),'id:1');
    for(let difficulty=1;difficulty<=10;difficulty++) {
      const a=missionContext.forPlanet(value,{selectedPlanet:chosen,difficulty,now:NOW});
      const b=missionContext.forPlanet(value,{selectedPlanet:direct,difficulty,now:NOW});
      assert.deepEqual(engine.getPool(a.context),engine.getPool(b.context));
    }
  }
});
test('model construction is immutable, deterministic and contains every selectable key once', () => {
  const options=opts(), before=JSON.stringify(options), out=map.build(options);
  assert.equal(JSON.stringify(options),before); assert.ok(Object.isFrozen(out.planets[0]));
  assert.deepEqual(map.build(options),out);
  assert.deepEqual([...out.selectableKeys].sort(),selection.eligiblePlanets(prefs.pool(options.snapshot)).map(selection.planetKey).sort());
});
test('invalid preference flags and clocks fail before processing', () => {
  for (const changes of [{now:NaN},{online:'true'},{refreshFailed:0},{editable:[{enabled:'false'}]}]) assert.throws(()=>map.build(opts(changes)));
});
test('browser module executes without DOM, fetch, Electron or storage', () => {
  const sandbox=vm.createContext({structuredClone});
  for (const file of ['planet-selection','war-snapshot','war-planet-pool','galaxy-identities','galaxy-map-model']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets',file+'.js'),'utf8'),sandbox);
  assert.equal(vm.runInContext('HD2GalaxyMap.project({x:0,y:0}).x',sandbox),500);
  assert.equal(vm.runInContext('HD2GalaxyMap.build({now:0}).selectableKeys.length',sandbox),0);
});

test('expired event keeps shared planet policy but never grants current mission authority', () => {
  const p=planet(1,{currentOwner:'Humans',event:{id:7,campaignId:101,faction:'Automaton',startTime:'2026-09-21T05:00:00Z',endTime:'2026-09-21T07:00:00Z'}});
  const value=snapshot([{id:101,faction:'Humans',planet:p}]), now=Date.parse('2026-09-21T07:00:01Z');
  const options=opts({snapshot:value,now,online:false}), out=map.build(options);
  assert.equal(out.warStatus.confirmedCurrentlyPlayable,false);
  const chosen=map.selectPlanet('id:1',options);
  assert.deepEqual(chosen,selection.selectPlanet(prefs.pool(value),'id:1'));
  const c=missionContext.forPlanet(value,{selectedPlanet:chosen,difficulty:7,now,online:false});
  assert.equal(c.context.faction,null);
  assert.equal(missions.createEngine(require('../assets/mission-catalog.json')).roll(c.context),null);
});
test('legacy cache remains a dated offline option rather than atlas-enriched live authority', () => {
  const value=war.readCache({updatedAt:new Date(NOW).toISOString(),planets:[{name:'Planet 1',faction:'Terminids'}]},{now:NOW}).snapshot;
  const out=map.build(opts({snapshot:value}));
  assert.deepEqual(out.selectableKeys,['name:planet 1']);
  assert.equal(out.warStatus.state,'cached'); assert.equal(out.warStatus.lastSuccessfulAt,new Date(NOW).toISOString());
  assert.ok(out.unplacedKeys.includes('name:planet 1'));
});
test('failed refresh cannot be masked by a recently observed atlas', () => {
  const out=map.build(opts({refreshFailed:true}));
  assert.equal(out.atlasStatus.state,'recent-observation');
  assert.equal(out.warStatus.state,'cached'); assert.equal(out.warStatus.confirmedCurrentlyPlayable,false);
});
