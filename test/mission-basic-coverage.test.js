'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../assets/mission-selection');
const state = require('../assets/mission-state');
const catalog = require('../assets/mission-catalog.json');
const engine = api.createEngine(catalog);
const context = (faction, difficulty) => ({ planetKey: 'id:7', faction, difficulty, campaign: 'liberation', active: true, enabled: true });
const additions = [
  ['upload-escape-pod-data', api.FACTIONS, 1, 2],
  ['start-fuel-pumps', ['Terminids', 'Automatons'], 1, 2],
  ['terminate-illegal-broadcast', api.FACTIONS, 1, 2],
  ['spread-democracy', ['Terminids', 'Automatons'], 1, 10],
  ['activate-oil-pumps', ['Terminids'], 2, 3],
  ['enable-oil-extraction', ['Terminids'], 4, 10],
  ['destroy-command-bunkers', ['Automatons'], 5, 10]
];
for (const [id, factions, minimum, maximum] of additions) {
  test(id + ': every faction and difficulty obeys the reviewed main-mission boundary', () => {
    for (const faction of api.FACTIONS) for (let difficulty = 1; difficulty <= 10; difficulty++) {
      const c = context(faction, difficulty), entry = engine.select(c, 'mission:' + id);
      assert.equal(!!entry, factions.includes(faction) && difficulty >= minimum && difficulty <= maximum, faction + ':' + difficulty);
      if (entry) { assert.equal(entry.minutes, 40); assert.equal(entry.scoringFamily, 'Normal (40)'); }
    }
  });
}
test('all low-level fronts now have suggestions; optional objectives never become higher-level whole missions', () => {
  for (const faction of api.FACTIONS) for (const difficulty of [1, 2]) {
    const c = context(faction, difficulty), pool = engine.getPool(c);
    assert.equal(pool.status, 'suggested'); assert.ok(pool.missions.length);
    for (let i = 0; i < pool.missions.length; i++) {
      const entry = engine.roll(c, { random: () => (i + 0.5) / pool.missions.length });
      assert.deepEqual(entry, engine.select(c, entry.id));
    }
  }
  assert.equal(engine.select(context('Terminids', 7), 'mission:activate-oil-pumps'), null);
  assert.equal(engine.select(context('Automatons', 7), 'mission:upload-escape-pod-data'), null);
  assert.equal(engine.select(context('Illuminate', 7), 'mission:terminate-illegal-broadcast'), null);
});
test('conflicting geological survey references require confirmation at every difficulty and front', () => {
  for (const faction of api.FACTIONS) for (let difficulty = 1; difficulty <= 10; difficulty++) {
    const c = context(faction, difficulty), id = 'mission:conduct-geological-survey';
    assert.equal(engine.select(c, id), null);
    const confirmation = engine.confirm(c, [{ kind: 'catalog', id }]);
    const entry = engine.select(c, id, { confirmation });
    assert.deepEqual(entry.ruleConflicts, ['confirmation-required']);
    assert.equal(entry.provenance, 'player-confirmed');
  }
});
test('new catalog never silently adopts an older shortlist or rewrites a historical Result', () => {
  const c = context('Automatons', 7);
  const oldCatalog = { ...catalog, revision: 'review-2026-09-16-a', missions: catalog.missions.slice(0, 14) };
  const previous = api.createEngine(oldCatalog);
  const confirmation = previous.confirm(c, [{ kind: 'catalog', id: 'mission:launch-icbm' }]);
  const selection = state.capture(previous.select(c, 'mission:launch-icbm'), c, oldCatalog.revision);
  const before = JSON.stringify({ confirmation, selection });
  assert.equal(engine.getPool(c, confirmation).status, 'needs-confirmation');
  assert.equal(engine.roll(c, { confirmation }), null);
  state.validateSelection(selection);
  assert.equal(JSON.stringify({ confirmation, selection }), before);
  assert.equal(engine.getPool(c, engine.confirm(c, confirmation.missions)).status, 'confirmed');
});
