'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {renderNotes}=require('../scripts/prepare-release-notes');
const identity=require('../release-identity.json');
const source=fs.readFileSync(path.join(__dirname,'../docs/RELEASE_NOTES_1.1.1.md'),'utf8');
const digests={setup:'a'.repeat(64),zip:'b'.repeat(64)};
test('release notes bind full-name downloads and actual hashes without preparation placeholders',()=>{
  const body=renderNotes(identity,'unsigned',digests,source);
  assert.match(body,/^# HD2 Chaos Slot Machine 1\.1\.1/);
  for(const digest of Object.values(digests))assert.ok(body.includes(digest));
  assert.match(body,/HD2-Chaos-Slot-Machine\/releases\/download\/hd2-chaos-slot-machine-v1\.1\.1/);
  assert.match(body,/Windows may show Unknown publisher/);
  assert.match(body,/No automatic app updater/);
  assert.match(body,/blob\/hd2-chaos-slot-machine-v1\.1\.1\/README-FIRST.txt/);
  assert.doesNotMatch(body,/Publication fields|Unpublished preparation|\*\*pending\*\*|\.test-data|C:\\Users|\.\.\/README/);
});
test('release notes reject malformed or unreviewed metadata and missing sections',()=>{
  for(const change of [{channel:'local-preview'},{repository:'someone/else'},{publicVersion:'1.0.0;bad'},{tagPrefix:'v'}])
    assert.throws(()=>renderNotes({...identity,...change},'unsigned',digests,source));
  assert.throws(()=>renderNotes(identity,'unknown',digests,source));
  assert.throws(()=>renderNotes(identity,'unsigned',{...digests,setup:'bad'},source));
  assert.throws(()=>renderNotes(identity,'unsigned',digests,'no sections'));
});
