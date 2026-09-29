'use strict';
// Cross-module acceptance: synthetic war fixtures, real normalization/selection/transfer.
// No network, GUI, personal profile, game availability claim or score recomputation.
const test = require('node:test');
const assert = require('node:assert/strict');
const war = require('../assets/war-snapshot');
const planets = require('../assets/planet-selection');
const preferences = require('../assets/war-planet-pool');
const missions = require('../assets/mission-selection');
const context = require('../assets/mission-context');
const state = require('../assets/mission-state');
const transfer = require('../assets/transfer-validation');
const storage = require('../electron/storage');
const catalog = require('../assets/mission-catalog.json');
const engine = missions.createEngine(catalog);
const NOW = Date.parse('2026-09-21T04:00:00Z');
const END = '2026-09-21T05:00:00Z';
const row = (id, faction, defense = false) => ({ id: 100 + id, type: 1, faction,
  planet: { index: id, name: 'Acceptance ' + id, currentOwner: defense ? 'Humans' : faction,
    disabled: false, position: { x: id / 10, y: -id / 10 },
    event: defense ? { id: 200 + id, campaignId: 100 + id, eventType: 1, faction,
      startTime: '2026-09-21T03:00:00Z', endTime: END } : null } });
const adapt = (snapshot, selectedPlanet, difficulty = 7, changes = {}) =>
  context.forPlanet(snapshot, { selectedPlanet, difficulty, now: NOW, ...changes });
const choose = id => ({ kind: 'catalog', id });

for (const mode of ['live', 'cached', 'stale', 'bundled']) {
  test(`acceptance: ${mode} planet→mission matrix, 3 factions ×10 difficulties ×2 campaign fixtures`, () => {
    let scenarios = 0;
    for (const defense of [false, true]) {
      const rows = missions.FACTIONS.map((f, i) => row(i + 1, f, defense));
      const fresh = war.normalizeCampaigns(rows, { now: NOW });
      const snapshot = mode === 'cached' ? war.readCache(fresh, { now: NOW }).snapshot :
        mode === 'bundled' ? war.bundledSnapshot(fresh.planets, 'acceptance-fixture') : fresh;
      const now = mode === 'stale' ? NOW + war.FRESH_MS + 1 : NOW;
      const before = JSON.stringify(snapshot), planetPool = preferences.pool(snapshot);
      const eligible = planets.eligiblePlanets(planetPool);
      assert.equal(eligible.length, 3);
      for (let i = 0; i < eligible.length; i++) {
        const manual = planets.selectPlanet(planetPool, planets.planetKey(eligible[i]));
        assert.deepEqual(planets.rollPlanet(planetPool, { random: () => (i + .5) / eligible.length }), manual);
        for (let difficulty = 1; difficulty <= 10; difficulty++) {
          scenarios++;
          const out = adapt(snapshot, manual, difficulty, { now, online: mode === 'live' });
          assert.equal(out.reason, null);
          assert.equal(out.context.faction, missions.FACTIONS[i]);
          assert.equal(out.context.campaign, mode === 'bundled' ? 'unknown' : defense ? 'defense' : 'liberation');
          assert.equal(out.warStatus.confirmedCurrentlyPlayable, mode === 'live');
          const pool = engine.getPool(out.context);
          const expected = catalog.missions.filter(m => m.suggestionEnabled && m.factions.includes(out.context.faction) &&
            difficulty >= m.minDifficulty && difficulty <= m.maxDifficulty &&
            (!m.campaigns || m.campaigns.includes(out.context.campaign)) && m.requiredEventRules.length === 0);
          assert.deepEqual(pool.missions.map(m => m.id), expected.map(m => m.id));
          assert.equal(pool.exactLiveAvailability, false);
          assert.equal(pool.catalogCoverage, 'partial');
          for (let j = 0; j < pool.missions.length; j++) {
            const selected = engine.select(out.context, pool.missions[j].id);
            assert.deepEqual(engine.roll(out.context, { random: () => (j + .5) / pool.missions.length }), selected);
            assert.equal(state.capture(selected, out.context, catalog.revision).scoringFamily, expected[j].scoringFamily);
            if (pool.missions.length > 1) assert.notEqual(engine.roll(out.context, { currentId: selected.id, random: () => 0 }).id, selected.id);
          }
          if (!pool.missions.length) assert.equal(engine.roll(out.context, { random: () => { throw Error('Empty pool must not draw'); } }), null);
        }
      }
      assert.equal(JSON.stringify(snapshot), before);
    }
    assert.equal(scenarios, 60);
  });
}

