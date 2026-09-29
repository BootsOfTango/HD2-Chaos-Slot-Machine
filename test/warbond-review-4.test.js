const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { projectBeforeBatch5 } = require('../scripts/catalog-history-fixture');
const catalog = projectBeforeBatch5(require('../assets/item-catalog.json'));
const review = require('../assets/catalog-reviews/2026-09-14-warbonds-4.json');
const baseline = require('./fixtures/warbond-review-4-baseline.json');
const provenance = require('../assets/warbonds/official/provenance.json');
const { applyReview } = require('../scripts/apply_catalog_review');
const { projectBeforeBatch4 } = require('../scripts/catalog-history-fixture');
const { mergeItems } = require('../assets/catalog-state');
const { createIndex } = require('../assets/catalog-sources');
const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x === 'object'
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
const hash = x => createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const reviewedIds = new Set(review.items.map(i => i.id));
const byId = new Map(catalog.items.map(i => [i.id, i]));
const keys = { primary: 'primaries', sidearm: 'sidearms', throwable: 'throwables', stratagem: 'stratagems', booster: 'boosters' };
const sets = {
  'Masters of Ceremony': ['primary:r-2-amendment', 'sidearm:cqc-1-saber', 'throwable:g-142-pyrotech', 'stratagem:one-true-flag', 'booster:sample-scanner'],
  'Force of Law': ['primary:ar-32-pacifier', 'throwable:g-109-urchin', 'stratagem:ax-arc-3-k-9', 'stratagem:de-escalator', 'booster:stun-pods'],
  'Dust Devils': ['primary:ar-2-coyote', 'throwable:g-7-pineapple', 'stratagem:speargun', 'stratagem:expendable-napalm', 'stratagem:solo-silo']
};
const pages = {
  'Masters of Ceremony': 'https://blog.playstation.com/2025/05/08/masters-of-ceremony-warbond-marches-into-helldivers-2-may-15/',
  'Force of Law': 'https://blog.playstation.com/2025/06/05/helldivers-2-force-of-law-warbond-launches-june-12/',
  'Dust Devils': 'https://blog.playstation.com/2025/08/26/helldivers-2-into-the-unjust-launches-september-2/'
};
const defaults = (source = catalog) => Object.fromEntries(Object.entries(keys).map(([type, key]) => [key,
  source.items.filter(i => i.type === type).map(i => ({ ...structuredClone(i), owned: i.defaultEnabled !== false, enabled: i.defaultEnabled !== false }))]));
const protectedFacts = source => source.items.map(i => Object.fromEntries(['id', 'name', 'type', 'defaultEnabled', 'assetPath', 'legacyIds', 'introducedIn'].filter(k => Object.hasOwn(i, k)).map(k => [k, i[k]])));

test('batch 4 reviews fourteen pending acquisitions with thirteen primary and one explicit community source', () => {
  assert.equal(review.schemaVersion, 1);
  assert.equal(review.items.length, 14); assert.equal(reviewedIds.size, 14);
  assert.deepEqual([...reviewedIds].sort(), Object.values(sets).flat().filter(id => id !== 'sidearm:cqc-1-saber').sort());
  assert.equal(review.items.filter(i => i.acquisition.verification === 'primary-source').length, 13);
  for (const correction of review.items) {
    const item = byId.get(correction.id), original = baseline.reviewedRows.find(i => i.id === item.id);
    assert.equal(original.acquisition.kind, 'unverified');
    assert.equal(item.name, correction.previousName);
    assert.deepEqual(item.acquisition, correction.acquisition);
    assert.equal(item.acquisition.kind, 'warbond');
    assert.equal(item.acquisition.reviewScope, 'acquisition');
    assert.equal(item.acquisition.verifiedAt, '2026-09-14');
    const community = item.id === 'booster:sample-scanner';
    assert.equal(item.acquisition.verification, community ? 'community-source' : 'primary-source');
    assert.equal(item.acquisition.sourceUrl, community ? 'https://helldivers.wiki.gg/wiki/Sample_Scanner' : pages[item.warbond]);
    if (community) assert.match(item.acquisition.notes, /official announcement text does not mention/i);
  }
  assert.deepEqual(createIndex(catalog.items).summary(), { total: 205, primary: 69, community: 13, pending: 123 });
});

