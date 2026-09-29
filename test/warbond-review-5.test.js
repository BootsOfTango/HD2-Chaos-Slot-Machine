const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { projectBeforeBatch6 } = require('../scripts/catalog-history-fixture');
const catalog = projectBeforeBatch6(require('../assets/item-catalog.json'));
const review = require('../assets/catalog-reviews/2026-09-14-warbonds-5.json');
const baseline = require('./fixtures/warbond-review-5-baseline.json');
const provenance = require('../assets/warbonds/official/provenance.json');
const { applyReview } = require('../scripts/apply_catalog_review');
const { projectBeforeBatch5 } = require('../scripts/catalog-history-fixture');
const { mergeItems } = require('../assets/catalog-state');
const { createIndex } = require('../assets/catalog-sources');
const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x === 'object'
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
const hash = x => createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const reviewedIds = new Set(review.items.map(i => i.id));
const byId = new Map(catalog.items.map(i => [i.id, i]));
const keys = { primary: 'primaries', sidearm: 'sidearms', throwable: 'throwables', stratagem: 'stratagems', booster: 'boosters' };
const sets = {
  "Viper Commandos": [
    "primary:ar-23a-liberator-carbine",
    "sidearm:sg-22-bushwhacker",
    "throwable:k-2-throwing-knife",
    "booster:experimental-infusion"
  ],
  "Truth Enforcers": [
    "primary:smg-32-reprimand",
    "primary:sg-20-halt",
    "sidearm:plas-15-loyalist",
    "booster:dead-sprint"
  ],
  "Steeled Veterans": [
    "primary:ar-23c-liberator-concussive",
    "primary:sg-225ie-breaker-incendiary",
    "primary:jar-5-dominator",
    "sidearm:p-4-senator",
    "throwable:g-10-incendiary",
    "booster:flexible-reinforcement-budget"
  ]
};
const defaults = (source = catalog) => Object.fromEntries(Object.entries(keys).map(([type, key]) => [key,
  source.items.filter(i => i.type === type).map(i => ({ ...structuredClone(i), owned: i.defaultEnabled !== false, enabled: i.defaultEnabled !== false }))]));
const protectedFacts = source => source.items.map(i => Object.fromEntries(['id', 'name', 'type', 'defaultEnabled', 'assetPath', 'legacyIds', 'introducedIn'].filter(k => Object.hasOwn(i, k)).map(k => [k, i[k]])));

test('batch 5 reviews thirteen pending acquisitions, nine primary and four explicitly community', () => {
  assert.equal(review.items.length, 13); assert.equal(reviewedIds.size, 13);
  assert.deepEqual([...reviewedIds].sort(), Object.values(sets).flat().filter(id => id !== 'primary:jar-5-dominator').sort());
  assert.equal(review.items.filter(i => i.acquisition.verification === 'primary-source').length, 9);
  assert.equal(review.items.filter(i => i.acquisition.verification === 'community-source').length, 4);
  for (const correction of review.items) {
    const item = byId.get(correction.id), old = baseline.reviewedRows.find(i => i.id === item.id);
    assert.equal(old.acquisition.kind, 'unverified');
    assert.equal(item.name, correction.previousName); assert.deepEqual(item.acquisition, correction.acquisition);
    assert.equal(item.acquisition.reviewScope, 'acquisition'); assert.equal(item.acquisition.verifiedAt, '2026-09-14');
    const community = item.warbond === 'Steeled Veterans' && item.id !== 'primary:sg-225ie-breaker-incendiary';
    assert.equal(item.acquisition.verification, community ? 'community-source' : 'primary-source');
    if (community) {
      assert.equal(new URL(item.acquisition.sourceUrl).hostname, 'helldivers.wiki.gg');
      assert.match(item.acquisition.notes, /community-corroborated/i);
    } else assert.equal(item.acquisition.sourceUrl, review.warbonds.find(b => b.name === item.warbond).sourceUrl);
  }
  assert.deepEqual(createIndex(catalog.items).summary(), { total: 205, primary: 78, community: 17, pending: 110 });
});

