const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { projectBeforeBackpackVehicle } = require('../scripts/catalog-history-fixture');
const catalog = projectBeforeBackpackVehicle(require('../assets/item-catalog.json'));
const review = require('../assets/catalog-reviews/2026-09-15-defensive.json');
const baseline = require('./fixtures/defensive-baseline.json');
const { projectBeforeDefensive } = require('../scripts/catalog-history-fixture');
const { applyReview } = require('../scripts/apply_catalog_review');
const { mergeItems } = require('../assets/catalog-state');
const { createIndex } = require('../assets/catalog-sources');
const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x === 'object'
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
const hash = x => createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const protectedFacts = c => c.items.map(i => Object.fromEntries(['id', 'name', 'type', 'subgroup', 'aliases', 'defaultEnabled', 'assetPath', 'legacyIds', 'introducedIn'].filter(k => Object.hasOwn(i, k)).map(k => [k, i[k]])));
const ids = new Set(review.items.map(i => i.id));
const keys = { primary: 'primaries', sidearm: 'sidearms', throwable: 'throwables', stratagem: 'stratagems', booster: 'boosters' };
const defaults = Object.fromEntries(Object.entries(keys).map(([type, key]) => [key, catalog.items.filter(i => i.type === type).map(i => ({ ...structuredClone(i), owned: i.defaultEnabled !== false, enabled: i.defaultEnabled !== false }))]));

test('14 defensive acquisitions are community-reviewed requisition purchases, not ownership grants', () => {
  assert.equal(ids.size, 14); assert.deepEqual(review.warbonds, []);
  for (const correction of review.items) {
    const actual = catalog.items.find(i => i.id === correction.id);
    assert.equal(actual.type, 'stratagem'); assert.equal(actual.subgroup, 'defensive');
    assert.equal(actual.name, correction.previousName);
    assert.equal(actual.warbond, 'Requisition unlocks');
    assert.deepEqual(actual.acquisition, correction.acquisition);
    assert.equal(actual.acquisition.kind, 'requisition');
    assert.equal(actual.acquisition.verification, 'community-source');
    assert.equal(actual.acquisition.reviewScope, 'acquisition');
    assert.equal(actual.acquisition.verifiedAt, '2026-09-15');
    assert(actual.acquisition.sourceUrl.startsWith('https://helldivers.wiki.gg/wiki/'));
    assert.equal(baseline.reviewedRows.find(i => i.id === actual.id).acquisition.kind, 'unverified');
  }
  assert.deepEqual(createIndex(catalog.items).summary(), { total: 205, primary: 108, community: 70, pending: 27 });
});

test('verified independent orbital/Eagle baseline protects all identities, artwork, defaults and 191 unrelated records', () => {
  assert.equal(baseline.asarSha256, '415805382c987c89188e6642330b8cd34ca861e798adcc58bf962766c3e253c9');
  assert.equal(baseline.version, '1.1.14');
  assert.equal(hash(projectBeforeDefensive(catalog)), baseline.hashes.catalog);
  assert.equal(hash(catalog.items.filter(i => !ids.has(i.id))), baseline.hashes.untouched);
  assert.equal(hash(catalog.warbonds), baseline.hashes.priorWarbonds);
  assert.equal(hash(protectedFacts(catalog)), baseline.hashes.protected);
  assert.deepEqual(applyReview(projectBeforeDefensive(catalog), review), catalog);
  assert.deepEqual(applyReview(catalog, review), catalog);
});

test('projection cannot hide ID, name, category, alias, art, eligibility or unrelated fact regressions', () => {
  for (const field of ['id', 'name', 'type', 'subgroup', 'aliases', 'assetPath', 'defaultEnabled']) {
    const changed = structuredClone(catalog);
    changed.items.find(i => ids.has(i.id))[field] = field === 'defaultEnabled' ? false : field === 'aliases' ? ['Unexpected'] : 'Unexpected';
    assert.notEqual(hash(protectedFacts(changed)), baseline.hashes.protected);
    if (field === 'id') assert.throws(() => projectBeforeDefensive(changed), /Retain prior stable ID/);
    else assert.notEqual(hash(projectBeforeDefensive(changed)), baseline.hashes.catalog);
  }
  const changed = structuredClone(catalog);
  changed.items.find(i => !ids.has(i.id)).acquisition.label = 'Unexpected';
  assert.notEqual(hash(projectBeforeDefensive(changed)), baseline.hashes.catalog);
});

