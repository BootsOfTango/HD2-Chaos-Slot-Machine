'use strict';
const fs=require('node:fs'),path=require('node:path');
const api=require('../assets/planet-activity-service'),model=require('../assets/planet-activity');
const {writeJson}=require('../electron/durable-file');
async function main(){
  if(process.argv.length!==3||process.argv[2]!=='--live')throw Error('Use --live for the bounded activity-service probe.');
  const directory=path.resolve(__dirname,'../.test-data','activity-service-'+Date.now());fs.mkdirSync(directory,{recursive:true});
  const service=api.createService();let result;
  try{
    result=await service.refresh('manual');const state=service.getState();
    if(result.outcome!=='updated'||!state.snapshot)throw Error('Live service failed: '+JSON.stringify(result));
    const snapshot=state.snapshot,badges=snapshot.planetIds.flatMap(planetId=>{const v=model.forPlanet(snapshot,planetId);return v.badges.length?[{planetId,badges:v.badges}]:[];});
    await service.setOnline(false);
    if(!service.getState().stale)throw Error('Offline state remained fresh');
    writeJson(path.join(directory,'report.json'),{passed:true,checkedAt:new Date().toISOString(),result,snapshot,badges,offlineStale:service.getState().stale,
      note:'Actual public raw-status service; no game-client validation, no personal storage, no periodic start.'});
    console.log(JSON.stringify({passed:true,report:path.join(directory,'report.json'),warId:snapshot.warId,planets:snapshot.planetIds.length,effects:snapshot.effects.length,badges},null,2));
  }catch(error){writeJson(path.join(directory,'failure.json'),{passed:false,result,error:error.message});throw error;}
  finally{service.dispose();}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
