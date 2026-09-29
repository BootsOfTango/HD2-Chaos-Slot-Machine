(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.HD2PlanetActivity=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Pure community-reported activity decoder. No requests, storage or eligibility changes.
// ID meanings reviewed against helldivers-2/json at the pinned commit below.
const CATALOG_COMMIT='c7425990a1ef5891005b0ecb387fbea5def471b7';
const CATALOG_URL=`https://raw.githubusercontent.com/helldivers-2/json/${CATALOG_COMMIT}/effects/planetEffects.json`;
const groups=[
  ['jet-brigade','Jet Brigade',[1202,1203]],
  ['hive-lords','Hive Lords',[1307,1308]],
  ['spore-burst','Spore Burst strain',[1244,1386]],
  ['predator','Predator strain',[1243,1245]],
  ['rupture','Rupture strain',[1303,1310]],
  ['incineration','Incineration Corps',[1248,1249]],
  ['dragonroaches','Dragonroaches',[1306,1309]],
  ['strider-surge','Factory Strider surge',[1283]],
  ['impaler-rampage','Impaler rampage',[1285]],
  ['spore-rampage','Spore Burst Scavenger rampage',[1288]],
  ['charger-rampage','Charger rampage',[1293]],
  ['heavy-surge','Heavy armor surge',[1355]],
  ['hulk-surge','Hulk surge',[1357]],
  ['devastator-surge','Devastator surge',[1359]],
  ['seaf','Heavy SEAF presence',[1400,1401]]
];
const definitions=Object.freeze(groups.map(([key,label,ids])=>Object.freeze({key,label,ids:Object.freeze(ids)})));
const byCode=new Map(definitions.flatMap(d=>d.ids.map(id=>[id,d])));
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const id=v=>Number.isSafeInteger(v)&&v>=0;
function normalize(raw,{expectedWarId,fetchedAt=new Date().toISOString()}={}){
  if(!id(expectedWarId)||!object(raw)||raw.warId!==expectedWarId||!id(raw.time))throw Error('Invalid or mismatched war identity/tick');
  const fetched=typeof fetchedAt==='string'?Date.parse(fetchedAt):NaN;
  if(!Number.isFinite(fetched))throw Error('Invalid retrieval time');
  if(!Array.isArray(raw.planetStatus)||!raw.planetStatus.length||raw.planetStatus.length>1024)throw Error('Missing/bounded planet identity list required');
  const planets=new Set();
  for(const p of raw.planetStatus){if(!object(p)||!id(p.index)||planets.has(p.index))throw Error('Invalid/duplicate planet identity');planets.add(p.index);}
  if(!Array.isArray(raw.planetActiveEffects)||raw.planetActiveEffects.length>20000)throw Error('Missing/bounded active effects list required');
  const pairs=new Set(),effects=[],unreviewed=new Set();let duplicates=0;
  for(const row of raw.planetActiveEffects){
    if(!object(row)||!id(row.index)||!id(row.galacticEffectId)||Object.keys(row).some(k=>!['index','galacticEffectId'].includes(k)))throw Error('Invalid or differently scoped effect row');
    if(!planets.has(row.index))throw Error('Effect refers to an unknown planet');
    const key=row.index+':'+row.galacticEffectId;if(pairs.has(key)){duplicates++;continue;}pairs.add(key);
    effects.push(Object.freeze({planetId:row.index,effectId:row.galacticEffectId}));
    if(!byCode.has(row.galacticEffectId))unreviewed.add(row.galacticEffectId);
  }
  return Object.freeze({version:1,warId:expectedWarId,warTick:raw.time,fetchedAt:new Date(fetched).toISOString(),
    planetIds:Object.freeze([...planets].sort((a,b)=>a-b)),effects:Object.freeze(effects.sort((a,b)=>a.planetId-b.planetId||a.effectId-b.effectId)),
    duplicates,unreviewedIds:Object.freeze([...unreviewed].sort((a,b)=>a-b)),
    // Internal wartime drifts; it is NOT Unix time or startDate + elapsed UTC seconds.
    sourceUpdatedAt:null,source:'community-raw-status',catalogCommit:CATALOG_COMMIT});
}
function forPlanet(snapshot,planetId,{now=Date.now(),online=true,failed=false,maxAgeMs=300000}={}){
  if(!id(planetId)||!snapshot?.planetIds.includes(planetId))return {state:'unavailable',badges:[],unreviewedIds:[],absenceConfirmed:false};
  if(!Number.isFinite(now)||!Number.isFinite(maxAgeMs)||maxAgeMs<=0)throw Error('Invalid freshness clock');
  const age=now-Date.parse(snapshot.fetchedAt),recent=online&&!failed&&age>=0&&age<maxAgeMs;
  const mapped=new Map(),unreviewed=[];
  for(const effect of snapshot.effects.filter(e=>e.planetId===planetId)){
    const d=byCode.get(effect.effectId);
    if(!d){unreviewed.push(effect.effectId);continue;}
    if(!mapped.has(d.key))mapped.set(d.key,{key:d.key,label:d.label,effectIds:[]});
    mapped.get(d.key).effectIds.push(effect.effectId);
  }
  return {state:recent?'recent-report':'cached-report',badges:[...mapped.values()],unreviewedIds:unreviewed,
    fetchedAt:snapshot.fetchedAt,absenceConfirmed:false,gameStateConfirmed:false};
}
function compareTicks(previous,next){
  if(!previous||previous.warId!==next.warId)return 'new-war-or-first-observation';
  return next.warTick>previous.warTick?'advanced':next.warTick===previous.warTick?'unchanged':'regressed';
}
function validateSnapshot(raw,{now=Date.now()}={}){
  if(!object(raw)||raw.version!==1||raw.source!=='community-raw-status'||raw.catalogCommit!==CATALOG_COMMIT||
    raw.sourceUpdatedAt!==null||!Array.isArray(raw.planetIds)||!Array.isArray(raw.effects)||
    raw.planetIds.length>1024||raw.effects.length>20000||
    Object.keys(raw).some(k=>!['version','warId','warTick','fetchedAt','planetIds','effects','duplicates','unreviewedIds','sourceUpdatedAt','source','catalogCommit'].includes(k))||
    !id(raw.duplicates)||raw.duplicates>20000||!Array.isArray(raw.unreviewedIds)||
    !Number.isFinite(now)||Date.parse(raw.fetchedAt)>now+60000)throw Error('Invalid activity cache');
  for(const e of raw.effects)if(!object(e)||Object.keys(e).some(k=>!['planetId','effectId'].includes(k)))throw Error('Invalid cached effect');
  const value=normalize({warId:raw.warId,time:raw.warTick,planetStatus:raw.planetIds.map(index=>({index})),
    planetActiveEffects:raw.effects.map(e=>({index:e.planetId,galacticEffectId:e.effectId}))},{expectedWarId:raw.warId,fetchedAt:raw.fetchedAt});
  if(value.duplicates||JSON.stringify(value.unreviewedIds)!==JSON.stringify(raw.unreviewedIds))throw Error('Invalid cached effects');
  return value;
}
return Object.freeze({CATALOG_COMMIT,CATALOG_URL,definitions,normalize,forPlanet,compareTicks,validateSnapshot});
});
