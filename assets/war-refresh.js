// M3 service: the renderer explicitly supplies storage and lifecycle signals.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./war-snapshot'));
  else root.HD2WarRefresh = factory(root.HD2WarSnapshot);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (war) {
  'use strict';
  if (!war) throw new Error('Load war-snapshot before war-refresh');
  const URL = 'https://api.helldivers2.dev/api/v1/campaigns';
  const CACHE_KEY = 'hd2csm_war_snapshot_v1', LEGACY_KEY = 'hd2_live_planets_cache_v1';
  const COOLDOWN_MS = 30000, TIMEOUT_MS = 10000, MAX_BACKOFF_MS = 30 * 60000;
  const MAX_CACHE_CHARS = 4 * 1024 * 1024, MAX_TIMER_MS = 2147483647;

  function decode(raw, now) {
    if (raw === null) return { status: 'missing', snapshot: null };
    if (typeof raw !== 'string' || raw.length > MAX_CACHE_CHARS) return { status: 'invalid', snapshot: null };
    try { return war.readCache(JSON.parse(raw), { now }); }
    catch (_) { return { status: 'invalid', snapshot: null }; }
  }
  // Synchronous localStorage-shaped adapter. Never deletes or changes the legacy
  // key. Unreadable, damaged, future-version or externally changed primary data
  // blocks writes for this instance, while in-memory refresh remains available.
  function createCache(storage, now) {
    let expected = null, writable = false, warning = storage ? null : 'memory-only';
    let initial = null;
    if (storage) {
      try {
        expected = storage.getItem(CACHE_KEY);
        const current = decode(expected, now());
        writable = ['missing', 'valid', 'legacy'].includes(current.status);
        if (!writable) warning = 'cache-' + current.status + '-preserved';
        initial = current.snapshot;
        if (!initial) initial = decode(storage.getItem(LEGACY_KEY), now()).snapshot;
      } catch (_) { writable = false; warning = 'cache-read-failed'; }
    }
    function save(snapshot) {
      if (!writable) return false;
      try {
        if (storage.getItem(CACHE_KEY) !== expected) {
          writable = false; warning = 'cache-changed-preserved'; return false;
        }
        const raw = JSON.stringify(snapshot);
        if (raw.length > MAX_CACHE_CHARS) { warning = 'cache-too-large'; return false; }
        storage.setItem(CACHE_KEY, raw);
        expected = raw; warning = null; return true;
      } catch (_) { warning = 'cache-write-failed'; return false; }
    }
    if (expected === null && initial) save(initial);
    return { initial, save, warning: () => warning };
  }
  function retryAfter(value, now) {
    if (typeof value !== 'string' || value.length > 128) return 0;
    const v = value.trim();
    if (/^\d+$/.test(v)) {
      const ms = Number(v) * 1000;
      // Oversized valid delays must not wrap the timer or trigger a fast retry.
      return Math.min(ms, Number.MAX_SAFE_INTEGER - now);
    }
    // HTTP dates contain a weekday/month, not a bare integer or ISO timestamp.
    if (!/[A-Za-z]{3}/.test(v) || !/GMT$/.test(v)) return 0;
    const date = Date.parse(v);
    return Number.isFinite(date) ? Math.max(0, date - now) : 0;
  }
  function createService(options) {
    const { bundledPlanets, bundleVersion, storage = null, fetchImpl = globalThis.fetch,
      now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout } = options;
    if (typeof fetchImpl !== 'function') throw new TypeError('A fetch implementation is required');
    const cache = createCache(storage, now);
    let snapshot = cache.initial || war.bundledSnapshot(bundledPlanets, bundleVersion);
    let running = false, active = options.active !== false, online = options.online !== false;
    let timer = null, job = null, nextDue = 0, nextAllowed = 0, failures = 0, lastError = null;
    const listeners = new Set();
    function getState() {
      return Object.freeze({ snapshot, running, active, online, refreshing: job !== null,
        nextRefreshAt: running && active && online ? Math.max(nextDue, nextAllowed) : null,
        nextAllowedAt: nextAllowed, failures, lastError, cacheWarning: cache.warning(),
        status: Object.freeze(war.snapshotStatus(snapshot, { now: now(), online, refreshFailed: lastError !== null })) });
    }
    function emit() {
      const state = getState();
      for (const listener of [...listeners]) {
        try { listener(state); } catch (_) { /* A view cannot break refresh/cache. */ }
      }
    }
    function clearScheduled() { if (timer !== null) clearTimer(timer); timer = null; }
    function schedule() {
      clearScheduled();
      if (!running || !active || !online || job) return;
      const delay = Math.min(MAX_TIMER_MS, Math.max(0, Math.max(nextDue, nextAllowed) - now()));
      timer = setTimer(() => { timer = null; void refresh('timer'); }, delay);
    }
    function skip(reason) { return Promise.resolve({ outcome: 'skipped', reason }); }
    function refresh(reason = 'manual') {
      if (!running) return skip('stopped');
      if (!online) return skip('offline');
      if (job) return job.promise;
      if (!active && reason !== 'manual') return skip('inactive');
      if (now() < nextAllowed) { schedule(); return skip('cooldown'); }
      if (!['manual', 'startup'].includes(reason) && now() < nextDue &&
          war.snapshotStatus(snapshot, { now: now(), online, refreshFailed: lastError !== null }).state === 'fresh') {
        schedule(); return skip('fresh');
      }
      clearScheduled();
      const current = { controller: new AbortController(), timeout: null, cancel: null, promise: null };
      job = current;
      nextAllowed = now() + COOLDOWN_MS;
      // Establish deduplication before calling fetch or notifying subscribers.
      current.promise = Promise.resolve().then(async () => {
        if (job !== current) return { outcome: 'cancelled' };
        const interruption = new Promise((_, reject) => {
          current.cancel = () => { reject(new Error('cancelled')); current.controller.abort(); };
          current.timeout = setTimer(() => { reject(new Error('timeout')); current.controller.abort(); }, TIMEOUT_MS);
        });
        try {
          const data = await Promise.race([interruption, (async () => {
            const response = await fetchImpl(URL, { method: 'GET', signal: current.controller.signal,
              credentials: 'omit', redirect: 'error', cache: 'no-store', headers: {
                Accept: 'application/json', 'Accept-Language': 'en-US',
                'X-Super-Client': 'HD2-Chaos-Slot-Machine',
                'X-Super-Contact': 'https://github.com/BootsOfTango/HD2-Chaos-Slot-Machine',
              } });
            if (!response.ok) {
              const error = new Error('http-' + response.status);
              error.retryMs = retryAfter(response.headers?.get('Retry-After'), now());
              throw error;
            }
            return await response.json();
          })()]);
          if (job !== current) return { outcome: 'cancelled' };
          const result = war.updateSnapshot(snapshot, data, { now: now() });
          if (!result.accepted) throw new Error('invalid-snapshot');
          snapshot = result.snapshot;
          failures = 0; lastError = null; nextDue = now() + war.FRESH_MS;
          cache.save(snapshot);
          return { outcome: 'updated' };
        } catch (error) {
          if (job !== current) return { outcome: 'cancelled' };
          failures = Math.min(failures + 1, 32);
          lastError = /^(timeout|invalid-snapshot|http-\d{3})$/.test(error?.message) ? error.message : 'network-error';
          const delay = Math.max(Math.min(MAX_BACKOFF_MS, COOLDOWN_MS * 2 ** (failures - 1)), error?.retryMs || 0);
          nextAllowed = Math.max(nextAllowed, now() + delay); nextDue = nextAllowed;
          return { outcome: 'failed', reason: lastError };
        } finally {
          if (current.timeout !== null) clearTimer(current.timeout);
          // Also close unconsumed error bodies; do not leave connections running
          // after an HTTP rejection or a timeout in an injected transport.
          current.controller.abort();
          if (job === current) { job = null; schedule(); emit(); }
        }
      });
      emit();
      return current.promise;
    }
    function cancel() {
      const old = job; job = null;
      if (old) {
        if (old.timeout !== null) clearTimer(old.timeout);
        if (old.cancel) old.cancel(); else old.controller.abort();
      }
    }
    function start() {
      if (running) return job ? job.promise : skip('already-started');
      running = true;
      const result = refresh('startup'); schedule(); emit(); return result;
    }
    function stop() { running = false; clearScheduled(); cancel(); emit(); }
    function setActive(value) {
      if (typeof value !== 'boolean') throw new TypeError('Active must be boolean');
      const changed = active !== value; active = value;
      schedule(); emit(); return changed && active ? refresh('resume') : skip('unchanged');
    }
    function setOnline(value) {
      if (typeof value !== 'boolean') throw new TypeError('Online must be boolean');
      const changed = online !== value; online = value;
      if (!online) cancel();
      schedule(); emit(); return changed && online ? refresh('reconnect') : skip('unchanged');
    }
    function subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('Listener must be a function');
      listeners.add(listener); return () => listeners.delete(listener);
    }
    return Object.freeze({ start, stop, refresh, setActive, setOnline, getState, subscribe });
  }
  return { URL, CACHE_KEY, LEGACY_KEY, COOLDOWN_MS, TIMEOUT_MS, MAX_BACKOFF_MS, MAX_TIMER_MS,
    createService, retryAfter };
});
