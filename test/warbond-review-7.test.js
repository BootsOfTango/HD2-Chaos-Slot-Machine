const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { projectBeforeBatch8 } = require('../scripts/catalog-history-fixture');
const catalog = projectBeforeBatch8(require('../assets/item-catalog.json'));
const review = require('../assets/catalog-reviews/2026-09-14-warbonds-7.json');
const baseline = require('./fixtures/warbond-review-7-baseline.json');
const provenance = require('../assets/warbonds/official/provenance.json');
const { applyReview } = require('../scripts/apply_catalog_review');
const { projectBeforeBatch7 } = require('../scripts/catalog-history-fixture');
const { mergeItems } = require('../assets/catalog-state');
const { createIndex } = require('../assets/catalog-sources');
const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x === 'object'
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
const hash = x => createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const reviewedIds = new Set(review.items.map(i => i.id));
const byId = new Map(catalog.items.map(i => [i.id, i]));
const keys = { primary: 'primaries', sidearm: 'sidearms', throwable: 'throwables', stratagem: 'stratagems', booster: 'boosters' };
const sets = {
  "Entrenched Division": [
    "primary:stoker",
    "sidearm:entrenchment-tool",
    "sidearm:veto",
    "throwable:giga-grenade",
    "stratagem:gas-mortar",
    "stratagem:cremator"
  ],
  "Exo Experts": [
    "primary:smg-203-gallant",
    "sidearm:p-33-missile-pistol",
    "stratagem:mgx-42-bullet-storm",
    "stratagem:exo-51-lumberer-exosuit",
    "stratagem:exo-55-breakthrough-exosuit"
  ],
  "Obedient Democracy Support Troopers": [
    "primary:ma5c-assault-rifle",
    "primary:m7s-smg",
    "primary:m90a-shotgun",
    "sidearm:m6c-socom-pistol"
  ]
};
const defaults = (source = catalog) => Object.fromEntries(Object.entries(keys).map(([type, key]) => [key,
  source.items.filter(i => i.type === type).map(i => ({ ...structuredClone(i), owned: i.defaultEnabled !== false, enabled: i.defaultEnabled !== false }))]));
const protectedFacts = source => source.items.map(i => Object.fromEntries(['id', 'name', 'type', 'defaultEnabled', 'assetPath', 'legacyIds', 'introducedIn'].filter(k => Object.hasOwn(i, k)).map(k => [k, i[k]])));

test('batch 7 reviews fifteen primary-source Warbond acquisitions and one community-source shop correction', () => {
  assert.equal(review.items.length, 16); assert.equal(reviewedIds.size, 16);
  assert.deepEqual([...reviewedIds].sort(), [...Object.values(sets).flat(), 'primary:sweeper'].sort());
  for (const correction of review.items) {
    const item = byId.get(correction.id), old = baseline.reviewedRows.find(i => i.id === item.id);
    assert.equal(old.acquisition.kind, 'unverified');
    assert.equal(item.name, correction.previousName); assert.deepEqual(item.acquisition, correction.acquisition);
    assert.equal(item.acquisition.verification, item.id === 'primary:sweeper' ? 'community-source' : 'primary-source'); assert.equal(item.acquisition.reviewScope, 'acquisition');
    assert.equal(item.acquisition.verifiedAt, '2026-09-14');
    if (item.id !== 'primary:sweeper') assert.equal(item.acquisition.sourceUrl, review.warbonds.find(b => b.name === item.warbond).sourceUrl);
  }
  assert.deepEqual(createIndex(catalog.items).summary(), { total: 205, primary: 108, community: 18, pending: 79 });
});

test('exact six/five/four sets exclude the separately acquired Sweeper and all cosmetics', () => {
  assert.equal(catalog.warbonds.length, 22); assert.equal(review.warbonds.length, 3);
  for (const bond of review.warbonds) {
    assert.deepEqual(bond.equipmentIds, sets[bond.name]);
    assert.deepEqual(catalog.warbonds.find(b => b.id === bond.id), bond);
    assert.deepEqual(catalog.items.filter(i => i.warbond === bond.name).map(i => i.id).sort(), sets[bond.name].slice().sort());
    assert(bond.equipmentIds.every(id => byId.get(id).acquisition.id === bond.id));
    for (const excluded of ['primary:sweeper', 'primary:mp-98-knight', 'stratagem:bastion', 'sidearm:cqc-19-machete', 'throwable:g-89-smokescreen', 'stratagem:guard-dog', 'booster:experimental-infusion']) assert(!bond.equipmentIds.includes(excluded));
  }
  assert.equal(review.warbonds.find(b => b.name === 'Entrenched Division').releasedAt, '2026-03-17');
  assert.equal(review.warbonds.find(b => b.name === 'Exo Experts').releasedAt, '2026-04-28');
  assert.equal(review.warbonds.find(b => b.name === 'Obedient Democracy Support Troopers').edition, 'Legendary Warbond');
});