test('three exact five-item sets exclude themed shop gear and unrelated drone artwork', () => {
  assert.equal(catalog.warbonds.length, 13); assert.equal(review.warbonds.length, 3);
  for (const bond of review.warbonds) {
    assert.deepEqual(bond.equipmentIds, sets[bond.name]);
    assert.deepEqual(catalog.warbonds.find(b => b.id === bond.id), bond);
    assert.equal(bond.sourceUrl, pages[bond.name]);
    assert.deepEqual(catalog.items.filter(i => i.warbond === bond.name).map(i => i.id).sort(), sets[bond.name].slice().sort());
    assert(bond.equipmentIds.every(id => byId.get(id).acquisition.id === bond.id));
    for (const excluded of ['sidearm:p-92-warrant', 'sidearm:cqc-19-machete', 'stratagem:hot-dog']) assert(!bond.equipmentIds.includes(excluded));
  }
  assert.equal(byId.get('sidearm:p-92-warrant').acquisition.kind, 'superstore');
  assert.equal(byId.get('sidearm:cqc-19-machete').acquisition.kind, 'superstore');
  assert(!reviewedIds.has('sidearm:cqc-1-saber'));
  assert.match(review.warbonds.find(b => b.name === 'Masters of Ceremony').notes, /community-corroborated/);
});

test('independent v1.1.6 digest reconstructs exactly and every unreviewed field and previous Warbond stays unchanged', () => {
  const previous = projectBeforeBatch4(catalog);
  assert.equal(baseline.version, '1.1.6');
  assert.equal(hash(previous), baseline.hashes.catalog);
  assert.equal(hash(catalog.items.filter(i => !reviewedIds.has(i.id))), baseline.hashes.untouched);
  assert.equal(hash(catalog.warbonds.filter(b => !Object.hasOwn(sets, b.name))), baseline.hashes.priorWarbonds);
  assert.equal(hash(protectedFacts(catalog)), baseline.hashes.protected);
  assert.deepEqual(createIndex(previous.items).summary(), { total: 205, primary: 56, community: 12, pending: 137 });
  assert.deepEqual(applyReview(previous, review), catalog);
  assert.deepEqual(applyReview(catalog, review), catalog);
});

test('historical projection cannot conceal protected identity, default, art or unrelated fact regressions', () => {
  for (const field of ['name', 'defaultEnabled', 'assetPath', 'type']) {
    const changed = structuredClone(catalog);
    const item = changed.items.find(i => !reviewedIds.has(i.id));
    item[field] = field === 'defaultEnabled' ? !item.defaultEnabled : 'Unexpected change';
    assert.notEqual(hash(projectBeforeBatch4(changed)), baseline.hashes.catalog);
  }
  const changed = structuredClone(catalog);
  changed.items.find(i => reviewedIds.has(i.id)).assetPath = 'wrong.png';
  assert.notEqual(hash(projectBeforeBatch4(changed)), baseline.hashes.catalog);
  changed.items.find(i => reviewedIds.has(i.id)).id = 'unexpected-id';
  assert.throws(() => projectBeforeBatch4(changed), /Retain prior stable ID/);
});

test('batch 4 application is pure and preserves player ownership, recovery metadata and historical Results', () => {
  const previous = projectBeforeBatch4(catalog);
  previous.items.forEach((item, n) => {
    item.owned = n % 3 !== 2; item.enabled = n % 3 === 0;
    item.privateNote = { id: item.id }; item.legacyAliasRecords = [{ name: 'Do not edit', owned: false }];
  });
  previous.cards = [{ id: 'history', stratagems: ['guard dog arc', 'One True Flag'], scoreRaw: 456, statsLocked: true, fingerprint: 'original', notes: 'Keep', stats: { kills: 50 } }];
  const before = JSON.stringify(previous), updated = applyReview(previous, review);
  assert.equal(JSON.stringify(previous), before);
  assert.deepEqual(updated.cards, previous.cards);
  for (const [n, item] of updated.items.entries()) for (const key of ['owned', 'enabled', 'privateNote', 'legacyAliasRecords']) assert.deepEqual(item[key], previous.items[n][key]);
});

