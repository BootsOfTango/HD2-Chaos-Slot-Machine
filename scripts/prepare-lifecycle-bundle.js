'use strict';
// Exact, synthetic-only inputs for a separate disposable Windows runner.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {wrapData}=require('../electron/storage');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function runtimeInventory(runtime,report) {
  const files=[];
  function visit(directory) {
    if(fs.lstatSync(directory).isSymbolicLink()) throw Error('Linked runtime directory');
    for(const name of fs.readdirSync(directory).sort()) {
      const file=path.join(directory,name),stat=fs.lstatSync(file);
      if(stat.isSymbolicLink()) throw Error('Linked runtime file');
      if(stat.isDirectory()) visit(file);
      else if(stat.isFile()) files.push({file:path.relative(runtime,file).split(path.sep).join('/'),bytes:stat.size,sha256:hash(fs.readFileSync(file))});
      else throw Error('Unexpected runtime entry');
    }
  }
  visit(runtime);
  for(const [file,expected] of [['HD2 Chaos Slot Machine.exe',report.exeSha256],['resources/app.asar',report.asarSha256]]) {
    if(!/^[a-f0-9]{64}$/.test(expected||'') || files.find(row=>row.file===file)?.sha256!==expected) throw Error('Inspected runtime changed: '+file);
  }
  for(const file of ['LICENSE.electron.txt','LICENSES.chromium.html','README-FIRST.txt','NOTICE.txt','SECURITY.md']) {
    if(!files.some(row=>row.file===file)) throw Error('Missing verified runtime companion: '+file);
  }
  return files;
}
function prepare(root=path.resolve(__dirname,'..')) {
  const candidate='dist/ci-lifecycle',dir=path.join(root,candidate);
  const report=JSON.parse(fs.readFileSync(path.join(root,'.test-data/ci-lifecycle-artifact-inspection/report.json')));
  if(!report.passed || report.installerExecuted || !report.uninstaller?.sha256) throw Error('Inspected unexecuted CI installer required');
  // Bundle only the already-inspected runtime. A full historical distribution
  // audit also expects node_modules/electron/dist, which clean builder-only
  // jobs need not have. Do not invent an upstream-notice parity pass here.
  const runtimeFiles=runtimeInventory(path.join(dir,'win-unpacked'),report);
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
    installer:name,uninstallerSha256:report.uninstaller.sha256,runtimeFiles,
    files:Object.entries(files).map(([file,bytes])=>({file,bytes:bytes.length,sha256:hash(bytes)}))};
  const output=path.join(root,'out/lifecycle-upload');
  if(fs.existsSync(output)) throw Error('Upload staging exists; inspect instead of overwriting');
  fs.mkdirSync(output,{recursive:true});
  for(const [file,bytes] of Object.entries(files)) fs.writeFileSync(path.join(output,file),bytes,{flag:'wx'});
  fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({stagedFiles:Object.keys(files).length+1,runtimeFiles:runtimeFiles.length,installerSha256:hash(installer),sourceCommit:manifest.sourceCommit}));
}
if(require.main===module) prepare();
module.exports={prepare,runtimeInventory};