test('acceptance: every catalog identity survives confirmation, history and both transfer parsers', () => {
  for (const mission of catalog.missions) {
    const snapshot = war.normalizeCampaigns([row(1, mission.factions[0])], { now: NOW });
    const c = adapt(snapshot, { id: 1 }).context;
    const confirmation = engine.confirm(c, [choose(mission.id)]);
    const selected = engine.roll(c, { confirmation, random: () => 0 });
    assert.deepEqual(selected, engine.select(c, mission.id, { confirmation }));
    assert.equal(selected.provenance, 'player-confirmed');
    if (!mission.suggestionEnabled) assert.ok(selected.ruleConflicts.includes('confirmation-required'));
    const input = { items: {}, settings: { missionPlanner: { version: 1, confirmation } },
      cards: [{ id: mission.id, mode: mission.scoringFamily, score: 123.45,
        missionSelection: state.capture(selected, c, catalog.revision) }] };
    const before = JSON.stringify(input);
    for (const raw of [transfer.serialize(input), JSON.stringify(storage.wrapData(input))]) {
      assert.deepEqual(transfer.parse(raw), input);
      assert.deepEqual(storage.parseImport(raw), input);
    }
    for (const changed of [{ ...c, planetKey: 'id:2' }, { ...c, difficulty: 8 }, { ...c, eventKeys: ['changed'] }]) {
      assert.equal(engine.getPool(changed, confirmation).status, 'needs-confirmation');
      assert.equal(engine.roll(changed, { confirmation }), null);
    }
    assert.equal(JSON.stringify(input), before, 'History and its recorded score cannot be rewritten by current eligibility');
  }
});

test('acceptance: unchanged refresh and offline transition preserve an observed list but not live claims', () => {
  const raw = [row(1, 'Automatons', true)];
  const first = war.normalizeCampaigns(raw, { now: NOW });
  const c = adapt(first, { id: 1 }).context;
  const custom = { kind: 'custom', id: 'custom:local-observation', name: '<Observed event>', minutes: 25, scoringFamily: 'Normal (40)' };
  const confirmation = engine.confirm(c, [choose('mission:launch-icbm'), custom]);
  const saved = transfer.parse(transfer.serialize({ settings: { missionPlanner: { version: 1, confirmation } } }));
  const expected = engine.getPool(c, confirmation).missions;
  for (const snapshot of [war.normalizeCampaigns(raw, { now: NOW + 1000 }), war.readCache(first, { now: NOW }).snapshot]) {
    const out = adapt(snapshot, { id: 1 }, 7, { now: NOW + 1000 });
    assert.equal(missions.scopeKey(out.context), missions.scopeKey(c));
    assert.deepEqual(engine.getPool(out.context, saved.settings.missionPlanner.confirmation).missions, expected);
    assert.equal(engine.getPool(out.context, confirmation).exactLiveAvailability, false);
    if (snapshot.source === 'cached') assert.equal(out.warStatus.confirmedCurrentlyPlayable, false);
  }
  const expired = adapt(first, { id: 1 }, 7, { now: Date.parse(END), online: false });
  assert.equal(engine.roll(expired.context, { confirmation }), null);
  assert.equal(expired.warStatus.confirmedCurrentlyPlayable, false);
  assert.deepEqual(saved.settings.missionPlanner.confirmation, confirmation);
});

test('acceptance: opt-outs and missing/conflicting/inactive planets cannot bypass mission eligibility', () => {
  const base = row(1, 'Automatons');
  const snapshots = [
    war.normalizeCampaigns([base], { now: NOW }),
    war.normalizeCampaigns([{ ...base, planet: { ...base.planet, disabled: true } }, row(2, 'Illuminate')], { now: NOW }),
    war.normalizeCampaigns([base, row(1, 'Terminids'), row(2, 'Illuminate')], { now: NOW }),
    war.normalizeCampaigns([row(2, 'Automatons')], { now: NOW })
  ];
  for (const [i, snapshot] of snapshots.entries()) {
    const editable = i === 0 ? [{ id: 1, name: base.planet.name, enabled: false }] : [];
    const pool = preferences.pool(snapshot, editable);
    assert.equal(planets.selectPlanet(pool, 'id:1'), null);
    const out = adapt(snapshot, { id: 1, faction: 'Automatons', active: true }, 7, { editable });
    assert.ok(out.reason);
    assert.equal(engine.getPool(out.context).status, 'needs-context');
    assert.equal(engine.roll(out.context), null);
  }
});

test('acceptance: empty saved list remains blocking across transfer; resetting is explicit', () => {
  const c = adapt(war.normalizeCampaigns([row(1, 'Automatons')], { now: NOW }), { id: 1 }).context;
  const confirmation = engine.confirm(c, []);
  const saved = transfer.parse(transfer.serialize({ settings: { missionPlanner: { version: 1, confirmation } } }));
  assert.equal(engine.getPool(c, saved.settings.missionPlanner.confirmation).status, 'empty-confirmed');
  assert.equal(engine.roll(c, { confirmation }), null);
  assert.ok(engine.getPool(c, state.defaults().confirmation).missions.length);
  assert.deepEqual(saved.settings.missionPlanner.confirmation, confirmation);
});
