const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeItems, isEligible } = require('../assets/catalog-state');

const pairs = [
  { id: 'stratagem:sta-x3-w-a-s-p-launcher', name: 'StA-X3 W.A.S.P. Launcher', legacyId: 'stratagem:wasp', alias: 'WASP' },
  { id: 'stratagem:orbital-ems-strike', name: 'Orbital EMS Strike', legacyId: 'stratagem:ems-strike', alias: 'EMS Strike' }
];
function defaults() {
  return {
    primaries: [{ id: 'primary:custom-rifle', name: 'Custom Rifle', enabled: true, owned: true }],
    sidearms: [], throwables: [], boosters: [],
    stratagems: pairs.map(pair => ({ id: pair.id, name: pair.name, aliases: [pair.alias], legacyIds: [pair.legacyId],
      type: 'stratagem', source: 'Reviewed source', enabled: true, owned: true }))
  };
}
function migrated(pair, rows) {
  return mergeItems(defaults(), { stratagems: rows }).stratagems.find(row => row.id === pair.id);
}
function freezeDeep(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

for (const pair of pairs) {
  test(`${pair.alias}: sole retired ID migrates with original metadata recoverable`, () => {
    const original = { id: pair.legacyId, name: 'Misleading old name', enabled: false, owned: true,
      source: 'Old facts', playerNote: { message: 'Keep this', entries: [1, 2] } };
    const row = migrated(pair, [original]);
    assert.equal(row.id, pair.id);
    assert.equal(row.name, pair.name);
    assert.equal(row.source, 'Reviewed source');
    assert.equal(row.enabled, false);
    assert.equal(row.owned, true);
    assert.deepEqual(row.playerNote, original.playerNote);
    assert.deepEqual(row.legacyAliasRecords, [original]);
    assert.notStrictEqual(row.legacyAliasRecords[0], original);
  });

  test(`${pair.alias}: canonical ID wins in either order without OR-ing ownership or enabled`, () => {
    for (const canonicalFlags of [{ enabled: false, owned: true }, { enabled: false, owned: false }, { enabled: true, owned: true }]) {
      const canonical = { id: pair.id, name: pair.alias, ...canonicalFlags, marker: 'canonical' };
      const retired = { id: pair.legacyId, name: pair.name, enabled: !canonicalFlags.enabled, owned: !canonicalFlags.owned, marker: 'retired' };
      for (const rows of [[canonical, retired], [retired, canonical]]) {
        const row = migrated(pair, rows);
        assert.equal(row.marker, 'canonical');
        assert.equal(row.enabled, canonicalFlags.enabled);
        assert.equal(row.owned, canonicalFlags.owned);
        assert.deepEqual(row.legacyAliasRecords, [retired]);
      }
    }
  });

  test(`${pair.alias}: ID-only retired records take priority over canonical and alias names`, () => {
    const retired = { id: pair.legacyId, enabled: false, owned: true, marker: 'retired' };
    const byName = { name: pair.name, enabled: true, owned: true, marker: 'name' };
    const byAlias = { name: pair.alias, enabled: true, owned: true, marker: 'alias' };
    for (const rows of [[byAlias, byName, retired], [retired, byName, byAlias]]) {
      const row = migrated(pair, rows);
      assert.equal(row.marker, 'retired');
      assert.equal(row.name, pair.name);
      assert.equal(row.enabled, false);
      assert.equal(row.owned, true);
      assert.deepEqual(new Set(row.legacyAliasRecords.map(record => record.marker)), new Set(['retired', 'name', 'alias']));
    }
  });

  test(`${pair.alias}: contradictory retired flags stay unowned and original flags remain recoverable`, () => {
    const original = { id: pair.legacyId, enabled: true, owned: false };
    const row = migrated(pair, [original]);
    assert.equal(row.enabled, false);
    assert.equal(row.owned, false);
    assert.equal(isEligible(row), false);
    assert.deepEqual(row.legacyAliasRecords, [original]);
    const again = mergeItems(defaults(), { stratagems: [row] });
    assert.deepEqual(again.stratagems.find(item => item.id === pair.id), row);
  });

  test(`${pair.alias}: pre-ID name-only export retains its original choice and metadata`, () => {
    for (const flags of [{ enabled: false, owned: true }, { enabled: false, owned: false }, { enabled: true, owned: false }]) {
      const original = { name: pair.alias, ...flags, playerNote: { legacy: 'Before stable IDs', entries: [1, 2] } };
      const row = migrated(pair, [original]);
      assert.equal(row.id, pair.id);
      assert.equal(row.name, pair.name);
      assert.equal(row.enabled, false);
      assert.equal(row.owned, flags.owned);
      assert.deepEqual(row.playerNote, original.playerNote);
      assert.deepEqual(row.legacyAliasRecords, [original]);
      assert.equal(Object.hasOwn(row.legacyAliasRecords[0], 'id'), false);
      assert.deepEqual(migrated(pair, [row]), row);
      assert.deepEqual(migrated(pair, [row, original]), row);
    }
  });
}

test('name-only alias recovery behavior is unchanged for equipment without retired IDs', () => {
  const base = defaults();
  base.primaries[0].aliases = ['Old Custom Rifle'];
  const original = { name: 'Old Custom Rifle', enabled: false, owned: true, playerNote: 'Keep metadata' };
  const row = mergeItems(base, { primaries: [original] }).primaries[0];
  assert.equal(row.id, 'primary:custom-rifle');
  assert.equal(row.playerNote, original.playerNote);
  assert.equal(Object.hasOwn(row, 'legacyAliasRecords'), false);
});

test('retired ID identity beats the other canonical name, with only one roll entry per equipment item', () => {
  const saved = { stratagems: pairs.map((pair, index) => ({ id: pair.legacyId, name: pairs[1 - index].name, enabled: true, marker: pair.alias })) };
  const rows = mergeItems(defaults(), saved).stratagems;
  assert.equal(rows.length, 2);
  assert.equal(rows.filter(isEligible).length, 2);
  pairs.forEach((pair, index) => {
    assert.equal(rows[index].id, pair.id);
    assert.equal(rows[index].marker, pair.alias);
  });
});

test('equal-priority retired duplicates keep the first record and archive every original', () => {
  const pair = pairs[0];
  const first = { id: pair.legacyId, enabled: false, owned: true, marker: 'first' };
  const second = { id: pair.legacyId, enabled: true, owned: true, marker: 'second' };
  const row = migrated(pair, [first, second, first]);
  assert.equal(row.marker, 'first');
  assert.equal(row.enabled, false);
  assert.deepEqual(row.legacyAliasRecords, [first, second]);
});

test('nested recovery records are flattened, fully retained and stable across repeated imports', () => {
  const pair = pairs[0];
  const ancient = { id: 'stratagem:ancient-wasp', name: 'Ancient WASP', extra: { archived: true } };
  const intermediate = { name: 'Middle WASP', enabled: true, legacyAliasRecords: [ancient] };
  const retired = { id: pair.legacyId, enabled: false, owned: true, legacyAliasRecords: [intermediate, ancient] };
  const saved = { stratagems: [retired, { id: pair.id, enabled: true, owned: true, legacyAliasRecords: [ancient] }] };
  const first = mergeItems(defaults(), saved);
  const recovery = first.stratagems[0].legacyAliasRecords;
  assert.equal(recovery.length, 3);
  assert.ok(recovery.every(record => !Object.hasOwn(record, 'legacyAliasRecords')));
  assert.ok(recovery.some(record => record.id === pair.legacyId && record.enabled === false));
  assert.ok(recovery.some(record => record.name === 'Middle WASP'));
  assert.ok(recovery.some(record => record.id === ancient.id));
  let repeated = first;
  for (let iteration = 0; iteration < 10; iteration += 1) repeated = mergeItems(defaults(), repeated);
  assert.deepEqual(repeated, first);
});

test('unknown custom IDs stay independent and retired identities never resolve across categories', () => {
  const saved = {
    primaries: [{ id: pairs[0].legacyId, name: 'A player custom primary', enabled: true, metadata: 42 }],
    stratagems: [{ id: 'custom:stratagem:personal', name: 'A player custom stratagem', enabled: true, metadata: { keep: true } }]
  };
  const result = mergeItems(defaults(), saved);
  assert.equal(result.primaries.at(-1).id, pairs[0].legacyId);
  assert.equal(result.primaries.at(-1).metadata, 42);
  assert.equal(result.stratagems.at(-1).id, 'custom:stratagem:personal');
  assert.deepEqual(result.stratagems.at(-1).metadata, { keep: true });
  assert.ok(result.stratagems.slice(0, 2).every(row => !isEligible(row)));
  assert.throws(() => mergeItems(defaults(), { primaries: [{ id: pairs[0].legacyId, enabled: true }] }), /nonempty name/);
});

test('missing saved groups preserve fresh defaults while explicit empty groups disable all gear', () => {
  const base = defaults();
  const fresh = mergeItems(base);
  assert.deepEqual(fresh.stratagems, base.stratagems);
  assert.notStrictEqual(fresh.stratagems[0].legacyIds, base.stratagems[0].legacyIds);
  assert.ok(mergeItems(base, { stratagems: [] }).stratagems.every(row => !row.owned && !row.enabled));
});

test('migration never mutates even deeply frozen input catalogs, saves and nested recovery', () => {
  const base = freezeDeep(defaults());
  const saved = freezeDeep({ stratagems: [{ id: pairs[0].legacyId, enabled: true,
    legacyAliasRecords: [{ name: 'Ancient', details: { retained: true } }] }] });
  const before = JSON.stringify({ base, saved });
  const result = mergeItems(base, saved);
  assert.equal(JSON.stringify({ base, saved }), before);
  result.stratagems[0].legacyAliasRecords[0].details.retained = false;
  assert.equal(saved.stratagems[0].legacyAliasRecords[0].details.retained, true);
});

test('malformed or cross-category retired IDs fail on fresh boot and do not mutate inputs', () => {
  const invalidValues = [null, 'stratagem:old', {}, [null], [12], [''], ['stratagem:'], ['stratagem:   '],
    [' stratagem:old'], ['stratagem:old '], ['primary:old'], ['custom:stratagem:old']];
  for (const legacyIds of invalidValues) {
    const base = defaults();
    base.stratagems[0].legacyIds = legacyIds;
    const saved = { primaries: [{ name: 'Custom Rifle', enabled: false }] };
    const before = JSON.stringify({ base, saved });
    assert.throws(() => mergeItems(base, saved), /legacyIds must be an array|category-scoped legacy IDs/);
    assert.throws(() => mergeItems(base), /legacyIds must be an array|category-scoped legacy IDs/);
    assert.equal(JSON.stringify({ base, saved }), before);
  }
});

test('duplicate retired IDs and collisions with any canonical ID fail before resolution', () => {
  const cases = [
    base => { base.stratagems[0].legacyIds.push(pairs[0].legacyId); },
    base => { base.stratagems[1].legacyIds.push(pairs[0].legacyId); },
    base => { base.stratagems[0].legacyIds.push(pairs[0].id); },
    base => { base.stratagems[0].legacyIds.push(pairs[1].id); },
    base => { base.stratagems[1].legacyIds.push(pairs[0].id); }
  ];
  for (const change of cases) {
    const base = defaults();
    change(base);
    const before = JSON.stringify(base);
    assert.throws(() => mergeItems(base), /Duplicate stratagem legacy ID|collides with a canonical ID/);
    assert.throws(() => mergeItems(base, { stratagems: [{ id: pairs[0].id, enabled: true }] }), /Duplicate stratagem legacy ID|collides with a canonical ID/);
    assert.equal(JSON.stringify(base), before);
  }
});

test('fresh boot also validates canonical identity scope, duplicate names and explicit malformed groups', () => {
  const wrongScope = defaults();
  wrongScope.stratagems[0].id = 'primary:wrong';
  assert.throws(() => mergeItems(wrongScope), /category-scoped stable ID/);
  const duplicateNames = defaults();
  duplicateNames.stratagems[1].name = duplicateNames.stratagems[0].name;
  assert.throws(() => mergeItems(duplicateNames), /Ambiguous stratagem canonical name/);
  assert.throws(() => mergeItems({ stratagems: null }), /Catalog group stratagems must be an array/);
});
