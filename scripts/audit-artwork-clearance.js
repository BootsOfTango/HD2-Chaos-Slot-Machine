'use strict';
// Mechanical, conservative review index of shipped media. Never grants rights.
const fs = require('node:fs');
const path = require('node:path');
const asar = require('@electron/asar');
const { buildInventory, resolveCandidate } = require('./audit-distribution');
const { writeJson } = require('../electron/durable-file');
const CROSSOVERS = Object.freeze({
  'warbond:castellans-creed': 'Warhammer 40,000',
  'warbond:righteous-revenants': 'Killzone',
  'warbond:obedient-democracy-support-troopers': 'Halo'
});
const ORIGINS = Object.freeze([
  ['assets/catalog-additions/ironclad/', 'assets/catalog-additions/ironclad/ATTRIBUTION.md'],
  ['assets/missions/', 'assets/missions/ORIGIN.md'],
  ['assets/planets/', 'assets/planets/ORIGIN.md']
]);
const BRAND = new Set(['build/icon.ico','build/icon.png','assets/branding/hd2-chaos-slot-machine.svg']);
function relativeFile(file) {
  if (typeof file!=='string' || !file || /[:\\]/.test(file) || file.startsWith('/') || file.split('/').some(p=>!p || p==='.' || p==='..')) throw Error('Unsafe relative asset path');
  return file;
}
function publicUrl(value) {
  if (typeof value!=='string') return null;
  try { const u=new URL(value); if(u.protocol!=='https:' || u.username || u.password) return null;
    u.search='';u.hash='';return u.href; } catch { return null; }
}
function sourceUrls(records) {
  const urls=new Set();
  const visit=value=>{
    if (typeof value==='string') { const url=publicUrl(value);if(url)urls.add(url); }
    else if(Array.isArray(value))value.forEach(visit);
    else if(value&&typeof value==='object')Object.values(value).forEach(visit);
  };
  records.forEach(visit);return [...urls].sort();
}
function buildLedger(inventory, catalog) {
  const packaged=new Map(inventory.appFiles.map(f=>[relativeFile(f.file),f]));
  if (packaged.size!==inventory.appFiles.length)throw Error('Duplicate packaged file');
  const referenced=new Map(), add=(file,ref)=>{
    relativeFile(file);if(!referenced.has(file))referenced.set(file,[]);referenced.get(file).push(ref);
  };
  const ids=new Set();
  for(const item of catalog.items){
    if(ids.has(item.id))throw Error('Duplicate catalog identity');ids.add(item.id);
    add(item.assetPath,{id:item.id,name:item.name,kind:'equipment',acquisitionId:item.acquisition?.id||null});
  }
  for(const bond of catalog.warbonds){
    if(ids.has(bond.id))throw Error('Duplicate catalog identity');ids.add(bond.id);
    add(bond.coverAssetPath,{id:bond.id,name:bond.name,kind:'warbond-cover',acquisitionId:bond.id});
  }
  const seen=new Set();
  const assets=inventory.artwork.map(row=>{
    relativeFile(row.file);
    if(seen.has(row.file))throw Error('Duplicate media file');seen.add(row.file);
    if(!/^[a-f0-9]{64}$/.test(row.sha256) || packaged.get(row.file)?.sha256!==row.sha256)throw Error('Media does not match packaged bytes');
    const refs=referenced.get(row.file)||[];
    let origin=ORIGINS.find(([prefix])=>row.file.startsWith(prefix))?.[1]||null;
    // New sourced rasters are not independently created merely because old SVGs share their folder.
    if(row.file.startsWith('assets/catalog-additions/ironclad/')&&!row.file.endsWith('.svg'))origin=null;
    if(BRAND.has(row.file))origin='assets/branding/ORIGIN.md';
    if(origin&&!packaged.has(origin))origin=null;
    const records=row.sourceRecords||[];
    const claims=[...new Set(records.flatMap(r=>[r.recordedSha256,r.metadata?.artworkSha256]).filter(Boolean))];
    const hashStatus=claims.length ? (claims.every(h=>h===row.sha256)?'recorded-match':'recorded-mismatch') : 'not-recorded';
    const crossovers=[...new Set(refs.map(r=>CROSSOVERS[r.acquisitionId]).filter(Boolean))];
    const contributorEvidence=records.flatMap(r=>[r.contributor,r.metadata?.artworkSource]).filter(v=>typeof v==='string'&&v.trim());
    const urls=sourceUrls(records);
    const route=origin?'project-origin-review':crossovers.length?'publisher-crossover-contributor-review':
      /publisher-promotional/.test(row.group)?'publisher-permission-review':
      contributorEvidence.length?'publisher-and-contributor-review':'identify-source-and-rights-review';
    return {file:row.file,bytes:row.bytes,sha256:row.sha256,group:row.group,catalogReferences:refs,
      crossovers,reviewRoute:route,originNote:origin,recordedHashStatus:hashStatus,
      sourceUrls:urls,sourceRecords:[...new Set(records.map(r=>relativeFile(r.record)))].sort(),
      contributorEvidence:[...new Set(contributorEvidence)].sort(),
      permissionStatus:'not-established',permissionEvidence:null,
      nextAction:origin?'Review documented independent creation and branding; no automatic exclusive-rights claim.':
        'Identify applicable rights holders and document an approved use basis, or agree a cleared replacement. Attribution alone is insufficient.'};
  }).sort((a,b)=>a.file.localeCompare(b.file,'en'));
  for(const file of referenced.keys())if(!seen.has(file))throw Error('Catalog media absent from packaged inventory: '+file);
  const tally=key=>assets.reduce((acc,a)=>(acc[a[key]]=(acc[a[key]]||0)+1,acc),{});
  const hashes=new Map();for(const a of assets){if(!hashes.has(a.sha256))hashes.set(a.sha256,[]);hashes.get(a.sha256).push(a.file);}
  const duplicates=[...hashes.entries()].filter(([,files])=>files.length>1).map(([sha256,files])=>({sha256,files}));
  const artifact=inventory.runtimeFiles.find(f=>f.file==='resources/app.asar');
  if(!artifact)throw Error('Missing packaged ASAR identity');
  return {schemaVersion:1,reviewedAt:inventory.reviewedAt,candidate:relativeFile(inventory.candidate),
    asarSha256:artifact.sha256,scope:'One row per shipped application media file, including retained alternatives. Not a permission grant or complete legal/software audit.',
    counts:{mediaFiles:assets.length,uniqueContentHashes:hashes.size,catalogReferencedMedia:assets.filter(a=>a.catalogReferences.length).length,
      notDirectlyCatalogReferenced:assets.filter(a=>!a.catalogReferences.length).length,sourceUrlPresent:assets.filter(a=>a.sourceUrls.length).length,
      documentedOriginalMedia:assets.filter(a=>a.originNote).length,crossoverReferencedMedia:assets.filter(a=>a.crossovers.length).length,
      catalogStratagemsWithoutRecordedHash:assets.filter(a=>a.recordedHashStatus==='not-recorded'&&a.catalogReferences.some(r=>r.id.startsWith('stratagem:'))).length,
      permissionEstablished:0,byHashStatus:tally('recordedHashStatus'),byReviewRoute:tally('reviewRoute')},
    duplicateContent:duplicates,assets,
    limitations:['Not directly catalog-referenced does not mean unused; UI, fallbacks, historical assets and branding need separate reachability review.',
      'Origin notes, matching hashes, HTTPS sources, community credits and catalog associations never auto-clear an asset.',
      'Crossover labels are scoped catalog associations, not exhaustive ownership determinations.',
      'Runtime-rendered/inline SVG and CSS, words, fonts provided by Windows, installer wizard artwork and third-party software require separate review.',
      'No private correspondence, local absolute paths, save files, screenshots or executables are part of this shareable index. No message has been sent.']};
}
function main(args) {
  const modes=args.filter(a=>a==='--write'||a==='--check');
  const candidate=args.find(a=>a.startsWith('--candidate='))?.slice(12);
  const reviewedAt=args.find(a=>a.startsWith('--reviewed-at='))?.slice(14);
  if(modes.length!==1||!candidate||!reviewedAt||args.length!==3)throw Error('Use --write or --check with --candidate=dist/<label> and --reviewed-at=YYYY-MM-DD');
  const root=path.resolve(__dirname,'..');
  const inventory=buildInventory({root,candidate,reviewedAt,installerProfile:'project-shell'});
  const archive=path.join(resolveCandidate(root,candidate),'win-unpacked/resources/app.asar');
  const catalog=JSON.parse(asar.extractFile(archive,'assets/item-catalog.json'));
  const ledger=buildLedger(inventory,catalog),target=path.join(root,'docs/artwork-clearance-inventory.json');
  if(modes[0]==='--write')writeJson(target,ledger);
  else if(fs.readFileSync(target,'utf8')!==JSON.stringify(ledger,null,2)+'\n')throw Error('Artwork index is stale; do not reuse it for another build');
  console.log(JSON.stringify({asarSha256:ledger.asarSha256,counts:ledger.counts},null,2));
}
if(require.main===module){try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={relativeFile,publicUrl,sourceUrls,buildLedger};
