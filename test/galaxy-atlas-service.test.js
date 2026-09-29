'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const api=require('../assets/galaxy-atlas-service'), map=require('../assets/galaxy-map-model');
const START=Date.parse('2026-09-22T06:00:00Z');
const rows=(id=1)=>[{index:id,name:'Planet '+id,sector:'Test',currentOwner:'Terminids',position:{x:.2,y:.3},disabled:false}];
const atlas=(id=1,now=START)=>map.normalizeAtlas(rows(id),{now});
const response=(data=rows())=>new Response(JSON.stringify(data));
const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve();};
function disk(raw=null){const values=new Map(raw===null?[]:[[api.CACHE_KEY,raw]]),writes=[];return {values,writes,getItem:k=>values.get(k)??null,setItem:(k,v)=>{writes.push(k);values.set(k,v);}};}
function fixture(extra={}){
  let time=START,id=0;const timers=new Map(),calls=[],storage=extra.storage||disk();
  const service=api.createService({storage,bundledAtlas:atlas(9,START-600000),now:()=>time,
    setTimer:(fn,ms)=>{timers.set(++id,{fn,at:time+ms});return id;},clearTimer:i=>timers.delete(i),...extra,
    fetchImpl:(...args)=>{calls.push(args);return (extra.fetchImpl||(()=>response()))(...args);}});
  return {service,storage,timers,calls,jump:ms=>{time+=ms;},tick:async ms=>{time+=ms;for(const [id,t]of [...timers])if(t.at<=time){timers.delete(id);t.fn();}await flush();}};
}

