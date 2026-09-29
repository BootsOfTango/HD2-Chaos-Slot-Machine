'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const refresh = require('../assets/war-refresh');
const war = require('../assets/war-snapshot');
const selection = require('../assets/planet-selection');
const START = Date.parse('2026-09-17T01:00:00Z');
const rows = (id = 7) => [{ id: 100, faction: 'Humans', type: 0,
  planet: { index: id, name: 'Test planet ' + id, currentOwner: 'Terminids', event: null } }];
const bundled = [{ name: 'Bundled planet', faction: 'Automatons', enabled: true }];
const response = data => ({ ok: true, json: async () => data });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
async function flush() { for (let i = 0; i < 30; i++) await Promise.resolve(); }
function clock() {
  let time = START, id = 0;
  const timers = new Map();
  return { now: () => time, timers,
    setTimer: (fn, delay) => { assert(delay >= 0 && delay <= refresh.MAX_TIMER_MS); timers.set(++id, { fn, at: time + delay }); return id; },
    clearTimer: id => timers.delete(id),
    async tick(ms) {
      const end = time + ms; let count = 0;
      for (;;) {
        await flush();
        const next = [...timers].sort((a, b) => a[1].at - b[1].at).find(([, t]) => t.at <= end);
        if (!next) break;
        assert(++count < 200, 'timer loop'); time = next[1].at; timers.delete(next[0]); next[1].fn();
      }
      time = end; await flush();
    },
    jump: ms => { time += ms; },
  };
}
function storage(entries = {}) {
  const values = new Map(Object.entries(entries)), writes = [];
  return { values, writes, getItem: key => values.get(key) ?? null,
    setItem(key, value) { writes.push(key); values.set(key, value); } };
}
function fixture(options = {}) {
  const time = clock(), disk = options.storage || storage(), calls = [];
  const service = refresh.createService({ bundledPlanets: bundled, bundleVersion: 'test-bundle',
    storage: disk, now: time.now, setTimer: time.setTimer, clearTimer: time.clearTimer,
    ...options, fetchImpl: (...args) => { calls.push(args); return (options.fetchImpl || (() => response(rows())))(...args); } });
  return { service, time, disk, calls };
}
const encoded = (id = 8, now = START) => JSON.stringify(war.normalizeCampaigns(rows(id), { now }));
const legacy = JSON.stringify({ updatedAt: new Date(START - 60000).toISOString(), planets: bundled });

