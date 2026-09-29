const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const identity=require('../release-identity.json');
const profile=require('../electron/identity');
const storage=require('../electron/storage');
const art=require('../scripts/brand-art');
const root=path.resolve(__dirname,'..');

test('public version/name are separate from unchanged upgrade and storage identities',()=>{
  assert.equal(identity.productName,'HD2 Chaos Slot Machine');
  assert.equal(identity.publicVersion,'1.0.0');
  assert.equal(require('../package.json').version,'1.1.14');
  assert.equal(profile.resolveProfile('C:\\fixture',{}).directory,path.join('C:\\fixture','Helldivers 2 Chaos Slot Machine'));
  assert.equal(profile.APP_ID,'com.bootsoftango.helldivers2chaosslotmachine');
  const config=require('../electron-builder.config');
  assert.equal(config.appId,profile.APP_ID);
  assert.equal(config.productName,identity.productName);
  assert.equal(config.executableName,identity.productName);
  assert.ok(config.files.includes('release-identity.json'));
  assert.equal(config.nsis.deleteAppDataOnUninstall,false);
});
test('old 1.1.x save loads without rewriting and preserves history after new-brand save',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hd2-public-identity-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const data={cards:[{id:'old-result',statsLocked:true,score:1234}],items:{primaries:[{name:'AR-23 Liberator',enabled:false}]},settings:{rememberedPlayerName:'Upgrade fixture'}};
  const file=path.join(dir,'state.json');
  const raw=JSON.stringify(storage.wrapData(data,'1.1.14'));
  fs.writeFileSync(file,raw);
  assert.deepEqual(storage.loadStateFile(dir).data,data);
  assert.equal(fs.readFileSync(file,'utf8'),raw);
  storage.saveStateFile(dir,data);
  assert.deepEqual(storage.loadStateFile(dir).data,data);
  assert.equal(JSON.parse(fs.readFileSync(file)).applicationVersion,'1.1.14');
});
test('header and code-native mark use full words without the retired acronym',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(html,/<title>HD2 Chaos Slot Machine<\/title>/);
  const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].filter(row=>! /\bsrc\s*=/.test(row[1]));
  assert.equal(inline.length,1);
  assert.doesNotThrow(()=>new (require('node:vm').Script)(inline[0][2]), 'branding edits must not corrupt application JavaScript');
  assert.match(html,/class="appBrandText"[^>]*>HD2 Chaos Slot Machine</);
  assert.match(html,/1\.0 · Local preview · Unofficial fan app/);
  assert.doesNotMatch(html,/src="assets\/branding\/hd2csm-emblem.png"/);
  assert.equal(fs.readFileSync(path.join(root,'assets/branding/hd2-chaos-slot-machine.svg'),'utf8'),art.svg());
  assert.doesNotMatch(art.svg(),/<image|<script|href=|HD2CSM/);
  assert.ok(fs.existsSync(path.join(root,'assets/branding/hd2csm-emblem.png')),'original artwork retained');
});
test('icon generator is deterministic and confines all geometry to its canvas',()=>{
  assert.ok(art.png().equals(art.png()));
  for(const r of art.geometry())assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=256&&r.y+r.h<=256);
  const {PNG}=require('pngjs');const png=PNG.sync.read(art.png());
  assert.equal(png.width,256);assert.equal(png.height,256);
});
test('public workflow uses a distinct full-word tag without reusing historical v1.0.0',()=>{
  const workflow=fs.readFileSync(path.join(root,'.github/workflows/windows-release.yml'),'utf8');
  assert.ok(workflow.includes(identity.tagPrefix+'*.*.*'));
  assert.match(workflow,/release-identity.json/);
  assert.doesNotMatch(workflow,/HD2CSM-Setup|Helldivers-2-Chaos-Slot-Machine-v/);
  const signature=fs.readFileSync(path.join(root,'scripts/verify_windows_signature.ps1'),'utf8');
  assert.match(signature,/-Filter 'HD2 Chaos Slot Machine.exe'/);
  assert.match(signature,/releaseIdentity.publicVersion/);
});