test('old ID/name/alias imports preserve owned/enabled flags and private metadata without duplicates', () => {
  for (const correction of review.items) {
    const item = catalog.items.find(i => i.id === correction.id);
    for (const identity of [{ id: item.id }, { name: item.name }, { id: item.id, name: 'Old label' }, ...item.aliases.map(name => ({ name }))]) {
      for (const flags of [{ enabled: false }, { enabled: true }, { owned: false, enabled: false }, { owned: true, enabled: false }, { owned: true, enabled: true }]) {
        const input = { stratagems: [{ ...identity, ...flags, warbond: 'Unassigned / Custom', personalNote: { keep: item.id } }] };
        const before = JSON.stringify(input), merged = mergeItems(defaults, input);
        const actual = merged.stratagems.find(i => i.id === item.id);
        assert.equal(actual.owned, flags.owned ?? flags.enabled); assert.equal(actual.enabled, flags.enabled);
        assert.deepEqual(actual.acquisition, item.acquisition); assert.equal(actual.warbond, item.warbond);
        assert.deepEqual(actual.personalNote, input.stratagems[0].personalNote);
        assert.equal(merged.stratagems.length, defaults.stratagems.length);
        assert.deepEqual(mergeItems(defaults, merged), merged); assert.equal(JSON.stringify(input), before);
      }
    }
  }
});

test('source corrections never grant gear or alter saved Results, including Major Order-origin equipment', () => {
  const previous = projectBeforeDefensive(catalog);
  previous.items.forEach((i, n) => { i.owned = n % 3 !== 0; i.enabled = n % 3 === 2; i.note = { keep: i.id }; });
  previous.cards = [{ id: 'history', stratagems: ['Gas Mines', 'HMG Emplacement'], scoreRaw: 314, statsLocked: true, fingerprint: 'unchanged' }];
  const before = JSON.stringify(previous), after = applyReview(previous, review);
  assert.equal(JSON.stringify(previous), before); assert.deepEqual(after.cards, previous.cards);
  after.items.forEach((i, n) => { for (const key of ['owned', 'enabled', 'note']) assert.deepEqual(i[key], previous.items[n][key]); });
  const empty = mergeItems(defaults, { stratagems: [] });
  assert(empty.stratagems.every(i => !i.owned && !i.enabled));
});

test('defensive category keeps EMS mortar, orbital EMS and campaign/Warbond equipment distinct', () => {
  const byId = id => catalog.items.find(i => i.id === 'stratagem:' + id);
  assert.equal(byId('ems-mortar-sentry').acquisition.kind, 'requisition');
  assert.equal(byId('orbital-ems-strike').acquisition.kind, 'requisition');
  assert.notEqual(byId('ems-mortar-sentry').id, byId('orbital-ems-strike').id);
  for (const id of ['gas-mines', 'anti-tank-mines', 'grenadier-battlement']) assert.equal(byId(id).acquisition.kind, 'requisition');
  assert.equal(byId('eagle-gas-airstrike').acquisition.kind, 'campaign-reward');
  assert.equal(byId('eagle-gas-airstrike').defaultEnabled, false);
  const defensive = catalog.items.filter(i => i.subgroup === 'defensive');
  assert.equal(defensive.length, 18);
  assert(defensive.every(i => createIndex(catalog.items).describe(i).reviewed));
  assert.equal(defensive.filter(i => i.acquisition.kind === 'warbond').length, 4);
  assert(!catalog.items.some(i => /budget helldiver/i.test(i.name)));
  for (const correction of review.items) assert.deepEqual(Object.keys(correction).sort(), ['id', 'previousName', 'warbond', 'source', 'acquisition'].sort());
});
