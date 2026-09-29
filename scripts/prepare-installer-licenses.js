'use strict';
// Vendor unmodified upstream legal/source artifacts. Never execute downloaded code.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {writeDurable,writeJson}=require('../electron/durable-file');
const ROOT=path.resolve(__dirname,'..');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const INPUTS=[
  ['StdUtils.2018-10-27.zip','3ffe893dc7477fdb1cac551a86ae017509e1f2d0ebdc7185fd0fbaf20870688c','https://github.com/lordmulder/stdutils/releases/download/1.14/StdUtils.2018-10-27.zip'],
  ['StdUtils.2018-10-27.sources.tbz2','c5e3b1a66219bc9564c2ccc1702691327eecf044ad33404ac268d725d22dca49','https://github.com/lordmulder/stdutils/releases/download/1.14/StdUtils.2018-10-27.sources.tbz2'],
  ['Nsis7z_19.00.7z','6f2f3730049926f40442ee0c8b7d3e3dee7ace544d82467ff8059ea3f4201c58','https://nsis.sourceforge.io/mediawiki/images/6/69/Nsis7z_19.00.7z'],
  ['lzma1900.7z','00f569e624b3d9ed89cf8d40136662c4c5207eaceb92a70b1044c77f84234bad','https://www.7-zip.org/a/lzma1900.7z'],
  ['UAC.zip','20e3192af5598568887c16d88de59a52c2ce4a26e42c5fb8bee8105dcbbd1760','https://nsis.sourceforge.io/mediawiki/images/8/8f/UAC.zip'],
  ['WinShell.zip','34e111f8aacf64c540d848fd06b9d6f3e2c10cb825ec9329a01d1141973e749b','https://nsis.sourceforge.io/mediawiki/images/5/54/WinShell.zip'],
  ['NSIS-COPYING.txt','3c8de989f6504d52f5f8dfafedb6668cd47201f5d01f1319570727c091425dd6','https://raw.githubusercontent.com/electron-userland/electron-builder-binaries/nsis-3.0.4.1/nsis/COPYING'],
];
const PLUGINS=[
  ['StdUtils.2018-10-27.zip','Plugins/Unicode/StdUtils.dll','b72e9013a6204e9f01076dc38dabbf30870d44dfc66962adbf73619d4331601e'],
  ['Nsis7z_19.00.7z','Plugins/x86-unicode/nsis7z.dll','b393f05e8ff919ef071181050e1873c9a776e1a0ae8329aefff7007d0cadf592'],
  ['UAC.zip','Plugins/x86-unicode/UAC.dll','2f7f8fc05dc4fd0d5cda501b47e4433357e887bbfed7292c028d99c73b52dc08'],
  ['WinShell.zip','Plugins/x86-unicode/WinShell.dll','9be85b986ea66a6997dde658abe82b3147ed2a1a3dcb784bb5176f41d22815a6'],
];
function verifyBytes(bytes,expected,label){if(digest(bytes)!==expected)throw Error('License material hash mismatch: '+label);return bytes;}
function safeFile(root,relative){
  if(!relative || relative.includes('\\') || relative.split('/').some(p=>!p || p==='.' || p==='..') || path.isAbsolute(relative) || relative.includes(':')) throw Error('Unsafe material path');
  let current=path.resolve(root);
  for(const part of relative.split('/')){current=path.join(current,part);if(fs.existsSync(current)&&fs.lstatSync(current).isSymbolicLink())throw Error('Linked material path');}
  return current;
}
function verifyMaterials(root=ROOT){
  const dir=path.join(root,'licenses/installer');
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
  if(manifest.schemaVersion!==1 || !Array.isArray(manifest.files) || manifest.files.length!==12) throw Error('Incomplete license material manifest');
  const names=new Set();
  for(const row of manifest.files){if(names.has(row.file))throw Error('Duplicate material');names.add(row.file);const bytes=fs.readFileSync(safeFile(dir,row.file));verifyBytes(bytes,row.sha256,row.file);if(bytes.length!==row.bytes)throw Error('Material length mismatch');}
  for(const [file,sha256] of INPUTS){if(!manifest.inputs.some(row=>row.file===file&&row.sha256===sha256))throw Error('Unreviewed input metadata');}
  for(const [,member,sha256] of PLUGINS){if(!manifest.pluginMatches.some(row=>row.member===member&&row.sha256===sha256))throw Error('Missing plugin match');}
  return manifest;
}
function prepare(root=ROOT){
  const cache=path.join(root,'.test-data/installer-license-review');
  const destination=path.join(root,'licenses/installer');
  const inputs=INPUTS.map(([file,sha256,url])=>{verifyBytes(fs.readFileSync(safeFile(cache,file)),sha256,file);return{file,sha256,url};});
  const tool=path.join(root,'node_modules/electron-winstaller/vendor/7z.exe');
  const extract=(archive,member)=>{
    const args=['e','-so',safeFile(cache,archive)];if(member)args.push(member.replaceAll('/',path.sep));
    const result=spawnSync(tool,args,{windowsHide:true,maxBuffer:8*1024*1024,timeout:30000});
    if(result.error||result.status!==0||!result.stdout.length)throw Error('Cannot inspect '+archive+': '+(result.error?.message||result.stderr.toString()));
    return result.stdout;
  };
  const snapshot=require(path.join(root,'docs/distribution-inventory.json'));
  const pluginMatches=PLUGINS.map(([archive,member,sha256])=>{
    verifyBytes(extract(archive,member),sha256,member);
    if(!snapshot.installer.components.some(row=>row.file.endsWith('/'+path.posix.basename(member))&&row.sha256===sha256))throw Error('Plugin differs from reviewed installer');
    return {archive,member,sha256,comparison:'byte-identical to reviewed protected-startup installer'};
  });
  const tar=extract('StdUtils.2018-10-27.sources.tbz2');
  if(!tar.equals(extract('StdUtils.2018-10-27.zip','Contrib/StdUtils/StdUtils.2018-10-27.Sources.tar')))throw Error('StdUtils source archives disagree');
  const outputs=[
    ['NSIS-COPYING.txt',fs.readFileSync(safeFile(cache,'NSIS-COPYING.txt')),'NSIS-COPYING.txt'],
    ...['StdUtils.2018-10-27.sources.tbz2','Nsis7z_19.00.7z','lzma1900.7z','UAC.zip'].map(file=>['sources/'+file,fs.readFileSync(safeFile(cache,file)),file]),
    ...[['LGPL-2.1.txt','StdUtils.2018-10-27.zip','LGPL.txt'],['StdUtils-LGPL-CLARIFICATION.txt','StdUtils.2018-10-27.zip','LGPL_CLARIFICATION.txt'],
      ['StdUtils-ReadMe.txt','StdUtils.2018-10-27.zip','ReadMe.txt'],['Nsis7z-License.txt','Nsis7z_19.00.7z','Contrib/nsis7z/DOC/License.txt'],
      ['Nsis7z-ReadMe.txt','Nsis7z_19.00.7z','Contrib/nsis7z/DOC/nsis7z.txt'],['LZMA-SDK-ReadMe.txt','lzma1900.7z','DOC/lzma-sdk.txt'],
      ['UAC-License.txt','UAC.zip','License.txt']].map(([out,archive,member])=>[out,extract(archive,member),archive+':'+member]),
  ];
  // All downloads and comparisons pass before writing any destination bytes.
  for(const [file,bytes] of outputs){const target=safeFile(destination,file);if(fs.existsSync(target)&&!fs.readFileSync(target).equals(bytes))throw Error('Refusing to replace changed vendored material: '+file);}
  for(const [file,bytes] of outputs)writeDurable(safeFile(destination,file),bytes);
  writeJson(path.join(destination,'manifest.json'),{schemaVersion:1,reviewedAt:'2026-09-16',inputs,pluginMatches,stdUtilsSourceTarSha256:digest(tar),
    files:outputs.map(([file,bytes,source])=>({file,bytes:bytes.length,sha256:digest(bytes),source})),
    unresolved:['WinShell archive has no full license text/source; upstream Freeware label retained as evidence, not a fabricated grant.',
      'Fresh installer/ZIP content verification and final legal-use-basis review remain. No reproducible rebuild of upstream DLLs claimed.']});
  return verifyMaterials(root);
}
if(require.main===module){try{if(process.argv.length!==3||!['--prepare','--check'].includes(process.argv[2]))throw Error('Use --prepare or --check');const manifest=process.argv[2]==='--prepare'?prepare():verifyMaterials();console.log(`Verified ${manifest.files.length} installer legal/source files; ${manifest.pluginMatches.length} matched upstream plugins. Public clearance remains incomplete.`);}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={INPUTS,PLUGINS,verifyBytes,safeFile,verifyMaterials};
