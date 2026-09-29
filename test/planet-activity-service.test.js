'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../assets/planet-activity-service'),model=require('../assets/planet-activity'),galaxy=require('../assets/galaxy-map-model');
const START=Date.parse('2026-09-24T05:00:00Z');
const raw=(time=100,warId=801)=>({warId,time,planetStatus:[{index:1}],planetActiveEffects:[{index:1,galacticEffectId:1308}]});
const normalized=()=>model.normalize(raw(),{expectedWarId:801,fetchedAt:new Date(START).toISOString()});
const response=data=>new Response(JSON.stringify(data));
const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
function disk(value=null){const values=new Map(value===null?[]:[[api.CACHE_KEY,value]]),writes=[];return {values,writes,getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v);writes.push(k);}};}
function fixture(extra={}){
  let time=START,n=0;const timers=new Map(),calls=[],storage=Object.hasOwn(extra,'storage')?extra.storage:disk();
  const service=api.createService({storage,now:()=>time,setTimer:(fn,ms)=>{timers.set(++n,{fn,at:time+ms});return n;},clearTimer:k=>timers.delete(k),...extra,
    fetchImpl:(url,opts)=>{calls.push([url,opts]);return extra.fetchImpl?extra.fetchImpl(url,opts):response(url===api.URL?{id:801}:raw());}});
  return {service,storage,calls,timers,jump:ms=>time+=ms,tick:async ms=>{time+=ms;for(const [id,t]of [...timers])if(t.at<=time){timers.delete(id);t.fn();}await flush();}};
}
test('construction/offline first launch never fetches or invents bundled activity',async()=>{
  const f=fixture({online:false});assert.equal(f.calls.length,0);assert.equal(f.service.getState().snapshot,null);
  assert.equal((await f.service.start()).reason,'offline');assert.equal(f.timers.size,0);f.service.dispose();
});
test('discovers war ID and makes anonymous bounded requests with separate cache',async()=>{
  const f=fixture();assert.equal((await f.service.refresh()).outcome,'updated');assert.equal(f.calls.length,2);
  assert.equal(f.calls[1][0],'https://api.helldivers2.dev/raw/api/WarSeason/801/Status');
  for(const [,o]of f.calls){assert.equal(o.credentials,'omit');assert.equal(o.redirect,'error');assert.ok(o.signal);}
  assert.deepEqual(f.storage.writes,[api.CACHE_KEY]);assert.equal(f.service.getState().stale,false);f.service.dispose();
});
test('unchanged counters do not renew freshness even after a successful request',async()=>{
  const f=fixture();await f.service.refresh();const stamp=f.service.getState().snapshot.fetchedAt;
  f.jump(api.FRESH_MS);await f.service.refresh();assert.equal(f.service.getState().snapshot.fetchedAt,stamp);
  assert.equal(f.service.getState().stale,true);assert.notEqual(f.service.getState().lastCheckedAt,stamp);f.service.dispose();
});
test('advanced counters renew report, but regressed or conflicting counters retain previous valid data',async()=>{
  let tick=100,code=1308;const f=fixture({fetchImpl:url=>{const s=raw(tick);s.planetActiveEffects[0].galacticEffectId=code;return response(url===api.URL?{id:801}:s);}});
  await f.service.refresh();f.jump(60000);tick++;await f.service.refresh();const prior=f.service.getState().snapshot;
  f.jump(60000);tick--;assert.equal((await f.service.refresh()).reason,'regressed-tick');assert.strictEqual(f.service.getState().snapshot,prior);
  f.jump(60000);tick++;code=1400;assert.equal((await f.service.refresh()).reason,'conflicting-tick');assert.strictEqual(f.service.getState().snapshot,prior);f.service.dispose();
});
test('war change never reuses old-war effects, including when new status fails',async()=>{
  let war=801,bad=false;const f=fixture({fetchImpl:url=>url===api.URL?response({id:war}):bad?new Response('',{status:503}):response(raw(100,war))});
  await f.service.refresh();war=802;bad=true;f.jump(60000);await f.service.refresh();assert.equal(f.service.getState().snapshot,null);
  bad=false;f.jump(60000);await f.service.refresh();assert.equal(f.service.getState().snapshot.warId,802);f.service.dispose();
});
test('cache restart preserves data but never makes an offline observation live',async()=>{
  const f=fixture();await f.service.refresh();f.service.dispose();const g=fixture({storage:f.storage,online:false});
  assert.equal(g.service.getState().source,'cache');assert.equal(g.service.getState().snapshot.warTick,100);assert.equal(g.service.getState().stale,true);assert.equal(g.calls.length,0);g.service.dispose();
});
test('damaged, future-version and externally replaced caches remain recoverable',async()=>{
  for(const value of ['{bad',JSON.stringify({...normalized(),version:99}),JSON.stringify({...normalized(),fetchedAt:'2099-01-01T00:00:00Z'})]){
    const f=fixture({storage:disk(value)});await f.service.refresh();assert.equal(f.storage.getItem(api.CACHE_KEY),value);assert.match(f.service.getState().cacheWarning,/preserved/);f.service.dispose();
  }
  const f=fixture();f.storage.values.set(api.CACHE_KEY,'external');await f.service.refresh();assert.equal(f.storage.getItem(api.CACHE_KEY),'external');f.service.dispose();
});
test('cache validation rejects injected labels, extra scope, invalid metadata and duplicate IDs',()=>{
  for(const change of [s=>s.effects[0].label='<b>Hi</b>',s=>s.planetIds.push(1),s=>s.effects.push({...s.effects[0]}),s=>s.catalogCommit='changed',s=>s.sourceUpdatedAt='invented',s=>s.unreviewedIds=[999]]){
    const s=JSON.parse(JSON.stringify(normalized()));change(s);assert.equal(api.decode(JSON.stringify(s),START).status,'invalid');
  }
});
test('storage denial/quota cannot prevent in-memory activity or touch other save keys',async()=>{
  for(const storage of [null,{getItem(){throw Error('denied');}},{getItem(){return null;},setItem(){throw Error('quota');}}]){
    const f=fixture({storage});assert.equal((await f.service.refresh()).outcome,'updated');assert.ok(f.service.getState().cacheWarning);f.service.dispose();
  }
});
test('concurrent requests deduplicate and respect manual cooldown',async()=>{
  let release;const f=fixture({fetchImpl:url=>url===api.URL?new Promise(r=>release=r):response(raw())});
  const a=f.service.refresh(),b=f.service.refresh();assert.strictEqual(a,b);await flush();assert.equal(f.calls.length,1);
  release(response({id:801}));await a;assert.equal(f.calls.length,2);assert.equal((await f.service.refresh()).reason,'cooldown');f.service.dispose();
});
test('rate-limit Retry-After blocks both manual and background requests',async()=>{
  const f=fixture({fetchImpl:()=>new Response('',{status:429,headers:{'Retry-After':'600'}})});await f.service.start();
  await f.tick(599999);assert.equal(f.calls.length,1);assert.equal((await f.service.refresh()).reason,'cooldown');
  await f.tick(1);assert.equal(f.calls.length,2);f.service.dispose();
});
test('five-minute timer pauses hidden/offline and stop removes all timers',async()=>{
  const f=fixture();await f.service.start();assert.equal(f.timers.size,1);await f.tick(api.FRESH_MS);assert.equal(f.calls.length,4);
  await f.service.setActive(false);assert.equal(f.timers.size,0);await f.tick(api.FRESH_MS);assert.equal(f.calls.length,4);
  await f.service.setActive(true);assert.equal(f.calls.length,6);await f.service.setOnline(false);assert.equal(f.timers.size,0);
  f.service.dispose();assert.equal(f.timers.size,0);
});
test('cancel and timeout cannot accept late responses or schedule extra requests',async()=>{
  for(const action of ['stop','offline','hidden','timeout']){
    let release;const f=fixture({fetchImpl:()=>new Promise(r=>release=r)}),pending=f.service.start();await flush();
    if(action==='stop')f.service.stop();if(action==='offline')await f.service.setOnline(false);if(action==='hidden')await f.service.setActive(false);if(action==='timeout')await f.tick(api.TIMEOUT_MS);
    assert.ok(['cancelled','failed'].includes((await pending).outcome));release(response({id:801}));await flush();
    assert.equal(f.service.getState().snapshot,null);assert.equal(f.calls.length,1);assert.equal(f.storage.writes.length,0);f.service.dispose();
  }
});
test('missing effect list and oversized/non-JSON bodies never erase current data',async()=>{
  let bad=null;const f=fixture({fetchImpl:url=>url===api.URL?response({id:801}):bad||response(raw())});
  await f.service.refresh();const prior=f.service.getState().snapshot;
  for(const value of [response({warId:801,time:101,planetStatus:[{index:1}]}),new Response('not JSON'),new Response('x',{headers:{'Content-Length':String(api.MAX_BYTES+1)}})]){
    bad=value;f.jump(120000);assert.equal((await f.service.refresh()).outcome,'failed');assert.strictEqual(f.service.getState().snapshot,prior);
  }f.service.dispose();
});
test('map activity cannot affect eligibility, faction, positions or other war context',()=>{
  const atlas=galaxy.normalizeAtlas([{index:1,name:'Test',sector:'Test',position:{x:0,y:0},currentOwner:'Terminids'}],{now:START});
  const before=galaxy.build({atlas,now:START}),after=galaxy.build({atlas,activity:{snapshot:normalized(),source:'network',online:true},now:START});
  assert.equal(after.planets[0].activity.badges[0].key,'hive-lords');assert.equal(after.planets[0].activity.state,'recent-report');
  assert.deepEqual(after.selectableKeys,before.selectableKeys);assert.equal(after.planets[0].owner,before.planets[0].owner);assert.deepEqual(after.planets[0].position,before.planets[0].position);
  const broken=galaxy.build({atlas,activity:{snapshot:{bad:1}},now:START});assert.equal(broken.planets[0].activity.state,'unavailable');
});
