const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const images = require('../assets/item-images.json');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
function section(startText, endText) {
  const start = html.indexOf(startText);
  const end = html.indexOf(endText, start);
  assert.ok(start >= 0 && end > start, `Actual renderer boundary: ${startText.trim()}`);
  return html.slice(start, end);
}
function runtime(data = images) {
  const logs = { errors: [], warnings: [] };
  const context = vm.createContext({
    console: {
      error: message => logs.errors.push(message), warn: message => logs.warnings.push(message),
      groupCollapsed: () => {}, groupEnd: () => {}
    },
    itemVisuals: { loaded: true, byCategory: { primary: new Map(), sidearm: new Map(), throwable: new Map(), stratagem: new Map(), booster: new Map() }, aliases: new Map() }
  });
  vm.runInContext([
    section('        const STRAT_RIM_CLASS_BY_CATEGORY =', '        function normalizeItemKey'),
    section('        function normalizeItemKey', '        function preloadItemVisuals'),
    section('        function validateItemVisualData', '        function attachItemVisualToImage')
  ].join('\n'), context);
  for (const [category, entries] of Object.entries(context.itemVisuals.byCategory)) {
    for (const item of data[category] || []) entries.set(context.normalizeItemKey(item.name), item);
  }
  for (const [alias, canonical] of Object.entries(data.nameAliases || {})) context.itemVisuals.aliases.set(context.normalizeItemKey(alias), canonical);
  return { context, logs };
}

test('actual renderer accepts every bundled stratagem visual category without validation errors', () => {
  const { context, logs } = runtime();
  assert.equal(context.validateItemVisualData(images).errors.length, 0);
  assert.deepEqual(logs.errors, []);
  for (const item of images.stratagem) {
    const visual = context.getItemVisual(item.name, 'stratagem');
    assert.equal(visual.src, item.assetPath);
    assert.match(visual.stratClass, /^strat-rim-(support|eagle|orbital|defensive)$/);
  }
  assert.deepEqual(logs.warnings, [], 'Known bundled categories never need the legacy fallback classifier');
});

test('all eight reviewed backpacks keep support-colored rims for canonical and old/full alias names', () => {
  const { context, logs } = runtime();
  const backpacks = images.stratagem.filter(item => item.rimCategory === 'backpack');
  assert.deepEqual(backpacks.map(item => item.id).sort(), [
    'stratagem:directional-shield', 'stratagem:ax-tx-13-dog-breath', 'stratagem:hover-pack',
    'stratagem:portable-hellbomb', 'stratagem:warp-pack', 'stratagem:ax-arc-3-k-9',
    'stratagem:c4-pack', 'stratagem:hot-dog'
  ].sort());
  for (const item of backpacks) {
    const aliases = Object.entries(images.nameAliases).filter(([, target]) => target === item.name).map(([alias]) => alias);
    for (const name of [item.name, ...aliases]) {
      const visual = context.getItemVisual(name, 'stratagem');
      assert.equal(visual.stratClass, 'strat-rim-support');
      assert.equal(visual.src, item.assetPath);
      assert.equal(visual.kind, 'icon');
    }
  }
  assert.deepEqual(logs.errors, []);
  assert.deepEqual(logs.warnings, []);
});

test('unknown rim categories still fail validation and preserve explicit legacy fallback warnings', () => {
  const data = structuredClone(images);
  const backpack = data.stratagem.find(item => item.id === 'stratagem:warp-pack');
  backpack.rimCategory = 'unknown-test-category';
  const { context, logs } = runtime(data);
  const result = context.validateItemVisualData(data);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /Warp Pack: invalid rimCategory "unknown-test-category"/);
  assert.equal(logs.errors.length, 1);
  assert.equal(context.getItemVisual(backpack.name, 'stratagem').stratClass, 'strat-rim-support');
  assert.equal(logs.warnings.length, 1);
  assert.match(logs.warnings[0], /using legacy classifier/);
});
