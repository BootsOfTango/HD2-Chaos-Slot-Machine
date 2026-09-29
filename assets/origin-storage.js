/* Copy-only origin migration; a durable main-process journal precedes writes. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HD2OriginStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MARKER = 'hd2_origin_copy_v1';
  const MAX_VALUE_BYTES = 32 * 1024 * 1024, MAX_TOTAL_BYTES = 64 * 1024 * 1024;
  const SAVE_KEYS = ['hd2_chaos_slot_machine', 'hd2_chaos_roulette'].flatMap(prefix =>
    ['_v1', '_backup_v1', '_before_import_v1', '_corrupt_v1', '_locked_stats_audit_v1'].map(suffix => prefix + suffix));
  const KEYS = Object.freeze([...SAVE_KEYS, 'hd2_backup_warning_seen_v1', 'hd2_live_planets_cache_v1',
    'hd2_items_view_mode', 'hd2_items_type_filter', 'hd2_armory_expanded_groups_v1']);
  const OWN = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  function validateSnapshot(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw Error('Invalid origin snapshot');
    let bytes = 0;
    for (const key of Object.keys(value)) {
      if (!KEYS.includes(key) || typeof value[key] !== 'string') throw Error('Unexpected origin key/value');
      const size = new TextEncoder().encode(value[key]).length;
      bytes += size;
      if (size > MAX_VALUE_BYTES || bytes > MAX_TOTAL_BYTES) throw Error('Origin snapshot exceeds safe copy limits');
    }
    return value;
  }
  function snapshot(storage) {
    const result = Object.create(null);
    for (const key of KEYS) {
      const value = storage.getItem(key);
      if (value !== null) result[key] = value;
    }
    return validateSnapshot(result);
  }
  function copyMissing(storage, source) {
    validateSnapshot(source);
    const marker = storage.getItem(MARKER);
    if (marker === '1') return { copied: [], reason: 'already-migrated' };
    if (marker !== null) throw Error('Unrecognized origin migration marker; existing storage preserved');
    const before = snapshot(storage);
    // Any existing destination save-family data belongs to the user, even when
    // damaged. Do not introduce an older primary above a newer destination backup.
    const destinationHasSave = SAVE_KEYS.some(key => OWN(before, key));
    const planned = KEYS.filter(key => OWN(source, key) && !OWN(before, key)
      && !(destinationHasSave && SAVE_KEYS.includes(key)));
    const written = [];
    try {
      for (const key of planned) {
        if (storage.getItem(key) !== null) throw Error('Origin storage changed during copy');
        storage.setItem(key, source[key]); written.push(key);
      }
      storage.setItem(MARKER, '1');
      return { copied: written, reason: 'copied-missing', destinationHasSave };
    } catch (error) {
      let rollbackFailed = false;
      for (const key of written.reverse()) {
        try { if (storage.getItem(key) === source[key]) storage.removeItem(key); }
        catch { rollbackFailed = true; }
      }
      const failure = new Error(rollbackFailed
        ? 'Origin copy failed and rollback is incomplete; stop startup and preserve recovery snapshot'
        : 'Origin copy failed; copied keys rolled back and original data preserved');
      failure.code = rollbackFailed ? 'ORIGIN_ROLLBACK_INCOMPLETE' : 'ORIGIN_COPY_FAILED';
      throw failure;
    }
  }
  function makePlan(source, before) {
    validateSnapshot(source); validateSnapshot(before);
    const destinationHasSave = SAVE_KEYS.some(key => OWN(before, key));
    const writes = Object.create(null);
    for (const key of KEYS) if (OWN(source, key) && !OWN(before, key) &&
      !(destinationHasSave && SAVE_KEYS.includes(key))) writes[key] = source[key];
    return writes;
  }
  function resumePlan(storage, writes) {
    validateSnapshot(writes);
    const marker = storage.getItem(MARKER);
    if (marker === '1') return { reason: 'already-migrated' };
    if (marker !== null) throw Error('Unrecognized origin migration marker');
    // Validate the entire pending plan before resuming an interrupted copy.
    for (const key of Object.keys(writes)) {
      const current = storage.getItem(key);
      if (current !== null && current !== writes[key]) throw Error('Origin recovery conflicts with existing data; startup stopped');
    }
    for (const key of Object.keys(writes)) if (storage.getItem(key) === null) storage.setItem(key, writes[key]);
    storage.setItem(MARKER, '1');
    return { reason: 'completed', copied: Object.keys(writes) };
  }
  function readFallback(storage, parse, validate) {
    const current = 'hd2_chaos_slot_machine', legacy = 'hd2_chaos_roulette';
    const hasFamily = prefix => SAVE_KEYS.filter(key => key.startsWith(prefix)).some(key => storage.getItem(key) !== null);
    const prefix = hasFamily(current) ? current : hasFamily(legacy) ? legacy : null;
    if (!prefix) return null;
    let failure;
    for (const suffix of ['_v1', '_backup_v1']) {
      const raw = storage.getItem(prefix + suffix);
      if (raw === null) continue;
      try { const data = parse(raw); validate(data); return data; }
      catch (error) { if (error.code === 'UNSUPPORTED_SAVE_VERSION') throw error; failure = error; }
    }
    throw failure || Error('Only recovery data remains. Restore a valid save before continuing.');
  }
  return Object.freeze({ MARKER, KEYS, MAX_VALUE_BYTES, MAX_TOTAL_BYTES, validateSnapshot, snapshot, copyMissing, makePlan, resumePlan, readFallback });
});
