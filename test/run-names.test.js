'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const names=require('../assets/run-names'),lex=require('../assets/run-name-lexicon'),catalog=require('../assets/item-catalog.json');
const groups=Object.fromEntries(Object.entries({primaries:'primary',sidearms:'sidearm',throwables:'throwable',stratagems:'stratagem',boosters:'booster'}).map(([k,type])=>[k,catalog.items.filter(i=>i.type===type)]));
const generator=names.create(groups),copy=x=>JSON.parse(JSON.stringify(x));
const base=()=>({difficulty:7,faction:'Automatons',mode:'Normal (40)',missionSelection:{id:'mission:launch-icbm'},planet:{name:'Hellmire',sector:'Mirin',biome:'Magma',weatherText:'Fire Tornadoes'},loadout:{primary:'AR-23 Liberator',sidearm:'P-2 Peacemaker',throwable:'G-23 Stun',stratagems:['MG-43 Machine Gun','Jump Pack','Supply Pack','Shield Generator Relay'],booster:'Stamina Enhancement'}});
const fullFire=()=>({...base(),loadout:{primary:'FLAM-66 Torcher',sidearm:'P-72 Crisper',throwable:'G-10 Incendiary',stratagems:['FLAM-40 Flamethrower','Orbital Napalm Barrage','Eagle Napalm Airstrike','Flame Sentry'],booster:'Firebomb Hellpods'}});
test('large curated vocabulary has clean, unique entries per bank and bounded display words',()=>{
  assert.ok(names.vocabularyStats().uniqueWords>=850);
  for(const bank of [...Object.values(lex.themes).flat(),...Object.values(lex.roles),...Object.values(lex.factions),...Object.values(lex.environments),...Object.values(lex.missions),lex.general,lex.endings]){
    assert.equal(new Set(bank.map(s=>s.toLowerCase())).size,bank.length);
    assert.ok(bank.every(w=>/^[A-Za-z]+(?:-[A-Za-z]+)*$/.test(w)&&w.length<=20));
  }
});
test('all explicit theme IDs exist in the reviewed catalog, with only bounded recognized weights',()=>{
  for(const [id,p] of Object.entries(names.profiles)){
    assert.ok(catalog.items.some(i=>i.id===id),id);
    for(const [theme,value] of Object.entries(p)){assert.ok(lex.themes[theme]||lex.roles[theme]);assert.ok(value===.5||value===1);}
  }
});
test('fire intensity progresses without planetary heat inflating equipment score',()=>{
  const run=base();assert.equal(generator.analyze(run).scores.fire,0);
  run.loadout.throwable='G-10 Incendiary';assert.equal(generator.analyze(run).scores.fire,6.25);assert.equal(generator.analyze(run).tier,0);
  run.loadout.primary='FLAM-66 Torcher';assert.equal(generator.analyze(run).scores.fire,31.25);assert.equal(generator.analyze(run).tier,1);
  run.loadout.sidearm='P-72 Crisper';run.loadout.stratagems[0]='FLAM-40 Flamethrower';assert.equal(generator.analyze(run).scores.fire,56.25);assert.equal(generator.analyze(run).tier,2);
  assert.equal(generator.analyze(fullFire()).scores.fire,100);assert.equal(generator.analyze(fullFire()).tier,3);
  const cold=fullFire();cold.planet.biome='Tundra';cold.planet.weatherText='Blizzards';assert.equal(generator.analyze(cold).scores.fire,100);
  for(const score of [0,19.99,20,44.99,45,69.99,70,100])assert.equal(names.tier(score),score>=70?3:score>=45?2:score>=20?1:0);
});
test('partial incendiary effect contributes less than a full flame primary',()=>{
  const run=base();run.loadout.primary='SG-451 Cookout';assert.equal(generator.analyze(run).scores.fire,12.5);
  run.loadout.primary='FLAM-66 Torcher';assert.equal(generator.analyze(run).scores.fire,25);
  run.loadout.primary='Stoker';assert.equal(generator.analyze(run).scores.fire,12.5);
});
test('Scorcher and Hot-Shot names do not accidentally classify as flamethrowers',()=>{
  for(const primary of ['PLAS-1 Scorcher','R/40-K Hot-Shot Marksman Rifle','Fire Cannon custom','__proto__']){
    const run=base();run.loadout.primary=primary;assert.equal(generator.analyze(run).scores.fire,0);
  }
});
test('reliable IDs and aliases share names; stratagem display order does not change identity',()=>{
  const run=fullFire(),a=generator.generate(run);
  run.loadout.primary='primary:flam-66-torcher';run.loadout.stratagems.reverse();assert.equal(generator.generate(run).name,a.name);
  const item=catalog.items.find(i=>i.id==='stratagem:hot-dog');assert.ok(item.aliases.length);
  run.loadout.stratagems[0]=item.name;const b=generator.generate(run);run.loadout.stratagems[0]=item.aliases[0];assert.equal(generator.generate(run).name,b.name);
});
test('unknown metadata and activities cannot invent theme or environment',()=>{
  const run={faction:'constructor',planet:{name:'Firestorm Jet Brigade',biome:'Unknown',weatherText:'None',activity:'Hive Lord'},loadout:{primary:'Custom Fire Laser',stratagems:['Fake Gas Turret']},missionSelection:{id:'custom:evacuate-high-value-assets'}};
  const a=generator.analyze(run);assert.equal(a.theme,'mixed');assert.deepEqual(a.environments,[]);assert.equal(a.missionTheme,null);assert.doesNotThrow(()=>generator.generate(run));
  assert.deepEqual(a.contexts,lex.general);
});
test('context banks follow recorded faction, biome and curated mission only',()=>{
  const a=generator.analyze(fullFire());assert.ok(a.contexts.includes('Ironfront'));assert.ok(a.contexts.includes('Ashfall'));assert.ok(a.contexts.includes('Silo'));assert.ok(!a.contexts.includes('Chitin'));
  const run=base();run.faction='Terminids';run.planet.biome='Tundra';run.planet.weatherText='Blizzards';run.missionSelection.id='mission:blitz-terminids';
  const b=generator.analyze(run);assert.deepEqual(b.environments,['cold']);assert.equal(b.missionTheme,'blitz');assert.ok(!b.contexts.includes('Ashfall'));assert.ok(!b.contexts.includes('Ironfront'));
});
test('duplicate stratagems and extra invalid slots cannot inflate the theme score',()=>{
  const run=base();run.loadout.stratagems=Array(20).fill('FLAM-40 Flamethrower');assert.equal(generator.analyze(run).scores.fire,12.5);
});
test('mixed elemental loadouts retain their second theme when comparably strong',()=>{
  const run=fullFire();run.loadout.primary='ARC-12 Blitzer';run.loadout.stratagems=['ARC-3 Arc Thrower','Tesla Tower','Orbital Napalm Barrage','Flame Sentry'];
  const a=generator.analyze(run);assert.equal(a.theme,'arc');assert.equal(a.secondary,'fire');assert.ok(a.contexts.some(w=>lex.themes.fire[names.tier(a.scores.fire)].includes(w)));
});
test('names are deterministic, do not consume RNG, and never modify run or historical cards',()=>{
  const run=fullFire(),saved=[{seed:'Seed: Frontline Gamble',stats:{kills:99}}],before=JSON.stringify([run,saved]);
  assert.equal(generator.generate(run,saved).name,generator.generate(copy(run),copy(saved)).name);assert.equal(JSON.stringify([run,saved]),before);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');assert.match(html,/runNameGenerator\.generate\(state.current, state.cards\)/);
  assert.ok(!fs.readFileSync(path.join(__dirname,'../assets/run-names.js'),'utf8').includes('Math.random('));
});
test('collisions including imported legacy prefixes/case choose another fitting phrase, not #2',()=>{
  const run=fullFire(),first=generator.generate(run),existing=[{seed:' seed: SEED: '+first.name.toUpperCase()+' '}],next=generator.generate(run,existing);
  assert.notEqual(next.name,first.name);assert.ok(!/[0-9#]/.test(next.name));assert.ok(lex.themes.fire[3].includes(next.name.split(' ')[0]));
});
test('2,000 representative runs have unique short names and stable JSON replay',()=>{
  const used=new Set();let maximum=0;
  for(let i=0;i<2000;i++){
    const run=i%3===0?fullFire():base();run.planet.name='Test world '+i;run.difficulty=i%10+1;
    const result=generator.generate(run,used);assert.ok(!used.has(result.name));assert.equal(result.name.split(' ').length,3);assert.ok(result.name.length<=62);used.add(result.name);maximum=Math.max(maximum,result.name.length);
  }
  assert.equal(used.size,2000);assert.ok(maximum>20);
});
test('all stored names from one fitting bank can be traversed without retries or reused words',()=>{
  const run=fullFire(),a=generator.analyze(run),occupied=[];
  for(const x of a.prefixes)for(const y of a.contexts)for(const z of a.endings)occupied.push(`${x} ${y} ${z}`);
  const last=occupied.pop(),candidate=generator.generate(run,occupied);
  assert.equal(candidate.name,last);
  occupied.push(last);const exhausted=generator.generate(run,occupied);assert.match(exhausted.name,/ 2$/);
  occupied.push(exhausted.name);assert.match(generator.generate(run,occupied).name,/ 3$/);
});
