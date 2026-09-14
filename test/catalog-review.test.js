const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const catalog = require('../assets/item-catalog.json');
const review = require('../assets/catalog-reviews/2026-09-14.json');
const identityReview = require('../assets/catalog-reviews/2026-09-14-identity-merges.json');
const images = require('../assets/item-images.json');
const provenance = require('../assets/warbonds/official/provenance.json');
const { applyReview } = require('../scripts/apply_catalog_review');
const { applyIdentityMerges } = require('../scripts/apply_identity_merges');
const { createIndex } = require('../assets/catalog-sources');
const { mergeItems } = require('../assets/catalog-state');
const byId = new Map(catalog.items.map(item => [item.id, item]));
const byLegacyId = new Map(catalog.items.flatMap(item => (item.legacyIds || []).map(id => [id, item])));
const resolveId = id => byId.get(id) || byLegacyId.get(id);
const groups = { primary: 'primaries', sidearm: 'sidearms', throwable: 'throwables', stratagem: 'stratagems', booster: 'boosters' };
const defaults = Object.fromEntries(Object.entries(groups).map(([type, key]) => [key, catalog.items.filter(item => item.type === type).map(item => ({ ...item, enabled: item.defaultEnabled !== false, owned: item.defaultEnabled !== false }))]));

test('35 historical review facts resolve through 33 current identities without losing evidence', () => {
  assert.equal(catalog.items.length, 205);
  assert.equal(review.items.length, 35);
  assert.equal(new Set(review.items.map(item => item.id)).size, 35);
  for (const correction of review.items) {
    const item = resolveId(correction.id);
    assert.ok(item, correction.id);
    const merge = identityReview.merges.find(row => row.canonicalId === item.id);
    if (item.id !== correction.id) {
      assert.equal(merge.retiredItem.id, correction.id);
      assert.equal(merge.retiredItem.name, correction.previousName);
      assert.ok(item.legacyIds.includes(correction.id));
      assert.ok(item.aliases.includes(correction.previousName));
      assert.deepEqual(merge.retiredItem.acquisition, correction.acquisition);
    }
    for (const key of ['name', 'subgroup', 'warbond', 'source']) {
      if (Object.hasOwn(correction, key)) assert.deepEqual(item[key], correction[key], correction.id + ':' + key);
    }
    if (merge) {
      const { notes: oldNotes, ...oldFacts } = correction.acquisition;
      const { notes: newNotes, ...currentFacts } = item.acquisition;
      assert.deepEqual(currentFacts, oldFacts, correction.id + ':acquisition provenance retained');
      assert.equal(newNotes, merge.notes, correction.id + ':reviewed consolidation note');
      assert.match(oldNotes, /pending|awaiting/);
    } else assert.deepEqual(item.acquisition, correction.acquisition, correction.id + ':acquisition');
  }
  assert.equal(new Set(review.items.map(item => resolveId(item.id).id)).size, 33);
  assert.deepEqual(createIndex(catalog.items).summary(), { total: 205, primary: 27, community: 11, pending: 167 });
});

test('historical facts then explicit identity merges reproduce the catalog; stale review cannot resurrect retired rows', () => {
  assert.equal(identityReview.merges.length, 2);
  const historical = structuredClone(catalog);
  for (const merge of identityReview.merges) {
    const item = historical.items.find(row => row.id === merge.canonicalId);
    item.legacyIds = (item.legacyIds || []).filter(id => id !== merge.retiredItem.id);
    if (!item.legacyIds.length) delete item.legacyIds;
    item.aliases = item.aliases.filter(alias => ![merge.retiredItem.name, ...merge.aliases].includes(alias));
    historical.items.push(structuredClone(merge.retiredItem));
  }
  assert.equal(historical.items.length, 207);
  const original = JSON.stringify(historical);
  const factsReviewed = applyReview(historical, review);
  assert.deepEqual(applyIdentityMerges(factsReviewed, identityReview), catalog);
  assert.equal(JSON.stringify(historical), original);
  assert.deepEqual(applyIdentityMerges(catalog, identityReview), catalog);
  const shipped = JSON.stringify(catalog);
  assert.throws(() => applyReview(catalog, review), /cannot invent a catalog ID/);
  assert.equal(JSON.stringify(catalog), shipped);
});

