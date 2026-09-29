'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const catalog=require('../assets/item-catalog.json'),review=require('../assets/catalog-additions/ironclad/review.json');
const baseline=require('./fixtures/ironclad-baseline.json'),art=require('../assets/catalog-additions/ironclad/provenance.json');
const images=require('../assets/item-images.json'),ownership=require('../assets/catalog-state');
const {projectBeforeIronclad}=require('../scripts/catalog-history-fixture');
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const types={primary:'primaries',sidearm:'sidearms',throwable:'throwables',stratagem:'stratagems',booster:'boosters'};
const defaults=c=>Object.fromEntries(Object.entries(types).map(([t,k])=>[k,c.items.filter(i=>i.type===t).map(i=>({...structuredClone(i),owned:i.defaultEnabled!==false,enabled:i.defaultEnabled!==false}))]));

test('Ironclad adds exactly seven Warbond items and one separately purchased energy primary',()=>{
  assert.equal(catalog.items.length,214);assert.equal(catalog.warbonds.length,25);assert.equal(review.items.length,8);
  const guide=fs.readFileSync(path.join(__dirname,'../README-FIRST.txt'),'utf8');
  assert.ok(guide.includes(`${catalog.items.length} items and ${catalog.warbonds.length} Warbond groups`));
  for(const expected of review.items)assert.deepEqual(catalog.items.find(i=>i.id===expected.id),expected);
  const bond=catalog.warbonds.find(b=>b.id===review.warbond.id);assert.deepEqual(bond,review.warbond);
  assert.deepEqual(review.items.slice(0,7).map(i=>i.type),['primary','primary','sidearm','throwable','throwable','booster','booster']);
  const sai=review.items[7];assert.equal(sai.id,'primary:las-12-sai');assert.equal(sai.subgroup,'energy');assert.equal(sai.acquisition.kind,'superstore');
  assert.equal(bond.equipmentIds.includes(sai.id),false);assert.equal(catalog.items.filter(i=>i.name==='Surplus EAT Allocation').length,1);
  assert.equal(catalog.items.find(i=>i.name==='Surplus EAT Allocation').type,'booster');
});

test('accepted package independently protects all206 prior items and24 groups unchanged',()=>{
  const prior=projectBeforeIronclad(catalog);assert.equal(prior.items.length,baseline.items);assert.equal(prior.warbonds.length,baseline.warbonds);
  assert.equal(hash(prior),baseline.catalogHash);assert.equal(hash(prior.items),baseline.itemsHash);assert.equal(hash(prior.warbonds),baseline.warbondsHash);
  const mutated=structuredClone(catalog);mutated.items.find(i=>i.introducedIn!=='ironclad-democracy').defaultEnabled=false;
  // Mutate an unconditional fact as well: no projection may repair old fields.
  mutated.items.find(i=>i.introducedIn!=='ironclad-democracy').aliases.push('unexpected');
  assert.notEqual(hash(projectBeforeIronclad(mutated)),baseline.catalogHash);
});

test('fresh and old-save upgrades exclude eight new items while preserving all old choices',()=>{
  const prior=defaults(projectBeforeIronclad(catalog));Object.values(prior).flat().forEach((i,n)=>{i.owned=n%3!==0;i.enabled=i.owned&&n%2===0;i.privateNote='keep';});
  const bytes=JSON.stringify(prior),current=defaults(catalog),merged=ownership.mergeItems(current,prior);
  assert.equal(JSON.stringify(prior),bytes);
  for(const old of Object.values(prior).flat()){
    const expected=structuredClone(old);
    if(old.id==='stratagem:40-k-meltagun') expected.assetPath='assets/new-gear/40-k-meltagun-stratagem.svg';
    assert.deepEqual(Object.values(merged).flat().find(i=>i.id===old.id),expected);
  }
  for(const group of [current,merged])for(const row of review.items){
    const i=group[types[row.type]].find(i=>i.id===row.id);assert.equal(i.owned,false);assert.equal(i.enabled,false);
    assert.equal(ownership.setEnabled(i,true),false);ownership.setOwned(i,true);assert.equal(ownership.isEligible(i),false);
    ownership.setEnabled(i,true);assert.equal(ownership.isEligible(i),true);
  }
});

test('pre-existing custom names and aliases migrate without duplication or lost ownership',()=>{
  for(const row of review.items)for(const name of [row.name,...row.aliases])for(const [owned,enabled]of [[true,true],[true,false],[false,false]]){
    const key=types[row.type],saved={[key]:[{name,id:'custom:'+row.type+':old',owned,enabled,privateNote:'preserve'}]};
    const merged=ownership.mergeItems(defaults(catalog),saved),matches=merged[key].filter(i=>i.id===row.id);
    assert.equal(matches.length,1);assert.equal(matches[0].owned,owned);assert.equal(matches[0].enabled,enabled);assert.equal(matches[0].privateNote,'preserve');
    assert.equal(merged[key].some(i=>i.id==='custom:'+row.type+':old'),false);
    assert.deepEqual(ownership.mergeItems(defaults(catalog),JSON.parse(JSON.stringify(merged))),merged);
  }
});

