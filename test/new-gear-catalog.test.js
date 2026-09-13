const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
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
  assert.equal(new Set(ids).size, ids.length);
  for (const item of catalog.items) {
    assert.ok(item.id.startsWith(item.type + ':'), item.name);
    assert.equal(Object.hasOwn(item, 'owned'), false, item.name);
    assert.equal(Object.hasOwn(item, 'enabled'), false, item.name);
    assert.ok(Array.isArray(item.aliases), item.name);
    assert.ok(item.acquisition.kind, item.name);
    assert.equal(item.assetPath, mapping[item.type].find(row => row.name === item.name).assetPath, item.name);
  }
});

test('all six new bundled assets match recorded hashes and the traced Eagle limitation is explicit', () => {
  assert.equal(provenance.assets.length, 6);
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
