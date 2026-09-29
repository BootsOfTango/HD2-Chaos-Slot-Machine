const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ownership = require('../assets/catalog-state');
const source = fs.readFileSync(path.join(__dirname, '../assets/catalog-ui.js'), 'utf8');
const start = source.indexOf('    window.matchesArmoryOwnership =');
const end = source.indexOf('    function mountArmoryBrowser()', start);
assert(start >= 0 && end > start);
function filter(mode) {
  const context = { window: {}, ownership, document: { getElementById: () => ({ value: mode }) } };
  vm.runInNewContext(source.slice(start, end), context);
  return context.window.matchesArmoryOwnership;
}
const items = [
  { name: 'Eligible', owned: true, enabled: true },
  { name: 'Owned excluded', owned: true, enabled: false },
  { name: 'Not owned', owned: false, enabled: false },
  { name: 'Inconsistent old record', owned: false, enabled: true },
  { name: 'Legacy eligible', enabled: true }
];
test('Armory included/excluded filters partition the actual eligible pool', () => {
  assert.deepEqual(items.filter(filter('enabled')), items.filter(ownership.isEligible));
  assert.deepEqual(items.filter(filter('excluded')), items.filter(item => !ownership.isEligible(item)));
  assert.equal(items.filter(filter('enabled')).length + items.filter(filter('excluded')).length, items.length);
});
test('owned is independent from enabled, including legacy ownership', () => {
  assert.deepEqual(items.filter(filter('owned')).map(item => item.name), ['Eligible', 'Owned excluded', 'Legacy eligible']);
  assert.equal(items.filter(filter('unowned')).length, 2);
});
test('all and unknown filters never silently hide equipment', () => {
  for (const mode of ['all', '', 'future-filter']) assert.equal(items.filter(filter(mode)).length, items.length);
});
test('Armory filtering never normalizes or mutates saved records', () => {
  const records = items.map(item => Object.freeze({ ...item }));
  const before = JSON.stringify(records);
  for (const mode of ['all', 'owned', 'unowned', 'enabled', 'excluded']) records.filter(filter(mode));
  assert.equal(JSON.stringify(records), before);
});
test('Armory session filters do not add a separate persistent ownership store', () => {
  const mount = source.slice(source.indexOf('    function mountArmoryBrowser()'), source.indexOf('    const newItems ='));
  assert(!/localStorage|saveState\(/.test(mount));
  assert.match(mount, /CLEAR FILTERS/);
});