test('construction is network/timer free and first offline launch can roll bundled planets immediately', async () => {
  const f = fixture({ online: false });
  assert.equal(f.calls.length, 0); assert.equal(f.time.timers.size, 0);
  assert.equal((await f.service.start()).reason, 'offline');
  assert.equal(f.service.getState().status.state, 'bundled');
  assert.equal(selection.rollPlanet(f.service.getState().snapshot.planets).name, 'Bundled planet');
  await f.time.tick(3600000); assert.equal(f.calls.length, 0); assert.equal(f.disk.writes.length, 0);
  f.service.stop();
});
test('startup requests once with fixed URL, English, no credentials or redirects and stores validated data', async () => {
  const f = fixture(); assert.equal((await f.service.start()).outcome, 'updated');
  assert.equal(f.calls.length, 1);
  const [url, options] = f.calls[0];
  assert.equal(url, refresh.URL); assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error');
  assert.equal(options.headers['Accept-Language'], 'en-US'); assert(options.headers['X-Super-Contact'].endsWith('/HD2-Chaos-Slot-Machine'));
  assert.equal(f.service.getState().status.state, 'fresh'); assert.equal(f.disk.writes[0], refresh.CACHE_KEY);
  assert.equal(war.readCache(JSON.parse(f.disk.getItem(refresh.CACHE_KEY)), { now: START }).status, 'valid');
  assert.equal((await f.service.start()).reason, 'already-started'); f.service.stop();
});
test('periodic refresh is five minutes, with no duplicate timers and no background work after stop', async () => {
  const f = fixture(); await f.service.start();
  assert.equal(f.time.timers.size, 1);
  await f.time.tick(war.FRESH_MS - 1); assert.equal(f.calls.length, 1);
  await f.time.tick(1); assert.equal(f.calls.length, 2);
  f.service.stop(); assert.equal(f.time.timers.size, 0);
  await f.time.tick(war.FRESH_MS * 3); assert.equal(f.calls.length, 2);
});
test('startup/manual/reconnect/resume deduplicate a pending request and return the same promise', async () => {
  const pending = deferred(), f = fixture({ fetchImpl: () => pending.promise });
  const first = f.service.start(); assert.strictEqual(f.service.refresh(), first);
  assert.strictEqual(f.service.start(), first); await flush(); assert.equal(f.calls.length, 1);
  pending.resolve(response(rows())); assert.equal((await first).outcome, 'updated'); f.service.stop();
});
test('manual cooldown applies after every request and cannot be bypassed by repeated start or active changes', async () => {
  const f = fixture(); await f.service.start();
  assert.equal((await f.service.refresh()).reason, 'cooldown');
  f.service.stop(); assert.equal((await f.service.start()).reason, 'cooldown');
  await f.service.setActive(false); assert.equal((await f.service.setActive(true)).reason, 'cooldown');
  await f.time.tick(refresh.COOLDOWN_MS); assert.equal((await f.service.refresh()).outcome, 'updated');
  assert.equal(f.calls.length, 2); f.service.stop();
});
test('inactive periods make no periodic requests; fresh resume skips, stale resume refreshes', async () => {
  const f = fixture(); await f.service.start();
  await f.time.tick(refresh.COOLDOWN_MS); await f.service.setActive(false);
  assert.equal((await f.service.setActive(true)).reason, 'fresh');
  await f.service.setActive(false); await f.time.tick(war.FRESH_MS * 2);
  assert.equal(f.calls.length, 1); assert.equal(f.time.timers.size, 0);
  assert.equal((await f.service.setActive(true)).outcome, 'updated'); assert.equal(f.calls.length, 2); f.service.stop();
});
test('starting inactive waits for activation but an explicit manual request is allowed', async () => {
  const f = fixture({ active: false }); assert.equal((await f.service.start()).reason, 'inactive');
  assert.equal(f.calls.length, 0); assert.equal((await f.service.refresh()).outcome, 'updated');
  assert.equal(f.time.timers.size, 0); f.service.stop();
});
test('offline status is never fresh and stale reconnect requests only when active', async () => {
  const f = fixture(); await f.service.start(); await f.service.setOnline(false);
  assert.equal(f.service.getState().status.state, 'cached');
  await f.service.setActive(false); await f.time.tick(war.FRESH_MS);
  assert.equal((await f.service.setOnline(true)).reason, 'inactive'); assert.equal(f.calls.length, 1);
  await f.service.setActive(true); assert.equal(f.calls.length, 2); f.service.stop();
});
test('malformed/empty responses retain the exact last good snapshot and persisted bytes', async () => {
  for (const bad of [[], null, {}, [{ planet: {} }]]) {
    let next = rows(); const f = fixture({ fetchImpl: () => response(next) }); await f.service.start();
    const before = f.service.getState().snapshot, raw = f.disk.getItem(refresh.CACHE_KEY);
    next = bad; await f.time.tick(refresh.COOLDOWN_MS);
    assert.equal((await f.service.refresh()).reason, 'invalid-snapshot');
    assert.strictEqual(f.service.getState().snapshot, before); assert.equal(f.disk.getItem(refresh.CACHE_KEY), raw);
    assert.equal(f.service.getState().status.state, 'cached'); f.service.stop();
  }
});
test('network failure backs off exponentially, caps at thirty minutes and resets after recovery', async () => {
  let fail = true; const f = fixture({ fetchImpl: () => { if (fail) throw Error('private detail'); return response(rows()); } });
  await f.service.start();
  for (let n = 1; n <= 8; n++) {
    const state = f.service.getState(); assert.equal(state.lastError, 'network-error');
    const expected = Math.min(refresh.MAX_BACKOFF_MS, refresh.COOLDOWN_MS * 2 ** (n - 1));
    assert.equal(state.nextAllowedAt - f.time.now(), expected);
    assert.equal((await f.service.refresh()).reason, 'cooldown');
    if (n === 8) fail = false;
    await f.time.tick(expected);
  }
  assert.equal(f.service.getState().failures, 0); assert.equal(f.service.getState().lastError, null); f.service.stop();
});
test('Retry-After seconds and HTTP dates delay timer/manual/reconnect requests beyond normal backoff', async () => {
  for (const value of ['600', new Date(START + 600000).toUTCString()]) {
    let fail = true; const f = fixture({ fetchImpl: () => fail ? { ok: false, status: 429, headers: { get: () => value } } : response(rows()) });
    await f.service.start(); assert.equal(f.service.getState().nextAllowedAt, START + 600000);
    await f.service.setOnline(false); await f.time.tick(599999);
    assert.equal((await f.service.setOnline(true)).reason, 'cooldown'); assert.equal(f.calls.length, 1);
    fail = false; await f.time.tick(1); assert.equal(f.calls.length, 2); f.service.stop();
  }
});
test('Retry-After parsing rejects malformed delays and huge delays never overflow timer scheduling', async () => {
  for (const value of [null, '-2', 'NaN', '1.5', '2026-09-17T01:00:00Z', 'garbage']) assert.equal(refresh.retryAfter(value, START), 0);
  assert.equal(refresh.retryAfter('0', START), 0);
  const f = fixture({ fetchImpl: () => ({ ok: false, status: 503, headers: { get: () => '999999999999999999999' } }) });
  await f.service.start(); assert.equal([...f.time.timers.values()][0].at - START, refresh.MAX_TIMER_MS);
  await f.time.tick(refresh.MAX_TIMER_MS); assert.equal(f.calls.length, 1); f.service.stop();
});
test('timeout aborts a hung fetch and even a transport ignoring abort cannot later update the cache', async () => {
  const pending = deferred(), f = fixture({ fetchImpl: () => pending.promise });
  const task = f.service.start(); await flush(); const before = f.service.getState().snapshot;
  await f.time.tick(refresh.TIMEOUT_MS); assert.equal((await task).reason, 'timeout');
  assert.equal(f.calls[0][1].signal.aborted, true);
  pending.resolve(response(rows())); await flush();
  assert.strictEqual(f.service.getState().snapshot, before); assert.equal(f.disk.writes.length, 0); f.service.stop();
});
test('timeout covers body decoding too and malformed JSON becomes a safe failure', async () => {
  const body = deferred(), f = fixture({ fetchImpl: () => ({ ok: true, json: () => body.promise }) });
  const task = f.service.start(); await flush(); await f.time.tick(refresh.TIMEOUT_MS);
  assert.equal((await task).reason, 'timeout'); f.service.stop(); body.reject(Error('body error')); await flush();
  const g = fixture({ fetchImpl: () => ({ ok: true, json: async () => { throw SyntaxError('bad JSON'); } }) });
  assert.equal((await g.service.start()).outcome, 'failed'); g.service.stop();
});
test('stop cancels pending work, clears timers and rejects no promises even after a late response', async () => {
  const pending = deferred(), f = fixture({ fetchImpl: () => pending.promise });
  const task = f.service.start(); await flush(); f.service.stop();
  assert.equal((await task).outcome, 'cancelled'); assert.equal(f.time.timers.size, 0);
  pending.resolve(response(rows())); await flush(); assert.equal(f.disk.writes.length, 0);
  assert.equal((await f.service.refresh()).reason, 'stopped');
});
test('stop before the fetch microtask prevents network use and restart is not overwritten by cancelled work', async () => {
  const f = fixture(); const task = f.service.start(); f.service.stop();
  assert.equal((await task).outcome, 'cancelled'); assert.equal(f.calls.length, 0);
  await f.time.tick(refresh.COOLDOWN_MS); await f.service.start(); assert.equal(f.calls.length, 1); f.service.stop();
});
test('disconnect cancels in-flight updates without counting as API failure, then stale reconnect recovers', async () => {
  const pending = deferred(); let transport = () => pending.promise;
  const f = fixture({ fetchImpl: (...args) => transport(...args) }); const task = f.service.start(); await flush();
  await f.service.setOnline(false); assert.equal((await task).outcome, 'cancelled');
  assert.equal(f.service.getState().failures, 0); pending.resolve(response(rows(5))); await flush();
  transport = () => response(rows(9)); await f.time.tick(refresh.COOLDOWN_MS);
  await f.service.setOnline(true); assert.equal(f.service.getState().snapshot.planets[0].id, 9); f.service.stop();
});
test('valid current cache takes priority over legacy and is labeled cached across service restarts', async () => {
  const disk = storage({ [refresh.CACHE_KEY]: encoded(8), [refresh.LEGACY_KEY]: legacy });
  const f = fixture({ storage: disk, online: false }); assert.equal(f.service.getState().snapshot.planets[0].id, 8);
  assert.equal(f.service.getState().status.state, 'cached'); assert.equal(disk.writes.length, 0);
  await f.service.start(); await f.service.setOnline(true); f.service.stop();
  const g = fixture({ storage: disk, online: false }); assert.equal(g.service.getState().snapshot.planets[0].id, 7);
  assert.equal(g.service.getState().status.state, 'cached'); assert.equal(disk.getItem(refresh.LEGACY_KEY), legacy);
});
test('legacy migration copies to the new key without altering original bytes or disabled choices', () => {
  const raw = JSON.stringify({ updatedAt: new Date(START).toISOString(), planets: [{ ...bundled[0], enabled: false }] });
  const disk = storage({ [refresh.LEGACY_KEY]: raw }), f = fixture({ storage: disk });
  assert.equal(f.service.getState().snapshot.planets[0].enabled, false);
  assert.deepEqual(disk.writes, [refresh.CACHE_KEY]); assert.equal(disk.getItem(refresh.LEGACY_KEY), raw);
  assert.equal(war.readCache(JSON.parse(disk.getItem(refresh.CACHE_KEY)), { now: START }).status, 'valid');
});
test('damaged, future-schema, future-dated and oversized primary caches remain untouched through refresh', async () => {
  for (const raw of ['{broken', JSON.stringify({ schemaVersion: 99 }), encoded(9, START + 3600000), 'x'.repeat(4 * 1024 * 1024 + 1)]) {
    const disk = storage({ [refresh.CACHE_KEY]: raw, [refresh.LEGACY_KEY]: legacy });
    const f = fixture({ storage: disk }); assert.equal(f.service.getState().snapshot.origin, 'legacy-cache');
    assert(f.service.getState().cacheWarning.includes('preserved'));
    assert.equal((await f.service.start()).outcome, 'updated');
    assert.equal(disk.getItem(refresh.CACHE_KEY), raw); assert.equal(disk.writes.length, 0); f.service.stop();
  }
});
test('an externally changed primary cache is not overwritten by a running service', async () => {
  const f = fixture(); await f.service.start();
  f.disk.values.set(refresh.CACHE_KEY, JSON.stringify({ schemaVersion: 99 }));
  await f.time.tick(refresh.COOLDOWN_MS); await f.service.refresh();
  assert.equal(f.service.getState().cacheWarning, 'cache-changed-preserved');
  assert.deepEqual(JSON.parse(f.disk.getItem(refresh.CACHE_KEY)), { schemaVersion: 99 }); f.service.stop();
});
test('read/write storage failures and unavailable storage never prevent in-memory success or rolling', async () => {
  for (const disk of [null, { getItem() { throw Error('denied'); } }, { getItem: () => null, setItem() { throw Error('quota'); } }]) {
    const f = fixture({ storage: disk }); assert.equal((await f.service.start()).outcome, 'updated');
    assert.equal(selection.rollPlanet(f.service.getState().snapshot.planets).id, 7);
    assert(f.service.getState().cacheWarning); f.service.stop();
  }
});
test('immutable old snapshots survive refresh, listener exceptions cannot break it, unsubscribe works', async () => {
  let id = 7, notifications = 0; const f = fixture({ fetchImpl: () => response(rows(id++)) });
  const unsubscribe = f.service.subscribe(() => { notifications++; throw Error('view failed'); });
  await f.service.start(); const old = f.service.getState().snapshot; const oldBytes = JSON.stringify(old);
  unsubscribe(); const count = notifications;
  await f.time.tick(war.FRESH_MS); assert.equal(notifications, count);
  assert.equal(JSON.stringify(old), oldBytes); assert.equal(f.service.getState().snapshot.planets[0].id, 8);
  assert(Object.isFrozen(old.planets[0])); assert(Object.isFrozen(f.service.getState())); f.service.stop();
});
test('reentrant refresh subscriber sees the already established in-flight request', async () => {
  const f = fixture(); let same;
  f.service.subscribe(state => { if (state.refreshing) same = f.service.refresh(); });
  const task = f.service.start(); assert.strictEqual(same, task); await task;
  assert.equal(f.calls.length, 1); f.service.stop();
});
test('clock advance during suspended timers triggers stale resume without duplicate requests', async () => {
  const f = fixture(); await f.service.start(); await f.service.setActive(false);
  f.time.jump(war.FRESH_MS * 10); await f.service.setActive(true);
  assert.equal(f.calls.length, 2); assert.equal(f.time.timers.size, 1); f.service.stop();
});
test('browser module loads without auto-start and renderer includes it in dependency order', () => {
  const context = vm.createContext({});
  for (const name of ['planet-selection', 'war-snapshot', 'war-refresh']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/' + name + '.js'), 'utf8'), context);
  }
  assert.equal(typeof context.HD2WarRefresh.createService, 'function');
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert(html.indexOf('src="assets/war-snapshot.js"') < html.indexOf('src="assets/war-refresh.js"'));
  assert(html.includes('src="assets/war-refresh.js"'));
});
