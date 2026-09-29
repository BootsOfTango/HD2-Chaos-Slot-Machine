const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { projectBeforeDefensive } = require('../scripts/catalog-history-fixture');
const catalog = projectBeforeDefensive(require('../assets/item-catalog.json'));
const review = require('../assets/catalog-reviews/2026-09-15-orbital-eagle.json');
const baseline = require('./fixtures/orbital-eagle-baseline.json');
const { projectBeforeOrbitalEagle } = require('../scripts/catalog-history-fixture');
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

test('18 orbital/Eagle acquisitions distinguish 17 requisition purchases from one starter', () => {
  assert.equal(ids.size, 18); assert.deepEqual(review.warbonds, []);
  assert.equal(review.items.filter(i => i.acquisition.kind === 'requisition').length, 17);
  assert.deepEqual(review.items.filter(i => i.acquisition.kind === 'base-game').map(i => i.id), ['stratagem:orbital-precision-strike']);
  for (const correction of review.items) {
    const actual = catalog.items.find(i => i.id === correction.id);
    assert.equal(actual.type, 'stratagem');
    assert.equal(actual.name, correction.previousName);
    assert.equal(actual.warbond, correction.warbond);
    assert.deepEqual(actual.acquisition, correction.acquisition);
    assert.equal(actual.acquisition.verification, 'community-source');
    assert.equal(actual.acquisition.reviewScope, 'acquisition');
    assert.equal(actual.acquisition.verifiedAt, '2026-09-15');
    assert.match(actual.acquisition.sourceUrl, /^https:\/\/helldivers\.wiki\.gg\/wiki\/(Orbital_|Eagle_)/);
    assert.equal(baseline.reviewedRows.find(i => i.id === actual.id).acquisition.kind, 'unverified');
  }
  assert.deepEqual(createIndex(catalog.items).summary(), { total: 205, primary: 108, community: 56, pending: 41 });
});

test('verified independent 1.1.13 baseline protects all identities, artwork, defaults and 187 unrelated records', () => {
  assert.equal(baseline.asarSha256, 'd1ce0c8e2237e7c5e3ed4c726737c631f8f5aa547e6f478d3f909dc205af3f23');
  assert.equal(baseline.version, '1.1.13');
  assert.equal(hash(projectBeforeOrbitalEagle(catalog)), baseline.hashes.catalog);
  assert.equal(hash(catalog.items.filter(i => !ids.has(i.id))), baseline.hashes.untouched);
  assert.equal(hash(catalog.warbonds), baseline.hashes.priorWarbonds);
  assert.equal(hash(protectedFacts(catalog)), baseline.hashes.protected);
  assert.deepEqual(applyReview(projectBeforeOrbitalEagle(catalog), review), catalog);
  assert.deepEqual(applyReview(catalog, review), catalog);
});

test('projection cannot hide ID, name, category, alias, art, eligibility or unrelated fact regressions', () => {
  for (const field of ['id', 'name', 'type', 'subgroup', 'aliases', 'assetPath', 'defaultEnabled']) {
    const changed = structuredClone(catalog);
    changed.items.find(i => ids.has(i.id))[field] = field === 'defaultEnabled' ? false : field === 'aliases' ? ['Unexpected'] : 'Unexpected';
    assert.notEqual(hash(protectedFacts(changed)), baseline.hashes.protected);
    if (field === 'id') assert.throws(() => projectBeforeOrbitalEagle(changed), /Retain prior stable ID/);
    else assert.notEqual(hash(projectBeforeOrbitalEagle(changed)), baseline.hashes.catalog);
  }
  const changed = structuredClone(catalog);
  changed.items.find(i => !ids.has(i.id)).acquisition.label = 'Unexpected';
  assert.notEqual(hash(projectBeforeOrbitalEagle(changed)), baseline.hashes.catalog);
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

test('source corrections never grant gear or alter saved Results, even for starter equipment', () => {
  const previous = projectBeforeOrbitalEagle(catalog);
  previous.items.forEach((i, n) => { i.owned = n % 3 !== 0; i.enabled = n % 3 === 2; i.note = { keep: i.id }; });
  previous.cards = [{ id: 'history', stratagems: ['Orbital Precision Strike', 'Eagle Airstrike'], scoreRaw: 314, statsLocked: true, fingerprint: 'unchanged' }];
  const before = JSON.stringify(previous), after = applyReview(previous, review);
  assert.equal(JSON.stringify(previous), before); assert.deepEqual(after.cards, previous.cards);
  after.items.forEach((i, n) => { for (const key of ['owned', 'enabled', 'note']) assert.deepEqual(i[key], previous.items[n][key]); });
  const empty = mergeItems(defaults, { stratagems: [] });
  assert(empty.stratagems.every(i => !i.owned && !i.enabled));
});

test('bounded category audit keeps EMS and campaign gas distinct and excludes Eagle Rearm', () => {
  const byId = id => catalog.items.find(i => i.id === 'stratagem:' + id);
  assert.equal(byId('orbital-ems-strike').acquisition.kind, 'requisition');
  assert.equal(byId('orbital-gas-strike').acquisition.kind, 'requisition');
  assert.equal(byId('eagle-gas-airstrike').acquisition.kind, 'campaign-reward');
  assert.equal(byId('eagle-gas-airstrike').defaultEnabled, false);
  assert(!ids.has('stratagem:orbital-ems-strike')); assert(!ids.has('stratagem:eagle-gas-airstrike'));
  assert.equal(catalog.items.filter(i => i.subgroup === 'orbital').length, 12);
  assert.equal(catalog.items.filter(i => i.subgroup === 'eagle').length, 8);
  assert(!catalog.items.some(i => /eagle rearm/i.test(i.name)));
  assert(catalog.items.filter(i => ['orbital', 'eagle'].includes(i.subgroup)).every(i => createIndex(catalog.items).describe(i).reviewed));
  for (const correction of review.items) assert.deepEqual(Object.keys(correction).sort(), ['id', 'previousName', 'warbond', 'source', 'acquisition'].sort());
});
