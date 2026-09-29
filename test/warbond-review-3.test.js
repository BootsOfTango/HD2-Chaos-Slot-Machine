const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { projectBeforeBatch4 } = require('../scripts/catalog-history-fixture');
const catalog = projectBeforeBatch4(require('../assets/item-catalog.json'));
const review = require('../assets/catalog-reviews/2026-09-14-warbonds-3.json');
const firstReview = require('../assets/catalog-reviews/2026-09-14.json');
const baseline = require('./fixtures/warbond-review-3-baseline.json');
const provenance = require('../assets/warbonds/official/provenance.json');
const { applyReview } = require('../scripts/apply_catalog_review');
const { createIndex } = require('../assets/catalog-sources');
const catalogState = require('../assets/catalog-state');
const root = path.resolve(__dirname, '..');
const byId = new Map(catalog.items.map(item => [item.id, item]));
const beforeById = new Map(baseline.reviewedRows.map(item => [item.id, item]));
const reviewedIds = new Set(review.items.map(item => item.id));
const groups = { primary: 'primaries', sidearm: 'sidearms', throwable: 'throwables', stratagem: 'stratagems', booster: 'boosters' };
const expectedSets = {
  'Control Group': ['primary:vg-70-variable', 'throwable:g-31-arc', 'stratagem:epoch', 'stratagem:laser-sentry', 'stratagem:warp-pack'],
  'Servants of Freedom': ['primary:las-17-double-edge-sickle', 'sidearm:gp-20-ultimatum', 'throwable:g-50-seeker', 'stratagem:portable-hellbomb'],
  'Borderline Justice': ['primary:r-6-deadeye', 'sidearm:las-58-talon', 'throwable:ted-63-dynamite', 'stratagem:hover-pack', 'booster:sample-extractor']
};
const officialStratagemAliases = {
  'stratagem:epoch': ['PLAS-45 Epoch'],
  'stratagem:laser-sentry': ['A/LAS-98 Laser Sentry'],
  'stratagem:warp-pack': ['LIFT-182 Warp Pack'],
  'stratagem:portable-hellbomb': ['B-100 Portable Hellbomb'],
  'stratagem:hover-pack': ['LIFT-860 Hover Pack']
};
const officialStratagemAliasIds = Object.keys(officialStratagemAliases);
const sourcePages = {
  'Control Group': 'https://blog.playstation.com/2025/07/10/helldivers-2-control-group-warbond-launches-july-17/',
  'Servants of Freedom': 'https://blog.playstation.com/2025/02/04/helldivers-2-servants-of-freedom-warbond-launches-february-6/',
  'Borderline Justice': 'https://blog.playstation.com/2025/03/18/helldivers-2-borderline-justice-warbond-launches-march-20/'
};
const originalImageUrls = {
  'Control Group': 'https://blog.playstation.com/tachyon/2025/07/8673000f2bdaa5162280c7ddb6019d060d48dd68-scaled.jpg',
  'Servants of Freedom': 'https://blog.playstation.com/tachyon/2025/02/7b1da375328c6d823392bf48ad6d9c47bff33ead-scaled.jpg',
  'Borderline Justice': 'https://blog.playstation.com/tachyon/2025/03/8c47042d2c960242b1bfb9c012f35342c154a8d6.jpg'
};
const reviewedFields = ['name', 'aliases', 'subgroup', 'warbond', 'source', 'acquisition'];
const stableValue = value => Array.isArray(value) ? value.map(stableValue)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])])) : value;
const hash = value => createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
const sortById = rows => rows.slice().sort((a, b) => a.id.localeCompare(b.id));
const protectedKeys = ['id', 'name', 'type', 'defaultEnabled', 'assetPath', 'legacyIds', 'introducedIn'];
const protectedFacts = rows => sortById(rows.map(item => Object.fromEntries(protectedKeys.filter(key => Object.hasOwn(item, key)).map(key => [key, item[key]]))));

function previousCatalog() {
  const previous = structuredClone(catalog);
  previous.warbonds = previous.warbonds.filter(bond => !Object.hasOwn(expectedSets, bond.name));
  for (const original of baseline.reviewedRows) {
    const item = previous.items.find(row => row.id === original.id);
    assert.ok(item, `Prior canonical identity remains: ${original.id}`);
    for (const key of reviewedFields) item[key] = structuredClone(original[key]);
  }
  return previous;
}
function defaults(source = catalog) {
  return Object.fromEntries(Object.entries(groups).map(([type, key]) => [key,
    structuredClone(source.items.filter(item => item.type === type)).map(item => ({
      ...item, enabled: item.defaultEnabled !== false, owned: item.defaultEnabled !== false
    }))]));
}

