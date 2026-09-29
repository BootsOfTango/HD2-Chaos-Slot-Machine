const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const catalog = require('../scripts/catalog-history-fixture').projectBeforeHyenaRevenants(require('../assets/item-catalog.json'));
const review = require('../assets/catalog-reviews/2026-09-15-support-weapon.json');
const baseline = require('./fixtures/support-weapon-baseline.json');
const { projectBeforeSupportWeapon } = require('../scripts/catalog-history-fixture');
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

test('16 support-weapon acquisitions distinguish starter equipment from requisition purchases', () => {
  assert.equal(ids.size, 16); assert.deepEqual(review.warbonds, []);
  for (const correction of review.items) {
    const actual = catalog.items.find(i => i.id === correction.id);
    assert.equal(actual.type, 'stratagem'); assert.equal(actual.subgroup, 'support');
    assert.equal(actual.name, correction.previousName);
    const starter = actual.id === 'stratagem:mg-43-machine-gun';
    assert.equal(actual.warbond, starter ? 'Base game' : 'Requisition unlocks');
    assert.deepEqual(actual.acquisition, correction.acquisition);
    assert.equal(actual.acquisition.kind, starter ? 'base-game' : 'requisition');
    assert.equal(actual.acquisition.verification, 'community-source');
    assert.equal(actual.acquisition.reviewScope, 'acquisition');
    assert.equal(actual.acquisition.verifiedAt, '2026-09-15');
    assert(actual.acquisition.sourceUrl.startsWith('https://helldivers.wiki.gg/wiki/'));
    assert.equal(baseline.reviewedRows.find(i => i.id === actual.id).acquisition.kind, 'unverified');
  }
  assert.deepEqual(createIndex(catalog.items).summary(), { total: 205, primary: 109, community: 96, pending: 0 });
});

test('verified independent backpack/vehicle baseline protects identities, artwork, defaults and 189 unrelated records', () => {
  assert.equal(baseline.asarSha256, '6a432f306c663da45511c964e8df03004b2aa6c42325487adb2788ae9af54587');
  assert.equal(baseline.version, '1.1.14');
  assert.equal(hash(projectBeforeSupportWeapon(catalog)), baseline.hashes.catalog);
  assert.equal(hash(catalog.items.filter(i => !ids.has(i.id))), baseline.hashes.untouched);
  assert.equal(hash(catalog.warbonds), baseline.hashes.priorWarbonds);
  assert.equal(hash(protectedFacts(catalog)), baseline.hashes.protected);
  assert.deepEqual(applyReview(projectBeforeSupportWeapon(catalog), review), catalog);
  assert.deepEqual(applyReview(catalog, review), catalog);
});

test('projection cannot hide ID, name, category, alias, art, eligibility or unrelated fact regressions', () => {
  for (const field of ['id', 'name', 'type', 'subgroup', 'aliases', 'assetPath', 'defaultEnabled']) {
    const changed = structuredClone(catalog);
    changed.items.find(i => ids.has(i.id))[field] = field === 'defaultEnabled' ? false : field === 'aliases' ? ['Unexpected'] : 'Unexpected';
    assert.notEqual(hash(protectedFacts(changed)), baseline.hashes.protected);
    if (field === 'id') assert.throws(() => projectBeforeSupportWeapon(changed), /Retain prior stable ID/);
    else assert.notEqual(hash(projectBeforeSupportWeapon(changed)), baseline.hashes.catalog);
  }
  const changed = structuredClone(catalog);
  changed.items.find(i => !ids.has(i.id)).acquisition.label = 'Unexpected';
  assert.notEqual(hash(projectBeforeSupportWeapon(changed)), baseline.hashes.catalog);
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
  const previous = projectBeforeSupportWeapon(catalog);
  previous.items.forEach((i, n) => { i.owned = n % 3 !== 0; i.enabled = n % 3 === 2; i.note = { keep: i.id }; });
  previous.cards = [{ id: 'history', stratagems: ['MG-43 Machine Gun', 'MLS-4X Commando'], scoreRaw: 314, statsLocked: true, fingerprint: 'unchanged' }];
  const before = JSON.stringify(previous), after = applyReview(previous, review);
  assert.equal(JSON.stringify(previous), before); assert.deepEqual(after.cards, previous.cards);
  after.items.forEach((i, n) => { for (const key of ['owned', 'enabled', 'note']) assert.deepEqual(i[key], previous.items[n][key]); });
  const empty = mergeItems(defaults, { stratagems: [] });
  assert(empty.stratagems.every(i => !i.owned && !i.enabled));
});

test('starter and historical Major Order weapons retain acquisition distinctions and explicit exclusions', () => {
  const byId = id => catalog.items.find(i => i.id === 'stratagem:' + id);
  assert.equal(byId('mg-43-machine-gun').acquisition.kind, 'base-game');
  for (const id of ['m-105-stalwart', 'apw-1-anti-materiel-rifle', 'mls-4x-commando', 'rl-77-airburst-rocket-launcher', 'las-99-quasar-cannon']) assert.equal(byId(id).acquisition.kind, 'requisition');
  for (const id of ['eagle-gas-airstrike', 'm-103-supply-frv']) {
    assert.equal(byId(id).acquisition.kind, 'campaign-reward');
    assert.equal(byId(id).defaultEnabled, false);
  }
  const disabled = mergeItems(defaults, { stratagems: [{ name: 'MG-43 Machine Gun', owned: false, enabled: false }] });
  assert.equal(disabled.stratagems.find(i => i.id === 'stratagem:mg-43-machine-gun').owned, false);
  for (const correction of review.items) assert.deepEqual(Object.keys(correction).sort(), ['id', 'previousName', 'warbond', 'source', 'acquisition'].sort());
});

test('dated support-weapon category resolves each of 33 entries once without extra roll weights', () => {
  const category = require('./fixtures/support-weapon-category.json');
  assert.equal(category.titles.length, 33);
  const matched = category.titles.map(title => {
    const rows = catalog.items.filter(i => i.name === title || i.aliases.includes(title));
    assert.equal(rows.length, 1, title);
    assert.equal(rows[0].type, 'stratagem');
    // The Wiki list overlaps backpack equipment; retain the audited app role.
    assert.equal(rows[0].subgroup, rows[0].id === 'stratagem:c4-pack' ? 'backpack' : 'support');
    assert(createIndex(catalog.items).describe(rows[0]).reviewed);
    return rows[0].id;
  });
  assert.equal(new Set(matched).size, 33);
  assert.equal(matched.filter(id => ids.has(id)).length, 16);
  assert.equal(catalog.items.length, 205);
});
