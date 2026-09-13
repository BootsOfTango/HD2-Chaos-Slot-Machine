const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { mergeItems, isEligible, setOwned, setEnabled, normalizeName } = require('../assets/catalog-state');

function defaults() {
  return {
    primaries: [
      { id: 'primary:rifle', name: 'Rifle Canonical', aliases: ['Old Rifle'], type: 'primary', subgroup: 'rifle', source: 'Reviewed source', enabled: true, owned: true },
      { id: 'primary:new', name: 'New Rifle', aliases: ['Future Rifle'], type: 'primary', enabled: false, owned: false }
    ],
    sidearms: [{ id: 'sidearm:pistol', name: 'Pistol', aliases: [], enabled: true, owned: true }],
    throwables: [], stratagems: [], boosters: [], planets: [{ name: 'Untouched planet' }]
  };
}

test('fresh groups are independent default clones, with new gear opt-in', () => {
  const base = defaults();
  const merged = mergeItems(base);
  assert.deepEqual(merged.primaries, base.primaries);
  assert.notStrictEqual(merged.primaries[0], base.primaries[0]);
  assert.equal(isEligible(merged.primaries[1]), false);
  assert.equal(Object.hasOwn(merged, 'planets'), false);
});

test('legacy true/false eligibility migrates without changing supplied source objects', () => {
  const base = defaults();
  const saved = { primaries: [{ name: 'Rifle Canonical', enabled: false }, { name: 'New Rifle', enabled: true }] };
  const before = JSON.stringify({ base, saved });
  const merged = mergeItems(base, saved);
  assert.equal(merged.primaries[0].enabled, false);
  assert.equal(merged.primaries[0].owned, false);
  assert.equal(merged.primaries[1].enabled, true);
  assert.equal(merged.primaries[1].owned, true);
  assert.equal(JSON.stringify({ base, saved }), before);
});

test('missing row inside explicit group remains present but disabled/unowned', () => {
  const merged = mergeItems(defaults(), { primaries: [] });
  assert.equal(merged.primaries.length, 2);
  assert.ok(merged.primaries.every(row => row.enabled === false && row.owned === false));
  assert.equal(merged.sidearms[0].enabled, true);
});

test('missing legacy enabled flag falls back to matching catalog eligibility', () => {
  const merged = mergeItems(defaults(), { primaries: [{ name: 'Old Rifle' }, { name: 'New Rifle' }] });
  assert.equal(merged.primaries[0].owned, true);
  assert.equal(merged.primaries[0].enabled, true);
  assert.equal(merged.primaries[1].owned, false);
  assert.equal(merged.primaries[1].enabled, false);
});

test('stable ID beats changed name; canonical facts override stale facts, custom fields survive', () => {
  const merged = mergeItems(defaults(), { primaries: [{ id: 'primary:rifle', name: 'Completely old label', aliases: ['Stale alias'], enabled: false, owned: true, source: 'Old source', subgroup: 'Wrong category', note: { keep: 'user data' } }] });
  const row = merged.primaries[0];
  assert.equal(row.name, 'Rifle Canonical');
  assert.equal(row.source, 'Reviewed source');
  assert.equal(row.subgroup, 'rifle');
  assert.deepEqual(row.aliases, ['Old Rifle']);
  assert.deepEqual(row.note, { keep: 'user data' });
  assert.equal(row.enabled, false);
  assert.equal(row.owned, true);
});

test('known ID-only ownership records do not require redundant saved catalog names', () => {
  const row = mergeItems(defaults(), { primaries: [{ id: 'primary:rifle', enabled: false, owned: true }] }).primaries[0];
  assert.equal(row.name, 'Rifle Canonical');
  assert.equal(row.enabled, false);
  assert.equal(row.owned, true);
});

test('name and explicit aliases normalize only within the item category', () => {
  const merged = mergeItems(defaults(), { primaries: [{ name: 'OLD-RIFLE', enabled: false }], sidearms: [{ name: 'Old Rifle', enabled: true }] });
  assert.equal(merged.primaries[0].id, 'primary:rifle');
  assert.equal(merged.primaries.length, 2);
  assert.equal(merged.sidearms.length, 2);
  assert.match(merged.sidearms[1].id, /^custom:sidearm:/);
  assert.equal(normalizeName('Spray & Pray'), normalizeName('Spray and Pray'));
});

test('canonical ID then canonical name then alias determines duplicate winner, without OR-ing flags', () => {
  const saved = { primaries: [
    { name: 'Old Rifle', enabled: true, note: 'alias' },
    { name: 'Rifle Canonical', enabled: true, note: 'name' },
    { id: 'primary:rifle', name: 'Old Rifle', enabled: false, owned: true, note: 'id' }
  ] };
  const row = mergeItems(defaults(), saved).primaries[0];
  assert.equal(row.enabled, false);
  assert.equal(row.owned, true);
  assert.equal(row.note, 'id');
  assert.equal(row.legacyAliasRecords.length, 2);
  assert.deepEqual(new Set(row.legacyAliasRecords.map(record => record.note)), new Set(['alias', 'name']));
  const withoutId = mergeItems(defaults(), { primaries: saved.primaries.slice(0, 2) }).primaries[0];
  assert.equal(withoutId.note, 'name');
});

