const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { projectBeforeSupportWeapon } = require('../scripts/catalog-history-fixture');
const catalog = projectBeforeSupportWeapon(require('../assets/item-catalog.json'));
const review = require('../assets/catalog-reviews/2026-09-15-backpack-vehicle.json');
const baseline = require('./fixtures/backpack-vehicle-baseline.json');
const { projectBeforeBackpackVehicle } = require('../scripts/catalog-history-fixture');
const { applyReview } = require('../scripts/apply_catalog_review');
const { mergeItems } = require('../assets/catalog-state');
const { createIndex } = require('../assets/catalog-sources');
const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x === 'object'
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
const hash = x => createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const protectedFacts = source => { const c = structuredClone(source); const reward = c.items.find(i => i.id === 'stratagem:m-103-supply-frv'); delete reward.defaultEnabled; c.items.find(i => i.id === 'stratagem:m-102-fast-recon-vehicle').aliases = structuredClone(baseline.reviewedRows.find(i => i.id === 'stratagem:m-102-fast-recon-vehicle').aliases); return c.items.map(i => Object.fromEntries(['id', 'name', 'type', 'subgroup', 'aliases', 'defaultEnabled', 'assetPath', 'legacyIds', 'introducedIn'].filter(k => Object.hasOwn(i, k)).map(k => [k, i[k]]))); };
const ids = new Set(review.items.map(i => i.id));
const keys = { primary: 'primaries', sidearm: 'sidearms', throwable: 'throwables', stratagem: 'stratagems', booster: 'boosters' };
const defaults = Object.fromEntries(Object.entries(keys).map(([type, key]) => [key, catalog.items.filter(i => i.type === type).map(i => ({ ...structuredClone(i), owned: i.defaultEnabled !== false, enabled: i.defaultEnabled !== false }))]));

test('11 backpack/vehicle acquisitions distinguish ten requisition purchases from the Supply FRV reward', () => {
  assert.equal(ids.size, 11); assert.deepEqual(review.warbonds, []);
  assert.deepEqual(review.freshInstallExclusions, ['stratagem:m-103-supply-frv']);
  for (const correction of review.items) {
    const actual = catalog.items.find(i => i.id === correction.id);
    const reward = actual.id === 'stratagem:m-103-supply-frv';
    assert.equal(actual.type, 'stratagem'); assert.equal(actual.subgroup, 'support');
    assert.equal(actual.name, correction.previousName);
    assert.equal(actual.warbond, reward ? 'Campaign rewards' : 'Requisition unlocks');
    assert.deepEqual(actual.acquisition, correction.acquisition);
    assert.equal(actual.acquisition.kind, reward ? 'campaign-reward' : 'requisition');
    assert.equal(actual.acquisition.verification, reward ? 'primary-source' : 'community-source');
    assert.equal(actual.acquisition.verifiedAt, '2026-09-15');
    assert.equal(baseline.reviewedRows.find(i => i.id === actual.id).acquisition.kind, 'unverified');
  }
  assert.deepEqual(createIndex(catalog.items).summary(), { total: 205, primary: 109, community: 80, pending: 16 });
  const reward = catalog.items.find(i => i.id === 'stratagem:m-103-supply-frv');
  assert.equal(reward.defaultEnabled, false);
  assert.equal(reward.acquisition.startsAt, '2026-06-16T00:00:00Z');
  assert.equal(reward.acquisition.endsAt, '2026-06-29T15:00:00Z');
  assert.match(reward.acquisition.notes, /not an automatic date-based unlock/);
  const gunner = catalog.items.find(i => i.id === 'stratagem:m-102-fast-recon-vehicle');
  assert.deepEqual(gunner.aliases, [...baseline.reviewedRows.find(i => i.id === gunner.id).aliases, 'M-102 Gunner FRV']);
});

test('verified defensive baseline protects 194 unrelated items and every fact outside two explicit compatibility changes', () => {
  assert.equal(baseline.asarSha256, '0306f0b021ad46e88f0b741b35cc35dca54ca794a7c3449d6abac79f71528784');
  assert.equal(baseline.version, '1.1.14');
  assert.equal(hash(projectBeforeBackpackVehicle(catalog)), baseline.hashes.catalog);
  assert.equal(hash(catalog.items.filter(i => !ids.has(i.id))), baseline.hashes.untouched);
  assert.equal(hash(catalog.warbonds), baseline.hashes.priorWarbonds);
  assert.equal(hash(protectedFacts(catalog)), baseline.hashes.protected);
  assert.deepEqual(applyReview(projectBeforeBackpackVehicle(catalog), review), catalog);
  assert.deepEqual(applyReview(catalog, review), catalog);
});

