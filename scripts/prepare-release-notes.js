'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

function renderNotes(identity,mode,digests,source){
  if(identity.channel!=='release'||identity.productName!=='HD2 Chaos Slot Machine'||
    !/^\d+\.\d+\.\d+$/.test(identity.publicVersion)||identity.artifactStem!=='HD2-Chaos-Slot-Machine'||
    identity.tagPrefix!=='hd2-chaos-slot-machine-v'||identity.repository!=='BootsOfTango/HD2-Chaos-Slot-Machine') throw Error('Unreviewed release identity');
  if(!['signed','unsigned'].includes(mode)) throw Error('Unknown signing mode');
  for(const key of ['setup','zip'])if(!/^[a-f0-9]{64}$/.test(digests[key]||''))throw Error('Missing artifact digest');
  const first=source.indexOf('## What\'s prepared');
  const last=source.indexOf('## Publication fields');
  if(first<0||last<=first)throw Error('Release-notes source sections missing');
  // Release body contains user documentation only, never internal evidence paths.
  const body=source.slice(first,last).replace("## What's prepared","## What's new")
    .replace('[the player guide](../README-FIRST.txt)',`[the player guide](https://github.com/${identity.repository}/blob/${identity.tagPrefix}${identity.publicVersion}/README-FIRST.txt)`);
  const base=`https://github.com/${identity.repository}/releases/download/${identity.tagPrefix}${identity.publicVersion}/`;
  const setup=`${identity.artifactStem}-Setup-v${identity.publicVersion}-win-x64.exe`;
  const zip=`${identity.artifactStem}-v${identity.publicVersion}-win-x64.zip`;
  return `# ${identity.productName} ${identity.publicVersion}\n\n`+
    `## Downloads — Windows x64\n\n`+
    `**Recommended: [Download Setup](${base}${setup})** — install once, then use its shortcut.\n\n`+
    `Optional: [portable app ZIP](${base}${zip}) — extract everything before running. GitHub's Source code ZIP is not the app.\n\n`+
    `Distribution: **${mode}**. ${mode==='unsigned'?'Windows may show Unknown publisher or SmartScreen warnings. ':''}Do not disable Windows protection.\n\n`+
    body.trim()+`\n\n## SHA-256 checksums\n\nA matching checksum confirms file integrity, not freedom from malware.\n\n`+
    `\`\`\`text\n${digests.setup}  ${setup}\n${digests.zip}  ${zip}\n\`\`\`\n\n`+
    `This independent fan project is not endorsed by Arrowhead or Sony. Third-party images/trademarks retain their owners' rights; attribution is not permission. No copyright-clearance, security or crash-free guarantee is made.\n`;
}
function prepare(directory){
  const root=path.resolve(__dirname,'..'),dist=path.resolve(root,directory||'dist');
  if(dist!==path.join(root,'dist')&&!dist.startsWith(path.join(root,'dist')+path.sep))throw Error('Artifact directory must be inside project dist');
  const identity=require('../release-identity.json'),policy=require('../docs/release-distribution.json');
  const digests={};
  for(const [key,name] of [['setup',`${identity.artifactStem}-Setup-v${identity.publicVersion}-win-x64.exe`],['zip',`${identity.artifactStem}-v${identity.publicVersion}-win-x64.zip`]]){
    const file=path.join(dist,name);
    if(!fs.lstatSync(file).isFile()||fs.lstatSync(file).isSymbolicLink())throw Error('Artifact must be a regular file');
    const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if(fs.readFileSync(file+'.sha256','utf8').trimEnd()!==`${hash}  ${name}`)throw Error('Artifact checksum does not match sidecar');
    digests[key]=hash;
  }
  const text=renderNotes(identity,policy.mode,digests,fs.readFileSync(path.join(root,'docs/RELEASE_NOTES_1.0_DRAFT.md'),'utf8'));
  const output=path.join(dist,'RELEASE-NOTES.md');
  fs.writeFileSync(output,text,{encoding:'utf8',flag:'wx'});
  console.log('Prepared checksum-bound release notes: '+output);
}
if(require.main===module){try{if(process.argv.length>3)throw Error('Expected zero or one artifact directory');prepare(process.argv[2]);}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={renderNotes,prepare};
