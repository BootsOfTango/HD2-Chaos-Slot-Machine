'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const view=require('../assets/galaxy-map-view'),model=require('../assets/galaxy-map-model');
const atlas=require('../assets/galaxy-atlas-bundled.json');
test('camera bounds preserve square projection and prevent losing the galaxy',()=>{
  assert.deepEqual(view.camera(),{x:0,y:0,size:1000});
  assert.deepEqual(view.camera({x:-30,y:5000,size:400}),{x:0,y:600,size:400});
  assert.deepEqual(view.camera({x:20,y:20,size:2000}),{x:0,y:0,size:1000});
  assert.equal(view.camera({x:0,y:0,size:1}).size,180);
  for(const bad of [null,{x:NaN,y:0,size:100},{x:0,y:0,size:Infinity}])assert.throws(()=>view.camera(bad));
});
test('zoom keeps cursor anchor fixed and clamps zoom',()=>{
  assert.deepEqual(view.zoom(view.camera(),2,{x:.25,y:.75}),{x:125,y:375,size:500});
  assert.deepEqual(view.zoom(view.zoom(view.camera(),2),.5),view.camera());
  assert.equal(view.zoom(view.camera(),100).size,180);
  for(const factor of [0,-1,NaN,Infinity])assert.throws(()=>view.zoom(view.camera(),factor));
  assert.throws(()=>view.zoom(view.camera(),2,{x:2,y:0}));
});
test('search matches names sectors factions and ignores case and whitespace',()=>{
  const p={name:'Malevelon Creek',sector:'Severin',owner:'Automatons'};
  for(const q of ['creek',' SEVERIN ','auto',''])assert.equal(view.matches(p,q),true);
  assert.equal(view.matches(p,'terminids'),false);
});

test('search accepts straight/curly apostrophes and compatible Unicode without identity changes',()=>{
  const p={name:'Angel’s Venture',sector:'L’estrade'},before=JSON.stringify(p);
  for(const q of ["angel's",'Angel’s',"l'estrade",'Ａｎｇｅｌ'])assert.equal(view.matches(p,q),true);
  assert.equal(JSON.stringify(p),before);assert.equal(view.matches(p,'Angelz'),false);
});
test('invalid selection guard is rejected before creating map elements',()=>{
  assert.throws(()=>view.mount({ownerDocument:{}},{getInputs:()=>({}),canChoose:false}),/callbacks required/);
});

test('pinch zoom preserves centroid anchor, translates pan and bounds the camera',()=>{
  const start=[{x:.4,y:.5},{x:.6,y:.5}],end=[{x:.3,y:.5},{x:.7,y:.5}];
  const result=view.gestureCamera(view.camera(),start,end);
  assert.ok(Math.abs(result.size-500)<1e-9);assert.ok(Math.abs(result.x-250)<1e-9);
  assert.ok(Math.abs(result.y-250)<1e-9);
  assert.deepEqual(view.gestureCamera({x:200,y:200,size:500},[{x:.5,y:.5}],[{x:.6,y:.6}]),{x:150,y:150,size:500});
  const clamped=view.gestureCamera(view.camera(),start,[{x:-10,y:.5},{x:10,y:.5}]);assert.equal(clamped.size,180);
  assert.deepEqual(view.gestureCamera(view.camera(),[{x:.5,y:.5},{x:.5,y:.5}],start),view.camera());
  for(const pair of [[[],[]],[start,[]],[[{x:NaN,y:0}],[{x:0,y:0}]]])assert.throws(()=>view.gestureCamera(view.camera(),...pair));
});
test('overlapping markers pick nearest center, independent of paint order or eligibility',()=>{
  const planets=[{key:'id:0',screen:{x:500,y:500},selectable:false},{key:'id:265',screen:{x:505,y:501},selectable:true},{key:'name:unplaced',screen:null}];
  for(const rows of [planets,[...planets].reverse()]){
    assert.equal(view.nearestPlanet(rows,{x:500,y:500}).key,'id:0');
    assert.equal(view.nearestPlanet(rows,{x:505,y:501}).key,'id:265');
    assert.equal(view.nearestPlanet(rows,{x:900,y:900}),null);
  }
  assert.equal(view.nearestPlanet([{key:'b',screen:{x:1,y:0}},{key:'a',screen:{x:-1,y:0}}],{x:0,y:0}).key,'a');
  assert.throws(()=>view.nearestPlanet(planets,{x:NaN,y:0}));
});
test('bundled atlas is valid, complete for its dated observation, immutable and nonplayable alone',()=>{
  const normalized=model.validateAtlas(atlas,{now:Date.parse(atlas.observedAt)});
  assert.equal(normalized.planets.length,273);assert.deepEqual(normalized.issues,[]);
  const result=model.build({atlas,now:Date.parse(atlas.observedAt)});
  assert.equal(result.planets.length,273);assert.equal(result.unplacedKeys.length,0);
  assert.equal(result.selectableKeys.length,0);assert.equal(result.warStatus.confirmedCurrentlyPlayable,false);
  assert.ok(Object.isFrozen(normalized.planets[0]));
});
test('dated bundle matches the previously observed coordinate anchors without rotation',()=>{
  const anchors=require('./fixtures/galaxy-coordinate-anchors.json');
  for(const anchor of anchors.planets){const p=atlas.planets.find(p=>p.id===anchor.index);assert.deepEqual(p.position,anchor.position);}
});
test('complete bundle boots the atlas service offline with empty storage and no network',async()=>{
  const api=require('../assets/galaxy-atlas-service');let requests=0,writes=0;
  const service=api.createService({bundledAtlas:atlas,online:false,storage:{getItem:()=>null,setItem:()=>{writes++;}},fetchImpl:()=>{requests++;throw Error('Offline');}});
  try{assert.equal(service.getState().source,'bundled');assert.equal(service.getState().atlas.planets.length,273);
    assert.equal((await service.refresh('startup')).reason,'offline');assert.equal(requests,0);assert.equal(writes,0);
    assert.equal(service.getState().confirmedCurrentlyPlayable,false);
  }finally{service.dispose();}
});
test('bundle provenance checksum identifies exactly the reviewed normalized data',()=>{
  const provenance=require('../assets/galaxy-atlas-provenance.json');
  const digest=crypto.createHash('sha256').update(JSON.stringify(atlas)).digest('hex');
  assert.equal(digest,provenance.normalizedSha256);assert.equal(provenance.observedAt,atlas.observedAt);
});
test('view has no HTML injection sinks or network and main page loads the reviewed adapter',()=>{
  const script=fs.readFileSync(path.join(__dirname,'../assets/galaxy-map-view.js'),'utf8');
  assert.doesNotMatch(script,/innerHTML|outerHTML|insertAdjacentHTML|\beval\s*\(|\bfetch\s*\(/);
  assert.match(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),/src="assets\/galaxy-app.js"/);
});
test('original decorative styling adds no external images, animation loop or SVG filter workload',()=>{
  const script=fs.readFileSync(path.join(__dirname,'../assets/galaxy-map-view.js'),'utf8');
  const css=fs.readFileSync(path.join(__dirname,'../assets/galaxy-map-view.css'),'utf8');
  assert.doesNotMatch(script,/requestAnimationFrame|setInterval|svgEl\(['"](?:image|filter|animate)['"]/);
  assert.doesNotMatch(css,/@import|@keyframes|url\s*\(|animation\s*:/);
});
