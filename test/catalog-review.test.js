const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const catalog = require('../assets/item-catalog.json');
const review = require('../assets/catalog-reviews/2026-09-14.json');
const images = require('../assets/item-images.json');
const provenance = require('../assets/warbonds/official/provenance.json');
const { applyReview } = require('../scripts/apply_catalog_review');
const { createIndex } = require('../assets/catalog-sources');
const { mergeItems } = require('../assets/catalog-state');
const byId = new Map(catalog.items.map(item => [item.id, item]));
const groups = { primary: 'primaries', sidearm: 'sidearms', throwable: 'throwables', stratagem: 'stratagems', booster: 'boosters' };
const defaults = Object.fromEntries(Object.entries(groups).map(([type, key]) => [key, catalog.items.filter(item => item.type === type).map(item => ({ ...item, enabled: item.defaultEnabled !== false, owned: item.defaultEnabled !== false }))]));

test('bounded review matches 35 shipped facts without claiming the full catalog is audited', () => {
  assert.equal(catalog.items.length, 207);
  assert.equal(review.items.length, 35);
  assert.equal(new Set(review.items.map(item => item.id)).size, 35);
  for (const correction of review.items) {
    const item = byId.get(correction.id);
    for (const key of ['name', 'subgroup', 'warbond', 'source', 'acquisition']) {
      if (Object.hasOwn(correction, key)) assert.deepEqual(item[key], correction[key], correction.id + ':' + key);
    }
  }
  assert.deepEqual(createIndex(catalog.items).summary(), { total: 207, primary: 28, community: 12, pending: 167 });
  assert.deepEqual(applyReview(catalog, review), catalog);
});

test('all item image records retain stable catalog identity and local asset paths', () => {
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
    assert.equal(byId.get(id).acquisition.kind, 'requisition');
  }
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
