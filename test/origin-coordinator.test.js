const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const m = require('../assets/origin-storage');
const { coordinateMigration } = require('../electron/origin-migration');
const { loadStateFile } = require('../electron/storage');
const p = 'hd2_chaos_slot_machine_v1', b = 'hd2_chaos_slot_machine_backup_v1';
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hd2-origin-'));
  t.after(() => { assert.equal(path.dirname(directory), os.tmpdir()); assert(path.basename(directory).startsWith('hd2-origin-')); fs.rmSync(directory, { recursive: true }); });
  const values = new Map();
  const storage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
  const options = { directory, readDestination: async () => ({ marker: storage.getItem(m.MARKER), values: m.snapshot(storage) }),
    readSource: async () => ({ [p]: 'old', [b]: 'backup' }), apply: async writes => m.resumePlan(storage, writes), flush: async () => {} };
  return { directory, values, storage, options, journal: path.join(directory, 'recovery/origin-copy-v1.json') };
}
test('durable plan resumes partial copy without losing remaining save family', async t => {
  const f = fixture(t);
  await assert.rejects(coordinateMigration({ ...f.options, apply: async writes => {
    assert.equal(JSON.parse(fs.readFileSync(f.journal)).status, 'pending');
    f.storage.setItem(p, writes[p]); throw Error('simulated interruption');
  } }), /interruption/);
  await coordinateMigration(f.options);
  assert.equal(f.storage.getItem(b), 'backup');
  assert.equal(JSON.parse(fs.readFileSync(f.journal)).status, 'complete');
});
test('completed journal and marker prevent resurrection, including marker loss', async t => {
  const f = fixture(t); await coordinateMigration(f.options);
  f.values.delete(p); f.values.delete(m.MARKER);
  await coordinateMigration({ ...f.options, readSource: async () => { throw Error('must not read'); } });
  assert.equal(f.storage.getItem(p), null); assert.equal(f.storage.getItem(m.MARKER), '1');
});
test('interruption after marker is idempotent and does not restore removed data', async t => {
  const f = fixture(t);
  await assert.rejects(coordinateMigration({ ...f.options, flush: async () => { throw Error('interrupted'); } }));
  f.values.delete(b); await coordinateMigration(f.options);
  assert.equal(f.storage.getItem(b), null); assert.equal(JSON.parse(fs.readFileSync(f.journal)).status, 'complete');
});
test('damaged journal and conflicting partial values stop without overwriting', async t => {
  const f = fixture(t);
  await assert.rejects(coordinateMigration({ ...f.options, apply: async () => { throw Error('interrupt'); } }));
  f.storage.setItem(p, 'newer'); await assert.rejects(coordinateMigration(f.options), /conflicts/);
  assert.equal(f.storage.getItem(p), 'newer');
  fs.writeFileSync(f.journal, '{bad'); await assert.rejects(coordinateMigration(f.options));
  assert.equal(f.storage.getItem(m.MARKER), null);
});
test('existing destination backup wins over old primary throughout resume', async t => {
  const f = fixture(t); f.storage.setItem(b, 'destination'); await coordinateMigration(f.options);
  assert.equal(f.storage.getItem(p), null); assert.equal(f.storage.getItem(b), 'destination');
});
test('journal flush failure stops before any origin mutation', async t => {
  const f = fixture(t); let applied = false;
  t.mock.method(fs, 'fsyncSync', () => { throw Error('disk flush failed'); });
  await assert.rejects(coordinateMigration({ ...f.options, apply: async () => { applied = true; } }), /disk flush/);
  assert.equal(applied, false); assert.equal(f.values.size, 0); assert.equal(fs.existsSync(f.journal), false);
});
test('fallback validates primary/backup and blocks future or unrecoverable data', t => {
  const f = fixture(t), parse = raw => { const d = JSON.parse(raw); if (d.future) throw Object.assign(Error('future'), { code: 'UNSUPPORTED_SAVE_VERSION' }); return d; };
  const valid = d => { if (!Array.isArray(d.cards)) throw Error('invalid'); };
  assert.equal(m.readFallback(f.storage, parse, valid), null);
  f.storage.setItem(p, '{bad'); f.storage.setItem(b, '{"cards":[]}');
  assert.deepEqual(m.readFallback(f.storage, parse, valid), { cards: [] });
  f.storage.setItem(p, '{"future":true}'); assert.throws(() => m.readFallback(f.storage, parse, valid), /future/);
  f.storage.setItem(p, '{"cards":{}}'); f.values.delete(b); assert.throws(() => m.readFallback(f.storage, parse, valid), /invalid/);
});
test('unrecoverable native save blocks defaults and fallback on successive launches', t => {
  const f = fixture(t); fs.writeFileSync(path.join(f.directory, 'state.json'), '{bad');
  assert.throws(() => loadStateFile(f.directory), /No valid native save/);
  assert.throws(() => loadStateFile(f.directory), /No valid native save/);
  assert(fs.readdirSync(path.join(f.directory, 'recovery')).some(n => n.startsWith('state-damaged')));
});
