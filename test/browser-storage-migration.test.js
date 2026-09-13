const test = require('node:test');
const assert = require('node:assert/strict');
const { migrateBrowserStorage } = require('../assets/browser-storage-migration');

function memoryStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), map };
}
const oldKey = 'hd2_chaos_roulette_v1';
const newKey = 'hd2_chaos_slot_machine_v1';
const sample = JSON.stringify({ cards: [{ id: 'legacy-card', statsLocked: true }], settings: { rememberedPlayerName: 'Legacy Diver' } });

test('browser migration copies legacy cards/settings and preserves original keys', () => {
  const storage = memoryStorage({ [oldKey]: sample, hd2_chaos_roulette_locked_stats_audit_v1: '{"legacy-card":"unchanged"}' });
  assert.equal(migrateBrowserStorage(storage).migrated, true);
  assert.equal(storage.getItem(newKey), sample);
  assert.equal(storage.getItem(oldKey), sample);
  assert.equal(storage.getItem('hd2_chaos_slot_machine_locked_stats_audit_v1'), '{"legacy-card":"unchanged"}');
});

test('browser migration recovers a damaged legacy primary from backup without changing either', () => {
  const storage = memoryStorage({ [oldKey]: '{damaged', hd2_chaos_roulette_backup_v1: sample });
  assert.equal(migrateBrowserStorage(storage).recoveredFromBackup, true);
  assert.equal(storage.getItem(newKey), sample);
  assert.equal(storage.getItem(oldKey), '{damaged');
  assert.equal(storage.getItem('hd2_chaos_roulette_backup_v1'), sample);
});

test('browser migration ignores missing or unusable data', () => {
  for (const entries of [{}, { [oldKey]: 'broken' }, { [oldKey]: '{"cards":"bad"}' }]) {
    const storage = memoryStorage(entries);
    assert.equal(migrateBrowserStorage(storage).migrated, false);
    assert.equal(storage.getItem(newKey), null);
  }
});

test('browser migration never overwrites an existing destination and is idempotent', () => {
  for (const existing of ['damaged-but-preserved', JSON.stringify({ cards: [] })]) {
    const storage = memoryStorage({ [oldKey]: sample, [newKey]: existing });
    assert.equal(migrateBrowserStorage(storage).reason, 'destination-exists');
    assert.equal(storage.getItem(newKey), existing);
  }
  const storage = memoryStorage({ [oldKey]: sample });
  migrateBrowserStorage(storage);
  assert.equal(migrateBrowserStorage(storage).migrated, false);
});
