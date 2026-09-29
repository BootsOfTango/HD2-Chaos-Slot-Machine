'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function fixture(withActivity=false){
  let time=Date.parse('2026-09-23T12:00:00Z'),id=0,updates=0,active=true;
  const timers=new Map(),events={},doc={hidden:false,addEventListener:(k,f)=>events[k]=f,removeEventListener:k=>delete events[k]};
  doc.defaultView={navigator:{onLine:true},addEventListener:(k,f)=>events[k]=f,removeEventListener:k=>delete events[k]};
  const calls=[];
  function service(name){const state={online:true,running:false,observedAt:new Date(time).toISOString(),snapshot:{fetchedAt:new Date(time).toISOString()}};
    return {state,getState:()=>state,subscribe:()=>()=>{},setActive(){},setOnline:v=>{state.online=v;},start(){state.running=true;},stop(){state.running=false;},
      refresh:async reason=>{calls.push({name,reason});state.observedAt=new Date(time).toISOString();state.snapshot.fetchedAt=state.observedAt;}};
  }
  const atlas=service('atlas'),war=service('war'),activity=withActivity?service('activity'):null;let viewOptions;
  const context=vm.createContext({HD2GalaxyView:{mount:(_h,opts)=>{viewOptions=opts;return {update(){updates++;},dispose(){}};}},setTimeout,clearTimeout,Date,Promise});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/galaxy-map-session.js'),'utf8'),context);
  const connected=context.HD2GalaxySession.connect({ownerDocument:doc},{atlasService:atlas,warService:war,activityService:activity,now:()=>time,isActive:()=>active,
    setTimer:(fn,ms)=>{timers.set(++id,{fn,at:time+ms});return id;},clearTimer:key=>timers.delete(key)});
  return {connected,timers,calls,atlas,war,activity,events,view:()=>viewOptions,online:v=>{doc.defaultView.navigator.onLine=v;events[v?'online':'offline']();},active:v=>{active=v;events.visibilitychange();},
    advance:async ms=>{time+=ms;for(const [key,t] of [...timers])if(t.at<=time){timers.delete(key);t.fn();}await new Promise(resolve=>setImmediate(resolve));}};
}
test('open-map poll refreshes both sources at one minute, not for each hover or repeated open',async()=>{
  const f=fixture();await f.connected.start();assert.equal(f.timers.size,0);
  f.connected.setInspecting(true);f.connected.setInspecting(true);assert.equal(f.timers.size,1);
  await f.advance(59999);assert.equal(f.calls.length,0);
  await f.advance(1);assert.deepEqual(f.calls.map(c=>c.name),['atlas','war']);assert.equal(f.timers.size,1);
  assert.equal(f.view().getSyncState().inspectionPolling,true);
  f.connected.setInspecting(false);assert.equal(f.timers.size,0);await f.advance(120000);assert.equal(f.calls.length,2);
  f.connected.dispose();
});
test('hidden/offline/stop/dispose cancel inspection timers and resume rechecks stale data',async()=>{
  const f=fixture();await f.connected.start();f.connected.setInspecting(true);
  f.active(false);assert.equal(f.timers.size,0);await f.advance(60000);assert.equal(f.calls.length,0);
  f.active(true);await f.advance(0);assert.equal(f.calls.length,2);assert.equal(f.timers.size,1);
  f.online(false);assert.equal(f.timers.size,0);
  f.connected.stop();assert.equal(f.timers.size,0);
  f.connected.dispose();assert.equal(Object.keys(f.events).length,0);
});
test('inspection snapshots expose atlas failures independently of campaign freshness',async()=>{
  const f=fixture();f.atlas.state.lastError='http-429';
  assert.equal(f.view().getInputs().atlasRefreshFailed,true);assert.equal(f.view().getInputs().refreshFailed,false);
  f.connected.dispose();
});
test('activity shares map lifecycle and manual refresh but never makes war snapshot failed',async()=>{
  const f=fixture(true);await f.connected.start();assert.equal(f.activity.state.running,true);
  f.activity.state.lastError='http-429';assert.equal(f.view().getInputs().refreshFailed,false);
  f.connected.setInspecting(true);await f.advance(60000);
  assert.ok(f.calls.some(c=>c.name==='activity'));assert.equal(f.timers.size,1);
  f.online(false);assert.equal(f.activity.state.online,false);f.connected.stop();assert.equal(f.activity.state.running,false);
  f.connected.dispose();assert.equal(f.timers.size,0);
});
