'use strict';
// Read-only packaged inventory, with a generated evidence report outside the app.
const path=require('node:path'),assert=require('node:assert/strict');
const {buildInventory}=require('./audit-distribution');
const {writeJson}=require('../electron/durable-file');
const root=path.resolve(__dirname,'..');
const label=process.argv[2]||'mission-game-art';
assert.ok(['mission-game-art','mission-art-2','mission-art-3','mission-art-4','mission-art-final','yellow-missions', 'card-rules'].includes(label));
const expected={'mission-game-art':23,'mission-art-2':47,'mission-art-3':50,'mission-art-4':53,'mission-art-final':60,'yellow-missions':60,'card-rules':60}[label];
const inventory=buildInventory({root,candidate:'dist/'+label,reviewedAt:label==='mission-game-art'?'2026-09-27':'2026-09-28',installerProfile:'project-shell'});
const images=inventory.artwork.filter(row=>row.group==='mission-game-screenshot-crops');
assert.equal(images.length,expected);
for(const row of images){
  assert.equal(row.sourceRecords.length,1);
  assert.equal(row.sourceRecords[0].recordedSha256,row.sha256);
  assert.match(row.sourceRecords[0].sourceKind,/screenshot crop/);
  assert.match(row.sourceRecords[0].limitation,/unestablished/);
}
writeJson(path.join(root,'.test-data/'+label+'-inventory.json'),inventory);
console.log('Packaged inventory: all '+expected+' game crops have matching per-file credits and hashes. Rights remain unestablished.');