test('equal-priority duplicates retain first record and preserve the other record', () => {
  const row = mergeItems(defaults(), { primaries: [{ name: 'Old Rifle', enabled: false, original: 1 }, { name: 'Old Rifle', enabled: true, original: 2 }] }).primaries[0];
  assert.equal(row.enabled, false);
  assert.equal(row.legacyAliasRecords[0].original, 2);
});

test('alias recovery is deduplicated and migration is idempotent', () => {
  const first = mergeItems(defaults(), { primaries: [{ name: 'Old Rifle', enabled: false, legacyAliasRecords: [{ name: 'Historic Rifle', enabled: false }] }, { name: 'Rifle Canonical', enabled: true }] });
  const second = mergeItems(defaults(), first);
  assert.deepEqual(second, first);
  assert.deepEqual(mergeItems(defaults(), second), first);
  assert.ok(first.primaries[0].legacyAliasRecords.some(record => record.name === 'Historic Rifle'));
});

test('unknown rows get deterministic category-scoped custom IDs and retain arbitrary fields', () => {
  const saved = { primaries: [{ name: 'My Blaster', enabled: true, arbitrary: { value: 42 } }], sidearms: [{ name: 'My Blaster', enabled: false }] };
  const first = mergeItems(defaults(), saved);
  const custom = first.primaries.at(-1);
  assert.equal(custom.id, 'custom:primary:my-blaster');
  assert.equal(custom.owned, true);
  assert.deepEqual(custom.arbitrary, { value: 42 });
  assert.notEqual(custom.id, first.sidearms.at(-1).id);
  assert.deepEqual(mergeItems(defaults(), first), first);
});

test('known future/custom IDs are retained when currently unknown to the catalog', () => {
  const saved = { primaries: [{ id: 'primary:future', name: 'Future content', enabled: false, owned: true }] };
  const first = mergeItems(defaults(), saved);
  assert.equal(first.primaries.at(-1).id, 'primary:future');
  const newer = defaults();
  newer.primaries.push({ id: 'primary:future', name: 'Renamed future content', aliases: [], enabled: false, owned: false });
  const upgraded = mergeItems(newer, first);
  assert.equal(upgraded.primaries.at(-1).name, 'Renamed future content');
  assert.equal(upgraded.primaries.at(-1).owned, true);
  assert.equal(upgraded.primaries.at(-1).enabled, false);
});

test('symbol-only custom names do not all collapse onto one ID', () => {
  const result = mergeItems(defaults(), { primaries: [{ name: '☢', enabled: true }, { name: '☣', enabled: false }] });
  assert.notEqual(result.primaries.at(-1).id, result.primaries.at(-2).id);
  assert.deepEqual(mergeItems(defaults(), result), result);
});

test('ambiguous aliases stay custom instead of enabling an arbitrary known item', () => {
  const base = defaults();
  base.primaries[1].aliases.push('Old Rifle');
  const result = mergeItems(base, { primaries: [{ name: 'Old Rifle', enabled: true }] });
  assert.equal(result.primaries.length, 3);
  assert.ok(result.primaries.slice(0, 2).every(item => !isEligible(item)));
  assert.match(result.primaries[2].id, /^custom:/);
});

test('repeating an import against defaults does not retain unrelated session custom rows', () => {
  const saved = { primaries: [{ name: 'Old Rifle', enabled: false }] };
  const first = mergeItems(defaults(), saved);
  first.primaries.push({ id: 'custom:primary:session', name: 'Session', enabled: true });
  const again = mergeItems(defaults(), saved);
  assert.equal(again.primaries.some(row => row.name === 'Session'), false);
});

test('explicit ownership is retained and never permits an unowned entry to roll', () => {
  const result = mergeItems(defaults(), { primaries: [{ name: 'Rifle Canonical', enabled: true, owned: false }] });
  assert.equal(result.primaries[0].enabled, false);
  assert.equal(result.primaries[0].owned, false);
  assert.equal(result.primaries[0].legacyAliasRecords[0].enabled, true);
  assert.equal(isEligible(result.primaries[0]), false);
  assert.equal(isEligible({ enabled: 'true', owned: true }), false);
  assert.equal(isEligible({ enabled: false, owned: true }), false);
  assert.equal(isEligible(null), false);
});

test('ownership and enabled controls stay separate and reject unsafe input', () => {
  const item = { enabled: true, owned: true };
  assert.equal(setOwned(item, false), true);
  assert.deepEqual(item, { enabled: false, owned: false });
  assert.equal(setEnabled(item, true), false);
  assert.equal(setOwned(item, true), true);
  assert.equal(item.enabled, false);
  assert.equal(setEnabled(item, true), true);
  assert.equal(isEligible(item), true);
  assert.equal(setOwned(item, 'false'), false);
  assert.equal(setEnabled(item, 'true'), false);
  assert.equal(setEnabled(null, false), false);
});

test('invalid gear shape and ambiguous catalog identities fail without mutating inputs', () => {
  assert.throws(() => mergeItems(defaults(), { primaries: {} }), /must be an array/);
  assert.throws(() => mergeItems(defaults(), { primaries: [null] }), /nonempty name/);
  const base = defaults();
  base.primaries[1].id = base.primaries[0].id;
  assert.throws(() => mergeItems(base, { primaries: [] }), /Duplicate/);
});

test('UMD browser entry exposes the same pure interface without a Node runtime', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/catalog-state.js'), 'utf8'), context);
  assert.equal(typeof context.HD2CSMCatalogState.mergeItems, 'function');
  assert.equal(context.HD2CSMCatalogState.isEligible({ enabled: true, owned: false }), false);
});