test('batch 5 exact four/four/six sets exclude edition bonuses, base boosters, story stratagems and cosmetics', () => {
  assert.equal(catalog.warbonds.length, 16); assert.equal(review.warbonds.length, 3);
  for (const bond of review.warbonds) {
    assert.deepEqual(bond.equipmentIds, sets[bond.name]);
    assert.deepEqual(catalog.warbonds.find(b => b.id === bond.id), bond);
    assert.deepEqual(catalog.items.filter(i => i.warbond === bond.name).map(i => i.id).sort(), sets[bond.name].slice().sort());
    assert(bond.equipmentIds.every(id => byId.get(id).acquisition.id === bond.id));
    assert(!bond.equipmentIds.some(id => id.startsWith('stratagem:')));
    for (const excluded of ['primary:mp-98-knight', 'booster:increased-reinforcement-budget', 'stratagem:orbital-laser']) assert(!bond.equipmentIds.includes(excluded));
  }
  assert(!reviewedIds.has('primary:jar-5-dominator'));
  assert.match(review.warbonds.find(b => b.name === 'Steeled Veterans').notes, /community-corroborated/);
});

test('independent v1.1.7 digests preserve all 192 untouched items, prior 13 groups, identities, defaults and art', () => {
  const previous = projectBeforeBatch5(catalog);
  assert.equal(baseline.version, '1.1.7');
  assert.equal(hash(previous), baseline.hashes.catalog);
  assert.equal(hash(catalog.items.filter(i => !reviewedIds.has(i.id))), baseline.hashes.untouched);
  assert.equal(hash(catalog.warbonds.filter(b => !Object.hasOwn(sets, b.name))), baseline.hashes.priorWarbonds);
  assert.equal(hash(protectedFacts(catalog)), baseline.hashes.protected);
  assert.deepEqual(createIndex(previous.items).summary(), { total: 205, primary: 69, community: 13, pending: 123 });
  assert.deepEqual(applyReview(previous, review), catalog);
  assert.deepEqual(applyReview(catalog, review), catalog);
});

test('baseline projection cannot mask protected facts and rejects removed stable IDs', () => {
  for (const field of ['id', 'name', 'type', 'assetPath', 'defaultEnabled']) {
    const changed = structuredClone(catalog);
    changed.items.find(i => reviewedIds.has(i.id))[field] = field === 'defaultEnabled' ? false : 'Unexpected change';
    assert.notEqual(hash(protectedFacts(changed)), baseline.hashes.protected);
    if (field === 'id') assert.throws(() => projectBeforeBatch5(changed), /Retain prior stable ID/);
  }
  const changed = structuredClone(catalog);
  changed.items.find(i => !reviewedIds.has(i.id)).acquisition.label = 'Unexpected source';
  assert.notEqual(hash(projectBeforeBatch5(changed)), baseline.hashes.catalog);
});

test('fact-only review preserves player choices, arbitrary metadata and historical Results without mutating input', () => {
  const previous = projectBeforeBatch5(catalog);
  previous.items.forEach((item, n) => {
    item.owned = n % 3 !== 2; item.enabled = n % 3 === 0;
    item.privateNote = { id: item.id }; item.legacyAliasRecords = [{ name: 'Recoverable', owned: false }];
  });
  previous.cards = [{ id: 'history', primary: 'AR-23E Liberator Explosive', scoreRaw: 456, statsLocked: true, fingerprint: 'original', stats: { kills: 50 } }];
  const before = JSON.stringify(previous), updated = applyReview(previous, review);
  assert.equal(JSON.stringify(previous), before); assert.deepEqual(updated.cards, previous.cards);
  for (const [n, item] of updated.items.entries()) for (const key of ['owned', 'enabled', 'privateNote', 'legacyAliasRecords']) assert.deepEqual(item[key], previous.items[n][key]);
});

