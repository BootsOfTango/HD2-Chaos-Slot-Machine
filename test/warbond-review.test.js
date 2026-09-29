const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { projectBeforeBatch4 } = require('../scripts/catalog-history-fixture');
const catalog = projectBeforeBatch4(require('../assets/item-catalog.json'));
const review = require('../assets/catalog-reviews/2026-09-14-warbonds.json');
const earlierReview = require('../assets/catalog-reviews/2026-09-14.json');
const newerReview = require('../assets/catalog-reviews/2026-09-14-warbonds-3.json');
const newerBaseline = require('./fixtures/warbond-review-3-baseline.json');
const provenance = require('../assets/warbonds/official/provenance.json');
const { applyReview } = require('../scripts/apply_catalog_review');
const { createIndex } = require('../assets/catalog-sources');
const { mergeItems } = require('../assets/catalog-state');
const root = path.resolve(__dirname, '..');
const byId = new Map(catalog.items.map(item => [item.id, item]));
const reviewedIds = new Set(review.items.map(item => item.id));
const groupKeys = { primary: 'primaries', sidearm: 'sidearms', throwable: 'throwables', stratagem: 'stratagems', booster: 'boosters' };
const expectedSets = {
  'Cutting Edge': ['primary:arc-12-blitzer', 'primary:sg-8p-punisher-plasma', 'primary:las-16-sickle', 'sidearm:las-7-dagger', 'throwable:g-23-stun', 'booster:localization-confusion'],
  'Democratic Detonation': ['primary:br-14-adjudicator', 'primary:r-36-eruptor', 'primary:cb-9-exploding-crossbow', 'sidearm:gp-31-grenade-pistol', 'throwable:g-123-thermite', 'booster:expert-extraction-pilot'],
  'Polar Patriots': ['primary:ar-61-tenderizer', 'primary:smg-72-pummeler', 'primary:plas-101-purifier', 'sidearm:p-113-verdict', 'throwable:g-13-incendiary-impact', 'booster:motivational-shocks']
};
const subgroupChanges = {
  'primary:sg-8p-punisher-plasma': ['shotgun', 'energy'],
  'primary:r-36-eruptor': ['marksman-rifle', 'explosive'],
  'sidearm:gp-31-grenade-pistol': ['pistol', 'special-sidearm']
};
const newAliases = {
  'primary:br-14-adjudicator': ['BR-14 Adjudicator Rifle'],
  'primary:r-36-eruptor': ['R-36 Eruptor Rifle'],
  'throwable:g-123-thermite': ['G-123 Thermite Grenade']
};
const sourcePages = {
  'Cutting Edge': 'https://blog.playstation.com/2024/03/07/helldivers-2-new-warbond-launches-march-14-first-look-at-new-weapons-armor-and-more/',
  'Democratic Detonation': 'https://blog.playstation.com/2024/04/04/helldivers-2-gets-an-explosive-new-warbond-on-april-11/',
  'Polar Patriots': 'https://blog.playstation.com/2024/05/02/new-helldivers-2-warbond-brings-trap-laying-weaponry-arctic-themed-armor-and-more-may-9/'
};
const sortById = rows => rows.slice().sort((a, b) => a.id.localeCompare(b.id));
const stableValue = value => Array.isArray(value) ? value.map(stableValue)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])])) : value;
const hash = value => createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
const protectedKeys = ['id', 'name', 'type', 'defaultEnabled', 'assetPath', 'legacyIds', 'introducedIn'];
const protectedFacts = rows => sortById(rows.map(item => Object.fromEntries(protectedKeys.filter(key => Object.hasOwn(item, key)).map(key => [key, item[key]]))));