test('nine original vectors remain recoverable but no longer mapped',()=>{
  const historical=art.assets.filter(a=>a.sourceKind==='original-symbolic-vector');
  assert.equal(historical.length,9);
  for(const entry of historical){
    const bytes=fs.readFileSync(path.join(__dirname,'..',entry.assetPath)),svg=bytes.toString();
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);assert.equal(bytes.length,entry.bytes);
    assert.match(svg,/Original|original/);assert.match(svg,/<svg\b/);assert.match(svg,/not (?:an )?official/i);
    assert.doesNotMatch(svg,/<script\b|<foreignObject\b|\bon\w+\s*=|href\s*=|url\((?!#[a-z]+\))/i);
    assert.ok(!art.activeAssetPaths.includes(entry.assetPath));
  }
});

test('eight sourced item images and official cover have pinned bytes and exact mapping',()=>{
  const {PNG}=require('pngjs'),active=art.assets.filter(a=>art.activeAssetPaths.includes(a.assetPath));
  assert.equal(active.length,9);assert.equal(new Set(active.map(a=>a.assetPath)).size,9);
  assert.equal(active.filter(a=>a.sourceKind==='community-hosted-game-artwork').length,8);
  for(const entry of active){
    const bytes=fs.readFileSync(path.join(__dirname,'..',entry.assetPath));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);assert.equal(bytes.length,entry.bytes);
    assert.match(entry.sourceSha256,/^[a-f0-9]{64}$/);assert.match(entry.imageUrl,/^https:\/\//);
    assert.equal(entry.permissionStatus,'not-established');assert.match(entry.transformation,/unchanged download|no resampling or redrawing/);
    if(entry.crop){const [l,t,r,b]=entry.crop;assert.ok(l>=0&&t>=0&&r<=entry.sourceDimensions[0]&&b<=entry.sourceDimensions[1]);assert.deepEqual(entry.dimensions,[r-l,b-t]);}
    if(entry.type!=='warbond'){
      const image=images[entry.type].find(i=>i.name===entry.name);assert.equal(image.assetPath,entry.assetPath);assert.equal(image.artworkSha256,entry.sha256);
      const decoded=PNG.sync.read(bytes);assert.deepEqual([decoded.width,decoded.height],entry.dimensions);
      assert.equal(review.items.find(i=>i.name===entry.name).assetPath,entry.assetPath);
    }else{assert.equal(review.warbond.coverAssetPath,entry.assetPath);assert.equal(entry.sha256,entry.sourceSha256);assert.equal(entry.sourceKind,'publisher-promotional-image');}
  }
});

test('three wide weapon thumbnails retain transparent margins and high-resolution source detail',()=>{
  const {PNG}=require('pngjs');
  for(const slug of ['ar-11-arbitrator','gl-15-evictor','las-12-sai']){
    const entry=art.assets.find(a=>a.assetPath===`assets/catalog-additions/ironclad/${slug}.png`);
    const p=PNG.sync.read(fs.readFileSync(path.join(__dirname,'..',entry.assetPath)));
    assert.ok(p.width>=1000);let clear=0,solid=0;
    for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++){
      const alpha=p.data[(y*p.width+x)*4+3];if(!alpha)clear++;if(alpha===255)solid++;
      if(x<8||y<8||x>=p.width-8||y>=p.height-8)assert.equal(alpha,0,'No opaque screenshot rectangle or clipped edge');
    }
    assert.ok(clear>p.width*p.height*.2&&solid>p.width*p.height*.2,'Actual cutout, not blank or solid rectangle');
    assert.match(entry.sourceFile,/\.webp$/);assert.equal(entry.sourceKind,'community-hosted-game-artwork');
  }
  const css=fs.readFileSync(path.join(__dirname,'../assets/catalog-ui.css'),'utf8');
  assert.match(css,/\.newGearRow img \{[^}]*background: #202520/);
  assert.match(css,/#tab-items \.itemVisualCell \{ background: #202520;/);
  assert.match(css,/#tab-items \.itemVisualCell img \{ object-fit: contain;/);
});

test('review dismissal includes prior tokens and exact-source bulk grouping cannot cross Warbonds',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),ui=fs.readFileSync(path.join(__dirname,'../assets/catalog-ui.js'),'utf8');
  assert.match(html,/<summary>NEW GEAR &amp; OWNERSHIP<\/summary>/);
  assert.match(html,/\["1.1.2", "hyena-revenants", "ironclad-democracy"\]/);
  assert.match(ui,/item\.acquisition\?\.id === definition\.id/);assert.match(ui,/enable-ironclad-democracy/);
  assert.equal(review.items.filter(i=>i.acquisition.id===review.warbond.id).length,7);
});

test('themed names classify new laser/fire/explosive gear without treating extinguishers as flame weapons',()=>{
  const names=require('../assets/run-names'),n=names.create(defaults(catalog));
  assert.ok(n.analyze({loadout:{primary:'LAS-12 Sai'}}).scores.energy>0);
  assert.ok(n.analyze({loadout:{throwable:'G-8 Immolation'}}).scores.fire>0);
  assert.ok(n.analyze({loadout:{primary:'GL-15 Evictor'}}).scores.explosive>0);
  assert.equal(names.profiles['booster:integrated-extinguishers'].fire,undefined);
});