test('batch 3 reviews exactly thirteen previously pending acquisitions, all with primary sources', () => {
  assert.equal(review.schemaVersion, 1);
  assert.equal(review.items.length, 13);
  assert.equal(reviewedIds.size, 13);
  assert.equal(baseline.reviewedRows.length, 13);
  const expectedIds = Object.values(expectedSets).flat().filter(id => id !== 'primary:vg-70-variable').sort();
  assert.deepEqual([...reviewedIds].sort(), expectedIds);
  assert.deepEqual([...beforeById.keys()].sort(), expectedIds);
  for (const correction of review.items) {
    const item = byId.get(correction.id);
    const original = beforeById.get(correction.id);
    assert.equal(original.acquisition.kind, 'unverified');
    assert.equal(correction.previousName, original.name);
    assert.deepEqual(item.acquisition, correction.acquisition);
    assert.equal(item.name, correction.name || original.name);
    assert.equal(item.acquisition.kind, 'warbond');
    assert.equal(item.acquisition.verification, 'primary-source');
    assert.equal(item.acquisition.reviewScope, 'acquisition');
    assert.equal(item.acquisition.verifiedAt, '2026-09-14');
    const bond = review.warbonds.find(row => row.name === item.warbond);
    assert.ok(bond, `Explicit reviewed Warbond for ${item.id}`);
    assert.equal(item.acquisition.id, bond.id);
    assert.equal(item.source, bond.name);
    assert.equal(item.acquisition.sourceUrl, sourcePages[bond.name]);
    assert.equal(new URL(item.acquisition.sourceUrl).protocol, 'https:');
    assert.equal(new URL(item.acquisition.sourceUrl).hostname, 'blog.playstation.com');
  }
  assert.deepEqual(createIndex(catalog.items).summary(), { total: 205, primary: 56, community: 12, pending: 137 });
});

test('batch 3 provides exact complete five/four/five equipment sets without same-theme shop purchases', () => {
  assert.equal(review.warbonds.length, 3);
  assert.deepEqual(review.warbonds.map(bond => bond.name).sort(), Object.keys(expectedSets).sort());
  assert.equal(catalog.warbonds.length, 10);
  for (const bond of review.warbonds) {
    const expected = expectedSets[bond.name];
    assert.equal(bond.edition, 'Premium Warbond');
    assert.equal(new Set(bond.equipmentIds).size, expected.length);
    assert.deepEqual(bond.equipmentIds.slice().sort(), expected.slice().sort());
    assert.deepEqual(catalog.warbonds.find(row => row.id === bond.id), bond);
    assert.deepEqual(catalog.items.filter(item => item.warbond === bond.name).map(item => item.id).sort(), expected.slice().sort());
    for (const id of bond.equipmentIds) {
      const item = byId.get(id);
      assert.equal(item.acquisition.kind, 'warbond');
      assert.equal(item.acquisition.id, bond.id);
    }
  }
  const freedom = review.warbonds.find(bond => bond.name === 'Servants of Freedom');
  assert.equal(freedom.equipmentIds.includes('sidearm:cqc-5-combat-hatchet'), false);
  assert.equal(byId.get('sidearm:cqc-5-combat-hatchet').acquisition.kind, 'superstore');
  assert.equal(freedom.equipmentIds.some(id => id.startsWith('booster:')), false);
  assert.equal(review.warbonds.find(bond => bond.name === 'Control Group').equipmentIds.some(id => /^(sidearm|booster):/.test(id)), false);
});

