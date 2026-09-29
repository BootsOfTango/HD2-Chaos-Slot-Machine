'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { audit } = require('../scripts/audit_catalog_completeness');
const catalog = require('../assets/item-catalog.json');
const images = require('../assets/item-images.json');
const inventory = require('./fixtures/catalog-inventory-2026-09-15.json');
const run = overrides => audit({ catalog, images, inventory, ...overrides });

test('dated completeness gate clears the content gaps but retains unresolved artwork findings', () => {
  const report = run();
  assert.equal(report.ready, false);
  assert.deepEqual(report.issues.filter(row => row.kind === 'missing-item'), []);
  assert.deepEqual(report.issues.filter(row => row.kind === 'warbond-record'), []);
  assert.equal(report.counts.matchedUniqueItems, 214);
  assert.equal(report.issues.filter(row => row.kind === 'unrecorded-artwork-hash').length, 89);
  assert.equal(report.counts.verifiedLocalHashes, 125);
  assert.equal(report.issues.length, 89);
  const old = run({catalog: require('../scripts/catalog-history-fixture').projectBeforeHyenaRevenants(catalog)});
  assert.ok(old.issues.some(row => row.kind === 'missing-item' && row.title === 'R-4 Hyena'));
  assert.ok(old.issues.some(row => row.kind === 'warbond-record' && row.title.startsWith('Righteous')));
});

test('announced content stays deferred even if the clock or snapshot date advances', () => {
  const changed = structuredClone(inventory);
  changed.asOf = '2026-10-01';
  const report = run({ inventory: changed, releaseReview:null });
  assert.equal(report.deferred.length, 7);
  assert.ok(report.ignored.some(row => row.title === 'M-104 Incinerator FRV'));
  const changedCatalog = structuredClone(catalog);
  changedCatalog.items[0].aliases.push('AR-11 Arbitrator');
  assert.ok(run({ catalog: changedCatalog, releaseReview:null }).issues.some(row => row.kind === 'unreleased-in-catalog'));
});

test('ambiguous aliases cannot masquerade as a complete inventory match', () => {
  const changed = structuredClone(catalog);
  changed.items[0].aliases.push('AR-23 Liberator');
  assert.ok(run({ catalog: changed }).issues.some(row => row.kind === 'ambiguous-item' && row.title === 'AR-23 Liberator'));
});

test('missing, empty and paginated category responses fail the research gate', () => {
  const changed = structuredClone(inventory);
  changed.categories.pop();
  changed.categories[0].titles = [];
  changed.categories[1].completeResponse = false;
  const report = run({ inventory: changed });
  assert.equal(report.issues.filter(row => row.kind === 'incomplete-inventory').length, 2);
  assert.ok(report.issues.some(row => row.kind === 'missing-inventory-category'));
});

test('hash mismatch is distinguished from an unrecorded hash and absent artwork', () => {
  const fs = require('node:fs'), path = require('node:path');
  const report = run({ readAsset: name => name === catalog.items[0].assetPath ? Buffer.from('wrong bytes') : fs.readFileSync(path.join(__dirname, '..', name)) });
  assert.ok(report.issues.some(row => row.kind === 'artwork-hash-mismatch' && row.id === catalog.items[0].id));
  assert.equal(report.issues.filter(row => row.kind === 'unrecorded-artwork-hash').length, 89);
  const absent = run({ readAsset: () => { throw new Error('missing fixture'); } });
  assert.equal(absent.issues.filter(row => row.kind === 'missing-asset').length, 214);
});

test('Warbond declared membership cannot silently drift from item ownership sources', () => {
  const changed = structuredClone(catalog);
  changed.warbonds[0].equipmentIds.pop();
  assert.ok(run({ catalog: changed }).issues.some(row => row.kind === 'warbond-membership'));
});

test('audit leaves catalog, image mappings and inventory unchanged', () => {
  const before = JSON.stringify({ catalog, images, inventory });
  run();
  assert.equal(JSON.stringify({ catalog, images, inventory }), before);
});