// Semantic fixture digests captured read-only from v1.1.4 commit
// 6441680a55e45d3621f7c67443381cee984832c5. Tests need no Git executable/history.
const baselineHashes = {
  protected: '13e848210429f9208b24333155c396601e1cec81d3a9a21dcdd0e9aafca917f8',
  untouched: '9743233000c3eaa9e1ea11bb60e132fe28d116d8f1535c4302dcfcaa07498c7c',
  priorWarbonds: 'efd7cda45c3ea7d0effb3bee2a7adeb522000f5ab5c0b49918134a9514f976d8'
};
// Undo only batch 3's reviewable fields using independently captured v1.1.5
// records. This keeps the original v1.1.4 digest checks meaningful as audits grow.
function projectBeforeLatestReview() {
  const projected = structuredClone(catalog);
  projected.warbonds = projected.warbonds.filter(bond => !newerReview.warbonds.some(latest => latest.id === bond.id));
  for (const previous of newerBaseline.reviewedRows) {
    const item = projected.items.find(row => row.id === previous.id);
    assert.ok(item, `Retain prior stable ID ${previous.id}`);
    for (const key of ['name', 'aliases', 'subgroup', 'warbond', 'source', 'acquisition']) item[key] = structuredClone(previous[key]);
  }
  return projected;
}
const beforeLatestReview = projectBeforeLatestReview();
function baselineFixture() {
  const previous = structuredClone(beforeLatestReview);
  previous.warbonds = previous.warbonds.filter(bond => !Object.hasOwn(expectedSets, bond.name));
  for (const item of previous.items) {
    if (!reviewedIds.has(item.id)) continue;
    item.aliases = [];
    item.acquisition = { kind: 'unverified', label: item.source, verification: 'legacy-assignment-pending-audit' };
    if (subgroupChanges[item.id]) item.subgroup = subgroupChanges[item.id][0];
  }
  return previous;
}
function defaults() {
  return Object.fromEntries(Object.entries(groupKeys).map(([type, key]) => [key,
    structuredClone(catalog.items.filter(item => item.type === type)).map(item => ({
      ...item, enabled: item.defaultEnabled !== false, owned: item.defaultEnabled !== false
    }))]));
}

test('Warbond batch reviews exactly 17 previously pending facts: 16 official and one community', () => {
  assert.equal(review.schemaVersion, 1);
  assert.equal(review.items.length, 17);
  assert.equal(reviewedIds.size, 17);
  const expectedIds = Object.values(expectedSets).flat().filter(id => id !== 'primary:arc-12-blitzer').sort();
  assert.deepEqual([...reviewedIds].sort(), expectedIds);
  assert.equal(review.items.filter(item => item.acquisition.verification === 'primary-source').length, 16);
  const community = review.items.filter(item => item.acquisition.verification === 'community-source');
  assert.deepEqual(community.map(item => item.id), ['booster:localization-confusion']);
  assert.match(community[0].acquisition.notes, /not named.*official/i);
  assert.match(community[0].acquisition.notes, /403.*indexed/i);
  for (const correction of review.items) {
    const item = byId.get(correction.id);
    assert.equal(item.name, correction.previousName);
    assert.equal(Object.hasOwn(correction, 'name'), false, 'This batch does not rename equipment');
    assert.deepEqual(item.acquisition, correction.acquisition);
    assert.equal(item.acquisition.kind, 'warbond');
    assert.equal(item.acquisition.reviewScope, 'acquisition');
    assert.equal(item.acquisition.verifiedAt, '2026-09-14');
    const bond = review.warbonds.find(row => row.name === item.warbond);
    assert.equal(item.acquisition.id, bond.id);
    assert.equal(item.acquisition.sourceUrl, item.id === 'booster:localization-confusion'
      ? 'https://helldivers.wiki.gg/wiki/Localization_Confusion' : sourcePages[item.warbond]);
  }
  assert.deepEqual(createIndex(beforeLatestReview.items).summary(), { total: 205, primary: 43, community: 12, pending: 150 });
});

test('three Warbonds contain exactly the supported six-item sets and no stratagems or extra grants', () => {
  assert.equal(review.warbonds.length, 3);
  assert.deepEqual(review.warbonds.map(row => row.name).sort(), Object.keys(expectedSets).sort());
  for (const bond of review.warbonds) {
    assert.equal(bond.edition, 'Premium Warbond');
    assert.equal(new Set(bond.equipmentIds).size, 6);
    assert.deepEqual(bond.equipmentIds.slice().sort(), expectedSets[bond.name].slice().sort());
    assert.deepEqual(catalog.warbonds.find(row => row.id === bond.id), bond);
    assert.deepEqual(catalog.items.filter(item => item.warbond === bond.name).map(item => item.id).sort(), expectedSets[bond.name].slice().sort());
    assert.deepEqual(bond.equipmentIds.map(id => byId.get(id).type).sort(), ['booster', 'primary', 'primary', 'primary', 'sidearm', 'throwable']);
    assert.equal(bond.equipmentIds.some(id => id.startsWith('stratagem:')), false);
  }
});

