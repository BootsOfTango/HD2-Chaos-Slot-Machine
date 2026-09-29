const test = require('node:test');
const assert = require('node:assert/strict');
const { createIndex } = require('../assets/catalog-sources');
const { applyReview } = require('../scripts/apply_catalog_review');
const fact = { id: 'primary:test', name: 'Test', type: 'primary', aliases: [], warbond: 'Test Bond', source: 'Test Bond', assetPath: 'original.png',
  acquisition: { kind: 'warbond', label: 'Test Bond', sourceUrl: 'https://blog.playstation.com/test/', verifiedAt: '2026-09-14', verification: 'primary-source' } };

test('source display uses bundled facts, not imported claims or ownership flags', () => {
  const index = createIndex([fact]);
  const info = index.describe({ ...fact, warbond: 'Superstore', owned: false, acquisition: { kind: 'superstore', sourceUrl: 'https://fake.invalid/' } });
  assert.equal(info.kind, 'warbond'); assert.equal(info.group, 'Test Bond'); assert.equal(info.reviewed, true);
  assert.equal(info.sourceUrl, fact.acquisition.sourceUrl);
});
test('unknown custom items cannot claim source verification but retain their chosen grouping', () => {
  const info = createIndex([fact]).describe({ ...fact, id: 'custom:primary:test', warbond: 'Test Bond' });
  assert.equal(info.kind, 'custom'); assert.equal(info.reviewed, false); assert.equal(info.group, 'Test Bond');
  assert.equal(info.sourceUrl, '');
});
test('source counts distinguish primary, community and pending review', () => {
  const community = { ...fact, id: 'primary:community', acquisition: { ...fact.acquisition, verification: 'community-source' } };
  const pending = { ...fact, id: 'primary:pending', acquisition: { kind: 'unverified' } };
  assert.deepEqual(createIndex([fact, community, pending]).summary(), { total: 3, primary: 1, community: 1, pending: 1 });
});
test('unusable source metadata does not produce a verified badge or unsafe link', () => {
  for (const acquisition of [{ ...fact.acquisition, sourceUrl: 'javascript:alert(1)' }, { ...fact.acquisition, verifiedAt: '' }, { ...fact.acquisition, verification: 'guess' }]) {
    const info = createIndex([{ ...fact, acquisition }]).describe(fact);
    assert.equal(info.reviewed, false); assert.equal(info.sourceUrl, '');
  }
});
test('fact-only review renames keep ID, aliases, artwork and opt-in policy and are idempotent', () => {
  const catalog = { items: [{ ...fact, defaultEnabled: false }], warbonds: [] };
  const before = structuredClone(catalog);
  const review = { items: [{ id: fact.id, previousName: 'Test', name: 'Corrected', warbond: 'Correct Bond', source: 'Correct Bond', acquisition: fact.acquisition }] };
  const updated = applyReview(catalog, review);
  assert.deepEqual(catalog, before); assert.equal(updated.items[0].id, fact.id);
  assert.equal(updated.items[0].defaultEnabled, false); assert.equal(updated.items[0].assetPath, 'original.png');
  assert.deepEqual(updated.items[0].aliases, ['Test']); assert.deepEqual(applyReview(updated, review), updated);
});
test('review refuses invented IDs, unexpected baseline names and player/artwork mutations', () => {
  const catalog = { items: [fact], warbonds: [] };
  for (const change of [{id:'missing',previousName:'Test'}, {id:fact.id,previousName:'Wrong'},
    {id:fact.id,previousName:'Test',owned:true}, {id:fact.id,previousName:'Test',assetPath:'replacement.png'},
    {id:fact.id,previousName:'Test',defaultEnabled:true}]) assert.throws(() => applyReview(catalog, {items:[change]}));
});
