const test = require('node:test');
const assert = require('node:assert/strict');
const { create } = require('../assets/save-health');

test('save tracker reports pending until actual acknowledgement and captures a snapshot', async () => {
  let resolve, written; const notices = [];
  const health = create({ write: value => { written = value; return new Promise(r => { resolve = r; }); }, notify: value => notices.push(value) });
  const payload = { cards: [{ id: 'original' }] }, operation = health.save(payload); payload.cards[0].id = 'edited';
  assert.equal(written.cards[0].id, 'original'); assert.equal(health.status().pending, 1);
  resolve({ ok: true }); assert(await operation); assert(await health.flush());
  assert.deepEqual(notices.at(-1), { pending: 0, blocked: false, error: '' });
});
test('async and synchronous save failures stay visible until a successful retry', async () => {
  let mode = 'sync'; const health = create({ write: () => {
    if (mode === 'sync') throw new Error('disk full');
    if (mode === 'async') return Promise.reject(new Error('disk denied'));
    return { ok: true };
  } });
  assert.equal(await health.save({}), false); assert.equal(health.status().error, 'disk full');
  mode = 'async'; assert.equal(await health.save({}), false); assert.equal(await health.flush(), false);
  mode = 'ok'; assert(await health.save({})); assert.equal(health.status().error, '');
});
test('a blocked load never writes defaults or subsequent changes', async () => {
  let writes = 0; const health = create({ write: () => { writes++; } });
  health.block('newer format'); assert.equal(await health.save({ cards: [] }), false);
  assert.equal(await health.flush(), false); assert.equal(writes, 0);
  assert.deepEqual(health.status(), { blocked: true, error: 'newer format', pending: 0 });
});
test('out-of-order acknowledgements cannot hide a newer failure', async () => {
  const callbacks = []; const health = create({ write: () => new Promise((resolve, reject) => callbacks.push({ resolve, reject })) });
  const old = health.save({ cards: [1] }), latest = health.save({ cards: [1, 2] });
  callbacks[1].reject(new Error('latest failed')); await latest;
  callbacks[0].resolve({ ok: true }); await old;
  assert.equal(health.status().error, 'latest failed'); assert.equal(await health.flush(), false);
});
test('explicit unsuccessful acknowledgement is never reported as saved', async () => {
  const health = create({ write: () => ({ ok: false, error: 'read only' }) });
  assert.equal(await health.save({}), false); assert.equal(health.status().error, 'read only');
});
