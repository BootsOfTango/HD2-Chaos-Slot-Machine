'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),model=require('../assets/galaxy-map-model');
const api=require('../assets/galaxy-atlas-service');
const NOW=Date.parse('2026-09-22T00:00:00Z');
const row=(index,waypoints,extra={})=>({index,name:'Planet '+index,sector:'Test',position:{x:index*.1,y:0},waypoints,...extra});
const normalize=rows=>model.normalizeAtlas(rows,{now:NOW});
test('only API links render, reciprocal links deduplicate and self links are ignored',()=>{
  const atlas=normalize([row(1,[2,2,1]),row(2,[1]),row(3,[])]),view=model.build({atlas,now:NOW});
  assert.equal(view.connections.length,1);assert.equal(view.connections[0].key,'1:2');
  assert.deepEqual(view.connections[0].fromScreen,model.project({x:.1,y:0}));assert.deepEqual(view.selectableKeys,[]);
});
test('missing, invalid and coordinate-less targets do not acquire invented connections',()=>{
  const atlas=normalize([row(1,[2,9]),row(2,[],{position:null})]),view=model.build({atlas,now:NOW});
  assert.deepEqual(view.connections,[]);assert.ok(view.issues.includes('unresolved-waypoint'));
  for(const value of ['2',[-1],[1.1],[null],Array(257).fill(2)])assert.throws(()=>normalize([row(1,value)]));
});
test('sector membership is preserved with centroid labels, never inferred borders',()=>{
  const atlas=normalize([row(1,[],{sector:'Alpha'}),row(2,[],{sector:'Alpha'}),row(3,[],{sector:'Beta'})]);
  const view=model.build({atlas,now:NOW});assert.equal(view.sectors.length,2);assert.deepEqual(view.sectors[0].keys,['id:1','id:2']);
  assert.equal(view.sectorBoundaries,null);assert.equal(view.exactTerritoryGeometry,false);
});
test('legacy atlas cache without waypoints remains readable but cannot fabricate links',()=>{
  const atlas=normalize([row(1,undefined)]);assert.equal(api.decode(JSON.stringify(atlas),NOW).status,'valid');
  const view=model.build({atlas,now:NOW});assert.equal(view.connectionsAvailable,false);assert.deepEqual(view.connections,[]);
});
test('waypoints survive validated cache round-trip and bad cache lists are rejected',()=>{
  const atlas=normalize([row(1,[2]),row(2,[])]);assert.deepEqual(api.decode(JSON.stringify(atlas),NOW).atlas,atlas);
  atlas.planets.forEach(p=>assert.ok(Object.isFrozen(p.waypoints)));
  const bad=structuredClone(atlas);bad.planets[0].waypoints=['2'];assert.equal(api.decode(JSON.stringify(bad),NOW).status,'invalid');
});
test('replacement snapshots remove obsolete links, inputs are not mutated',()=>{
  const a=normalize([row(1,[2]),row(2,[])]),b=normalize([row(1,[]),row(2,[])]),before=JSON.stringify(a);
  assert.equal(model.build({atlas:a,now:NOW}).connections.length,1);assert.equal(model.build({atlas:b,now:NOW}).connections.length,0);assert.equal(JSON.stringify(a),before);
});