test('only three specified subgroups and three aliases change, with taxonomy evidence qualified', () => {
  assert.deepEqual(Object.fromEntries(review.items.filter(row => Object.hasOwn(row, 'subgroup')).map(row => [row.id, row.subgroup])),
    Object.fromEntries(Object.entries(subgroupChanges).map(([id, [, next]]) => [id, next])));
  assert.deepEqual(Object.fromEntries(review.items.filter(row => Object.hasOwn(row, 'aliases')).map(row => [row.id, row.aliases])), newAliases);
  for (const [id, [, expected]] of Object.entries(subgroupChanges)) assert.equal(byId.get(id).subgroup, expected);
  for (const [id, aliases] of Object.entries(newAliases)) assert.deepEqual(byId.get(id).aliases, aliases);
  assert.match(byId.get('primary:sg-8p-punisher-plasma').acquisition.notes, /official patch 01\.000\.300/);
  for (const id of ['primary:r-36-eruptor', 'sidearm:gp-31-grenade-pistol']) {
    assert.equal(byId.get(id).acquisition.verification, 'primary-source');
    assert.match(byId.get(id).acquisition.notes, /acquisition is officially confirmed.*community-corroborated/i);
    assert.match(byId.get(id).acquisition.notes, /https:\/\/helldivers\.wiki\.gg\//);
  }
});

test('all identities, names, eligibility defaults, item artwork and prior reviewed facts match v1.1.4', () => {
  assert.equal(catalog.items.length, 205);
  assert.equal(hash(beforeLatestReview), newerBaseline.hashes.catalog, 'Projection exactly reproduces independently captured v1.1.5 catalog');
  assert.equal(hash(protectedFacts(beforeLatestReview.items)), baselineHashes.protected);
  assert.equal(hash(sortById(beforeLatestReview.items.filter(item => !reviewedIds.has(item.id)))), baselineHashes.untouched);
  const previousBonds = beforeLatestReview.warbonds.filter(bond => !Object.hasOwn(expectedSets, bond.name));
  assert.equal(previousBonds.length, 4);
  assert.equal(hash(sortById(previousBonds)), baselineHashes.priorWarbonds);
  const blitzer = byId.get('primary:arc-12-blitzer');
  assert.equal(reviewedIds.has(blitzer.id), false, 'Already-reviewed Blitzer must not be overwritten or counted again');
  assert.deepEqual(blitzer.acquisition, earlierReview.items.find(item => item.id === blitzer.id).acquisition);
  assert.equal(blitzer.subgroup, 'energy');
});

test('applying the fact review is idempotent and never mutates the baseline, review, or player fields', () => {
  const previous = baselineFixture();
  const before = JSON.stringify({ previous, review, catalog });
  assert.deepEqual(createIndex(previous.items).summary(), { total: 205, primary: 27, community: 11, pending: 167 });
  assert.equal(hash(protectedFacts(previous.items)), baselineHashes.protected);
  assert.ok(previous.items.filter(item => reviewedIds.has(item.id)).every(item => item.acquisition.kind === 'unverified'));
  const updated = applyReview(previous, review);
  assert.deepEqual(updated, beforeLatestReview);
  assert.deepEqual(applyReview(updated, newerReview), catalog, 'Replaying later review reaches current catalog without changing historical expectations');
  assert.deepEqual(applyReview(updated, review), updated);
  assert.deepEqual(applyReview(catalog, review), catalog);
  assert.equal(JSON.stringify({ previous, review, catalog }), before);
  const playerFixture = structuredClone(previous);
  for (const [index, item] of playerFixture.items.entries()) {
    item.owned = index % 3 !== 2; item.enabled = index % 3 === 0;
    item.playerNote = { preserved: item.id };
  }
  const originalPlayer = JSON.stringify(playerFixture);
  const playerResult = applyReview(playerFixture, review);
  for (const [index, item] of playerResult.items.entries()) {
    assert.equal(item.owned, playerFixture.items[index].owned);
    assert.equal(item.enabled, playerFixture.items[index].enabled);
    assert.deepEqual(item.playerNote, playerFixture.items[index].playerNote);
  }
  assert.equal(JSON.stringify(playerFixture), originalPlayer);
});

test('old name-only and stable-ID imports preserve choices/custom metadata while resetting known facts', () => {
  const base = defaults();
  const baseline = JSON.stringify(base);
  const flags = [{ enabled: false }, { enabled: true }, { owned: false, enabled: false }, { owned: true, enabled: false }, { owned: true, enabled: true }];
  for (const correction of review.items) {
    const item = byId.get(correction.id);
    const key = groupKeys[item.type];
    for (const withId of [false, true]) for (const choice of flags) {
      const saved = { name: withId ? 'Outdated source-label display' : correction.previousName,
        ...(withId ? { id: item.id } : {}), ...choice,
        subgroup: 'old-wrong-subgroup', source: 'Old source', warbond: 'Old Warbond', aliases: ['Player-asserted alias'],
        acquisition: { kind: 'superstore', verification: 'primary-source', sourceUrl: 'https://invalid.example/' },
        playerNote: { label: 'Keep user notes', id: item.id }
      };
      const input = { [key]: [saved] };
      const before = JSON.stringify(input);
      const result = mergeItems(base, input);
      const actual = result[key].find(row => row.id === item.id);
      assert.equal(actual.name, item.name);
      assert.equal(actual.enabled, choice.enabled);
      assert.equal(actual.owned, Object.hasOwn(choice, 'owned') ? choice.owned : choice.enabled);
      for (const field of ['subgroup', 'source', 'warbond', 'aliases', 'acquisition']) assert.deepEqual(actual[field], item[field], `${item.id}:${field}`);
      assert.deepEqual(actual.playerNote, saved.playerNote);
      assert.equal(result[key].some(row => row.name === 'Outdated source-label display'), false);
      assert.deepEqual(mergeItems(base, result), result);
      assert.equal(JSON.stringify(input), before);
    }
  }
  assert.equal(JSON.stringify(base), baseline);
});

test('three official full-label aliases resolve old name-only imports without duplicate roll entries', () => {
  const base = defaults();
  for (const [id, aliases] of Object.entries(newAliases)) {
    const item = byId.get(id);
    const key = groupKeys[item.type];
    for (const name of aliases) {
      const input = { [key]: [{ name, enabled: false, owned: true, playerNote: 'Keep alias metadata' }] };
      const before = JSON.stringify(input);
      const result = mergeItems(base, input);
      const actual = result[key].find(row => row.id === id);
      assert.equal(actual.name, item.name);
      assert.equal(actual.owned, true); assert.equal(actual.enabled, false);
      assert.equal(actual.playerNote, 'Keep alias metadata');
      assert.equal(result[key].length, base[key].length);
      assert.equal(result[key].filter(row => row.id === id).length, 1);
      assert.equal(JSON.stringify(input), before);
    }
  }
});

function imageHeader(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
    assert.equal(bytes.readUInt32BE(8), 13);
    return { format: 'png', width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  assert.equal(bytes.readUInt16BE(0), 0xffd8, 'JPEG SOI signature');
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let position = 2;
  while (position < bytes.length) {
    assert.equal(bytes[position++], 0xff, 'JPEG segment marker');
    while (bytes[position] === 0xff) position++;
    const marker = bytes[position++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(position);
    assert.ok(length >= 2 && position + length <= bytes.length, 'JPEG segment stays within original bytes');
    if (frameMarkers.has(marker)) return { format: 'jpg', height: bytes.readUInt16BE(position + 3), width: bytes.readUInt16BE(position + 5) };
    position += length;
  }
  assert.fail('JPEG dimensions missing');
}

test('three new cover originals match attributed URLs, byte hashes, dimensions and JPEG/PNG signatures', () => {
  const originals = {
    'Cutting Edge': ['https://blog.playstation.com/tachyon/2054/03/3eea3509d29fe9982d36bac4ed9fdd8fbcc95199-scaled.jpeg', 'jpg', 2560, 1440],
    'Democratic Detonation': ['https://blog.playstation.com/tachyon/2024/04/1a42a221dba5b31d68e95588ca9c330910f8e113-scaled.jpg', 'jpg', 2560, 1440],
    'Polar Patriots': ['https://blog.playstation.com/tachyon/2084/05/8fda168f4b1d7a97f0f11c0fdd6a5889cab07080.png', 'png', 1920, 1080]
  };
  const sources = provenance.assets.filter(source => Object.hasOwn(originals, source.name));
  assert.equal(sources.length, 3);
  assert.equal(new Set(sources.map(source => source.name)).size, 3);
  for (const source of sources) {
    const bond = review.warbonds.find(row => row.name === source.name);
    const [imageUrl, format, width, height] = originals[source.name];
    assert.equal(source.imageUrl, imageUrl);
    assert.equal(source.sourcePage, sourcePages[source.name]);
    assert.equal(bond.sourceUrl, source.sourcePage);
    assert.equal(bond.coverAssetPath, source.assetPath);
    assert.equal(bond.coverKind, source.sourceKind);
    assert.match(source.sourceKind, /^official-promotional-/);
    assert.match(bond.notes, /not an exact in-game cover/i);
    assert.equal(path.extname(source.assetPath), '.' + format);
    const bytes = fs.readFileSync(path.join(root, source.assetPath));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256);
    assert.deepEqual(imageHeader(bytes), { format, width, height });
    assert.equal(source.width, width); assert.equal(source.height, height);
  }
  assert.match(provenance.rightsNotice, /not relicensed/i);
});