test('committed v1.1.5 fixture reconstructs exactly; source reviews preserve all other catalog facts', () => {
  assert.equal(baseline.commit, '1ae4a31abe898273ad4bff408f88892bf0bc0ab3');
  const previous = previousCatalog();
  assert.equal(hash(previous), baseline.hashes.catalog);
  assert.deepEqual(createIndex(previous.items).summary(), { total: 205, primary: 43, community: 12, pending: 150 });
  assert.equal(catalog.items.length, 205);
  assert.equal(hash(sortById(catalog.items.filter(item => !reviewedIds.has(item.id)))), baseline.hashes.untouched);
  const previousBonds = catalog.warbonds.filter(bond => !Object.hasOwn(expectedSets, bond.name));
  assert.equal(previousBonds.length, 7);
  assert.equal(hash(sortById(previousBonds)), baseline.hashes.priorWarbonds);
  const variable = byId.get('primary:vg-70-variable');
  assert.equal(reviewedIds.has(variable.id), false, 'Already-reviewed Variable is not counted or overwritten');
  assert.deepEqual(variable.acquisition, firstReview.items.find(item => item.id === variable.id).acquisition);
  assert.equal(variable.subgroup, 'special-primary');
  const protectedRows = structuredClone(catalog.items);
  // Only an explicitly reviewed booster spelling correction may change a name.
  for (const correction of review.items.filter(item => Object.hasOwn(item, 'name'))) {
    assert.equal(correction.id, 'booster:sample-extractor');
    assert.equal(correction.previousName, 'Sample Extractor');
    assert.equal(correction.name, 'Sample Extricator');
    protectedRows.find(item => item.id === correction.id).name = correction.previousName;
  }
  assert.equal(hash(protectedFacts(protectedRows)), baseline.hashes.protected);
});

test('fact review is a pure idempotent transformation and cannot grant ownership or alter saved metadata', () => {
  const previous = previousCatalog();
  const before = JSON.stringify({ previous, review, catalog });
  assert.deepEqual(applyReview(previous, review), catalog);
  assert.deepEqual(applyReview(catalog, review), catalog);
  assert.equal(JSON.stringify({ previous, review, catalog }), before);
  const player = structuredClone(previous);
  player.items.forEach((item, index) => {
    item.owned = index % 3 !== 2; item.enabled = index % 3 === 0;
    item.playerNote = { keep: item.id };
    item.legacyAliasRecords = [{ name: `Old ${item.name}`, owned: false, enabled: false, custom: 42 }];
  });
  player.cards = [{ id: 'history', booster: 'Sample Extractor', fingerprint: 'legacy-fingerprint', scoreRaw: 201, statsLocked: true, stats: { kills: 123 }, notes: 'Original history' }];
  const playerBefore = JSON.stringify(player);
  const updated = applyReview(player, review);
  updated.items.forEach((item, index) => {
    for (const key of ['owned', 'enabled', 'playerNote', 'legacyAliasRecords']) assert.deepEqual(item[key], player.items[index][key]);
  });
  assert.deepEqual(updated.cards, player.cards);
  assert.equal(JSON.stringify(player), playerBefore);
});

test('fresh launch preserves all prior eligibility defaults while sparse old imports never grant absent items', () => {
  const base = defaults();
  const original = defaults(previousCatalog());
  const flags = items => Object.values(items).flat().map(item => [item.id, item.owned, item.enabled]);
  assert.deepEqual(flags(catalogState.mergeItems(base)), flags(original));
  assert.equal(Object.values(base).flat().filter(item => !item.owned && !item.enabled).length, 5);
  const empty = catalogState.mergeItems(base, Object.fromEntries(Object.values(groups).map(key => [key, []])));
  assert.ok(Object.values(empty).flat().every(item => item.owned === false && item.enabled === false));
  assert.equal(Object.values(empty).flat().length, 205);
});

