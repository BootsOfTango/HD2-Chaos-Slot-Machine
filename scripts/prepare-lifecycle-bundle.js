'use strict';
// Exact, synthetic-only inputs for a separate disposable Windows runner.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {buildInventory}=require('./audit-distribution');
const {wrapData}=require('../electron/storage');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function prepare(root=path.resolve(__dirname,'..')) {
  const candidate='dist/ci-lifecycle',dir=path.join(root,candidate);
  const report=JSON.parse(fs.readFileSync(path.join(root,'.test-data/ci-lifecycle-artifact-inspection/report.json')));
  if(!report.passed || report.installerExecuted || !report.uninstaller?.sha256) throw Error('Inspected unexecuted CI installer required');
  const date=new Date().toISOString().slice(0,10);
  const inventory=buildInventory({root,candidate,reviewedAt:date,installerProfile:'project-shell'});
  const name='HD2-Chaos-Slot-Machine-Setup-local-ci-lifecycle-win-x64.exe';
  const installer=fs.readFileSync(path.join(dir,name));
  if(hash(installer)!==report.installerSha256) throw Error('Inspected installer changed');
  const fixture=structuredClone(require('../test/fixtures/card-compatibility.json').soloV1);
  fixture.id='ci-installer-lifecycle-card';fixture.seed='Synthetic installer lifecycle test';
  const synthetic=Buffer.from(JSON.stringify(wrapData({cards:[fixture],settings:{rememberedPlayerName:'Synthetic CI only'},items:{}},require('../package.json').version),null,2)+'\n');
  const script=fs.readFileSync(path.join(root,'scripts/test-windows-lifecycle.ps1'));
  const notice=Buffer.from('UNSIGNED TEST BUILD — NOT AN OFFICIAL RELEASE.\nDisposable GitHub Windows installer lifecycle checks only.\nNo player saves or credentials are included. Do not disable security protections.\n');
  const files={[name]:installer,'synthetic-state.json':synthetic,'test-windows-lifecycle.ps1':script,'TEST-ONLY.txt':notice};
  const manifest={schemaVersion:1,purpose:'disposable-github-runner-test-only',builtAt:new Date().toISOString(),
    sourceCommit:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
    productName:'HD2 Chaos Slot Machine',profileDirectory:'Helldivers 2 Chaos Slot Machine',
    guid:'47bdb29f-8aa0-5f3c-a469-272721cfb1dc',compatibilityVersion:require('../package.json').version,
    installer:name,uninstallerSha256:report.uninstaller.sha256,runtimeFiles:inventory.runtimeFiles,
    files:Object.entries(files).map(([file,bytes])=>({file,bytes:bytes.length,sha256:hash(bytes)}))};
  const output=path.join(root,'out/lifecycle-upload');
  if(fs.existsSync(output)) throw Error('Upload staging exists; inspect instead of overwriting');
  fs.mkdirSync(output,{recursive:true});
  for(const [file,bytes] of Object.entries(files)) fs.writeFileSync(path.join(output,file),bytes,{flag:'wx'});
  fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({stagedFiles:Object.keys(files).length+1,runtimeFiles:inventory.runtimeFiles.length,installerSha256:hash(installer),sourceCommit:manifest.sourceCommit}));
}
if(require.main===module) prepare();
module.exports={prepare};
