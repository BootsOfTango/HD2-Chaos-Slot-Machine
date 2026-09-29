'use strict';
// Explicit read-only network probe, with a memory-only test cache. Never app/user storage.
const assert=require('node:assert/strict');
const api=require('../assets/galaxy-atlas-service');
if(process.argv.length!==3||process.argv[2]!=='--live')throw Error('Use --live for one bounded all-planets request.');
(async()=>{
  const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
  const service=api.createService({storage});
  try{
    const result=await service.refresh('startup'),state=service.getState();
    if(result.outcome!=='updated'){
      console.log(JSON.stringify({checkedAt:new Date().toISOString(),passed:false,result,source:state.source,
        cacheWritten:values.size>0,retained:state.atlas!==null},null,2));process.exitCode=1;return;
    }
    const reopened=api.createService({storage,online:false});
    try{
      assert.deepEqual(reopened.getState().atlas,state.atlas);
      assert.equal(reopened.getState().source,'cache');
      assert.equal((await reopened.refresh('startup')).reason,'offline');
      console.log(JSON.stringify({checkedAt:new Date().toISOString(),passed:true,planets:state.atlas.planets.length,
        observedAt:state.observedAt,offlineRestart:true,cacheKey:api.CACHE_KEY,
        note:'In-memory storage and independent service instances, not a real Electron restart or personal save.'},null,2));
    }finally{reopened.dispose();}
  }finally{service.dispose();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