test('canonical names, legacy names, full aliases and ID-only imports preserve choices and arbitrary metadata', () => {
  const base = defaults();
  const baseBefore = JSON.stringify(base);
  const flagCases = [{ enabled: false }, { enabled: true }, { owned: false, enabled: false }, { owned: true, enabled: false }, { owned: true, enabled: true }];
  for (const correction of review.items) {
    const item = byId.get(correction.id);
    const key = groups[item.type];
    const identities = [
      { name: item.name }, { name: correction.previousName }, { id: item.id },
      { id: item.id, name: 'Misleading imported display label' },
      ...item.aliases.map(name => ({ name }))
    ];
    for (const identity of identities) for (const flags of flagCases) {
      const input = { [key]: [{ ...identity, ...flags, source: 'Old source', subgroup: 'Stale category', warbond: 'Old Warbond',
        acquisition: { kind: 'custom' }, customMetadata: { preserved: [item.id, 'user note'] } }] };
      input.cards = [{ id: 'history', booster: 'Sample Extractor', stratagems: ['Warp Pack'], scoreRaw: 227, statsLocked: true, fingerprint: 'unaltered', notes: 'Keep history' }];
      const before = JSON.stringify(input);
      const migrated = catalogState.mergeItems(base, input);
      const actual = migrated[key].find(row => row.id === item.id);
      assert.equal(actual.name, item.name);
      assert.equal(actual.enabled, flags.enabled);
      assert.equal(actual.owned, Object.hasOwn(flags, 'owned') ? flags.owned : flags.enabled);
      assert.deepEqual(actual.customMetadata, input[key][0].customMetadata);
      for (const field of ['warbond', 'subgroup', 'source', 'aliases', 'acquisition']) assert.deepEqual(actual[field], item[field]);
      assert.equal(migrated[key].length, base[key].length);
      assert.equal(migrated[key].filter(row => row.id === item.id).length, 1);
      assert.equal(Object.hasOwn(migrated, 'cards'), false, 'Gear-only engine leaves historical cards under caller ownership');
      assert.deepEqual(catalogState.mergeItems(base, migrated), migrated);
      assert.equal(JSON.stringify(input), before);
    }
  }
  assert.equal(JSON.stringify(base), baseBefore);
});

test('five full-name stratagem aliases are explicit compatibility facts and a booster correction keeps its old name', () => {
  const aliasCorrections = review.items.filter(item => Object.hasOwn(item, 'aliases') && item.id.startsWith('stratagem:'));
  assert.deepEqual(aliasCorrections.map(item => item.id).sort(), officialStratagemAliasIds.slice().sort());
  for (const correction of aliasCorrections) {
    assert.deepEqual(correction.aliases, officialStratagemAliases[correction.id]);
    assert.deepEqual(byId.get(correction.id).aliases, correction.aliases);
  }
  const renamed = review.items.filter(item => Object.hasOwn(item, 'name'));
  assert.equal(renamed.length, 1);
  assert.equal(renamed[0].id, 'booster:sample-extractor');
  assert.equal(renamed[0].name, 'Sample Extricator');
  assert.ok(byId.get(renamed[0].id).aliases.includes('Sample Extractor'));
});

test('taxonomy changes are explicitly reviewed and distinguish community menu evidence from official acquisition', () => {
  const corrections = review.items.filter(item => Object.hasOwn(item, 'subgroup'));
  const allowed = new Map([
    ['stratagem:warp-pack', 'backpack'], ['stratagem:hover-pack', 'backpack'],
    ['stratagem:portable-hellbomb', 'backpack'], ['throwable:ted-63-dynamite', 'grenade']
  ]);
  assert.equal(corrections.length, 4);
  for (const correction of corrections) {
    assert.equal(correction.subgroup, allowed.get(correction.id), `Reviewed subgroup change: ${correction.id}`);
    assert.equal(byId.get(correction.id).subgroup, correction.subgroup);
    assert.equal(correction.acquisition.verification, 'primary-source');
    assert.ok(correction.acquisition.notes || correction.acquisition.sourceUrl, 'Taxonomy correction retains its source context');
  }
  assert.match(byId.get('throwable:ted-63-dynamite').acquisition.notes, /community/i);
  assert.match(byId.get('throwable:ted-63-dynamite').acquisition.notes, /https:\/\/helldivers\.wiki\.gg\/wiki\/TED-63_Dynamite/);
  for (const original of baseline.reviewedRows) {
    const correction = review.items.find(item => item.id === original.id);
    if (!Object.hasOwn(correction, 'subgroup')) assert.equal(byId.get(original.id).subgroup, original.subgroup);
  }
});

