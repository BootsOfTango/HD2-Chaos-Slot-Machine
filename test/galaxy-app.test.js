'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
async function fixture({bundleFails=false}={}){
  let allowed=true,chosen=null,listCalls=0,starts=0,updates=0,inspected=null,cancelled=0,selectionStarts=0,options;
  const doc={activeElement:null},nodes={};
  for(const id of ['galaxyDialog','galaxyMapHost','closeGalaxyMap','galaxyUseList','opener']){
    nodes[id]={isConnected:true,open:false,events:{},addEventListener(type,fn){this.events[type]=fn;},
      focus(){doc.activeElement=this;},showModal(){this.open=true;},close(){this.open=false;}};
  }
  doc.getElementById=id=>nodes[id];doc.activeElement=nodes.opener;
  const context=vm.createContext({document:doc,navigator:{onLine:false},localStorage:{getItem(){return null;},setItem(){}},
    console:{warn(){}},fetch:async()=>{if(bundleFails)throw Error('missing');return {ok:true,json:async()=>({fixture:true})};},
    HD2GalaxyMap:{validateAtlas:value=>value},HD2GalaxyAtlas:{createService:()=>({})},HD2ActivityService:{createService:()=>({})},
    HD2GalaxySession:{connect(host,value){options=value;return {start(){starts++;return new Promise(()=>{});},
      update(){updates++;},beginSelection(key){selectionStarts++;updates++;if(key)inspected=[key,false,true,true];},inspect(...args){inspected=args;},cancelGestures(){cancelled++;},refresh(){}};}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/galaxy-app.js'),'utf8'),context);
  const app=await context.HD2GalaxyApp.create({warService:{},getPreferences:()=>[],canChoose:()=>allowed,
    onChoose:value=>{chosen=value;},onList:()=>{listCalls++;}});
  return {app,nodes,doc,options,allow:value=>{allowed=value;},read:()=>({chosen,listCalls,starts,updates,inspected,cancelled,selectionStarts})};
}
test('map adapter opens without awaiting network, blocks locked selection and restores focus',async()=>{
  const f=await fixture();assert.equal(f.read().starts,1);
  f.allow(false);f.app.open('id:1');assert.equal(f.app.isOpen(),false);
  f.allow(true);f.app.open('id:1');assert.equal(f.app.isOpen(),true);
  assert.deepEqual(f.read().inspected,['id:1',false,true,true]);assert.equal(f.doc.activeElement,f.nodes.closeGalaxyMap);
  f.allow(false);f.options.onChoose({id:1});assert.equal(f.read().chosen,null);
  f.allow(true);f.options.onChoose({id:2});assert.equal(f.read().chosen.id,2);
  assert.equal(f.app.isOpen(),false);assert.equal(f.doc.activeElement,f.nodes.opener);
  assert.equal(f.read().cancelled,1);
});
test('missing atlas bundle retains dialog, native cancel and list fallback',async()=>{
  const f=await fixture({bundleFails:true});f.app.open();let prevented=false;
  f.nodes.galaxyDialog.events.cancel({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(f.app.isOpen(),false);
  f.app.open();f.nodes.galaxyUseList.events.click();
  assert.equal(f.read().listCalls,1);assert.equal(f.app.isOpen(),false);
});
test('adapter refreshes an open view without reopening a closed dialog',async()=>{
  const f=await fixture();f.app.update();assert.equal(f.read().updates,0);
  f.app.open();f.app.update();assert.equal(f.read().updates,2);
  f.nodes.closeGalaxyMap.events.click();f.app.update();assert.equal(f.read().updates,2);
});

test('eligible default is reapplied only on actual chooser openings, not background updates',async()=>{
  const f=await fixture();f.app.open('id:1');f.app.update();f.app.open('id:2');
  assert.equal(f.read().selectionStarts,1);
  f.app.close();f.app.open('id:2');assert.equal(f.read().selectionStarts,2);
  f.app.close();f.allow(false);f.app.open();assert.equal(f.read().selectionStarts,2);
});