test('independent v1.1.9 digests preserve all 189 untouched items, prior 19 groups, identities, defaults and art', () => {
  const previous = projectBeforeBatch7(catalog);
  assert.equal(baseline.version, '1.1.9');
  assert.equal(hash(previous), baseline.hashes.catalog);
  assert.equal(hash(catalog.items.filter(i => !reviewedIds.has(i.id))), baseline.hashes.untouched);
  assert.equal(hash(catalog.warbonds.filter(b => !Object.hasOwn(sets, b.name))), baseline.hashes.priorWarbonds);
  assert.equal(hash(protectedFacts(catalog)), baseline.hashes.protected);
  assert.deepEqual(createIndex(previous.items).summary(), { total: 205, primary: 93, community: 17, pending: 95 });
  assert.deepEqual(applyReview(previous, review), catalog);
  assert.deepEqual(applyReview(catalog, review), catalog);
});

test('baseline projection cannot mask protected facts and rejects removed stable IDs', () => {
  for (const field of ['id', 'name', 'type', 'assetPath', 'defaultEnabled']) {
    const changed = structuredClone(catalog);
    changed.items.find(i => reviewedIds.has(i.id))[field] = field === 'defaultEnabled' ? false : 'Unexpected change';
    assert.notEqual(hash(protectedFacts(changed)), baseline.hashes.protected);
    if (field === 'id') assert.throws(() => projectBeforeBatch7(changed), /Retain prior stable ID/);
  }
  const changed = structuredClone(catalog);
  changed.items.find(i => !reviewedIds.has(i.id)).acquisition.label = 'Unexpected source';
  assert.notEqual(hash(projectBeforeBatch7(changed)), baseline.hashes.catalog);
});

test('fact-only review preserves player choices, arbitrary metadata and historical Results without mutating input', () => {
  const previous = projectBeforeBatch7(catalog);
  previous.items.forEach((item, n) => {
    item.owned = n % 3 !== 2; item.enabled = n % 3 === 0;
    item.privateNote = { id: item.id }; item.legacyAliasRecords = [{ name: 'Recoverable', owned: false }];
  });
  previous.cards = [{ id: 'history', stratagems: ['C4 Pack', 'detonation tool'], scoreRaw: 456, statsLocked: true, fingerprint: 'original', stats: { kills: 50 } }];
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
  assert.equal(review.items.filter(i => i.aliases).length, 9);
});

test('fresh defaults and missing old-save exclusions are unchanged; only two documented subgroup edits and no canonical name edits', () => {
  const flags = items => Object.values(items).flat().map(i => [i.id, i.owned, i.enabled]);
  assert.deepEqual(flags(defaults()), flags(defaults(projectBeforeBatch7(catalog))));
  const empty = mergeItems(defaults(), Object.fromEntries(Object.values(keys).map(key => [key, []])));
  assert(Object.values(empty).flat().every(i => !i.owned && !i.enabled)); assert.equal(Object.values(empty).flat().length, 205);
  assert.equal(review.items.filter(i => Object.hasOwn(i, 'name')).length, 0);
  assert.deepEqual(review.items.filter(i => i.subgroup).map(i => [i.id, i.subgroup]).sort(), [['primary:stoker', 'smg'], ['primary:sweeper', 'shotgun']]);
  assert.equal(review.items.filter(i => i.id.startsWith('stratagem:')).length, 5);
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
    assert(image.width >= 1920 && image.height >= 1080);
    assert.match(bond.notes, /not an exact in-game cover/);
    assert.equal(image.sourcePage, bond.sourceUrl);
    assert(html.includes(JSON.stringify(bond.name) + ': ' + JSON.stringify(image.assetPath)));
  }

});

test('Sweeper is a separate Superstore shotgun, never a Warbond bulk grant', () => {
  const item = byId.get('primary:sweeper'), index = createIndex(catalog.items);
  assert.equal(item.name, 'Sweeper'); assert.equal(item.warbond, 'Superstore');
  assert.equal(item.subgroup, 'shotgun'); assert.equal(index.describe(item).kind, 'superstore');
  assert(item.aliases.includes('SG-97 Sweeper'));
  assert(review.warbonds.every(b => !b.equipmentIds.includes(item.id)));
  const saved = { primaries: [{ name: 'Sweeper', warbond: 'Entrenched Division', owned: false, enabled: false, personal: 'retain' }] };
  const updated = mergeItems(defaults(), saved).primaries.find(i => i.id === item.id);
  assert.equal(updated.warbond, 'Superstore'); assert.equal(updated.owned, false); assert.equal(updated.enabled, false);
  assert.equal(updated.personal, 'retain'); assert.equal(saved.primaries[0].warbond, 'Entrenched Division');
});