test('derived analytics combine new full-name aliases and any old booster spelling without rewriting Result history', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const section = (first, next) => {
    const start = html.indexOf(`        function ${first}`);
    const end = html.indexOf(`        function ${next}`, start);
    assert.ok(start >= 0 && end > start, `Runtime boundaries: ${first}`);
    return html.slice(start, end);
  };
  const aliases = officialStratagemAliasIds.map(id => ({ id, type: 'stratagem', canonical: byId.get(id).name, alias: byId.get(id).aliases[0] }));
  aliases.push({ id: 'booster:sample-extractor', type: 'booster', canonical: byId.get('booster:sample-extractor').name, alias: 'Sample Extractor' });
  const cards = aliases.flatMap((spec, index) => [spec.alias, spec.canonical].map((name, variant) => ({
    id: `batch3-history-${index}-${variant}`, createdAt: `2026-09-14T12:${String(index).padStart(2, '0')}:00.000Z`,
    ...(spec.type === 'stratagem' ? { stratagems: [name] } : { booster: name }),
    majorOrderDone: variant === 0, grade: 75, scoreRaw: 210, fingerprint: `original-${name}`,
    statsLocked: true, notes: 'Immutable legacy result', stats: { kills: 333 }
  })));
  const state = { items: defaults(), cards: structuredClone(cards) };
  const context = vm.createContext({
    state, DEFAULTS: { items: defaults() }, ITEM_LIST_METADATA: Object.entries(groups).map(([visualCategory, key]) => ({ key, visualCategory })),
    window: { HD2CSMCatalogState: catalogState }, sortCardsByRankOrder: values => values.slice(),
    isCardComplete: () => true, tierForPlace: () => 'rainbow', clamp: (value, min, max) => Math.max(min, Math.min(max, value))
  });
  vm.runInContext([
    section('createCatalogAnalyticsResolver()', 'getArmoryExpandedGroups()'),
    section('getCardItems(card)', 'getStratGroup('),
    section('buildItemAnalytics(cards = [])', 'renderItemInsights(')
  ].join('\n'), context);
  const before = JSON.stringify(state);
  const armory = context.buildArmoryAnalyticsData().filter(item => item.rolledCount);
  const detailed = context.buildItemAnalytics(state.cards).itemStats;
  assert.equal(armory.length, aliases.length); assert.equal(detailed.length, aliases.length);
  for (const spec of aliases) {
    const first = armory.find(item => item.key === `${spec.type}|${spec.id}`);
    const second = detailed.find(item => item.key === `${spec.type}|${spec.id}`);
    assert.equal(first.name, spec.canonical); assert.equal(second.name, spec.canonical);
    assert.equal(first.rolledCount, 2); assert.equal(second.total, 2);
    assert.equal(first.moSuccessCount, 1); assert.equal(second.moSuccess, 1);
  }
  assert.equal(JSON.stringify(state), before);
});

function imageHeader(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
    return { format: 'png', width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  assert.equal(bytes.readUInt16BE(0), 0xffd8);
  const frames = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let position = 2;
  while (position < bytes.length) {
    assert.equal(bytes[position++], 0xff);
    while (bytes[position] === 0xff) position++;
    const marker = bytes[position++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(position);
    assert.ok(length >= 2 && position + length <= bytes.length);
    if (frames.has(marker)) return { format: 'jpg', height: bytes.readUInt16BE(position + 3), width: bytes.readUInt16BE(position + 5) };
    position += length;
  }
  assert.fail('JPEG dimensions missing');
}

test('batch 3 artwork is bundled in original format with exact provenance, source associations and hashes', () => {
  const sources = provenance.assets.filter(source => Object.hasOwn(expectedSets, source.name));
  assert.equal(sources.length, 3);
  assert.equal(new Set(sources.map(source => source.name)).size, 3);
  for (const source of sources) {
    const bond = review.warbonds.find(row => row.name === source.name);
    assert.equal(bond.sourceUrl, source.sourcePage);
    assert.equal(source.sourcePage, sourcePages[source.name]);
    assert.equal(source.imageUrl, originalImageUrls[source.name]);
    assert.equal(bond.coverAssetPath, source.assetPath);
    assert.equal(bond.coverKind, source.sourceKind);
    assert.match(source.sourceKind, /^official-promotional-/);
    assert.equal(new URL(source.imageUrl).protocol, 'https:');
    assert.equal(new URL(source.imageUrl).hostname, 'blog.playstation.com');
    assert.match(bond.notes, /not an exact in-game cover/i);
    const bytes = fs.readFileSync(path.join(root, source.assetPath));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256);
    const actual = imageHeader(bytes);
    assert.equal(actual.format, 'jpg', 'All three official originals in this reviewed batch are JPEG files');
    assert.equal(path.extname(source.assetPath), '.' + actual.format);
    assert.equal(actual.width, source.width); assert.equal(actual.height, source.height);
    assert.ok(actual.width >= 1280 && actual.height >= 720);
  }
  assert.match(provenance.rightsNotice, /not relicensed/i);
});
