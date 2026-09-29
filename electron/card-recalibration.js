// Main-process transaction. No renderer-supplied candidate or filesystem path.
const fs=require('node:fs');
const path=require('node:path');
const {createHash,randomUUID}=require('node:crypto');
const storage=require('./storage');
const rules=require('../assets/card-rules');
const solo=require('../assets/solo-score');
const {writeDurable}=require('./durable-file');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function create(directory,appVersion,hook=()=>{}) {
  let proposal=null;
  const file=path.join(directory,'state.json');
  function safePath(target) {
    const relative=path.relative(path.resolve(directory),path.resolve(target));
    if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unsafe recovery path.');
    let cursor=path.resolve(directory);
    for(const part of ['.',...relative.split(path.sep)]) {
      cursor=path.resolve(cursor,part);
      if(fs.existsSync(cursor)&&fs.lstatSync(cursor).isSymbolicLink())throw Error('Linked save/recovery paths are not supported.');
    }
  }
  function prepare() {
    safePath(file);
    const raw=fs.readFileSync(file),data=storage.parseSave(raw.toString('utf8'));
    const summary=rules.preview(data);
    const token=randomUUID();
    proposal={token,hash:hash(raw),summary};
    return {ok:true,token,...summary};
  }
  function commit(token) {
    const p=proposal; proposal=null; // Single use, including failed attempts.
    if(!p||token!==p.token)throw Error('Review these cards again before confirming.');
    if(!p.summary.canApply)throw Error('There are no safe changes to apply.');
    safePath(file);
    const raw=fs.readFileSync(file);
    if(hash(raw)!==p.hash)throw Error('Your save changed. Review the updated cards again.');
    const before=storage.parseSave(raw.toString('utf8'));
    const data=rules.apply(before);
    storage.validateData(data); solo.validateData(data);
    const payload=JSON.stringify(storage.wrapData(data,appVersion),null,2);
    // Validate publication through the same native reader, with no export-size cap.
    storage.parseSave(payload);
    hook('validated');
    const recovery=path.join(directory,'card-upgrades',randomUUID());
    safePath(recovery);fs.mkdirSync(recovery,{recursive:true});
    const backup=path.join(recovery,'before.json');
    writeDurable(backup,raw);
    if(hash(fs.readFileSync(backup))!==p.hash)throw Error('Recovery backup verification failed. No cards changed.');
    hook('backed-up');
    const manifest={version:1,createdAt:new Date().toISOString(),ruleId:p.summary.ruleId,
      beforeSha256:p.hash,afterSha256:hash(payload),backup:'before.json',counts:p.summary.counts,
      removed:p.summary.rows.filter(r=>r.status==='incomplete').map(r=>({id:r.id,reasons:r.reasons})),status:'prepared'};
    writeDurable(path.join(recovery,'manifest.json'),JSON.stringify(manifest,null,2));
    hook('prepared');
    if(hash(fs.readFileSync(backup))!==p.hash)throw Error('Recovery backup changed. No cards changed.');
    if(hash(fs.readFileSync(file))!==p.hash)throw Error('Your save changed. Backup retained; review again.');
    safePath(file);writeDurable(file,payload);
    // No error after the commit may be reported as "nothing changed".
    try {hook('committed');writeDurable(path.join(recovery,'committed.json'),JSON.stringify({afterSha256:hash(payload)}));}catch(_){/* Manifest hashes identify the committed state after interruption. */}
    return {ok:true,data,backup,counts:p.summary.counts};
  }
  return {prepare,commit};
}
module.exports={create,hash};
