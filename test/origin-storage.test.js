const test = require('node:test');
const assert = require('node:assert/strict');
const migration = require('../assets/origin-storage');
const primary = 'hd2_chaos_slot_machine_v1', backup = 'hd2_chaos_slot_machine_backup_v1';
const cache = 'hd2_live_planets_cache_v1', view = 'hd2_items_view_mode';
function memory(entries = {}) {
  const values = new Map(Object.entries(entries));
  return { values, getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => { values.set(key, value); }, removeItem: key => { values.delete(key); } };
}
test('origin snapshot allowlists keys and copies without modifying old storage', () => {
  const source = memory({ [primary]: '{"cards":[]}', [backup]: 'damaged retained backup', [cache]: '{"old":"cache"}',
    [view]: 'category', unrelated: 'must not cross origins' });
  const before = new Map(source.values), target = memory();
  const result = migration.copyMissing(target, migration.snapshot(source));
  assert.equal(result.copied.length, 4); assert.equal(target.getItem(primary), source.getItem(primary));
  assert.equal(target.getItem(backup), 'damaged retained backup'); assert.equal(target.getItem('unrelated'), null);
  assert.deepEqual(source.values, before); assert.equal(target.getItem(migration.MARKER), '1');
});
test('existing destination primary OR backup, including damaged saves, wins as a family', () => {
  for (const destination of [{ [primary]: 'existing save' }, { [backup]: 'newer valid backup' }, { [primary]: 'damaged existing save' }]) {
    const target = memory(destination);
    migration.copyMissing(target, { [primary]: 'old primary', [backup]: 'old backup', [view]: 'category' });
    for (const key of [primary, backup]) assert.equal(target.getItem(key), destination[key] ?? null);
    assert.equal(target.getItem(view), 'category');
  }
});
test('existing preferences win and completed migration never resurrects deleted data', () => {
  const target = memory({ [view]: 'warbond' });
  migration.copyMissing(target, { [view]: 'category', [cache]: 'old cache' });
  target.removeItem(cache);
  assert.equal(migration.copyMissing(target, { [cache]: 'old cache' }).reason, 'already-migrated');
  assert.equal(target.getItem(view), 'warbond'); assert.equal(target.getItem(cache), null);
});
test('missing legacy data is a successful empty migration, corrupt data stays recoverable', () => {
  const target = memory(); assert.deepEqual(migration.copyMissing(target, {}).copied, []);
  const damaged = memory(); migration.copyMissing(damaged, { [primary]: '{broken', [backup]: '{"cards":[]}' });
  assert.equal(damaged.getItem(primary), '{broken'); assert.equal(damaged.getItem(backup), '{"cards":[]}');
});
test('copy failure rolls back only new keys and permits a safe retry', () => {
  const target = memory({ [view]: 'warbond' }), original = target.setItem;
  target.setItem = (key, value) => { if (key === migration.MARKER) throw Error('quota'); original(key, value); };
  assert.throws(() => migration.copyMissing(target, { [primary]: 'data', [cache]: 'cache' }), { code: 'ORIGIN_COPY_FAILED' });
  assert.deepEqual(Object.fromEntries(target.values), { [view]: 'warbond' });
  target.setItem = original; assert.equal(migration.copyMissing(target, { [primary]: 'data' }).copied.length, 1);
});
test('rollback failure is explicit and never marked complete', () => {
  const target = memory(), original = target.setItem;
  target.setItem = (key, value) => { if (key === migration.MARKER) throw Error('quota'); original(key, value); };
  target.removeItem = () => { throw Error('storage unavailable'); };
  assert.throws(() => migration.copyMissing(target, { [primary]: 'data' }), { code: 'ORIGIN_ROLLBACK_INCOMPLETE' });
  assert.equal(target.getItem(migration.MARKER), null);
});
test('unexpected values, keys, markers and oversized copies fail before writes', () => {
  for (const source of [null, [], { other: 'private' }, { [primary]: {} }, JSON.parse('{"__proto__":"bad"}')]) {
    const target = memory(); assert.throws(() => migration.copyMissing(target, source)); assert.equal(target.values.size, 0);
  }
  assert.throws(() => migration.validateSnapshot({ [cache]: 'a'.repeat(migration.MAX_VALUE_BYTES + 1) }), /limits/);
  const target = memory({ [migration.MARKER]: 'future-version' });
  assert.throws(() => migration.copyMissing(target, {}), /Unrecognized/); assert.equal(target.values.size, 1);
});
