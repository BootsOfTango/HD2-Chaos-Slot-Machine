const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../assets/item-catalog.json');
const review = require('../assets/catalog-reviews/2026-09-14-identity-merges.json');
const images = require('../assets/item-images.json');
const { applyIdentityMerges } = require('../scripts/apply_identity_merges');

test('exactly two reviewed duplicates are retired, with canonical names/IDs and original art retained', () => {
  assert.equal(catalog.items.length, 205); assert.equal(review.merges.length, 2);
  for (const merge of review.merges) {
    const canonical = catalog.items.find(item => item.id === merge.canonicalId);
    assert.ok(canonical.legacyIds.includes(merge.retiredItem.id));
    assert.ok(canonical.aliases.includes(merge.retiredItem.name));
    assert.equal(catalog.items.some(item => item.id === merge.retiredItem.id), false);
    assert.equal(images.stratagem.some(item => item.id === merge.retiredItem.id), false);
    assert.equal(images.stratagem.find(item => item.id === canonical.id).assetPath, canonical.assetPath);
    assert.ok(fs.existsSync(path.join(__dirname, '..', merge.retiredItem.assetPath)), 'Old artwork retained, not deleted');
  }
  assert.ok(catalog.items.find(item => item.id === 'stratagem:ems-mortar-sentry'));
});

test('identity review is idempotent, refuses changed snapshots and never mutates its inputs', () => {
  const before = JSON.stringify({ catalog, review });
  assert.deepEqual(applyIdentityMerges(catalog, review), catalog);
  const previous = structuredClone(catalog);
  previous.items.push(...structuredClone(review.merges.map(merge => merge.retiredItem)));
  const original = JSON.stringify(previous);
  assert.deepEqual(applyIdentityMerges(previous, review), catalog);
  assert.equal(JSON.stringify(previous), original);
  previous.items.at(-1).name = 'Unexpected revised identity';
  assert.throws(() => applyIdentityMerges(previous, review), /changed since review/);
  assert.equal(JSON.stringify({ catalog, review }), before);
});

test('identity review rejects self merges, repeated retirements, missing targets and cross-slot merges', () => {
  for (const change of [
    { ...review.merges[0], canonicalId: review.merges[0].retiredItem.id },
    { ...review.merges[0], canonicalId: 'stratagem:missing' },
    { ...review.merges[0], canonicalId: 'primary:ar-23-liberator' }
  ]) assert.throws(() => applyIdentityMerges(catalog, { ...review, merges: [change] }));
  assert.throws(() => applyIdentityMerges(catalog, { ...review, merges: [review.merges[0], review.merges[0]] }));
});
