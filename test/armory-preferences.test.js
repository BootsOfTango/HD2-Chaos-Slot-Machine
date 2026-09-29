const test = require('node:test');
const assert = require('node:assert/strict');
const prefs = require('../assets/armory-preferences');
const transfer = require('../assets/transfer-validation');
const storage = require('../electron/storage');
const catalog = require('../assets/item-catalog.json');
test('missing preferences migrate valid legacy view and type without modifying input', () => {
  const legacy = Object.freeze({ viewMode: 'warbond', typeFilter: 'primary' });
  assert.deepEqual(prefs.normalize(undefined, legacy), { ...prefs.defaults(), viewMode: 'warbond', typeFilter: 'primary' });
  assert.deepEqual(prefs.normalize(undefined, { viewMode: 'bad', typeFilter: 'bad' }), prefs.defaults());
});
test('new preferences take precedence and are copied independently', () => {
  const input = { ...prefs.defaults(), expandedGroups: ['weapons', 'role:eagle', 'source:Custom <title>', 'weapons'] };
  const actual = prefs.normalize(input, { viewMode: 'warbond' });
  assert.equal(actual.viewMode, 'category'); assert.equal(actual.expandedGroups.length, 3);
  actual.expandedGroups.push('boosters'); assert.equal(input.expandedGroups.length, 4);
});
test('all preferences survive desktop envelopes and plain browser exports', () => {
  const data = { settings: { armoryBrowser: { ...prefs.defaults(), viewMode: 'warbond', typeFilter: 'stratagem', ownershipFilter: 'owned', expandedGroups: ['stratagems', 'role:eagle', 'source:Castellan\'s Creed'] } } };
  assert.deepEqual(transfer.parse(transfer.serialize(data)), data);
  assert.deepEqual(storage.parseSave(JSON.stringify(storage.wrapData(data))), data);
  assert.deepEqual(transfer.parse(JSON.stringify(storage.wrapData(data))), data);
});
test('malformed preferences are rejected consistently before a save or import', () => {
  for (const patch of [{ viewMode: 'bad' }, { typeFilter: 'bad' }, { ownershipFilter: 'bad' }, { expandedGroups: ['__proto__'] }, { expandedGroups: Array(201).fill('weapons') }, { expandedGroups: ['source:' + 'x'.repeat(161)] }, { search: 'stale search' }, { expandedGroups: [123] }, { version: '1' }]) {
    const data = { settings: { armoryBrowser: { ...prefs.defaults(), ...patch } } };
    assert.throws(() => transfer.validateData(data), /Armory/);
    assert.throws(() => storage.wrapData(data), /Armory/);
  }
  for (const value of [null, [], false]) assert.throws(() => transfer.validateData({ settings: { armoryBrowser: value } }), /Armory/);
});
test('future preferences fail closed using the unsupported-save guard', () => {
  assert.throws(() => prefs.normalize({ ...prefs.defaults(), version: 2 }), { code: 'UNSUPPORTED_SAVE_VERSION' });
});
test('custom group labels outside preference bounds remain non-persistent', () => {
  assert.equal(prefs.validGroup('source:' + 'a'.repeat(161)), false);
  assert.equal(prefs.validGroup('source:line\nbreak'), false);
  assert.equal(prefs.validGroup('source:Custom <label>'), true);
});
test('older exports without preferences remain valid', () => {
  assert.deepEqual(transfer.parse('{"settings":{}}'), { settings: {} });
  assert.equal(storage.validateData({ settings: {} }), true);
});
test('every bundled stratagem maps to exactly one reviewed subgroup; unknown entries remain custom', () => {
  const stratagems = catalog.items.filter(item => item.type === 'stratagem');
  assert(stratagems.length > 50);
  for (const item of stratagems) assert.equal(prefs.role(item), item.subgroup);
  assert.equal(prefs.role({ subgroup: 'constructor' }), 'other');
  assert.equal(prefs.role({ name: 'Custom support-looking name' }), 'other');
  assert.equal(prefs.role(null), 'other');
});