test('all reviewed name, full-alias and ID-only imports preserve choices without duplicates or grants', () => {
  const base = defaults();
  for (const correction of review.items) {
    const item = byId.get(correction.id), key = keys[item.type];
    const identities = [{ name: item.name }, { id: item.id }, { id: item.id, name: 'Old arbitrary label' }, ...item.aliases.map(name => ({ name }))];
    for (const identity of identities) for (const flags of [{ enabled: false }, { enabled: true }, { owned: false, enabled: false }, { owned: true, enabled: false }, { owned: true, enabled: true }]) {
      const input = { [key]: [{ ...identity, ...flags, acquisition: { kind: 'custom' }, source: 'Old source', subgroup: 'Old group', userData: { note: 'Keep this' } }] };
      const before = JSON.stringify(input), merged = mergeItems(base, input), actual = merged[key].find(i => i.id === item.id);
      assert.equal(actual.enabled, flags.enabled); assert.equal(actual.owned, flags.owned ?? flags.enabled);
      assert.deepEqual(actual.userData, input[key][0].userData);
      for (const field of ['name', 'acquisition', 'source', 'subgroup', 'aliases']) assert.deepEqual(actual[field], item[field]);
      assert.equal(merged[key].length, base[key].length);
      assert.equal(merged[key].filter(i => i.id === item.id).length, 1);
      assert.deepEqual(mergeItems(base, merged), merged); assert.equal(JSON.stringify(input), before);
    }
  }
});

test('new source metadata leaves all fresh defaults identical and absent old-save items excluded', () => {
  const flags = items => Object.values(items).flat().map(i => [i.id, i.owned, i.enabled]);
  assert.deepEqual(flags(defaults()), flags(defaults(projectBeforeBatch4(catalog))));
  const empty = mergeItems(defaults(), Object.fromEntries(Object.values(keys).map(key => [key, []])));
  assert(Object.values(empty).flat().every(i => !i.owned && !i.enabled));
  assert.equal(Object.values(empty).flat().length, 205);
});

test('six stratagem associations and only the K-9 backpack subgroup change; old names remain aliases', () => {
  const strats = review.items.filter(i => i.id.startsWith('stratagem:'));
  assert.equal(strats.length, 6);
  assert(strats.every(i => baseline.reviewedRows.find(old => old.id === i.id).source === 'Unassigned / Custom'));
  assert.deepEqual(review.items.filter(i => Object.hasOwn(i, 'subgroup')).map(i => [i.id, i.subgroup]), [['stratagem:ax-arc-3-k-9', 'backpack']]);
  assert.equal(review.items.filter(i => Object.hasOwn(i, 'name')).length, 0);
  const canine = byId.get('stratagem:ax-arc-3-k-9');
  assert(canine.aliases.includes('guard dog arc')); assert(canine.aliases.includes('AX/ARC-3 "Guard Dog" K-9'));
  assert.match(canine.acquisition.notes, /community-corroborated/);
  assert.equal(byId.get('stratagem:solo-silo').subgroup, 'support');
  assert.equal(byId.get('primary:r-2-amendment').subgroup, 'marksman-rifle');
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

test('three unmodified official promo images match measured dimensions, SHA-256 and per-image provenance', () => {
  const assets = provenance.assets.filter(i => Object.hasOwn(sets, i.name));
  assert.equal(assets.length, 3);
  for (const image of assets) {
    const bond = review.warbonds.find(b => b.name === image.name);
    assert.equal(bond.coverAssetPath, image.assetPath); assert.equal(bond.coverKind, image.sourceKind);
    const bytes = fs.readFileSync(path.join(__dirname, '..', image.assetPath));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), image.sha256);
    assert.deepEqual(jpegSize(bytes), [image.width, image.height]);
    assert.equal(path.extname(image.assetPath), '.jpg'); assert(image.width >= 800 && image.height >= 450);
    assert.match(bond.notes, /not an exact in-game cover/);
    if (image.name === 'Dust Devils') {
      assert.equal(image.sourcePage, 'https://store.steampowered.com/news/app/553850/view/516345493302804917?l=english');
      assert.equal(image.imageUrl, 'https://clan.fastly.steamstatic.com/images/44156989/342d10f956ed74274059333aa15eca24e05b1918.jpg');
      assert.deepEqual([image.width, image.height], [800, 450]);
    } else {
      assert.equal(image.sourcePage, pages[image.name]);
      assert.equal(new URL(image.imageUrl).hostname, 'blog.playstation.com');
    }
  }
  assert.match(provenance.assets.find(i => i.name === 'Masters of Ceremony').imageUrl, /tachyon\/2028\/05\//);
});
