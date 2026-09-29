'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const api=require('../assets/planet-activity-service');
const model=require('../assets/planet-activity');
const START=Date.parse('2026-09-24T05:00:00Z');
const flush=async()=>{for(let i=0;i<150;i++)await Promise.resolve();};
function fixture(){
  let time=START,id=0,mode='good',war=801,lastGood=null,updates=0,maxTimers=0;
  const timers=new Map(),events=new Map(),calls=[],storage=new Map(),sentinel='{"saved":"keep"}';
  storage.set('player-save',sentinel);
  const setTimer=(fn,ms)=>{assert.ok(ms>=0);timers.set(++id,{fn,at:time+ms});maxTimers=Math.max(maxTimers,timers.size);return id;};
  const clearTimer=k=>timers.delete(k);
  const disk={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
  const service=api.createService({now:()=>time,setTimer,clearTimer,storage:disk,fetchImpl:async url=>{
    calls.push({at:time,url,mode});
    if(mode==='rate')return new Response('',{status:429,headers:{'Retry-After':'600'}});
    if(url===api.URL)return new Response(JSON.stringify({id:war}));
    if(mode==='bad')return new Response('{}');
    const data=mode==='stalled'&&lastGood?lastGood:{warId:war,time:Math.floor((time-START)/1000)+1,
      planetStatus:[{index:34}],planetActiveEffects:[{index:34,galacticEffectId:1308}]};
    lastGood=data;return new Response(JSON.stringify(data));
  }});
  function target(prefix){return {addEventListener(k,f){events.set(prefix+k,f);},removeEventListener(k){events.delete(prefix+k);}};}
  const doc={...target('doc:'),hidden:false,defaultView:{...target('win:'),navigator:{onLine:true}}};
  const a={online:true,observedAt:new Date(time).toISOString()};
  const atlas={getState:()=>a,subscribe:()=>()=>{},start(){},stop(){},setActive(){},setOnline:v=>{a.online=v;},refresh:async()=>{a.observedAt=new Date(time).toISOString();}};
  let viewOptions;
  const context=vm.createContext({HD2GalaxyView:{mount:(_host,opts)=>{viewOptions=opts;return {update(){updates++;},dispose(){}};}},Date,Promise,setTimeout,clearTimeout});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/galaxy-map-session.js'),'utf8'),context);
  const session=context.HD2GalaxySession.connect({ownerDocument:doc},{atlasService:atlas,activityService:service,now:()=>time,setTimer,clearTimer});
  async function advance(ms){
    const end=time+ms;let iterations=0;
    for(;;){
      const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
      if(!next)break;
      assert.ok(++iterations<20000,'bounded scheduler, no busy-loop');
      time=next[1].at;timers.delete(next[0]);next[1].fn();await flush();
    }
    time=end;await flush();
    assert.equal(storage.get('player-save'),sentinel);
  }
  return {service,session,calls,timers,events,storage,disk,advance,view:()=>viewOptions,now:()=>time,
    stats:()=>({updates,maxTimers}),mode:v=>{mode=v;},war:v=>{war=v;},
    online:async v=>{doc.defaultView.navigator.onLine=v;events.get('win:'+ (v?'online':'offline'))();await flush();},
    visible:async v=>{doc.hidden=!v;events.get('doc:visibilitychange')();await flush();}};
}

test('72 simulated hours of map polling, failures, stalls, offline and hidden cycles stay bounded',async()=>{
  const f=fixture();await f.session.start();f.session.setInspecting(true);await flush();
  for(let hour=0;hour<72;hour++){
    const mode=['good','stalled','bad','rate','offline','hidden'][hour%6];
    f.mode(mode);await f.online(mode!=='offline');await f.visible(mode!=='hidden');
    const begin=f.calls.length;
    await f.advance(3600000);
    const added=f.calls.slice(begin),state=f.service.getState();
    assert.ok(added.length<=124,mode+' has at most one discovery/status pair per minute plus transition');
    if(mode==='offline'||mode==='hidden')assert.equal(added.length,0,mode+' makes no background request');
    if(mode==='rate'){
      assert.ok(added.length<=6,'server Retry-After controls inspection and service timers');
      for(let i=1;i<added.length;i++)assert.ok(added[i].at-added[i-1].at>=600000);
    }
    if(['stalled','bad','rate','offline'].includes(mode))assert.equal(state.stale,true,mode+' is not live');
    assert.ok(f.timers.size<=2,'only activity background and inspection timer remain');
    assert.equal(f.view().getInputs().refreshFailed,false,'activity failure never becomes campaign failure');
  }
  assert.ok(f.calls.length>1000,'many real service transactions exercised');
  assert.ok(f.stats().maxTimers<=3,'no timeout/inspection/background timer accumulation');
  f.session.dispose();assert.equal(f.timers.size,0);assert.equal(f.events.size,0);
  const count=f.calls.length;await f.advance(86400000);assert.equal(f.calls.length,count,'disposed session stays quiet');
});

test('200 repeated open/close and connectivity transitions never multiply map timers',async()=>{
  const f=fixture();await f.session.start();
  for(let i=0;i<200;i++){
    f.session.setInspecting(true);f.session.setInspecting(true);await flush();assert.ok(f.timers.size<=2);
    f.session.setInspecting(false);await f.online(false);assert.equal(f.timers.size,0);
    await f.online(true);await f.advance(60000);
    assert.ok(f.timers.size<=1); // closed map has only service timer
  }
  f.session.dispose();assert.equal(f.timers.size,0);assert.equal(f.events.size,0);
});

test('multi-day unchanged report retains original date and recovers only after counter advances',async()=>{
  const f=fixture();await f.session.start();const original=f.service.getState().snapshot.fetchedAt;
  f.mode('stalled');await f.advance(3*86400000);
  assert.equal(f.service.getState().snapshot.fetchedAt,original);assert.equal(f.service.getState().stale,true);
  const observed=model.forPlanet(f.service.getState().snapshot,34,{now:f.now()});assert.equal(observed.state,'cached-report');
  f.mode('good');await f.advance(300000);
  assert.notEqual(f.service.getState().snapshot.fetchedAt,original);assert.equal(f.service.getState().stale,false);
  f.session.dispose();assert.equal(f.timers.size,0);
});

test('war rollover after repeated failures cannot expose old effects as a new-war report',async()=>{
  const f=fixture();await f.session.start();f.mode('bad');await f.advance(3600000);f.war(802);
  await f.advance(1800000);assert.equal(f.service.getState().snapshot,null);
  f.mode('good');await f.advance(1800000);assert.equal(f.service.getState().snapshot.warId,802);
  const restart=api.createService({storage:f.disk,online:false,now:f.now});
  assert.equal(restart.getState().snapshot.warId,802);assert.equal(restart.getState().stale,true);
  restart.dispose();f.session.dispose();assert.equal(f.timers.size,0);
});

test('reconnect respects recent reports; stale reconnect actually probes and rejects malformed data',async()=>{
  const f=fixture();await f.session.start();await f.online(false);f.mode('bad');
  await f.advance(60000);const prior=f.calls.length;await f.online(true);
  assert.equal(f.calls.length,prior,'recent reconnect does not perform an unnecessary transaction');
  assert.equal(f.service.getState().lastError,null);
  await f.online(false);await f.advance(300000);await f.online(true);
  assert.equal(f.calls.length,prior+2);assert.equal(f.service.getState().lastError,'invalid-snapshot');
  assert.equal(f.service.getState().stale,true);f.session.dispose();assert.equal(f.timers.size,0);
});
