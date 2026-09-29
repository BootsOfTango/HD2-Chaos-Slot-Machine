const test = require('node:test');
const assert = require('node:assert/strict');
const { pool, setEnabled } = require('../assets/war-planet-pool');
const { eligiblePlanets } = require('../assets/planet-selection');
const snapshot = { source: 'live', fetchedAt: '2026-09-17T01:00:00Z', planets: [{ id: 1, name: 'One', faction: 'Terminids', active: true, enabled: true, hazards: ['Storms'] }, { id: 2, name: 'Two', faction: 'Illuminate', active: true, enabled: true }] };
test('legacy name opt-outs apply to live IDs without modifying input', () => {
  const prefs = [{ name: 'ONE', enabled: false }], before = JSON.stringify(prefs);
  assert.deepEqual(eligiblePlanets(pool(snapshot, prefs)).map(p => p.id), [2]); assert.equal(JSON.stringify(prefs), before);
});
test('stable ID follows rename and overrides stale legacy preference', () => {
  const prefs = [{ id: 1, name: 'Old name', enabled: false }, { name: 'One', enabled: true }];
  assert.equal(pool(snapshot, prefs)[0].enabled, false);
});
test('different stable identity with same name cannot disable another planet', () => {
  assert.equal(pool(snapshot, [{ id: 99, name: 'One', enabled: false }])[0].enabled, true);
});
test('duplicate disabled preference wins and explicit toggle updates all matching entries', () => {
  const prefs = [{ name: 'One', enabled: true }, { name: 'One', enabled: false }];
  assert.equal(pool(snapshot, prefs)[0].enabled, false);
  setEnabled(prefs, snapshot.planets[0], true);
  assert(prefs.every(p => p.id === '1' && p.enabled)); assert.equal(pool(snapshot, prefs)[0].enabled, true);
});
test('new live planets can be disabled and preference survives JSON export/import', () => {
  const prefs = []; setEnabled(prefs, snapshot.planets[1], false);
  require('../assets/transfer-validation').validateData({ items: { planets: prefs } });
  assert.equal(pool(snapshot, JSON.parse(JSON.stringify(prefs)))[1].enabled, false);
});
test('no bundled fallback when every live planet is disabled or campaigns are inactive', () => {
  const prefs = snapshot.planets.map(p => ({ ...p, enabled: false }));
  assert.deepEqual(eligiblePlanets(pool(snapshot, prefs)), []);
  assert.deepEqual(eligiblePlanets(pool({ ...snapshot, planets: snapshot.planets.map(p => ({ ...p, active: false })) })), []);
});
test('bundled mode retains offline custom entries; live mode excludes them', () => {
  const prefs = [{ name: 'Custom', faction: 'Automatons', enabled: true }];
  assert.equal(pool({ ...snapshot, source: 'bundled' }, prefs)[0].name, 'Custom');
  assert.equal(pool(snapshot, prefs).length, 2);
});
test('rows are independent; API hazards win over stale local weather and source is explicit', () => {
  const rows = pool(snapshot, [{ name: 'One', weather: 'Old weather' }]);
  assert.equal(rows[0].weather, 'Storms'); assert.equal(rows[0].source, 'live');
  rows[0].hazards.push('New'); assert.equal(snapshot.planets[0].hazards.length, 1);
});
