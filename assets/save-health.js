(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HD2CSMSaveHealth = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Track acknowledgements, not optimistic UI changes. Dispatch immediately so
  // the renderer's IPC ordering stays unchanged; capture each payload first.
  function create({ write, notify = () => {} }) {
    const pending = new Set();
    let blocked = false, error = '', sequence = 0, lastOutcome = 0;
    const status = () => ({ blocked, error, pending: pending.size });
    const publish = () => notify(status());
    function block(reason) { blocked = true; error = String(reason || 'The existing save could not be loaded.'); publish(); }
    function save(data) {
      if (blocked) { publish(); return Promise.resolve(false); }
      const id = ++sequence;
      let operation;
      try { operation = Promise.resolve(write(JSON.parse(JSON.stringify(data)))); }
      catch (failure) { operation = Promise.reject(failure); }
      const tracked = operation.then(result => {
        if (result?.ok !== true) throw new Error(result?.error || 'Save was not acknowledged.');
        if (id >= lastOutcome) { lastOutcome = id; error = ''; }
        return true;
      }).catch(failure => {
        if (id >= lastOutcome) { lastOutcome = id; error = String(failure?.message || failure); }
        return false;
      }).finally(() => { pending.delete(tracked); publish(); });
      pending.add(tracked); publish(); return tracked;
    }
    async function flush() { while (pending.size) await Promise.all([...pending]); return !blocked && !error; }
    return Object.freeze({ save, block, status, flush });
  }
  return Object.freeze({ create });
});
