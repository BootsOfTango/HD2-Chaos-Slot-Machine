'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../assets/mission-selection');
const state = require('../assets/mission-state');
const catalog = require('../assets/mission-catalog.json');
const engine = api.createEngine(catalog);
const context = (faction, difficulty, campaign = 'liberation') => ({
  planetKey: 'id:7', faction, difficulty, campaign, active: true, enabled: true
});
const additions = [
  [
    "eliminate-brood-commanders",
    "Terminids",
    1,
    2
  ],
  [
    "eliminate-chargers",
    "Terminids",
    3,
    3
  ],
  [
    "eliminate-bile-titans",
    "Terminids",
    4,
    5
  ],
  [
    "eliminate-impaler",
    "Terminids",
    5,
    5
  ],
  [
    "eliminate-devastators",
    "Automatons",
    1,
    2
  ],
  [
    "eliminate-automaton-hulks",
    "Automatons",
    3,
    3
  ],
  [
    "eliminate-factory-strider",
    "Automatons",
    4,
    6
  ],
  [
    "destroy-harvesters",
    "Illuminate",
    3,
    3
  ],
  [
    "destroy-transmission-network",
    "Automatons",
    2,
    3
  ],
  [
    "purge-hatcheries",
    "Terminids",
    2,
    10
  ]
];
for (const [id, front, minimum, maximum] of additions) {
  test(id + ': all fronts, difficulty boundaries and campaign contexts share random/manual eligibility', () => {
    for (const faction of api.FACTIONS) for (let difficulty = 1; difficulty <= 10; difficulty++)
      for (const campaign of ['liberation', 'defense', 'event', 'unknown']) {
        const c = context(faction, difficulty, campaign), pool = engine.getPool(c);
        const selected = engine.select(c, 'mission:' + id);
        const eligible = faction === front && difficulty >= minimum && difficulty <= maximum;
        assert.equal(!!selected, eligible, [faction, difficulty, campaign].join(':'));
        const index = pool.missions.findIndex(m => m.id === 'mission:' + id);
        assert.equal(index >= 0, eligible);
        if (eligible) {
          assert.equal(selected.minutes, 40);
          assert.equal(selected.scoringFamily, 'Normal (40)');
          assert.deepEqual(engine.roll(c, {random: () => (index + .5) / pool.missions.length}), selected);
          assert.equal(selected.provenance, 'suggested');
        }
        assert.equal(pool.exactLiveAvailability, false);
      }
  });
}
test('faction batch has unique identities, leaves all previous rows unchanged, and does not guess regional eligibility', () => {
  const previous = require('./fixtures/mission-catalog-2026-09-18.json');
  assert.deepEqual(catalog.missions.slice(0, previous.missions.length), previous.missions);
  for (const source of previous.sources) assert.deepEqual(catalog.sources.find(s => s.id === source.id), source);
  const batch = catalog.missions.slice(0,32);
  assert.equal(batch.length, 32);
  assert.equal(new Set(batch.map(m => m.id)).size, 32);
  assert.equal(batch.filter(m => m.suggestionEnabled).length, 26);
  assert.equal(batch.filter(m => !m.suggestionEnabled).length, 6);
  for (const id of ['mission:blitz-illuminate-ships', 'mission:blitz-illuminate-gateways',
    'mission:rapid-acquisition', 'mission:chart-terminid-tunnels', 'mission:conduct-geological-survey',
    'mission:defend-evacuation-site']) assert.equal(catalog.missions.find(m => m.id === id).suggestionEnabled, false);
});
test('September 18 operation requires review; old Results and confirmed observations remain recoverable', () => {
  const c = context('Automatons', 3);
  const previousCatalog = {...catalog, revision:'review-2026-09-18-a', missions:catalog.missions.slice(0,22)};
  const previous = api.createEngine(previousCatalog);
  const confirmation = previous.confirm(c, [{kind:'catalog', id:'mission:launch-icbm'}]);
  const selection = state.capture(previous.select(c, 'mission:launch-icbm'), c, previousCatalog.revision);
  const before = JSON.stringify({confirmation,selection});
  assert.equal(engine.getPool(c, confirmation).status, 'needs-confirmation');
  assert.equal(engine.roll(c, {confirmation}), null);
  state.validateSelection(selection);
  assert.equal(JSON.stringify({confirmation,selection}), before);
  assert.equal(engine.getPool(c, engine.confirm(c, confirmation.missions)).status, 'confirmed');
});
test('player can confirm an observed out-of-range target without changing suggestions globally', () => {
  const c = context('Terminids', 10), id = 'mission:eliminate-chargers';
  assert.equal(engine.select(c, id), null);
  const confirmation = engine.confirm(c, [{kind:'catalog',id}]);
  const selected = engine.select(c, id, {confirmation});
  assert.equal(selected.provenance, 'player-confirmed');
  assert.deepEqual(selected.ruleConflicts, ['difficulty']);
  assert.equal(engine.select(c, id), null);
  assert.equal(engine.getPool({...c,planetKey:'id:8'},confirmation).status, 'needs-confirmation');
});
