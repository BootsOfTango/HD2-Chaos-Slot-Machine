'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const guide=read('README-FIRST.txt'),readme=read('README.md'),notes=read('docs/RELEASE_NOTES_1.0_DRAFT.md');

test('player guides match bundled counts and keep current source distinct from public releases',()=>{
  const catalog=require('../assets/item-catalog.json'),missions=require('../assets/mission-catalog.json');
  const plain=s=>s.replaceAll('**','');
  for(const text of [guide,readme,notes]){
    assert.ok(plain(text).includes(`${catalog.items.length} items and ${catalog.warbonds.length} Warbond groups`));
    assert.ok(plain(text).includes(`${missions.missions.length} mission identities`));
    assert.ok(text.includes(require('../package.json').version));
  }
  assert.match(guide,/not an announced 1\.0/);
  assert.match(readme,/not a newly published release/);
  assert.match(notes,/Unpublished preparation document/);
  assert.ok(notes.includes('Electron '+require('../package.json').devDependencies.electron));
  assert.equal(require('../release-identity.json').channel,'local-preview');
});

test('current player instructions no longer describe implemented map and activity as unavailable',()=>{
  for(const text of [guide,readme,notes]){
    assert.doesNotMatch(text,/Map still planned|galaxy map are still planned|Icons are original app symbols|activity is \*\*not reported by the current feed/i);
  }
  for(const text of [guide,readme].map(value=>value.replaceAll('**','').replace(/\s+/g,' '))){
    assert.match(text,/Reported activity/);assert.match(text,/Eligible only/);
    assert.match(text,/five minutes/);assert.match(text,/once per minute/);
    assert.match(text,/30-second cooldown/);assert.match(text,/lag the game/);
    assert.match(text,/coverage is partial/i);
    assert.match(text,/not confirmed currently playable/);
    assert.match(text,/Save & lock/);assert.match(text,/comments/i);
    assert.match(text,/Legacy-only/);assert.match(text,/32 MiB and 10,000 cards/);
  }
});

test('guide names match actual controls and ship through the existing extraFiles contract',()=>{
  const html=read('index.html'),wizard=read('assets/card-entry.js');
  for(const label of ['SPIN LOADOUT','LOCK LOADOUT','REROLL PLANET','CONFIRM PLANET','EXPORT JSON','IMPORT JSON','OPEN SAVE FOLDER','Retry saving','Export session JSON','Close without saving']){
    assert.ok(html.includes(label),label+' exists in app');
    assert.ok(guide.includes(label),label+' documented');
  }
  assert.ok(wizard.includes('Save & lock'));
  assert.ok(require('../electron-builder.config').extraFiles.some(row=>row.from==='README-FIRST.txt'&&row.to==='README-FIRST.txt'));
  for(const text of [guide,readme]){
    assert.match(text,/Do not disable/i);assert.match(text,/unsigned/i);
    assert.ok(text.includes(require('../release-identity.json').profileDirectory));
    assert.match(text,/separate profile/);
  }
});

test('player-facing Markdown links resolve locally or use well-formed HTTPS destinations',()=>{
  for(const file of ['README.md','docs/RELEASE_NOTES_1.0_DRAFT.md']){
    for(const match of read(file).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
      const target=match[1];
      if(/^https?:/.test(target)){assert.equal(new URL(target).protocol,'https:');continue;}
      const resolved=path.resolve(root,path.dirname(file),target.split('#')[0]);
      assert.ok(resolved.startsWith(root+path.sep),'link stays within project');
      assert.ok(fs.statSync(resolved).isFile(),`${file}: ${target}`);
    }
  }
});
