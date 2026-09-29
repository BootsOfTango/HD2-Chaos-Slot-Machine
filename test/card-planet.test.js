'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {model}=require('../assets/card-planet');
const atlas=require('../assets/galaxy-atlas-bundled.json');
const {resolveRequest}=require('../electron/local-protocol');
const clone=v=>JSON.parse(JSON.stringify(v));
const card={planet:{name:'Alaraph',sector:'Akira Sector',biome:'Magma'},faction:'Automatons'};
test('legacy identity resolves to neutral bundled sector geography without mutating saved history',()=>{
  const before=JSON.stringify(card),a=JSON.stringify(atlas),v=model(card,atlas);
  assert.equal(v.positionSource,'bundled-reference');assert.ok(v.neighbors.length>0);
  assert.equal(v.name,'Alaraph');assert.equal(v.sector,'Akira Sector');assert.equal(v.faction,'Automatons');assert.equal(v.color,'#ff6874');assert.equal(v.biome,'Magma');
  assert.equal(JSON.stringify(card),before);assert.equal(JSON.stringify(atlas),a);
  assert.ok(v.neighbors.every(p=>!('owner'in p)&&!('faction'in p)));
});
test('new live owners and disabled flags cannot rewrite recorded faction or sector shading',()=>{
  const changed=clone(atlas);changed.planets.forEach(p=>{p.owner='Illuminate';p.disabled=true;p.conditions={biome:'Moon',hazards:['Fire Tornadoes']};});
  assert.deepEqual(model(card,changed),model(card,atlas));
});
test('recorded coordinates win; shared projection keeps north above south and east on the right',()=>{
  const a={planets:[{id:1,name:'A',sector:'Test',position:{x:0,y:0}},{id:2,name:'B',sector:'Test',position:{x:-.1,y:.1}}]};
  const v=model({planet:{id:1,name:'Recorded A',sector:'Test',position:{x:.2,y:-.2}},faction:'Terminids'},a);
  assert.equal(v.positionSource,'recorded');assert.equal(v.name,'Recorded A');assert.equal(v.color,'#ffda42');
  assert.ok(v.target.x>v.neighbors[0].point.x);assert.ok(v.target.y>v.neighbors[0].point.y);
});
test('missing or changed sector does not invent historical sector membership',()=>{
  const v=model({planet:{id:140,name:'Old A',sector:'Old sector'},faction:'Illuminate'},atlas);
  assert.ok(v.target);assert.equal(v.sector,'Old sector');assert.equal(v.neighbors.length,0);
});
test('missing, ambiguous, invalid or custom identities use an honest fallback',()=>{
  assert.equal(model({},atlas),null);assert.equal(model({planet:[]},atlas),null);
  for(const planet of [{name:'Custom'},{id:999999,name:'Alaraph'},{id:'140',name:'Alaraph'},{name:'Alaraph',sector:'Wrong'}, {name:'Mars',position:{x:Infinity,y:0}}]) {
    const v=model({planet},atlas);assert.equal(v.target,null);assert.equal(v.positionSource,'unavailable');assert.equal(v.neighbors.length,0);
  }
  const dup=clone(atlas);dup.planets.push(clone(dup.planets.find(p=>p.id===140)));
  assert.equal(model({planet:{id:140,name:'Alaraph'}},dup).target,null);
});
test('absent atlas still supports recorded coordinates and recorded biome, never live fallback',()=>{
  const v=model({planet:{name:'Old planet',position:{x:0,y:0},biome:'Moon'},planetBiome:'Magma',faction:'Unknown'},null);
  assert.equal(v.biome,'Magma');assert.equal(v.color,'#b8c7d3');assert.deepEqual(v.target,{x:180,y:118});assert.equal(v.neighbors.length,0);
});
test('thumbnail positions stay bounded for every bundled planet',()=>{
  for(const p of atlas.planets){const v=model({planet:{id:p.id,name:p.name,sector:p.sector}},atlas);if(!v.target)continue;
    for(const point of [v.target,...v.neighbors.map(n=>n.point),...v.region]){assert.ok(point.x>=96-1e-9&&point.x<=264+1e-9);assert.ok(point.y>=34-1e-9&&point.y<=202+1e-9);}
  }
});

test('Genesis Prime has a shaded Rictus cluster and reference links, using its saved faction',()=>{
  const c={planet:{name:'GENESIS PRIME',sector:'Rictus'},faction:'Illuminate'},before=JSON.stringify(c);
  const v=model(c,atlas);
  assert.equal(v.color,'#ba89ff');assert.equal(v.sector,'Rictus');
  assert.ok(v.region.length>=8);assert.ok(v.connections.length>0);
  assert.ok(v.connections.some(e=>e.selected));
  assert.equal(JSON.stringify(c),before);
});

test('legacy curly apostrophes preserve sector geography without rewriting the recorded label',()=>{
  const c={planet:{name:'Nabatea Secundus',sector:'L’estrade Sector'},faction:'Terminids'};
  const before=JSON.stringify(c),v=model(c,atlas);
  assert.ok(v.target);assert.ok(v.region.length>0);assert.ok(v.neighbors.length>0);
  assert.ok(v.connections.length>0);assert.equal(v.sector,'L’estrade Sector');
  assert.equal(JSON.stringify(c),before);
  const straight=clone(c);straight.planet.sector="L'estrade Sector";
  assert.deepEqual(v.region,model(straight,atlas).region);
});

test('reference routes deduplicate reverse links and reject missing, self and cross-sector endpoints',()=>{
  const a={planets:[{id:1,name:'A',sector:'S',position:{x:0,y:0},waypoints:[1,2,2,3,999]},
    {id:2,name:'B',sector:'S',position:{x:.1,y:.1},waypoints:[1]},
    {id:3,name:'C',sector:'Elsewhere',position:{x:.2,y:.2},waypoints:[1]}]};
  const v=model({planet:{id:1,sector:'S'},faction:'Terminids'},a);
  assert.deepEqual(v.connections.map(e=>e.key),['1:2']);assert.equal(v.connections[0].selected,true);
  a.planets.forEach(p=>p.waypoints=[]);
  const without=model({planet:{id:1,sector:'S'},faction:'Terminids'},a);
  assert.equal(without.connections.length,0);assert.deepEqual(without.region,v.region);
});

test('mismatched or unknown sector has no invented outline or routes',()=>{
  for(const c of [{planet:{id:95,sector:'Old sector'}},{planet:{name:'Custom',position:{x:.1,y:.2}}}]){
    const v=model(c,atlas);assert.equal(v.region.length,0);assert.equal(v.connections.length,0);
  }
});
test('new assets allowed only through existing local application protocol',()=>{
  for(const file of ['card-planet.js','card-planet.css'])assert.equal(resolveRequest('hd2-slot://app/assets/'+file).status,200);
});