test('explicit start schedules five-minute refresh, deduplicates starts and stop removes timers',async()=>{
  const f=fixture();await f.service.start();assert.equal(f.calls.length,1);assert.equal(f.timers.size,1);
  await f.service.start();assert.equal(f.calls.length,1);await f.tick(api.FRESH_MS-1);assert.equal(f.calls.length,1);
  await f.tick(1);await flush();assert.equal(f.calls.length,2);f.service.stop();assert.equal(f.timers.size,0);f.service.dispose();
});
test('hidden/offline lifecycle pauses polling and resumes stale data without duplicate schedules',async()=>{
  const f=fixture();await f.service.start();await f.service.setActive(false);assert.equal(f.timers.size,0);
  await f.tick(api.FRESH_MS);assert.equal(f.calls.length,1);await f.service.setActive(true);assert.equal(f.calls.length,2);
  await f.service.setOnline(false);assert.equal(f.timers.size,0);await f.tick(api.FRESH_MS);
  await f.service.setOnline(true);assert.equal(f.calls.length,3);assert.equal(f.timers.size,1);f.service.dispose();assert.equal(f.timers.size,0);
});
test('automatic rate-limit retries preserve prior atlas and wait for server delay',async()=>{
  const f=fixture({fetchImpl:()=>new Response('',{status:429,headers:{'Retry-After':'600'}})}),before=f.service.getState().atlas;
  await f.service.start();assert.strictEqual(f.service.getState().atlas,before);await f.tick(599999);assert.equal(f.calls.length,1);
  await f.tick(1);assert.equal(f.calls.length,2);f.service.dispose();assert.equal(f.timers.size,0);
});
test('stop cancels in-flight polling; late transport completion cannot restart it',async()=>{
  let resolve;const f=fixture({fetchImpl:()=>new Promise(r=>resolve=r)});const pending=f.service.start();await flush();f.service.stop();
  assert.equal((await pending).outcome,'cancelled');resolve(response());await flush();assert.equal(f.storage.writes.length,0);assert.equal(f.timers.size,0);f.service.dispose();
});
test('construction is synchronous and first offline launch has dated bundled positions without a request',async()=>{
  const f=fixture({online:false});assert.equal(f.calls.length,0);assert.equal(f.timers.size,0);
  assert.equal(f.service.getState().source,'bundled');assert.ok(f.service.getState().atlas.planets[0].position);
  assert.equal((await f.service.refresh('startup')).reason,'offline');assert.equal(f.storage.writes.length,0);
  f.service.dispose();
});
test('validated fetch is bounded, anonymous and writes only the independent atlas key',async()=>{
  const f=fixture();assert.equal((await f.service.refresh('startup')).outcome,'updated');
  const [url,o]=f.calls[0];assert.equal(url,api.URL);assert.equal(o.credentials,'omit');assert.equal(o.redirect,'error');assert.equal(o.headers['Accept-Language'],'en-US');
  assert.deepEqual(f.storage.writes,[api.CACHE_KEY]);assert.equal(f.service.getState().source,'network');assert.equal(f.service.getState().confirmedCurrentlyPlayable,false);
  assert.equal(f.timers.size,0);f.service.dispose();
});
test('cached atlas survives a second service instance without becoming a network observation',async()=>{
  const f=fixture();await f.service.refresh();f.service.dispose();
  const g=fixture({storage:f.storage,online:false});assert.equal(g.service.getState().source,'cache');assert.equal(g.service.getState().atlas.planets[0].id,1);assert.equal(g.calls.length,0);g.service.dispose();
});
test('older cache cannot replace newer bundle; newest valid cache can',()=>{
  const old=fixture({storage:disk(JSON.stringify(atlas(2,START-700000)))});assert.equal(old.service.getState().source,'bundled');old.service.dispose();
  const newer=fixture({storage:disk(JSON.stringify(atlas(2,START-1000)))});assert.equal(newer.service.getState().source,'cache');newer.service.dispose();
});
test('damaged and unsupported cache bytes are preserved while memory refresh still works',async()=>{
  for(const raw of ['{broken',JSON.stringify({...atlas(),version:99}),JSON.stringify({...atlas(),planets:[{...atlas().planets[0],position:{x:99,y:0}}]})]){
    const f=fixture({storage:disk(raw)});assert.ok(f.service.getState().cacheWarning.endsWith('-preserved'));
    assert.equal((await f.service.refresh()).outcome,'updated');assert.equal(f.storage.getItem(api.CACHE_KEY),raw);assert.equal(f.storage.writes.length,0);f.service.dispose();
  }
});
test('cache validation rejects unknown fields, sparse/malformed rows and invalid dates',()=>{
  for(const value of [{...atlas(),extra:1},{...atlas(),observedAt:'nope'},{...atlas(),planets:[null]}, {...atlas(),planets:[{...atlas().planets[0],name:42}]}]) assert.equal(api.decode(JSON.stringify(value),START).status,'invalid');
  assert.equal(api.decode('x'.repeat(api.MAX_BYTES+1),START).status,'invalid');
});
test('cache read errors, write errors and memory-only mode cannot prevent in-memory updates',async()=>{
  for(const storage of [null,{getItem(){throw Error('blocked');}},{getItem(){return null;},setItem(){throw Error('quota');}}]){
    const f=fixture({storage});assert.equal((await f.service.refresh()).outcome,'updated');assert.ok(f.service.getState().cacheWarning);f.service.dispose();
  }
});
test('external cache replacement is preserved rather than overwritten',async()=>{
  const f=fixture();f.storage.values.set(api.CACHE_KEY,'other writer');await f.service.refresh();assert.equal(f.service.getState().cacheWarning,'cache-changed-preserved');assert.equal(f.storage.getItem(api.CACHE_KEY),'other writer');f.service.dispose();
});
test('simultaneous requests deduplicate and observers cannot reenter fetch',async()=>{
  let resolve;const pending=new Promise(r=>resolve=r), f=fixture({fetchImpl:()=>pending});
  let reentered;const off=f.service.subscribe(s=>{if(s.refreshing)reentered=f.service.refresh();});
  const first=f.service.refresh();assert.strictEqual(reentered,first);assert.strictEqual(f.service.refresh('startup'),first);await flush();assert.equal(f.calls.length,1);
  resolve(response());await first;off();f.service.dispose();
});
test('cooldown, background freshness and explicit manual refresh follow separate rules',async()=>{
  const f=fixture();await f.service.refresh();assert.equal((await f.service.refresh()).reason,'cooldown');
  f.jump(api.COOLDOWN_MS);assert.equal((await f.service.refresh('background')).reason,'recent');
  assert.equal((await f.service.refresh()).outcome,'updated');f.jump(api.FRESH_MS);assert.equal((await f.service.refresh('resume')).outcome,'updated');f.service.dispose();
});
test('network failure retains prior data and backoff doubles',async()=>{
  const f=fixture({fetchImpl:()=>Promise.reject(Error('offline'))}), before=f.service.getState().atlas;
  await f.service.refresh();assert.strictEqual(f.service.getState().atlas,before);assert.equal(f.service.getState().nextAllowedAt,START+30000);
  f.jump(30000);await f.service.refresh();assert.equal(f.service.getState().nextAllowedAt,START+90000);assert.equal(f.service.getState().stale,true);f.service.dispose();
});
test('HTTP Retry-After delay is honored without a spinning retry timer',async()=>{
  const f=fixture({fetchImpl:()=>new Response('',{status:429,headers:{'Retry-After':'600'}})});await f.service.refresh();
  assert.equal(f.service.getState().nextAllowedAt,START+600000);assert.equal(f.timers.size,0);f.service.dispose();
});
test('HTTP-date Retry-After and large delay do not overflow',async()=>{
  for(const value of [new Date(START+3600000).toUTCString(),'999999999999999999999']){
    const f=fixture({fetchImpl:()=>new Response('',{status:503,headers:{'Retry-After':value}})});await f.service.refresh();assert.ok(f.service.getState().nextAllowedAt>=START+3600000);assert.ok(Number.isSafeInteger(f.service.getState().nextAllowedAt));f.service.dispose();
  }
});
test('timeout settles even if transport ignores abort, late success cannot save',async()=>{
  let resolve;const f=fixture({fetchImpl:()=>new Promise(r=>resolve=r)}),before=f.service.getState().atlas;
  const pending=f.service.refresh();await flush();await f.tick(api.TIMEOUT_MS);assert.equal((await pending).reason,'timeout');resolve(response(rows(3)));await flush();
  assert.strictEqual(f.service.getState().atlas,before);assert.equal(f.storage.writes.length,0);assert.equal(f.timers.size,0);f.service.dispose();
});
test('offline/dispose cancellation discards late responses without registering network failure',async()=>{
  for(const action of ['offline','dispose']){
    let resolve;const f=fixture({fetchImpl:()=>new Promise(r=>resolve=r)}),pending=f.service.refresh();await flush();
    action==='offline'?f.service.setOnline(false):f.service.dispose();assert.equal((await pending).outcome,'cancelled');resolve(response());await flush();assert.equal(f.storage.writes.length,0);assert.equal(f.service.getState().failures,0);assert.equal(f.timers.size,0);f.service.dispose();
  }
});
test('dispose before scheduled microtask prevents the fetch entirely',async()=>{
  const f=fixture(),p=f.service.refresh();f.service.dispose();assert.equal((await p).outcome,'cancelled');assert.equal(f.calls.length,0);assert.equal((await f.service.refresh()).reason,'disposed');
});
test('streaming size limits reject declared and actual oversized bodies',async()=>{
  for(const make of [()=>new Response('{}',{headers:{'Content-Length':String(api.MAX_BYTES+1)}}),()=>new Response(' '.repeat(api.MAX_BYTES+1))]){
    const f=fixture({fetchImpl:make});assert.equal((await f.service.refresh()).reason,'response-too-large');assert.equal(f.storage.writes.length,0);f.service.dispose();
  }
});
test('invalid JSON, duplicates, empty or partially malformed responses retain last good atlas',async()=>{
  for(const make of [()=>new Response('{broken'),()=>response([]),()=>response([...rows(),...rows()]),()=>response([...rows(),{index:'invalid',name:'bad'}])]){
    const f=fixture({fetchImpl:make}),before=f.service.getState().atlas;assert.equal((await f.service.refresh()).outcome,'failed');assert.strictEqual(f.service.getState().atlas,before);assert.equal(f.storage.writes.length,0);f.service.dispose();
  }
});
test('clock rollback cannot replace a later accepted observation',async()=>{
  const f=fixture({storage:disk(JSON.stringify(atlas(2,START+30000)))});assert.equal((await f.service.refresh()).reason,'older-observation');assert.equal(f.service.getState().atlas.planets[0].id,2);f.service.dispose();
});
test('atlas refresh cannot make display planets selectable without campaigns',async()=>{
  const f=fixture();await f.service.refresh();const view=map.build({atlas:f.service.getState().atlas,now:START});assert.equal(view.planets.length,1);assert.deepEqual(view.selectableKeys,[]);f.service.dispose();
});
test('damaged bundled metadata does not block a valid cache or in-memory recovery',async()=>{
  const f=fixture({bundledAtlas:{version:99},storage:disk(JSON.stringify(atlas(2)))});
  assert.equal(f.service.getState().bundleWarning,'invalid-bundled-atlas');assert.equal(f.service.getState().atlas.planets[0].id,2);
  assert.equal((await f.service.refresh()).outcome,'updated');f.service.dispose();
});
test('without bundled or cached metadata the model remains usable as a no-atlas fallback',async()=>{
  const f=fixture({bundledAtlas:null,online:false});assert.equal(f.service.getState().source,'unavailable');
  assert.equal((await f.service.refresh()).reason,'offline');assert.deepEqual(map.build({atlas:f.service.getState().atlas,now:START}).selectableKeys,[]);f.service.dispose();
});
test('stream body stall times out separately from receiving HTTP headers',async()=>{
  const f=fixture({fetchImpl:()=>new Response(new ReadableStream({start(){}}))});
  const p=f.service.refresh();await flush();await f.tick(api.TIMEOUT_MS);assert.equal((await p).reason,'timeout');assert.equal(f.storage.writes.length,0);f.service.dispose();
});
test('a transient quota failure can recover without altering the original stored value on failure',async()=>{
  const store=disk(),original=store.setItem;let fail=true;store.setItem=(k,v)=>{if(fail)throw Error('quota');original(k,v);};
  const f=fixture({storage:store});await f.service.refresh();assert.equal(store.getItem(api.CACHE_KEY),null);assert.equal(f.service.getState().cacheWarning,'cache-write-failed');
  fail=false;f.jump(api.COOLDOWN_MS);await f.service.refresh();assert.equal(f.service.getState().cacheWarning,null);assert.ok(store.getItem(api.CACHE_KEY));f.service.dispose();
});
test('browser service runs against injected fetch/storage without Node or Electron',async()=>{
  const sandbox=vm.createContext({AbortController,TextDecoder,structuredClone,atlasFixture:atlas(9),
    request:async()=>response(),setTimeout:()=>1,clearTimeout:()=>{},now:()=>START});
  for(const name of ['planet-selection','war-snapshot','war-planet-pool','war-refresh','galaxy-map-model','galaxy-atlas-service'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets',name+'.js'),'utf8'),sandbox);
  assert.equal(await vm.runInContext(`(async()=>{const s=HD2GalaxyAtlas.createService({bundledAtlas:atlasFixture,now,fetchImpl:request});try{return (await s.refresh()).outcome;}finally{s.dispose();}})()`,sandbox),'updated');
});