test('projection cannot hide ID, name, category, alias, art, eligibility or unrelated fact regressions', () => {
  for (const field of ['id', 'name', 'type', 'subgroup', 'aliases', 'assetPath', 'defaultEnabled']) {
    const changed = structuredClone(catalog);
    changed.items.find(i => ids.has(i.id))[field] = field === 'defaultEnabled' ? false : field === 'aliases' ? ['Unexpected'] : 'Unexpected';
    assert.notEqual(hash(protectedFacts(changed)), baseline.hashes.protected);
    if (field === 'id') assert.throws(() => projectBeforeBackpackVehicle(changed), /Retain prior stable ID/);
    else assert.notEqual(hash(projectBeforeBackpackVehicle(changed)), baseline.hashes.catalog);
  }
  const changed = structuredClone(catalog);
  changed.items.find(i => !ids.has(i.id)).acquisition.label = 'Unexpected';
  assert.notEqual(hash(projectBeforeBackpackVehicle(changed)), baseline.hashes.catalog);
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
  const previous = projectBeforeBackpackVehicle(catalog);
  previous.items.forEach((i, n) => { i.owned = n % 3 !== 0; i.enabled = n % 3 === 2; i.note = { keep: i.id }; });
  previous.cards = [{ id: 'history', stratagems: ['M-103 Supply FRV', 'M-102 Fast Recon Vehicle'], scoreRaw: 314, statsLocked: true, fingerprint: 'unchanged' }];
  const before = JSON.stringify(previous), after = applyReview(previous, review);
  assert.equal(JSON.stringify(previous), before); assert.deepEqual(after.cards, previous.cards);
  after.items.forEach((i, n) => { for (const key of ['owned', 'enabled', 'note']) assert.deepEqual(i[key], previous.items[n][key]); });
  const empty = mergeItems(defaults, { stratagems: [] });
  assert(empty.stratagems.every(i => !i.owned && !i.enabled));
});

test('fresh, missing-item, explicit exclusion and opted-in reward saves preserve distinct eligibility semantics', () => {
  const id = 'stratagem:m-103-supply-frv';
  for (const saved of [{}, { stratagems: [] }, { stratagems: [{ name: 'Unknown custom gear', enabled: true }] }]) {
    const reward = mergeItems(defaults, saved).stratagems.find(i => i.id === id);
    assert.equal(reward.owned, false); assert.equal(reward.enabled, false);
  }
  for (const choice of [{ enabled: true }, { enabled: false }, { owned: true, enabled: false }, { owned: true, enabled: true }, { owned: false, enabled: false }]) {
    const saved = { stratagems: [{ name: 'supply frv', ...choice }] };
    const reward = mergeItems(defaults, saved).stratagems.find(i => i.id === id);
    assert.equal(reward.owned, choice.owned ?? choice.enabled); assert.equal(reward.enabled, choice.enabled);
  }
  for (const item of catalog.items.filter(i => i.id !== id)) {
    const previous = projectBeforeBackpackVehicle(catalog).items.find(i => i.id === item.id);
    assert.equal(item.defaultEnabled, previous.defaultEnabled);
  }
});

test('fresh exclusion API cannot invent items, enable defaults, edit ownership or hide an unreviewed item', () => {
  const source = projectBeforeBackpackVehicle(catalog), before = JSON.stringify(source);
  for (const list of [true, ['missing'], ['stratagem:supply-pack'], ['stratagem:eagle-gas-airstrike'], ['stratagem:m-103-supply-frv', 'stratagem:m-103-supply-frv']]) {
    assert.throws(() => applyReview(source, { ...review, freshInstallExclusions: list }), /Fresh exclusions/);
  }
  assert.throws(() => applyReview(source, { ...review, items: [{ ...review.items[0], defaultEnabled: true }] }), /Review cannot change/);
  assert.equal(JSON.stringify(source), before);
  const merged = mergeItems(defaults, { stratagems: [{ name: 'M-102 Gunner FRV', owned: true, enabled: false }] });
  assert.equal(merged.stratagems.filter(i => i.id === 'stratagem:m-102-fast-recon-vehicle').length, 1);
  assert.equal(merged.stratagems.find(i => i.id === 'stratagem:m-102-fast-recon-vehicle').enabled, false);
});
