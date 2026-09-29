const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { PNG } = require('pngjs');
const { projectBeforeOrbitalEagle } = require('../scripts/catalog-history-fixture');
const catalog = projectBeforeOrbitalEagle(require('../assets/item-catalog.json'));
const review = require('../assets/catalog-reviews/2026-09-15-warbonds-8.json');
const baseline = require('./fixtures/warbond-review-8-baseline.json');
const { applyReview } = require('../scripts/apply_catalog_review');
const { projectBeforeBatch8 } = require('../scripts/catalog-history-fixture');
const { mergeItems } = require('../assets/catalog-state');
const { createIndex } = require('../assets/catalog-sources');
const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x === 'object'
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
const hash = x => createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const protectedFacts = source => source.items.map(i => Object.fromEntries(['id', 'name', 'type', 'defaultEnabled', 'assetPath', 'legacyIds', 'introducedIn'].filter(k => Object.hasOwn(i, k)).map(k => [k, i[k]])));
const keys = { primary: 'primaries', sidearm: 'sidearms', throwable: 'throwables', stratagem: 'stratagems', booster: 'boosters' };
const defaults = (source = catalog) => Object.fromEntries(Object.entries(keys).map(([type, key]) => [key,
  source.items.filter(i => i.type === type).map(i => ({ ...structuredClone(i), owned: i.defaultEnabled !== false, enabled: i.defaultEnabled !== false }))]));
const expected = [
  'primary:sg-8-punisher', 'throwable:g-6-frag',
  'primary:r-63-diligence', 'sidearm:p-19-redeemer',
  'booster:hellpod-space-optimization', 'primary:smg-37-defender',
  'booster:vitality-enhancement', 'primary:sg-225-breaker',
  'primary:las-5-scythe', 'throwable:g-16-impact',
  'booster:uav-recon-booster', 'primary:ar-23p-liberator-penetrator',
  'booster:stamina-enhancement', 'primary:r-63cs-diligence-counter-sniper',
  'primary:sg-8s-slugger', 'throwable:g-3-smoke',
  'booster:muscle-enhancement', 'primary:sg-225sp-breaker-spray-and-pray',
  'booster:increased-reinforcement-budget', 'primary:plas-1-scorcher'
];
const reviewedIds = new Set(expected);

test('Mobilize exact 10/1/3/6 set is community-reviewed, without inventing primary procurement evidence', () => {
  assert.equal(review.items.length, 20); assert.equal(review.warbonds.length, 1);
  assert.deepEqual(review.items.map(i => i.id).sort(), expected.slice().sort());
  for (const correction of review.items) {
    const item = catalog.items.find(i => i.id === correction.id);
    assert.equal(baseline.reviewedRows.find(i => i.id === item.id).acquisition.kind, 'unverified');
    assert.deepEqual(item.acquisition, correction.acquisition);
    assert.equal(item.acquisition.verification, 'community-source');
    assert.equal(item.acquisition.reviewScope, 'acquisition');
    assert.equal(item.acquisition.verifiedAt, '2026-09-15');
    assert.equal(item.acquisition.id, 'warbond:helldivers-mobilize');
    assert.equal(item.name, correction.previousName);
    assert.match(item.acquisition.notes, /not automatic equipment unlocks/);
  }
  assert.deepEqual(createIndex(catalog.items).summary(), { total: 205, primary: 108, community: 38, pending: 59 });
});

test('standard Warbond membership excludes starter equipment, stratagems, cosmetics and shop purchases', () => {
  const bond = review.warbonds[0];
  assert.equal(catalog.warbonds.length, 23);
  assert.deepEqual(catalog.warbonds.find(b => b.id === bond.id), bond);
  assert.equal(bond.edition, 'Standard Warbond'); assert.equal(bond.releasedAt, '2024-02-08');
  assert.deepEqual(bond.equipmentIds.slice().sort(), expected.slice().sort());
  assert.deepEqual(catalog.items.filter(i => i.warbond === bond.name).map(i => i.id).sort(), expected.slice().sort());
  const counts = {};
  for (const id of bond.equipmentIds) { const type = catalog.items.find(i => i.id === id).type; counts[type] = (counts[type] || 0) + 1; }
  assert.deepEqual(counts, { primary: 10, sidearm: 1, throwable: 3, booster: 6 });
  for (const id of ['primary:ar-23-liberator', 'sidearm:p-2-peacemaker', 'throwable:g-12-high-explosive']) {
    const item = catalog.items.find(i => i.id === id);
    assert.equal(item.acquisition.kind, 'base-game'); assert.equal(item.acquisition.label, 'Starter equipment');
    assert.equal(item.warbond, 'Base game'); assert(!bond.equipmentIds.includes(id));
  }
  assert.match(bond.notes, /equipment requires Medals/);
  assert(!catalog.items.some(i => i.warbond === 'Helldiver Basics (Mobilize)'));
});

test('independent v1.1.12 digests preserve 185 untouched items, 22 prior groups and every protected fact', () => {
  const previous = projectBeforeBatch8(catalog);
  assert.equal(baseline.version, '1.1.12');
  assert.equal(baseline.asarSha256, '9793592d0ff8848c711eca1c4889c508164f40f6f1d321743c34c8fa8bca669b');
  assert.equal(hash(previous), baseline.hashes.catalog);
  assert.equal(hash(catalog.items.filter(i => !reviewedIds.has(i.id))), baseline.hashes.untouched);
  assert.equal(hash(catalog.warbonds.filter(b => b.id !== review.warbonds[0].id)), baseline.hashes.priorWarbonds);
  assert.equal(hash(protectedFacts(catalog)), baseline.hashes.protected);
  assert.deepEqual(applyReview(previous, review), catalog); assert.deepEqual(applyReview(catalog, review), catalog);
});