test('name, ID and historical-alias imports retain ownership without duplicate items or invented grants', () => {
  const base = defaults();
  for (const correction of review.items) {
    const item = byId.get(correction.id), key = keys[item.type];
    const identities = [{ name: item.name }, { id: item.id }, { id: item.id, name: 'Old arbitrary label' }, ...item.aliases.map(name => ({ name }))];
    for (const identity of identities) for (const flags of [{ enabled: false }, { enabled: true }, { owned: false, enabled: false }, { owned: true, enabled: false }, { owned: true, enabled: true }]) {
      const input = { [key]: [{ ...identity, ...flags, acquisition: { kind: 'custom' }, source: 'Old source', subgroup: 'Old group', userData: { note: 'Keep' } }] };
      const before = JSON.stringify(input), merged = mergeItems(base, input), actual = merged[key].find(i => i.id === item.id);
      assert.equal(actual.enabled, flags.enabled); assert.equal(actual.owned, flags.owned ?? flags.enabled);
      assert.deepEqual(actual.userData, input[key][0].userData);
      for (const field of ['name', 'acquisition', 'source', 'subgroup', 'aliases']) assert.deepEqual(actual[field], item[field]);
      assert.equal(merged[key].length, base[key].length); assert.equal(merged[key].filter(i => i.id === item.id).length, 1);
      assert.deepEqual(mergeItems(base, merged), merged); assert.equal(JSON.stringify(input), before);
    }
  }
  assert.deepEqual(review.items.filter(i => i.aliases).map(i => [i.id, i.aliases]), [['primary:ar-23c-liberator-concussive', ['AR-23E Liberator Explosive']]]);
});

test('fresh defaults and missing old-save exclusions are unchanged; no subgroup or canonical name edits', () => {
  const flags = items => Object.values(items).flat().map(i => [i.id, i.owned, i.enabled]);
  assert.deepEqual(flags(defaults()), flags(defaults(projectBeforeBatch5(catalog))));
  const empty = mergeItems(defaults(), Object.fromEntries(Object.values(keys).map(key => [key, []])));
  assert(Object.values(empty).flat().every(i => !i.owned && !i.enabled)); assert.equal(Object.values(empty).flat().length, 205);
  assert.equal(review.items.filter(i => Object.hasOwn(i, 'name') || Object.hasOwn(i, 'subgroup')).length, 0);
});

function jpegSize(bytes) {
  assert.equal(bytes.readUInt16BE(0), 0xffd8);
  let p = 2;
  while (p < bytes.length) {
    assert.equal(bytes[p++], 0xff); while (bytes[p] === 0xff) p++;
    const marker = bytes[p++]; if (marker === 0xda || marker === 0xd9) break;
    if (marker === 1 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(p); assert(length >= 2 && p + length <= bytes.length);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) return [bytes.readUInt16BE(p + 5), bytes.readUInt16BE(p + 3)];
    p += length;
  }
  assert.fail('JPEG dimensions not found');
}

test('three original official images match measured dimensions, hashes, exact paths and displayed labels', () => {
  const assets = provenance.assets.filter(i => Object.hasOwn(sets, i.name));
  assert.equal(assets.length, 3);
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const image of assets) {
    const bond = review.warbonds.find(b => b.name === image.name);
    assert.equal(bond.coverAssetPath, image.assetPath); assert.equal(bond.coverKind, image.sourceKind);
    const bytes = fs.readFileSync(path.join(__dirname, '..', image.assetPath));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), image.sha256);
    assert.deepEqual(jpegSize(bytes), [image.width, image.height]);
    assert(image.width >= 2560 && image.height >= 1440);
    assert.match(bond.notes, /not an exact in-game cover/);
    assert.equal(image.sourcePage, bond.sourceUrl);
    assert(html.includes(JSON.stringify(bond.name) + ': ' + JSON.stringify(image.assetPath)));
  }
  assert.equal(assets.find(i => i.name === 'Steeled Veterans').imageUrl, 'https://clan.fastly.steamstatic.com/images/40425349/42dc2020478e59b6df41d208f14fdbcf6b757f33.jpg');
});
