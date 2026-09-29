const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { rendererActivitySoak } = require('../scripts/activity-soak-phase');

function run(context, stage, expected) {
  return vm.runInNewContext(`(${rendererActivitySoak.toString()})(${JSON.stringify(stage)}, ${JSON.stringify(expected)})`, context);
}

test('activity soak refuses to call an empty run a confirmed-run fixture', async () => {
  await assert.rejects(run({ state: { cards: [], current: {} } }, 'start'), /saved fixture supplies/);
});

test('activity soak seeds populated equipment and clones the saved planet before timing', async () => {
  const card = { planet: { name: 'Test planet' }, faction: 'Automatons', difficulty: 7,
    mode: 'Normal (40)', missionSelection: { id: 'test-mission' } };
  const original = JSON.stringify(card);
  const state = { cards: [card], current: { loadout: null, locked: false } };
  const context = { state, rollLoadout: () => ({ primary: 'Test primary', stratagems: ['a', 'b', 'c', 'd'] }),
    fetch: async () => ({ json: async () => ({}) }),
    HD2GalaxyMap: { validateAtlas: () => { throw new Error('fixture setup complete'); } } };
  await assert.rejects(run(context, 'start'), /fixture setup complete/);
  assert.equal(state.current.locked, true);
  assert.equal(state.current.planetConfirmed, true);
  assert.equal(state.current.modeConfirmed, true);
  assert.equal(state.current.loadout.primary, 'Test primary');
  assert.equal(state.current.loadout.stratagems.length, 4);
  state.current.planet.name = 'changed only in current run';
  state.current.missionSelection.id = 'changed only in current run';
  assert.equal(JSON.stringify(card), original);
});

test('activity soak restart checks saved cards and reset unsaved state, not fictional roll persistence', async () => {
  let disposed = 0;
  const state = { cards: [{ id: 'preserved' }], current: { loadout: null, locked: false, planetConfirmed: false } };
  const context = { state, localStorage: {}, HD2ActivityService: { createService: () => ({
    getState: () => ({ source: 'cache', snapshot: { warTick: 12 }, stale: true }), dispose: () => { disposed++; }
  }) } };
  const expected = { tick: 12, cards: JSON.stringify(state.cards), current: 'previous nonempty locked session' };
  assert.equal((await run(context, 'restart', expected)).checks.length, 5);
  state.current.loadout = { primary: 'unexpected persisted roll' };
  await assert.rejects(run(context, 'restart', expected), /restart resets the unsaved roll/);
  assert.equal(disposed, 2);
});
