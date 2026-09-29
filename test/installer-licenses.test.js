'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {verifyMaterials,verifyBytes,safeFile,PLUGINS}=require('../scripts/prepare-installer-licenses');

test('all vendored license/source bytes match their review manifest offline',()=>{
  const manifest=verifyMaterials();
  assert.equal(manifest.files.length,12);
  assert.equal(manifest.pluginMatches.length,4);
  assert.match(manifest.unresolved[0],/WinShell/);
  const snapshot=require('../docs/distribution-inventory.json');
  for(const [,member,sha256] of PLUGINS)assert.ok(snapshot.installer.components.some(row=>row.file.endsWith('/'+path.posix.basename(member))&&row.sha256===sha256));
});
test('changed/missing legal materials are rejected, never silently regenerated',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'hd2-license-test-'));
  try{
    fs.mkdirSync(path.join(root,'licenses'),{recursive:true});
    fs.cpSync(path.join(__dirname,'../licenses/installer'),path.join(root,'licenses/installer'),{recursive:true});
    assert.equal(verifyMaterials(root).files.length,12);
    const file=path.join(root,'licenses/installer/UAC-License.txt');
    fs.appendFileSync(file,'changed');
    assert.throws(()=>verifyMaterials(root),/hash mismatch/);
    fs.unlinkSync(file);
    assert.throws(()=>verifyMaterials(root),/ENOENT/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('material helpers reject path traversal and wrong download bytes',()=>{
  for(const name of ['','../a','a/../b','a\\b','a//b','/root','C:/a'])assert.throws(()=>safeFile(__dirname,name),/Unsafe/);
  assert.throws(()=>verifyBytes(Buffer.from('changed'),'0'.repeat(64),'fixture'),/hash mismatch/);
});
test('future build and ZIP verification include offline source and notices',()=>{
  const config=require('../electron-builder.config');
  assert.ok(config.extraFiles.some(row=>row.from==='licenses/installer'&&row.to==='licenses/installer'));
  assert.match(require('../package.json').scripts['prebuild:win'],/validate:installer-licenses/);
  const verifier=fs.readFileSync(path.join(__dirname,'../scripts/verify_win_zip.py'),'utf8');
  assert.match(verifier,/Missing, ambiguous or changed installer license\/source material in ZIP/);
  for(const file of ['LGPL-2.1.txt','NSIS-COPYING.txt','UAC-License.txt'])assert.ok(fs.statSync(path.join(__dirname,'../licenses/installer',file)).size>900);
});
