'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const map=require('../assets/galaxy-map-model'),view=require('../assets/galaxy-map-view');
const api=require('../assets/galaxy-atlas-service'),war=require('../assets/war-snapshot');
const now=Date.parse('2026-09-23T12:00:00Z');
const planet=(extra={})=>({index:34,name:'HELLMIRE',sector:'Mirin',position:{x:.5,y:.3},currentOwner:'Terminids',...extra});
const atlas=extra=>map.normalizeAtlas([planet(extra)],{now});
test('atlas retains bounded biome and weather names through cache without altering eligibility',()=>{
  const a=atlas({biome:{name:'Desert Dunes'},hazards:[{name:'Fire Tornadoes'},{name:'Intense Heat'}],specialActivity:['unverified']});
  const decoded=api.decode(JSON.stringify(a),now);
  assert.equal(decoded.status,'valid');assert.deepEqual(decoded.atlas,a);
  const p=map.build({atlas:decoded.atlas,now}).planets[0];
  assert.equal(p.environment.biome,'Desert Dunes');assert.deepEqual(p.environment.hazards,['Fire Tornadoes','Intense Heat']);
  assert.equal(p.environment.recent,true);assert.equal(p.selectable,false);assert.equal(p.specialActivity,'not-reported');
  assert.equal(Object.hasOwn(a.planets[0],'specialActivity'),false);assert.ok(Object.isFrozen(p.environment.hazards));
});
test('legacy atlas without conditions remains valid and cannot invent weather',()=>{
  const a=atlas({});assert.equal(Object.hasOwn(a.planets[0],'conditions'),false);
  assert.deepEqual(map.validateAtlas(a,{now}),a);
  const p=map.build({atlas:a,now}).planets[0];assert.equal(p.environment.biome,null);assert.equal(p.environment.hazards,null);
});
test('missing, malformed, None and empty hazards are not a claim of no modifiers',()=>{
  for(const hazards of [undefined,null,'Fire',[],[{name:'None'}],Array(33).fill({name:'Fire'}),[{name:'good'},{name:''}]]){
    const p=map.build({atlas:atlas({hazards}),now}).planets[0];
    assert.equal(view.environmentSummary(p).weatherUnknown,true);
    assert.equal(p.specialActivity,'not-reported');
  }
});
test('malformed cached condition objects are rejected and original cache is not normalized away',()=>{
  for(const conditions of [{biome:4,hazards:[]},{biome:null,hazards:['x\n']},{biome:null,hazards:[],url:'https://bad'},{}]){
    const a=atlas({});a;const changed=JSON.parse(JSON.stringify(a));changed.planets[0].conditions=conditions;
    assert.equal(api.decode(JSON.stringify(changed),now).status,'invalid');
  }
});
test('labels cannot upgrade stale/offline/failed observations to realtime',()=>{
  const a=atlas({biome:{name:'Magma'},hazards:[{name:'Volcanic Activity'}]});
  for(const extra of [{online:false},{atlasRefreshFailed:true},{now:now+300000}]){
    const p=map.build({atlas:a,now,...extra}).planets[0];
    assert.equal(p.environment.recent,false);assert.match(view.environmentSummary(p).stamp,/Cached \/ unconfirmed/);
  }
});
test('newer campaign conditions replace older atlas conditions without borrowing its timestamp',()=>{
  const a=atlas({biome:{name:'Old biome'},hazards:[{name:'Old hazard'}]});
  const snapshot=war.normalizeCampaigns([{id:1,faction:'Terminids',planet:planet({biome:{name:'New biome'},hazards:[]})}],{now:now+60000});
  const p=map.build({atlas:a,snapshot,now:now+60000}).planets[0];
  assert.equal(p.environment.source,'campaigns');assert.equal(p.environment.biome,'New biome');
  assert.deepEqual(p.environment.hazards,[]);assert.equal(p.environment.observedAt,snapshot.fetchedAt);
  assert.equal(map.build({atlas:a,snapshot,now:now+60000,refreshFailed:true}).planets[0].environment.recent,false);
});
test('new successful atlas response replaces removed hazards and keeps separate campaign rules',async()=>{
  let clock=now,raw=planet({biome:{name:'Desert'},hazards:[{name:'Fire Tornadoes'}]}),writes=new Map();
  const service=api.createService({now:()=>clock,storage:{getItem:k=>writes.get(k)??null,setItem:(k,v)=>writes.set(k,v)},fetchImpl:async()=>new Response(JSON.stringify([raw]))});
  try{
    await service.refresh('manual');assert.deepEqual(service.getState().atlas.planets[0].conditions.hazards,['Fire Tornadoes']);
    raw=planet({biome:{name:'Desert'},hazards:[]});clock+=30000;await service.refresh('manual');
    assert.deepEqual(service.getState().atlas.planets[0].conditions.hazards,[]);
    assert.equal(api.decode(writes.get(api.CACHE_KEY),clock).status,'valid');
    const snapshot=war.normalizeCampaigns([{id:1,faction:'Terminids',planet:raw}],{now:clock});
    assert.deepEqual(map.build({atlas:service.getState().atlas,snapshot,now:clock}).selectableKeys,['id:34']);
  }finally{service.dispose();}
});
test('sector cluster shading uses each recorded faction without rotating or inventing membership',()=>{
  const planets=[{sector:'A',screen:{x:100,y:100},owner:'Terminids'},
    {sector:'A',screen:{x:150,y:150},owner:'Super Earth',enemyFaction:'Automatons'},
    {sector:'B',screen:{x:900,y:900},owner:'Illuminate'},{sector:'A',screen:null,owner:'Illuminate'}];
  const result=view.sectorRegions(planets,'A');assert.deepEqual(result.map(r=>r.faction),['Terminids','Automatons']);
  for(const r of result){assert.ok(r.points.length>=4);assert.ok(r.points.every(p=>p.x<200&&p.y<200));}
  assert.deepEqual(view.sectorRegions(planets,''),[]);assert.deepEqual(view.sectorRegions(planets,'missing'),[]);
});
test('original weather icon classification is presentation only; unfamiliar labels retain generic icon',()=>{
  assert.equal(view.conditionIcon('Blizzards'),'cold');assert.equal(view.conditionIcon('Fire Tornadoes'),'heat');
  assert.equal(view.conditionIcon('Ion Storms'),'storm');assert.equal(view.conditionIcon('Rainstorms'),'storm');
  assert.equal(view.conditionIcon('Dense Fog'),'fog');assert.equal(view.conditionIcon('Unrecognized modifier'),'planet');
});
