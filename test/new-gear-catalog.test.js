const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { normalizeName } = require('../assets/catalog-state');
const root = path.resolve(__dirname, '..');
const catalog = require('../assets/item-catalog.json');
const mapping = require('../assets/item-images.json');
const provenance = require('../assets/new-gear/provenance.json');

test('reviewed release adds exactly four Castellans Creed items and a separate Eagle reward, all opt-in', () => {
  const items = catalog.items.filter(item => item.introducedIn === '1.1.2');
  assert.equal(items.length, 5);
  assert.deepEqual(items.map(item => item.type), ['primary', 'sidearm', 'throwable', 'stratagem', 'stratagem']);
  assert.ok(items.every(item => item.defaultEnabled === false && item.acquisition.sourceUrl.startsWith('https:')));
  const warbond = catalog.warbonds.find(row => row.id === 'warbond:castellans-creed');
  assert.deepEqual(items.filter(item => item.acquisition.kind === 'warbond').map(item => item.id), warbond.equipmentIds);
  assert.equal(warbond.equipmentIds.length, 4);
  const eagle = items.find(item => item.name === 'Eagle Gas Airstrike');
  assert.equal(eagle.subgroup, 'eagle');
  assert.equal(eagle.acquisition.kind, 'campaign-reward');
  assert.notEqual(eagle.id, catalog.items.find(item => item.name === 'Orbital Gas Strike').id);
  assert.ok(items.find(item => item.type === 'throwable').aliases.includes('G/40-K Meltamine'));
});

test('all catalog identities are stable and type scoped; facts do not contain player ownership', () => {
  const ids = catalog.items.map(item => item.id);
  assert.equal(ids.length, 214);
  assert.equal(new Set(ids).size, ids.length);
  const claimedLegacy = new Set();
  const names = new Map();
  for (const item of catalog.items) {
    assert.ok(item.id.startsWith(item.type + ':'), item.name);
    assert.equal(Object.hasOwn(item, 'owned'), false, item.name);
    assert.equal(Object.hasOwn(item, 'enabled'), false, item.name);
    assert.ok(Array.isArray(item.aliases), item.name);
    assert.ok(item.acquisition.kind, item.name);
    assert.equal(item.assetPath, mapping[item.type].find(row => row.id === item.id).assetPath, item.name);
    for (const id of item.legacyIds || []) {
      assert.ok(id.startsWith(item.type + ':'), id);
      assert.equal(ids.includes(id), false, `${id} cannot be both canonical and retired`);
      assert.equal(claimedLegacy.has(id), false, `${id} must have exactly one canonical owner`);
      claimedLegacy.add(id);
    }
    for (const label of [item.name, ...item.aliases]) {
      const key = `${item.type}:${normalizeName(label)}`;
      assert.ok(!names.has(key) || names.get(key) === item.id, `Ambiguous category-scoped alias: ${label}`);
      names.set(key, item.id);
    }
  }
  assert.deepEqual([...claimedLegacy].sort(), ['stratagem:ems-strike', 'stratagem:wasp']);
  assert.equal(ids.length + claimedLegacy.size, 216, 'Every prior stable ID remains canonical or explicitly recoverable, plus Hyena and eight Ironclad-era additions');
});

test('catalog validator rejects retired-ID/category/alias collisions and noncanonical image records', () => {
  const first = { id: 'primary:first', type: 'primary', name: 'First', aliases: ['Old First'], legacyIds: ['primary:retired'], assetPath: 'assets/first.png' };
  const second = { id: 'primary:second', type: 'primary', name: 'Second', aliases: [], assetPath: 'assets/second.png' };
  const fixture = { items: [first, second], images: { primary: [first, second].map(item => ({ id: item.id, name: item.name, assetPath: item.assetPath })), sidearm: [], throwable: [], stratagem: [], booster: [] } };
  const variants = [];
  const add = mutate => { const value = structuredClone(fixture); mutate(value); variants.push(value); };
  add(value => { value.items[0].id = 'sidearm:first'; });
  add(value => { value.items[0].legacyIds = ['sidearm:retired']; });
  add(value => { value.items[0].legacyIds = ['primary:second']; });
  add(value => { value.items[1].legacyIds = ['primary:retired']; });
  add(value => { value.items[1].aliases = ['OLD-FIRST']; });
  add(value => { value.images.primary[0].id = 'primary:retired'; });
  add(value => { value.images.primary.push(structuredClone(value.images.primary[0])); });
  add(value => { value.images.primary[0].assetPath = 'assets/retired.png'; });
  const run = spawnSync('python', ['-B', '-c',
    'import importlib.util,json,sys; spec=importlib.util.spec_from_file_location("catalog_validator","scripts/validate_item_catalog.py"); module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module); fixtures=json.load(sys.stdin); print(json.dumps([module.validate_identity_contracts(f["items"],f["images"]) for f in fixtures]))'
  ], { cwd: root, input: JSON.stringify([fixture, ...variants]), encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.error?.message);
  const errors = JSON.parse(run.stdout);
  assert.deepEqual(errors[0], []);
  assert.equal(errors.length, 9);
  for (let index = 1; index < errors.length; index++) assert.ok(errors[index].length > 0, `Invalid identity/image fixture ${index} must fail validation`);
});

test('six original gear assets plus the replacement Meltagun icon match recorded hashes', () => {
  assert.equal(provenance.assets.length, 7);
  for (const asset of provenance.assets) {
    assert.ok(asset.assetPath.startsWith('assets/new-gear/'));
    const bytes = fs.readFileSync(path.join(root, asset.assetPath));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.name);
    if (asset.assetPath.endsWith('.svg')) {
      assert.doesNotMatch(bytes.toString(), /<script|<foreignObject|\bon\w+\s*=|(?:href|src)\s*=\s*["']https?:/i);
    }
  }
  const eagle = provenance.assets.find(asset => asset.name === 'Eagle Gas Airstrike');
  assert.equal(eagle.sourceKind, 'community-hand-trace-of-game-icon');
  assert.match(eagle.contributor, /Dogo314/);
  assert.ok(eagle.limitation && eagle.useCondition);
});