test('all item image records retain stable catalog identity and local asset paths', () => {
  const imageIds = Object.keys(groups).flatMap(type => images[type].map(image => image.id));
  assert.equal(imageIds.length, 205);
  assert.deepEqual(imageIds.slice().sort(), catalog.items.map(item => item.id).sort());
  for (const item of catalog.items) {
    const image = images[item.type].find(row => row.id === item.id);
    assert.ok(image, item.id);
    assert.equal(image.name, item.name);
    assert.equal(image.assetPath, item.assetPath);
    if (item.type === 'stratagem') assert.equal(image.rimCategory, item.subgroup);
    if (image.artworkSha256) assert.notEqual(image.placeholder, true);
  }
});

test('three corrected CQC names migrate old name-only and ID saves without changing choices', () => {
  const renamed = review.items.filter(item => item.name && item.name !== item.previousName);
  assert.equal(renamed.length, 3);
  for (const correction of renamed) {
    const item = byId.get(correction.id);
    assert.ok(item.aliases.includes(correction.previousName));
    for (const withId of [true, false]) {
      for (const flags of [{ owned: true, enabled: false }, { owned: true, enabled: true }, { owned: false, enabled: false }]) {
        const saved = { name: correction.previousName, ...flags, note: 'recover me', ...(withId ? { id: correction.id } : {}) };
        const before = JSON.stringify(saved);
        const migrated = mergeItems(defaults, { sidearms: [saved] });
        const actual = migrated.sidearms.find(row => row.id === correction.id);
        assert.equal(actual.name, correction.name);
        assert.equal(actual.enabled, flags.enabled); assert.equal(actual.owned, flags.owned);
        assert.equal(actual.note, 'recover me'); assert.equal(JSON.stringify(saved), before);
        assert.deepEqual(mergeItems(defaults, migrated), migrated);
      }
    }
  }
});

test('corrected source facts never grant gear during a complete legacy import', () => {
  const saved = structuredClone(defaults);
  let index = 0;
  for (const rows of Object.values(saved)) for (const item of rows) {
    const correction = review.items.find(row => row.id === item.id);
    if (correction) item.name = correction.previousName;
    item.warbond = 'Old label';
    item.enabled = index % 3 === 0; item.owned = index % 3 !== 2; index++;
  }
  const merged = mergeItems(defaults, saved);
  for (const key of Object.values(groups)) for (const original of saved[key]) {
    const actual = merged[key].find(item => item.id === original.id);
    assert.equal(actual.enabled, original.enabled); assert.equal(actual.owned, original.owned);
    assert.equal(actual.warbond, byId.get(actual.id).warbond);
  }
});

test('reviewed Warbond equipment sets exclude separate purchases and gas/EMS mixups', () => {
  for (const bond of review.warbonds) {
    assert.deepEqual(catalog.items.filter(item => item.warbond === bond.name).map(item => item.id).sort(), [...bond.equipmentIds].sort());
  }
  assert.equal(byId.get('sidearm:cqc-19-machete').acquisition.kind, 'superstore');
  assert.equal(byId.get('sidearm:cqc-30-stun-baton').acquisition.kind, 'superstore');
  assert.equal(byId.get('sidearm:cqc-2-stun-lance').warbond, 'Urban Legends');
  for (const id of ['stratagem:wasp', 'stratagem:sta-x3-w-a-s-p-launcher', 'stratagem:ems-strike', 'stratagem:orbital-ems-strike']) {
    assert.equal(resolveId(id).acquisition.kind, 'requisition');
  }
  assert.equal(resolveId('stratagem:wasp'), byId.get('stratagem:sta-x3-w-a-s-p-launcher'));
  assert.equal(resolveId('stratagem:ems-strike'), byId.get('stratagem:orbital-ems-strike'));
  assert.notEqual(byId.get('stratagem:ems-mortar-sentry'), resolveId('stratagem:ems-strike'));
  assert.equal(catalog.items.filter(item => item.warbond === 'Righteous Revenants').length, 3);
});

test('three locally bundled promotional images match their attributed original bytes', () => {
  assert.equal(provenance.assets.length, 3);
  for (const source of provenance.assets) {
    const bond = review.warbonds.find(row => row.name === source.name);
    assert.equal(bond.coverAssetPath, source.assetPath);
    assert.equal(bond.coverKind, 'official-promotional-scene');
    assert.equal(bond.sourceUrl, source.sourcePage);
    const bytes = fs.readFileSync(path.join(__dirname, '..', source.assetPath));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256);
    assert.equal(bytes[0], 0xff); assert.equal(bytes[1], 0xd8);
  }
});