test('historical projection cannot mask removed IDs, changed defaults/art or unrelated acquisition edits', () => {
  for (const field of ['id', 'name', 'type', 'assetPath', 'defaultEnabled']) {
    const changed = structuredClone(catalog);
    changed.items.find(i => reviewedIds.has(i.id))[field] = field === 'defaultEnabled' ? false : 'Unexpected';
    assert.notEqual(hash(protectedFacts(changed)), baseline.hashes.protected);
    if (field === 'id') assert.throws(() => projectBeforeBatch8(changed), /Retain prior stable ID/);
  }
  const changed = structuredClone(catalog);
  changed.items.find(i => !reviewedIds.has(i.id)).acquisition.label = 'Wrong';
  assert.notEqual(hash(projectBeforeBatch8(changed)), baseline.hashes.catalog);
});

test('name/ID/alias imports correct the old group without granting ownership or duplicating records', () => {
  const base = defaults();
  for (const id of expected) {
    const item = catalog.items.find(i => i.id === id), key = keys[item.type];
    for (const identity of [{ id }, { name: item.name }, { id, name: 'Legacy label' }, ...item.aliases.map(name => ({ name }))]) {
      for (const flags of [{ enabled: false }, { enabled: true }, { owned: false, enabled: false }, { owned: true, enabled: false }, { owned: true, enabled: true }]) {
        const input = { [key]: [{ ...identity, ...flags, warbond: 'Helldiver Basics (Mobilize)', source: 'Old', userData: { note: 'Keep me' } }] };
        const before = JSON.stringify(input), merged = mergeItems(base, input), actual = merged[key].find(i => i.id === id);
        assert.equal(actual.owned, flags.owned ?? flags.enabled); assert.equal(actual.enabled, flags.enabled);
        assert.equal(actual.warbond, 'Helldivers Mobilize!'); assert.deepEqual(actual.acquisition, item.acquisition);
        assert.deepEqual(actual.userData, input[key][0].userData);
        assert.equal(merged[key].length, base[key].length); assert.equal(merged[key].filter(i => i.id === id).length, 1);
        assert.deepEqual(mergeItems(base, merged), merged); assert.equal(JSON.stringify(input), before);
      }
    }
  }
});

test('fact-only batch preserves player metadata and historical Results without mutating the input', () => {
  const previous = projectBeforeBatch8(catalog);
  previous.items.forEach((i, n) => { i.owned = n % 3 !== 2; i.enabled = n % 3 === 0; i.privateNote = { id: i.id }; });
  previous.cards = [{ id: 'history', primary: 'AR-23P Liberator Penetrator', scoreRaw: 456, statsLocked: true, fingerprint: 'original' }];
  const before = JSON.stringify(previous), updated = applyReview(previous, review);
  assert.equal(JSON.stringify(previous), before); assert.deepEqual(updated.cards, previous.cards);
  updated.items.forEach((i, n) => { for (const key of ['owned', 'enabled', 'privateNote']) assert.deepEqual(i[key], previous.items[n][key]); });
});

test('fresh eligibility and old-save exclusions remain unchanged; no balance/name/subgroup/art edits', () => {
  const flags = source => Object.values(defaults(source)).flat().map(i => [i.id, i.owned, i.enabled]);
  assert.deepEqual(flags(catalog), flags(projectBeforeBatch8(catalog)));
  const empty = mergeItems(defaults(), Object.fromEntries(Object.values(keys).map(k => [k, []])));
  assert(Object.values(empty).flat().every(i => !i.owned && !i.enabled));
  for (const item of review.items) assert.deepEqual(Object.keys(item).sort(), ['id', 'previousName', 'warbond', 'source', 'acquisition'].sort());
});

test('unmodified offline cover has measured dimensions/hash, attribution and correct UI mapping', () => {
  const art = require('../assets/warbonds/provenance.json').assets.find(i => i.name === 'Helldivers Mobilize!');
  const bytes = fs.readFileSync(path.join(__dirname, '..', art.assetPath)), png = PNG.sync.read(bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), art.sha256);
  assert.deepEqual([png.width, png.height], [2048, 1024]);
  assert.equal(review.warbonds[0].coverAssetPath, art.assetPath); assert.equal(review.warbonds[0].coverKind, art.sourceKind);
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(html.includes(JSON.stringify(art.name) + ': ' + JSON.stringify(art.assetPath)));
  assert(html.includes('Free Warbond access; equipment still requires Medals in game.'));
  assert(html.includes('Dogo314 / Helldivers Wiki.gg'));
});

test('packaged screenshot harness checks the declared header image, not a promotional-only directory', () => {
  const runner = fs.readFileSync(path.join(__dirname, '..', 'scripts/run-packaged-smoke.js'), 'utf8');
  assert(runner.includes("group.querySelector('.warbondHeader img')"));
  assert(runner.includes("cover.getAttribute('src') !== WARBOND_ART["));
  assert(!runner.includes("img.src.includes('/warbonds/official/')"));
});
