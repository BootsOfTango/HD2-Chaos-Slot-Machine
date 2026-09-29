'use strict';
// Explicit read-only developer audit. No app integration, credentials or automatic polling.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {writeJson,writeDurable}=require('../electron/durable-file');
const audit=require('./planet-activity-audit');
const root=path.resolve(__dirname,'..');
async function get(url){
  const startedAt=new Date().toISOString();
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json','Accept-Language':'en-US',
    'X-Super-Client':'HD2-Chaos-Slot-Machine-activity-audit','X-Super-Contact':'https://github.com/BootsOfTango/HD2-Chaos-Slot-Machine'}});
  if(!response.ok)throw Error(`HTTP ${response.status} from ${url}; Retry-After ${response.headers.get('retry-after')||'unspecified'}. No automatic retry.`);
  let size=0;const chunks=[];
  for await(const chunk of response.body){size+=chunk.byteLength;if(size>8*1024*1024)throw Error('Audit response exceeds 8MB');chunks.push(chunk);}
  const bytes=Buffer.concat(chunks),fetchedAt=new Date().toISOString();
  return {value:JSON.parse(bytes.toString('utf8')),bytes,provenance:{url,startedAt,fetchedAt,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
    httpDate:response.headers.get('date'),age:response.headers.get('age'),etag:response.headers.get('etag'),lastModified:response.headers.get('last-modified'),
    rateLimit:response.headers.get('x-ratelimit-limit'),remaining:response.headers.get('x-ratelimit-remaining')}};
}
async function main(){
  if(process.argv.length!==3||process.argv[2]!=='--live')throw Error('Use --live to audit four bounded public JSON responses. No automatic updates.');
  const directory=path.join(root,'.test-data',`planet-activity-audit-${Date.now()}`);fs.mkdirSync(directory,{recursive:true});
  const records=[];
  async function sample(name,url){const r=await get(url);records.push({name,...r.provenance});writeDurable(path.join(directory,name+'.json'),r.bytes);return r;}
  try{
    const current=await sample('war-id','https://api.helldivers2.dev/raw/api/WarSeason/current/WarID');
    if(!Number.isSafeInteger(current.value.id)||current.value.id<0)throw Error('Unusable current war ID');
    const status=await sample('status',`https://api.helldivers2.dev/raw/api/WarSeason/${current.value.id}/Status`);
    const planets=await sample('planets','https://api.helldivers2.dev/api/v1/planets');
    const catalog=await sample('catalog',audit.CATALOG_URL);
    const normalized=audit.normalize(status.value,{expectedWarId:current.value.id,fetchedAt:status.provenance.fetchedAt});
    const byId=new Map();
    if(!Array.isArray(planets.value)||planets.value.length>1024)throw Error('Invalid atlas response');
    for(const p of planets.value){if(!Number.isSafeInteger(p.index)||p.index<0||byId.has(p.index))throw Error('Invalid/duplicate atlas identity');byId.set(p.index,p);}
    const missingAtlasIds=normalized.planetIds.filter(id=>!byId.has(id));
    const invalidCatalogEntries=Object.entries(catalog.value).filter(([key,v])=>String(v?.galacticEffectId)!==key||typeof v?.name!=='string');
    if(missingAtlasIds.length||invalidCatalogEntries.length)throw Error('Reference-join or catalog identity failure');
    const missingReviewedIds=audit.definitions.flatMap(d=>d.ids).filter(id=>!catalog.value[id]);
    if(missingReviewedIds.length)throw Error('Pinned reviewed ID missing');
    const activity=normalized.planetIds.map(id=>({planetId:id,name:byId.get(id).name,...audit.forPlanet(normalized,id)})).filter(p=>p.badges.length);
    const unrecognizedSourceIds=[...new Set(normalized.effects.map(e=>e.effectId))].filter(id=>!catalog.value[id]);
    const report={passed:true,checkedAt:new Date().toISOString(),productionEnabled:false,records,
      warId:normalized.warId,warTick:normalized.warTick,sourceUpdatedAt:null,planetCount:normalized.planetIds.length,atlasCount:byId.size,
      rawEffectRows:status.value.planetActiveEffects.length,uniqueEffectPairs:normalized.effects.length,duplicatePairs:normalized.duplicates,
      distinctEffectIds:new Set(normalized.effects.map(e=>e.effectId)).size,catalogEntries:Object.keys(catalog.value).length,
      missingAtlasIds,unrecognizedSourceIds,reviewedGroups:audit.definitions.length,reviewedIds:audit.definitions.flatMap(d=>d.ids).length,
      activity,unreviewedIds:normalized.unreviewedIds,
      note:'Provider report, not verified in-game encounters. Unreviewed is not absent. Internal war tick is not a UTC timestamp. No production integration.'};
    writeJson(path.join(directory,'normalized.json'),normalized);writeJson(path.join(directory,'report.json'),report);
    console.log(JSON.stringify({report:path.join(directory,'report.json'),...report},null,2));
  }catch(error){writeJson(path.join(directory,'failure.json'),{passed:false,records,error:error.message});throw error;}
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={get};
