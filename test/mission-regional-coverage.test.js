'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const api = require('../assets/mission-selection'), state = require('../assets/mission-state');
const catalog = require('../assets/mission-catalog.json');
const previousCatalog = require('./fixtures/mission-catalog-2026-09-19-c.json');
const engine = api.createEngine(catalog);
const context = (faction, difficulty, campaign = 'liberation') => ({
  planetKey: 'id:7', faction, difficulty, campaign, active: true, enabled: true
});
const additions = [["mobile-e711-extraction","Terminids",1,40,false],["extract-e711","Terminids",1,40,false],["restart-pumps","Terminids",1,40,false],["seize-industrial-complex","Automatons",1,40,true],["annex-mineral-sites","Automatons",1,40,false],["halt-cyborg-production","Automatons",4,40,false],["blitz-bio-processors","Automatons",5,12,false],["sabotage-orgo-plasma","Automatons",1,40,true]];
for (const [id, front, min, minutes, suggested] of additions) {
  test(id + ': suggestions and observed operation use one eligibility path', () => {
    for (const faction of api.FACTIONS) for (let difficulty = 1; difficulty <= 10; difficulty++) {
      for (const campaign of api.CAMPAIGNS || ['liberation','defense','event','unknown']) {
        const c = context(faction, difficulty, campaign), key = 'mission:' + id;
        const pool = engine.getPool(c), selected = engine.select(c, key);
        const eligible = suggested && faction === front && difficulty >= min;
        assert.equal(!!selected, eligible, [faction,difficulty,campaign].join(':'));
        assert.equal(pool.missions.some(m => m.id === key), eligible);
        assert.equal(pool.exactLiveAvailability, false);
        if (selected) {
          const index = pool.missions.findIndex(m => m.id === key);
          assert.deepEqual(engine.roll(c, {random: () => (index + .5) / pool.missions.length}), selected);
        }
        if (faction !== front) continue;
        const confirmation = engine.confirm(c, [{kind:'catalog', id:key}]);
        const observed = engine.select(c, key, {confirmation});
        assert.equal(observed.minutes, minutes);
        assert.equal(observed.scoringFamily, minutes === 12 ? 'Blitz (12)' : 'Normal (40)');
        assert.equal(observed.provenance, 'player-confirmed');
        assert.equal(observed.ruleConflicts.includes('confirmation-required'), !suggested);
        assert.equal(observed.ruleConflicts.includes('difficulty'), difficulty < min);
        assert.deepEqual(engine.roll(c, {confirmation, random:() => 0}), observed);
        for (const change of [{planetKey:'id:8'}, {difficulty:difficulty === 10 ? 9 : difficulty + 1}, {eventKeys:['new-event']}]) {
          assert.equal(engine.getPool({...c,...change}, confirmation).status, 'needs-confirmation');
        }
      }
    }
  });
}
test('regional names, biomes, dispatch prose and invented flags never unlock held missions', () => {
  for (const [id, faction,,, suggested] of additions) {
    if (suggested) continue;
    const c = {...context(faction,7), planetName:'Omicron Cyberstan', biome:'Hive World Megafactory Magma',
      majorOrder:'Extract E-711 and halt Cyborg production', verifiedEventRules:['hive-world','megafactory','magma']};
    assert.equal(engine.select(c,'mission:' + id),null);
    const confirmation = engine.confirm(c,[{kind:'catalog',id:'mission:' + id}]);
    assert.ok(engine.select(c,'mission:' + id,{confirmation}));
    assert.equal(engine.select(c,'mission:' + id),null, 'confirmation does not mutate global eligibility');
  }
});
test('previous46 records and provenance stay exact; aliases and subobjectives do not duplicate rolls', () => {
  assert.deepEqual(catalog.missions.slice(0,46),previousCatalog.missions);
  for (const source of previousCatalog.sources) assert.deepEqual(catalog.sources.find(s=>s.id===source.id),source);
  assert.equal(catalog.missions.slice(0,54).length,54);
  assert.equal(new Set(catalog.missions.slice(0,54).map(m=>m.id)).size,54);
  assert.equal(catalog.missions.slice(0,54).filter(m=>m.suggestionEnabled).length,32);
  assert.equal(catalog.missions.slice(0,54).filter(m=>!m.suggestionEnabled).length,22);
  assert.ok(!catalog.missions.some(m=>/mission:(extract-mysterious-substance|mobile-substance-extraction|enemy-bio-processors|annex-quarry|destroy-spore-lung|eradicate-illuminate)$/.test(m.id)));
});
test('catalog upgrade requires operation review but preserves historical snapshot bytes', () => {
  const c = context('Automatons',7), previous = api.createEngine(previousCatalog);
  const confirmation = previous.confirm(c,[{kind:'catalog',id:'mission:launch-icbm'}]);
  const selection = state.capture(previous.select(c,'mission:launch-icbm'),c,previousCatalog.revision);
  const before = JSON.stringify({confirmation,selection});
  assert.equal(engine.getPool(c,confirmation).status,'needs-confirmation');
  assert.equal(engine.roll(c,{confirmation}),null);
  state.validateSelection(selection);
  assert.equal(JSON.stringify({confirmation,selection}),before);
});
