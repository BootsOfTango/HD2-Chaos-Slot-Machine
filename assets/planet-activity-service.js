// Display metadata only. The caller owns lifecycle/refresh signals; no polling on construction.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./planet-activity'), require('./war-refresh'));
  else root.HD2ActivityService = factory(root.HD2PlanetActivity, root.HD2WarRefresh);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (map, refreshPolicy) {
  'use strict';
  const URL = 'https://api.helldivers2.dev/raw/api/WarSeason/current/WarID', CACHE_KEY = 'hd2csm_planet_activity_v1';
  const MAX_BYTES = 4 * 1024 * 1024, FRESH_MS = 300000, COOLDOWN_MS = 30000, TIMEOUT_MS = 10000;
  function decode(raw, now) {
    if (raw === null) return { status: 'missing', snapshot: null };
    if (typeof raw !== 'string' || raw.length > MAX_BYTES) return { status: 'invalid', snapshot: null };
    try {
      const value = JSON.parse(raw);
      if (value && typeof value.version === 'number' && value.version > 1) return { status: 'unsupported', snapshot: null };
      return { status: 'valid', snapshot: map.validateSnapshot(value, { now }) };
    } catch (_) { return { status: 'invalid', snapshot: null }; }
  }
  async function readBody(response) {
    const length = response.headers?.get('Content-Length');
    if (length && /^\d+$/.test(length) && Number(length) > MAX_BYTES) throw Error('response-too-large');
    if (!response.body?.getReader) throw Error('invalid-response');
    const reader = response.body.getReader(), decoder = new TextDecoder('utf-8', { fatal: true });
    let bytes = 0, text = '';
    try {
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        bytes += value.byteLength; if (bytes > MAX_BYTES) throw Error('response-too-large');
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
      return JSON.parse(text);
    } finally { try { await reader.cancel(); } catch (_) {} reader.releaseLock(); }
  }
  function createService({ storage = null, fetchImpl = globalThis.fetch,
    now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout, online: initialOnline = true } = {}) {
    if (typeof fetchImpl !== 'function' || typeof initialOnline !== 'boolean') throw new TypeError('Invalid snapshot service options');
    let snapshot=null,source='unavailable',expected=null,writable=false,warning=storage?null:'memory-only',lastCheckedAt=null;
    try{
      if(storage){
        expected=storage.getItem(CACHE_KEY);const decoded=decode(expected,now());
        writable=['missing','valid'].includes(decoded.status);
        if(!writable)warning='cache-'+decoded.status+'-preserved';
        if(decoded.snapshot){snapshot=decoded.snapshot;source='cache';}
      }
    }catch(_){warning='cache-read-failed';}
    let online = initialOnline, disposed = false, job = null, nextAllowedAt = 0, failures = 0, lastError = null;
    let running = false, active = true, scheduled = null, nextDue = 0;
    const listeners = new Set();
    function getState() {
      const age = snapshot ? now() - Date.parse(snapshot.fetchedAt) : Infinity;
      return Object.freeze({ snapshot, source, online, disposed, running, active, refreshing: !!job, nextAllowedAt, failures, lastError,
        nextRefreshAt:running && active && online ? Math.max(nextDue,nextAllowedAt) : null,
        cacheWarning: warning, lastCheckedAt, stale: source!=='network' || !online || lastError !== null || age < 0 || age >= FRESH_MS,
        observedAt: snapshot?.fetchedAt || null, confirmedCurrentlyPlayable: false });
    }
    function emit() { for (const listener of [...listeners]) { try { listener(getState()); } catch (_) {} } }
    function clearScheduled() { if (scheduled !== null) clearTimer(scheduled); scheduled = null; }
    function schedule() {
      clearScheduled(); if (!running || !active || !online || disposed || job) return;
      scheduled = setTimer(()=>{scheduled=null;void refresh('background');},Math.min(2147483647,Math.max(0,Math.max(nextDue,nextAllowedAt)-now())));
    }
    function save(value) {
      if (!writable) return;
      try {
        if (storage.getItem(CACHE_KEY) !== expected) { writable = false; warning = 'cache-changed-preserved'; return; }
        const raw = JSON.stringify(value);
        if (raw.length > MAX_BYTES) { warning = 'cache-too-large'; return; }
        storage.setItem(CACHE_KEY, raw); expected = raw; warning = null;
      } catch (_) { warning = 'cache-write-failed'; }
    }
    function refresh(reason = 'manual') {
      if (!['manual','startup','background','resume','reconnect'].includes(reason)) throw new TypeError('Invalid snapshot refresh reason');
      const skip = why => Promise.resolve({ outcome: 'skipped', reason: why });
      if (disposed) return skip('disposed');
      if (!online) return skip('offline');
      if (job) return job.promise;
      if (running && !active && reason !== 'manual') return skip('inactive');
      if (now() < nextAllowedAt) { schedule(); return skip('cooldown'); }
      if (!['manual','startup'].includes(reason) && !getState().stale) {
        nextDue = Math.max(now()+1,Date.parse(snapshot.fetchedAt)+FRESH_MS); schedule(); return skip('recent');
      }
      clearScheduled();
      const requestAt = now(), current = { controller: new AbortController(), timer: null, cancel: null, promise: null };
      job = current; nextAllowedAt = requestAt + COOLDOWN_MS;
      current.promise = Promise.resolve().then(async () => {
        if (job !== current) return { outcome: 'cancelled' };
        const interruption = new Promise((_, reject) => {
          current.cancel = () => { reject(Error('cancelled')); current.controller.abort(); };
          current.timer = setTimer(() => { reject(Error('timeout')); current.controller.abort(); }, TIMEOUT_MS);
        });
        try {
          const raw = await Promise.race([interruption, (async () => {
            async function get(url){
              if(current.controller.signal.aborted)throw Error('cancelled');
              const response=await fetchImpl(url,{method:'GET',credentials:'omit',redirect:'error',cache:'no-store',
                signal:current.controller.signal,headers:{Accept:'application/json','Accept-Language':'en-US',
                  'X-Super-Client':'HD2-Chaos-Slot-Machine','X-Super-Contact':'https://github.com/BootsOfTango/Helldivers-2-Roulette'}});
              if(!response.ok){const error=Error('http-'+response.status);error.retryMs=refreshPolicy.retryAfter(response.headers?.get('Retry-After'),now());throw error;}
              return readBody(response);
            }
            const war=await get(URL);
            if(!Number.isSafeInteger(war?.id)||war.id<0)throw Error('invalid-war');
            if(job!==current)throw Error('cancelled');
            // Never apply cached activity from a different war to current planet IDs.
            if(snapshot&&snapshot.warId!==war.id){snapshot=null;source='unavailable';emit();}
            const status=await get('https://api.helldivers2.dev/raw/api/WarSeason/'+war.id+'/Status');
            return {warId:war.id,status};
          })()]);
          if(job!==current)return {outcome:'cancelled'};
          let next;
          try{next=map.normalize(raw.status,{expectedWarId:raw.warId,fetchedAt:new Date(requestAt).toISOString()});}
          catch(_){throw Error('invalid-snapshot');}
          if(snapshot&&Date.parse(next.fetchedAt)<Date.parse(snapshot.fetchedAt))throw Error('older-observation');
          const transition=map.compareTicks(snapshot,next);
          if(transition==='regressed')throw Error('regressed-tick');
          // Re-fetching an unchanged counter cannot refresh the age of its report.
          if(transition==='unchanged'){
            if(JSON.stringify(next.effects)!==JSON.stringify(snapshot.effects)||JSON.stringify(next.planetIds)!==JSON.stringify(snapshot.planetIds))throw Error('conflicting-tick');
          }else snapshot=next;
          source='network';lastCheckedAt=new Date(now()).toISOString();failures=0;lastError=null;nextDue=now()+FRESH_MS;save(snapshot);
          return { outcome: 'updated' };
        } catch (error) {
          if (job !== current) return { outcome: 'cancelled' };
          lastError = /^(http-\d{3}|timeout|response-too-large|invalid-response|invalid-snapshot|invalid-war|regressed-tick|conflicting-tick|older-observation)$/.test(error?.message) ? error.message : 'network-error';
          failures = Math.min(32, failures + 1);
          const delay = Math.max(Math.min(1800000, COOLDOWN_MS * 2 ** (failures - 1)), error?.retryMs || 0);
          nextAllowedAt = Math.max(nextAllowedAt, now() + delay);
          nextDue = nextAllowedAt;
          return { outcome: 'failed', reason: lastError };
        } finally {
          if (current.timer !== null) clearTimer(current.timer);
          current.controller.abort();
          if (job === current) { job = null; schedule(); emit(); }
        }
      });
      emit(); return current.promise;
    }
    function cancel() { const old = job; job = null; if (old) { if (old.timer !== null) clearTimer(old.timer); if (old.cancel) old.cancel(); else old.controller.abort(); } }
    function setOnline(value) {
      if (typeof value !== 'boolean') throw new TypeError('Invalid connectivity');
      const changed = online !== value; online = value; if (!online) cancel(); schedule(); emit();
      return changed && online && running && active ? refresh('reconnect') : Promise.resolve({outcome:'skipped',reason:'unchanged'});
    }
    function start() { if (disposed || running) return Promise.resolve({outcome:'skipped',reason:disposed?'disposed':'already-started'}); running=true; const result=refresh('startup');schedule();emit();return result; }
    function stop() { running=false;clearScheduled();cancel();emit(); }
    function setActive(value) { if (typeof value !== 'boolean') throw new TypeError('Invalid active state');const changed=active!==value;active=value;if(!active)cancel();schedule();emit();return changed && active && running ? refresh('resume') : Promise.resolve({outcome:'skipped',reason:'unchanged'}); }
    function dispose() { disposed = true; stop(); listeners.clear(); }
    function subscribe(listener) { if (typeof listener !== 'function') throw new TypeError('Listener required'); listeners.add(listener); return () => listeners.delete(listener); }
    return Object.freeze({ getState, refresh, setOnline, start, stop, setActive, dispose, subscribe });
  }
  return Object.freeze({ URL, CACHE_KEY, MAX_BYTES, FRESH_MS, COOLDOWN_MS, TIMEOUT_MS, decode, createService });
});
