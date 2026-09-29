'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildLedger,publicUrl,relativeFile}=require('../scripts/audit-artwork-clearance');
const {assetGroup,buildInventory}=require('../scripts/audit-distribution');
const digest='a'.repeat(64),other='b'.repeat(64);
function fixture(){
  const file='assets/catalog-additions/ironclad/example.svg',note='assets/catalog-additions/ironclad/ATTRIBUTION.md';
  return {inventory:{reviewedAt:'2026-09-24',candidate:'dist/ironclad-gear',
    appFiles:[{file,sha256:digest},{file:note,sha256:other}],runtimeFiles:[{file:'resources/app.asar',sha256:digest}],
    artwork:[{file,sha256:digest,bytes:10,group:assetGroup(file),sourceRecords:[{record:'assets/item-images.json',metadata:{artworkSha256:digest,sourceUrl:'https://example.com/art.png?token=private'}}]}]},
    catalog:{items:[{id:'primary:test',name:'Test',assetPath:file,acquisition:{id:'warbond:ironclad-democracy'}}],warbonds:[]}};
}
test('new original art is not mislabeled as crossover art and never auto-cleared',()=>{
  const {inventory,catalog}=fixture(),out=buildLedger(inventory,catalog),asset=out.assets[0];
  assert.equal(asset.group,'project-ironclad-symbols-origin-review');assert.equal(asset.reviewRoute,'project-origin-review');
  assert.equal(asset.permissionStatus,'not-established');assert.equal(asset.permissionEvidence,null);
  assert.equal(asset.recordedHashStatus,'recorded-match');assert.equal(out.counts.permissionEstablished,0);
  assert.deepEqual(asset.sourceUrls,['https://example.com/art.png']);assert.ok(!JSON.stringify(out).includes('token=private'));
  assert.equal(assetGroup('assets/catalog-additions/righteous-revenants-cover.png'),'hyena-and-killzone-artwork');
});
test('local hashes without prior provenance do not close legacy source findings',()=>{
  const {inventory,catalog}=fixture();inventory.artwork[0].sourceRecords=[];catalog.items[0].id='stratagem:test';
  const out=buildLedger(inventory,catalog);assert.equal(out.assets[0].recordedHashStatus,'not-recorded');
  assert.equal(out.counts.catalogStratagemsWithoutRecordedHash,1);assert.equal(out.counts.permissionEstablished,0);
});

test('sourced Ironclad images never inherit the adjacent original-SVG origin claim',()=>{
  for(const suffix of ['example.png','cover.jpg']){
    const {inventory,catalog}=fixture(),file='assets/catalog-additions/ironclad/'+suffix;
    inventory.appFiles[0].file=file;inventory.artwork[0].file=file;inventory.artwork[0].group=assetGroup(file);catalog.items[0].assetPath=file;
    const row=buildLedger(inventory,catalog).assets[0];assert.equal(row.originNote,null);assert.notEqual(row.reviewRoute,'project-origin-review');assert.equal(row.permissionStatus,'not-established');
    assert.equal(row.group,suffix==='cover.jpg'?'publisher-promotional-warbond-covers':'ironclad-game-artwork');
  }
});
test('hash conflicts remain explicit even if one of two source claims matches',()=>{
  const {inventory,catalog}=fixture();inventory.artwork[0].sourceRecords.push({record:'assets/provenance.json',recordedSha256:other});
  assert.equal(buildLedger(inventory,catalog).assets[0].recordedHashStatus,'recorded-mismatch');
});
test('original-folder name without a bundled origin note does not claim independent origin',()=>{
  const {inventory,catalog}=fixture();inventory.appFiles.pop();
  assert.equal(buildLedger(inventory,catalog).assets[0].originNote,null);
});
test('crossover cover and equipment associations share a route, not a permission',()=>{
  const {inventory,catalog}=fixture();const file='assets/new-gear/cover.png';
  inventory.appFiles[0].file=file;inventory.artwork[0].file=file;catalog.items[0].assetPath=file;
  catalog.items[0].acquisition.id='warbond:castellans-creed';
  catalog.warbonds=[{id:'warbond:castellans-creed',name:'Creed',coverAssetPath:file}];
  const out=buildLedger(inventory,catalog);assert.deepEqual(out.assets[0].crossovers,['Warhammer 40,000']);
  assert.equal(out.assets[0].catalogReferences.length,2);assert.equal(out.assets[0].permissionStatus,'not-established');
});
test('duplicate bytes retain separate shipped paths and noncatalog assets remain in scope',()=>{
  const {inventory,catalog}=fixture();const row={...inventory.artwork[0],file:'assets/retained.svg'};
  inventory.artwork.push(row);inventory.appFiles.push({file:row.file,sha256:digest});
  const out=buildLedger(inventory,catalog);assert.equal(out.counts.mediaFiles,2);assert.equal(out.counts.uniqueContentHashes,1);
  assert.equal(out.counts.notDirectlyCatalogReferenced,1);assert.equal(out.duplicateContent[0].files.length,2);
});
test('missing, duplicate and changed media or catalog identities fail closed',()=>{
  for(const mutate of [
    (i)=>i.artwork.push(i.artwork[0]),(i)=>i.appFiles.push(i.appFiles[0]),
    (i)=>i.artwork[0].sha256=other,(i,c)=>c.items[0].assetPath='assets/missing.svg',
    (i,c)=>c.items.push(c.items[0]),(i)=>i.runtimeFiles=[]
  ]){const {inventory,catalog}=fixture();mutate(inventory,catalog);assert.throws(()=>buildLedger(inventory,catalog));}
});
test('public source links omit credentials, query strings, fragments and local paths',()=>{
  // Build this deliberately invalid fixture without putting a credential-shaped
  // URL literal in the repository. Keep the production secret detector strict.
  const credentialUrl=new URL('https://example.invalid/a');
  credentialUrl.username='fixture-user';credentialUrl.password='fixture-password';
  assert.ok(new URL(credentialUrl.href).username&&new URL(credentialUrl.href).password);
  for(const input of ['file:///C:/private','C:/private',credentialUrl.href,'javascript:alert(1)','http://example.com'])assert.equal(publicUrl(input),null);
  assert.equal(publicUrl('https://example.com/a?key=secret#private'),'https://example.com/a');
  for(const input of ['../a','/a','C:/a','a\\b','a//b'])assert.throws(()=>relativeFile(input));
});
test('review dates and installer profiles are explicit and validated before reads',()=>{
  for(const reviewedAt of ['now','2026-02-30','2026-01-01T00:00:00Z'])assert.throws(()=>buildInventory({reviewedAt}));
  assert.throws(()=>buildInventory({installerProfile:'anything'}),/Unknown installer/);
});
test('current saved index is complete, sanitized and unapproved',()=>{
  const ledger=require('../docs/artwork-clearance-inventory.json');
  assert.equal(ledger.counts.mediaFiles,ledger.assets.length);
  assert.equal(new Set(ledger.assets.map(a=>a.file)).size,ledger.assets.length);
  assert.equal(ledger.counts.catalogStratagemsWithoutRecordedHash,89);
  assert.equal(ledger.assets.filter(a=>a.file.startsWith('assets/catalog-additions/ironclad/')).length,9);
  assert.ok(ledger.assets.every(a=>a.permissionStatus==='not-established'&&a.permissionEvidence===null));
  assert.doesNotMatch(JSON.stringify(ledger),/C:\\|C:\/Users|\.test-data|state\.json|token=/i);
});
